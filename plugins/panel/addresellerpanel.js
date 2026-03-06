/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { getResellerGroups, saveResellerGroups, isResellerGroup } from './_panelUtil.js';

const handler = async (m, { args }) => {
  let targetChat;

  if (args[0]) {
    targetChat = args[0].includes('@g.us')
      ? args[0]
      : args[0].replace(/[^0-9]/g, '') + '@g.us';
  } else {
    if (!m.isGroup) {
      return m.reply(
        `> 🏪 *TAMBAH GRUP RESELLER*\n>\n` +
        `> 💡 Cara pakai:\n` +
        `> Ketik di dalam grup target:\n` +
        `> \`${global.prefix}addresellerpanel\`\n>\n` +
        `> Atau dari luar grup:\n` +
        `> \`${global.prefix}addresellerpanel 628xxx\``
      );
    }
    targetChat = m.chat;
  }

  if (isResellerGroup(targetChat)) {
    return m.reply('> ⚠️ Grup ini sudah terdaftar sebagai reseller!');
  }

  const list = getResellerGroups();
  list.push(targetChat);
  saveResellerGroups(list);

  const cached  = global.groupMetadataCache?.get(targetChat);
  const grpName = cached?.subject ?? targetChat;

  await m.react('✅');
  return m.reply(
    `> ✅ *Grup reseller berhasil ditambahkan!*\n>\n` +
    `> 🏪 Grup: *${grpName}*\n` +
    `> 🆔 ID: \`${targetChat}\`\n>\n` +
    `> Semua member grup ini sekarang bisa create panel.`
  );
};

handler.command     = ['addresellerpanel'];
handler.category    = 'panel';
handler.description = 'Tambah grup reseller panel';
handler.owner       = true;

export default handler;
