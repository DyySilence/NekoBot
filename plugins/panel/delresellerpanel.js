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
        `> 💡 Cara pakai:\n` +
        `> \`${global.prefix}delresellerpanel\` — hapus grup ini\n` +
        `> \`${global.prefix}delresellerpanel <id>\` — hapus by ID`
      );
    }
    targetChat = m.chat;
  }

  if (!isResellerGroup(targetChat)) {
    return m.reply('> ❌ Grup ini tidak terdaftar sebagai reseller.');
  }

  const newList = getResellerGroups().filter(g => g !== targetChat);
  saveResellerGroups(newList);

  await m.react('✅');
  return m.reply(
    `> ✅ *Grup reseller berhasil dihapus!*\n>\n` +
    `> 🆔 ID: \`${targetChat}\``
  );
};

handler.command     = ['delresellerpanel'];
handler.category    = 'panel';
handler.description = 'Hapus grup reseller panel';
handler.owner       = true;

export default handler;
