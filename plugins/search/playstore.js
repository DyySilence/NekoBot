/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { generateWAMessageFromContent, proto } from "baileys";

if (!global.playstoreCache) global.playstoreCache = new Map();

function saveCache(userId, apps) {
  global.playstoreCache.set(userId, { apps, timestamp: Date.now() });
  setTimeout(() => global.playstoreCache.delete(userId), 10 * 60 * 1000);
}

function getCache(userId) {
  const data = global.playstoreCache.get(userId);
  if (!data) return null;
  if (Date.now() - data.timestamp > 10 * 60 * 1000) {
    global.playstoreCache.delete(userId);
    return null;
  }
  return data.apps;
}

async function apiGet(path) {
  const { default: axios } = await import("axios");
  const res = await axios.get((global.apiUrl) + path, { timeout: 20000 });
  return res.data;
}

function formatDetail(app) {
  let out = `📱 *${app.title}*\n\n`;
  out += `📦 *ID:* \`${app.appId}\`\n`;
  out += `👤 *Developer:* ${app.developer || "-"}\n`;
  if (app.score)          out += `⭐ *Rating:* ${app.score} (${(app.ratings || 0).toLocaleString()} ulasan)\n`;
  if (app.installs)       out += `📥 *Installs:* ${app.installs}\n`;
  if (app.version)        out += `🔖 *Versi:* ${app.version}\n`;
  if (app.updated)        out += `🕐 *Update:* ${app.updated}\n`;
  if (app.size)           out += `📊 *Ukuran:* ${app.size}\n`;
  if (app.androidVersion) out += `🤖 *Min Android:* ${app.androidVersion}\n`;
  out += `💰 *Harga:* ${app.priceText || (app.free ? "Gratis" : "Berbayar")}\n`;
  if (app.genre)          out += `🏷️ *Kategori:* ${app.genre}\n`;
  if (app.contentRating)  out += `🔞 *Rating Konten:* ${app.contentRating}\n`;
  if (app.offersIAP)      out += `💳 *In-App Purchase:* Ada\n`;
  if (app.url)            out += `🔗 *Link:* ${app.url}\n`;
  if (app.summary)        out += `\n📝 *Deskripsi:*\n${app.summary.slice(0, 300)}${app.summary.length > 300 ? "..." : ""}`;
  return out;
}

