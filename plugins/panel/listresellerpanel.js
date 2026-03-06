/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { getResellerGroups } from './_panelUtil.js';

const handler = async (m) => {
  const list = getResellerGroups();

  if (!list.length) {
    return m.reply(
      `> 🏪 *LIST GRUP RESELLER*\n>\n` +
      `> ❌ Belum ada grup reseller terdaftar.\n>\n` +
      `> 💡 Tambah: \`${global.prefix}addresellerpanel\``
    );
  }

  let text = `> 🏪 *LIST GRUP RESELLER*\n> Total: ${list.length}\n>\n`;

  for (let i = 0; i < list.length; i++) {
    const cached  = global.groupMetadataCache?.get(list[i]);
    const grpName = cached?.subject ?? '—';
    text += `> ${i + 1}. *${grpName}*\n> 🆔 \`${list[i]}\`\n>\n`;
  }

  text += `> 💡 Hapus: \`${global.prefix}delresellerpanel <id>\``;

  await m.react('✅');
  return m.reply(text);
};

handler.command     = ['listresellerpanel'];
handler.category    = 'panel';
handler.description = 'List semua grup reseller panel';
handler.owner       = true;

export default handler;
