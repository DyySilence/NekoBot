/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from "baileys";

const execPromise = promisify(exec);

const MAX_DURATION = 18000; 
const MAX_SIZE_MB  = 50;

const ytSearchCache = new Map();

async function searchYoutube(query) {
  const res = await axios({
    url:    "https://m.youtube.com/youtubei/v1/search?prettyPrint=false",
    method: "POST",
    headers: {
      "accept":                  "*/*",
      "accept-language":         "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type":            "application/json",
      "x-youtube-client-name":   "2",
      "x-youtube-client-version":"2.20260205.04.01",
      "Referer": `https://m.youtube.com/results?sp=mAEA&search_query=${encodeURIComponent(query)}`,
    },
    data: {
      context: {
        client: {
          hl: "id", gl: "ID",
          clientName: "MWEB",
          clientVersion: "2.20260205.04.01",
          userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        },
      },
      query,
      params: "mAEA",
    },
  });
  return res.data;
}

function extractVideoData(item) {
  const v = item.videoWithContextRenderer || item.videoRenderer;
  if (!v?.videoId) return null;
  return {
    videoId:   v.videoId,
    title:     v.headline?.runs?.[0]?.text || v.title?.runs?.[0]?.text || v.headline?.simpleText || v.title?.simpleText || "Unknown",
    author:    v.shortBylineText?.runs?.[0]?.text || v.ownerText?.runs?.[0]?.text || "Unknown",
    duration:  v.lengthText?.simpleText || "0:00",
    views:     v.shortViewCountText?.simpleText || v.viewCountText?.simpleText || "0 views",
    thumbnail: v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || "",
  };
}

function parseSearchResults(data) {
  let items = [];
  const pc = data.contents?.twoColumnSearchResultsRenderer?.primaryContents;
  if (pc?.sectionListRenderer?.contents) {
    for (const c of pc.sectionListRenderer.contents)
      if (c.itemSectionRenderer?.contents) items.push(...c.itemSectionRenderer.contents);
  } else if (data.contents?.sectionListRenderer?.contents) {
    for (const s of data.contents.sectionListRenderer.contents)
      if (s.itemSectionRenderer?.contents) items.push(...s.itemSectionRenderer.contents);
  }
  const videos = [];
  for (const item of items) {
    if (videos.length >= 10) break;
    const v = extractVideoData(item);
    if (v) videos.push(v);
  }
  return videos;
}

