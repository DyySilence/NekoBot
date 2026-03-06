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
      `> 😈 *PERKOSA*\n>\n` +
      `> 💡 *Cara pakai:*\n` +
      `> \`${global.prefix}perkosa @user\`\n` +
      `> \`${global.prefix}perkosa (reply chat)\`\n` +
      `> \`${global.prefix}perkosa Mikasa\``
    );
  }

  await m.react("😈");

  const text =
    `> GW BENAR-BENAR PENGEN JILAT KAKI 👣 *${n}*, GW PENGEN BANGET MENJILAT 👅 SETIAP BAGIAN KAKINYA 🦵 SAMPAI AIR LIUR GW BERCUCURAN 💦 KAYAK AIR KERINGAT 💧 LALU NGENTOD DENGAN NYA 🍆 SETIAP HARI ☀️ SAMPAI TUBUH KITA MATI RASA 😵💫, YA TUHAN 🙏 GW INGIN MEMBUAT ANAK ANAK 👶 DENGAN *${n}* SEBANYAK SATU TIM SEPAK BOLA ⚽ DAN MEMBUAT SATU TIM SEPAK BOLA LAINNYA ⚽⚽ UNTUK MELAWAN ANAK-ANAK TIM SEPAK BOLA PERTAMA GW YANG GW BUAT SAMA *${n}* 👨‍👩‍👦‍👦.\n` +
    `> GW PENGEN MASUK KE SETIAP LUBANG TUBUHNYA 🕳️, MAU ITU LUBANG HIDUNG 👃, LUBANG MATA 👁️ MAUPUN LUBANG BOOL 🍑, KEMUDIAN GW AKAN JADI MANUSIA YANG TIDAK BISA HIDUP 💀 KALO GW GA ENTOD 🍆 SETIAP HARI 📅.\n` +
    `> GW MAU MENJELAJAHI 🗺️ SETIAP INCI 📏 TUBUHNYA 💃, DARI UJUNG RAMBUT 💇‍♀️ SAMPAI UJUNG KAKI 🦶. GW MAU RASAIN 😋 SETIAP TEKSTUR KULITNYA 🫱, SETIAP TETES KERINGATNYA 💧, SAMPAI GW MABUK KEPAYANG 🥴 SAMA *${n}*.\n` +
    `> INI BUKAN NAFSU SESAAT 🚫, INI ADALAH KEGILAAN ABADI 😤🔥 YANG GA AKAN PERNAH PADAM 🌋. *${n}* ADALAH SEGALANYA 👑 BUAT GW, DAN GW GA PEDULI 🙉 SAMA APAPUN YANG ORANG BILANG 🗣️!!!`;

  await conn.sendMessage(m.chat, { text, mentions }, { quoted: m.fakeObj || m });
  await m.react("🔥");
};

handler.command     = ["perkosa"];
handler.category    = "fun";
handler.description = "Copypasta perkosa (18+)";
handler.group       = true;

export default handler;
