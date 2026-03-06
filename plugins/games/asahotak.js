/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const REWARD_COIN = 110;
const REWARD_EXP  = 75;
const TIME_LIMIT  = 5 * 60 * 1000; 

const ensureUser = (jid) => {
  if (!global.db.users[jid]) global.db.users[jid] = {};
  const u = global.db.users[jid];
  if (typeof u.coin !== 'number') u.coin = 0;
  if (typeof u.exp  !== 'number') u.exp  = 0;
  return u;
};

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

const setGameSession = (chat, data) => {
  const g = ensureGroup(chat);
  g.gameSession = { ...data, startTime: Date.now(), expiry: Date.now() + TIME_LIMIT };
  global.db.groups[chat] = g;
};

const deleteGameSession = (chat) => {
  const g = ensureGroup(chat);
  delete g.gameSession;
  global.db.groups[chat] = g;
};

const fetchAsahOtak = async () => {
  const res  = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json');
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('Empty data');
  return data[Math.floor(Math.random() * data.length)];
};

const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('> ⚠️ *Command ini hanya untuk grup!*');

  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaMs  = existing.expiry - Date.now();
    const sisaSec = Math.max(0, Math.floor(sisaMs / 1000));
    await m.react('❌');
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n` +
      `> 📝 ${existing.question}\n` +
      `> ⏱️ Sisa: ${sisaSec}s\n>\n` +
      `> 💡 ${global.prefix}hint | ${global.prefix}nyerah`
    );
  }

  await m.reply('> 🧠 *Memuat teka-teki...*');

  let data;
  try {
    data = await fetchAsahOtak();
  } catch (e) {
    await m.react('❌');
    return m.reply('> ❌ Gagal mengambil data. Coba lagi nanti.');
  }

  if (!data?.soal || !data?.jawaban) {
    await m.react('❌');
    return m.reply('> ❌ Data tidak valid. Coba lagi nanti.');
  }

  setGameSession(m.chat, {
    type:      'asahotak',
    question:  data.soal,
    answer:    data.jawaban,
    reward:    { coin: REWARD_COIN, exp: REWARD_EXP },
    hintsUsed: 0,
    attempts:  0,
  });

  await m.reply(
    `> 🧠 *ASAH OTAK*\n>\n` +
    `> ❓ ${data.soal}\n>\n` +
    `> ⏱️ Waktu: 5 menit\n>\n` +
    `> 💰 *REWARD:*\n` +
    `> 💵 ${REWARD_COIN} coin | ⭐ ${REWARD_EXP} exp\n>\n` +
    `> 💡 ${global.prefix}hint | ${global.prefix}nyerah\n>\n` +
    `> ✏️ Ketik jawabanmu!`
  );

  await m.react('✅');
  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi) return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text:
        `> ⏰ *WAKTU HABIS!*\n>\n` +
        `> 📝 Soal: ${data.soal}\n` +
        `> ✅ Jawaban: *${data.jawaban}*\n>\n` +
        `> 😔 Tidak ada yang berhasil menjawab.`,
    });
  }, TIME_LIMIT);
};

handler.command     = ['asahotak'];
handler.category    = 'games';
handler.description = 'Asah otak dengan teka-teki, menang dapat koin!';
handler.group       = true;

export default handler;

export { getGameSession, setGameSession, deleteGameSession, ensureUser };
