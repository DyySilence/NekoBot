/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, metadata }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");

  const groupData = global.db.groups[m.chat] ?? {};
  const warns = groupData.warns ?? {};
  const entries = Object.entries(warns).filter(([, v]) => v > 0);

  if (!entries.length) return m.reply("✅ Tidak ada member yang sedang dalam status warn.");

  const groupName = metadata?.subject ?? m.chat.split("@")[0];
  let text = `⚠️ *DAFTAR WARN - ${groupName}*\n\n`;
  entries.forEach(([num, count], i) => {
    text += `${i + 1}. @${num} — ${count}/3 warn\n`;
  });

  const mentions = entries.map(([num]) => num + "@s.whatsapp.net");
  await conn.sendMessage(m.chat, { text, mentions }, { quoted: m });
};

handler.command  = ["listwarn", "warnlist"];
handler.category = "group";
handler.group    = true;
handler.description = "Lihat daftar warn member";

export default handler;
