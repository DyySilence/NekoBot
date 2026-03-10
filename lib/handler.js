/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import "../set/config.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { uploadImageBuffer, CatBox } from "./tourl.js";
import LoadDataBase from "./load_database.js";
import logger from "./logger.js";
import {
  resolveAnyLidToJid,
  convertLidArray,
  getParticipantJid,
  cacheParticipantLids,
  decodeJid,
  isLid,
} from "./serialize.js";
import { runNeko } from "../plugins/ai/neko.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const __root     = path.resolve(__dirname, "..");

global.uploadImageBuffer = uploadImageBuffer;
global.CatBox            = CatBox;
global.qtext             = null;

const plugins = new Map();
const cmdList  = [];

function getPluginFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) files = files.concat(getPluginFiles(fullPath));
    else if (item.name.endsWith(".js")) files.push(fullPath);
  }
  return files;
}

async function loadPlugins() {
  const pluginDir = path.join(__root, "plugins");
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
    return;
  }
  const files = getPluginFiles(pluginDir);
  for (const file of files) {
    try {
      const url = pathToFileURL(file);
      url.searchParams.set("t", Date.now().toString());
      const mod     = await import(url.href);
      const handler = mod.default;
      if (!handler || !Array.isArray(handler.command)) continue;
      const rel       = path.relative(pluginDir, file);
      const parts     = rel.split(path.sep);
      const folderCat = parts.length > 1 ? parts[0] : parts[0].replace(".js", "");
      if (!handler.category) handler.category = folderCat;
      handler.__file = file;
      for (const cmd of handler.command) plugins.set(cmd, handler);
      cmdList.push({ name: handler.command[0], category: handler.category, isOwner: !!handler.owner, __file: file });
    } catch (e) {
      logger.error(`[Plugin Error] ${path.relative(__root, file)}`, e);
    }
  }
  logger.success(`Loaded ${plugins.size} commands from ${files.length} plugin files`);
}

export const dbHelper = {
  getStatsInfo() {
    const totalHits  = global.db?.settings?.hits ?? 0;
    const totalChats = Object.keys(global.db?.users ?? {}).length + Object.keys(global.db?.groups ?? {}).length;
    return { totalHits, totalChats };
  },
};

const nekoDb = {
  read:  (key) => global.db?.settings?.[key] ?? null,
  write: (key, val) => {
    if (!global.db.settings) global.db.settings = {};
    global.db.settings[key] = val;
  },
};

const nekoConfig = () => ({
  botName:    global.botName    || "NekoBot",
  namaOwner:  global.namaOwner  || "DyySilence",
  owner:      global.owner      || "6283853142299",
  websiteUrl: global.websiteUrl || "https://www.dyysilence.biz.id",
  prefix:     [global.prefix    || "."],
  geminiKeys: global.geminiKeys || (global.geminiKey ? [global.geminiKey] : []),
  geminiKey:  global.geminiKey  || "",
});

const ensureGroup = (chat) => {
  if (!global.db.groups[chat]) global.db.groups[chat] = {};
  return global.db.groups[chat];
};

const ensureUser = (jid) => {
  if (!global.db.users[jid]) global.db.users[jid] = {};
  const u = global.db.users[jid];
  if (typeof u.coin !== "number") u.coin = 0;
  if (typeof u.exp  !== "number") u.exp  = 0;
  if (!u.gameStats) u.gameStats = { wins: 0, losses: 0 };
  return u;
};

const trackStats = (m) => {
  if (!m.isGroup || m.fromMe) return;
  const g = ensureGroup(m.chat);
  if (!g.stats) g.stats = {};
  const num = m.sender.replace(/[^0-9]/g, "");
  if (!g.stats[num]) g.stats[num] = { count: 0, name: m.pushName ?? "" };
  g.stats[num].count++;
  if (m.pushName && m.pushName.trim()) g.stats[num].name = m.pushName.trim();
  if (!g.hourlyStats) g.hourlyStats = {};
  const hour = new Date().getHours();
  g.hourlyStats[hour] = (g.hourlyStats[hour] || 0) + 1;
  if (!g.statsSince) g.statsSince = Date.now();
  global.db.groups[m.chat] = g;
};

