/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadContentFromMessage } from "baileys";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeJid(jid) {
  if (!jid) return jid;
  return jid.replace(/:\d+/, "").split("@")[0] + "@s.whatsapp.net";
}

function getUserKey(jid) {
  return normalizeJid(jid);
}

function getSenderIds(m) {
  return [m.key?.participantLid, m.key?.participant, m.sender]
    .filter(Boolean)
    .map((jid) => normalizeJid(jid));
}

function getBotJids(sock) {
  const raw = sock?.user?.id || sock?.user?.jid || "";
  const bot = normalizeJid(raw);
  const botKey = getUserKey(bot);
  return { bot, botKey };
}

function isMentioningBot(m, sock) {
  const botRaw = sock?.user?.id || sock?.user?.jid || "";
  const botNum = botRaw.replace(/:\d+/, "").split("@")[0].replace(/[^0-9]/g, "");
  if (!botNum) return false;

  const list = Array.isArray(m?.mentionedJid) ? m.mentionedJid : [];
  if (list.some((jid) => jid.replace(/[^0-9]/g, "") === botNum)) return true;

  const body = String(m?.text || m?.body || "");
  if (body.includes(`@${botNum}`)) return true;

  return false;
}

function isReplyToBot(m, sock) {
  const botRaw = sock?.user?.id || sock?.user?.jid || "";
  const botNum = botRaw.replace(/:\d+/, "").split("@")[0].replace(/[^0-9]/g, "");
  if (!botNum) return false;

  const q = m?.quoted;
  if (!q) return false;

  const senderNum = String(q.sender || "").replace(/[^0-9]/g, "");
  if (senderNum && senderNum === botNum) return true;

  const fromMe = q.fromMe === true || q.key?.fromMe === true;
  return fromMe;
}

function pickBodyFromMessage(m) {
  return String(m?.text || m?.body || "").trim();
}

function ensureRuntimeState(db) {
  const data = db.read("neko") || {};
  if (!data.active) data.active = {};
  if (!data.sessions) data.sessions = {};
  if (!data.lock) data.lock = {};
  if (!data.translate) data.translate = {};
  return data;
}

function getJakartaTime() {
  const TZ = "Asia/Jakarta";
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: TZ,
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: TZ,
  });
  const hour = parseInt(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: TZ }));
  let greeting = "";
  let prayerHint = "";
  if (hour >= 3 && hour < 5)       { greeting = "Dini hari";    prayerHint = "Waktu sahur & Sholat Subuh sebentar lagi"; }
  else if (hour >= 5 && hour < 12) { greeting = "Pagi";         prayerHint = hour < 6 ? "Waktu Sholat Subuh" : "Selamat pagi! Jangan lupa Sholat Dhuha"; }
  else if (hour >= 12 && hour < 15){ greeting = "Siang";        prayerHint = hour < 13 ? "Waktu Sholat Dzuhur" : "Setelah Dzuhur"; }
  else if (hour >= 15 && hour < 18){ greeting = "Sore";         prayerHint = hour < 16 ? "Waktu Sholat Ashar" : "Menjelang Maghrib"; }
  else if (hour >= 18 && hour < 20){ greeting = "Sore/Malam";   prayerHint = hour < 19 ? "Waktu Sholat Maghrib" : "Waktu Sholat Isya sebentar lagi"; }
  else if (hour >= 20 && hour < 24){ greeting = "Malam";        prayerHint = hour < 21 ? "Waktu Sholat Isya" : "Malam hari, jangan lupa istirahat"; }
  else                              { greeting = "Tengah Malam"; prayerHint = "Waktu istirahat"; }
  return { dateStr, timeStr, hour, greeting, prayerHint };
}

