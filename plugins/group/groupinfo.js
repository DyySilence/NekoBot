/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import moment from "moment-timezone";

const handler = async (m, { conn, args }) => {
  let groupId  = null;
  let fromLink = false;
  let linkInfo = null;

  if (args[0]) {
    const match = args[0].match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);
    if (!match) return m.reply("❌ Format link tidak valid!\n\nContoh: .infogc https://chat.whatsapp.com/xxxx");
    try {
      linkInfo = await conn.groupGetInviteInfo(match[1]);
      groupId  = linkInfo.id;
      fromLink = true;
    } catch {
      return m.reply("❌ Link grup tidak valid atau sudah kadaluarsa!");
    }
  } else {
    if (!m.isGroup)
      return m.reply("❌ Hanya bisa di grup atau gunakan link!\n\nContoh: .infogc https://chat.whatsapp.com/xxxx");
    groupId = m.chat;
  }

  let metadata   = null;
  let fullAccess = false;
  let groupDesc  = null;
  let descOwner  = null;
  let descTime   = null;
  let descId     = null;
  let isBotAdmin = false;

  try {
    metadata   = await conn.groupMetadata(groupId);
    fullAccess = true;
    const botNum = (conn.user?.lid || conn.user?.id || "").split(":")[0].split("@")[0];
    isBotAdmin = metadata.participants.some((p) => {
      const pNum = (p.jid || p.id || "").split(":")[0].split("@")[0];
      return pNum === botNum && (p.admin === "admin" || p.admin === "superadmin");
    });
    if (metadata.desc) {
      groupDesc = metadata.desc;
      descId    = metadata.descId    || null;
      descOwner = metadata.descOwner || null;
      descTime  = metadata.descTime  ? moment(metadata.descTime * 1000).tz("Asia/Jakarta") : null;
    }
  } catch {
    fullAccess = false;
    if (linkInfo?.desc) {
      groupDesc = linkInfo.desc;
      descId    = linkInfo.descId    || null;
      descOwner = linkInfo.descOwner || null;
      descTime  = linkInfo.descTime  ? moment(linkInfo.descTime * 1000).tz("Asia/Jakarta") : null;
    }
  }

  let picture = "https://i.ibb.co/3dQ5pq7/default-avatar.png";
  try { picture = await conn.profilePictureUrl(groupId, "image") || picture; } catch {}

  const source      = fullAccess ? metadata : linkInfo;
  const participants = metadata?.participants ?? [];
  const admins      = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
  const superAdmins = participants.filter(p => p.admin === "superadmin");
  const members     = participants.filter(p => !p.admin);
  const createdAt   = source?.creation    ? moment(source.creation    * 1000).tz("Asia/Jakarta") : null;
  const subjectTime = source?.subjectTime ? moment(source.subjectTime * 1000).tz("Asia/Jakarta") : null;

  let msg = `╭━『 *GROUP INFO* 』━╮\n\n`;
  msg += `┌─❖ *INFORMASI GRUP*\n│\n`;
  msg += `├ 📱 *Nama:* ${source?.subject || "-"}\n`;
  msg += `├ 🆔 *ID:* ${groupId}\n│\n`;

  // Deskripsi
  msg += `├─❖ *📝 DESKRIPSI*\n│\n`;
  if (groupDesc) {
    const lines = groupDesc.split("\n");
    msg += `├〢 ${lines[0]}\n`;
    for (let i = 1; i < lines.length; i++) msg += `│〢 ${lines[i]}\n`;
    msg += `│\n`;
    if (descOwner) msg += `├ ✍️ *Diubah oleh:* @${descOwner.split("@")[0]}\n`;
    if (descTime)  msg += `├ 🕐 *Diubah:* ${descTime.format("DD/MM/YYYY HH:mm:ss")}\n`;
    if (descId)    msg += `├ 🔢 *ID Desc:* ${descId}\n`;
    msg += `├ 📊 *Statistik:* ${groupDesc.length} karakter, ${lines.length} baris\n`;
  } else {
    msg += `├〢 _Tidak ada deskripsi_\n`;
  }
  msg += `│\n`;

  // Statistik
  msg += `├─❖ *STATISTIK*\n│\n`;
  if (fullAccess) {
    msg += `├ 👥 *Total:* ${participants.length}\n`;
    msg += `├ 👑 *Super Admin:* ${superAdmins.length}\n`;
    msg += `├ 🛡️ *Admin:* ${admins.length}\n`;
    msg += `├ 👤 *Member:* ${members.length}\n`;
  } else {
    msg += `├ 👥 *Total:* ${source?.size || "?"}\n`;
  }
  msg += `│\n`;

  // Pengaturan
  msg += `├─❖ *PENGATURAN*\n│\n`;
  msg += `├ 🔒 *Kirim Pesan:* ${source?.announce ? "Hanya Admin" : "Semua Member"}\n`;
  msg += `├ ✏️ *Edit Info:* ${source?.restrict ? "Hanya Admin" : "Semua Member"}\n`;
  if (isBotAdmin) {
    try {
      const code = await conn.groupInviteCode(groupId);
      msg += `├ 🔗 *Link:* https://chat.whatsapp.com/${code}\n`;
    } catch {}
  }
  msg += `│\n`;

  // Waktu
  msg += `├─❖ *WAKTU*\n│\n`;
  if (createdAt) {
    msg += `├ 🕐 *Dibuat:* ${createdAt.format("DD/MM/YYYY HH:mm:ss")}\n`;
    msg += `├ 📅 *Umur:* ${moment().diff(createdAt, "days")} hari\n`;
  }
  if (subjectTime) msg += `├ ✏️ *Nama Diubah:* ${subjectTime.format("DD/MM/YYYY HH:mm:ss")}\n`;
  msg += `│\n`;

  // Owner
  if (source?.owner) {
    msg += `├─❖ *OWNER*\n│\n`;
    msg += `├ 👑 @${source.owner.split("@")[0]}\n│\n`;
  }

  // Super admin list (maks 10)
  if (fullAccess && superAdmins.length > 0 && superAdmins.length <= 10) {
    msg += `├─❖ *SUPER ADMIN*\n│\n`;
    superAdmins.forEach((a, i) => {
      msg += `├ ${i + 1}. @${(a.jid || a.id || "").split("@")[0]}\n`;
    });
    msg += `│\n`;
  }

  msg += `└────────────────\n`;
  msg += `╰━━━━━━━━━━━━━━━━━━━╯\n\n`;
  if (!fullAccess) msg += `⚠️ *Note:* Data terbatas (dari link invite)\n`;
  if (fromLink)    msg += `🔗 *Sumber:* Link Invite\n`;
  msg += `📅 *Dicek:* ${moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss")}`;

  const mentionJids = [];
  if (source?.owner)  mentionJids.push(source.owner);
  if (descOwner)       mentionJids.push(descOwner);
  if (fullAccess && superAdmins.length <= 10)
    superAdmins.forEach(a => mentionJids.push(a.jid || a.id));

  try {
    await conn.sendMessage(m.chat, {
      image:    { url: picture },
      caption:  msg,
      mentions: mentionJids,
    }, { quoted: m });
  } catch {
    await m.reply(msg);
  }
};

handler.command     = ["infogc", "groupinfo"];
handler.category    = "group";
handler.description = "Cek informasi detail grup WhatsApp";

export default handler;
