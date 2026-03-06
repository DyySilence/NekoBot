/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { ptlFetch, checkConfig, sendSelectList } from './_panelUtil.js';

const handler = async (m, { conn, args, command }) => {
  if (!checkConfig(m)) return;
  if (command === 'deladmin-response') {
    const userId = parseInt(args[0]);
    if (isNaN(userId)) return m.reply('> ❌ ID tidak valid.');
    await m.react('⏳');
    try {
      await ptlFetch(`/api/application/users/${userId}`, 'DELETE');
      await m.react('✅');
      return m.reply(`> ✅ *Admin ID ${userId} berhasil dihapus!*`);
    } catch (err) {
      await m.react('❌');
      return m.reply(`> ❌ Gagal hapus admin: ${err.message}`);
    }
  }

  await m.react('⏳');
  try {
    const data   = await ptlFetch('/api/application/users');
    const admins = (data?.data || []).filter(u => u.attributes.root_admin);

    if (!admins.length) {
      await m.react('❌');
      return m.reply('> ❌ Tidak ada admin panel.');
    }

    const rows = admins.map(a => ({
      title:       `${a.attributes.first_name} | ID: ${a.attributes.id}`,
      description: `@${a.attributes.username} | Dibuat: ${a.attributes.created_at.split('T')[0]}`,
      id:          `.deladmin-response ${a.attributes.id}`,
    }));

    await sendSelectList(conn, m,
      'Pilih Admin Panel',
      `Total Admin: ${admins.length}\nPilih admin yang ingin dihapus`,
      rows
    );
    await m.react('✅');
  } catch (err) {
    await m.react('❌');
    m.reply(`> ❌ Gagal ambil data admin: ${err.message}`);
  }
};

handler.command     = ['deladmin', 'deladmin-response'];
handler.category    = 'panel';
handler.description = 'Hapus akun admin panel Pterodactyl';
handler.owner       = true;

export default handler;