export const cacheMemberNames = (chat, participants = []) => {
  if (!chat || !participants.length) return;
  const g = ensureGroup(chat);
  if (!g.memberNames) g.memberNames = {};
  for (const p of participants) {
    const jid = p.jid || p.id || "";
    const num = jid.replace(/@.*$/, "").replace(/[^0-9]/g, "");
    if (!num) continue;
    const name = p.notify?.trim() || p.name?.trim() || p.verifiedName?.trim() || "";
    if (name) g.memberNames[num] = name;
  }
  global.db.groups[chat] = g;
};

const checkAFK = async (m, conn) => {
  if (m.fromMe) return;
  const ud = ensureUser(m.sender);
  if (ud.afk) {
    const dur  = Date.now() - ud.afk.time;
    const hrs  = Math.floor(dur / 3600000);
    const mins = Math.floor((dur % 3600000) / 60000);
    const secs = Math.floor((dur % 60000) / 1000);
    let ts = "";
    if (hrs  > 0) ts += `${hrs} jam `;
    if (mins > 0) ts += `${mins} menit `;
    if (secs > 0) ts += `${secs} detik`;
    delete ud.afk;
    global.db.users[m.sender] = ud;
    await m.reply(`✅ *${m.pushName || "Kamu"} sudah tidak AFK!*\n\n🕐 Durasi AFK: ${ts.trim() || "< 1 detik"}`);
  }
  const mentions = [...(m.mentionedJid ?? [])];
  if (m.quoted?.sender) mentions.push(m.quoted.sender);
  for (const jid of mentions) {
    const norm  = jid.replace(/:\d+/, "").split("@")[0] + "@s.whatsapp.net";
    const uData = global.db.users[norm] ?? global.db.users[jid] ?? null;
    if (!uData?.afk) continue;
    const dur  = Date.now() - uData.afk.time;
    const hrs  = Math.floor(dur / 3600000);
    const mins = Math.floor((dur % 3600000) / 60000);
    let ts = "";
    if (hrs  > 0) ts += `${hrs} jam `;
    if (mins > 0) ts += `${mins} menit`;
    await conn.sendMessage(m.chat, {
      text: `💤 *User Sedang AFK*\n\n👤 @${norm.split("@")[0]}\n📝 Alasan: ${uData.afk.reason}\n🕐 Sejak: ${ts.trim() || "< 1 menit"} lalu`,
      mentions: [norm],
    }, { quoted: m.fakeObj || m });
    break;
  }
};

function isForwardFromNewsletter(m) {
  const msg = m.message;
  if (!msg) return false;

  const checkContextInfo = (ctx) =>
    !!(ctx?.forwardedNewsletterMessageInfo ||
      (ctx?.forwardingScore > 0 && ctx?.forwardedNewsletterMessageInfo));

  const allTypes = [
    msg.extendedTextMessage,
    msg.imageMessage,
    msg.videoMessage,
    msg.audioMessage,
    msg.documentMessage,
    msg.stickerMessage,
    msg.ephemeralMessage?.message?.extendedTextMessage,
    msg.ephemeralMessage?.message?.imageMessage,
    msg.ephemeralMessage?.message?.videoMessage,
    msg.viewOnceMessage?.message?.imageMessage,
    msg.viewOnceMessage?.message?.videoMessage,
  ];

  for (const node of allTypes) {
    if (node?.contextInfo && checkContextInfo(node.contextInfo)) return true;
  }

  const allContextInfos = [];
  const walk = (obj, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 6) return;
    if (obj.forwardedNewsletterMessageInfo) { allContextInfos.push(obj); return; }
    for (const val of Object.values(obj)) walk(val, depth + 1);
  };
  walk(msg);

  return allContextInfos.length > 0;
}

