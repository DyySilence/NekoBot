

/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🎨 *BRAT HD STICKER GENERATOR*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}brat <teks>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}brat Hello World\`\n>\n` +
      `> ✅ HD upscale 2x otomatis`
    );
  }

  if (text.length > 800) {
    return m.reply(`> ❌ Teks terlalu panjang, maksimal 800 karakter.`);
  }

  await m.react("⏳");

  const response = await axios.get(`${global.apiUrl}/tools/brat`, {
    params:  { text: text.trim(), hd: true },
    timeout: 60000,
  });

  if (!response.data?.status || !response.data?.image) {
    throw new Error(response.data?.error || "Gagal generate sticker");
  }

  const buffer = Buffer.from(response.data.image, "base64");
  await m.replySticker(buffer);
  await m.react("✅");
};

handler.command     = ["brat"];
handler.category    = "tools";
handler.description = "Generate Brat HD sticker dari teks";

export default handler;
