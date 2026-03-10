import crypto from "crypto";
import {
  proto,
  generateWAMessageFromContent,
  generateMessageID,
} from "baileys";

const MEDIA_TYPES = [
  "imageMessage", "videoMessage", "audioMessage",
  "stickerMessage", "documentMessage",
];

const WRAPPER_KEYS = [
  "ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2",
  "viewOnceMessageV2Extension", "documentWithCaptionMessage", "editedMessage",
];

const deepUnwrap = (msg) => {
  let layers  = [];
  let current = msg;
  let depth   = 0;

  while (current && depth < 10) {
    const type = Object.keys(current)[0];
    if (!type) break;
    layers.push({ depth, type, content: current });

    let next = null;
    for (const wk of WRAPPER_KEYS) {
      if (current[wk]?.message) { next = current[wk].message; break; }
    }
    if (!next) break;
    current = next;
    depth++;
  }

  return layers;
};

const safeSerialize = (val, key) => {
  if (Buffer.isBuffer(val))       return { __type: "Buffer",   data: Array.from(val) };
  if (val instanceof Uint8Array)  return { __type: "Uint8Array", data: Array.from(val) };
  if (typeof val === "bigint")    return { __type: "BigInt",   data: val.toString() };
  if (typeof val === "undefined") return null;
  if (typeof val === "function")  return undefined;
  return val;
};

const buildRelayScript = (rawJSON, type, layers) => {
  const timestamp  = new Date().toISOString().replace(/[:.]/g, "-");
  const scriptName = `relay_${type}_${timestamp}`;
  const layerInfo  = layers.map((l, i) => `  Layer ${i}: ${l.type}`).join("\n");

  return (
    `import crypto from "crypto";\n` +
    `import { proto, generateWAMessageFromContent, generateMessageID } from "baileys";\n\n` +
    `const restoreValue = (val) => {\n` +
    `  if (!val || typeof val !== "object") return val;\n` +
    `  if (val.__type === "Buffer")   return Buffer.from(val.data);\n` +
    `  if (val.__type === "Uint8Array") return new Uint8Array(val.data);\n` +
    `  if (val.__type === "BigInt")   return BigInt(val.data);\n` +
    `  if (Array.isArray(val))        return val.map(restoreValue);\n` +
    `  const out = {};\n` +
    `  for (const k in val) out[k] = restoreValue(val[k]);\n` +
    `  return out;\n` +
    `};\n\n` +
    `/*\n` +
    ` * Generated: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n` +
    ` * Type: ${type}\n` +
    ` * Layers:\n${layerInfo}\n` +
    ` */\n\n` +
    `const RAW_CONTENT = ${rawJSON};\n\n` +
    `const handler = async (m, { conn }) => {\n` +
    `  try {\n` +
    `    const content = restoreValue(RAW_CONTENT);\n\n` +
    `    const waMsg = generateWAMessageFromContent(\n` +
    `      m.chat,\n` +
    `      proto.Message.fromObject(content),\n` +
    `      { userJid: conn.user?.id, quoted: m.fakeObj || m }\n` +
    `    );\n\n` +
    `    await conn.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });\n` +
    `    await m.react("✅");\n` +
    `  } catch (err) {\n` +
    `    await m.react("❌");\n` +
    `    await m.reply(\`> ❌ Relay failed: \${err.message}\`);\n` +
    `  }\n` +
    `};\n\n` +
    `handler.command     = ["${scriptName}"];\n` +
    `handler.category    = "owner";\n` +
    `handler.owner       = true;\n` +
    `handler.description = "Auto relay - ${type} (${layers.length} layers)";\n\n` +
    `export default handler;\n`
  );
};

