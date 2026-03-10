import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR   = path.join(process.cwd(), "data", "media");
const TEMP_DIR    = path.join(process.cwd(), "sampah");

const PRAYER_CONFIG = {
  imsak: {
    name:  "Imsak",
    emoji: "⏰",
    desc:  "Barangsiapa yang memberi makan orang yang berpuasa, maka baginya pahala seperti orang yang berpuasa tersebut. — HR. Tirmidzi",
    image: "https://c.termai.cc/i148/1w3yl.jpeg",
    adzan: false,
    audio: null,
  },
  shubuh: {
    name:  "Subuh",
    emoji: "🌅",
    desc:  "Dua rakaat fajar (shalat sunnah sebelum subuh) lebih baik daripada dunia dan seisinya. — HR. Muslim",
    image: "https://c.termai.cc/i148/1w3yl.jpeg",
    adzan: true,
    audio: "subuh.mp3",
  },
  dzuhur: {
    name:  "Dzuhur",
    emoji: "☀️",
    desc:  "Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman. — An-Nisa: 103",
    image: "https://c.termai.cc/i188/GarK.jpeg",
    adzan: true,
    audio: "adzan.mp3",
  },
  ashr: {
    name:  "Ashar",
    emoji: "🌤️",
    desc:  "Barangsiapa meninggalkan shalat Ashar, maka terhapuslah amalannya. — HR. Bukhari",
    image: "https://c.termai.cc/i125/yN2REn.jpeg",
    adzan: true,
    audio: "adzan.mp3",
  },
  maghrib: {
    name:  "Maghrib",
    emoji: "🌆",
    desc:  "Mereka sedikit sekali tidur di waktu malam, dan di akhir malam mereka memohon ampun. — Adz-Dzariyat: 17-18",
    image: "https://c.termai.cc/i163/7I73.jpeg",
    adzan: true,
    audio: "adzan.mp3",
  },
  isya: {
    name:  "Isya",
    emoji: "🌙",
    desc:  "Shalat malam (tahajjud) itu adalah kebiasaan orang-orang shaleh sebelummu. — HR. Tirmidzi",
    image: "https://c.termai.cc/i188/jPVT3.jpeg",
    adzan: true,
    audio: "adzan.mp3",
  },
};

const scheduleCache = new Map();

const fetchSchedule = async (cityId) => {
  const today    = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
  const cacheKey = `${cityId}:${today}`;
  if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey);

  try {
    const apiDate = today.replace(/-/g, "/");
    const res     = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${apiDate}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.status || !data.data?.jadwal) throw new Error("Invalid data");

    const schedule = {
      city:  data.data.lokasi,
      times: {
        imsak:   data.data.jadwal.imsak,
        shubuh:  data.data.jadwal.subuh,
        dzuhur:  data.data.jadwal.dzuhur,
        ashr:    data.data.jadwal.ashar,
        maghrib: data.data.jadwal.maghrib,
        isya:    data.data.jadwal.isya,
      },
    };

    scheduleCache.set(cacheKey, schedule);
    const msUntilMidnight = moment().tz("Asia/Jakarta").endOf("day").diff(moment()) + 1000;
    setTimeout(() => scheduleCache.delete(cacheKey), msUntilMidnight);
    return schedule;
  } catch (e) {
    console.error("[SHOLAT] Fetch schedule error:", e.message);
    return {
      city:  "Jakarta",
      times: { imsak:"04:20", shubuh:"04:30", dzuhur:"12:00", ashr:"15:30", maghrib:"18:00", isya:"19:30" },
    };
  }
};

const getMp3Path = (audioFile) => {
  if (!audioFile) return null;
  const p = path.join(MEDIA_DIR, audioFile);
  return fs.existsSync(p) ? p : null;
};

const convertToOgg = async (mp3Path) => {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const id      = crypto.randomBytes(6).toString("hex");
  const oggFile = path.join(TEMP_DIR, `adzan-${id}.ogg`);

  try {
    await execPromise(
      `ffmpeg -y -i "${mp3Path}" -vn -ar 48000 -ac 1 -c:a libopus -b:a 128k "${oggFile}"`
    );
    if (!fs.existsSync(oggFile)) throw new Error("Output ogg tidak ada");
    return fs.readFileSync(oggFile);
  } finally {
    setTimeout(() => {
      try { if (fs.existsSync(oggFile)) fs.unlinkSync(oggFile); } catch {}
    }, 30000);
  }
};

