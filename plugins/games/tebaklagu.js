/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const REWARD_COIN = 140;
const REWARD_EXP  = 90;
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
  const res  = await fetch("https://raw.githubusercontent.com/qisyana/scrape/main/tebaklagu.json");
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("Empty data");
  return data[Math.floor(Math.random() * data.length)];
};

const buildHint = (text, revealed) =>
  text.split("").map((c, i) => c === " " ? " " : revealed.has(i) ? c : "_").join(" ");

const handler = async (m, { conn, command }) => {
  if (!m.isGroup) return m.reply("> ⚠️ *Command ini hanya untuk grup!*");

  if (command === "nyerah") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebaklagu") return m.reply("> ❌ Tidak ada game Tebak Lagu yang berjalan!");
    deleteGameSession(m.chat);
    await m.react("🏳️");
    return conn.sendMessage(m.chat, {
      text:
        `> 🏳️ *MENYERAH!*\n>\n` +
        `> 🎵 Judul: *${sesi.answer}*\n` +
        `> 🎤 Artis: *${sesi.artis}*\n>\n` +
        `> 💡 Lebih semangat lagi ya!`,
    }, { quoted: m.fakeObj || m });
  }

  if (command === "hint") {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebaklagu") return m.reply("> ❌ Tidak ada game Tebak Lagu yang berjalan!");
    const revealed = new Set(sesi.revealed || []);
    const answer   = sesi.answer;
    const indices  = [...Array(answer.length).keys()].filter(i => answer[i] !== " " && !revealed.has(i));
    if (!indices.length) return m.reply("> ⚠️ Semua huruf sudah terbuka!");
    revealed.add(indices[Math.floor(Math.random() * indices.length)]);
    sesi.revealed  = [...revealed];
    sesi.hintsUsed = (sesi.hintsUsed || 0) + 1;
    ensureGroup(m.chat).gameSession = sesi;
    global.db.groups[m.chat]        = ensureGroup(m.chat);
    return m.reply(
      `> 💡 *HINT #${sesi.hintsUsed}*\n>\n` +
      `> 🎵 ${buildHint(answer, revealed)}\n>\n` +
      `> ⏱️ Sisa: ${Math.max(0, Math.floor((sesi.expiry - Date.now()) / 1000))}s`
    );
  }

  const existing = getGameSession(m.chat);
  if (existing) {
    const sisaSec = Math.max(0, Math.floor((existing.expiry - Date.now()) / 1000));
    await m.react("❌");
    return m.reply(
      `> ⚠️ *GAME MASIH BERJALAN!*\n>\n> 🎮 Tipe: Tebak Lagu\n> ⏱️ Sisa: ${sisaSec}s\n>\n> 💡 ${global.prefix}hint | ${global.prefix}nyerah`
    );
  }

  let data;
  try {
    data = await fetchData();
  } catch (e) {
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengambil data.\n> Error: ${e.message}`);
  }

  const audioUrl = data?.lagu   || data?.audio || data?.url  || null;
  const judul    = data?.judul  || data?.title  || data?.jawaban || null;
  const artis    = data?.artis  || data?.artist || "";

  if (!audioUrl || !judul) {
    await m.react("❌");
    return m.reply("> ❌ Data tidak valid. Coba lagi nanti.");
  }

  setGameSession(m.chat, {
    type:      "tebaklagu",
    answer:    judul,
    artis,
    audioUrl,
    reward:    { coin: REWARD_COIN, exp: REWARD_EXP },
    hintsUsed: 0,
    revealed:  [],
  });

  try {
    await conn.sendMessage(m.chat, {
      audio:    { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt:      false,
    }, { quoted: m.fakeObj || m });
  } catch (err) {
    deleteGameSession(m.chat);
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengirim audio.\n> Error: ${err.message}`);
  }

  await conn.sendMessage(m.chat, {
    text:
      `🎵 *TEBAK LAGU*\n\n` +
      `🎧 Dengarkan audio di atas!\n` +
      `🎤 Lagu apakah itu?\n` +
      `⏱️ Waktu: 5 menit\n\n` +
      `> 💰 *REWARD:*\n` +
      `> 💵 ${REWARD_COIN} coin | ⭐ ${REWARD_EXP} exp\n` +
      `> 💡 ${global.prefix}hint | ${global.prefix}nyerah\n` +
      `> ✏️ Ketik judul lagunya!`,
  }, { quoted: m.fakeObj || m });

  await m.react("✅");

  setTimeout(async () => {
    const sesi = getGameSession(m.chat);
    if (!sesi || sesi.type !== "tebaklagu") return;
    deleteGameSession(m.chat);
    await conn.sendMessage(m.chat, {
      text:
        `> ⏰ *WAKTU HABIS!*\n>\n` +
        `> 🎵 Judul: *${judul}*\n` +
        `> 🎤 Artis: *${artis}*\n>\n` +
        `> 😔 Tidak ada yang berhasil menebak!`,
    });
  }, TIME_LIMIT);
};

handler.command     = ["tebaklagu"];
handler.category    = "games";
handler.description = "Tebak judul lagu dari audionya, menang dapat koin!";
handler.group       = true;

export default handler;
