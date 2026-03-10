/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { generateWAMessageFromContent, proto } from "baileys";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const THUMB_URL  = "https://c.termai.cc/i121/iYXt.jpg";
const THUMB_LIST = [
  "https://c.termai.cc/i197/hylmBwB.jpeg",
  "https://c.termai.cc/i167/KawFG.jpeg",
  "https://c.termai.cc/i101/d3heAiu.jpeg",
];
const AUDIO_PATH = path.join(__dirname, "..", "..", "1", "2", "allmenu.mp3");

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function ucapanWaktu() {
  const hour = Number(new Intl.DateTimeFormat("id-ID", {
    timeZone: global.timezone || "Asia/Jakarta",
    hour: "2-digit", hourCycle: "h23",
  }).format(new Date()));
  if (hour >= 4  && hour < 11) return "Selamat pagi ☀️";
  if (hour >= 11 && hour < 15) return "Selamat siang 🌤️";
  if (hour >= 15 && hour < 18) return "Selamat sore 🏇";
  return "Selamat malam 🌙";
}

function buildAllMenuList(commands, prefix, isOwner = false) {
  const groups = new Map();
  for (const cmd of commands) {
    if (cmd.isOwner && !isOwner) continue;
    const cat = (cmd.category || "main").toLowerCase();
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(cmd.name);
  }

  const lines = [];
  for (const cat of [...groups.keys()].sort()) {
    const cmds = [...new Set(groups.get(cat))].sort();
    lines.push(`⎯⎯⟢ ⚝ *${cat.toUpperCase()}* ⚝ ⟣⎯⎯`);
    lines.push(`│`);
    for (const cmd of cmds) lines.push(`│➞${prefix}${cmd}`);
    lines.push(`│`);
    lines.push(`⟡────────────────⟡`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

let cachedThumb    = null;
let cachedThumbUrl = null;

async function getThumbBuffer(url) {
  if (cachedThumb && cachedThumbUrl === url) return cachedThumb;
  try {
    const { default: fetch } = await import("node-fetch");
    const { default: Jimp  } = await import("jimp");
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const img = await Jimp.read(await res.buffer());
    img.cover(300, 300).quality(60);
    const buf = await img.getBufferAsync(Jimp.MIME_JPEG);
    cachedThumb    = buf;
    cachedThumbUrl = url;
    return buf;
  } catch { return null; }
}

const handler = async (m, { conn, commands }) => {
  await m.react("🐼");

  const prefix         = global.prefix       || ".";
  const ownerNumber    = (global.owner       || "").replace(/[^0-9]/g, "");
  const url            = global.websiteUrl   || "https://www.dyysomnia.shop";
  const groupUrl       = global.groupUrl     || url;
  const newsletterJid  = global.channelJid   || "120363421160571057@newsletter";
  const newsletterName = global.botName      || "Bot";

  const caption     = buildAllMenuList(commands, prefix, m.isOwner);
  const thumbBuffer = await getThumbBuffer(pickRandom(THUMB_LIST));

  // kirim audio jika ada
  if (fs.existsSync(AUDIO_PATH)) {
    try {
      await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(AUDIO_PATH),
        mimetype: "audio/mp4",
        ptt: true,
      }, { quoted: m.fakeObj || m });
    } catch {}
  }

  try {
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 10,
              isForwarded: true,
              forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
              externalAdReply: {
                title: newsletterName,
                body: "",
                thumbnailUrl: THUMB_URL,
                sourceUrl: groupUrl,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
            header: {
              title: null,
              locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: `꫶ᥫ᭡꫶ ${m.pushName || "User"}`,
                url: groupUrl,
                address: ucapanWaktu(),
                jpegThumbnail: thumbBuffer,
              },
              subtitle: "",
              hasMediaAttachment: false,
            },
            body: { text: null },
            footer: { text: caption },
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({ display_text: "my group!", url: groupUrl, has_multiple_buttons: true }),
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "contact owner", id: `${prefix}owner`, has_multiple_buttons: true }),
                },
                {
                  name: "cta_call",
                  buttonParamsJson: JSON.stringify({ display_text: "call owner", phone_number: ownerNumber ? `+${ownerNumber}` : "+000", has_multiple_buttons: true }),
                },
              ],
              messageParamsJson: JSON.stringify({
                bottom_sheet: {
                  in_thread_buttons_limit: 1,
                  divider_indices: [1, 2],
                  list_title: ucapanWaktu(),
                  button_title: " ",
                },
              }),
            }),
          }),
        },
      },
    }, { userJid: m.sender });

    await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
    await m.react("✅");
  } catch (err) {
    console.error("[AllMenu] Interactive error:", err.message);
    await m.react("❌");
    await m.reply(caption);
  }
};

handler.command     = ["allmenu"];
handler.category    = "main";
handler.description = "Tampilkan semua command";

export default handler;