const makeFakeKey = () => ({
  key: {
    remoteJid:   "status@broadcast",
    fromMe:      false,
    id:          crypto.randomBytes(10).toString("hex").toUpperCase(),
    participant: "0@s.whatsapp.net",
  },
  message: {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [{
          name: "review_and_pay",
          buttonParamsJson: JSON.stringify({
            currency: "IDR",
            total_amount: { value: 10000000, offset: 100 },
            reference_id: "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
            type: "physical-goods",
            order: {
              status: "payment_requested",
              order_type: "PAYMENT_REQUEST",
              subtotal: { value: 0, offset: 100 },
              items: [{
                retailer_id: "item-" + Date.now(),
                name: global.botName || "Bot",
                amount: { value: 10000000, offset: 100 },
                quantity: 1,
              }],
            },
            additional_note: global.botName || "Bot",
            native_payment_methods: [],
            share_payment_status: false,
          }),
        }],
      },
    },
  },
  pushName: global.botName || "Bot",
});

export const sendSholatNotif = async (conn, groupId, prayerKey, schedule) => {
  const cfg = PRAYER_CONFIG[prayerKey];
  if (!cfg) return;

  const prayerTime = schedule.times[prayerKey] || "";

  if (!cfg.adzan) {
    const fakeKey = makeFakeKey();
    try {
      await conn.sendMessage(
        groupId,
        {
          text: `${cfg.emoji} *Waktu ${cfg.name}* — ${prayerTime} WIB\n\n_${cfg.desc}_`,
          contextInfo: {
            externalAdReply: {
              title:                 `${cfg.emoji} Waktu ${cfg.name}`,
              body:                  `${schedule.city} • ${prayerTime} WIB`,
              thumbnailUrl:          cfg.image,
              sourceUrl:             "https://www.api.dyysilence.biz.id",
              mediaType:             1,
              renderLargerThumbnail: true,
            },
          },
        },
        { quoted: fakeKey }
      );
    } catch (e) {
      console.error(`[SHOLAT] Gagal kirim notif ${cfg.name}:`, e.message);
    }
    return;
  }

  const mp3Path = getMp3Path(cfg.audio);
  if (!mp3Path) {
    console.warn(`[SHOLAT] File audio tidak ditemukan: ${cfg.audio} di ${MEDIA_DIR}`);
    return;
  }

  try {
    const oggBuffer = await convertToOgg(mp3Path);
    const fakeKey   = makeFakeKey();

    await conn.sendMessage(
      groupId,
      {
        audio:    oggBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt:      true,
        contextInfo: {
          externalAdReply: {
            title:                 `${cfg.emoji} Waktu ${cfg.name} • ${prayerTime} WIB`,
            body:                  `📍 ${schedule.city} — ${cfg.desc.substring(0, 60)}...`,
            thumbnailUrl:          cfg.image,
            sourceUrl:             "https://www.bmkg.go.id",
            mediaType:             1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: fakeKey }
    );
  } catch (e) {
    console.error(`[SHOLAT] Gagal kirim audio ${cfg.name}:`, e.message);
  }
};

export const startSholatNotifier = (conn) => {
  const today = () => moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
  const now   = () => moment().tz("Asia/Jakarta").format("HH:mm");

  return setInterval(async () => {
    try {
      const currentTime = now();
      const currentDate = today();

      for (const [groupId, groupData] of Object.entries(global.db.groups ?? {})) {
        const s = groupData.sholat;
        if (!s?.enabled || !s?.cityId) continue;

        if (s.lastDate !== currentDate) {
          s.lastDate  = currentDate;
          s.sentToday = {};
          global.db.groups[groupId] = groupData;
        }
        if (!s.sentToday) s.sentToday = {};

        let schedule;
        try {
          schedule = await fetchSchedule(s.cityId);
        } catch {
          continue;
        }

        for (const [prayerKey, prayerTime] of Object.entries(schedule.times)) {
          if (!PRAYER_CONFIG[prayerKey]) continue;
          if (currentTime === prayerTime && !s.sentToday[prayerKey]) {
            s.sentToday[prayerKey]    = true;
            global.db.groups[groupId] = groupData;
            await sendSholatNotif(conn, groupId, prayerKey, schedule);
          }
        }
      }
    } catch (e) {
      console.error("[SHOLAT] Notifier error:", e.message);
    }
  }, 60_000);
};