async function sendResultButtons(conn, m, apps, query) {
  const prefix = global.prefix || ".";

  const buttons = apps.slice(0, 10).map((app, i) => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text:         `${i + 1}. ${app.title.slice(0, 20)}`,
      id:                   `${prefix}playstore detail_${i}`,
      has_multiple_buttons: true,
    }),
  }));

  let listText = `🔍 *Hasil Pencarian Google Play*\n\nQuery: *${query}*\nDitemukan: *${apps.length} aplikasi*\n\n`;
  apps.slice(0, 10).forEach((app, i) => {
    listText += `*${i + 1}.* ${app.title}\n`;
    listText += `   👤 ${app.developer || "-"}\n`;
    if (app.score) listText += `   ⭐ ${app.score}\n`;
    listText += `   💰 ${app.free ? "Gratis" : app.priceText || "Berbayar"}\n\n`;
  });
  listText += `_Pilih tombol di bawah untuk detail_`;

  try {
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid:   global.channelJid  || "120363425809110720@newsletter",
                  newsletterName:  global.channelName || global.botName || "Bot",
                  serverMessageId: -1,
                },
                externalAdReply: {
                  title:                 "Google Play Store",
                  body:                  query,
                  thumbnailUrl:          "https://play-lh.googleusercontent.com/6UgEjh8Xuts4nwdWzTnWH8QtLuHqRMUB7dp24JYVE2xcYzq4HA8hFfcAbU-rsgLXx9E",
                  sourceUrl:             "https://play.google.com",
                  mediaType:             1,
                  renderLargerThumbnail: false,
                },
              },
              header: proto.Message.InteractiveMessage.Header.create({
                title: "📱 Google Play Search", subtitle: query, hasMediaAttachment: false,
              }),
              body:   proto.Message.InteractiveMessage.Body.create({ text: listText }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${global.dev || "DyySilence"} • Google Play` }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons,
                messageParamsJson: JSON.stringify({
                  bottom_sheet: { in_thread_buttons_limit: 3, list_title: "Pilih Aplikasi", button_title: " " },
                }),
              }),
            }),
          },
        },
      },
      { quoted: m.fakeObj || m }
    );
    await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
  } catch {
    let fallback = `📱 *Google Play Search*\n\nQuery: *${query}*\n\n`;
    apps.slice(0, 10).forEach((app, i) => {
      fallback += `*${i + 1}.* ${app.title}\n   👤 ${app.developer || "-"}\n`;
      if (app.score) fallback += `   ⭐ ${app.score}\n`;
      fallback += `   💰 ${app.free ? "Gratis" : app.priceText || "Berbayar"}\n\n`;
    });
    fallback += `_Ketik_ *${prefix}playstore <nomor>* _untuk detail_`;
    await m.reply(fallback);
  }
}

const handler = async (m, { conn, args, text, command }) => {
  const prefix = global.prefix || ".";
  const userId = m.sender;
  const input  = (text || "").trim();

  if (!input) {
    return m.reply(
      `📱 *Google Play Search*\n\n` +
      `📝 *Usage:* \`${prefix}playstore <nama app>\`\n\n` +
      `💡 *Contoh:*\n` +
      `• \`${prefix}playstore whatsapp\`\n` +
      `• \`${prefix}playstore minecraft\`\n` +
      `• \`${prefix}playstore free fire\``
    );
  }

  if (input.startsWith("detail_")) {
    const idx    = parseInt(input.replace("detail_", ""), 10);
    const cached = getCache(userId);

    if (!cached || isNaN(idx) || !cached[idx]) {
      return m.reply(`❌ Cache habis atau tidak valid.\nCari lagi dengan *${prefix}playstore <nama app>*`);
    }

    try {
      await m.react("⏳");
      const data = await apiGet(`/search/playstore/detail?id=${encodeURIComponent(cached[idx].appId)}`);
      if (!data.status) {
        await m.react("❌");
        return m.reply(`❌ ${data.error || "Gagal ambil detail"}`);
      }
      await m.react("✅");
      return m.reply(formatDetail(data));
    } catch (e) {
      await m.react("❌");
      return m.reply(`❌ Gagal ambil detail: ${e.message}`);
    }
  }

  const num = parseInt(input, 10);
  if (!isNaN(num) && num >= 1 && num <= 10) {
    const cached = getCache(userId);
    if (!cached || !cached[num - 1]) {
      return m.reply(`❌ Cache habis. Cari lagi dengan *${prefix}playstore <nama app>*`);
    }
    try {
      await m.react("⏳");
      const data = await apiGet(`/search/playstore/detail?id=${encodeURIComponent(cached[num - 1].appId)}`);
      if (!data.status) {
        await m.react("❌");
        return m.reply(`❌ ${data.error || "Gagal ambil detail"}`);
      }
      await m.react("✅");
      return m.reply(formatDetail(data));
    } catch (e) {
      await m.react("❌");
      return m.reply(`❌ Gagal ambil detail: ${e.message}`);
    }
  }

  try {
    await m.react("🔎");
    const data = await apiGet(`/search/playstore?q=${encodeURIComponent(input)}&num=10`);

    if (!data.status) {
      await m.react("❌");
      return m.reply(`❌ ${data.error || "Gagal mencari aplikasi"}`);
    }

    if (!data.apps?.length) {
      await m.react("❌");
      return m.reply(`❌ Tidak ada hasil untuk: *${input}*\n\nCoba kata kunci lain.`);
    }

    saveCache(userId, data.apps);
    await sendResultButtons(conn, m, data.apps, input);
    await m.react("✅");
  } catch (e) {
    await m.react("❌");
    let msg = "❌ ";
    if (e.message.includes("ENOTFOUND"))    msg += "Tidak ada koneksi internet.";
    else if (e.message.includes("timeout")) msg += "Waktu habis. Coba lagi.";
    else msg += e.message;
    return m.reply(msg);
  }
};

handler.command     = ["playstore"];
handler.tags        = ["search"];
handler.help        = ["playstore <nama app>"];
handler.category    = "search";
handler.description = "Cari aplikasi di Google Play Store";

export default handler;
