const handler = async (m, { text }) => {
  const groupData = global.db.groups[m.chat] ?? {};

  if (!text) {
    return m.reply(
      `╭━━『 *GOODBYE MESSAGE* 』━━╮\n` +
      `│\n` +
      `│ Status: ${groupData.leave ? "✅ Aktif" : "❌ Nonaktif"}\n` +
      `│\n` +
      `│ 📝 *Cara Pakai:*\n` +
      `│ Atur teks → ${global.prefix}setgoodbye <teks>\n` +
      `│ Aktifkan  → ${global.prefix}goodbye on\n` +
      `│ Matikan   → ${global.prefix}goodbye off\n` +
      `│ Reset     → ${global.prefix}setgoodbye reset\n` +
      `│\n` +
      `│ 🔤 *Variabel:*\n` +
      `│ @user   → mention member\n` +
      `│ {group} → nama grup\n` +
      `│ {count} → jumlah member\n` +
      `│\n` +
      `│ 💡 *Contoh:*\n` +
      `│ ${global.prefix}setgoodbye Selamat tinggal\n` +
      `│ @user! Semoga sukses 👋\n` +
      `│ Tersisa {count} member di\n` +
      `│ *{group}*\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  if (text === "reset") {
    groupData.leave     = false;
    groupData.leaveText = "";
    global.db.groups[m.chat] = groupData;
    return m.reply(`✅ Goodbye message *direset*!`);
  }

  groupData.leaveText = text;
  global.db.groups[m.chat] = groupData;

  const preview = text
    .replace(/@user/g, `@${m.sender.split("@")[0]}`)
    .replace(/{group}/g, m.chat.split("@")[0])
    .replace(/{count}/g, "1");

  await m.reply(
    `✅ *Teks goodbye disimpan!*\n\n` +
    `📌 Status: ${groupData.leave ? "✅ Aktif" : "❌ Belum diaktifkan"}\n` +
    (groupData.leave ? "" : `💡 Aktifkan dengan: ${global.prefix}setgoodbye on\n`) +
    `\n*Preview:*\n${preview}`
  );
};

handler.command     = ["setgoodbye"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Atur goodbye message. Variabel: @user {group} {count}";

export default handler;
