/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m) => {
  if (!Array.isArray(global.db.settings?.channels)) global.db.settings.channels = [];
  const channels = global.db.settings.channels;

  if (channels.length === 0) {
    await m.react("❌");
    return m.reply(
      `> 📋 *DAFTAR CHANNEL*\n` +
      `>\n` +
      `> ❌ Belum ada channel yang ditambahkan.\n` +
      `>\n` +
      `> 💡 Gunakan \`${global.prefix}addchannel <nama> <jid/link>\` untuk menambahkan channel`
    );
  }

  let text  = `> 📋 *DAFTAR CHANNEL BROADCAST*\n`;
  text     += `> ━━━━━━━━━━━━━━━━━━━━━\n`;
  text     += `>\n`;
  text     += `> 📊 Total: *${channels.length} channel*\n`;
  text     += `>\n`;

  channels.forEach((ch, i) => {
    const addedDate = ch.addedAt
      ? new Date(ch.addedAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
      : "Unknown";
    text += `> *${i + 1}. ${ch.name}*\n`;
    text += `>    🔗 JID: \`${ch.jid}\`\n`;
    text += `>    📅 Ditambah: ${addedDate}\n`;
    text += `>\n`;
  });

  text += `> ━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `> 💡 *Cara pakai:*\n`;
  text += `> • \`${global.prefix}jpmch <pesan>\` → Kirim ke semua channel\n`;
  text += `> • \`${global.prefix}delchannel <nama>\` → Hapus channel\n`;
  text += `> • \`${global.prefix}addchannel <nama> <jid/link>\` → Tambah channel baru`;

  await m.react("📋");
  return m.reply(text);
};

handler.command     = ["listchannel", "listch"];
handler.category    = "jpmchannel";
handler.description = "Menampilkan daftar channel broadcast yang tersimpan";
handler.owner       = true;

export default handler;
