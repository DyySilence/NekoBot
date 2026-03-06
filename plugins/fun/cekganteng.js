/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveTarget } from "../../lib/serialize.js";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const handler = async (m, { conn, args, participants }) => {
  const { n, mentions, targetJid } = resolveTarget(m, args, participants);

  await m.react("🪞");

  const loadingSteps = [
    `> 🪞 *CEK GANTENG*\n>\n> ⏳ Memulai scan...\n>\n> ▱▱▱▱▱▱▱▱▱▱ 0%`,
    `> 🪞 *CEK GANTENG*\n>\n> 💇 Menganalisa rambut...\n>\n> ▰▰▱▱▱▱▱▱▱▱ 20%`,
    `> 🪞 *CEK GANTENG*\n>\n> 👃 Mengukur hidung...\n>\n> ▰▰▰▰▱▱▱▱▱▱ 40%`,
    `> 🪞 *CEK GANTENG*\n>\n> 🧔 Mendeteksi rahang...\n>\n> ▰▰▰▰▰▰▱▱▱▱ 60%`,
    `> 🪞 *CEK GANTENG*\n>\n> ✨ Mengukur aura & style...\n>\n> ▰▰▰▰▰▰▰▰▱▱ 80%`,
    `> 🪞 *CEK GANTENG*\n>\n> ✅ Finalisasi hasil...\n>\n> ▰▰▰▰▰▰▰▰▰▰ 100%`,
  ];

  const sent = await conn.sendMessage(m.chat, {
    text: loadingSteps[0],
    mentions,
  }, { quoted: m.fakeObj || m });

  for (let i = 1; i < loadingSteps.length; i++) {
    await delay(900);
    await conn.sendMessage(m.chat, {
      text: loadingSteps[i],
      edit: sent.key,
      mentions,
    });
  }

  const rambut = rand(60, 100);
  const hidung = rand(40, 100);
  const rahang = rand(30, 100);
  const senyum = rand(50, 100);
  const aura   = rand(70, 100);
  const style  = rand(40, 100);
  const total  = Math.floor((rambut + hidung + rahang + senyum + aura + style) / 6);

  let verdict = "😐 BIASA AJA";
  let emoji   = "🙂";
  if      (total >= 90) { verdict = "🔥 GANTENG PARAH"; emoji = "🥵🔥"; }
  else if (total >= 80) { verdict = "😎 GANTENG";       emoji = "😎✨"; }
  else if (total >= 70) { verdict = "😊 LUMAYAN";        emoji = "😌";  }
  else if (total >= 60) { verdict = "🙂 BOLEH LAH";      emoji = "🙂";  }

  const result =
    `> 🪞 *CEK GANTENG* 🪞\n>\n` +
    `> 👤 *Nama*: *${n}*\n>\n` +
    `> 💇 Rambut: *${rambut}%*\n` +
    `> 👃 Hidung Mancung: *${hidung}%*\n` +
    `> 🧔 Rahang: *${rahang}%*\n` +
    `> 😁 Senyuman: *${senyum}%*\n` +
    `> ✨ Aura: *${aura}%*\n` +
    `> 🕶️ Style: *${style}%*\n>\n` +
    `> 📊 *TOTAL GANTENG*: *${total}%*\n>\n` +
    `> ${emoji} *KESIMPULAN*: ${verdict}\n>\n` +
    `> _${n}, jangan sombong ya kalau hasilnya tinggi 😏_`;

  await delay(600);
  await conn.sendMessage(m.chat, { text: result, edit: sent.key, mentions });
  await m.react("💖");
};

handler.command     = ["cekganteng"];
handler.category    = "fun";
handler.description = "Cek tingkat kegantangan seseorang";

export default handler;
