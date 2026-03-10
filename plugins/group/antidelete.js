/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { text }) => {
  const sub     = text?.trim().toLowerCase();
  const isGroup = m.isGroup;

  if (isGroup  && !m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!isGroup && !m.isOwner)               return m.reply("❌ Antidelete private hanya bisa diaktifkan oleh owner bot!");

  const store = isGroup ? global.db.groups : global.db.users;
  const key   = isGroup ? m.chat : m.chat; // private: m.chat = JID lawan bicara (kontak)
  if (!store[key]) store[key] = {};
  const data  = store[key];

  const status = data.antidelete ? "ON ✅" : "OFF ❌";
  const label  = isGroup ? "Grup" : "Private";

  if (sub === "on") {
    data.antidelete = true;
    return m.reply(
      `✅ *Antidelete ${label} Diaktifkan!*\n\n` +
      `Pesan yang dihapus di ${isGroup ? "grup ini" : "chat ini"} akan dikirim ulang.`
    );
  }

  if (sub === "off") {
    data.antidelete = false;
    return m.reply(`✅ *Antidelete ${label} Dinonaktifkan!*`);
  }

  return m.reply(
    `ℹ️ *Antidelete ${label}*\n` +
    `Status: *${status}*\n\n` +
    `• \`${global.prefix}antidelete on\`\n` +
    `• \`${global.prefix}antidelete off\``
  );
};

handler.command     = ["antidelete"];
handler.category    = "group";
handler.description = "Aktifkan/nonaktifkan antidelete (grup: admin | private: owner)";

export default handler;
