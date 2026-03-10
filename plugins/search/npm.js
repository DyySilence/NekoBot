/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

async function apiGet(path) {
  const { default: axios } = await import("axios");
  const res = await axios.get((global.apiUrl) + path, { timeout: 20000 });
  return res.data;
}

const handler = async (m, { conn, args, text, command }) => {
  const prefix = global.prefix || ".";
  const input  = (text || "").trim();

  if (!input) {
    return m.reply(
      `⚠️ *Cara Pakai*\n\n` +
      `> \`${prefix}npm <query>\`\n` +
      `> \`${prefix}npmd <nama package>\`\n\n` +
      `> Contoh:\n` +
      `> \`${prefix}npm axios\`\n` +
      `> \`${prefix}npmd express\``
    );
  }

  if (command === "npmd") {
    await m.react("⏳");
    try {
      const data = await apiGet(`/search/npm/detail?package=${encodeURIComponent(input)}`);

      if (!data.status) {
        await m.react("❌");
        return m.reply(`❌ ${data.error || "Package tidak ditemukan"}`);
      }

      let out = `📦 *${data.name}*\n\n`;
      out += `📌 *Versi:* ${data.version}\n`;
      if (data.description)          out += `📝 *Deskripsi:* ${data.description.slice(0, 150)}${data.description.length > 150 ? "..." : ""}\n`;
      if (data.author)               out += `👤 *Author:* ${data.author}\n`;
      if (data.license)              out += `📄 *Lisensi:* ${data.license}\n`;
      if (data.homepage)             out += `🌐 *Homepage:* ${data.homepage}\n`;
      out += `🔗 *NPM:* ${data.link}\n`;
      if (data.repository)           out += `🐙 *Repo:* ${data.repository}\n`;
      if (data.publishedAt)          out += `🕐 *Published:* ${new Date(data.publishedAt).toLocaleDateString("id-ID")}\n`;
      if (data.keywords?.length)     out += `\n🏷️ *Keywords:* ${data.keywords.slice(0, 8).join(", ")}`;
      if (data.dependencies?.length) out += `\n📦 *Deps:* ${data.dependencies.slice(0, 5).join(", ")}${data.dependencies.length > 5 ? ` +${data.dependencies.length - 5} lagi` : ""}`;
      if (data.maintainers?.length)  out += `\n👥 *Maintainers:* ${data.maintainers.slice(0, 3).join(", ")}`;

      await m.react("✅");
      return m.reply(out);
    } catch (e) {
      await m.react("❌");
      return m.reply(`❌ *Gagal ambil detail*\n\n> ${e.message}`);
    }
  }

  await m.react("⏳");
  try {
    const data = await apiGet(`/search/npm?q=${encodeURIComponent(input)}&size=8`);

    if (!data.status) {
      await m.react("❌");
      return m.reply(`❌ ${data.error || "Gagal mencari package"}`);
    }

    if (!data.packages?.length) {
      await m.react("❌");
      return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Package "${input}" tidak ditemukan`);
    }

    let out = `📦 *npm search*\n\n`;
    out += `> Query: \`${input}\`\n`;
    out += `> Found: ${data.total?.toLocaleString() || "?"} packages\n\n`;

    data.packages.forEach((pkg, i) => {
      out += `╭┈┈⬡「 ${i + 1}. *${pkg.name}* 」\n`;
      out += `┃ 📌 v${pkg.version}\n`;
      if (pkg.description) out += `┃ 📝 ${pkg.description.slice(0, 60)}${pkg.description.length > 60 ? "..." : ""}\n`;
      if (pkg.author)      out += `┃ 👤 ${pkg.author}\n`;
      out += `┃ 🔗 ${pkg.link}\n`;
      out += `┃ ⭐ Score: ${pkg.score}%\n`;
      out += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    });

    out += `_Ketik \`${prefix}npmd <nama package>\` untuk detail_`;

    await m.react("✅");
    return conn.sendMessage(
      m.chat,
      {
        text: out,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid:   global.channelJid  || "120363425809110720@newsletter",
            newsletterName:  global.channelName || global.botName || "Bot",
            serverMessageId: 127,
          },
        },
      },
      { quoted: m.fakeObj || m }
    );
  } catch (e) {
    await m.react("❌");
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`);
  }
};

handler.command     = ["npm", "npmsearch"];
handler.tags        = ["search"];
handler.help        = ["npm <query>", "npmd <package>"];
handler.category    = "search";
handler.description = "Cari package di NPM registry";

export default handler;