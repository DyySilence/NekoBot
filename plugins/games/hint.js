/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const ensureGroup = (chat) => {
  if (!global.db.groups[chat]) global.db.groups[chat] = {};
  return global.db.groups[chat];
};

const getGameSession = (chat) => {
  const g = ensureGroup(chat);
  if (!g.gameSession) return null;
  if (g.gameSession.expiry && Date.now() > g.gameSession.expiry) {
    delete g.gameSession;
    global.db.groups[chat] = g;
    return null;
  }
  return g.gameSession;
};
const makeHint = (answer = '', hintsUsed = 0) => {
  const revealCount = Math.min(hintsUsed + 1, Math.ceil(answer.length / 2));
  const arr         = answer.split('');
  const revealed = new Set([0]);

  while (revealed.size < revealCount && revealed.size < arr.length) {
    revealed.add(Math.floor(Math.random() * arr.length));
  }

  return arr
    .map((ch, i) => (ch === ' ' ? ' ' : revealed.has(i) ? ch : '_'))
    .join(' ');
};

const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('> ⚠️ *Command ini hanya untuk grup!*');

  const sesi = getGameSession(m.chat);
  if (!sesi) {
    await m.react('❌');
    return m.reply('> ❌ *Tidak ada game yang sedang berjalan!*');
  }

  const MAX_HINTS   = 3;
  const hintsUsed   = sesi.hintsUsed ?? 0;

  if (hintsUsed >= MAX_HINTS) {
    return m.reply(
      `> 💡 *HINT*\n>\n` +
      `> ⚠️ Hint sudah habis! (${MAX_HINTS}/${MAX_HINTS})\n>\n` +
      `> 💡 ${global.prefix}nyerah untuk menyerah`
    );
  }

  const answer      = Array.isArray(sesi.answer) ? sesi.answer[0] : sesi.answer;
  const hint        = makeHint(answer, hintsUsed);
  const newHintUsed = hintsUsed + 1;
  const g = ensureGroup(m.chat);
  g.gameSession.hintsUsed = newHintUsed;
  global.db.groups[m.chat] = g;

  const sisaMs  = sesi.expiry - Date.now();
  const sisaSec = Math.max(0, Math.floor(sisaMs / 1000));

  await m.reply(
    `> 💡 *HINT ${newHintUsed}/${MAX_HINTS}*\n>\n` +
    `> 📝 Soal: ${sesi.question}\n>\n` +
    `> 🔤 Clue: \`${hint}\`\n` +
    `> 📏 Panjang: ${answer.length} huruf\n>\n` +
    `> ⏱️ Sisa: ${sisaSec}s`
  );

  await m.react('💡');
};

handler.command     = ['hint'];
handler.category    = 'games';
handler.description = 'Minta hint untuk game yang sedang berjalan';
handler.group       = true;

export default handler;
