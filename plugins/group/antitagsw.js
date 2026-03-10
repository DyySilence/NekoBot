/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { args }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const groupData = global.db.groups[m.chat] ?? {};
  const sub = (args[0] || "").toLowerCase();

  if (!sub || (sub !== "on" && sub !== "off")) {
    const status = groupData.antitagsw ? "✅ ON" : "❌ OFF";
    return m.reply(
      `🚫 *ANTI TAG STATUS WA*\n\n` +
      `Status saat ini: *${status}*\n\n` +
      `Penggunaan:\n` +
      `• ${global.prefix}antitagsw on — Aktifkan\n` +
      `• ${global.prefix}antitagsw off — Matikan\n\n` +
      `ℹ️ Member yang mention @status akan diberi warn.\n` +
      `Setelah 3x warn → langsung di-kick!`
    );
  }

  const enable = sub === "on";
  groupData.antitagsw = enable;
  global.db.groups[m.chat] = groupData;

  return m.reply(
    enable
      ? `✅ *Anti Tag Status WA AKTIF!*\n\nMember yang mention @status akan mendapat warn.\nSetelah 3x warn → di-kick otomatis!`
      : `❌ *Anti Tag Status WA DIMATIKAN!*\n\nMember bebas mention @status.`
  );
};

handler.command     = ["antitagsw"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Toggle anti tag status WA (warn 3x + kick)";

export default handler;
