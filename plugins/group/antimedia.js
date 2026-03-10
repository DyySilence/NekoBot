/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const ALIAS = {
  foto:     "image",
  image:    "image",
  gambar:   "image",
  video:    "video",
  vn:       "audio",
  audio:    "audio",
  suara:    "audio",
  document: "document",
  doc:      "document",
  file:     "document",
  sticker:  "sticker",
  stiker:   "sticker",
};

const LABEL = {
  image:    "Foto/Gambar",
  video:    "Video",
  audio:    "Audio/VN",
  document: "Document/File",
  sticker:  "Sticker",
};

const handler = async (m, { args }) => {
  if (!m.isGroup)           return m.reply(global.mess?.group    ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!m.isBotAdmin)        return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin!");

  if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
  const groupData = global.db.groups[m.chat];
  if (!groupData.antimedia) groupData.antimedia = {};

  const type = args[0]?.toLowerCase();
  const sub  = args[1]?.toLowerCase();

  if (!type || type === "status") {
    const lines = Object.entries(LABEL).map(([key, label]) =>
      `• ${label.padEnd(16)}: *${groupData.antimedia[key] ? "ON ✅" : "OFF ❌"}*`
    );
    return m.reply(
      `ℹ️ *Antimedia Status*\n\n${lines.join("\n")}\n\n` +
      `*Cara pakai:*\n` +
      `• \`.antimedia foto on/off\`\n` +
      `• \`.antimedia video on/off\`\n` +
      `• \`.antimedia vn on/off\`\n` +
      `• \`.antimedia audio on/off\`\n` +
      `• \`.antimedia document on/off\`\n` +
      `• \`.antimedia sticker on/off\`\n` +
      `• \`.antimedia all on/off\``
    );
  }

  if (type === "all" || type === "semua") {
    if (!sub || (sub !== "on" && sub !== "off"))
      return m.reply("❌ Tulis: `.antimedia all on` atau `.antimedia all off`");
    const val = sub === "on";
    for (const key of Object.keys(LABEL)) groupData.antimedia[key] = val;
    global.db.groups[m.chat] = groupData;
    return m.reply(`✅ Semua antimedia *${val ? "diaktifkan" : "dinonaktifkan"}!*`);
  }

  const key = ALIAS[type];
  if (!key)
    return m.reply(`❌ Tipe tidak dikenal: *${type}*\n\nTipe valid: foto, video, vn, audio, document, sticker`);
  if (!sub || (sub !== "on" && sub !== "off"))
    return m.reply(`❌ Tulis: \`.antimedia ${type} on\` atau \`.antimedia ${type} off\``);

  const val = sub === "on";
  groupData.antimedia[key] = val;
  global.db.groups[m.chat] = groupData;
  return m.reply(`✅ Antimedia *${LABEL[key]}* ${val ? "diaktifkan ✅" : "dinonaktifkan ❌"}!`);
};

handler.command     = ["antimedia"];
handler.category    = "group";
handler.admin       = true;
handler.botAdmin    = true;
handler.group       = true;
handler.description = "Blokir media tertentu di grup (hapus tanpa notif)";

export default handler;
