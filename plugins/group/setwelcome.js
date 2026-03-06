/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, text }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const groupData = global.db.groups[m.chat] ?? {};

  if (!text) {
    groupData.welcome = !groupData.welcome;
    global.db.groups[m.chat] = groupData;
    return m.reply(`✅ Welcome message *${groupData.welcome ? "diaktifkan" : "dinonaktifkan"}*!`);
  }

  groupData.welcome = true;
  groupData.welcomeText = text;
  global.db.groups[m.chat] = groupData;

  await m.reply(
    `✅ *Welcome message diatur!*\n\n*Preview:*\n${text
      .replace(/@user/g, "@" + m.sender.split("@")[0])
      .replace(/{group}/g, m.chat.split("@")[0])
      .replace(/{count}/g, "1")}`
  );
};

handler.command  = ["setwelcome"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Atur / aktifkan welcome message. Variabel: @user {group} {count}";

export default handler;
