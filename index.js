/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import "./lib/function.js";
import "./set/config.js";
import {
  default as makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  jidDecode,
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessage,
  generateMessageID,
  makeInMemoryStore,
} from "baileys";

import chalk from "chalk";
import Pino from "pino";
import fs from "fs";
import crypto from "crypto";
import moment from "moment-timezone";
import DataBase from "./lib/database.js";
import { startAutoDeletePanel } from './plugins/panel/autoDeletePanel.js';
import serialize, {
  cacheParticipantLids,
  resolveAnyLidToJid,
  getParticipantJid,
  decodeJid,
  isLid,
  lidToJid,
  jidToLid,
  convertLidArray,
} from "./lib/serialize.js";
import { imageToWebp, videoToWebp } from "./lib/mediaHelper.js";
import messageHandler from "./lib/handler.js";
import { reactToNewMessage } from "./plugins/group/autoreact.js";
import { startAutoBackup } from './plugins/owner/autoBackup.js';
const database = new DataBase();
const deletedMsgCache = new Map();
global.groupMetadataCache = new Map();
const store = makeInMemoryStore({});
global.statusStore = new Map();

const loadDb = async () => {
  const load = (await database.read()) ?? {};
  global.db = {
    users:    load.users    ?? {},
    groups:   load.groups   ?? {},
    settings: load.settings ?? {},
  };
  await database.write(global.db);
  setInterval(() => database.write(global.db), 2000);
};

await loadDb();

global.mess = {
  owner:    "❌ Command ini hanya untuk owner!",
  admin:    "❌ Command ini hanya untuk admin grup!",
  group:    "❌ Command ini hanya bisa digunakan di grup!",
  private:  "❌ Command ini hanya bisa digunakan di private chat!",
  botadmin: "❌ Bot harus jadi admin dulu!",
  premium:  "❌ Command ini hanya untuk pengguna premium!",
};

function isMuted(groupId, senderJid) {
  const mutedList = global.db.groups?.[groupId]?.muted ?? {};
  const senderNum = senderJid.replace(/[^0-9]/g, "");
  return Object.keys(mutedList).some(
    (k) => mutedList[k] === true && k.replace(/[^0-9]/g, "") === senderNum
  );
}

function resolveParticipants(participants = []) {
  cacheParticipantLids(participants);
  return participants.map((p) => getParticipantJid(p));
}

function resolveSenderToPhone(rawJid, participants = []) {
  if (!rawJid) return rawJid;

  if (rawJid.endsWith("@s.whatsapp.net") && !rawJid.includes(":")) {
    const num = rawJid.replace("@s.whatsapp.net", "");
    if (num.length <= 15) return rawJid;
  }

  const rawNum = rawJid.replace(/@.*$/, "").replace(/[^0-9]/g, "");

  for (const p of participants) {
    const ids = [p.id, p.jid, p.lid].filter(Boolean);
    for (const id of ids) {
      const idNum = id.replace(/@.*$/, "").replace(/[^0-9]/g, "");
      if (idNum && idNum === rawNum) {
        const realId = ids.find((i) => i.endsWith("@s.whatsapp.net") && !i.includes(":"));
        if (realId) return realId;
      }
    }
  }

  const resolved = resolveAnyLidToJid(rawJid, participants);
  if (resolved && resolved.endsWith("@s.whatsapp.net")) return resolved;

  if (rawJid.endsWith("@lid")) return lidToJid(rawJid);

  return rawJid;
}

