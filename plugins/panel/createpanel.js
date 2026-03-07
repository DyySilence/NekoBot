/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import {
  ptlFetch, getDomain, getNestId, getEgg, getLoc,
  checkConfig, isResellerGroup, sendPanelInfo, trackServer, getOwnerJid,
  resourceMap, fmtDate, expiredDate, fmtRam, fmtDisk, fmtCpu,
} from './_panelUtil.js';

const handler = async (m, { conn, text, command }) => {
  if (!checkConfig(m)) return;
  if (!m.isOwner) {
    if (!m.isGroup) {
      return m.reply(global.mess?.group ?? '❌ Command ini hanya bisa digunakan di grup.');
    }
    if (!isResellerGroup(m.chat)) {
      return m.reply(
        `> ❌ *Akses ditolak!*\n>\n` +
        `> Grup ini belum terdaftar sebagai grup reseller.\n` +
        `> Hubungi owner untuk mendaftarkan grup ini.`
      );
    }
  }

  if (!text) {
    return m.reply(
      `> 🖥️ *BUAT SERVER PANEL — ${command.toUpperCase()}*\n>\n` +
      `> 💡 Cara pakai:\n` +
      `> \`${global.prefix}${command} username\`\n` +
      `> Data panel akan dikirim ke nomor owner.`
    );
  }

  const res = resourceMap[command];
  if (!res) return m.reply('> ❌ Paket tidak dikenali.');

  const usernem = text.split(',')[0].trim().toLowerCase();
  if (!usernem) return m.reply(`> 💡 Contoh: \`${global.prefix}${command} username\``);

  const ownerJid = getOwnerJid();
  if (!ownerJid) {
    return m.reply('> ❌ *Nomor owner belum diset di config.js (`global.owner`)*');
  }

  const username = usernem;
  const email    = `${username}@gmail.com`;
  const name     = username.charAt(0).toUpperCase() + username.slice(1) + ' Server';
  const password = `${username}001`;
  const { ram, disk, cpu } = res;

  await m.react('⏳');
  await conn.sendMessage(m.chat, {
    text: `> ⚙️ Sedang membuat server *${command.toUpperCase()}*...\n> Mohon tunggu sebentar.`,
  }, { quoted: m.fakeObj || m });

  try {
    const userData = await ptlFetch('/api/application/users', 'POST', {
      email, username,
      first_name: name, last_name: 'Server',
      language: 'en', password,
    });

    if (userData?.errors) {
      await m.react('❌');
      return m.reply(`> ❌ Gagal buat user: \`${JSON.stringify(userData.errors[0])}\``);
    }

    const user    = userData.attributes;
    const nestid  = getNestId();
    const egg     = getEgg();
    const loc     = getLoc();
    const now     = Date.now();

    const eggData    = await ptlFetch(`/api/application/nests/${nestid}/eggs/${egg}`);
    const startupCmd = eggData?.attributes?.startup || '/usr/local/bin/${CMD_RUN}';
    const eggEnv     = eggData?.attributes?.relationships?.variables?.data ?? [];

    const environment = {
      INST:        'npm',
      USER_UPLOAD: '0',
      AUTO_UPDATE: '0',
      CMD_RUN:     'npm start',
    };

    for (const v of eggEnv) {
      const envVar = v?.attributes?.env_variable;
      const defVal = v?.attributes?.default_value;
      if (envVar && !(envVar in environment) && defVal !== undefined) {
        environment[envVar] = defVal;
      }
    }

    const serverData = await ptlFetch('/api/application/servers', 'POST', {
      name,
      description: `Dibuat: ${fmtDate(now)} | Expired: ${expiredDate(now, 30)}`,
      user:         user.id,
      egg:          parseInt(egg),
      docker_image: 'ghcr.io/parkervcp/yolks:nodejs_20',
      startup:      startupCmd,
      environment,
      limits:         { memory: ram, swap: 0, disk, io: 500, cpu },
      feature_limits: { databases: 5, backups: 5, allocations: 5 },
      deploy: {
        locations:    [parseInt(loc)],
        dedicated_ip: false,
        port_range:   [],
      },
    });

    if (serverData?.errors) {
      await ptlFetch(`/api/application/users/${user.id}`, 'DELETE').catch(() => {});
      await m.react('❌');
      return m.reply(`> ❌ Gagal buat server: \`${JSON.stringify(serverData.errors[0])}\``);
    }

    const server = serverData.attributes;
    trackServer(server.id, user.id, username);

    const teks =
      `> 🖥️ *BERHASIL MEMBUAT SERVER PANEL* ✅\n>\n` +
      `> 📡 *Server ID:* ${server.id}\n` +
      `> 👤 *Username:* ${username}\n` +
      `> 🔐 *Password:* ${password}\n` +
      `> 📧 *Email:* ${email}\n>\n` +
      `> ⚙️ *Spesifikasi:*\n` +
      `> 🧠 RAM: ${fmtRam(ram)}\n` +
      `> 💾 Disk: ${fmtDisk(disk)}\n` +
      `> ⚡ CPU: ${fmtCpu(cpu)}\n>\n` +
      `> 🗓️ *Dibuat:* ${fmtDate(now)}\n` +
      `> ⏰ *Expired:* ${expiredDate(now, 30)}\n` +
      `> ⚠️ Silahkan Update Password Panel pada bagian web panel (tanda emoji bulat) di kanan atas\n>\n` +
      `> ⚠️ Jangan sembarangan screenshot panel ketika domain panel terlihat!\n>\n` +
      `> 🌐 *Panel:* ${getDomain()}`;

    await conn.sendMessage(m.chat, {
      text: `> ✅ *Server berhasil dibuat!*\n> 📤 Detail dikirim ke nomor owner supaya menghindari spam pada nomor bot.`,
    }, { quoted: m.fakeObj || m });

    await sendPanelInfo(conn, ownerJid, teks, username, password);
    await m.react('✅');

  } catch (err) {
    await m.react('❌');
    m.reply(`> ❌ Terjadi kesalahan: ${err.message}`);
  }
};

handler.command     = [
  '1gb','2gb','3gb','4gb','5gb',
  '6gb','7gb','8gb','9gb','10gb',
  'unlimited','unli',
];
handler.category    = 'panel';
handler.description = 'Buat server panel Pterodactyl (owner & reseller group)';

export default handler;

