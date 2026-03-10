/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn, participants }) => {
  const users = global.db?.users ?? {};
  const sorted = Object.entries(users)
    .filter(([, u]) => typeof u.coin === 'number' && u.coin > 0)
    .sort(([, a], [, b]) => b.coin - a.coin)
    .slice(0, 10);

  if (!sorted.length) {
    return m.reply('> 💰 *TOP COIN*\n>\n> ❌ Belum ada data coin.');
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const mentions = sorted.map(([jid]) => jid);

  let text = `> 💰 *TOP 10 COIN*\n>\n`;

  sorted.forEach(([jid, u], i) => {
    const tag = `@${jid.split('@')[0]}`;
    text += `> ${medals[i]} ${tag} — *${(u.coin).toLocaleString('id-ID')}* coin\n`;
  });

  text += `>\n> 🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

  await conn.sendMessage(m.chat, {
    text,
    mentions,
    contextInfo: {
      forwardingScore: 9999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363425809110720@newsletter',
        newsletterName: global.botName || 'Bot',
        serverMessageId: 100,
      },
    },
  }, { quoted: m.fakeObj || m });
};

handler.command     = ['topcoin', 'top'];
handler.category    = 'games';
handler.description = 'Lihat 10 user dengan coin terbanyak';

export default handler;
