/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const REWARD_COIN = 120;
const REWARD_EXP  = 80;
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

const fetchBendera = async () => {
  try {
    const res  = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera2.json');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[Math.floor(Math.random() * data.length)];
    }
    throw new Error('Empty data');
  } catch {}

  // Prioritas 2: REST Countries API
  try {
    const res       = await fetch('https://restcountries.com/v3.1/all');
    const countries = await res.json();
    const c         = countries[Math.floor(Math.random() * countries.length)];
    return { name: c.name.common, img: c.flags.png || c.flags.svg };
  } catch {}

  // Prioritas 3: FlagCDN (last resort)
  const countryCodes = {
    id: 'Indonesia', my: 'Malaysia', sg: 'Singapore', th: 'Thailand',
    ph: 'Philippines', vn: 'Vietnam', jp: 'Japan', kr: 'South Korea',
    cn: 'China', us: 'United States', gb: 'United Kingdom', fr: 'France',
    de: 'Germany', it: 'Italy', es: 'Spain', br: 'Brazil',
    ar: 'Argentina', mx: 'Mexico', au: 'Australia', in: 'India',
    sa: 'Saudi Arabia', eg: 'Egypt', za: 'South Africa', ng: 'Nigeria',
    ca: 'Canada', ru: 'Russia', tr: 'Turkey', nl: 'Netherlands',
    be: 'Belgium', ch: 'Switzerland', se: 'Sweden', no: 'Norway',
    dk: 'Denmark', fi: 'Finland', pl: 'Poland', ua: 'Ukraine',
    pt: 'Portugal', gr: 'Greece', nz: 'New Zealand', ae: 'United Arab Emirates',
    pk: 'Pakistan', bd: 'Bangladesh',
  };
  const codes      = Object.keys(countryCodes);
  const randomCode = codes[Math.floor(Math.random() * codes.length)];
  return { name: countryCodes[randomCode], img: `https://flagcdn.com/w320/${randomCode}.png` };
};

const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('> ⚠️ *Command ini hanya untuk grup!*');
  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaMs  = existing.expiry - Date.now();
    const sisaSec = Math.max(0, Math.floor(sisaMs / 1000));
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n` +
      `> 📝 Soal: Tebak Bendera\n` +
      `> ⏱️ Sisa waktu: ${sisaSec}s\n>\n` +
      `> 💡 ${global.prefix}hint | ${global.prefix}nyerah`
    );
  }

  await m.react('🔍');

  let data;
  try {
    data = await fetchBendera();
  } catch (e) {
    await m.react('❌');
    return m.reply('> ❌ Gagal mengambil data. Coba lagi nanti.');
  }

  if (!data?.img) {
    await m.react('❌');
    return m.reply('> ❌ Data bendera tidak valid. Coba lagi nanti.');
  }

  setGameSession(m.chat, {
    type:       'tebakbendera',
    question:   'Bendera Negara',
    answer:     data.name,
    image:      data.img,
    reward:     { coin: REWARD_COIN, exp: REWARD_EXP },
    hintsUsed:  0,
    attempts:   0,
  });

  await conn.sendMessage(m.chat, {
    image:   { url: data.img },
    caption:
      `> 🎮 *TEBAK BENDERA*\n>\n` +
      `> ❓ Bendera negara mana ini?\n` +
      `> ⏱️ Waktu: 5 menit\n>\n` +
      `> 💰 *REWARD:*\n` +
      `> 💵 ${REWARD_COIN} coin\n` +
      `> ⭐ ${REWARD_EXP} exp\n>\n` +
      `> 💡 ${global.prefix}hint | ${global.prefix}nyerah\n>\n` +
      `> ✏️ Ketik nama negaranya!`,
  }, { quoted: m.fakeObj || m });

  await m.react('✅');

  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi) return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text:
        `> ⏰ *WAKTU HABIS!*\n>\n` +
        `> 📝 Soal: Tebak Bendera\n` +
        `> ✅ Jawaban: *${data.name}*\n>\n` +
        `> 😔 Tidak ada yang berhasil menjawab.`,
    });
  }, TIME_LIMIT);
};

handler.command     = ['tebakbendera'];
handler.category    = 'games';
handler.description = 'Tebak bendera negara, menang dapat koin!';
handler.group       = true;

export default handler;
export { getGameSession, setGameSession, deleteGameSession, ensureUser };
