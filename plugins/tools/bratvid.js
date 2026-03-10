

/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";

const handler = async (m, { conn, args, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 🎬 *BRAT ANIMATED STICKER GENERATOR*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}bratvid <teks>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}bratvid Hello World\`\n` +
      `> \`${global.prefix}bratvid Hello --delay 500\`\n>\n` +
      `> ⚙️ Delay default 800ms (100–5000)`
    );
  }


  let delayMs = 800;
  const words = text.trim().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    if (words[i] === "--delay" && words[i + 1]) {
      const d = parseInt(words[i + 1]);
      if (!isNaN(d) && d >= 100 && d <= 5000) { delayMs = d; words.splice(i, 2); break; }
    } else if (words[i].startsWith("delay=")) {
      const d = parseInt(words[i].split("=")[1]);
      if (!isNaN(d) && d >= 100 && d <= 5000) { delayMs = d; words.splice(i, 1); break; }
    }
  }

  const cleanText = words.join(" ").trim();

  if (!cleanText)        return m.reply(`> ❌ Teks tidak boleh kosong.`);
  if (cleanText.length > 800) return m.reply(`> ❌ Teks terlalu panjang, maksimal 800 karakter.`);

  await m.react("⏳");

  const response = await axios.get(`${global.apiUrl}/tools/bratvid`, {
    params:  { text: cleanText, delay: delayMs },
    timeout: 60000,
  });

  if (!response.data?.status || !response.data?.image) {
    throw new Error(response.data?.error || "Gagal generate sticker");
  }

  const buffer = Buffer.from(response.data.image, "base64");
  await m.replySticker(buffer);
  await m.react("✅");
};

handler.command     = ["bratvid"];
handler.category    = "tools";
handler.description = "Generate Brat animated sticker dari teks";

export default handler;
