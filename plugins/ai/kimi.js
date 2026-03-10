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
  const userId = m.sender;

  if (!text?.trim()) {
    return m.reply(
      `> 🌙 *KIMI AI*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}kimi <pesan>\`\n` +
      `> \`${global.prefix}kimi reset\` — hapus sesi\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}kimi halo apa kabar?\`\n` +
      `> \`${global.prefix}kimi jelaskan machine learning\``
    );
  }

  // Reset session
  if (text.trim().toLowerCase() === "reset") {
    await axios.post(`${global.apiUrl}/ai/kimi`, { userId, reset: true }).catch(() => {});
    return m.reply("🔄 Sesi Kimi berhasil direset.");
  }

  await m.react("⏳");

  const response = await axios.post(`${global.apiUrl}/ai/kimi`, {
    userId,
    message: text.trim(),
  }, { timeout: 100000 });

  if (!response.data?.status || !response.data?.answer) {
    throw new Error(response.data?.error || "Gagal mendapatkan jawaban");
  }

  await m.react("✅");
  return m.reply(response.data.answer);
};

handler.command     = ["kimi"];
handler.category    = "ai";
handler.description = "Chat dengan Kimi AI";

export default handler;
