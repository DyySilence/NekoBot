import axios from "axios";

const RSS_URL     = "https://www.bmkg.go.id/alerts/nowcast/id";
const INTERVAL_MS = 5 * 60 * 1000;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

const parseRSS = (xml) => {
  const items   = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of matches) {
    const block = match[1];

    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    const title       = get("title");
    const link        = get("link") || block.match(/<link\s*\/>?\s*(https?:\/\/[^\s<]+)/)?.[1] || "";
    const description = get("description");
    const pubDate     = get("pubDate");
    const author      = get("author");

    if (title) items.push({ title, link, description, pubDate, author });
  }

  return items;
};

const buildAlertId = (item) => `${item.title}_${item.pubDate}`;

const buildCaption = (item) =>
  `⛈️ *PERINGATAN DINI CUACA EKSTREM*\n\n` +
  `📍 Wilayah  : ${item.title}\n` +
  `📝 Info     : ${item.description || "-"}\n` +
  `👤 Petugas  : ${item.author || "BMKG"}\n` +
  `🕒 Waktu    : ${item.pubDate || "-"}\n\n` +
  (item.link ? `🔗 Detail   : ${item.link}\n\n` : "") +
  `_Sumber: BMKG Indonesia_`;

export const startCuacaEkstremNotifier = (sock) => {
  const timer = setInterval(async () => {
    try {
      const res = await axios.get(RSS_URL, { timeout: 30000, headers: HEADERS });
      const xml = typeof res.data === "string" ? res.data : JSON.stringify(res.data);

      const items = parseRSS(xml);
      if (!items.length) return;

      if (!global.db?.settings) global.db.settings = {};
      if (!global.db.settings.lastEkstremIds) global.db.settings.lastEkstremIds = [];

      const lastIds    = global.db.settings.lastEkstremIds;
      const newItems   = items.filter((item) => !lastIds.includes(buildAlertId(item)));

      if (!newItems.length) return;

      global.db.settings.lastEkstremIds = items.map(buildAlertId).slice(0, 20);

      const groups = Object.entries(global.db?.groups ?? {}).filter(
        ([, gdata]) => gdata?.ekstremnotif === true
      );
      if (!groups.length) return;

      for (const item of newItems) {
        const caption = buildCaption(item);

        for (const [groupId] of groups) {
          try {
            await sock.sendMessage(groupId, { text: caption });
          } catch (err) {
            console.error(`[ekstremNotifier] Gagal kirim ke ${groupId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error("[ekstremNotifier] Error polling:", err.message);
    }
  }, INTERVAL_MS);

  return timer;
};
