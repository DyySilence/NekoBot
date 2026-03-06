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
      `> 🤖 *LLAMA 3.3-70B*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}llama <pesan>\`\n` +
      `> \`${global.prefix}llama reset\` — hapus histori\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}llama siapa kamu?\`\n` +
      `> \`${global.prefix}llama buatkan puisi tentang hujan\``
    );
  }

  if (text.trim().toLowerCase() === "reset") {
    await axios.post(`${global.apiUrl}/ai/llama`, { userId, reset: true }).catch(() => {});
    return m.reply("🔄 Histori percakapan berhasil direset.");
  }

  await m.react("⏳");

  const response = await axios.post(`${global.apiUrl}/ai/llama`, {
    userId,
    message: text.trim(),
  }, { timeout: 70000 });

  if (!response.data?.status || !response.data?.answer) {
    throw new Error(response.data?.error || "Gagal mendapatkan jawaban");
  }

  await m.react("✅");
  return m.reply(`${response.data.answer}\n\n_— llama-3.3-70b (groq)_`);
};

handler.command     = ["llama"];
handler.category    = "ai";
handler.description = "Chat dengan Meta Llama 3.3-70B via Groq";

export default handler;
