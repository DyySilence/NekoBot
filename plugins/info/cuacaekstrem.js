import axios from "axios";

const RSS_URL = "https://www.bmkg.go.id/alerts/nowcast/id";
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

const fetchAlerts = async () => {
  const res = await axios.get(RSS_URL, { timeout: 30000, headers: HEADERS });
  const xml = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  return parseRSS(xml);
};

const handler = async (m, { conn, args }) => {
  const sub = (args[0] || "").toLowerCase();

  if (sub === "notif") {
    if (!m.isGroup) return m.reply("❌ Command ini hanya bisa digunakan di grup!");
    if (!m.isAdmin) return m.reply("❌ Hanya admin grup yang bisa mengatur notif cuaca ekstrem!");

    const action = (args[1] || "").toLowerCase();
    if (!["on", "off"].includes(action)) {
      return m.reply("Gunakan:\n.cuacaekstrem notif on\n.cuacaekstrem notif off");
    }

    if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
    global.db.groups[m.chat].ekstremnotif = action === "on";

    return m.reply(
      action === "on"
        ? "✅ Notifikasi cuaca ekstrem BMKG *diaktifkan*.\nGrup ini akan menerima peringatan dini otomatis dari BMKG."
        : "🔕 Notifikasi cuaca ekstrem BMKG *dinonaktifkan*."
    );
  }

  await m.react("⛈️");

  try {
    const items = await fetchAlerts();

    if (!items.length) {
      await m.react("✅");
      return m.reply("✅ Tidak ada peringatan cuaca ekstrem aktif saat ini.");
    }

    const list = items.slice(0, 5);
    const caption =
      `⛈️ *PERINGATAN DINI CUACA EKSTREM (BMKG)*\n` +
      `📊 ${items.length} peringatan aktif\n\n` +
      list
        .map(
          (item, i) =>
            `*${i + 1}. ${item.title}*\n` +
            `📝 ${item.description || "-"}\n` +
            `🕒 ${item.pubDate || "-"}` +
            (item.link ? `\n🔗 ${item.link}` : "")
        )
        .join("\n\n") +
      (items.length > 5 ? `\n\n_...dan ${items.length - 5} peringatan lainnya_` : "") +
      `\n\n_Sumber: BMKG Indonesia_`;

    await m.reply(caption);
    await m.react("✅");
  } catch (err) {
    console.error("[cuacaEkstrem]", err.message);
    await m.react("❌");
    m.reply("❌ Gagal mengambil data peringatan cuaca dari BMKG.");
  }
};

handler.command     = ["cuacaekstrem"];
handler.category    = "info";
handler.description = "Cek & notifikasi peringatan dini cuaca ekstrem dari BMKG";

export default handler;