async function detectLanguage(text) {
  const lower = text.toLowerCase().trim();
  if (!lower || lower.length < 3) return "id";

  const javanese = ["aku", "kowe", "iki", "iku", "ora", "ngono", "ngene", "piye", "opo", "sopo", "mau", "wes", "duwe", "nang", "seko", "awakmu", "awakku", "apik", "enak", "gak", "ga", "iya", "iyo", "mantep", "asik", "njir", "njis", "lho", "lha", "ta", "po", "tho", "rek", "cak", "mbak", "mas", "pakde", "bude"];
  const english  = ["the", "is", "are", "was", "were", "have", "has", "had", "will", "would", "can", "could", "should", "may", "might", "do", "does", "did", "i", "you", "he", "she", "it", "we", "they", "what", "where", "when", "why", "how", "who", "my", "your", "his", "her", "our", "their"];
  const sundanese = ["abdi", "urang", "anjeun", "maneh", "eta", "ieu", "teu", "tapi", "jeung", "sareng", "atawa", "oge", "ngan", "mah", "teh", "ari", "lamun", "bari", "keur", "ti", "ka", "di", "na"];

  const words = lower.split(/\s+/);

  let jvScore = 0, enScore = 0, suScore = 0;
  for (const w of words) {
    if (javanese.includes(w)) jvScore++;
    if (english.includes(w)) enScore++;
    if (sundanese.includes(w)) suScore++;
  }

  if (enScore >= 2 || (enScore >= 1 && words.length <= 4)) return "en";
  if (jvScore >= 2 || (jvScore >= 1 && words.length <= 3)) return "jv";
  if (suScore >= 2) return "su";
  return "id";
}

async function translateToIndonesian(text, sourceLang, geminiKey) {
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const langName = { en: "Inggris", jv: "Jawa", su: "Sunda", ar: "Arab", zh: "Mandarin", ko: "Korea", ja: "Jepang", fr: "Prancis", de: "Jerman", es: "Spanyol" };
    const namaLang = langName[sourceLang] || sourceLang;

    const result = await model.generateContent(
      `Terjemahkan teks berikut dari bahasa ${namaLang} ke bahasa Indonesia yang natural dan baku. Hanya balas dengan hasil terjemahannya saja, tanpa penjelasan.\n\nTeks: ${text}`
    );
    const translated = result?.response?.text?.()?.trim();
    return translated || text;
  } catch {
    return text;
  }
}

function hasImageInMessage(m) {
  if (m.isImage || m.isSticker) return true;
  if (m.quoted?.isImage || m.quoted?.isSticker) return true;
  const msg = m.message;
  if (!msg) return false;
  const check = (obj) =>
    !!(obj?.imageMessage || obj?.stickerMessage ||
      obj?.viewOnceMessage?.message?.imageMessage ||
      obj?.viewOnceMessageV2?.message?.imageMessage ||
      obj?.viewOnceMessageV2Extension?.message?.imageMessage ||
      obj?.ephemeralMessage?.message?.imageMessage ||
      obj?.ephemeralMessage?.message?.stickerMessage);
  if (check(msg)) return true;
  if (m.quoted?.message && check(m.quoted.message)) return true;
  return false;
}