const handler = async (m, { conn }) => {
  if (!m.quoted) {
    return m.reply(
      `> ❌ *Reply pesan yang ingin di-extract!*\n>\n` +
      `> 💡 *Fitur:*\n` +
      `> • Extract semua layer pesan\n` +
      `> • Auto detect media, button, interactive\n` +
      `> • Support forwardedNewsletterMessageInfo\n` +
      `> • Support viewOnce, ephemeral, edited\n` +
      `> • Support poll, button, interactive, reaksi\n` +
      `> • Generate relay script ESM\n` +
      `> • Proto-safe reconstruction`
    );
  }

  await m.react("🔍");

  const q = m.quoted;

  const rawMessage = q.fakeObj?.message || q.message;
  if (!rawMessage) {
    await m.react("❌");
    return m.reply("> ❌ Tidak bisa baca raw message dari pesan ini!");
  }

  const layers     = deepUnwrap(rawMessage);
  const finalLayer = layers[layers.length - 1];
  const raw        = finalLayer.content;
  const type       = finalLayer.type;
  const msgContent = raw[type];

  await m.react("⚙️");

  const analysis = {
    totalLayers:   layers.length,
    messageType:   type,
    isMedia:       MEDIA_TYPES.includes(type),
    isViewOnce:    layers.some(l => l.type.includes("viewOnce")),
    isEphemeral:   layers.some(l => l.type === "ephemeralMessage"),
    isEdited:      layers.some(l => l.type === "editedMessage"),
    isPoll:        type === "pollCreationMessage",
    isButton:      type === "buttonsMessage" || type === "buttonsResponseMessage" || type === "templateButtonReplyMessage",
    isInteractive: type === "interactiveMessage" || type === "interactiveResponseMessage",
    isReaction:    type === "reactionMessage",
    isContact:     type === "contactMessage" || type === "contactsArrayMessage",
    isLocation:    type === "locationMessage" || type === "liveLocationMessage",
    hasMentions:   (msgContent?.contextInfo?.mentionedJid?.length ?? 0) > 0,
    hasQuoted:     !!msgContent?.contextInfo?.quotedMessage,
    hasForwarded:  !!msgContent?.contextInfo?.isForwarded,
    hasNewsletter: !!msgContent?.contextInfo?.forwardedNewsletterMessageInfo,
  };

  let relaySuccess = false;
  let relayError   = null;

  try {
    const waMsg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject(raw),
      { userJid: conn.user?.id, quoted: m.fakeObj || m }
    );
    await conn.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });
    relaySuccess = true;
    await m.react("✅");
  } catch (err) {
    relayError = err.message;
    await m.react("⚠️");
  }

  let mediaInfo = null;
  if (analysis.isMedia && msgContent) {
    mediaInfo = {
      mimetype:   msgContent.mimetype   || "unknown",
      fileLength: msgContent.fileLength || 0,
      fileName:   msgContent.fileName   || "unnamed",
      caption:    msgContent.caption    || "",
      width:      msgContent.width      || 0,
      height:     msgContent.height     || 0,
      duration:   msgContent.seconds    || msgContent.duration || 0,
      ptt:        msgContent.ptt        || false,
    };
  }

  let report = `> ✅ *RAW MESSAGE EXTRACTED*\n>\n`;
  report += `> 📊 *Analysis:*\n`;
  report += `> • Type: \`${type}\`\n`;
  report += `> • Layers: ${analysis.totalLayers}\n`;
  report += `> • Media: ${analysis.isMedia ? "✓" : "✗"}\n`;
  report += `> • ViewOnce: ${analysis.isViewOnce ? "✓" : "✗"}\n`;
  report += `> • Ephemeral: ${analysis.isEphemeral ? "✓" : "✗"}\n`;
  report += `> • Edited: ${analysis.isEdited ? "✓" : "✗"}\n`;
  report += `> • Button: ${analysis.isButton ? "✓" : "✗"}\n`;
  report += `> • Interactive: ${analysis.isInteractive ? "✓" : "✗"}\n`;
  report += `> • Newsletter: ${analysis.hasNewsletter ? "✓" : "✗"}\n`;
  report += `> • Mentions: ${analysis.hasMentions ? "✓" : "✗"}\n`;
  report += `> • Quoted: ${analysis.hasQuoted ? "✓" : "✗"}\n`;
  report += `> • Forwarded: ${analysis.hasForwarded ? "✓" : "✗"}\n`;

  if (mediaInfo) {
    report += `>\n> 📁 *Media Info:*\n`;
    report += `> • Mimetype: \`${mediaInfo.mimetype}\`\n`;
    report += `> • Size: ${(mediaInfo.fileLength / 1024).toFixed(2)} KB\n`;
    if (mediaInfo.fileName !== "unnamed") report += `> • File: \`${mediaInfo.fileName}\`\n`;
    if (mediaInfo.caption)               report += `> • Caption: "${mediaInfo.caption.substring(0, 50)}${mediaInfo.caption.length > 50 ? "..." : ""}"\n`;
    if (mediaInfo.width && mediaInfo.height) report += `> • Dimensions: ${mediaInfo.width}x${mediaInfo.height}\n`;
    if (mediaInfo.duration > 0)          report += `> • Duration: ${mediaInfo.duration}s\n`;
  }

  report += `>\n> 🔄 *Relay Status:*\n`;
  report += `> ${relaySuccess ? "✅ Success" : "❌ Failed"}\n`;
  if (relayError) report += `> Error: ${relayError}\n`;

  const rawJSON = JSON.stringify(raw, safeSerialize, 2);
  const script  = buildRelayScript(rawJSON, type, layers);
  const timestamp  = new Date().toISOString().replace(/[:.]/g, "-");
  const scriptName = `relay_${type}_${timestamp}`;

  await conn.sendMessage(
    m.chat,
    {
      document: Buffer.from(script),
      fileName: `${scriptName}.js`,
      mimetype: "application/javascript",
      caption:  report + `>\n> 📄 *Relay script generated*\n> 💡 Reply file ini dengan \`${global.prefix}run\` untuk relay ulang`,
    },
    { quoted: m.fakeObj || m }
  );
};

handler.command     = ["crm"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Extract full raw message + proto relay + generate relay script";

export default handler;