const enforceGroupRules = async (m, conn) => {
  if (!m.isGroup || m.fromMe || m.isAdmin || m.isOwner) return false;
  const g = ensureGroup(m.chat);

  if (g.antilink && m.body?.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)) {
    try { await conn.sendMessage(m.chat, { delete: m.key }); } catch {}
    return true;
  }

  if (g.antilinkAll && m.body?.match(/https?:\/\//i)) {
    try { await conn.sendMessage(m.chat, { delete: m.key }); } catch {}
    return true;
  }

  if (g.antilinkCustom_enabled && Array.isArray(g.antilinkCustom) && g.antilinkCustom.length) {
    const body    = (m.body || "").toLowerCase();
    const matched = g.antilinkCustom.some((pola) => body.includes(pola.toLowerCase()));
    if (matched) {
      try { await conn.sendMessage(m.chat, { delete: m.key }); } catch {}
      return true;
    }
  }

  if (g.antiforward && isForwardFromNewsletter(m)) {
    try { await conn.sendMessage(m.chat, { delete: m.key }); } catch {}
    return true;
  }

  const antimedia = g.antimedia ?? {};
  const typeMap   = {
    imageMessage: "image", videoMessage: "video", audioMessage: "audio",
    stickerMessage: "sticker", documentMessage: "document",
  };
  const mediaType = typeMap[m.mtype];
  if (mediaType && antimedia[mediaType]) {
    try { await conn.sendMessage(m.chat, { delete: m.key }); } catch {}
    return true;
  }

  return false;
};

function resolveGroupAdmins(participants = []) {
  cacheParticipantLids(participants);
  return participants
    .filter((p) => p.admin !== null && p.admin !== undefined)
    .map((p) => getParticipantJid(p));
}

function isAdminInParticipants(jid, participants = []) {
  if (!jid || !participants.length) return false;
  const num = jid.replace(/[^0-9]/g, "");
  if (!num) return false;
  return participants.some((p) => {
    if (!p.admin) return false;
    const ids = [p.id, p.jid, p.lid].filter(Boolean);
    return ids.some((id) => id.replace(/[^0-9]/g, "") === num);
  });
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getSuggestions(input, allCommands, maxResults = 3) {
  const threshold = Math.max(2, Math.floor(input.length / 2));
  return allCommands
    .map((cmd) => ({ cmd, dist: levenshtein(input, cmd) }))
    .filter(({ dist }) => dist <= threshold)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxResults)
    .map(({ cmd }) => cmd);
}

async function sendDidYouMean(sock, m, wrongCommand, suggestions) {
  if (!suggestions.length) return;

  const { generateWAMessageFromContent, proto } = await import("baileys");

  const buttons = suggestions.map((cmd) => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: `${global.prefix}${cmd}`,
      id: `${global.prefix}${cmd}`,
    }),
  }));

  try {
    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `❓ *Command tidak ditemukan!*\n\n🔍 Command: \`${global.prefix}${wrongCommand}\`\n\n💡 Mungkin maksud kamu:`,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: `Pilih salah satu atau ketik ${global.prefix}menu`,
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "🤖 Sepertinya ada yang salah",
                hasMediaAttachment: false,
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons,
              }),
            }),
          },
        },
      }),
      { quoted: m.fakeObj || m }
    );
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch {
    const suggestionText = suggestions
      .map((cmd, i) => `${i + 1}. ${global.prefix}${cmd}`)
      .join("\n");
    await m.reply(
      `❓ *Command tidak ditemukan!*\n\n` +
      `🔍 Command: \`${global.prefix}${wrongCommand}\`\n\n` +
      `💡 Mungkin maksud kamu:\n${suggestionText}\n\n` +
      `📋 Ketik ${global.prefix}menu untuk melihat semua command`
    );
  }
}

