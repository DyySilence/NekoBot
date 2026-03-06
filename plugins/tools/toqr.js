

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
      `> 📝 *TOQR - QR CODE GENERATOR*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}toqr <teks/url/nomor>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}toqr Hello World\`\n` +
      `> \`${global.prefix}toqr https://google.com\`\n` +
      `> \`${global.prefix}toqr +6281234567890\`\n` +
      `> \`${global.prefix}toqr wifi:NamaWifi:password\`\n` +
      `> \`${global.prefix}toqr geo:-6.2,106.8\``
    );
  }

  await m.react("⏳");

  const response = await axios.get(`${global.apiUrl}/tools/toqr`, {
    params:  { text: text.trim() },
    timeout: 30000,
  });

  if (!response.data?.status || !response.data?.url) {
    throw new Error(response.data?.error || "Gagal generate QR code");
  }

  const { url, qrType, description } = response.data;

  await conn.sendMessage(
    m.chat,
    {
      image:   { url },
      caption:
        `✅ *QR CODE BERHASIL DIBUAT!*\n\n` +
        `${description}\n\n` +
        `📊 *Jenis:* ${(qrType || "text").toUpperCase()}\n` +
        `📏 *Ukuran:* 512x512 px\n\n` +
        `💡 Scan QR code dengan kamera smartphone`,
    },
    { quoted: m.fakeObj || m }
  );

  await m.react("✅");
};

handler.command     = ["toqr"];
handler.category    = "tools";
handler.description = "Generate QR code dari teks/URL/nomor/email";

export default handler;
