/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveAnyLidToJid, lidToJid } from "../../lib/serialize.js";

const handler = async (m, { conn, participants }) => {
  if (!m.quoted) return m.reply("❌ Reply pesan yang ingin dihapus!");

  const rawQuotedSender = m.quoted.sender || "";
  const resolvedSender  = resolveAnyLidToJid(rawQuotedSender, participants) || lidToJid(rawQuotedSender);

  const quotedNum      = resolvedSender.replace(/[^0-9]/g, "");
  const senderNum      = (m.sender || "").replace(/[^0-9]/g, "");
  const botNum         = (conn.user?.id || "").split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
  const isAdminOrOwner = m.isAdmin || m.isOwner;
  const isQuotedBot    = quotedNum === botNum || !!m.quoted.fromMe;
  const isQuotedSelf   = quotedNum === senderNum;

  if (!m.isBotAdmin) {
    return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin untuk menghapus pesan!");
  }

  if (!isQuotedBot && !isQuotedSelf && !isAdminOrOwner) {
    return m.reply("❌ Kamu hanya bisa menghapus pesan sendiri atau pesan bot!\nAdmin/owner bisa menghapus pesan siapa saja.");
  }

  try {
    const key = m.quoted.fakeObj?.key ?? m.quoted.key;
    if (!key) return m.reply("❌ Key pesan tidak ditemukan!");

    await conn.sendMessage(m.chat, { delete: key });

    if (isQuotedBot && !isAdminOrOwner) {
      await conn.sendMessage(m.chat, { delete: m.key }).catch(() => {});
    }

    await m.react("🗑️");
  } catch (err) {
    console.error("[delete]", err.message);
    await m.reply("❌ Gagal menghapus pesan.");
  }
};

handler.command     = ["delete", "del"];
handler.category    = "group";
handler.description = "Hapus pesan — user hapus pesan sendiri/bot, admin/owner hapus semua";
handler.group       = true;
handler.botAdmin    = true;

export default handler;
