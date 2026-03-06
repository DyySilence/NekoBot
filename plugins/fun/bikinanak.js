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
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

const handler = async (m, { conn, args, participants }) => {
  const { n, mentions, targetJid } = resolveTarget(m, args, participants);

  if (!targetJid && !args[0]) {
    return m.reply(
      `> 👶 *BIKIN ANAK*\n>\n` +
      `> 💡 *Cara pakai:*\n` +
      `> \`${global.prefix}bikinanak @user\`\n` +
      `> \`${global.prefix}bikinanak (reply chat)`
    );
  }

  const sent = await conn.sendMessage(m.chat, {
    text:
      `> ⚠️ *PERINGATAN KERAS!*\n>\n` +
      `> 🎯 Target: ${n}\n` +
      `> 🔥 Proses: Bikin Anak\n` +
      `> ⏰ Durasi: ~30 detik\n>\n` +
      `> 🔥 Memulai dalam 3 detik...`,
    mentions,
  }, { quoted: m.fakeObj || m });

  const key = sent.key;
  await delay(1000);

  const stages = [
    { label: "😏 *PROSES NGEWE*",        desc: "💭 Merayu...",                bar: "[░░░░░░░░░░░░░░░░░░░░]", pct: "0%"   },
    { label: "😘 *PROSES NGEWE*",        desc: "💋 Berciuman mesra...",        bar: "[████░░░░░░░░░░░░░░░░]", pct: "20%"  },
    { label: "🥵 *PROSES NGEWE*",        desc: "👙 Membuka pakaian...",        bar: "[████████░░░░░░░░░░░░]", pct: "40%"  },
    { label: "🔥 *PROSES GENJOT*",       desc: "👅 Foreplay intensif...",      bar: "[████████████░░░░░░░░]", pct: "60%"  },
    { label: "🍆💦 *PROSES CROOT*",      desc: "😫 Ahhh... Masuk dalam...",    bar: "[████████████████░░░░]", pct: "80%"  },
    { label: "💥💦💦 *PROSES BREEDING*", desc: "😵 CROOOTTTT!!! AHH SHITT...", bar: "[████████████████████]", pct: "95%"  },
    { label: "😌💕 *PROSES MANDI*",      desc: "🚬 Aftercare & pelukan...",    bar: "[████████████████████]", pct: "100%" },
  ];

  for (const s of stages) {
    await conn.sendMessage(m.chat, {
      text:
        `> ${s.label}\n>\n` +
        `> 🎯 ${n}\n` +
        `> ${s.desc}\n>\n` +
        `> ${s.bar}\n` +
        `> ⏳ ${s.pct}`,
      edit: key,
      mentions,
    });
    await delay(1000);
  }

  await delay(1000);

  const anakType  = ["Laki-laki", "Perempuan", "Kembar (Laki & Perempuan)"];
  const selected  = pick(anakType);
  const anakCount = selected.includes("Kembar") ? 2 : 1;
  const namaA     = ["Udin","Asep","Jajang","Dadang","Maman","Otong","Encep","Usep"];
  const namaB     = ["Ucup","Odoy","Bambang","Sukijan","Pardi","Bejo","Wawan","Jono"];
  const nama      = anakCount === 2 ? `${pick(namaA)} & ${pick(namaB)}` : pick(namaA);

  await conn.sendMessage(m.chat, {
    text:
      `> *NGEWE SUKSES* 🎉\n>\n` +
      `> 🎯 Pasangan: ${n}\n` +
      `> 👶 *HASIL NGEWE:*\n\n` +
      `> 👶 Anak: ${anakCount} orang\n` +
      `> 🎭 Jenis: ${selected}\n` +
      `> 📝 Nama: ${nama}\n` +
      `> 🧬 DNA: 50% You, 50% ${n}\n` +
      `> ━━━━━━━━━━━━━━━━━━━━\n>\n` +
      `> _👨‍👩‍👦 Selamat menjadi orang tua_`,
    edit: key,
    mentions,
  });

  await m.react("👶");
};

handler.command     = ["bikinanak"];
handler.category    = "fun";
handler.description = "Proses bikin anak dengan animasi (18+)";
handler.group       = true;

export default handler;
