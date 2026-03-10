import axios from "axios";

const INTERVAL_MS = 60 * 60 * 1000;

const fetchTerbaru = async () => {
  const { data } = await axios.get(`${global.apiUrl}/anime/terbaru`, { timeout: 30000 });
  if (!data?.status || !data.results?.length) throw new Error("Data kosong");
  return data.results;
};

const buildCaption = (a) =>
  `🆕 *EPISODE BARU*\n\n` +
  `🎌 *${a.title}*\n` +
  `🎬 ${a.eps || "-"}\n` +
  `🔗 ${a.link}\n\n` +
  `_via Oploverz_`;

export const startAnimeNotifier = (sock) => {
  const timer = setInterval(async () => {
    try {
      const results = await fetchTerbaru();

      if (!global.db?.settings) global.db.settings = {};
      if (!global.db.settings.lastAnimeEps) global.db.settings.lastAnimeEps = [];

      const lastLinks = new Set(global.db.settings.lastAnimeEps);
      const newEps    = results.filter((a) => !lastLinks.has(a.link));

      if (!newEps.length) return;

      global.db.settings.lastAnimeEps = results.map((a) => a.link).slice(0, 50);

      const groups = Object.entries(global.db?.groups ?? {}).filter(
        ([, gdata]) => gdata?.animenotif === true
      );
      if (!groups.length) return;

      for (const ep of newEps) {
        const caption = buildCaption(ep);

        for (const [groupId] of groups) {
          try {
            if (ep.image) {
              await sock.sendMessage(groupId, {
                image:   { url: ep.image },
                caption,
              });
            } else {
              await sock.sendMessage(groupId, { text: caption });
            }
          } catch (err) {
            console.error(`[animeNotifier] Gagal kirim ke ${groupId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error("[animeNotifier] Error polling:", err.message);
    }
  }, INTERVAL_MS);

  return timer;
};
