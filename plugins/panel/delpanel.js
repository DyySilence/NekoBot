/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { ptlFetch, checkConfig, sendSelectList, untrackServer, fmtRam, fmtDisk, fmtCpu } from './_panelUtil.js';

const handler = async (m, { conn, args, command }) => {
  if (!checkConfig(m)) return;

  if (command === 'delpanel-all') {
    await m.react('⏳');
    try {
      const result  = await ptlFetch('/api/application/servers');
      const servers = result?.data || [];
      if (!servers.length) return m.reply('> ❌ Tidak ada server panel.');

      let ok = 0, fail = 0;
      for (const sv of servers) {
        const s = sv.attributes;
        try {
          await ptlFetch(`/api/application/servers/${s.id}/force`, 'DELETE');
          await ptlFetch(`/api/application/users/${s.user}`, 'DELETE').catch(() => {});
          untrackServer(s.id);
          ok++;
        } catch { fail++; }
      }

      await m.react('✅');
      return m.reply(
        `> 🗑️ *HAPUS SEMUA SERVER*\n>\n` +
        `> ✅ Berhasil: ${ok}\n` +
        `> ❌ Gagal: ${fail}`
      );
    } catch (err) {
      await m.react('❌');
      return m.reply(`> ❌ Gagal: ${err.message}`);
    }
  }

  if (command === 'delpanel-response') {
    const serverId = parseInt(args[0]);
    if (isNaN(serverId)) return m.reply('> ❌ ID tidak valid.');
    await m.react('⏳');
    try {
      const sv  = await ptlFetch(`/api/application/servers/${serverId}`);
      const uid = sv?.attributes?.user;

      await ptlFetch(`/api/application/servers/${serverId}/force`, 'DELETE');
      if (uid) await ptlFetch(`/api/application/users/${uid}`, 'DELETE').catch(() => {});
      untrackServer(serverId);

      await m.react('✅');
      return m.reply(`> ✅ *Server ID ${serverId} berhasil dihapus!*`);
    } catch (err) {
      await m.react('❌');
      return m.reply(`> ❌ Gagal hapus server: ${err.message}`);
    }
  }

  await m.react('⏳');
  try {
    const result  = await ptlFetch('/api/application/servers');
    const servers = result?.data || [];

    if (!servers.length) {
      await m.react('❌');
      return m.reply('> ❌ Tidak ada server panel.');
    }

    const rows = [
      {
        title:       '🗑️ Hapus Semua Server',
        description: 'Hapus semua server sekaligus',
        id:          '.delpanel-all',
      },
    ];

    for (const sv of servers) {
      const s = sv.attributes;
      rows.push({
        title:       `${s.name} | ID: ${s.id}`,
        description: `RAM ${fmtRam(s.limits.memory)} | Disk ${fmtDisk(s.limits.disk)} | CPU ${fmtCpu(s.limits.cpu)}`,
        id:          `.delpanel-response ${s.id}`,
      });
    }

    await sendSelectList(conn, m,
      'Pilih Server Panel',
      `Total Server: ${servers.length}\nPilih server yang ingin dihapus`,
      rows
    );
    await m.react('✅');
  } catch (err) {
    await m.react('❌');
    m.reply(`> ❌ Gagal ambil data server: ${err.message}`);
  }
};

handler.command     = ['delpanel', 'delpanel-all', 'delpanel-response'];
handler.category    = 'panel';
handler.description = 'Hapus server panel Pterodactyl';
handler.owner       = true;

export default handler;
