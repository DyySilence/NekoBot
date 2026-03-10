import axios from "axios";

const BASE_CSV  = "https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/main/dist/base.csv";
const BMKG_URL  = "https://api.bmkg.go.id/publik/prakiraan-cuaca";

const determineBMKGUrl = (code) => {
  const dots     = (code.match(/\./g) || []).length;
  const admLevel = dots + 1;
  return `${BMKG_URL}?adm${admLevel}=${code}`;
};

const calcSimilarity = (query, target) => {
  const q           = query.toLowerCase();
  const t           = target.toLowerCase();
  const queryWords  = q.split(" ").filter((w) => w.length > 0);
  const targetWords = t.split(" ").filter((w) => w.length > 0);

  let wordMatchScore  = 0;
  let exactMatchBonus = 0;

  for (const qw of queryWords) {
    let best = 0;
    for (const tw of targetWords) {
      if (qw === tw) {
        best = 1;
        exactMatchBonus += 0.2;
        break;
      }
      if (tw.includes(qw) || qw.includes(tw)) {
        const score = Math.min(qw.length, tw.length) / Math.max(qw.length, tw.length);
        if (score > best) best = score;
      }
    }
    wordMatchScore += best;
  }

  return wordMatchScore / queryWords.length + exactMatchBonus;
};

const searchWilayah = async (query) => {
  const res   = await axios.get(BASE_CSV, { timeout: 30000 });
  const rows  = res.data.split("\n");
  const results = [];

  for (const row of rows) {
    if (!row.trim()) continue;
    const [kode, nama] = row.split(",");
    if (!nama) continue;

    const score     = calcSimilarity(query, nama);
    const threshold = query.length <= 4 ? 0.4 : 0.3;
    if (score > threshold) results.push({ kode, nama: nama.trim(), score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
};

const getWeatherData = async (kode) => {
  const url = determineBMKGUrl(kode);
  const res = await axios.get(url, { timeout: 30000 });
  return res.data.data;
};

const scrape = async (query) => {
  const wilayahResults = await searchWilayah(query);
  if (!wilayahResults.length) return null;

  const top         = wilayahResults[0];
  const weatherData = await getWeatherData(top.kode);
  return { wilayah: top, weather: weatherData };
};

const formatWeather = (result) => {
  const { wilayah, weather } = result;

  const cuacaList = weather?.[0]?.cuaca?.[0] || [];
  const sekarang  = Array.isArray(cuacaList) ? cuacaList[0] : null;

  const deskripsi  = sekarang?.weather_desc     || "-";
  const suhu       = sekarang?.t                || "-";
  const kelembaban = sekarang?.hu               || "-";
  const angin      = sekarang?.ws               || "-";
  const arahAngin  = sekarang?.wd               || "-";
  const visibility = sekarang?.vs_text          || "-";
  const waktu      = sekarang?.local_datetime   || sekarang?.utc_datetime || "-";

  return (
    `🌦️ *INFO CUACA BMKG*\n\n` +
    `📍 Wilayah    : ${wilayah.nama}\n` +
    `🗂️  Kode       : ${wilayah.kode}\n\n` +
    `☁️  Kondisi    : ${deskripsi}\n` +
    `🌡️  Suhu       : ${suhu}°C\n` +
    `💧 Kelembaban : ${kelembaban}%\n` +
    `💨 Angin      : ${angin} km/h (${arahAngin})\n` +
    `👁️  Jarak Pandang : ${visibility}\n` +
    `🕒 Update     : ${waktu}\n\n` +
    `_Sumber: BMKG Indonesia_`
  );
};

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Contoh:\n.cuaca jakarta\n.cuaca bandung\n.cuaca surabaya");

  await m.react("🌤️");

  try {
    const result = await scrape(text.trim());

    if (!result) {
      await m.react("❌");
      return m.reply(`❌ Wilayah *${text}* tidak ditemukan.\nCoba gunakan nama yang lebih spesifik.`);
    }

    const caption = formatWeather(result);
    await m.reply(caption);
    await m.react("✅");
  } catch (err) {
    console.error("[cuaca]", err.message);
    await m.react("❌");
    m.reply("❌ Gagal mengambil data cuaca. Coba beberapa saat lagi.");
  }
};

handler.command     = ["cuaca"];
handler.category    = "info";
handler.description = "Cek prakiraan cuaca BMKG berdasarkan nama wilayah";

export default handler;
