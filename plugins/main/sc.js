/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn }) => {
  await m.react("⭐");

  const repoUrl  = "https://github.com/DyySilence/NekoBot";
  const rawThumb = "https://opengraph.githubassets.com/1/DyySilence/NekoBot";

  await conn.sendMessage(m.chat, {
    text: `🐾 *${global.botName || "NekoBot — DS"}*\n\n` +
          `📦 *Base Open Source WhatsApp Bot*\n` +
          `⚡ Berbasis Baileys — Type Module (ESM)\n` +
          
          `⭐ *Star & Fork gratis di GitHub!*\n\n` +
          `${repoUrl}`,
    contextInfo: {
      externalAdReply: {
        title: `${global.botName || "NekoBot — DS"}`,
        body: `Open Source WA Bot by ${global.namaOwner || "DyySilence"}`,
        thumbnailUrl: rawThumb,
        sourceUrl: repoUrl,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m.fakeObj || m });
};

handler.command     = ["sc"];
handler.category    = "main";
handler.description = "Tampilkan link GitHub source code bot";

export default handler;