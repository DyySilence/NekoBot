import { generateWAMessageFromContent, proto } from "baileys";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMB_URL = "https://c.termai.cc/i121/iYXt.jpg";
const THUMB_LIST = [
  "https://c.termai.cc/i197/hylmBwB.jpeg",
  "https://c.termai.cc/i167/KawFG.jpeg",
  "https://c.termai.cc/i101/d3heAiu.jpeg",
];
const AUDIO_PATH = path.join(__dirname, "..", "1", "2", "menu.mp3");

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getTimeGreeting() {
  const hour = Number(new Intl.DateTimeFormat("id-ID", {
    timeZone: global.timezone || "Asia/Jakarta",
    hour: "2-digit", hourCycle: "h23",
  }).format(new Date()));
  if (hour >= 4 && hour < 11) return "Selamat pagi ☀️";
  if (hour >= 11 && hour < 15) return "Selamat siang 🌤️";
  if (hour >= 15 && hour < 18) return "Selamat sore 🏇";
  return "Selamat malam 🌙";
}

function getCurrentTime() {
  const tz = global.timezone || "Asia/Jakarta";
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
  const date = new Intl.DateTimeFormat("id-ID", {
    timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());
  const tzAbbr = tz.includes("Jakarta") ? "WIB" : tz.includes("Makassar") ? "WITA" : tz.includes("Jayapura") ? "WIT" : "GMT+7";
  return `${date} | ${time} ${tzAbbr}`;
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${d}d ${h}h ${m}m ${ss}s`;
}

function getVpsInfo() {
  const cpu = os.cpus() || [];
  const total = os.totalmem();
  const used = total - os.freemem();
  return {
    platform: `${os.platform()} ${os.release()}`,
    cpu: `${cpu.length} Core`,
    cpuModel: cpu[0]?.model?.trim() || "-",
    ram: `${Math.round((used / total) * 100)}% (${(used / 1073741824).toFixed(2)} GB / ${(total / 1073741824).toFixed(2)} GB)`,
    uptime: formatUptime(os.uptime() * 1000),
  };
}

function getCategoryList(commands) {
  const cats = [...new Set(commands.map(c => (c.category || "main").toLowerCase()))];
  const ORDER = ["owner", "main", "primbon", "tools", "fun", "game", "downloader", "search", "sticker", "media", "ai", "ai-image", "user", "random", "group", "info", "nsfw"];
  return [...ORDER.filter(f => cats.includes(f)), ...cats.filter(x => !ORDER.includes(x)).sort()];
}

function prettyFolderTitle(folder) {
  const EMOJI = {
    "converter": "🔄", "jpm": "🛠️", "pushkontak": "📲", "owner": "👑", "main": "🏠",
    "tools": "⚙️", "games": "🎮", "fun": "😁", "download": "📥", "anime": "⛩️",
    "search": "🔍", "group": "👥", "ai": "👾", "info": "ℹ️", "ai-image": "🖼️",
    "jpmchannel": "📮", "downloader": "📥", "random": "🎲", "nsfw": "🔞",
    "primbon": "🙏", "panel": "🗃️", "islamic": "🕌"
  };
  const t = String(folder || "").toLowerCase().trim();
  return `${EMOJI[t] || "📂"} ${t.toUpperCase().replace(/_/g, " ")}`;
}

function buildInfoFooter(m, commands, db) {
  const prefix = global.prefix || ".";
  const pushname = m.pushName || "User";
  const vps = getVpsInfo();
  const botUptime = formatUptime(process.uptime() * 1000);
  const userNum = m.senderNumber || m.sender.replace(/[^0-9]/g, "");
  const stats = db.getStatsInfo();

  return (
    `${getTimeGreeting()}\nHalo kak *${pushname}* ≽^• ˕ • ྀི≼\n\n` +
    `*⌞ INFO USER ⌝*\n` +
    `‧ Number    : +${userNum}\n` +
    `‧ Name    : ${pushname}\n` +
    `‧ Status  : ${m.isOwner ? "Owner 👑" : "Free User"}\n` +
    `‧ Chat    : ${m.chat}\n\n` +
    `*⌞ INFO BOT ⌝*\n` +
    `‧ Name    : ${global.botName || "Bot"}\n` +
    `‧ Version : ${global.versionBot || "v1.0.0"}\n` +
    `‧ Prefix  : ${prefix}\n` +
    `‧ Dev     : ${global.dev || global.namaOwner || "Owner"}\n` +
    `‧ Uptime  : ${botUptime}\n` +
    `‧ Fitur   : ${commands.length}\n` +
    `‧ Total Hits : ${stats.totalHits.toLocaleString("id-ID")}\n\n` +
    `*⌞ INFO VPS ⌝*\n` +
    `‧ OS     : ${vps.platform}\n` +
    `‧ CPU    : ${vps.cpu} (${vps.cpuModel})\n` +
    `‧ RAM    : ${vps.ram}\n` +
    `‧ Uptime : ${vps.uptime}\n\n` +
    `*⌞ CARA PAKAI ⌝*\n` +
    `‧ Klik tombol untuk melihat menu kategori\n` +
    `‧ Klik *SEMUA MENU* untuk seluruh fitur`
  ).trim();
}

let cachedThumb = null;
let cachedThumbUrl = null;

async function getThumbBuffer(url) {
  if (cachedThumb && cachedThumbUrl === url) return cachedThumb;
  try {
    const { default: fetch } = await import("node-fetch");
    const { default: Jimp } = await import("jimp");
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const img = await Jimp.read(await res.buffer());
    img.cover(300, 300).quality(60);
    const buf = await img.getBufferAsync(Jimp.MIME_JPEG);
    cachedThumb = buf; cachedThumbUrl = url;
    return buf;
  } catch { return null; }
}

async function trySendAudio(conn, m) {
  if (!fs.existsSync(AUDIO_PATH)) return;
  try {
    await conn.sendMessage(m.chat, {
      audio: fs.readFileSync(AUDIO_PATH),
      mimetype: "audio/mp4",
      ptt: true,
    }, { quoted: m.fakeObj || m });
  } catch {}
}

// ==================== TROLİ QUOTED FIX ====================
const getTroliQuoted = (m) => ({
  key: {
    remoteJid: "status@broadcast",
    fromMe: false,
    id: "BAE5C9E3C9A6C8D6",
    participant: "0@s.whatsapp.net",
  },
  message: {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "review_and_pay",
            buttonParamsJson: JSON.stringify({
              currency: "IDR",
              total_amount: { value: 10000000, offset: 100 },
              reference_id: "REF-" + Math.random().toString(36).substring(7).toUpperCase(),
              type: "physical-goods",
              order: {
                status: "payment_requested",
                order_type: "PAYMENT_REQUEST",
                subtotal: { value: 0, offset: 100 },
                items: [
                  {
                    retailer_id: "item-" + Date.now(),
                    name: m.pushName || "User",
                    amount: { value: 10000000, offset: 100 },
                    quantity: 1,
                  },
                ],
              },
              additional_note: global.botName || "Bot",
              native_payment_methods: [],
              share_payment_status: false,
            }),
          },
        ],
      },
    },
  },
});

const handler = async (m, { conn, commands, db }) => {
  await m.react("😜");

  const prefix = global.prefix || ".";
  const url = global.websiteUrl || global.linkOwner || "https://wa.me";
  const newsletterJid = global.channelJid || "120363421160571057@newsletter";
  const newsletterName = global.botName || "Bot";
  const thumbBuffer = await getThumbBuffer(pickRandom(THUMB_LIST));
  const footerText = buildInfoFooter(m, commands, db);
  const categories = getCategoryList(commands);

  const folderButtons = [
    { title: "📋 SEMUA MENU", id: `${prefix}allmenu` },
    ...categories.map(cat => ({ title: prettyFolderTitle(cat), id: `${prefix}category ${cat}` })),
  ];

  try {
    // Gunakan troliQuoted dari serialize
    const quotedTroli = getTroliQuoted(m);
    
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 109,
              isForwarded: true,
              forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: `- ${newsletterName}`, serverMessageId: -1 },
              externalAdReply: {
                title: newsletterName,
                body: getCurrentTime(),
                thumbnailUrl: THUMB_URL,
                sourceUrl: url,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
            header: {
              title: null,
              locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: `꫶ᥫ᭡꫶ ${m.pushName || "User"}`,
                url,
                address: getTimeGreeting(),
                jpegThumbnail: thumbBuffer,
              },
              subtitle: "",
              hasMediaAttachment: false,
            },
            body: { text: null },
            footer: { text: footerText },
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: folderButtons.map(b => ({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: b.title, id: b.id, has_multiple_buttons: true }),
              })),
              messageParamsJson: JSON.stringify({
                bottom_sheet: {
                  in_thread_buttons_limit: 1,
                  divider_indices: [1],
                  list_title: getTimeGreeting(),
                  button_title: "𖤍",
                },
              }),
            }),
          }),
        },
      },
    }, { 
      quoted: quotedTroli, // PAKAI TROLİ QUOTED
      userJid: conn.user?.id 
    });

    await conn.relayMessage(msg.key.remoteJid, msg.message, { 
      messageId: msg.key.id,
      quoted: quotedTroli // QUOTED JUGA DI RELAY
    });
    
    await trySendAudio(conn, m);
    await m.react("✅");
  } catch (err) {
    console.error("[Menu] Interactive error:", err.message);
    await m.react("❌");
    
    // Fallback ke reply biasa dengan troliQuoted
    await m.reply(footerText, { quoted: getTroliQuoted(m) });
  }
};

handler.command = ["menu", "help", "start"];
handler.category = "main";
handler.description = "Tampilkan menu bot dengan tampilan interactive";

export default handler;