/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, text }) => {
  const groupData = global.db.groups[m.chat] ?? {};

  if (!text) {
    return m.reply(
      `╭━━『 *WELCOME MESSAGE* 』━━╮\n` +
      `│\n` +
      `│ Status: ${groupData.welcome ? "✅ Aktif" : "❌ Nonaktif"}\n` +
      `│\n` +
      `│ 📝 *Cara Pakai:*\n` +
      `│ Atur teks → ${global.prefix}setwelcome <teks>\n` +
      `│ Aktifkan  → ${global.prefix}welcome on\n` +
      `│ Matikan   → ${global.prefix}welcome off\n` +
      `│ Reset     → ${global.prefix}setwelcome reset\n` +
      `│\n` +
      `│ 🔤 *Variabel:*\n` +
      `│ @user   → mention member\n` +
      `│ {group} → nama grup\n` +
      `│ {count} → jumlah member\n` +
      `│\n` +
      `│ 💡 *Contoh:*\n` +
      `│ ${global.prefix}setwelcome Selamat datang\n` +
      `│ @user! Kamu member ke-{count}\n` +
      `│ di *{group}* 🎉\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

 
  if (text === "reset") {
    groupData.welcome     = false;
    groupData.welcomeText = "";
    global.db.groups[m.chat] = groupData;
    return m.reply(`✅ Welcome message *direset*!`);
  }

  groupData.welcomeText = text;
  global.db.groups[m.chat] = groupData;

  const preview = text
    .replace(/@user/g, `@${m.sender.split("@")[0]}`)
    .replace(/{group}/g, m.chat.split("@")[0])
    .replace(/{count}/g, "1");

  await m.reply(
    `✅ *Teks welcome disimpan!*\n\n` +
    `📌 Status: ${groupData.welcome ? "✅ Aktif" : "❌ Belum diaktifkan"}\n` +
    (groupData.welcome ? "" : `💡 Aktifkan dengan: ${global.prefix}setwelcome on\n`) +
    `\n*Preview:*\n${preview}`
  );
};

handler.command     = ["setwelcome"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Atur welcome message. Variabel: @user {group} {count}";

export default handler;
