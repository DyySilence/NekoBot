/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

process.on("uncaughtException",  (err) => console.error("[uncaughtException]", err.message));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err?.message ?? err));

import "./lib/function.js";
import "./set/config.js";
import {
  default as makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
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
import { startAutoDeletePanel } from "./plugins/panel/autoDeletePanel.js";
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
import { startAutoBackup } from "./plugins/owner/autoBackup.js";
import { startSholatNotifier } from "./plugins/islamic/notifsholat.js";
import { startGempaNotifier } from "./plugins/info/gempaNotifier.js";
import { startCuacaEkstremNotifier } from "./plugins/info/cuacaEkstremNotifier.js";
import { startAnimeNotifier } from "./plugins/anime/animeNotifier.js";

const MAX_DELETED_CACHE = 500;
const deletedMsgCache   = new Map();
const database = new DataBase();

function deletedCacheSet(id, msg) {
  if (deletedMsgCache.size >= MAX_DELETED_CACHE)
    deletedMsgCache.delete(deletedMsgCache.keys().next().value);
  deletedMsgCache.set(id, msg);
}

global.groupMetadataCache = new Map();
global.statusStore        = new Map();
const BOT_START_TS        = Math.floor(Date.now() / 1000);

const loadDb = async () => {
  const load = (await database.read()) ?? {};
  global.db = {
    users:       load.users       ?? {},
    groups:      load.groups      ?? {},
    settings:    load.settings    ?? {},
    statusStore: load.statusStore ?? {},
  };
  for (const [key, val] of Object.entries(global.db.statusStore)) {
    if (Array.isArray(val) && val.length) global.statusStore.set(key, val);
  }
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

function isMuted(groupId, senderNum) {
  return (global.db.groups?.[groupId]?.muted ?? {})[senderNum] === true;
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
  if (resolved?.endsWith("@s.whatsapp.net")) return resolved;
  if (rawJid.endsWith("@lid")) return lidToJid(rawJid);
  return rawJid;
}

function syncStatusStoreToDb() {
  if (!global.db.statusStore) global.db.statusStore = {};
  for (const [k, v] of global.statusStore.entries()) global.db.statusStore[k] = v;
}

let _reconnecting  = false;
let _retryCount    = 0;
let _activeTimers  = [];

function clearActiveTimers() {
  for (const t of _activeTimers) clearInterval(t);
  _activeTimers = [];
}

function trackInterval(fn, ms) {
  const t = setInterval(fn, ms);
  _activeTimers.push(t);
  return t;
}

function scheduleReconnect() {
  if (_reconnecting) return;
  _reconnecting = true;
  _retryCount++;

  clearActiveTimers();

  const delay = Math.min(3000 * 2 ** Math.min(_retryCount - 1, 5), 60_000);
  console.log(chalk.yellow(`► Reconnect dalam ${delay / 1000}s... (percobaan ke-${_retryCount})`));

  setTimeout(async () => {
    _reconnecting = false;
    try {
      await StartBot();
    } catch (err) {
      console.log(chalk.red(`✖ Reconnect gagal: ${err.message}`));
      scheduleReconnect();
    }
  }, delay);
}

async function StartBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version }          = await fetchLatestBaileysVersion();

  const store = makeInMemoryStore({});

  const sock = makeWASocket({
    version,
    logger:              Pino({ level: "silent" }),
    browser:             Browsers.ubuntu("Safari"),
    auth:                state,
    printQRInTerminal:   false,
    syncFullHistory:     false,
    keepAliveIntervalMs: 15_000,
    retryRequestDelayMs: 2_000,
    maxMsgRetryCount:    5,
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
    const num = (global.pairingNumber || "").trim();
    console.log(chalk.cyan(`┌─ Pairing Mode`));
    console.log(chalk.cyan(`│  Nomor : ${num}`));
    console.log(chalk.cyan(`└─ Meminta kode pairing...`));

    const requestCode = async (attempt = 1) => {
      try {
        await new Promise((r) => setTimeout(r, 3000));
        const code = await sock.requestPairingCode(num, "DYYXYZZ1");
        console.log(chalk.green(`┌─ Kode Pairing Berhasil`));
        console.log(chalk.green(`│  Kode  : ${code}`));
        console.log(chalk.green(`└─ Masukkan kode di WhatsApp → Tautkan Perangkat`));
      } catch (e) {
        console.log(chalk.red(`│  Gagal (percobaan ${attempt}): ${e.message}`));
        if (attempt < 3) {
          console.log(chalk.yellow(`└─ Mencoba ulang dalam 5 detik...`));
          await new Promise((r) => setTimeout(r, 5000));
          return requestCode(attempt + 1);
        }
        console.log(chalk.red(`└─ Pairing gagal setelah ${attempt}x percobaan. Restart bot.`));
      }
    };

    requestCode();
  }

  sock.ev.on("creds.update", saveCreds);

  sock.decodeJid  = (jid) => decodeJid(jid);
  sock.resolveJid = (jid, participants = []) => resolveAnyLidToJid(jid, participants);

  sock.toLid = async (jid) => {
    if (!jid) return jid;
    const decoded = decodeJid(jid);
    if (isLid(decoded)) return decoded;
    const cached = resolveAnyLidToJid(decoded, []);
    if (cached === decoded) return jidToLid(decoded);
    return isLid(cached) ? cached : jidToLid(decoded);
  };

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
    if (Buffer.isBuffer(input))                      buff = input;
    else if (/^data:.*?\/.*?;base64,/i.test(input)) buff = Buffer.from(input.split(",")[1], "base64");
    else if (/^https?:\/\//.test(input)) {
      const { default: fetch } = await import("node-fetch");
      buff = Buffer.from(await (await fetch(input)).arrayBuffer());
    } else if (fs.existsSync(input))                 buff = fs.readFileSync(input);
    else                                              buff = Buffer.alloc(0);

    const opt    = { packname: options.packname || global.namaOwner || "DyySilence", author: options.author || global.dev || "© 2026" };
    const isVid  = buff[0] === 0x00 || buff.toString("ascii", 4, 8) === "ftyp";
    const buffer = isVid ? await videoToWebp(buff, opt) : await imageToWebp(buff, opt);
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
        messageSecret:      crypto.randomBytes(32),
        messageAssociation: { associationType: 1, parentMessageKey: album.key },
        participant:        "0@s.whatsapp.net",
        remoteJid:          "status@broadcast",
        forwardingScore:    99999,
        isForwarded:        true,
        mentionedJid:       [jid],
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

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key?.id) deletedCacheSet(msg.key.id, msg);

      if (msg.key?.remoteJid === "status@broadcast" && msg.message) {
        const sender = msg.participant || msg.key?.participant || "";
        if (sender && sender !== "status@broadcast") {
          const senderNum = sender.replace(/[^0-9]/g, "");
          const keys = [
            sender,
            sender.endsWith("@lid")
              ? sender.replace("@lid", "@s.whatsapp.net")
              : sender.replace("@s.whatsapp.net", "@lid"),
            senderNum + "@s.whatsapp.net",
            senderNum + "@lid",
          ].filter((k, i, arr) => k && arr.indexOf(k) === i);

          for (const key of keys) {
            if (!global.statusStore.has(key)) global.statusStore.set(key, []);
            const arr = global.statusStore.get(key);
            arr.push(msg);
            if (arr.length > 20) arr.shift();
            global.statusStore.set(key, arr);
          }
          syncStatusStoreToDb();
        }
      }
    }

    const msg = messages[0];
    if (!msg?.message) return;

    const msgTs = Number(msg.messageTimestamp ?? 0);
    if (msgTs && msgTs < BOT_START_TS) return;

    const m = await serialize(sock, msg);
    if (!m || m.isBaileys) return;

    if (m.isGroup && !m.fromMe) {
      const groupId   = m.chat;
      const groupData = global.db.groups?.[groupId] ?? {};

      if (groupData.antitagsw) {
        const isStatusMention = !!msg.message?.groupStatusMentionMessage || m.mtype === "groupStatusMentionMessage";

        if (isStatusMention) {
          const participants = global.groupMetadataCache.get(groupId)?.participants ?? [];
          cacheParticipantLids(participants);
          const rawSender  = msg.key?.participant || m.sender || "";
          const realSender = resolveSenderToPhone(rawSender, participants);
          const senderNum  = realSender.replace(/@.*$/, "").replace(/[^0-9]/g, "");
          const senderJid  = senderNum ? `${senderNum}@s.whatsapp.net` : realSender;
          const isAdmin    = participants.some((p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === senderNum);
          const isOwner    = (global.owner || "").replace(/[^0-9]/g, "") === senderNum;

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
                  text: `🚫 *ANTI TAG STATUS WA*\n\n👤 @${senderNum} sudah 3x mention @status\n❌ Pesan dihapus & member di-*KICK*!`,
                  mentions: [senderJid],
                });
              } catch {
                await sock.sendMessage(groupId, {
                  text: `🚫 *ANTI TAG STATUS*\n\n⚠️ Warning ${wCount}/3\n👤 @${senderNum} mention @status — gagal kick, pastikan bot admin!`,
                  mentions: [senderJid],
                });
              }
            } else {
              await sock.sendMessage(groupId, {
                text: `🚫 *ANTI TAG STATUS*\n\n👤 @${senderNum} mention @status!\n❌ Pesan dihapus\n⚠️ Warning: ${wCount}/3\n${3 - wCount} warn lagi → di-kick!`,
                mentions: [senderJid],
              });
            }
            return;
          }
        }
      }
    }

    if (m.isGroup && !m.fromMe) {
      const participants = global.groupMetadataCache.get(m.chat)?.participants ?? [];
      cacheParticipantLids(participants);
      const senderNum  = m.senderNumber || "";
      const isAdmin    = participants.some((p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === senderNum);
      if (!isAdmin && !m.isOwner && isMuted(m.chat, senderNum)) {
        const botNum     = (sock.user?.id || "").split(":")[0].split("@")[0];
        const isBotAdmin = participants.some((p) => p.admin && (p.jid || p.id || p.lid || "").replace(/[^0-9]/g, "") === botNum);
        if (isBotAdmin) {
          await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
          return;
        }
      }
    }

    if (m.isGroup && !m.fromMe) await reactToNewMessage(sock, m.chat, m.key);

    await messageHandler(sock, m);
  });

  sock.ev.on("messages.update", async (updates) => {
    for (const { key, update } of updates) {
      try {
        const isDeleted =
          update.message?.protocolMessage?.type === 0 ||
          !!update.message?.protocolMessage?.key  ||
          update.message === null;
        if (!isDeleted) continue;

        const jid       = key.remoteJid;
        const isGroup   = jid?.endsWith("@g.us");
        const isPrivate = jid?.endsWith("@s.whatsapp.net");
        if (!isGroup && !isPrivate) continue;

        const antideleteOn = isGroup
          ? !!(global.db.groups?.[jid]?.antidelete)
          : !!(global.db.users?.[jid]?.antidelete);
        if (!antideleteOn) continue;

        const cached = deletedMsgCache.get(key.id);
        if (!cached?.message || cached.key?.fromMe) continue;

        const cachedTs = Number(cached.messageTimestamp ?? 0);
        if (cachedTs && cachedTs < BOT_START_TS) continue;

        const senderJid = key.participant || cached.key?.participant || (isPrivate ? jid : "");
        const senderNum = senderJid.replace(/[^0-9]/g, "");
        const mtype     = Object.keys(cached.message).find(
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
            await sock.sendMessage(jid, { image: { url: content.url }, caption: `${header}${content.caption || ""}`, mentions });
          } else if (mtype === "videoMessage") {
            await sock.sendMessage(jid, { video: { url: content.url }, caption: `${header}${content.caption || ""}`, mentions });
          } else if (mtype === "audioMessage") {
            await sock.sendMessage(jid, { audio: { url: content.url }, ptt: content.ptt ?? false, mentions });
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
        } catch (err) {
          console.error("[antidelete] Gagal kirim:", err.message);
        }

        deletedMsgCache.delete(key.id);
      } catch (err) {
        console.error("[antidelete] Error:", err.message);
      }
    }
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log(chalk.yellow(`┌─ QR Code muncul`));
      console.log(chalk.yellow(`└─ Pastikan pairingNumber sudah diset di config.js`));
    }

    if (connection === "connecting") {
      console.log(chalk.cyan(`► Menghubungkan ke WhatsApp...`));
    }

    if (connection === "open") {
      const num = (sock.user?.id || "").split(":")[0].split("@")[0];
      console.log(chalk.green(`┌─ Bot Tersambung ✓`));
      console.log(chalk.green(`│  Nomor : ${num}`));
      console.log(chalk.green(`│  Name  : ${sock.user?.name || "-"}`));
      console.log(chalk.green(`└─ ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`));

      _retryCount   = 0;
      _reconnecting = false;

      clearActiveTimers();
      registerIntervals(sock);

      startAutoDeletePanel(sock);
      startAutoBackup(sock);
    }

    if (connection === "close") {
      const err  = lastDisconnect?.error;
      const code = err?.output?.statusCode ?? err?.output?.payload?.statusCode;

      console.log(chalk.red(`┌─ Koneksi Terputus`));
      console.log(chalk.red(`│  Code   : ${code ?? "unknown"}`));
      console.log(chalk.red(`└─ Reason : ${err?.message ?? "unknown"}`));

      if (code === DisconnectReason.loggedOut) {
        console.log(chalk.red(`✖ Logged out — hapus folder ./session lalu restart.`));
        process.exit(5);
      }

      if (code === DisconnectReason.badSession) {
        console.log(chalk.red(`✖ Bad session — hapus folder ./session lalu restart.`));
        process.exit(5);
      }

      if (code === DisconnectReason.multideviceMismatch) {
        console.log(chalk.red(`✖ Multidevice mismatch — hapus folder ./session lalu restart.`));
        process.exit(5);
      }

      scheduleReconnect();
    }
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
          let text = (groupData.welcomeText || "Selamat datang @user!\nKamu member ke-{count} di *{group}*\nSemoga betah! 🎉")
            .replace(/@user/g, `@${pNum}`).replace(/{group}/g, gName).replace(/{count}/g, count);
          try { await sock.sendMessage(id, { image: { url: ppUrl }, caption: text, mentions: [pJid] }); }
          catch  { await sock.sendMessage(id, { text, mentions: [pJid] }); }
        }

        if (action === "remove" && groupData.leave) {
          let text = (groupData.leaveText || "Goodbye @user! 👋\nTersisa {count} member di *{group}*")
            .replace(/@user/g, `@${pNum}`).replace(/{group}/g, gName).replace(/{count}/g, count);
          try { await sock.sendMessage(id, { image: { url: ppUrl }, caption: text, mentions: [pJid] }); }
          catch  { await sock.sendMessage(id, { text, mentions: [pJid] }); }
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

  return sock;
}

