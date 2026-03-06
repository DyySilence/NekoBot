/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from "baileys";

const searchCache = new Map();

async function sendSearchCarousel(conn, m, query, videos) {
  const maxSlides = Math.min(videos.length, 10);
  const cards = [];

  for (let i = 0; i < maxSlides; i++) {
    const v = videos[i];
    let media = null;
    try {
      media = await prepareWAMessageMedia(
        { image: { url: v.video.cover || v.author.avatar } },
        { upload: conn.waUploadToServer }
      );
    } catch {}

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title: `🎬 TikTok ${i + 1}/${maxSlides}`,
        subtitle: (v.author.nickname || "Unknown").slice(0, 40),
        hasMediaAttachment: !!media?.imageMessage,
        imageMessage: media?.imageMessage || undefined,
      }),
      body: proto.Message.InteractiveMessage.Body.create({
        text: (v.title || "No title").slice(0, 100),
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: `👍 ${(v.digg_count || 0).toLocaleString()} • ▶️ ${(v.play_count || 0).toLocaleString()}`,
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `📥 Video ${i + 1}`,
              id: `.ttdl ${i + 1}`,
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `🎵 Audio ${i + 1}`,
              id: `.ttaudio ${i + 1}`,
            }),
          },
        ],
      }),
    });
  }

  const msg = generateWAMessageFromContent(
    m.chat,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: `🔍 *Hasil Pencarian TikTok*\n\nQuery: *${query}*\nHasil: ${maxSlides} video`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Swipe untuk lihat semua • ${global.botName || "NekoBot"}`,
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards }),
          }),
        },
      },
    }),
    { quoted: m.fakeObj || m }
  );

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

async function sendSlideshowCarousel(conn, m, result) {
  const maxSlides = Math.min(result.images.length, 10);
  const cards = [];

  for (let i = 0; i < maxSlides; i++) {
    const url = result.images[i].url;
    let media = null;
    try {
      media = await prepareWAMessageMedia(
        { image: { url } },
        { upload: conn.waUploadToServer }
      );
    } catch {}

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title: `📸 Slide ${i + 1}/${maxSlides}`,
        subtitle: "TikTok Slideshow",
        hasMediaAttachment: !!media?.imageMessage,
        imageMessage: media?.imageMessage || undefined,
      }),
      body: proto.Message.InteractiveMessage.Body.create({
        text: media?.imageMessage ? "Klik tombol untuk download" : "Gagal load preview",
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: global.botName || "NekoBot",
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `📥 Download ${i + 1}`,
              id: `.ttdl ${url}`,
            }),
          },
        ],
      }),
    });
  }

  const msg = generateWAMessageFromContent(
    m.chat,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: `🎬 *TikTok Slideshow*\n\n📸 Total: ${result.image_count} slides\n👤 ${result.author}`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Swipe & pilih slide • ${global.botName || "NekoBot"}`,
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards }),
          }),
        },
      },
    }),
    { quoted: m.fakeObj || m }
  );

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

