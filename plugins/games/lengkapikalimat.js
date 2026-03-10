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

const fetchLengkapi = async () => {
  const res  = await fetch("https://raw.githubusercontent.com/qisyana/scrape/main/lengkapikalimat.json");
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("Empty data");
  return data[Math.floor(Math.random() * data.length)];
};

const handler = async (m, { conn, command }) => {
  if (!m.isGroup) return m.reply("> ⚠️ *Command ini hanya untuk grup!*");

  if (command === "nyerah") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "lengkapikalimat") return m.reply("> ❌ Tidak ada game Lengkapi Kalimat yang berjalan!");
    deleteGameSession(m.chat);
    await m.react("🏳️");
    return conn.sendMessage(m.chat, {
      text: `> 🏳️ *MENYERAH!*\n>\n> 📝 Soal: ${sesi.question}\n> ✅ Jawaban: *${sesi.answer}*\n>\n> 💡 Lebih semangat lagi ya!`,
    }, { quoted: m.fakeObj || m });
  }

  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaSec = Math.max(0, Math.floor((existing.expiry - Date.now()) / 1000));
    await m.react("❌");
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n> 📝 ${existing.question}\n> ⏱️ Sisa: ${sisaSec}s\n>\n> 💡 ${global.prefix}nyerah`
    );
  }

  let data;
  try {
    data = await fetchLengkapi();
  } catch (e) {
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengambil data.\n> Error: ${e.message}`);
  }

  const soal  = data?.soal  || data?.kalimat  || data?.pertanyaan || null;
  const jawab = data?.jawaban || data?.answer                     || null;

  if (!soal || !jawab) {
    await m.react("❌");
    return m.reply("> ❌ Data tidak valid. Coba lagi nanti.");
  }

  setGameSession(m.chat, {
    type:     "lengkapikalimat",
    question: soal,
    answer:   jawab,
    reward:   { coin: REWARD_COIN, exp: REWARD_EXP },
  });

  await conn.sendMessage(m.chat, {
    text:
      `📝 *LENGKAPI KALIMAT*\n\n` +
      `✏️ ${soal}\n>\n` +
      `⏱️ Waktu: 5 menit\n\n` +
      `> 💰 *REWARD:*\n` +
      `> 💵 ${REWARD_COIN} coin | ⭐ ${REWARD_EXP} exp\n` +
      `> 💡 ${global.prefix}nyerah untuk menyerah\n` +
      `> ✏️ Lengkapi kalimat di atas!`,
  }, { quoted: m.fakeObj || m });

  await m.react("✅");

  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "lengkapikalimat") return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text: `> ⏰ *WAKTU HABIS!*\n>\n> 📝 ${soal}\n> ✅ Jawaban: *${jawab}*\n>\n> 😔 Tidak ada yang berhasil menjawab!`,
    });
  }, TIME_LIMIT);
};

handler.command     = ["lengkapikalimat"];
handler.category    = "games";
handler.description = "Lengkapi kalimat yang hilang, menang dapat koin!";
handler.group       = true;

export default handler;