function extractVideoId(input) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const m = input.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function getYouTubeInfo(videoId) {
  try {
    const res = await axios.post(
      "https://embed.dlsrv.online/api/video/info",
      { videoId },
      {
        headers: {
          "content-type": "application/json",
          "referer": `https://embed.dlsrv.online/v1/full?videoId=${videoId}`,
        },
        timeout: 30000,
      }
    );
    if (!res.data) return { success: false, error: "No data" };
    return {
      success:   true,
      title:     res.data.title        || "Unknown Title",
      author:    res.data.author_name  || "Unknown Author",
      thumbnail: res.data.thumbnail_url || "",
      duration:  res.data.duration     || 0,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function downloadYouTubeAudio(videoId, quality = "256") {
  try {
    const res = await axios.post(
      "https://embed.dlsrv.online/api/download/mp3",
      { videoId, format: "mp3", quality },
      {
        headers: {
          "content-type": "application/json",
          "referer": `https://embed.dlsrv.online/v1/full?videoId=${videoId}`,
        },
        timeout: 60000,
      }
    );
    if (res.data?.status === "tunnel" && res.data?.url) {
      return { success: true, url: res.data.url, filename: res.data.filename || "audio.mp3" };
    }
    return { success: false, error: "No URL" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function sendYouTubeCarousel(conn, m, videos, query) {
  const cacheKey = `${m.chat}_${m.sender}_ytsearch`;
  ytSearchCache.set(cacheKey, { videos, query, timestamp: Date.now() });
  setTimeout(() => ytSearchCache.delete(cacheKey), 10 * 60 * 1000);

  const cards = [];
  for (let i = 0; i < Math.min(videos.length, 10); i++) {
    const v = videos[i];
    let preparedMedia = null;
    try {
      if (v.thumbnail)
        preparedMedia = await prepareWAMessageMedia(
          { image: { url: v.thumbnail } },
          { upload: conn.waUploadToServer }
        );
    } catch {}

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title:              `${i + 1}. ${v.title.substring(0, 40)}${v.title.length > 40 ? "..." : ""}`,
        subtitle:           `👤 ${v.author} • ⏱️ ${v.duration}`,
        hasMediaAttachment: !!preparedMedia?.imageMessage,
        imageMessage:       preparedMedia?.imageMessage || undefined,
      }),
      body: proto.Message.InteractiveMessage.Body.create({
        text: `👁️ ${v.views}\n\nPilih format download:`,
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: global.botName || "Bot",
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 MP3", id: `${global.prefix}playch ${v.videoId}` }) },
          { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 MP4", id: `${global.prefix}ytmp4 ${v.videoId}` }) },
        ],
      }),
    });
  }

  const carouselMsg = generateWAMessageFromContent(
    m.chat,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: `🔍 *HASIL PENCARIAN*\n\n📝 Query: "${query}"\n📊 Ditemukan: ${Math.min(videos.length, 10)} video`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Swipe & pilih video • ${global.botName || "Bot"}`,
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards }),
          }),
        },
      },
    }),
    { quoted: m.fakeObj || m }
  );

  await conn.relayMessage(m.chat, carouselMsg.message, { messageId: carouselMsg.key.id });
}

const formatSize = (b) => {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const formatDur = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
    : `${m}:${String(sec).padStart(2,"0")}`;
};

const handler = async (m, { conn, args, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🎵 *PLAYCH - YouTube MP3*\n>\n` +
      `> 📝 *Cara pakai:*\n` +
      `> \`${global.prefix}playch <url/id/judul>\`\n` +
      `> \`${global.prefix}playch --vn <url>\`  (force voice note)\n` +
      `> 🎯 *Support:*\n` +
      `> • URL YouTube / Shorts / ID langsung\n` +
      `> • Judul lagu (auto search + carousel)\n` +
      `> • Kualitas 256kbps • Max 15 menit\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}playch https://youtu.be/dQw4w9WgXcQ\`\n` +
      `> \`${global.prefix}playch never gonna give you up\``
    );
  }

  let forceVN  = args.includes("--vn");
  let forceDoc = args.includes("--doc");
  let query    = text.replace(/--vn|--doc/g, "").trim();

  const videoId = extractVideoId(query);
  if (!videoId) {
    await m.react("🔍");
    await m.reply(`> 🔍 Mencari: *${query}*\n> ⏳ Tunggu sebentar...`);

    let searchData;
    try {
      searchData = await searchYoutube(query);
    } catch {
      await m.react("❌");
      return m.reply(`> ❌ Gagal menghubungi YouTube. Coba lagi.`);
    }

    const videos = parseSearchResults(searchData);
    if (!videos.length) {
      await m.react("❌");
      return m.reply(`> ❌ Tidak ada hasil untuk: *${query}*`);
    }

    try {
      await sendYouTubeCarousel(conn, m, videos, query);
      await m.react("✅");
    } catch (e) {
      await m.react("✅");
      const list = videos.slice(0, 5).map((v, i) =>
        `> ${i + 1}. *${v.title}*\n>    👤 ${v.author} • ⏱️ ${v.duration}\n>    ID: \`${v.videoId}\``
      ).join("\n>\n");
      await m.reply(
        `> 🔍 *Hasil pencarian: ${query}*\n>\n${list}\n>\n` +
        `> 💡 Gunakan: \`${global.prefix}playch <ID>\` untuk download`
      );
    }
    return;
  }


  await m.react("⏳");

  const info = await getYouTubeInfo(videoId);
  if (!info.success) {
    await m.react("❌");
    return m.reply(
      `> ❌ *Gagal ambil info video*\n>\n` +
      `> 🔧 ${info.error}\n>\n` +
      `> 💡 Video mungkin private, dihapus, atau ID tidak valid.`
    );
  }

  if (info.duration > MAX_DURATION) {
    await m.react("⚠️");
    return m.reply(
      `> ⚠️ *Video terlalu panjang*\n>\n` +
      `> ⏱️ Durasi: ${formatDur(info.duration)}\n` +
      `> ⚡ Maks: ${formatDur(MAX_DURATION)}`
    );
  }

  const dlResult = await downloadYouTubeAudio(videoId, "256");
  if (!dlResult.success) {
    await m.react("❌");
    return m.reply(`> ❌ Download gagal: ${dlResult.error}`);
  }

  await m.react("📥");
  const audioRes = await axios.get(dlResult.url, {
    responseType: "arraybuffer",
    timeout:      120000,
    maxRedirects: 5,
  });
  const audioBuffer = Buffer.from(audioRes.data);
  const sizeMB      = audioBuffer.length / (1024 * 1024);

  const tempDir = path.join(process.cwd(), "sampah");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const mp3File = path.join(tempDir, `yt-${Date.now()}.mp3`);
  const vnFile  = path.join(tempDir, `yt-${Date.now()}.ogg`);
  fs.writeFileSync(mp3File, audioBuffer);
  let finalBuffer  = audioBuffer;
  let sendAsDoc    = sizeMB > MAX_SIZE_MB || forceDoc;
  let sendAsVN     = !sendAsDoc || forceVN;

  if (sendAsVN && !sendAsDoc) {
    await m.react("🔄");
    try {
      await execPromise(`ffmpeg -i "${mp3File}" -vn -ar 48000 -ac 1 -c:a libopus -b:a 128k "${vnFile}"`);
      if (fs.existsSync(vnFile)) finalBuffer = fs.readFileSync(vnFile);
    } catch {  }
  }

  const caption =
    `> ✅ *DOWNLOAD SELESAI*\n>\n` +
    `> 🎵 ${info.title}\n` +
    `> 👤 ${info.author}\n` +
    `> ⏱️ ${info.duration > 0 ? formatDur(info.duration) : "Unknown"}\n` +
    `> 📦 ${formatSize(audioBuffer.length)}`;

  const fakeKey = {
    key: {
      remoteJid:   m.chat,
      fromMe:      false,
      id:          crypto.randomBytes(10).toString("hex").toUpperCase(),
      participant: "0@s.whatsapp.net",
    },
    message: {
      extendedTextMessage: {
        text: `🎵 ${info.title}`,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 9999,
          forwardedNewsletterMessageInfo: {
            newsletterJid:    "120363425809110720@newsletter",
            newsletterName:   global.botName || "Bot",
            serverMessageId:  100,
          },
        },
      },
    },
    pushName: global.botName || "Bot",
  };

  try {
    if (sendAsDoc) {
      await conn.sendMessage(m.chat, {
        document: finalBuffer,
        mimetype:  "audio/mpeg",
        fileName:  dlResult.filename || `${info.title.substring(0, 50)}.mp3`,
        caption,
      }, { quoted: fakeKey });
    } else {
      await conn.sendMessage(m.chat, {
        audio:    finalBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt:      true,
        contextInfo: {
          externalAdReply: {
            title:                 "🎵 YouTube Audio",
            body:                  info.title.substring(0, 60),
            thumbnailUrl:          info.thumbnail,
            sourceUrl:             `https://youtu.be/${videoId}`,
            mediaType:             1,
            renderLargerThumbnail: true,
          },
        },
      }, { quoted: fakeKey });
    }
    await m.react("✅");
  } catch (e) {
    await m.react("❌");
    await m.reply(`> ❌ Gagal kirim audio: ${e.message}\n> 🔗 ${dlResult.url}`);
  } finally {
    setTimeout(() => {
      try { if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File); } catch {}
      try { if (fs.existsSync(vnFile))  fs.unlinkSync(vnFile);  } catch {}
    }, 30000);
  }
};

handler.command     = ["playch"];
handler.category    = "tools";
handler.description = "Download audio YouTube sebagai voice note / document";

export { ytSearchCache };
export default handler;