async function getImageFromMessage(m) {
  try {
    let mediaMsg = null;
    let contentType = "image";

    if (m.quoted?.isImage) {
      const qMsg = m.quoted.message;
      mediaMsg = qMsg?.imageMessage ||
        qMsg?.viewOnceMessage?.message?.imageMessage ||
        qMsg?.viewOnceMessageV2?.message?.imageMessage ||
        qMsg?.viewOnceMessageV2Extension?.message?.imageMessage ||
        qMsg?.ephemeralMessage?.message?.imageMessage;
    } else if (m.quoted?.isSticker) {
      const qMsg = m.quoted.message;
      mediaMsg = qMsg?.stickerMessage || qMsg?.ephemeralMessage?.message?.stickerMessage;
      contentType = "sticker";
    } else if (m.isImage) {
      const msg = m.message;
      mediaMsg = msg?.imageMessage ||
        msg?.viewOnceMessage?.message?.imageMessage ||
        msg?.viewOnceMessageV2?.message?.imageMessage ||
        msg?.viewOnceMessageV2Extension?.message?.imageMessage ||
        msg?.ephemeralMessage?.message?.imageMessage;
    } else if (m.isSticker) {
      const msg = m.message;
      mediaMsg = msg?.stickerMessage || msg?.ephemeralMessage?.message?.stickerMessage;
      contentType = "sticker";
    }

    if (!mediaMsg) return null;

    let buffer = Buffer.alloc(0);
    try {
      const stream = await downloadContentFromMessage(mediaMsg, contentType);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    } catch {
      return null;
    }

    if (!buffer || buffer.length === 0) return null;

    let mimeType = "image/jpeg";
    if (buffer[0] === 0x89 && buffer[1] === 0x50) mimeType = "image/png";
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) mimeType = "image/gif";
    else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[8] === 0x57) mimeType = "image/webp";
    else if (buffer[0] === 0xFF && buffer[1] === 0xD8) mimeType = "image/jpeg";
    if (contentType === "sticker") mimeType = "image/webp";

    return { buffer, mimeType, base64: buffer.toString("base64") };
  } catch {
    return null;
  }
}

function buildNekoSystemPrompt(config) {
  const { dateStr, timeStr, greeting, prayerHint } = getJakartaTime();
  const botName     = config?.botName   || "NekoBot";
  const ownerName   = config?.namaOwner || "DyySilence";
  const ownerNumber = config?.owner     || "6283853142299";
  const websiteUrl  = config?.websiteUrl || "https://www.dyysilence.biz.id";
  const metaData    = global.db?.settings || {};
  const customLogic = metaData.nekoLogic;

  if (customLogic) {
    return `
WAKTU SEKARANG (Asia/Jakarta):
${dateStr}, ${timeStr} WIB — ${greeting}
${prayerHint}

IDENTITAS BOT:
- Nama: Neko
- Bot WhatsApp bernama "${botName}"
- Owner: ${ownerName} (${ownerNumber})
- Website: ${websiteUrl}

INSTRUKSI CUSTOM:
${customLogic}

KEMAMPUAN:
- Bisa melihat dan menganalisis gambar yang dikirim user
- Jika ada gambar, deskripsikan dan analisis sesuai konteks

MEMORY:
- Kamu memiliki memory percakapan. Riwayat chat ada di history.
- Jika history kosong, katakan "Sepertinya ini awal percakapan kita."

FORMAT RESPON:
Balas hanya dengan teks biasa. Tidak ada prefix apapun.
`.trim();
  }

  return `
IDENTITAS KAMU:
- Nama: Neko
- Kamu adalah AI assistant yang mengendalikan bot WhatsApp bernama "${botName}"
- Owner bot: ${ownerName} (wa.me/${ownerNumber})
- Website: ${websiteUrl}

WAKTU SAAT INI (Asia/Jakarta / WIB):
- Tanggal: ${dateStr}
- Jam: ${timeStr} WIB
- Suasana: ${greeting}
- Info: ${prayerHint}

KEPRIBADIAN:
- Ramah, cerdas, dan natural seperti teman yang asik diajak ngobrol
- Bahasa Indonesia yang santai dan enak dibaca
- Tidak terlalu formal, tidak alay
- Tidak menggunakan emoji kecuali benar-benar kontekstual
- Jawaban ringkas dan padat, tidak bertele-tele

MEMORY & KONTEKS:
- Kamu MEMILIKI memory percakapan. Riwayat chat sebelumnya ada di history.
- Jika user tanya "tadi kita bahas apa" atau sejenisnya, lihat history dan jawab berdasarkan itu
- Jika history kosong, katakan "Sepertinya ini awal percakapan kita."
- Gunakan konteks dari history untuk menjawab lebih akurat dan personal

KEMAMPUAN ANALISIS GAMBAR:
- Kamu bisa melihat dan menganalisis gambar yang dikirim user
- Jika ada gambar tanpa teks: deskripsikan gambar dengan jelas
- Jika ada gambar + pertanyaan: jawab berdasarkan gambar
- Analisis gambar secara detail dan akurat

ATURAN PENTING:
- Balas hanya dengan teks biasa
- Tidak perlu prefix CMD atau NO_CMD
- Satu respon yang natural dan koheren
- Tidak ada kalimat pembuka yang generik seperti "Tentu saja!" atau "Baik!"
- Langsung jawab pertanyaannya
`.trim();
}

