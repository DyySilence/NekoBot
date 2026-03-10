/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import moment from "moment-timezone";

const fetchSchedule = async (cityId) => {
  const today = moment().tz("Asia/Jakarta").format("YYYY/MM/DD");
  const res   = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${today}`);
  const data  = await res.json();
  if (!data.status || !data.data?.jadwal) throw new Error("Data tidak tersedia");
  return {
    city:     data.data.lokasi,
    province: data.data.daerah,
    date:     data.data.jadwal.date,
    times: {
      imsak:   data.data.jadwal.imsak,
      shubuh:  data.data.jadwal.subuh,
      dzuhur:  data.data.jadwal.dzuhur,
      ashr:    data.data.jadwal.ashar,
      maghrib: data.data.jadwal.maghrib,
      isya:    data.data.jadwal.isya,
    },
  };
};

const handler = async (m, { conn, args }) => {
  let cityId, cityName;

  if (args[0]) {
    await m.react("⏳");
    try {
      const res  = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        const q     = args.join(" ").toLowerCase().trim();
        const found = data.data.find(c =>
          c.lokasi.toLowerCase() === q ||
          c.lokasi.toLowerCase() === `kota ${q}` ||
          c.lokasi.toLowerCase().includes(q)
        );
        if (found) { cityId = found.id; cityName = found.lokasi; }
      }
    } catch {}
    if (!cityId) {
      await m.react("❌");
      return m.reply(`> ❌ Kota *${args.join(" ")}* tidak ditemukan.`);
    }
  } else if (m.isGroup) {
    const sholat = global.db.groups?.[m.chat]?.sholat;
    if (!sholat?.cityId) {
      return m.reply(
        `❌ Kota belum diset untuk grup ini.\n>\n` +
        `> Gunakan: *${global.prefix}setsholat jakarta*\n` +
        `> Atau: *${global.prefix}jadwalsholat jakarta*`
      );
    }
    cityId   = sholat.cityId;
    cityName = sholat.cityName || sholat.cityId;
  } else {
    return m.reply(
      `📅 *JADWAL SHOLAT*\n>\n` +
      `Kirim nama kota:\n` +
      `> *${global.prefix}jadwalsholat jakarta*`
    );
  }

  await m.react("⏳");
  let schedule;
  try {
    schedule = await fetchSchedule(cityId);
  } catch (e) {
    await m.react("❌");
    return m.reply(`> ❌ Gagal mengambil jadwal.\n> Error: ${e.message}`);
  }

  const now   = moment().tz("Asia/Jakarta").format("HH:mm");
  const times = schedule.times;
  const order = ["imsak","shubuh","dzuhur","ashr","maghrib","isya"];
  const label = { imsak:"Imsak", shubuh:"Subuh", dzuhur:"Dzuhur", ashr:"Ashar", maghrib:"Maghrib", isya:"Isya" };
  const emoji = { imsak:"🌙", shubuh:"🌅", dzuhur:"☀️", ashr:"🌤️", maghrib:"🌆", isya:"🌙" };

  let nextPrayer = null;
  for (const key of order) {
    if (times[key] > now) { nextPrayer = key; break; }
  }

  const rows = order.map(key => {
    const isNext = key === nextPrayer;
    return `> ${emoji[key]} *${label[key]}*${isNext ? " ← berikutnya" : ""}: ${times[key]} WIB`;
  }).join("\n");

  const dateStr = moment().tz("Asia/Jakarta").format("dddd, DD MMMM YYYY");

  await m.react("✅");
  return m.reply(
    `📅 *JADWAL SHOLAT*\n>\n` +
    `🌆 *${schedule.city}*${schedule.province ? `, ${schedule.province}` : ""}\n` +
    `📆 ${dateStr}\n>\n` +
    rows + "\n>\n" +
    `> ⏰ Sekarang: ${now} WIB`
  );
};

handler.command     = ["jadwalsholat"];
handler.category    = "islamic";
handler.description = "Lihat jadwal sholat hari ini";

export default handler;
