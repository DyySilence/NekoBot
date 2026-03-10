import axios from "axios";

const BASE    = "https://data.bmkg.go.id/DataMKG/TEWS/";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

const URLS = {
  auto:      BASE + "autogempa.json",
  terkini:   BASE + "gempaterkini.json",
  dirasakan: BASE + "gempadirasakan.json",
};

const fetchJSON = async (url) => {
  const res   = await axios.get(url, { timeout: 30000, headers: HEADERS });
  const clean = JSON.stringify(res.data).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return JSON.parse(clean);
};

const withShakemap = (gempa) => {
  if (!gempa?.Shakemap) return gempa;
  return { ...gempa, downloadShakemap: `${BASE}${gempa.Shakemap}` };
};

const processData = (data) => {
  if (!data?.Infogempa?.gempa) return data;
  const g = data.Infogempa.gempa;
  return {
    ...data,
    Infogempa: {
      ...data.Infogempa,
      gempa: Array.isArray(g) ? g.map(withShakemap) : withShakemap(g),
    },
  };
};

const fetchBMKG = async () => {
  const [auto, terkini, dirasakan] = await Promise.all(Object.values(URLS).map(fetchJSON));
  return {
    auto:      processData(auto),
    terkini:   processData(terkini),
    dirasakan: processData(dirasakan),
  };
};

const formatGempa = (g) =>
  `📅 Tanggal   : ${g.Tanggal || "-"} ${g.Jam || ""}\n` +
  `📍 Wilayah   : ${g.Wilayah || "-"}\n` +
  `💥 Magnitudo : ${g.Magnitude || "-"} SR\n` +
  `🌊 Kedalaman : ${g.Kedalaman || "-"}\n` +
  `🗺️  Koordinat : ${g.Lintang || "-"}, ${g.Bujur || "-"}\n` +
  `🚨 Potensi   : ${g.Potensi || "-"}`;

const handler = async (m, { conn, args }) => {
  const sub = (args[0] || "auto").toLowerCase();

  if (sub === "notif") {
    if (!m.isGroup)  return m.reply("❌ Command ini hanya bisa digunakan di grup!");
    if (!m.isAdmin)  return m.reply("❌ Hanya admin grup yang bisa mengatur notif gempa!");

    const action = (args[1] || "").toLowerCase();
    if (!["on", "off"].includes(action)) {
      return m.reply("Gunakan:\n.gempa notif on\n.gempa notif off");
    }

    if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
    global.db.groups[m.chat].gempanotif = action === "on";

    return m.reply(
      action === "on"
        ? "✅ Notifikasi gempa BMKG *diaktifkan*.\nGrup ini akan menerima update otomatis tiap ada gempa baru."
        : "🔕 Notifikasi gempa BMKG *dinonaktifkan*."
    );
  }

  const valid = ["auto", "terkini", "dirasakan"];
  if (!valid.includes(sub)) {
    return m.reply(
      `Gunakan:\n.gempa auto\n.gempa terkini\n.gempa dirasakan\n.gempa notif on/off`
    );
  }

  await m.react("🌍");

  try {
    const data = await fetchBMKG();
    const info = data[sub]?.Infogempa;

    if (!info) return m.reply("❌ Data gempa tidak tersedia saat ini.");

    if (sub === "auto") {
      const g       = info.gempa;
      const caption =
        `🔴 *GEMPA TERBARU (BMKG)*\n\n` +
        formatGempa(g) +
        (g.downloadShakemap ? `\n\n🗾 Shakemap tersedia` : "");

      if (g.downloadShakemap) {
        await conn.sendMessage(
          m.chat,
          { image: { url: g.downloadShakemap }, caption },
          { quoted: m.fakeObj || m }
        );
      } else {
        await m.reply(caption);
      }
    } else {
      const list  = info.gempa?.slice(0, 5) || [];
      const title = sub === "terkini" ? "GEMPA TERKINI" : "GEMPA DIRASAKAN";

      const caption =
        `📋 *${title} (BMKG)*\n\n` +
        list
          .map((g, i) =>
            `*${i + 1}.* ${g.Wilayah || "-"}\n    M${g.Magnitude || "-"} — ${g.Tanggal || "-"} ${g.Jam || ""}`
          )
          .join("\n\n");

      await m.reply(caption);
    }

    await m.react("✅");
  } catch (err) {
    console.error("[gempa]", err.message);
    await m.react("❌");
    m.reply("❌ Gagal mengambil data gempa dari BMKG.");
  }
};

handler.command     = ["gempa"];
handler.category    = "info";
handler.description = "Info gempa BMKG + notifikasi otomatis grup";
handler.group       = false;

export default handler;
