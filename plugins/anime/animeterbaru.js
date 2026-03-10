import axios from "axios";

const fetchTerbaru = async () => {
  const { data } = await axios.get(`${global.apiUrl}/anime/terbaru`, { timeout: 30000 });
  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");
  if (!data.results?.length) throw new Error("Tidak ada episode terbaru");
  return data.results;
};

const handler = async (m, { conn, args }) => {
  const sub = (args[0] || "").toLowerCase();

  if (sub === "notif") {
    if (!m.isGroup) return m.reply("❌ Command ini hanya bisa digunakan di grup!");
    if (!m.isAdmin) return m.reply("❌ Hanya admin grup yang bisa mengatur notif anime!");

    const action = (args[1] || "").toLowerCase();
    if (!["on", "off"].includes(action)) {
      return m.reply("Gunakan:\n.animeterbaru notif on\n.animeterbaru notif off");
    }

    if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
    global.db.groups[m.chat].animenotif = action === "on";

    return m.reply(
      action === "on"
        ? "✅ Notifikasi episode anime baru *diaktifkan*.\nGrup ini akan menerima update otomatis tiap ada episode baru di Oploverz."
        : "🔕 Notifikasi episode anime *dinonaktifkan*."
    );
  }

  await m.react("⏳");

  try {
    const results = await fetchTerbaru();

    let text = `> 🆕 *EPISODE ANIME TERBARU*\n>\n`;
    results.forEach((a, i) => {
      text += `> ${i + 1}. *${a.title}*\n`;
      text += `>    🎬 ${a.eps || "-"}\n`;
      text += `>    🔗 ${a.link}\n`;
      if (i < results.length - 1) text += `>\n`;
    });
    text += `>\n> 📊 Total: ${results.length} episode`;

    await m.reply(text);
    await m.react("✅");
  } catch (err) {
    console.error("[animeterbaru]", err.message);
    await m.react("❌");
    m.reply(`❌ ${err.message}`);
  }
};

handler.command     = ["animeterbaru"];
handler.category    = "anime";
handler.description = "Episode anime terbaru + notifikasi otomatis grup";

export default handler;
