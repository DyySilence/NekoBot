/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply(`> ❌ Gunakan: ${global.prefix}join <link group>`);
  }

  const match = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);
  if (!match) return m.reply(`> ❌ Link group tidak valid!`);

  await m.react("⏳");

  try {
    const result = await conn.groupAcceptInvite(match[1]);
    await m.react("✅");
    await m.reply(`> ✅ Berhasil join group!\n>\n> 👤 ID: ${result}`);
  } catch (err) {
    await m.react("❌");
    if (err.message.includes("already")) {
      await m.reply(`> ❌ Bot sudah ada di group tersebut!`);
    } else if (err.message.includes("invalid")) {
      await m.reply(`> ❌ Link group tidak valid atau expired!`);
    } else {
      await m.reply(`> ❌ Terjadi kesalahan!\n> 💬 ${err.message}`);
    }
  }
};

handler.command     = ["join", "joingc"];
handler.category    = "owner";
handler.description = "Bot join group via invitation link";
handler.owner       = true;

export default handler;
