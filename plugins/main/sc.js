/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, {
    text:
      `> 🐾 *NEKOBOT — SOURCE CODE*\n>\n` +
      `> ✅ *100% FREE & OPEN SOURCE*\n>\n` +
      `> 📦 *GitHub:*\n> https://github.com/DyySilence/NekoBot\n>\n` +
      `> 👨‍💻 *Developer:* DyySilence\n` +
      `> 📅 *Copyright © 2026*\n>\n` +
      `> 📢 *Channel:*\n> https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727\n>\n` +
      `> 💬 *Grup:*\n> https://chat.whatsapp.com/Em0vw6hHyy3IcxMa9SNZ3w\n>\n` +
      `> ━━━━━━━━━━━━━━━━━━━━\n>\n` +
      `> ❌ Dilarang dijual\n` +
      `> ❌ Dilarang hapus credit developer\n` +
      `> ✅ Boleh disebarkan GRATIS\n>\n` +
      `> 🙏 *Thanks To:*\n` +
      `> • whyu (Source / Inspired By)\n` +
      `> • Claude AI | DeepSeek AI | ChatGPT\n>\n` +
      `> Made with ❤️ by *DyySilence*`,
    contextInfo: {
      externalAdReply: {
        title: '🐾 NekoBot — Free Source Code',
        body: 'github.com/DyySilence/NekoBot',
        sourceUrl: 'https://github.com/DyySilence/NekoBot',
        thumbnailUrl: 'https://raw.githubusercontent.com/innng/innng/master/assets/kyubey.gif',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
      },
    },
  }, { quoted: m.fakeObj || m });

  await m.react('🐾');
};

handler.command     = ['sc'];
handler.category    = 'info';
handler.description = 'Kirim link source code bot gratis';

export default handler;