const handler = async (m, { conn, text, command, args }) => {
  const cacheKey = `${m.chat}_${m.sender}_tt`;

  if (command === "ttdl") {
    if (text?.startsWith("http")) {
      await m.react("⏳");
      try {
        await conn.sendMessage(
          m.chat,
          { image: { url: text }, caption: `> 📸 *TikTok Slide*\n>\n> ✅ Download berhasil!` },
          { quoted: m.fakeObj || m }
        );
        await m.react("✅");
      } catch {
        await m.react("❌");
        await m.reply(`> ❌ Gagal download slide.\n> 🔗 URL: ${text}`);
      }
      return;
    }

    const idx = parseInt(args[0] || text);
    if (!idx || idx < 1) return m.reply(`> ❌ Index tidak valid. Contoh: .ttdl 1`);

    const cached = searchCache.get(cacheKey);
    if (!cached || Date.now() - cached.ts > 10 * 60 * 1000) {
      return m.reply(`> ❌ Cache expired. Search ulang dengan .tt <query>`);
    }

    const v = cached.videos[idx - 1];
    if (!v) return m.reply(`> ❌ Pilihan tidak valid. Pilih 1–${Math.min(cached.videos.length, 10)}`);

    await m.react("⏳");
    const videoUrl = v.video.nowm || v.video.play;
    try {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          caption:
            `> 🎬 *TikTok Video*\n>\n` +
            `> 👤 ${v.author.nickname}\n` +
            `> 📝 ${(v.title || "").slice(0, 80)}\n` +
            `> 👍 ${(v.digg_count || 0).toLocaleString()} • ▶️ ${(v.play_count || 0).toLocaleString()}\n>\n` +
            `> ✅ Download berhasil!`,
          mimetype: "video/mp4",
          gifPlayback: false,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
    } catch (err) {
      await m.react("⚠️");
      await m.reply(`> ⚠️ Gagal kirim video.\n> 🔗 ${videoUrl}`);
    }
    return;
  }

  if (command === "ttaudio") {
    const idx = parseInt(args[0] || text);
    if (!idx || idx < 1) return m.reply(`> ❌ Index tidak valid. Contoh: .ttaudio 1`);

    const cached = searchCache.get(cacheKey);
    if (!cached || Date.now() - cached.ts > 10 * 60 * 1000) {
      return m.reply(`> ❌ Cache expired. Search ulang dengan .tt <query>`);
    }

    const v = cached.videos[idx - 1];
    if (!v) return m.reply(`> ❌ Pilihan tidak valid. Pilih 1–${Math.min(cached.videos.length, 10)}`);

    const audioUrl = v.music.play_url;
    if (!audioUrl) return m.reply(`> ❌ Audio tidak tersedia untuk video ini.`);

    await m.react("⏳");
    try {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audioUrl },
          mimetype: "audio/mp4",
          ptt: false,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
    } catch (err) {
      await m.react("❌");
      await m.reply(`> ❌ Gagal kirim audio: ${err.message}`);
    }
    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 🎬 *TIKTOK SEARCH & DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .tt <query> — search video\n` +
      `> .tt <url> — download dari URL\n` +
      `> .tt <query> <angka> — tentukan jumlah hasil\n>\n` +
      `> 📥 *Setelah search:*\n` +
      `> .ttdl <angka> — download video\n` +
      `> .ttaudio <angka> — download audio\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .tt dance trending 5\n` +
      `> .tt https://vt.tiktok.com/xxx`
    );
  }

  const isTikTokUrl = /(?:https?:\/\/)?(?:www\.|vt\.|vm\.)?tiktok\.com/i.test(text);

  if (isTikTokUrl) {
    await m.react("⏳");

    let result;
    try {
      const { data } = await axios.get(`${global.apiUrl}/downloader/tiktok`, {
        params: { url: text.trim() },
        timeout: 30000,
      });
      if (!data?.status) throw new Error(data?.error || "API error");
      result = data;
    } catch (err) {
      await m.react("❌");
      return m.reply(
        `> ❌ *DOWNLOAD GAGAL*\n>\n` +
        `> 🔧 Error: ${err.message}\n>\n` +
        `> 💡 Video mungkin private atau dihapus.`
      );
    }

    if (result.type === "video" && result.video_url) {
      try {
        await conn.sendMessage(
          m.chat,
          {
            video: { url: result.video_url },
            caption:
              `> 🎬 *TikTok Video*\n>\n` +
              `> 👤 *Author:* ${result.author}\n` +
              `> 📝 *Judul:* ${(result.title || "").slice(0, 80)}\n` +
              `> ⏱️ *Durasi:* ${result.duration}s\n>\n` +
              `> ✅ Download berhasil!`,
            mimetype: "video/mp4",
            gifPlayback: false,
          },
          { quoted: m.fakeObj || m }
        );
        await m.react("✅");
      } catch (err) {
        await m.react("⚠️");
        await m.reply(`> ⚠️ Gagal kirim video.\n> 🔗 ${result.video_url}`);
      }
      return;
    }

    if (result.type === "slideshow" && result.image_count > 0) {
      try {
        await sendSlideshowCarousel(conn, m, result);
        await m.react("✅");
      } catch {
        await m.react("⚠️");
        for (let i = 0; i < result.images.length; i++) {
          await conn.sendMessage(
            m.chat,
            {
              image: { url: result.images[i].url },
              caption: i === 0
                ? `> 📸 *TikTok Slideshow*\n> 👤 ${result.author}\n> 📊 ${result.image_count} slides`
                : `> 📸 Slide ${i + 1}/${result.image_count}`,
            },
            { quoted: m.fakeObj || m }
          );
          if (i < result.images.length - 1) await new Promise((r) => setTimeout(r, 1200));
        }
        await m.react("✅");
      }
      return;
    }

    await m.react("❌");
    return m.reply(`> ❌ Tidak ada media ditemukan.`);
  }

  await m.react("⏳");

  const words = text.trim().split(/\s+/);
  const last = words[words.length - 1];
  let query = text.trim();
  let count = 10;

  if (/^\d+$/.test(last)) {
    count = Math.min(Math.max(parseInt(last), 1), 20);
    query = words.slice(0, -1).join(" ");
  }

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/search/tiktok`, {
      params: { q: query, count },
      timeout: 30000,
    });
    if (!data?.status) throw new Error(data?.error || "API error");
    result = data;
  } catch (err) {
    await m.react("❌");
    return m.reply(
      `> ❌ *SEARCH GAGAL*\n>\n` +
      `> 🔍 Query: *${query}*\n` +
      `> 🔧 ${err.message}\n>\n` +
      `> 🔄 Coba lagi dalam beberapa saat!`
    );
  }

  if (!result.videos?.length) {
    await m.react("❌");
    return m.reply(`> ❌ Tidak ada video ditemukan untuk: *${query}*`);
  }

  searchCache.set(cacheKey, { videos: result.videos, ts: Date.now() });
  setTimeout(() => searchCache.delete(cacheKey), 10 * 60 * 1000);

  try {
    await sendSearchCarousel(conn, m, query, result.videos);
    await m.react("✅");
  } catch (err) {
    await m.react("⚠️");
    let list = `> 🔍 *TikTok Search: ${query}*\n>\n`;
    result.videos.slice(0, 10).forEach((v, i) => {
      list += `> ${i + 1}. ${v.author.nickname} — ${v.title.slice(0, 50)}\n`;
    });
    list += `>\n> .ttdl <angka> untuk download`;
    await m.reply(list);
  }
};

handler.command = ["tiktok", "tt", "ttdl", "ttaudio"];
handler.category = "downloader";
handler.description = "Search TikTok & download video/slideshow/audio";

export default handler;
