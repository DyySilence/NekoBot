/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// lib/serialize.js
import "../set/config.js";
import {
  extractMessageContent,
  jidNormalizedUser,
  proto,
  delay,
  getContentType,
  areJidsSameUser,
  generateWAMessage,
} from "baileys";

const lidCache = new Map();

export const cacheParticipantLids = (participants = []) => {
  for (const p of participants) {
    const jid = p.jid || p.id || "";
    const lid = p.lid || "";
    if (lid && jid && !jid.endsWith("@lid") && !isLidConverted(jid)) {
      lidCache.set(lid, jid);
      const lidNum = lid.replace("@lid", "");
      lidCache.set(lidNum + "@s.whatsapp.net", jid);
      lidCache.set(lid.replace("@lid", "@s.whatsapp.net"), jid);
    }
  }
};

export const getCachedJid = (lid) => lidCache.get(lid) || null;

export const isLid = (jid) => !!jid && jid.endsWith("@lid");

export const isLidConverted = (jid) => {
  if (!jid) return false;
  if (!jid.endsWith("@s.whatsapp.net")) return false;

  const number = jid.replace("@s.whatsapp.net", "");

  if (number.length > 14) return true;

  const validCountryCodes = [
    "1","7","20","27","30","31","32","33","34","36","39",
    "40","41","43","44","45","46","47","48","49","51","52","53","54","55",
    "56","57","58","60","61","62","63","64","65","66","81","82","84","86",
    "90","91","92","93","94","95","98","212","213","216","218","220","221",
    "234","249","254","255","256","260","263","351","352","353","354","355",
    "356","357","358","359","370","371","372","373","374","375","376","377",
    "378","380","381","382","383","385","386","387","389","420","421","423",
    "852","853","855","856","880","886","960","961","962","963","964","965",
    "966","967","968","970","971","972","973","974","975","976","977","992",
    "993","994","995","996","998",
  ];

  for (const code of validCountryCodes) {
    if (
      number.startsWith(code) &&
      number.length >= code.length + 6 &&
      number.length <= code.length + 12
    ) {
      return false; // valid phone number
    }
  }

  return true;
};

export const lidToJid = (jid) => {
  if (!jid) return jid;
  return jid.endsWith("@lid") ? jid.replace("@lid", "@s.whatsapp.net") : jid;
};

export const jidToLid = (jid) => {
  if (!jid || jid.endsWith("@lid")) return jid;
  return jid.replace("@s.whatsapp.net", "@lid");
};

export const normalizeJid = (jid) => {
  if (!jid) return jid;
  jid = jid.replace(/:\d+/, "");
  if (!jid.includes("@")) jid = jid + "@s.whatsapp.net";
  return jid;
};

export const decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decoded = jid.split("@")[0].split(":")[0] + "@" + jid.split("@")[1];
    return normalizeJid(decoded);
  }
  return normalizeJid(jid);
};

export const getParticipantJid = (participant) => {
  if (!participant) return "";
  if (participant.jid && !participant.jid.endsWith("@lid") && !isLidConverted(participant.jid))
    return participant.jid;
  if (participant.id && !participant.id.endsWith("@lid") && !isLidConverted(participant.id))
    return participant.id;
  return lidToJid(participant.id || participant.lid || "");
};

export const resolveLidFromParticipants = (jid, participants = []) => {
  if (!jid || !participants.length) return jid;

  const lidNum = jid.replace(/@.*$/, "");
  const lidFormat = lidNum + "@lid";

  for (const p of participants) {
    if (p.lid === lidFormat || p.lid === jid || p.id === jid || p.id === lidFormat) {
      if (p.jid && !p.jid.endsWith("@lid") && !isLidConverted(p.jid)) return p.jid;
      if (p.id  && !p.id.endsWith("@lid")  && !isLidConverted(p.id))  return p.id;
    }
  }

  return isLid(jid) ? lidToJid(jid) : jid;
};

