/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveTarget } from "../../lib/serialize.js";

const handler = async (m, { conn, args, participants }) => {
  const { n, mentions, targetJid } = resolveTarget(m, args, participants);

  if (!targetJid && !args[0]) {
    return m.reply(
      `> 🍼 *NENEN*\n>\n` +
      `> 💡 *Cara pakai:*\n` +
      `> \`${global.prefix}nenen @user\`\n` +
      `> \`${global.prefix}nenen (reply chat)\`\n` +
      `> \`${global.prefix}nenen Sakura\``
    );
  }

  await m.react("🍒");

  const text =
    `> NENEN 🍼 NENEN 🍼 KEPENGEN NENEN SAMA *${n}* 😫💦. TETEK GEDE 🍒 NAN KENCANG 💪 MILIK *${n}* MEMBUATKU KEPENGEN NENEN 👅🍼.\n` +
    `> DIBALUT PAKAIAN KETAT 👙 YANG ADUHAI 🔥 CROOOOTOTOTOTOTOT 💦💦💦 ANJING 🐕 SANGE GUA 🥵 BANGSAT 😤.\n` +
    `> *${n}* 🙏, PLIS DENGERIN BAIK BAIK 👂. TOLONG BUKA BAJU 👕 SEBENTAR SAJA 🥺 PLISSS 🙏 TOLOOONG BANGET 😭, BIARKAN MULUT KERINGKU 👄 BISA MENGECAP NENEN 👅🍒 *${n}*.\n` +
    `> BIARKAN AKU MENGENYOT 😋 NENENMU 🍼 *${n}*. AKU RELA NGASIH SESEMBAHAN 🙇 APA AJA 💰 BERAPAPUN ITU DUIT 💵 YANG AKU BAKAR 🔥 KHUSUS TERKHUSUS BUATMU 👑.\n` +
    `> TAPI TOLOOOONG BANGET 😭🙏 BUKA BAJUMU 👚 AKU MAU NENEN 🍼👅. NENEN NENEEEEN 🍒🍒 NENEN *${n}* WANGIIII 🌸💕`;

  await conn.sendMessage(m.chat, { text, mentions }, { quoted: m.fakeObj || m });
  await m.react("💦");
};

handler.command     = ["nenen"];
handler.category    = "fun";
handler.description = "Copypasta nenen (18+)";
handler.group       = true;

export default handler;
