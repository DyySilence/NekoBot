/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveTarget } from "../../lib/serialize.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const handler = async (m, { conn, args, participants }) => {
  const { n, mentions } = resolveTarget(m, args, participants);

  await m.react("🍆");

  const steps = [
    `> 🍆 *CEK KONTOL* 🍆\n>\n> ⏳ Memulai scan...\n>\n> ▱▱▱▱▱▱▱▱▱▱ 0%`,
    `> 🍆 *CEK KONTOL* 🍆\n>\n> 🔍 Mendeteksi target...\n>\n> ▰▰▱▱▱▱▱▱▱▱ 20%`,
    `> 🍆 *CEK KONTOL* 🍆\n>\n> 📏 Mengukur panjang...\n>\n> ▰▰▰▰▱▱▱▱▱▱ 40%`,
    `> 🍆 *CEK KONTOL* 🍆\n>\n> 🎨 Menganalisa warna & jembut...\n>\n> ▰▰▰▰▰▰▱▱▱▱ 60%`,
    `> 🍆 *CEK KONTOL* 🍆\n>\n> 🏆 Menentukan level & status...\n>\n> ▰▰▰▰▰▰▰▰▱▱ 80%`,
    `> 🍆 *CEK KONTOL* 🍆\n>\n> ✅ Finalisasi hasil...\n>\n> ▰▰▰▰▰▰▰▰▰▰ 100%`,
  ];

  const sent = await conn.sendMessage(m.chat, { text: steps[0] }, { quoted: m.fakeObj || m });
  const key  = sent.key;

  for (let i = 1; i < steps.length; i++) {
    await new Promise((r) => setTimeout(r, 900));
    await conn.sendMessage(m.chat, { text: steps[i], edit: key });
  }

  const panjang  = pick(["3CM 📏","5CM 📐","7CM ✏️","10CM 📏","12CM 🎯","15CM 🚀","18CM 🌟","20CM 💥","25CM 🏆"]);
  const warna    = pick(["Pink 🎀","Merah 🔴","Hitam ⚫","Coklat 🟤","Putih ⚪","Ungu 🟣","Hijau 🟢","Biru 🔵","Emas 🏅"]);
  const jembut   = pick(["Kriting 🌀","Lurus 📏","Ikal ✨","Botak 🎱","Lebat 🌳","Tipis 🍃","Pirang 💛","Merah 🔥","Bergelombang 🌊"]);
  const biasanya = pick(["Ngacengan 😏","Kendor 🥱","Tegang 💪","Loyo 😴","Bersemangat 🎉","Malu-malu 😳","Pemberani 🦁","Pemalu 🐰","Santai 😎"]);
  const level    = pick(["Pemula 🐣","Menengah 🚶","Advanced 🏃","Expert 🏆","Legendary 🐉","Mythic 🌟","God Tier ✨"]);

  let verdict = "🙂 Aman & Santai";
  let badge   = "🟢";
  if (level.includes("God") || level.includes("Legendary")) { verdict = "🔥 Status Langka";      badge = "🔥"; }
  else if (level.includes("Expert") || level.includes("Mythic")) { verdict = "😎 Di Atas Rata-rata"; badge = "😎"; }

  await new Promise((r) => setTimeout(r, 600));

  await conn.sendMessage(m.chat, {
    text:
      `> 🍆 *CEK KONTOL* 🍆\n>\n` +
      `> 👤 *Nama*: *${n}*\n>\n` +
      `> 📏 Panjang: *${panjang}*\n` +
      `> 🎨 Warna: *${warna}*\n` +
      `> 💈 Jembut: *${jembut}*\n` +
      `> 😏 Biasanya: *${biasanya}*\n` +
      `> 🏆 Level: *${level}*\n>\n` +
      `> ${badge} *Status*: ${verdict}\n>\n` +
      `> _${n}, ini benar benar hebatt 🥵_`,
    edit: key,
    mentions,
  });

  await m.react("🤣");
};

handler.command     = ["cekkontol"];
handler.category    = "fun";
handler.description = "Cek spesifikasi kontol seseorang";

export default handler;
