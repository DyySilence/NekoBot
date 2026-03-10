/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { ptlFetch, getServerTracker, untrackServer, fmtDate, checkConfig } from './_panelUtil.js';

export const runAutoDeletePanel = async (sock = null) => {
  const tracker = getServerTracker();
  const now     = Date.now();
  const expired = Object.entries(tracker).filter(([, info]) => now >= info.expiry);

  if (!expired.length) return;
  for (const [serverId, info] of expired) {
    try {
      await ptlFetch(`/api/application/servers/${serverId}/force`, 'DELETE');
      if (info.userId) {
        await ptlFetch(`/api/application/users/${info.userId}`, 'DELETE').catch(() => {});
      }
      untrackServer(serverId);
 
      if (sock && global.owner) {
        const ownerJid = global.owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, {
          text:
            `> 🗑️ *AUTO DELETE PANEL*\n>\n` +
            `> Server expired telah otomatis dihapus:\n>\n` +
            `> 📡 *Server ID:* ${serverId}\n` +
            `> 👤 *Username:* ${info.username}\n` +
            `> 🗓️ *Dibuat:* ${fmtDate(info.createdAt)}\n` +
            `> ⏰ *Expired:* ${fmtDate(info.expiry)}\n` +
            `> ✅ Berhasil dihapus`,
        }).catch(() => {});
      }
    } catch (err) {
      console.error(`[AutoDeletePanel] ❌ Gagal hapus server ${serverId}:`, err.message);
    }
  }
};

export const startAutoDeletePanel = (sock = null) => {
  runAutoDeletePanel(sock); 
  setInterval(() => runAutoDeletePanel(sock), 3600000); 
  console.log('[AutoDeletePanel] ✅ Auto-delete panel aktif (interval: 1 jam)');
};

const handler = async (m, { conn, command }) => {
  if (!checkConfig(m)) return;

  if (command === 'runautodelete') {
    await m.react('⏳');
    await runAutoDeletePanel(conn);
    await m.react('✅');
    return m.reply('> ✅ Auto-delete selesai dijalankan. Cek log terminal.');
  }
  
  const tracker = getServerTracker();
  const now     = Date.now();
  const all     = Object.entries(tracker);

  if (!all.length) {
    await m.react('✅');
    return m.reply('> 📋 Tidak ada server yang ditrack saat ini.');
  }

  let text     = `> 📋 *STATUS SERVER TRACKED*\n> Total: ${all.length}\n>\n`;
  let expCount = 0;

  for (const [sid, info] of all) {
    const sisaMs   = info.expiry - now;
    const sisaHari = Math.ceil(sisaMs / 86400000);
    const isExp    = sisaMs <= 0;
    if (isExp) expCount++;

    const icon = isExp ? '🔴' : sisaHari <= 3 ? '🟡' : '🟢';
    text +=
      `> ${icon} *${info.username}* (ID: ${sid})\n` +
      `> ⏰ ${isExp ? '⚠️ EXPIRED' : `Sisa ${sisaHari} hari`}\n>\n`;
  }

  if (expCount > 0) {
    text +=
      `> ━━━━━━━━━━━━━━━━━━━━\n` +
      `> ⚠️ ${expCount} server expired!\n` +
      `> 💡 \`${global.prefix}runautodelete\` untuk hapus sekarang`;
  }

  await m.react('✅');
  return m.reply(text);
};

handler.command     = ['panelstatus', 'runautodelete'];
handler.category    = 'panel';
handler.description = 'Cek status server panel & trigger auto-delete';
handler.owner       = true;

export default handler;
