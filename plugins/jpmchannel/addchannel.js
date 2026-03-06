/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { args, text }) => {
  if (!text || args.length < 2) {
    return m.reply(
      `> ❌ *FORMAT SALAH!*\n` +
      `>\n` +
      `> 📝 *Cara pakai:*\n` +
      `> \`${global.prefix}addchannel <nama> <jid/link>\`\n` +
      `>\n` +
      `> 📌 *Contoh:*\n` +
      `> \`${global.prefix}addchannel Berita https://whatsapp.com/channel/xxxx\`\n` +
      `> \`${global.prefix}addchannel Hiburan 120363xxxxxxxxxx@newsletter\`\n` +
      `>\n` +
      `> 💡 Setelah ditambah, \`${global.prefix}jpmch\` otomatis kirim ke semua channel`
    );
  }

  const name = args[0];
  const raw  = args.slice(1).join(" ").trim();

  let channelJid = "";

  if (raw.includes("whatsapp.com/channel/")) {
    const match = raw.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/);
    if (match) {
      channelJid = raw.trim();
    } else {
      await m.react("❌");
      return m.reply(`> ❌ Format link channel tidak valid!\n>\n> Contoh: https://whatsapp.com/channel/ABC123`);
    }
  } else if (raw.includes("@newsletter")) {
    channelJid = raw.trim();
  } else if (raw.replace(/[^0-9]/g, "").length > 10) {
    channelJid = raw.trim() + "@newsletter";
  } else {
    channelJid = raw.trim();
  }

  if (!channelJid) {
    await m.react("❌");
    return m.reply("> ❌ JID/Link channel tidak valid!");
  }

  if (!global.db.settings) global.db.settings = {};
  if (!Array.isArray(global.db.settings.channels)) global.db.settings.channels = [];

  const already = global.db.settings.channels.find(
    (ch) => ch.name.toLowerCase() === name.toLowerCase() || ch.jid === channelJid
  );

  if (already) {
    await m.react("⚠️");
    return m.reply(
      `> ⚠️ *Channel sudah ada!*\n` +
      `>\n` +
      `> 📛 Nama: *${already.name}*\n` +
      `> 🔗 JID: \`${already.jid}\`\n` +
      `>\n` +
      `> 💡 Gunakan \`${global.prefix}delchannel ${already.name}\` untuk menghapusnya terlebih dahulu`
    );
  }

  global.db.settings.channels.push({
    name:    name,
    jid:     channelJid,
    addedAt: Date.now(),
    addedBy: m.sender,
  });

  await m.react("✅");
  return m.reply(
    `> ✅ *Channel berhasil ditambahkan!*\n` +
    `>\n` +
    `> 📛 Nama: *${name}*\n` +
    `> 🔗 JID/Link: \`${channelJid}\`\n` +
    `> 📅 Ditambahkan: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n` +
    `>\n` +
    `> 📊 Total channel: ${global.db.settings.channels.length}\n` +
    `> 💡 Gunakan \`${global.prefix}jpmch <pesan>\` untuk kirim ke semua channel`
  );
};

handler.command     = ["addchannel", "addch"];
handler.category    = "jpmchannel";
handler.description = "Menambahkan channel WhatsApp ke daftar broadcast";
handler.owner       = true;

export default handler;