async function callGemini(config, prompt, sessionId, st, imageData = null) {
  const keys = Array.isArray(config.geminiKeys) ? config.geminiKeys : (config.geminiKey ? [config.geminiKey] : []);
  if (!keys.length) throw new Error("API Key Gemini belum diset.");

  if (!st.sessions[sessionId]) st.sessions[sessionId] = { history: [] };
  const sess = st.sessions[sessionId];

  const system = buildNekoSystemPrompt(config);
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];
  let lastError = null;

  for (const apiKey of keys) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: system });
        const historyContent = sess.history.slice(-20).map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));
        const chat = model.startChat({ history: historyContent });

        let messageParts;
        if (imageData) {
          messageParts = [
            { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
            { text: String(prompt || "Analisis gambar ini.").slice(0, 3000) },
          ];
        } else {
          messageParts = String(prompt || "").slice(0, 5000);
        }

        const result = await chat.sendMessage(messageParts);
        const text = result?.response?.text?.() || "";
        if (!text.trim()) throw new Error("Empty AI response");

        const historyPrompt = imageData ? `[Gambar] ${prompt || "(tanpa teks)"}` : String(prompt);
        sess.history.push({ role: "user",  text: historyPrompt });
        sess.history.push({ role: "model", text });
        if (sess.history.length > 40) sess.history = sess.history.slice(-40);

        return text.trim();
      } catch (e) {
        lastError = e;
        const msg = String(e?.message || "").toLowerCase();
        if (msg.includes("quota") || msg.includes("limit") || msg.includes("exceeded")) break;
        if (msg.includes("invalid") || msg.includes("api key")) break;
      }
    }
  }

  throw new Error(lastError?.message || "Semua API Key Gemini gagal.");
}

async function runNeko(sock, m, config, db) {
  const st = ensureRuntimeState(db);

  if (m.fromMe) return false;

  const txt      = pickBodyFromMessage(m);
  const hasImage = hasImageInMessage(m);

  if (!txt && !hasImage) return false;

  const prefixes    = Array.isArray(config.prefix) ? config.prefix : [global.prefix || "."];
  const isManualCmd = prefixes.some((p) => txt.startsWith(p));
  if (isManualCmd) return false;

  const senderNum = (m.senderNumber || m.sender || "").replace(/[^0-9]/g, "");
  const senderKey = senderNum || m.sender;

  const mentioned    = isMentioningBot(m, sock);
  const repliedToBot = isReplyToBot(m, sock);

  const activeKey = m.isGroup ? m.chat : senderKey;
  const autoOn    = st.active[activeKey] === true;

  if (!autoOn) return false;
  if (!mentioned && !repliedToBot) return false;

  const lockKey = `${m.chat}:${senderKey}`;
  if (st.lock[lockKey]) return false;
  st.lock[lockKey] = true;

  try {
    const sessionId = senderNum || m.sender;

    const translateOn = st.translate[m.chat] !== false;
    let finalPrompt   = txt;

    if (translateOn && txt) {
      const detectedLang = await detectLanguage(txt);
      if (detectedLang !== "id") {
        const keys = Array.isArray(config.geminiKeys) ? config.geminiKeys : (config.geminiKey ? [config.geminiKey] : []);
        if (keys.length) {
          const translated = await translateToIndonesian(txt, detectedLang, keys[0]);
          if (translated && translated !== txt) {
            finalPrompt = translated;
          }
        }
      }
    }

    let imageData = null;
    if (hasImage) {
      imageData = await getImageFromMessage(m);
      if (!imageData && !finalPrompt) {
        await m.reply("Gagal membaca gambar. Coba kirim ulang.");
        return true;
      }
    }

    const promptText = finalPrompt || (imageData ? "" : "Halo");
    const aiResponse = await callGemini(config, promptText, sessionId, st, imageData);

    if (aiResponse) {
      await m.reply(aiResponse);
    }

    return true;
  } catch (e) {
    console.error("[Neko Error]", e.message);
    await m.reply("Terjadi error. Coba lagi nanti.");
    return true;
  } finally {
    delete st.lock[lockKey];
    db.write("neko", st);
  }
}

