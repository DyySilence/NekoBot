/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { text }) => {
  if (!Array.isArray(global.db.settings?.channels)) global.db.settings.channels = [];
  const channels = global.db.settings.channels;

  if (!text || !text.trim()) {
    if (channels.length === 0) {
      return m.reply(
        `> ❌ Belum ada channel yang tersimpan.\n` +
        `>\n` +
        `> 💡 Gunakan \`${global.prefix}addchannel <nama> <jid/link>\` untuk menambahkan channel`
      );
    }
    const lines = [
      `> 📢 *FORMAT SALAH!*`,
      `>`,
      `> 👤 Cara pakai: \`${global.prefix}delchannel <nama>\``,
      `>`,
      `> 📋 *Channel tersedia:*`,
    ];
    channels.forEach((ch, i) => {
      lines.push(`> ${i + 1}. *${ch.name}* — \`${ch.jid}\``);
    });
    return m.reply(lines.join("\n"));
  }

  const input = text.trim().toLowerCase();
  const idx   = channels.findIndex(
    (ch) => ch.name.toLowerCase() === input || ch.jid.toLowerCase() === input
  );

  if (idx === -1) {
    const lines = [`> ❌ Channel *"${text.trim()}"* tidak ditemukan!`, `>`];
    if (channels.length > 0) {
      lines.push(`> 📋 *Channel tersedia:*`);
      channels.forEach((ch, i) => {
        lines.push(`> ${i + 1}. *${ch.name}* — \`${ch.jid}\``);
      });
    } else {
      lines.push(`> 📭 Tidak ada channel yang tersimpan.`);
    }
    return m.reply(lines.join("\n"));
  }

  const deleted = channels[idx];
  global.db.settings.channels.splice(idx, 1);

  await m.react("🗑️");
  return m.reply(
    [
      `> 🗑️ *Channel berhasil dihapus!*`,
      `>`,
      `> 📛 Nama: *${deleted.name}*`,
      `> 🔗 JID: \`${deleted.jid}\``,
      `>`,
      `> 📊 Sisa channel: ${global.db.settings.channels.length}`,
    ].join("\n")
  );
};

handler.command     = ["delchannel", "delch"];
handler.category    = "jpmchannel";
handler.description = "Menghapus channel dari daftar broadcast";
handler.owner       = true;

export default handler;
