/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveTarget } from "../../lib/serialize.js";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getKeterangan = (pct) => {
  if (pct < 20) return "Sangat Straight 🚹";
  if (pct < 40) return "Cenderung Straight 👨";
  if (pct < 60) return "Bisexual ⚧️";
  if (pct < 80) return "Cenderung Gay 👨‍❤️‍👨";
  return "Sangat Gay 🌈";
};

const handler = async (m, { conn, args, participants }) => {
  const { n, mentions } = resolveTarget(m, args, participants);

  await m.react("🏳️‍🌈");

  const steps = [
    `> 🏳️‍🌈 *CEK GAY*\n>\n> ⏳ Memulai scan...\n>\n> ▱▱▱▱▱▱▱▱▱▱ 0%`,
    `> 🏳️‍🌈 *CEK GAY*\n>\n> 🔍 Mendeteksi target...\n>\n> ▰▰▰▱▱▱▱▱▱▱ 30%`,
    `> 🏳️‍🌈 *CEK GAY*\n>\n> 🌈 Menganalisa tingkat kegayanan...\n>\n> ▰▰▰▰▰▰▱▱▱▱ 60%`,
    `> 🏳️‍🌈 *CEK GAY*\n>\n> ✅ Finalisasi hasil...\n>\n> ▰▰▰▰▰▰▰▰▰▰ 100%`,
  ];

  const sent = await conn.sendMessage(m.chat, { text: steps[0] }, { quoted: m.fakeObj || m });
  const key  = sent.key;

  for (let i = 1; i < steps.length; i++) {
    await new Promise((r) => setTimeout(r, 900));
    await conn.sendMessage(m.chat, { text: steps[i], edit: key });
  }

  const pct        = rand(0, 100);
  const keterangan = getKeterangan(pct);
  const filled     = Math.round((pct / 100) * 20);
  const bar        = "█".repeat(filled) + "░".repeat(20 - filled);

  await new Promise((r) => setTimeout(r, 600));

  await conn.sendMessage(m.chat, {
    text:
      `> 🏳️‍🌈 *CEK GAY* 🏳️‍🌈\n>\n` +
      `> 👤 *Nama*: *${n}*\n>\n` +
      `> 📊 *Persentase Gay*: *${pct}%* ✨\n>\n` +
      `> [${bar}] ${pct}%\n>\n` +
      `> 📝 *Keterangan*: *${keterangan}*\n>\n` +
      `> 🌈 _kabuuurr ${n} gaayyyyy_`,
    edit: key,
    mentions,
  });

  await m.react("🤣");
};

handler.command     = ["cekgay"];
handler.category    = "fun";
handler.description = "Cek tingkat kegayanan seseorang";

export default handler;
