/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";

const searchCache = global.spotifySearchCache;

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🎵 *SPOTIFY DOWNLOAD*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> 1. Cari lagu: \`${global.prefix}spotify <judul>\`\n` +
      `> 2. Pilih nomor: \`${global.prefix}spotdl <angka>\`\n` +
      `> 3. Atau langsung: \`${global.prefix}spotdl <url spotify>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}spotdl 1\`\n` +
      `> \`${global.prefix}spotdl https://open.spotify.com/track/...\``
    );
  }

  await m.react("⏳");

  const input = text.trim();
  let spotifyUrl  = null;
  let trackTitle  = null;
  let trackArtist = null;
  let trackCover  = null;

  if (/open\.spotify\.com\/track\//i.test(input)) {
    spotifyUrl = input;

  } else {
    const num = parseInt(input);
    if (isNaN(num) || num < 1) {
      await m.react("❌");
      return m.reply(
        `❌ Input tidak valid.\n\n` +
        `Gunakan nomor dari hasil \`${global.prefix}spotify\` atau URL Spotify langsung.`
      );
    }

    const cache    = global.spotifySearchCache;
    const cacheKey = `${m.chat}_${m.sender}`;
    const cached   = cache?.get(cacheKey);

    if (!cached?.items?.length) {
      await m.react("❌");
      return m.reply(
        `❌ Cache hasil pencarian tidak ditemukan atau sudah expired (5 menit).\n\n` +
        `Cari lagi dengan: \`${global.prefix}spotify <judul>\``
      );
    }

    const track = cached.items[num - 1];
    if (!track) {
      await m.react("❌");
      return m.reply(`❌ Nomor *${num}* tidak ada. Pilih antara 1–${cached.items.length}.`);
    }

    spotifyUrl  = track.link;
    trackTitle  = track.title;
    trackArtist = track.subtitle;
    trackCover  = track.image;
  }

  const dlRes = await axios.get(`${global.apiUrl}/downloader/spotify`, {
    params:  { url: spotifyUrl },
    timeout: 300000,
  });

  if (!dlRes.data?.status) {
    await m.react("❌");
    return m.reply(`❌ Gagal mendapatkan link download:\n${dlRes.data?.error || "Unknown error"}`);
  }

  const { title, artist, cover, download_url, fallback_url } = dlRes.data;

  const finalTitle  = trackTitle  || title  || "Unknown Track";
  const finalArtist = trackArtist || artist || "Unknown Artist";
  const finalCover  = trackCover  || cover  || null;
  const finalDlUrl  = download_url || fallback_url;

  if (!finalDlUrl) {
    await m.react("❌");
    return m.reply("❌ URL download tidak tersedia. Coba lagi nanti.");
  }

  await conn.sendMessage(
    m.chat,
    {
      audio:    { url: finalDlUrl },
      mimetype: "audio/mp4",
      fileName: `${finalTitle} - ${finalArtist}.mp3`,
      contextInfo: finalCover ? {
        externalAdReply: {
          title:                 finalTitle,
          body:                  finalArtist,
          thumbnailUrl:          finalCover,
          sourceUrl:             spotifyUrl,
          mediaType:             1,
          renderLargerThumbnail: false,
        },
      } : undefined,
    },
    { quoted: m.fakeObj || m }
  );

  if (finalCover) {
    await conn.sendMessage(
      m.chat,
      {
        image:   { url: finalCover },
        caption: `🎵 *${finalTitle}*\n👤 ${finalArtist}\n\n📥 *Spotify Download*`,
      },
      { quoted: m.fakeObj || m }
    );
  }

  await m.react("✅");
};

handler.command     = ["spotdl", "spotifydl"];
handler.category    = "downloader";
handler.description = "Download audio Spotify (nomor dari search atau URL langsung)";

export default handler;