import axios from "axios";

const handler = async (m, { conn, text }) => {
  const input = text?.trim();

  if (!input) {
    return m.reply(
      `╭━━『 *IQC - iPhone Quote Card* 』━━╮\n` +
      `│\n` +
      `│ 📝 Cara Pakai:\n` +
      `│ ${global.prefix}iqc <teks>\n` +
      `│\n` +
      `│ 💡 Contoh:\n` +
      `│ ${global.prefix}iqc Hidup itu indah\n` +
      `│ ${global.prefix}iqc Halo dunia!\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  await m.react("⏳");

  const now   = new Date();
  const jam   = now.toLocaleTimeString("id-ID", {
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
    timeZone: "Asia/Jakarta",
  });
  const batre = "100";

  let imageBuffer;
  try {
    const { data } = await axios.get("https://api-faa.my.id/faa/iqcv2", {
      params:       { prompt: input, jam, batre },
      responseType: "arraybuffer",
      timeout:      20000,
    });
    imageBuffer = Buffer.from(data);
  } catch (err) {
    await m.react("❌");
    return m.reply(`❌ Gagal generate IQC!\n\n🔧 Error: ${err.message}`);
  }

  await conn.sendMessage(
    m.chat,
    {
      image:   imageBuffer,
      caption: `📱 iPhone Quote Card\n\n💬 "${input}"`,
      mimetype: "image/png",
    },
    { quoted: m.fakeObj || m }
  );

  await m.react("✅");
};

handler.command     = ["iqc"];
handler.category    = "tools";
handler.description = "Generate iPhone Quote Card dari teks";

export default handler;