async function StartBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger:            Pino({ level: "silent" }),
    browser:           Browsers.ubuntu("Safari"),
    auth:              state,
    printQRInTerminal: false,
    syncFullHistory:   false,
    cachedGroupMetadata: async (jid) => {
      if (global.groupMetadataCache.has(jid)) return global.groupMetadataCache.get(jid);
      const metadata = await sock.groupMetadata(jid).catch(() => null);
      if (metadata) {
        cacheParticipantLids(metadata.participants ?? []);
        global.groupMetadataCache.set(jid, metadata);
      }
      return metadata;
    },
  });

  store.bind(sock.ev);

  if (!sock.authState.creds.registered) {
    console.log(chalk.white(`• Requesting Pairing Code → ${global.pairingNumber?.trim()}`));
    setTimeout(async () => {
      const code = await sock.requestPairingCode(global.pairingNumber?.trim());
      console.log(chalk.yellow(`• Kode Pairing: ${code}`));
    }, 4000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.decodeJid = (jid) => decodeJid(jid);

  sock.toLid = async (jid) => {
    if (!jid) return jid;
    const decoded = decodeJid(jid);
    if (isLid(decoded)) return decoded;
    const cached = resolveAnyLidToJid(decoded, []);
    if (cached === decoded) return jidToLid(decoded);
    return isLid(cached) ? cached : jidToLid(decoded);
  };

  sock.resolveJid = (jid, participants = []) => resolveAnyLidToJid(jid, participants);

  sock.downloadMediaMessage = async (m, type, filename = "") => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer   = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (filename) await fs.promises.writeFile(filename, buffer);
    return filename && fs.existsSync(filename) ? filename : buffer;
  };

  sock.sendSticker = async (jid, input, quoted, options = {}) => {
    let buff;
    if (Buffer.isBuffer(input)) {
      buff = input;
    } else if (/^data:.*?\/.*?;base64,/i.test(input)) {
      buff = Buffer.from(input.split(",")[1], "base64");
    } else if (/^https?:\/\//.test(input)) {
      const { default: fetch } = await import("node-fetch");
      const res = await fetch(input);
      buff = Buffer.from(await res.arrayBuffer());
    } else if (fs.existsSync(input)) {
      buff = fs.readFileSync(input);
    } else {
      buff = Buffer.alloc(0);
    }

    const opt = {
      packname: options.packname || global.namaOwner || "DyySilence",
      author:   options.author   || global.dev       || "© 2026",
    };

    const isVideo = buff[0] === 0x00 || (buff.toString("ascii", 4, 8) === "ftyp");
    const buffer  = isVideo
      ? await videoToWebp(buff, opt)
      : await imageToWebp(buff, opt);

    await sock.sendMessage(jid, { sticker: buffer, ...options }, { quoted });
    return buffer;
  };

  sock.sendAlbum = async (jid, content, quoted) => {
    const array = content.albumMessage;
    const album = await generateWAMessageFromContent(jid, {
      messageContextInfo: { messageSecret: crypto.randomBytes(32) },
      albumMessage: {
        expectedImageCount: array.filter((a) => a.image).length,
        expectedVideoCount: array.filter((a) => a.video).length,
      },
    }, { userJid: quoted.sender, quoted, upload: sock.waUploadToServer });
    await sock.relayMessage(jid, album.message, { messageId: album.key.id });
    for (const item of array) {
      const img = await generateWAMessage(jid, item, { upload: sock.waUploadToServer });
      img.message.messageContextInfo = {
        messageSecret:    crypto.randomBytes(32),
        messageAssociation: { associationType: 1, parentMessageKey: album.key },
        participant:      "0@s.whatsapp.net",
        remoteJid:        "status@broadcast",
        forwardingScore:  99999,
        isForwarded:      true,
        mentionedJid:     [jid],
      };
      await sock.relayMessage(jid, img.message, {
        messageId: img.key.id,
        quoted: {
          key: {
            remoteJid:   album.key.remoteJid,
            id:          album.key.id,
            fromMe:      true,
            participant: generateMessageID().split("@")[0] + "@s.whatsapp.net",
          },
          message: album.message,
        },
      });
    }
    return album;
  };

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key?.remoteJid === "status@broadcast" && msg.message) {
        const sender = msg.key?.participant || msg.key?.remoteJid;
        if (sender) {
          if (!global.statusStore.has(sender)) global.statusStore.set(sender, []);
          const arr = global.statusStore.get(sender);
          arr.push(msg);
          if (arr.length > 20) arr.shift();
          global.statusStore.set(sender, arr);
        }
      }
    }

    const msg = messages[0];
    if (!msg?.message) return;
    deletedMsgCache.set(msg.key.id, msg);
    if (deletedMsgCache.size > 1000) {
      deletedMsgCache.delete(deletedMsgCache.keys().next().value);
    }

    const m = await serialize(sock, msg);
    if (!m || m.isBaileys) return;
    if (m.isGroup && !m.fromMe) {
      const groupId    = m.chat;
      const groupData  = global.db.groups?.[groupId] ?? {};

      if (groupData.antitagsw) {
        const rawMsg     = msg.message ?? {};
        const isStatusMention =
          !!rawMsg.groupStatusMentionMessage ||
          m.mtype === "groupStatusMentionMessage";

        if (isStatusMention) {
          const groupMeta    = global.groupMetadataCache.get(groupId) ?? {};
          const participants = groupMeta?.participants ?? [];
          cacheParticipantLids(participants);
          const rawSender  = msg.key?.participant || m.sender || "";
          const realSender = resolveSenderToPhone(rawSender, participants);
          const senderNum  = realSender.replace(/@.*$/, "").replace(/[^0-9]/g, "");
          const senderJid  = senderNum ? `${senderNum}@s.whatsapp.net` : realSender;
          const isAdmin = participants.some(
            (p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === senderNum
          );
          const ownerNum = (global.owner || "").replace(/[^0-9]/g, "");
          const isOwner  = ownerNum && senderNum === ownerNum;

          if (!isAdmin && !isOwner) {
            try { await sock.sendMessage(groupId, { delete: msg.key }); } catch {}
            if (!groupData.warnsAntitagsw) groupData.warnsAntitagsw = {};
            groupData.warnsAntitagsw[senderNum] = (groupData.warnsAntitagsw[senderNum] ?? 0) + 1;
            global.db.groups[groupId] = groupData;

            const wCount = groupData.warnsAntitagsw[senderNum];

            if (wCount >= 3) {
              try {
                await sock.groupParticipantsUpdate(groupId, [senderJid], "remove");
                delete groupData.warnsAntitagsw[senderNum];
                global.db.groups[groupId] = groupData;
                await sock.sendMessage(groupId, {
                  text:
                    `🚫 *ANTI TAG STATUS WA*\n\n` +
                    `👤 @${senderNum} sudah 3x mention @status\n` +
                    `❌ Pesan dihapus & member di-*KICK*!`,
                  mentions: [senderJid],
                });
              } catch {
                await sock.sendMessage(groupId, {
                  text:
                    `🚫 *ANTI TAG STATUS*\n\n` +
                    `⚠️ Warning ${wCount}/3\n` +
                    `👤 @${senderNum} mention @status — gagal kick, pastikan bot admin!`,
                  mentions: [senderJid],
                });
              }
            } else {
              await sock.sendMessage(groupId, {
                text:
                  `🚫 *ANTI TAG STATUS*\n\n` +
                  `👤 @${senderNum} mention @status!\n` +
                  `❌ Pesan dihapus\n` +
                  `⚠️ Warning: ${wCount}/3\n` +
                  `${3 - wCount} warn lagi → di-kick!`,
                mentions: [senderJid],
              });
            }
            return;
          }
        }
      }
    }

    if (m.isGroup && !m.fromMe) {
      const senderJid    = m.sender || m.participant || m.key?.participant || "";
      const groupMeta    = global.groupMetadataCache.get(m.chat) ?? {};
      const participants = groupMeta?.participants ?? [];
      cacheParticipantLids(participants);
      const senderNum    = senderJid.replace(/[^0-9]/g, "");
      const isAdmin      = participants.some(
        (p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === senderNum
      );
      if (!isAdmin && !m.isOwner && isMuted(m.chat, senderJid)) {
        const botRaw     = sock.user?.lid || sock.user?.id || "";
        const botNum     = botRaw.split(":")[0].split("@")[0];
        const isBotAdmin = participants.some(
          (p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === botNum
        );
        if (isBotAdmin) {
          await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
          return;
        }
      }
    }

    if (m.isGroup && !m.fromMe) {
      await reactToNewMessage(sock, m.chat, m.key);
    }
    await messageHandler(sock, m);
  });

  sock.ev.on("messages.update", async (updates) => {
    for (const { key, update } of updates) {
      try {
        const isDeleted =
          update.message?.protocolMessage?.type === 0 ||
          !!update.message?.protocolMessage?.key ||
          update.message === null;

        if (!isDeleted) continue;

        const jid       = key.remoteJid;
        const isGroup   = jid?.endsWith("@g.us");
        const isPrivate = jid?.endsWith("@s.whatsapp.net");

        if (!isGroup && !isPrivate) continue;
        let antideleteOn = false;
        if (isGroup)   antideleteOn = !!(global.db.groups?.[jid]?.antidelete);
        if (isPrivate) antideleteOn = !!(global.db.users?.[jid]?.antidelete);

        if (!antideleteOn) continue;

        const cached = deletedMsgCache.get(key.id);
        if (!cached?.message) continue;
        if (cached.key?.fromMe) continue;

        const senderJid = key.participant || cached.key?.participant || (isPrivate ? jid : "");
        const senderNum = senderJid.replace(/[^0-9]/g, "");

        const mtype = Object.keys(cached.message).find(
          (k) => !["messageContextInfo", "senderKeyDistributionMessage"].includes(k)
        );
        if (!mtype) continue;

        const content  = cached.message[mtype];
        const mentions = senderJid ? [senderJid] : [];
        const header   = isGroup
          ? `🗑️ *ANTIDELETE*\n👤 @${senderNum} menghapus pesan\n`
          : `🗑️ *ANTIDELETE*\n👤 Pesan dihapus\n`;

        try {
          if (mtype === "conversation" || mtype === "extendedTextMessage") {
            const txt = content?.text || (typeof content === "string" ? content : "");
            await sock.sendMessage(jid, { text: `${header}\n📝 *Isi:*\n${txt}`, mentions });
          } else if (mtype === "imageMessage") {
            await sock.sendMessage(jid, {
              image:   { url: content.url },
              caption: `${header}${content.caption || ""}`,
              mentions,
            });
          } else if (mtype === "videoMessage") {
            await sock.sendMessage(jid, {
              video:   { url: content.url },
              caption: `${header}${content.caption || ""}`,
              mentions,
            });
          } else if (mtype === "audioMessage") {
            await sock.sendMessage(jid, {
              audio: { url: content.url },
              ptt:   content.ptt ?? false,
              mentions,
            });
          } else if (mtype === "stickerMessage") {
            await sock.sendMessage(jid, { sticker: { url: content.url } });
          } else if (mtype === "documentMessage") {
            await sock.sendMessage(jid, {
              document: { url: content.url },
              fileName: content.fileName || "file",
              mimetype: content.mimetype || "application/octet-stream",
              caption:  header,
              mentions,
            });
          } else {
            await sock.sendMessage(jid, { text: `${header}\n⚠️ Tipe: ${mtype}`, mentions });
          }
        } catch (sendErr) {
          console.error("[antidelete] Gagal kirim:", sendErr.message);
        }

        deletedMsgCache.delete(key.id);

      } catch (err) {
        console.error("[antidelete] Error:", err.message);
      }
    }
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow("Reconnecting..."));
        StartBot();
      } else {
        console.log(chalk.red("Connection Closed — Logged Out"));
      }
    }
    if (connection === "open") console.log(chalk.green("✅ Bot Tersambung!"));
  });

  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    try {
      const metadata = await sock.groupMetadata(id).catch(() => null);
      if (metadata) {
        cacheParticipantLids(metadata.participants ?? []);
        global.groupMetadataCache.set(id, metadata);
      }

      if (action !== "add" && action !== "remove") return;
      const groupData = global.db.groups[id] ?? {};
      const gName     = metadata?.subject ?? id.split("@")[0];
      const count     = metadata?.participants?.length ?? 0;

      for (const participant of participants) {
        const pJid = typeof participant === "string"
          ? participant
          : (participant.jid || participant.id || participant.lid || "");
        if (!pJid) continue;
        const pNum = pJid.split("@")[0];

        let ppUrl = "https://i.ibb.co/3dQ5pq7/default-avatar.png";
        try { ppUrl = await sock.profilePictureUrl(pJid, "image"); } catch {}

        if (action === "add" && groupData.welcome) {
          let text = groupData.welcomeText || "Selamat datang @user!\nKamu member ke-{count} di *{group}*\nSemoga betah! 🎉";
          text = text.replace(/@user/g, `@${pNum}`).replace(/{group}/g, gName).replace(/{count}/g, count);
          try {
            await sock.sendMessage(id, { image: { url: ppUrl }, caption: text, mentions: [pJid] });
          } catch {
            await sock.sendMessage(id, { text, mentions: [pJid] });
          }
        }

        if (action === "remove" && groupData.leave) {
          let text = groupData.leaveText || "Goodbye @user! 👋\nTersisa {count} member di *{group}*";
          text = text.replace(/@user/g, `@${pNum}`).replace(/{group}/g, gName).replace(/{count}/g, count);
          try {
            await sock.sendMessage(id, { image: { url: ppUrl }, caption: text, mentions: [pJid] });
          } catch {
            await sock.sendMessage(id, { text, mentions: [pJid] });
          }
        }
      }
    } catch (err) {
      console.error("[group-participants.update] Error:", err.message);
    }
  });

  sock.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
      if (!update.id) continue;
      try {
        const metadata = await sock.groupMetadata(update.id).catch(() => null);
        if (metadata) {
          cacheParticipantLids(metadata.participants ?? []);
          global.groupMetadataCache.set(update.id, metadata);
        }
      } catch {}
    }
  });

  setInterval(async () => {
    const now    = Date.now();
    const groups = global.db.groups ?? {};

    for (const [groupId, gdata] of Object.entries(groups)) {
      if (!gdata.sewa) continue;
      if (gdata.sewa.expiry > now) continue;
      if (gdata.sewa.notified) continue;

      try {
        await sock.sendMessage(groupId, {
          text:
            `⏰ *MASA SEWA TELAH HABIS*\n\n` +
            `Masa sewa bot di grup ini telah berakhir.\n` +
            `Hubungi owner untuk perpanjang sewa.\n\n` +
            `📞 Owner: wa.me/${global.owner}\n\n` +
            `Bot akan keluar dalam 10 detik...`,
        });
      } catch {}

      gdata.sewa.notified = true;
      global.db.groups[groupId] = gdata;

      setTimeout(async () => {
        try { await sock.groupLeave(groupId); } catch {}
        if (global.db.groups[groupId]?.sewa) {
          delete global.db.groups[groupId].sewa;
        }
      }, 10000);
    }
  }, 60000);

  setInterval(() => {
    const now = moment().tz("Asia/Jakarta").format("HH:mm");
    for (const [gid, gdata] of Object.entries(global.db.groups ?? {})) {
      if (!gdata.schedule) continue;
      if (gdata.schedule.autoOpen === now) {
        sock.groupSettingUpdate(gid, "not_announcement").catch(() => {});
        sock.sendMessage(gid, { text: `🔓 *AUTO OPEN*\nGrup dibuka otomatis pukul ${now} WIB` }).catch(() => {});
      }
      if (gdata.schedule.autoClose === now) {
        sock.groupSettingUpdate(gid, "announcement").catch(() => {});
        sock.sendMessage(gid, { text: `🔒 *AUTO CLOSE*\nGrup ditutup otomatis pukul ${now} WIB` }).catch(() => {});
      }
    }
  }, 60000);

  return sock;
}

const sock = await StartBot();
startAutoDeletePanel(sock);
startAutoBackup(sock);
