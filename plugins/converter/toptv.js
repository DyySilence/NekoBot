/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn }) => {
  if (!m.quoted?.isVideo) return m.reply("❌ Reply video dengan .toptv");

  await m.react("⏳");

  try {
    const media = await m.quoted.download();

    await conn.sendMessage(m.chat, {
      video: media,
      mimetype: "video/mp4",
      ptv: true,
    }, { quoted: m.fakeObj || m });

    await m.react("✅");
  } catch (err) {
    console.error("[ToPTV] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal konversi: ${err.message}`);
  }
};

handler.command     = ["toptv", "ptv"];
handler.category    = "converter";
handler.description = "Konversi video ke PTV (video bulat)";

export default handler;
