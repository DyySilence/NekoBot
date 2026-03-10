/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const searchCity = async (query) => {
  try {
    const res  = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
    const data = await res.json();
    if (!data.status || !Array.isArray(data.data)) return null;
    const q       = query.toLowerCase().trim();
    const exact   = data.data.find(c => c.lokasi.toLowerCase() === q || c.lokasi.toLowerCase() === `kota ${q}`);
    if (exact) return exact;
    const contains = data.data.filter(c => c.lokasi.toLowerCase().includes(q));
    return contains[0] || null;
  } catch {
    return null;
  }
};

const handler = async (m, { conn, args, command }) => {
  if (!m.isGroup) return m.reply("> ⚠️ Command ini hanya untuk grup!");

  const groupData = global.db.groups[m.chat] || {};

  if (command === "offsholat") {
    if (!groupData.sholat?.enabled) return m.reply("> ❌ Notif sholat belum aktif di grup ini.");
    groupData.sholat.enabled = false;
    global.db.groups[m.chat] = groupData;
    await m.react("✅");
    return m.reply("> 🕌 *Notif sholat dimatikan.*");
  }

  if (!args[0]) {
    const s = groupData.sholat;
    if (s?.enabled) {
      return m.reply(
        `> 🕌 *STATUS NOTIF SHOLAT*\n>\n` +
        `> 🟢 Status: Aktif\n` +
        `> 🌆 Kota: *${s.cityName || s.cityId}*\n>\n` +
        `> Untuk mematikan: *${global.prefix}offsholat*`
      );
    }
    return m.reply(
      `> 🕌 *SET NOTIF SHOLAT*\n>\n` +
      `> Kirim nama kota untuk mengaktifkan:\n` +
      `> *${global.prefix}setsholat jakarta*\n>\n` +
      `> Untuk mematikan: *${global.prefix}off sholat*`
    );
  }

  await m.react("⏳");
  const query = args.join(" ");
  const city  = await searchCity(query);

  if (!city) {
    await m.react("❌");
    return m.reply(
      `❌ Kota *${query}* tidak ditemukan.\n>\n` +
      `> Contoh: *${global.prefix}setsholat jakarta*\n` +
      `> atau: *${global.prefix}setsholat surabaya*`
    );
  }

  if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
  global.db.groups[m.chat].sholat = {
    enabled:    true,
    cityId:     city.id,
    cityName:   city.lokasi,
    sentToday:  {},
    lastDate:   "",
  };

  await m.react("✅");
  return m.reply(
    `🕌 *NOTIF SHOLAT AKTIF*\n>\n` +
    `🌆 Kota: *${city.lokasi}*\n` +
    `✅ Bot akan kirim notif + adzan tiap waktu sholat\n>\n` +
    `> Untuk mematikan: *${global.prefix}offsholat*`
  );
};

handler.command     = ["setsholat","offsholat"];
handler.category    = "islamic";
handler.description = "Set/matikan notifikasi waktu sholat otomatis";
handler.group       = true;
handler.admin       = true;

export default handler;