const _normalizeAnswer = (str = "") =>
  str.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, " ");

const _isAnswerCorrect = (input, answer) => {
  const norm = _normalizeAnswer(input);
  return Array.isArray(answer)
    ? answer.some((a) => _normalizeAnswer(a) === norm)
    : _normalizeAnswer(answer) === norm;
};

const _getGameSession = (chat) => {
  const g = global.db.groups[chat];
  if (!g?.gameSession) return null;
  if (g.gameSession.expiry && Date.now() > g.gameSession.expiry) {
    delete g.gameSession;
    global.db.groups[chat] = g;
    return null;
  }
  return g.gameSession;
};

const _deleteGameSession = (chat) => {
  if (global.db.groups[chat]) {
    delete global.db.groups[chat].gameSession;
  }
};

const checkGameAnswer = async (m, conn, participants = []) => {
  if (!m.isGroup || m.fromMe || !m.body?.trim()) return false;

  const sesi = _getGameSession(m.chat);
  if (!sesi) return false;
  if (!_isAnswerCorrect(m.body, sesi.answer)) return false;

  const dbKey  = m.sender;
  const u      = ensureUser(dbKey);
  const reward = sesi.reward ?? { coin: 100, exp: 50 };

  u.coin += reward.coin;
  u.exp  += reward.exp ?? 0;
  u.gameStats.wins = (u.gameStats.wins || 0) + 1;
  global.db.users[dbKey] = u;

  _deleteGameSession(m.chat);

  const mentionJid = resolveAnyLidToJid(m.sender, participants) || m.sender;
  const winnerNum  = mentionJid.split("@")[0];
  const answer     = Array.isArray(sesi.answer) ? sesi.answer[0] : sesi.answer;

  await conn.sendMessage(m.chat, {
    text:
      `> 🎉 *JAWABAN BENAR!*\n>\n` +
      `> 👤 @${winnerNum}\n` +
      `> ✅ Jawaban: *${answer}*\n>\n` +
      `> 💰 *REWARD:*\n` +
      `> 💵 +${reward.coin} coin → Total: ${u.coin}\n` +
      `> ⭐ +${reward.exp ?? 0} exp\n>\n` +
      `> 🏆 Wins: ${u.gameStats.wins}`,
    mentions: [mentionJid],
  }, { quoted: m.fakeObj || m });

  await m.react("🎉");
  return true;
};