function registerIntervals(sock) {
  trackInterval(async () => {
    const now = Date.now();
    for (const [groupId, gdata] of Object.entries(global.db.groups ?? {})) {
      if (!gdata.sewa || gdata.sewa.expiry > now || gdata.sewa.notified) continue;
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
      gdata.sewa.notified       = true;
      global.db.groups[groupId] = gdata;
      setTimeout(async () => {
        try { await sock.groupLeave(groupId); } catch {}
        if (global.db.groups[groupId]?.sewa) delete global.db.groups[groupId].sewa;
      }, 10000);
    }
  }, 60_000);

  trackInterval(() => {
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
  }, 60_000);

  trackInterval(() => {
    if (global.groupMetadataCache.size > 300) {
      const keys = [...global.groupMetadataCache.keys()];
      keys.slice(0, keys.length - 300).forEach((k) => global.groupMetadataCache.delete(k));
    }
    if (global.statusStore.size > 100) {
      const keys = [...global.statusStore.keys()];
      keys.slice(0, keys.length - 100).forEach((k) => {
        global.statusStore.delete(k);
        if (global.db.statusStore) delete global.db.statusStore[k];
      });
    }
  }, 3_600_000);
  const sholatTimer = startSholatNotifier(sock);
   _activeTimers.push(sholatTimer);
  const gempaTimer = startGempaNotifier(sock);
   _activeTimers.push(gempaTimer);
  const ekstremTimer = startCuacaEkstremNotifier(sock);
   _activeTimers.push(ekstremTimer);
  const animeTimer = startAnimeNotifier(sock);
   _activeTimers.push(animeTimer);
}

await StartBot();
