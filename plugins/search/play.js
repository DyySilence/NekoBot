/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
 
import axios from "axios";
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from "baileys";

const searchCache = new Map();

async function sendSearchCarousel(conn, m, query, results) {
  const maxSlides = Math.min(results.length, 10);
  const cards = [];

  for (let i = 0; i < maxSlides; i++) {
    const v = results[i];
    let media = null;
    try {
      media = await prepareWAMessageMedia(
        { image: { url: v.thumbnail } },
        { upload: conn.waUploadToServer }
      );
    } catch {}

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title: `🎵 ${i + 1}/${maxSlides}`,
        subtitle: (v.author || "Unknown").slice(0, 40),
        hasMediaAttachment: !!media?.imageMessage,
        imageMessage: media?.imageMessage || undefined,
      }),
      body: proto.Message.InteractiveMessage.Body.create({
        text: (v.title || "No title").slice(0, 100),
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: `⏱️ ${v.duration || "?"} • 👁️ ${v.views || "?"}`,
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `🎵 MP3 ${i + 1}`,
              id: `.playmp3 ${i + 1}`,
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `🎬 MP4 ${i + 1}`,
              id: `.playmp4 ${i + 1}`,
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
              text: `🎵 *YouTube Search*\n\n🔍 Query: *${query}*\nHasil: ${maxSlides} video`,
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

async function downloadToBuffer(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  });
  return Buffer.from(response.data);
}

