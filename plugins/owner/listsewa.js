/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import moment from "moment-timezone";

const handler = async (m, { conn }) => {
  const now    = Date.now();
  const groups = global.db.groups ?? {};

  const sewaList = Object.entries(groups)
    .filter(([, g]) => g.sewa)
    .map(([id, g]) => ({ id, sewa: g.sewa }))
    .sort((a, b) => a.sewa.expiry - b.sewa.expiry);

  if (!sewaList.length) {
    return m.reply(`> 📋 *LIST SEWA*\n>\n> ❌ Tidak ada grup yang sedang disewa.`);
  }

  const active  = sewaList.filter((s) => s.sewa.expiry > now);
  const expired = sewaList.filter((s) => s.sewa.expiry <= now);

  let text = `> 📋 *LIST SEWA GRUP*\n>\n`;
  text += `> Total: *${sewaList.length}* grup\n`;
  text += `> Aktif: *${active.length}* | Expired: *${expired.length}*\n>\n`;

  if (active.length) {
    text += `> ✅ *AKTIF (${active.length})*\n`;
    for (const [i, { id, sewa }] of active.entries()) {
      const expiryStr = moment(sewa.expiry).tz("Asia/Jakarta").format("DD/MM/YY HH:mm");
      const sisaMs    = sewa.expiry - now;
      const sisaHari  = Math.ceil(sisaMs / (24 * 60 * 60 * 1000));
      let groupName   = id.split("@")[0];
      try {
        const meta = global.groupMetadataCache?.get(id);
        if (meta?.subject) groupName = meta.subject;
      } catch {}
      text += `>\n> ${i + 1}. *${groupName}*\n`;
      text += `>    📅 Exp: ${expiryStr} WIB\n`;
      text += `>    ⏳ Sisa: ${sisaHari} hari\n`;
      text += `>    🆔 \`${id}\`\n`;
    }
  }

  if (expired.length) {
    text += `>\n> ❌ *EXPIRED (${expired.length})*\n`;
    for (const [i, { id, sewa }] of expired.entries()) {
      const expiryStr = moment(sewa.expiry).tz("Asia/Jakarta").format("DD/MM/YY HH:mm");
      let groupName   = id.split("@")[0];
      try {
        const meta = global.groupMetadataCache?.get(id);
        if (meta?.subject) groupName = meta.subject;
      } catch {}
      text += `>\n> ${i + 1}. *${groupName}*\n`;
      text += `>    📅 Exp: ${expiryStr} WIB\n`;
      text += `>    🆔 \`${id}\`\n`;
    }
  }

  await m.reply(text);
};

handler.command     = ["listsewa"];
handler.category    = "owner";
handler.description = "Lihat daftar grup yang disewa";
handler.owner       = true;

export default handler;
