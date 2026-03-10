/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";

const handler = async (m, { text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🌟 *GOOGLE GEMINI (BARD)*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}bard <pesan>\`\n` +
      `> \`${global.prefix}bard reset\` — generate ulang session\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}bard halo apa kabar?\`\n` +
      `> \`${global.prefix}bard jelaskan tentang AI\``
    );
  }

  if (text.trim().toLowerCase() === "reset") {
    await m.react("⏳");
    const res = await axios.post(`${global.apiUrl}/ai/bard`, { reset: true }, { timeout: 120000 });
    if (!res.data?.status) {
      await m.react("❌");
      return m.reply(`❌ Gagal reset session: ${res.data?.error || "Unknown error"}`);
    }
    await m.react("✅");
    return m.reply("✅ Session Gemini berhasil direset & digenerate ulang.");
  }

  await m.react("⏳");

  const response = await axios.post(`${global.apiUrl}/ai/bard`, {
    message: text.trim(),
  }, { timeout: 120000 });

  if (!response.data?.status || !response.data?.answer) {
    throw new Error(response.data?.error || "Gagal mendapatkan jawaban");
  }

  await m.react("✅");
  return m.reply(response.data.answer);
};

handler.command     = ["bard", "gemini"];
handler.category    = "ai";
handler.description = "Chat dengan Google Gemini (Bard)";

export default handler;
