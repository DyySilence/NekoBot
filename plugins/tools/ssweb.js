import axios from "axios";

const DEVICES = {
  phone:   { width: 375,  height: 812  },
  tablet:  { width: 768,  height: 1024 },
  desktop: { width: 1280, height: 720  },
};

const DEVICE_ALIASES = {
  phone: ["phone", "mobile", "hp", "android", "ios"],
  desktop: ["pc", "desktop", "computer", "laptop"],
  tablet: ["tablet", "tab", "ipad"],
};

function pickUrl(text) {
  const match = String(text || "").match(/https?:\/\/\S+/i);
  return match ? match[0] : "";
}

function normDevice(x) {
  const d = String(x).toLowerCase();
  for (const [key, aliases] of Object.entries(DEVICE_ALIASES)) {
    if (aliases.includes(d)) return key;
  }
  return "desktop";
}

async function ssweb(url, { width = 1280, height = 720, full_page = true } = {}) {
  if (!url.startsWith("http")) url = "https://" + url;

  const { data } = await axios.post(
    "https://gcp.imagy.app/screenshot/createscreenshot",
    {
      url,
      browserWidth:      width,
      browserHeight:     height,
      fullPage:          full_page,
      deviceScaleFactor: 1,
      format:            "png",
    },
    {
      headers: {
        "content-type": "application/json",
        referer:         "https://imagy.app/full-page-screenshot-taker/",
        "user-agent":    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        origin:          "https://imagy.app",
      },
      timeout: 60000,
    }
  );

  if (!data?.fileUrl) throw new Error("Gagal mendapatkan URL screenshot");
  return data.fileUrl;
}

const handler = async (m, { conn, args, text, command }) => {
  const inputUrl = pickUrl(text);

  if (!inputUrl) {
    return m.reply(
      `╭─「 📸 *SCREENSHOT WEB* 」\n` +
      `│\n` +
      `│ 📌 *Cara Penggunaan:*\n` +
      `│\n` +
      `│ 1️⃣ .ssweb <url>\n` +
      `│    Contoh: .ssweb https://google.com\n` +
      `│\n` +
      `│ 2️⃣ .ssweb <url> <device>\n` +
      `│    Contoh: .ssweb https://google.com phone\n` +
      `│\n` +
      `│ 3️⃣ .ssweb <url> full/normal\n` +
      `│    Contoh: .ssweb https://google.com desktop full\n` +
      `│\n` +
      `│ 📱 *Device:* phone • desktop • tablet\n` +
      `│ 📄 *Mode:* full • normal\n` +
      `│\n` +
      `╰───────────────────`
    );
  }

  // Tentukan device dari command alias atau argumen
  let device   = "desktop";
  let fullPage = true;

  if (command === "sspc")       device = "desktop";
  else if (command === "sshp")  device = "phone";
  else {
    const parts = text.split(/\s+/).filter(Boolean);
    const last  = parts[parts.length - 1];
    if (last && !/^https?:\/\//i.test(last)) device = normDevice(last);
    if (parts.some(p => ["partial", "normal"].includes(p))) fullPage = false;
  }

  const { width, height } = DEVICES[device];

  await m.react("⏳");
  await m.reply(
    `╭─「 🔄 *PROCESSING* 」\n` +
    `│\n` +
    `│ 🌐 URL: ${inputUrl}\n` +
    `│ 📱 Device: ${device}\n` +
    `│ 📏 Size: ${width}x${height}\n` +
    `│ 📄 Mode: ${fullPage ? "Full Page" : "Partial"}\n` +
    `│\n` +
    `│ ⏳ Mengambil screenshot...\n` +
    `│\n` +
    `╰───────────────────`
  );

  try {
    const imageUrl = await ssweb(inputUrl, { width, height, full_page: fullPage });

    const imgResp = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    const buf     = Buffer.from(imgResp.data);
    const sizeKB  = (buf.length / 1024).toFixed(2);

    await conn.sendMessage(
      m.chat,
      {
        image:   buf,
        caption:
          `╭─「 ✅ *SCREENSHOT SUKSES* 」\n` +
          `│\n` +
          `│ 🌐 *URL:* ${inputUrl}\n` +
          `│ 📱 *Device:* ${device}\n` +
          `│ 📏 *Resolusi:* ${width}x${height}\n` +
          `│ 📄 *Mode:* ${fullPage ? "Full Page" : "Partial"}\n` +
          `│ 📊 *Size:* ${sizeKB} KB\n` +
          `│\n` +
          `│ ⚡ *Powered by:* imagy.app\n` +
          `│ 👤 *Requested by:* ${m.pushName}\n` +
          `│\n` +
          `╰───────────────────`,
        contextInfo: {
          externalAdReply: {
            title:                 "📸 Screenshot Web",
            body:                  `${device} • ${width}x${height}`,
            thumbnailUrl:          "https://c.termai.cc/i161/3zewPF.jpg",
            sourceUrl:             inputUrl,
            mediaType:             1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m.fakeObj || m }
    );

    await m.react("✅");
  } catch (err) {
    console.error("[ssweb]", err.message);

    let msg = "Gagal mengambil screenshot";
    if (/timeout/i.test(err.message))              msg = "⏰ Website timeout, coba URL lebih sederhana";
    else if (/invalid url|url/i.test(err.message)) msg = "🔗 URL tidak valid. Pastikan diawali https://";
    else if (/ERR_NAME|not found/i.test(err.message)) msg = "🔍 Website tidak ditemukan";
    else if (/net::ERR/i.test(err.message))        msg = "🌐 Koneksi ke website gagal";
    else                                            msg = err.message || msg;

    await m.reply(
      `╭─「 ❌ *SCREENSHOT GAGAL* 」\n` +
      `│\n` +
      `│ 🚫 ${msg}\n` +
      `│\n` +
      `│ 💡 *Tips:*\n` +
      `│ • Pastikan URL valid & bisa diakses\n` +
      `│ • Coba website yang lebih ringan\n` +
      `│ • Gunakan mode normal untuk website berat\n` +
      `│\n` +
      `╰───────────────────`
    );
    await m.react("❌");
  }
};

handler.command     = ["ssweb", "ss", "sspc", "sshp"];
handler.category    = "tools";
handler.description = "Screenshot website dengan berbagai device mode";

export default handler;
