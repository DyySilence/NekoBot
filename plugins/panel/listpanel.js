/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { ptlFetch, checkConfig, fmtRam, fmtDisk, fmtCpu, fmtDate, getServerTracker } from './_panelUtil.js';

const handler = async (m) => {
  if (!checkConfig(m)) return;

  await m.react('⏳');
  try {
    const result  = await ptlFetch('/api/application/servers');
    const servers = result?.data || [];

    if (!servers.length) {
      await m.react('❌');
      return m.reply('> ❌ Tidak ada server panel.');
    }

    const tracker = getServerTracker();
    const now     = Date.now();

    let text = `> 🖥️ *LIST SERVER PANEL*\n> Total: ${servers.length}\n>\n`;

    for (const sv of servers) {
      const s       = sv.attributes;
      const tracked = tracker[String(s.id)];
      const sisaHari = tracked
        ? Math.max(0, Math.ceil((tracked.expiry - now) / 86400000))
        : null;
      const expiredStr = tracked ? fmtDate(tracked.expiry) : '—';
      const statusIcon = !tracked
        ? '⚪'
        : sisaHari <= 0
          ? '🔴'
          : sisaHari <= 3
            ? '🟡'
            : '🟢';

      text +=
        `> ━━━━━━━━━━━━━━━━━━━━\n` +
        `> ${statusIcon} *ID:* ${s.id} | *${s.name}*\n` +
        `> 🧠 RAM: ${fmtRam(s.limits.memory)}\n` +
        `> 💾 Disk: ${fmtDisk(s.limits.disk)}\n` +
        `> ⚡ CPU: ${fmtCpu(s.limits.cpu)}\n` +
        `> 🗓️ Dibuat: ${s.created_at.split('T')[0]}\n` +
        `> ⏰ Expired: ${expiredStr}` +
        (sisaHari !== null ? ` *(${sisaHari} hari lagi)*` : '') + '\n';
    }

    text += '> ━━━━━━━━━━━━━━━━━━━━';
    await m.reply(text);
    await m.react('✅');
  } catch (err) {
    await m.react('❌');
    m.reply(`> ❌ Gagal ambil data: ${err.message}`);
  }
};

handler.command     = ['listpanel', 'listserver'];
handler.category    = 'panel';
handler.description = 'List semua server panel Pterodactyl';
handler.owner       = true;

export default handler;