const handler = async (m, { conn, args, text }) => {
  const subCmd    = (args[0] || "").toLowerCase();
  const senderNum = (m.senderNumber || m.sender || "").replace(/[^0-9]/g, "");
  const activeKey = m.isGroup ? m.chat : senderNum;
  const sessionId = senderNum || m.sender;

  const db = {
    read:  (key) => global.db?.settings?.[key] ?? null,
    write: (key, val) => { if (!global.db.settings) global.db.settings = {}; global.db.settings[key] = val; },
  };

  const st = ensureRuntimeState(db);

  if (subCmd === "on") {
    st.active[activeKey] = true;
    db.write("neko", st);
    const { timeStr, greeting } = getJakartaTime();
    return m.reply(
      `Mode Neko AI aktif.\n${timeStr} WIB — ${greeting}\n\nMention atau reply pesan bot untuk ngobrol dan analisis gambar.`
    );
  }

  if (subCmd === "off") {
    st.active[activeKey] = false;
    db.write("neko", st);
    return m.reply("Mode Neko AI nonaktif.");
  }

  if (subCmd === "reset") {
    const stReset = ensureRuntimeState(db);
    if (stReset.sessions?.[sessionId]) {
      stReset.sessions[sessionId].history = [];
      db.write("neko", stReset);
      return m.reply("Memory percakapan direset.");
    }
    return m.reply("Tidak ada memory yang perlu direset.");
  }

  if (subCmd === "translate") {
    const action = (args[1] || "").toLowerCase();
    const chatId = m.chat;
    if (action === "on") {
      st.translate[chatId] = true;
      db.write("neko", st);
      return m.reply("Auto-translate aktif. Pesan non-Indonesia akan diterjemahkan dulu sebelum diproses.");
    }
    if (action === "off") {
      st.translate[chatId] = false;
      db.write("neko", st);
      return m.reply("Auto-translate nonaktif.");
    }
    const currentState = st.translate[chatId] !== false;
    return m.reply(`Auto-translate saat ini: ${currentState ? "AKTIF" : "NONAKTIF"}\n\nGunakan:\n.neko translate on\n.neko translate off`);
  }

  const status      = st.active[activeKey] === true;
  const translateOn = st.translate[m.chat] !== false;
  const { timeStr } = getJakartaTime();
  const botName     = global.botName || "NekoBot";

  return m.reply(
    `NEKO AI\n\n` +
    `Bot: ${botName}\n` +
    `${timeStr} WIB\n\n` +
    `Status:\n` +
    `- Neko AI: ${status ? "AKTIF" : "NONAKTIF"}\n` +
    `- Auto-translate: ${translateOn ? "AKTIF" : "NONAKTIF"}\n\n` +
    `Perintah:\n` +
    `.neko on/off\n` +
    `.neko reset\n` +
    `.neko translate on/off\n\n` +
    `Cara pakai:\n` +
    `- Mention bot atau reply pesan bot\n` +
    `- Bisa kirim gambar untuk dianalisis\n` +
    `- Pesan bahasa Inggris/Jawa/dll otomatis diterjemahkan`
  );
};

handler.command  = ["neko"];
handler.category = "ai";
handler.description = "Neko AI — chat, analisis gambar, auto-translate";

export default handler;
export { runNeko };