const handler = async (m, { conn, text, command, args }) => {
  const cacheKey = `${m.chat}_${m.sender}_yt`;

  if (command === "playmp3" || command === "playmp4") {
    const isUrl = text?.startsWith("http");
    let videoUrl = isUrl ? text : null;

    if (!isUrl) {
      const idx = parseInt(args[0] || text);
      if (!idx || idx < 1) return m.reply(`> ❌ Index tidak valid. Contoh: .${command} 1`);

      const cached = searchCache.get(cacheKey);
      if (!cached || Date.now() - cached.ts > 10 * 60 * 1000) {
        return m.reply(`> ❌ Cache expired. Search ulang dengan .play <query>`);
      }

      const v = cached.results[idx - 1];
      if (!v) return m.reply(`> ❌ Pilihan tidak valid. Pilih 1–${Math.min(cached.results.length, 10)}`);

      videoUrl = v.url;

      await m.react("⏳");

      const endpoint = command === "playmp3" ? "ytmp3" : "ytmp4";
      let result;
      try {
        const { data } = await axios.get(`${global.apiUrl}/downloader/${endpoint}`, {
          params: { url: videoUrl },
          timeout: 60000,
        });
        if (!data?.status) throw new Error(data?.error || "API error");
        result = data;
      } catch (err) {
        await m.react("❌");
        return m.reply(
          `> ❌ *DOWNLOAD GAGAL*\n>\n` +
          `> 🔧 Error: ${err.message}\n>\n` +
          `> 🔄 Coba lagi!`
        );
      }

      const caption =
        `> 🎵 *${command === "playmp3" ? "YouTube MP3" : "YouTube MP4"}*\n>\n` +
        `> 📝 *Judul:* ${(result.title || v.title).slice(0, 80)}\n` +
        `> 👤 *Author:* ${result.author || v.author}\n` +
        (result.durationFormatted ? `> ⏱️ *Durasi:* ${result.durationFormatted}\n` : "") +
        (result.fileSizeFormatted ? `> 💾 *Ukuran:* ${result.fileSizeFormatted}\n` : "") +
        `>\n> ✅ Download berhasil!`;

      try {
        if (command === "playmp3") {
          let audioBuffer;
          try {
            audioBuffer = await downloadToBuffer(result.downloadUrl);
          } catch {
            audioBuffer = null;
          }

          await conn.sendMessage(
            m.chat,
            {
              audio: audioBuffer ? audioBuffer : { url: result.downloadUrl },
              mimetype: "audio/mp4",
              ptt: false,
              fileName: `${(result.title || v.title || "audio").slice(0, 60)}.mp3`,
            },
            { quoted: m.fakeObj || m }
          );

          try {
            await conn.sendMessage(
              m.chat,
              { image: { url: result.thumbnail || v.thumbnail }, caption },
              { quoted: m.fakeObj || m }
            );
          } catch {}
        } else {
          let videoBuffer;
          try {
            videoBuffer = await downloadToBuffer(result.downloadUrl);
          } catch {
            videoBuffer = null;
          }

          await conn.sendMessage(
            m.chat,
            {
              video: videoBuffer ? videoBuffer : { url: result.downloadUrl },
              mimetype: "video/mp4",
              caption,
              gifPlayback: false,
            },
            { quoted: m.fakeObj || m }
          );
        }

        await m.react("✅");
      } catch (err) {
        await m.react("⚠️");
        await m.reply(`> ⚠️ Gagal kirim media.\n> 🔗 ${result.downloadUrl}`);
      }
      return;
    }

    await m.react("⏳");
    const endpoint = command === "playmp3" ? "ytmp3" : "ytmp4";
    let result;
    try {
      const { data } = await axios.get(`${global.apiUrl}/downloader/${endpoint}`, {
        params: { url: videoUrl },
        timeout: 60000,
      });
      if (!data?.status) throw new Error(data?.error || "API error");
      result = data;
    } catch (err) {
      await m.react("❌");
      return m.reply(`> ❌ Download gagal: ${err.message}`);
    }

    const caption =
      `> 🎵 *${command === "playmp3" ? "YouTube MP3" : "YouTube MP4"}*\n>\n` +
      `> 📝 *Judul:* ${(result.title || "").slice(0, 80)}\n` +
      `> 👤 *Author:* ${result.author || ""}\n` +
      (result.durationFormatted ? `> ⏱️ *Durasi:* ${result.durationFormatted}\n` : "") +
      (result.fileSizeFormatted ? `> 💾 *Ukuran:* ${result.fileSizeFormatted}\n` : "") +
      `>\n> ✅ Download berhasil!`;

    try {
      if (command === "playmp3") {
        let audioBuffer;
        try {
          audioBuffer = await downloadToBuffer(result.downloadUrl);
        } catch {
          audioBuffer = null;
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: audioBuffer ? audioBuffer : { url: result.downloadUrl },
            mimetype: "audio/mp4",
            ptt: false,
            fileName: `${(result.title || "audio").slice(0, 60)}.mp3`,
          },
          { quoted: m.fakeObj || m }
        );

        try {
          await conn.sendMessage(
            m.chat,
            { image: { url: result.thumbnail }, caption },
            { quoted: m.fakeObj || m }
          );
        } catch {}
      } else {
        let videoBuffer;
        try {
          videoBuffer = await downloadToBuffer(result.downloadUrl);
        } catch {
          videoBuffer = null;
        }

        await conn.sendMessage(
          m.chat,
          {
            video: videoBuffer ? videoBuffer : { url: result.downloadUrl },
            mimetype: "video/mp4",
            caption,
            gifPlayback: false,
          },
          { quoted: m.fakeObj || m }
        );
      }
      await m.react("✅");
    } catch (err) {
      await m.react("⚠️");
      await m.reply(`> ⚠️ Gagal kirim media.\n> 🔗 ${result.downloadUrl}`);
    }
    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 🎵 *YOUTUBE SEARCH & DOWNLOAD*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .play <query> — search video\n` +
      `> .play <url> — download dari URL\n\n` +
      `> 💡 *Contoh:*\n` +
      `> .play komang raim laode\n` +
      `> .play https://youtu.be/xxx`
    );
  }

  const isYtUrl = /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i.test(text);

  if (isYtUrl) {
    await m.react("⏳");

    const buttons = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "🎵 Pilih Format",
          sections: [
            {
              title: "Format Download",
              rows: [
                { id: `.playmp3 ${text}`, title: "🎵 MP3 (Audio)", description: "Download audio saja" },
                { id: `.playmp4 ${text}`, title: "🎬 MP4 (Video)", description: "Download video 360p" },
              ],
            },
          ],
        }),
      },
    ];

    const interactiveMsg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `> 🎵 *YouTube Downloader*\n>\n> 🔗 URL terdeteksi!\n> Pilih format download:`,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: global.botName || "NekoBot",
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

    await conn.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    await m.react("✅");
    return;
  }

  await m.react("⏳");

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/search/ytsearch`, {
      params: { q: text.trim(), limit: 10 },
      timeout: 30000,
    });
    if (!data?.status) throw new Error(data?.error || "API error");
    result = data;
  } catch (err) {
    await m.react("❌");
    return m.reply(
      `> ❌ *SEARCH GAGAL*\n>\n` +
      `> 🔍 Query: *${text}*\n` +
      `> 🔧 ${err.message}\n>\n` +
      `> 🔄 Coba lagi!`
    );
  }

  if (!result.results?.length) {
    await m.react("❌");
    return m.reply(`> ❌ Tidak ada hasil untuk: *${text}*`);
  }

  searchCache.set(cacheKey, { results: result.results, ts: Date.now() });
  setTimeout(() => searchCache.delete(cacheKey), 10 * 60 * 1000);

  try {
    await sendSearchCarousel(conn, m, text.trim(), result.results);
    await m.react("✅");
  } catch (err) {
    await m.react("⚠️");
    let list = `> 🎵 *YouTube Search: ${text}*\n>\n`;
    result.results.slice(0, 10).forEach((v, i) => {
      list += `> ${i + 1}. ${v.author} — ${v.title.slice(0, 50)}\n`;
    });
    list += `>\n> .playmp3 <angka> • .playmp4 <angka>`;
    await m.reply(list);
  }
};

handler.command = ["play", "yt", "playmp3", "playmp4"];
handler.category = "search";
handler.description = "Search YouTube & download MP3/MP4";

export default handler;