export const resolveAnyLidToJid = (jid, participants = []) => {
  if (!jid) return jid;

  const cached = getCachedJid(jid);
  if (cached) return cached;
  if (jid.endsWith("@s.whatsapp.net")) {
    const lidFmt = jid.replace("@s.whatsapp.net", "@lid");
    const cachedFromLid = getCachedJid(lidFmt);
    if (cachedFromLid) return cachedFromLid;
  }

  if (!participants.length) return isLid(jid) ? lidToJid(jid) : jid;

  cacheParticipantLids(participants);
  
  if (isLid(jid)) {
    const resolved = resolveLidFromParticipants(jid, participants);
    if (resolved !== jid && !isLidConverted(resolved)) {
      lidCache.set(jid, resolved);
    }
    return resolved;
  }
  
  if (isLidConverted(jid)) {
    const lidNum = jid.replace("@s.whatsapp.net", "");
    const lidFmt = lidNum + "@lid";
    for (const p of participants) {
      if (p.lid === lidFmt) {
        const real = getParticipantJid(p);
        if (!isLidConverted(real)) {
          lidCache.set(jid, real);
          lidCache.set(lidFmt, real);
          return real;
        }
      }
      if (p.id === jid) {
        const real = getParticipantJid(p);
        if (!isLidConverted(real)) {
          lidCache.set(jid, real);
          return real;
        }
      }
    }
  }

  return jid;
};
export const resolveTarget = (m, args, participants = []) => {
  let targetJid   = null;
  let displayName = m.pushName || "User";

  if (m.mentionedJid?.length) {
    targetJid   = m.mentionedJid[0];
    displayName = targetJid.split("@")[0];
  } else if (m.quoted?.sender) {
    const raw   = m.quoted.sender;
    targetJid   = resolveAnyLidToJid(raw, participants) || lidToJid(raw);
    displayName = m.quoted.pushName || targetJid.split("@")[0];
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    if (num) {
      const p     = participants.find(
        (x) => (x.jid || x.id || "").replace(/[^0-9]/g, "") === num
      );
      targetJid   = p ? (p.jid || p.id) : num + "@s.whatsapp.net";
      displayName = p?.notify || num;
    } else {
      displayName = args.join(" ").trim();
      targetJid   = null;
    }
  } else {
    targetJid   = m.sender;
    displayName = m.pushName || m.sender.split("@")[0];
  }

  const n        = targetJid ? `@${targetJid.split("@")[0]}` : displayName;
  const mentions = targetJid ? [targetJid] : [];

  return { targetJid, displayName, n, mentions };
};
export const convertLidArray = (arr, participants = []) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((jid) => resolveAnyLidToJid(jid, participants));
};
const serialize = async (conn, m) => {
  if (!m) return m;
  const { WebMessageInfo } = proto;
  if (!conn._lidHelpersAttached) {
    conn._lidHelpersAttached = true;
    conn.decodeJid = (jid) => decodeJid(jid);
    conn.toLid = async (jid) => {
      if (!jid) return jid;
      const decoded = decodeJid(jid);
      if (isLid(decoded)) return decoded;
      const cached = getCachedJid(decoded);
      if (cached && isLid(cached)) return cached;
      return jidToLid(decoded);
    };

    conn.resolveJid = (jid, participants = []) =>
      resolveAnyLidToJid(jid, participants);
  }

  if (m.key) {
    m.id = m.key.id;
    const rawRemote = m.key.remoteJid || "";
    if (rawRemote.endsWith("@g.us") || rawRemote.endsWith("@newsletter") || rawRemote.endsWith("@broadcast")) {
      m.chat = rawRemote; 
    } else if (rawRemote.endsWith("@s.whatsapp.net")) {
      m.chat = await conn.toLid(rawRemote); 
    } else {
      m.chat = rawRemote; 
    }

    m.isBaileys = m.id
      ? m.id.startsWith("3EB0") ||
        m.id.startsWith("B1E") ||
        m.id.startsWith("BAE") ||
        m.id.startsWith("3F8") ||
        m.id.length < 32 ||
        m.id.length === 18
      : false;

    m.fromMe    = m.key.fromMe;
    m.isChannel = m.chat.endsWith("@newsletter");
    m.isGroup   = m.chat.endsWith("@g.us");

    const rawBotId  = conn.user?.lid || conn.user?.id || "";
    m.botNumber = rawBotId.includes(":") ? rawBotId.split(":")[0] + "@lid" : rawBotId;

    const ownerRaw  = global.owner ? global.owner + "@s.whatsapp.net" : "";
    const ownerLid  = ownerRaw ? await conn.toLid(ownerRaw) : "";

    let groupParticipants = [];
    if (m.isGroup) {
  const meta = global.groupMetadataCache?.get(m.chat) ?? null;
  if (meta?.participants) {
    groupParticipants = meta.participants;
    cacheParticipantLids(groupParticipants);
  } else {
    try {
      const freshMeta = await conn.groupMetadata(m.chat);
      if (freshMeta?.participants) {
        global.groupMetadataCache?.set(m.chat, freshMeta);
        groupParticipants = freshMeta.participants;
        cacheParticipantLids(groupParticipants);
      }
    } catch {}
  }
}
    const rawSender = m.fromMe
  ? conn.user?.id || ""
  : m.key.participant || m.key.remoteJid || "";
const rawSenderNum = decodeJid(rawSender).replace(/[^0-9]/g, "");
const botUserNum   = (conn.user?.id || "").replace(/[^0-9]/g, "");
if (!m.fromMe && rawSenderNum && rawSenderNum === botUserNum) {
  m.fromMe = true;
}
    let resolvedSender = resolveAnyLidToJid(decodeJid(rawSender), groupParticipants);

    if (resolvedSender.endsWith("@s.whatsapp.net")) {
      resolvedSender = await conn.toLid(resolvedSender);
    }
    m.sender = resolvedSender || decodeJid(rawSender);

    if (m.isGroup) {
      const rawPart = m.key.participant || "";
      if (rawPart) {
        let resolvedPart = resolveAnyLidToJid(decodeJid(rawPart), groupParticipants);
        if (resolvedPart.endsWith("@s.whatsapp.net")) {
          resolvedPart = await conn.toLid(resolvedPart);
        }
        m.participant = resolvedPart;
      } else {
        m.participant = null;
      }
    }

    const resolvedSenderForOwner = resolveAnyLidToJid(m.sender, groupParticipants);
    const ownerNum   = (global.owner || "").replace(/[^0-9]/g, "");
    const senderNum  = resolvedSenderForOwner.replace(/[^0-9]/g, "");
    const botNum     = (conn.user?.id || "").replace(/[^0-9]/g, "");
    m.isOwner    = (ownerNum && senderNum === ownerNum) || (botNum && senderNum === botNum) || m.sender === ownerLid;
    m.senderNumber = senderNum || m.sender.replace(/@.+/g, "");
    const fakeParticipant = m.isGroup
  ? (resolveAnyLidToJid(m.sender, groupParticipants) || m.sender)
  : undefined;

m.fakeObj = proto.WebMessageInfo.fromObject({
  key: {
    remoteJid: m.isGroup ? m.chat : (resolveAnyLidToJid(m.sender, groupParticipants) || lidToJid(m.sender)),
    fromMe: m.fromMe,
    id: m.id,
    participant: fakeParticipant,
  },
  message: m.message,
  pushName: m.pushName || m.key?.pushName || "",
  messageTimestamp: m.messageTimestamp,
  status: 2,
});
  }
  

  if (m.message) {
    let unwrapped = m.message;
    if (unwrapped.ephemeralMessage)           unwrapped = unwrapped.ephemeralMessage.message;
    if (unwrapped.viewOnceMessage)            unwrapped = unwrapped.viewOnceMessage.message;
    if (unwrapped.viewOnceMessageV2)          unwrapped = unwrapped.viewOnceMessageV2.message;
    if (unwrapped.viewOnceMessageV2Extension) unwrapped = unwrapped.viewOnceMessageV2Extension.message;
    if (unwrapped.documentWithCaptionMessage) unwrapped = unwrapped.documentWithCaptionMessage.message;
    if (unwrapped.editedMessage)              unwrapped = unwrapped.editedMessage.message;

    m.mtype = getContentType(unwrapped);
    m.prefix = global.prefix || ".";

    const content = unwrapped[m.mtype];
    m.msg =
      m.mtype === "viewOnceMessage"
        ? unwrapped[m.mtype].message[getContentType(unwrapped[m.mtype].message)]
        : content;

    m.body =
      unwrapped?.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === "extendedTextMessage"       && m.msg?.text) ||
      (m.mtype === "buttonsResponseMessage"    && m.msg?.selectedButtonId) ||
      (m.mtype === "interactiveResponseMessage" &&
        (() => {
          try {
            return JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson || "{}")?.id;
          } catch { return ""; }
        })()) ||
      (m.mtype === "templateButtonReplyMessage" && m.msg?.selectedId) ||
      (m.mtype === "listResponseMessage"       && m.msg?.singleSelectReply?.selectedRowId) ||
      "";
    const quotedRaw = m.msg?.contextInfo?.quotedMessage ?? null;
    m.mentionedJid  = m.msg?.contextInfo?.mentionedJid  ?? [];
    const groupParticipants = m.isGroup
      ? (global.groupMetadataCache?.get(m.chat)?.participants ?? [])
      : [];

    m.mentionedJid = convertLidArray(m.mentionedJid, groupParticipants);

    if (quotedRaw) {
      let qType = getContentType(quotedRaw);
      let qMsg  = quotedRaw[qType];
      if (qType === "productMessage") {
        qType = getContentType(qMsg);
        qMsg  = qMsg[qType];
      }
      if (typeof qMsg === "string") qMsg = { text: qMsg };

      if (qMsg) {
        const rawQPart = m.msg.contextInfo?.participant || "";
        let resolvedQPart = resolveAnyLidToJid(decodeJid(rawQPart), groupParticipants);
        if (resolvedQPart.endsWith("@s.whatsapp.net")) {
          resolvedQPart = await conn.toLid(resolvedQPart);
        }
        const rawQRemote = m.msg.contextInfo?.remoteJid || m.chat || "";
        let resolvedQRemote = rawQRemote;
        if (rawQRemote.endsWith("@s.whatsapp.net")) {
          resolvedQRemote = await conn.toLid(rawQRemote);
        }

        qMsg.key = {
  remoteJid: resolvedQRemote,
  participant: resolvedQPart || m.sender,
  fromMe: areJidsSameUser(
    jidNormalizedUser(rawQPart),
    jidNormalizedUser(conn.user?.id || "")
  ),
  id: m.msg.contextInfo.stanzaId,
};

        qMsg.mtype   = qType;
        qMsg.chat    = resolvedQRemote;
        qMsg.id      = qMsg.key.id;
        qMsg.isBaileys = qMsg.id
          ? qMsg.id.startsWith("3EB0") ||
            qMsg.id.startsWith("B1E")  ||
            qMsg.id.startsWith("3F8")  ||
            qMsg.id.startsWith("BAE")  ||
            qMsg.id.length < 32
          : false;

        qMsg.sender  = resolvedQPart;
        qMsg.fromMe  = qMsg.key.fromMe;
        qMsg.text    =
          qMsg.text || qMsg.caption || qMsg.conversation ||
          qMsg.contentText || qMsg.selectedDisplayText || qMsg.title || "";

        qMsg.mentionedJid = convertLidArray(
          m.msg.contextInfo?.mentionedJid ?? [],
          groupParticipants
        );

        qMsg.isMedia    = ["imageMessage","videoMessage","audioMessage","stickerMessage","documentMessage"].includes(qType);
        qMsg.isImage    = qType === "imageMessage";
        qMsg.isVideo    = qType === "videoMessage";
        qMsg.isAudio    = qType === "audioMessage";
        qMsg.isVoice    = qType === "audioMessage" && qMsg.ptt === true;
        qMsg.isSticker  = qType === "stickerMessage";
        qMsg.isAnimated = qType === "stickerMessage" && qMsg.isAnimated === true;
        qMsg.isDocument = qType === "documentMessage";

        qMsg.fakeObj = WebMessageInfo.fromObject({
          key: qMsg.key,
          message: quotedRaw,
          ...(m.isGroup ? { participant: qMsg.sender } : {}),
        });

        qMsg.download = async () => {
          const { downloadContentFromMessage } = await import("baileys");
          const dlType = qType.replace(/Message$/i, "").toLowerCase();
          const stream = await downloadContentFromMessage(qMsg, dlType);
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          return Buffer.concat(chunks);
        };
      }  

      m.quoted = qMsg;
    } else {
      m.quoted = null;
    }
  }

  if (m.msg?.url) {
    m.download = (saveToFile = false) =>
      conn.downloadMediaMessage(m.msg, m.mtype.replace(/message/i, ""), saveToFile);
  }

  m.text = m.body || "";

  m.isMedia    = ["imageMessage","videoMessage","audioMessage","stickerMessage","documentMessage"].includes(m.mtype);
  m.isImage    = m.mtype === "imageMessage";
  m.isVideo    = m.mtype === "videoMessage";
  m.isAudio    = m.mtype === "audioMessage";
  m.isVoice    = m.mtype === "audioMessage" && m.msg?.ptt === true;
  m.isSticker  = m.mtype === "stickerMessage";
  m.isDocument = m.mtype === "documentMessage";
  m.isLocation = m.mtype === "locationMessage";
  m.isContact  = m.mtype === "contactMessage";
  m.isPoll     = m.mtype === "pollCreationMessage";
  m.getLid     = (jid) => jidToLid(jid);
  m.getJid     = (jid) => lidToJid(jid);
  m.toLidArray = (arr) => (Array.isArray(arr) ? arr.map(jidToLid) : []);
  m.toJidArray = (arr) => convertLidArray(arr, m.isGroup
    ? (global.groupMetadataCache?.get(m.chat)?.participants ?? [])
    : []);
    
    m.react = async (emoji) => {
    try {
      return await conn.sendMessage(m.chat, {
        react: { text: emoji, key: m.key },
      });
    } catch {}
  };
    m.replyWithPreview = async (text, previewUrl, title, body, thumbnail, options = {}) => {
    const chatId = options.chat || m.chat;
    if (options.mentions) {
      options.mentions = convertLidArray(options.mentions, m.isGroup
        ? (global.groupMetadataCache?.get(m.chat)?.participants ?? [])
        : []);
    }
    try {
      return await conn.sendMessage(chatId, {
        text,
        contextInfo: {
          externalAdReply: {
            title:                 title     || "Preview",
            body:                  body      || "",
            thumbnailUrl:          thumbnail || "",
            sourceUrl:             previewUrl,
            mediaType:             1,
            renderLargerThumbnail: true,
            showAdAttribution:     true,
          },
        },
        ...options,
      }, { quoted: m.fakeObj || m });
    } catch (err) {
      return await conn.sendMessage(chatId, { text, ...options }, { quoted: m.fakeObj || m });
    }
  };

  m.replySticker = async (media, options = {}) => {
    const { randomBytes } = await import("crypto");
    const channelName = "Saluran Resmi Bot";
    const channelJid  = "120363425809110720@newsletter";

    const fakeMsg = {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "BAE5C9E3C9A6C8D6",
        participant: "0@s.whatsapp.net",
      },
      message: {
        interactiveMessage: {
          nativeFlowMessage: {
            buttons: [{
              name: "review_and_pay",
              buttonParamsJson: JSON.stringify({
                currency: "IDR",
                total_amount: { value: 10000000, offset: 100 },
                reference_id: "REF-" + Math.random().toString(36).substring(7).toUpperCase(),
                type: "physical-goods",
                order: {
                  status: "payment_requested",
                  order_type: "PAYMENT_REQUEST",
                  subtotal: { value: 0, offset: 100 },
                  items: [{
                    retailer_id: "item-" + Date.now(),
                    name: m.pushName || "User",
                    amount: { value: 10000000, offset: 100 },
                    quantity: 1,
                  }],
                },
                additional_note: global.botName || "Bot",
                native_payment_methods: [],
                share_payment_status: false,
              }),
            }],
          },
        },
      },
    };

    try {
      return await conn.sendMessage(m.chat, {
        sticker: Buffer.isBuffer(media) ? media : { url: media },
        contextInfo: {
          isForwarded: true,
          forwardingScore: 9999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363425809110720@newsletter",
            newsletterName: "Saluran Resmi Bot",
            serverMessageId: 100,
          },
        },
        ...options,
      }, { quoted: fakeMsg });
    } catch (err) {
      console.error("[replySticker] error:", err.message);
      return await conn.sendMessage(m.chat, {
        sticker: Buffer.isBuffer(media) ? media : { url: media },
        ...options,
      }, { quoted: m });
    }
  };
  m.reply = async (text, options = {}) => {
    const chatId   = options.chat || m.chat;
    const pushname = m.pushName || "User";
    const mentions = [...(text?.matchAll(/@(\d{0,19})/g) || [])].map((v) => v[1] + "@lid");

    const troliQuoted = {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "BAE5C9E3C9A6C8D6",
        participant: "0@s.whatsapp.net",
      },
      message: {
        interactiveMessage: {
          nativeFlowMessage: {
            buttons: [
              {
                name: "review_and_pay",
                buttonParamsJson: JSON.stringify({
                  currency: "IDR",
                  total_amount: { value: 10000000, offset: 100 },
                  reference_id: "REF-" + Math.random().toString(36).substring(7).toUpperCase(),
                  type: "physical-goods",
                  order: {
                    status: "payment_requested",
                    order_type: "PAYMENT_REQUEST",
                    subtotal: { value: 0, offset: 100 },
                    items: [
                      {
                        retailer_id: "item-" + Date.now(),
                        name: pushname,
                        amount: { value: 10000000, offset: 100 },
                        quantity: 1,
                      },
                    ],
                  },
                  additional_note: global.botName || "Bot",
                  native_payment_methods: [],
                  share_payment_status: false,
                }),
              },
            ],
          },
        },
      },
    };

    try {
      return await conn.sendMessage(
        chatId,
        {
          text,
          mentions,
          contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363425809110720@newsletter",
              newsletterName: global.botName || "Bot",
              serverMessageId: 100,
            },
          },
          ...options,
        },
        { quoted: troliQuoted }
      );
    } catch {
      return await conn.sendMessage(chatId, { text, mentions, ...options }, { quoted: m });
    }
  };

  return m;
};


export default serialize;