/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { }) => {
  const chat  = m.chat;
  const store = global.db.groups?.[chat]?.autoRespon;

  if (!store || !Object.keys(store).length) {
    return m.reply(
      `> 📋 *LIST RESPON*\n>\n` +
      `> Belum ada auto respon di grup ini.\n>\n` +
      `> Tambah dengan: \`.addrespon keyword|teks\``
    );
  }

  const entries = Object.entries(store);
  let text = `> 📋 *LIST AUTO RESPON*\n> Total: ${entries.length} keyword\n>\n`;

  entries.forEach(([kw, res], i) => {
    const num  = String(i + 1).padStart(2, "0");
    const type = res.mediaType
      ? { image: "🖼️ Foto", video: "🎬 Video", audio: res.ptt ? "🎤 Voice Note" : "🎵 Audio", document: "📄 Dokumen", sticker: "🎭 Stiker" }[res.mediaType] || "📎 Media"
      : "💬 Teks";

    text += `> *${num}.* \`${kw}\` — ${type}`;
    if (res.caption) text += `\n>     📝 _${res.caption.slice(0, 40)}${res.caption.length > 40 ? "…" : ""}_`;
    else if (res.text) text += `\n>     _${res.text.slice(0, 40)}${res.text.length > 40 ? "…" : ""}_`;
    text += "\n";
  });

  text += `>\n> Hapus: \`.delrespon keyword\``;
  return m.reply(text);
};

handler.command     = ["listrespon"];
handler.category    = "group";
handler.description = "Lihat daftar auto respon keyword";
handler.admin       = true;

export default handler;
