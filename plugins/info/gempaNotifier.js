import axios from "axios";

const TEWS_BASE   = "https://data.bmkg.go.id/DataMKG/TEWS/";
const URL_AUTO    = TEWS_BASE + "autogempa.json";
const INTERVAL_MS = 60_000;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

const fetchLatestGempa = async () => {
  const res   = await axios.get(URL_AUTO, { timeout: 30000, headers: HEADERS });
  const clean = JSON.stringify(res.data).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  const data  = JSON.parse(clean);
  const g     = data?.Infogempa?.gempa;
  if (!g) throw new Error("Data gempa kosong");
  return g;
};

const buildGempaId = (g) => `${g.Tanggal}_${g.Jam}_${g.Magnitude}_${g.Lintang}_${g.Bujur}`;

const getShakemapUrl = (g) =>
  g.Shakemap ? `${TEWS_BASE}${g.Shakemap}` : null;

const buildCaption = (g) =>
  `🚨 *NOTIFIKASI GEMPA BUMI (BMKG)*\n\n` +
  `📅 Tanggal   : ${g.Tanggal || "-"} ${g.Jam || ""}\n` +
  `📍 Wilayah   : ${g.Wilayah || "-"}\n` +
  `💥 Magnitudo : ${g.Magnitude || "-"} SR\n` +
  `🌊 Kedalaman : ${g.Kedalaman || "-"}\n` +
  `🗺️  Koordinat : ${g.Lintang || "-"}, ${g.Bujur || "-"}\n` +
  `🚨 Potensi   : ${g.Potensi || "-"}\n` +
  (g.Dirasakan ? `📡 Dirasakan  : ${g.Dirasakan}\n` : "") +
  `\n_Sumber: BMKG Indonesia_`;

export const startGempaNotifier = (sock) => {
  const timer = setInterval(async () => {
    try {
      const g       = await fetchLatestGempa();
      const gempaId = buildGempaId(g);

      if (!global.db?.settings) global.db.settings = {};

      if (global.db.settings.lastGempaId === gempaId) return;
      global.db.settings.lastGempaId = gempaId;

      const groups = Object.entries(global.db?.groups ?? {}).filter(
        ([, gdata]) => gdata?.gempanotif === true
      );
      if (!groups.length) return;

      const shakemapUrl = getShakemapUrl(g);
      const caption     = buildCaption(g);

      for (const [groupId] of groups) {
        try {
          if (shakemapUrl) {
            await sock.sendMessage(groupId, {
              image:   { url: shakemapUrl },
              caption,
            });
          } else {
            await sock.sendMessage(groupId, { text: caption });
          }
        } catch (err) {
          console.error(`[gempaNotifier] Gagal kirim ke ${groupId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[gempaNotifier] Error polling:", err.message);
    }
  }, INTERVAL_MS);

  return timer;
};
