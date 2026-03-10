/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { ptlFetch, getDomain, checkConfig, sendPanelInfo, getOwnerJid, fmtDate } from './_panelUtil.js';

const handler = async (m, { conn, text }) => {
  if (!checkConfig(m)) return;

  if (!text) {
    return m.reply(
      `> 👑 *BUAT ADMIN PANEL*\n>\n` +
      `> 💡 *Cara pakai:*\n` +
      `> \`${global.prefix}cadmin username\`\n` +
      `> Data panel akan dikirim ke nomor owner.`
    );
  }

  const usernem  = text.split(',')[0].trim().toLowerCase();
  if (!usernem) return m.reply(`> 💡 Contoh: \`${global.prefix}cadmin username\``);

  const username = usernem;
  const email    = `${username}@gmail.com`;
  const name     = username.charAt(0).toUpperCase() + username.slice(1);
  const password = `${username}001`;
  const domain   = getDomain();
  const ownerJid = getOwnerJid();
  if (!ownerJid) {
    return m.reply('> ❌ *Nomor owner belum diset di config.js (`global.owner`)*');
  }

  await m.react('⏳');
  try {
    const data = await ptlFetch('/api/application/users', 'POST', {
      email, username,
      first_name: name, last_name: 'Admin',
      root_admin: true, language: 'en', password,
    });

    if (data?.errors) {
      await m.react('❌');
      return m.reply(`> ❌ *Error:*\n> \`${JSON.stringify(data.errors[0])}\``);
    }

    const user = data.attributes;

    const teks =
      `> 👑 *BERHASIL MEMBUAT ADMIN PANEL* ✅\n>\n` +
      `> 📡 *Server ID:* ${user.id}\n` +
      `> 👤 *Username:* ${user.username}\n` +
      `> 🔐 *Password:* ${password}\n` +
      `> 📧 *Email:* ${email}\n` +
      `> 🗓️ *Tanggal:* ${fmtDate()}\n` +
      `> 🌐 *Panel:* ${domain}`;

    await m.reply(
      `> ✅ *Admin panel berhasil dibuat!*\n` +
      `> 📤 Data dikirim ke nomor owner.`
    );
    await sendPanelInfo(conn, ownerJid, teks, username, password);
    await m.react('✅');
  } catch (err) {
    await m.react('❌');
    m.reply(`> ❌ *Gagal membuat admin panel:*\n> ${err.message}`);
  }
};

handler.command     = ['cadmin'];
handler.category    = 'panel';
handler.description = 'Buat akun admin panel Pterodactyl';
handler.owner       = true;

export default handler;
