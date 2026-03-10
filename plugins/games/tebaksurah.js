/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const REWARD_COIN = 200;
const REWARD_EXP  = 150;
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

const fetchAyah = async () => {
  const ayahNum = Math.floor(Math.random() * 6236) + 1;
  const res     = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/ar.alafasy`);
  const json    = await res.json();
  if (!json?.data) throw new Error("Data ayat tidak ditemukan");
  return json.data;
};

const handler = async (m, { conn, command }) => {
  if (!m.isGroup) return m.reply("> ⚠️ *Command ini hanya untuk grup!*");

  if (command === "nyerah") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebaksurah") return m.reply("> ❌ Tidak ada game Tebak Surah yang berjalan!");
    deleteGameSession(m.chat);
    await m.react("🏳️");
    return conn.sendMessage(m.chat, {
      text:
        `> 🏳️ *MENYERAH!*\n>\n` +
        `> 📖 Surah: *${sesi.displayAnswer}*\n` +
        `> 🔢 QS. ${sesi.displayAnswer}: ${sesi.numberInSurah}\n>\n` +
        `> 💡 Pelajari Al-Qur'an lebih banyak ya!`,
    }, { quoted: m.fakeObj || m });
  }

  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaSec = Math.max(0, Math.floor((existing.expiry - Date.now()) / 1000));
    await m.react("❌");
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n> 🎮 Tipe: Tebak Surah\n> ⏱️ Sisa: ${sisaSec}s\n>\n> 💡 ${global.prefix}nyerah`
    );
  }

  let ayah;
  try {
    ayah = await fetchAyah();
  } catch (e) {
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengambil data ayat.\n> Error: ${e.message}`);
  }

  const ayahText      = ayah?.text                || null;
  const audioUrl      = ayah?.audio               || null;
  const surahName     = ayah?.surah?.englishName  || null;
  const surahNameAr   = ayah?.surah?.name         || null;
  const numberInSurah = ayah?.numberInSurah       || "?";

  if (!ayahText || !surahName) {
    await m.react("❌");
    return m.reply("> ❌ Data tidak valid. Coba lagi nanti.");
  }

  const answers      = [surahName, surahNameAr].filter(Boolean);
  const displayAnswer = `${surahName} (${surahNameAr})`;

  setGameSession(m.chat, {
    type:          "tebaksurah",
    answer:        answers,
    displayAnswer,
    numberInSurah,
    audioUrl,
    reward:        { coin: REWARD_COIN, exp: REWARD_EXP },
  });

  if (audioUrl) {
    try {
      await conn.sendMessage(m.chat, {
        audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: false,
      }, { quoted: m.fakeObj || m });
    } catch {}
  }

  await conn.sendMessage(m.chat, {
    text:
      `📖 *TEBAK SURAH*\n\n` +
      `🕌 *Ayat berikut dari surah apa?*\n\n` +
      `﴾ ${ayahText} ﴿\n\n` +
      (audioUrl ? `> 🎵 Dengarkan juga audio tilawahnya!\n` : "") +
      `⏱️ Waktu: 5 menit\n\n` +
      `> 💰 *REWARD:*\n` +
      `> 💵 ${REWARD_COIN} coin | ⭐ ${REWARD_EXP} exp\n` +
      `> 💡 ${global.prefix}nyerah untuk menyerah\n` +
      `> ✏️ Ketik nama surahnya!`,
  }, { quoted: m.fakeObj || m });

  await m.react("✅");

  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebaksurah") return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text:
        `> ⏰ *WAKTU HABIS!*\n>\n` +
        `> 📖 Surah: *${displayAnswer}*\n` +
        `> 🔢 Ayat ke-${numberInSurah}\n>\n` +
        `> 😔 Tidak ada yang berhasil menjawab!`,
    });
  }, TIME_LIMIT);
};

handler.command     = ["tebaksurah"];
handler.category    = "games";
handler.description = "Tebak nama surah dari ayat Al-Qur'an, menang dapat koin!";
handler.group       = true;

export default handler;
