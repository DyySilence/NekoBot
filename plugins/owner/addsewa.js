/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import moment from "moment-timezone";

const handler = async (m, { conn, args, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 📋 *CARA PAKAI ADDSEWA*\n>\n` +
      `> 1️⃣ Di dalam grup yang mau disewa:\n` +
      `>    \`${global.prefix}addsewa <hari>\`\n>\n` +
      `> 2️⃣ Pakai link grup:\n` +
      `>    \`${global.prefix}addsewa <link> <hari>\`\n>\n` +
      `> 3️⃣ Pakai group ID:\n` +
      `>    \`${global.prefix}addsewa <groupId> <hari>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}addsewa 30\`\n` +
      `> \`${global.prefix}addsewa https://chat.whatsapp.com/xxx 30\`\n` +
      `> \`${global.prefix}addsewa 120363xxxxxxxx@g.us 30\``
    );
  }

  let targetGroup = null;
  let days        = null;

  const linkMatch = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);

  if (linkMatch) {
    const inviteCode = linkMatch[1];
    const dayArg     = parseInt(args[args.length - 1]);
    if (isNaN(dayArg) || dayArg <= 0) {
      return m.reply(`> ❌ Jumlah hari tidak valid.\n> Contoh: \`${global.prefix}addsewa https://chat.whatsapp.com/xxx 30\``);
    }
    days = dayArg;

    try {
      const info = await conn.groupGetInviteInfo(inviteCode);
      targetGroup = info.id;
    } catch (e) {
      return m.reply(`> ❌ *Gagal ambil info grup dari link!*\n> Pastikan bot sudah ada di grup tersebut.\n> Error: ${e.message}`);
    }

  } else if (args[0]?.endsWith("@g.us")) {
    targetGroup = args[0];
    days        = parseInt(args[1]);

  } else if (!isNaN(parseInt(args[0]))) {
    if (!m.isGroup) {
      return m.reply(`> ❌ Pakai command ini di dalam grup, atau sertakan link/ID grup.\n> Contoh: \`${global.prefix}addsewa <link> <hari>\``);
    }
    targetGroup = m.chat;
    days        = parseInt(args[0]);
  }

  if (!targetGroup) {
    return m.reply(`> ❌ Grup tidak ditemukan. Pastikan format benar.\n> Ketik \`${global.prefix}addsewa\` untuk bantuan.`);
  }

  if (!days || isNaN(days) || days <= 0) {
    return m.reply(`> ❌ Jumlah hari tidak valid.\n> Contoh: \`${global.prefix}addsewa 30\``);
  }

  if (!global.db.groups[targetGroup]) global.db.groups[targetGroup] = {};

  const now       = Date.now();
  const existing  = global.db.groups[targetGroup].sewa;
  const baseTime  = existing && existing.expiry > now ? existing.expiry : now;
  const newExpiry = baseTime + days * 24 * 60 * 60 * 1000;

  global.db.groups[targetGroup].sewa = {
    active:  true,
    expiry:  newExpiry,
    addedBy: m.sender,
    addedAt: now,
  };

  let groupName = targetGroup.split("@")[0];
  try {
    const meta = global.groupMetadataCache?.get(targetGroup) || await conn.groupMetadata(targetGroup).catch(() => null);
    if (meta?.subject) groupName = meta.subject;
    if (meta) global.groupMetadataCache?.set(targetGroup, meta);
  } catch {}

  const expiryStr = moment(newExpiry).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm");
  const isExtend  = existing && existing.expiry > now;

  await m.reply(
    `> ✅ *SEWA BERHASIL ${isExtend ? "DIPERPANJANG" : "DITAMBAHKAN"}*\n>\n` +
    `> 🏠 Grup: *${groupName}*\n` +
    `> ⏱️ Durasi: *${days} hari*\n` +
    `> 📅 Expired: *${expiryStr} WIB*\n` +
    `> 🆔 \`${targetGroup}\`\n` +
    (isExtend ? `> 🔄 Sewa sebelumnya diperpanjang` : `> 🆕 Sewa baru dimulai`)
  );
};

handler.command     = ["addsewa"];
handler.category    = "owner";
handler.description = "Tambah/perpanjang sewa grup (link/ID/dalam grup)";
handler.owner       = true;

export default handler;
