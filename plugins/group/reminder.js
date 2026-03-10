/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
import moment from "moment-timezone";

const handler = async (m, { conn, args, text }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const sub = args[0]?.toLowerCase();

  if (sub === "list") {
    const groupData = global.db.groups[m.chat] ?? {};
    const reminders = groupData.reminders ?? [];
    if (!reminders.length) return m.reply("📭 Tidak ada reminder aktif di grup ini.");

    let listText = "⏰ *DAFTAR REMINDER*\n\n";
    reminders.forEach((r, i) => {
      const timeStr = moment(r.time).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm");
      listText += `${i + 1}. [${r.id}] ${timeStr}\n📝 ${r.message}\n\n`;
    });
    return m.reply(listText);
  }

  if (sub === "del" || sub === "hapus") {
    const id = args[1];
    if (!id) return m.reply("❌ Tulis ID reminder yang ingin dihapus!");
    const groupData = global.db.groups[m.chat] ?? {};
    const before = (groupData.reminders ?? []).length;
    groupData.reminders = (groupData.reminders ?? []).filter((r) => r.id !== id);
    global.db.groups[m.chat] = groupData;
    if (groupData.reminders.length === before) return m.reply("❌ ID reminder tidak ditemukan!");
    return m.reply(`✅ Reminder *${id}* berhasil dihapus!`);
  }

  if (!args[0]) {
    return m.reply(
      `⏰ *REMINDER*\n\nCara pakai:\n• \`reminder 30m Pesan\` — 30 menit lagi\n• \`reminder 2h Pesan\` — 2 jam lagi\n• \`reminder 14:30 Pesan\` — jam 14:30 WIB\n• \`reminder list\` — lihat daftar\n• \`reminder del <id>\` — hapus`
    );
  }

  const timeArg = args[0];
  const message = args.slice(1).join(" ");
  if (!message) return m.reply("❌ Tulis pesan remindernya!\nContoh: `.reminder 30m Meeting sekarang!`");

  let targetTime;
  if (/^\d{1,2}:\d{2}$/.test(timeArg)) {
    const [h, min] = timeArg.split(":").map(Number);
    targetTime = moment().tz("Asia/Jakarta").hours(h).minutes(min).seconds(0).valueOf();
    if (targetTime <= Date.now()) targetTime += 86400000; // next day
  } else if (/^\d+m$/.test(timeArg)) {
    targetTime = Date.now() + parseInt(timeArg) * 60000;
  } else if (/^\d+h$/.test(timeArg)) {
    targetTime = Date.now() + parseInt(timeArg) * 3600000;
  } else {
    return m.reply("❌ Format waktu tidak valid!\nContoh: `30m`, `2h`, atau `14:30`");
  }

  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.reminders) groupData.reminders = [];
  groupData.reminders.push({ id, time: targetTime, message, by: m.sender });
  global.db.groups[m.chat] = groupData;

  const delay = targetTime - Date.now();
  setTimeout(async () => {
    try {
      const currentData = global.db.groups[m.chat] ?? {};
      currentData.reminders = (currentData.reminders ?? []).filter((r) => r.id !== id);
      global.db.groups[m.chat] = currentData;

      const meta   = global.groupMetadataCache?.get(m.chat) ?? {};
      const members = (meta.participants ?? []).map((p) => p.id || p.jid || "").filter(Boolean);
      await conn.sendMessage(m.chat, {
        text: `⏰ *REMINDER!*\n\n📝 ${message}\n\n🕐 ${moment().tz("Asia/Jakarta").format("HH:mm")} WIB`,
        mentions: members,
      });
    } catch {}
  }, delay);

  const displayTime = moment(targetTime).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm");
  await m.reply(`✅ *Reminder berhasil dibuat!*\n\n🆔 ID: ${id}\n📝 ${message}\n⏰ ${displayTime} WIB`);
};

handler.command  = ["reminder"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Buat reminder untuk grup";

export default handler;
