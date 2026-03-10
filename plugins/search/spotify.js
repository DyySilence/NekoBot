/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import { proto, generateWAMessageFromContent } from "baileys";

if (!global.spotifySearchCache) global.spotifySearchCache = new Map();
const searchCache = global.spotifySearchCache;

function convert(ms) {
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}:${Number(s) < 10 ? "0" : ""}${s}`;
}

function cleanLabel(str, max = 34) {
  const t = String(str ?? "").trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

async function getGoodThumb(coverUrl) {
  if (coverUrl && /^https?:\/\//i.test(coverUrl)) {
    try {
      const { data } = await axios.get(coverUrl, { responseType: "arraybuffer", timeout: 5000 });
      return Buffer.from(data);
    } catch {}
  }
  return Buffer.alloc(0);
}

async function searchSpotify(apiUrl, query, limit = 10) {
  const res = await axios.get(`${apiUrl}/search/spotify`, {
    params:  { q: query, limit },
    timeout: 20000,
  });
  if (!res.data?.status || !res.data?.tracks?.length) return [];
  return res.data.tracks.map(t => ({
    id:          t.id,
    title:       t.title,
    subtitle:    t.artist,
    album:       t.album,
    image:       t.cover || "",
    link:        t.url,
    duration:    t.duration,
    preview_url: t.preview_url || null,
    popularity:  t.popularity  || 0,
  }));
}

async function sendSpotifySheet(conn, m, { query, items }) {
  const thumBuff  = await getGoodThumb(items[0]?.image);
  const sourceUrl = items[0]?.link || "https://open.spotify.com";

  const caption =
    `🎵 *Spotify Search*\n\n` +
    `🔍 Query: *${query}*\n` +
    `📋 Pilih lagu untuk download:\n\n` +
    items.slice(0, 10).map((it, i) => {
      const dur = it.duration ? ` [${it.duration}]` : "";
      return `~${i + 1}. ${it.title} • ${it.subtitle}${dur}`;
    }).join("\n") +
    (items.length > 10 ? `\n\n...dan ${items.length - 10} lagu lainnya` : "");

  const buttons = items.slice(0, 9).map((it, i) => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: cleanLabel(`${i + 1}. ${it.title} • ${it.subtitle}`).slice(0, 38),
      id:           `${global.prefix}spotdl ${i + 1}`,
      has_multiple_buttons: true,
    }),
  }));

  try {
    const interactiveMessage = proto.Message.InteractiveMessage.create({
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title:                 "Spotify Downloader",
          body:                  `Hasil pencarian: ${query}`,
          thumbnailUrl:          items[0]?.image || "https://c.termai.cc/i161/3zewPF.jpg",
          sourceUrl,
          mediaType:             1,
          renderLargerThumbnail: true,
        },
      },
      header: {
        locationMessage: {
          degreesLatitude:  0,
          degreesLongitude: 0,
          name:             `Halo ${m.pushName || "kak"}`,
          url:              sourceUrl,
          address:          new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
          jpegThumbnail:    thumBuff,
        },
        hasMediaAttachment: false,
      },
      body:   { text: null },
      footer: { text: caption },
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons,
        messageParamsJson: JSON.stringify({
          bottom_sheet: {
            in_thread_buttons_limit: 1,
            list_title:   "Spotify Search",
            button_title: "Pilih Lagu",
          },
        }),
      }),
    });

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage,
          },
        },
      },
      { quoted: m.fakeObj || m }
    );

    await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
  } catch {
    await conn.sendMessage(
      m.chat,
      { text: caption + `\n\nBalas dengan: *${global.prefix}spotdl <angka>*` },
      { quoted: m.fakeObj || m }
    );
  }
}

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🎵 *SPOTIFY SEARCH*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}spotify <judul lagu>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}spotify komang\`\n` +
      `> \`${global.prefix}spotify love story taylor swift\`\n>\n` +
      `> Setelah muncul hasil, ketik:\n` +
      `> \`${global.prefix}spotdl <angka>\` untuk download`
    );
  }

  if (text.trim().length < 2) return m.reply("❌ Query terlalu pendek. Minimal 2 karakter.");

  await m.react("🔎");

  const items = await searchSpotify(global.apiUrl, text.trim(), 10);

  if (!items.length) {
    await m.react("❌");
    return m.reply(`❌ Tidak ada hasil untuk: *${text}*\n\nCoba kata kunci yang berbeda.`);
  }

  const cacheKey = `${m.chat}_${m.sender}`;
  searchCache.set(cacheKey, { items, timestamp: Date.now() });
  setTimeout(() => searchCache.has(cacheKey) && searchCache.delete(cacheKey), 5 * 60 * 1000);

  await sendSpotifySheet(conn, m, { query: text.trim(), items });
  await m.react("✅");
};

handler.command     = ["spotify", "spotifysearch"];
handler.category    = "search";
handler.description = "Search lagu Spotify & tampilkan hasil interaktif";

export default handler;