const checkAutoRespon = async (m, conn) => {
  if (m.fromMe) return;
  const db    = m.isGroup
    ? global.db.groups?.[m.chat]
    : global.db.users?.[m.sender];
  const store = db?.autoRespon;
  if (!store || !Object.keys(store).length) return;

  const body = (m.body || "").toLowerCase().trim();
  if (!body) return;

  for (const [keyword, respon] of Object.entries(store)) {
    const kw    = keyword.toLowerCase();
    const words = body.split(/[\s.,!?;:'"-]+/);
    if (!words.includes(kw)) continue;

    try {
      if (respon.mediaUrl && respon.mediaKey) {
        const { default: axios } = await import("axios");
        const dlRes    = await axios.get(respon.mediaUrl, { responseType: "arraybuffer", timeout: 30000 });
        const mediaBuf = Buffer.from(dlRes.data);
        const payload  = { [respon.mediaKey]: mediaBuf };
        if (respon.caption)  payload.caption  = respon.caption;
        if (respon.mimetype) payload.mimetype  = respon.mimetype;
        if (respon.filename) payload.fileName  = respon.filename;
        if (respon.mediaKey === "audio") payload.ptt = !!(respon.ptt);
        await conn.sendMessage(m.chat, payload, { quoted: m.fakeObj || m });
      } else if (respon.text) {
        await conn.sendMessage(m.chat, { text: respon.text }, { quoted: m.fakeObj || m });
      }
    } catch (e) {
      console.error("[AutoRespon]", e.message);
    }
    break;
  }
};

await loadPlugins();

function watchPlugins() {
  const pluginDir = path.join(__root, "plugins");
  if (!fs.existsSync(pluginDir)) return;

  fs.watch(pluginDir, { recursive: true }, async (eventType, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const fullPath = path.join(pluginDir, filename);
    const existed  = fs.existsSync(fullPath);

    for (const [cmd, h] of plugins.entries()) {
      if (h.__file === fullPath) plugins.delete(cmd);
    }
    const idx = cmdList.findIndex((c) => c.__file === fullPath);
    if (idx !== -1) cmdList.splice(idx, 1);

    if (!existed) {
      logger.warning(`[HotReload] Plugin dihapus: ${filename}`);
      return;
    }

    try {
      const url = pathToFileURL(fullPath);
      url.searchParams.set("t", Date.now().toString());
      const mod     = await import(url.href);
      const handler = mod.default;
      if (!handler || !Array.isArray(handler.command)) return;

      const rel       = path.relative(pluginDir, fullPath);
      const parts     = rel.split(path.sep);
      const folderCat = parts.length > 1 ? parts[0] : parts[0].replace(".js", "");
      if (!handler.category) handler.category = folderCat;

      handler.__file = fullPath;
      for (const cmd of handler.command) plugins.set(cmd, handler);
      cmdList.push({ name: handler.command[0], category: handler.category, isOwner: !!handler.owner, __file: fullPath });

      logger.success(`[HotReload] Plugin di-reload: ${filename} (${handler.command.join(", ")})`);
    } catch (e) {
      logger.error(`[HotReload] Gagal reload ${filename}`, e);
    }
  });

  logger.info(`[HotReload] Watching plugin changes di: ${pluginDir}`);
}

watchPlugins();

export default async (sock, m) => {
  await LoadDataBase(sock, m);
  const hasPrefix = m?.body?.startsWith(global.prefix);
  let isCmd    = false;
  let command  = "";
  let args     = [];
  let text     = "";
  let cmd      = "";

  if (hasPrefix) {
    isCmd   = true;
    command = m.body.slice(global.prefix.length).trim().split(" ").shift().toLowerCase();
    args    = m.body.trim().split(/ +/).slice(1);
    text    = args.join(" ");
    cmd     = global.prefix + command;
  } else if (m?.body?.trim()) {
    const firstWord = m.body.trim().split(" ")[0].toLowerCase();
    if (plugins.has(firstWord)) {
      const senderNum    = (m.senderNumber || m.sender || "").replace(/[^0-9]/g, "");
      const ownerNum     = (global.owner || "").replace(/[^0-9]/g, "");
      const botNum       = (sock.user?.id || "").split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
      const isOwnerOrBot = (ownerNum && senderNum === ownerNum) || (!m.isGroup && botNum && senderNum === botNum);

      if (isOwnerOrBot) {
        isCmd   = true;
        command = firstWord;
        args    = m.body.trim().split(/ +/).slice(1);
        text    = args.join(" ");
        cmd     = command;
      }
    }
  }

  const quoted = m.quoted ?? m;
  const mime   = quoted?.msg?.mimetype ?? quoted?.mimetype ?? null;
  const qmsg   = m.quoted ?? m;

  let metadata = m.isGroup ? (global.groupMetadataCache?.get(m.chat) ?? {}) : {};
  if (m.isGroup && !metadata?.participants?.length) {
    try {
      const fetched = await sock.groupMetadata(m.chat);
      if (fetched?.participants) {
        cacheParticipantLids(fetched.participants);
        global.groupMetadataCache.set(m.chat, fetched);
        metadata = fetched;
      }
    } catch {}
  }

  const participants = metadata?.participants ?? [];
  cacheParticipantLids(participants);

  if (m.isGroup && participants.length) {
    cacheMemberNames(m.chat, participants);
  }

  const admins  = resolveGroupAdmins(participants);
  m.isAdmin     = m.isGroup ? isAdminInParticipants(m.sender, participants) : false;
  m.isBotAdmin  = m.isGroup ? isAdminInParticipants(m.botNumber, participants) : false;

  logger.message(
    m.isGroup ? (metadata.subject ?? m.chat.split("@")[0]) : m.sender.split("@")[0],
    m.pushName || m.sender.split("@")[0],
    m.mtype || "unknown",
    m.body || "[Media]",
    m.isGroup
  );

  if (isCmd) {
    const chatName = m.isGroup ? (metadata.subject ?? m.chat.split("@")[0]) : "Private Chat";
    logger.command(cmd, m.pushName || m.sender.split("@")[0], m.sender.split("@")[0], chatName, m.isGroup);
    if (global.db?.settings) global.db.settings.hits = (global.db.settings.hits ?? 0) + 1;
  }

  if (!m.fromMe) {
    trackStats(m);
    await checkAFK(m, sock);
    const blocked = await enforceGroupRules(m, sock);
    if (blocked) return;
  }

  const mode = global.db?.settings?.mode ?? "public";
  if (!m.isOwner) {
    if (mode === "self") return;
    if (mode === "onlygc" && !m.isGroup) return;
    if (mode === "onlypc" &&  m.isGroup) return;
  }

  if (m.isGroup && !m.isOwner && global.db.groups?.[m.chat]?.banchat) return;

  if (!m.fromMe && !isCmd) {
    const handled = await checkGameAnswer(m, sock, participants);
    if (handled) return;
    await checkAutoRespon(m, sock);

    const nekoHandled = await runNeko(sock, m, nekoConfig(), nekoDb).catch((e) => {
      console.error("[Neko] Error:", e.message);
      return false;
    });
    if (nekoHandled) return;
  }

  if (!isCmd) return;

  if (!plugins.has(command)) {
    if (command && hasPrefix) {
      const allCmds     = [...plugins.keys()];
      const suggestions = getSuggestions(command, allCmds);
      await sendDidYouMean(sock, m, command, suggestions);
    }
    return;
  }

  const handler = plugins.get(command);

  if (m.fromMe && m.isGroup) {
  const botNum = (sock.user?.id || "").split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
  const SELF_PROTECT = ["kick","demote"];
  if (SELF_PROTECT.includes(command)) {
    const targetNum = (args[0] || "").replace(/[^0-9]/g, "");
    if (targetNum && targetNum === botNum) return;
  }
}

  if (handler.owner    && !m.isOwner)                              return m.reply(global.mess?.owner    ?? "Owner only!");
  if (handler.premium  && !global.db?.users?.[m.sender]?.premium) return m.reply(global.mess?.premium  ?? "Premium only!");
  if (handler.group    && !m.isGroup)                              return m.reply(global.mess?.group    ?? "Group only!");
  if (handler.private  &&  m.isGroup)                              return m.reply(global.mess?.private  ?? "Private only!");
  if (handler.admin    && !m.isAdmin)                              return m.reply(global.mess?.admin    ?? "Admin only!");
  if (handler.botAdmin && !m.isBotAdmin)                           return m.reply(global.mess?.botadmin ?? "Bot must be admin!");

  try {
    await handler(m, {
      conn:     sock,
      args,
      text,
      cmd,
      command,
      mime,
      qmsg,
      quoted,
      isOwner:  m.isOwner,
      metadata,
      admins,
      participants,
      commands: cmdList,
      db:       dbHelper,
      resolveAnyLidToJid: (jid) => resolveAnyLidToJid(jid, participants),
      convertLidArray:    (arr)  => convertLidArray(arr, participants),
      getParticipantJid,
    });
  } catch (err) {
    logger.error(`Command execution error (${command})`, err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

export { plugins, cmdList };
