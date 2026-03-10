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

const fetchData = async () => {
  const res  = await fetch("https://raw.githubusercontent.com/siputzx/tebak-jkt/refs/heads/main/tebak.json");
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("Empty data");
  return data[Math.floor(Math.random() * data.length)];
};

const buildHint = (name, revealed) =>
  name.split("").map((c, i) => c === " " ? " " : revealed.has(i) ? c : "_").join(" ");

const handler = async (m, { conn, command }) => {
  if (!m.isGroup) return m.reply("> ⚠️ *Command ini hanya untuk grup!*");

  if (command === "nyerah") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebakjkt48") return m.reply("> ❌ Tidak ada game Tebak JKT48 yang berjalan!");
    deleteGameSession(m.chat);
    await m.react("🏳️");
    return conn.sendMessage(m.chat, {
      text: `> 🏳️ *MENYERAH!*\n>\n> 👧 Jawaban: *${sesi.answer}*\n>\n> 💡 Lebih semangat lagi ya!`,
    }, { quoted: m.fakeObj || m });
  }

  if (command === "hint") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebakjkt48") return m.reply("> ❌ Tidak ada game Tebak JKT48 yang berjalan!");
    const revealed = new Set(sesi.revealed || []);
    const name     = sesi.answer;
    const indices  = [...Array(name.length).keys()].filter(i => name[i] !== " " && !revealed.has(i));
    if (!indices.length) return m.reply("> ⚠️ Semua huruf sudah terbuka!");
    revealed.add(indices[Math.floor(Math.random() * indices.length)]);
    sesi.revealed  = [...revealed];
    sesi.hintsUsed = (sesi.hintsUsed || 0) + 1;
    ensureGroup(m.chat).gameSession = sesi;
    global.db.groups[m.chat]        = ensureGroup(m.chat);
    return m.reply(
      `> 💡 *HINT #${sesi.hintsUsed}*\n>\n` +
      `> 👧 ${buildHint(name, revealed)}\n>\n` +
      `> ⏱️ Sisa: ${Math.max(0, Math.floor((sesi.expiry - Date.now()) / 1000))}s`
    );
  }

  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaSec = Math.max(0, Math.floor((existing.expiry - Date.now()) / 1000));
    await m.react("❌");
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n> 🎮 Tipe: Tebak JKT48\n> ⏱️ Sisa: ${sisaSec}s\n>\n> 💡 ${global.prefix}hint | ${global.prefix}nyerah`
    );
  }

  await m.reply("> 🎀 *Memuat data member...*");

  let data;
  try {
    data = await fetchData();
  } catch (e) {
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengambil data.\n> Error: ${e.message}`);
  }

  if (!data?.gambar || !data?.jawaban) {
    await m.react("❌");
    return m.reply("> ❌ Data tidak valid. Coba lagi nanti.");
  }

  setGameSession(m.chat, {
    type:      "tebakjkt48",
    answer:    data.jawaban,
    reward:    { coin: REWARD_COIN, exp: REWARD_EXP },
    hintsUsed: 0,
    revealed:  [],
  });

  try {
    await conn.sendMessage(m.chat, {
      image:   { url: data.gambar },
      caption:
        `🎀 *TEBAK MEMBER JKT48*\n\n` +
        `👧 Siapakah member ini?\n` +
        `⏱️ Waktu: 5 menit\n\n` +
        `> 💰 *REWARD:*\n` +
        `> 💵 ${REWARD_COIN} coin | ⭐ ${REWARD_EXP} exp\n` +
        `> 💡 ${global.prefix}hint | ${global.prefix}nyerah\n` +
        `> ✏️ Ketik nama membernya!`,
    }, { quoted: m.fakeObj || m });
  } catch {
    deleteGameSession(m.chat);
    await m.react("❌");
    return m.reply("> ❌ Gagal mengirim gambar. Coba lagi!");
  }

  await m.react("✅");

  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebakjkt48") return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text: `> ⏰ *WAKTU HABIS!*\n>\n> 👧 Jawaban: *${data.jawaban}*\n>\n> 😔 Tidak ada yang berhasil menebak!`,
    });
  }, TIME_LIMIT);
};

handler.command     = ["tebakjkt48"];
handler.category    = "games";
handler.description = "Tebak member JKT48 dari fotonya, menang dapat koin!";
handler.group       = true;

export default handler;
