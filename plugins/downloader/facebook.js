/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
} from "baileys";

const qualityCache = new Map();

async function sendQualityButtons(conn, m, data, cacheKey) {
  const { title, duration, qualities, selected } = data;
  
  const rows = qualities.map((q, i) => ({
    title: `${q.quality} ${q.downloadUrl ? "✅" : "⚡"}`,
    description: q.downloadUrl ? "Siap download" : "Direct stream",
    id: `.fbdl ${i + 1}`,
  }));

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "🎬 Pilih Kualitas Video",
        id: " "
      }),
    },
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "Pilih Kualitas Video",
        sections: [
          {
            title: "📊 Daftar Kualitas",
            rows: rows,
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
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
              title: "🎬 *FACEBOOK VIDEO*",
              subtitle: "Pilih kualitas yang diinginkan",
              hasMediaAttachment: false,
            }),
            body: proto.Message.InteractiveMessage.Body.create({
              text: 
                `> 📝 *Judul:* ${title}\n` +
                `> ⏱️ *Durasi:* ${duration}\n` +
                (selected ? `> 🏆 *Rekomendasi:* ${selected.quality}\n` : "") +
                `>\n` +
                `> ✅ = Siap download\n` +
                `> ⚡ = Direct stream\n` +
                `>\n` +
                `> ⏳ Pilihan expired dalam *5 menit*`
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: global.botName || "NekoBot",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: buttons,
            }),
          }),
        },
      },
    }),
    { quoted: m }
  );

  await conn.relayMessage(m.chat, interactiveMsg.message, {
    messageId: interactiveMsg.key.id,
  });
}

const handler = async (m, { conn, text, command, args }) => {
  if (command === "fbdl") {
    const idx = parseInt(args[0]);
    const cacheKey = `${m.chat}_${m.sender}`;
    const cached = qualityCache.get(cacheKey);

    if (!cached) {
      return m.reply(`> ❌ Sesi pilihan kualitas sudah expired.\n> 🔄 Silakan download ulang dengan .fb <url>`);
    }

    const quality = cached.qualities[idx - 1];
    if (!quality) {
      return m.reply(`> ❌ Kualitas tidak valid. Silakan pilih dari menu yang tersedia.`);
    }

    const downloadUrl = quality.downloadUrl || quality.videoUrl;
    if (!downloadUrl) {
      return m.reply(`> ❌ Kualitas *${quality.quality}* membutuhkan render dan tidak tersedia untuk download langsung.\n> 💡 Pilih kualitas lain.`);
    }

    await m.react("⏳");
    try {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: downloadUrl },
          caption:
            `> 🎬 *FACEBOOK VIDEO*\n>\n` +
            `> 📝 *Judul:* ${cached.title}\n` +
            `> 🎞️ *Kualitas:* ${quality.quality}\n` +
            `> ⏱️ *Durasi:* ${cached.duration}\n>\n` +
            `> ✅ Download berhasil!`,
          mimetype: "video/mp4",
          gifPlayback: false,
        },
        { quoted: m }
      );
      await m.react("✅");
      qualityCache.delete(cacheKey);
    } catch (err) {
      await m.react("⚠️");
      await m.reply(`> ⚠️ Gagal kirim video: ${err.message}\n> 🔗 Download manual: ${downloadUrl}`);
    }
    return;
  }

  if (command === "fb" || command === "facebook") {
    if (!text?.trim()) {
      const helpMsg = generateWAMessageFromContent(
        m.chat,
        proto.Message.fromObject({
          viewOnceMessage: {
            message: {
              interactiveMessage: proto.Message.InteractiveMessage.create({
                header: proto.Message.InteractiveMessage.Header.create({
                  title: "🎬 *FACEBOOK DOWNLOADER*",
                  hasMediaAttachment: false,
                }),
                body: proto.Message.InteractiveMessage.Body.create({
                  text: 
                    `> 📝 *Cara Pakai:*\n` +
                    `> Kirim link Facebook dengan command:\n` +
                    `> .fb <url>\n` +
                    `> .facebook <url>\n>\n` +
                    `> 💡 *Contoh:*\n` +
                    `> .fb https://www.facebook.com/share/r/xxx\n` +
                    `> .fb https://fb.watch/xxx`
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: global.botName || "NekoBot",
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "📱 Contoh Link",
                        id: ".fb https://fb.watch/xxx"
                      }),
                    }
                  ],
                }),
              }),
            },
          },
        }),
        { quoted: m }
      );
      
      return await conn.relayMessage(m.chat, helpMsg.message, {
        messageId: helpMsg.key.id,
      });
    }

    const fbPattern = /facebook\.com|fb\.watch|fb\.com/i;
    if (!fbPattern.test(text)) {
      return m.reply(
        `> ❌ *URL TIDAK VALID*\n>\n` +
        `> 📝 Format yang benar:\n` +
        `> • https://www.facebook.com/share/r/xxx\n` +
        `> • https://fb.watch/xxx`
      );
    }

    await m.react("⏳");

    let result;
    try {
      const { data } = await axios.get(`${global.apiUrl}/downloader/facebook`, {
        params: { url: text.trim() },
        timeout: 30000,
      });
      if (!data?.status) throw new Error(data?.error || "API returned false status");
      result = data;
    } catch (err) {
      await m.react("❌");
      return m.reply(
        `> ❌ *DOWNLOAD GAGAL*\n>\n` +
        `> 🔧 Error: ${err.message}\n>\n` +
        `> 💡 Kemungkinan penyebab:\n` +
        `> • URL tidak valid atau konten dihapus\n` +
        `> • Video private/terbatas\n` +
        `> • API sedang down\n>\n` +
        `> 🔄 Coba lagi dalam beberapa saat!`
      );
    }

    const { title = "Facebook Video", duration = "", qualities = [], selected } = result;
    const available = qualities.filter(q => q.downloadUrl || q.videoUrl);

    if (!available.length) {
      await m.react("❌");
      return m.reply(`> ❌ Tidak ada kualitas yang tersedia untuk video ini.`);
    }

    const cacheKey = `${m.chat}_${m.sender}`;
    qualityCache.set(cacheKey, {
      title,
      duration,
      qualities: available,
    });
    setTimeout(() => qualityCache.delete(cacheKey), 5 * 60 * 1000);

    await sendQualityButtons(conn, m, {
      title,
      duration,
      qualities: available,
      selected
    }, cacheKey);
    
    await m.react("✅");
  }
};

handler.command = ["facebook", "fb", "fbdl"];
handler.category = "downloader";
handler.description = "Download Facebook Video dengan pilihan kualitas (button)";

export default handler;