/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const handler = async (m, { args, db }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!m.isBotAdmin) return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin!");

  const val = args[0]?.toLowerCase();

  const getSchedule = () => {
    if (db?.getSchedules) {
      const all = db.getSchedules();
      return all[m.chat] ?? {};
    }
    return global.db?.groups?.[m.chat]?.schedule ?? {};
  };

  const setSchedule = (key, time) => {
    if (db?.setGroupSchedule) return db.setGroupSchedule(m.chat, key, time);
    if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
    if (!global.db.groups[m.chat].schedule) global.db.groups[m.chat].schedule = {};
    if (time === null) delete global.db.groups[m.chat].schedule[key];
    else global.db.groups[m.chat].schedule[key] = time;
  };

  if (!val || val === "off") {
    setSchedule("autoOpen", null);
    return m.reply("✅ *Auto Open dinonaktifkan!*");
  }
  if (!timeRegex.test(val))
    return m.reply("❌ Format waktu salah!\nContoh: `.autoopen 08:00`");

  setSchedule("autoOpen", val);
  return m.reply(`✅ *Auto Open diatur pukul ${val} WIB*\nGrup akan dibuka otomatis setiap hari pukul ${val}.`);
};

handler.command     = ["autoopen"];
handler.category    = "group";
handler.admin       = true;
handler.botAdmin    = true;
handler.group       = true;
handler.description = "Atur jadwal buka grup otomatis. Contoh: .autoopen 08:00 | .autoopen off";

export default handler;
