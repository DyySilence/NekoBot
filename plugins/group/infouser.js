/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import moment from "moment-timezone";
import { getParticipantJid, resolveAnyLidToJid } from "../../lib/serialize.js";

const handler = async (m, { conn, args }) => {
  let targetJid = null;
  let targetParticipant = null;
  let groupParticipants = [];

  if (m.isGroup) {
    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
    if (groupMetadata) groupParticipants = groupMetadata.participants || [];
  }

  if (m.mentionedJid?.length) {
    const mentionedJid = m.mentionedJid[0];
    if (groupParticipants.length) {
      targetParticipant = groupParticipants.find((p) => {
        const pNum = (p.jid || p.id || "").replace(/[^0-9]/g, "");
        const lNum = (p.lid || "").replace(/[^0-9]/g, "");
        const mNum = mentionedJid.replace(/[^0-9]/g, "");
        return mNum === pNum || mNum === lNum;
      });
      targetJid = targetParticipant
        ? getParticipantJid(targetParticipant)
        : resolveAnyLidToJid(mentionedJid, groupParticipants);
    } else {
      targetJid = mentionedJid;
    }
  } else if (m.quoted?.sender) {
    const qs = m.quoted.sender;
    if (groupParticipants.length) {
      targetParticipant = groupParticipants.find((p) => {
        return qs.replace(/[^0-9]/g, "") === (p.jid || p.id || "").replace(/[^0-9]/g, "");
      });
      targetJid = targetParticipant
        ? getParticipantJid(targetParticipant)
        : resolveAnyLidToJid(qs, groupParticipants);
    } else {
      targetJid = qs;
    }
  } else if (args[0]) {
    const number = args[0].replace(/[^0-9]/g, "");
    if (number.length < 10)
      return m.reply("❌ Nomor tidak valid!\n\nContoh: .infouser @user atau .infouser 628123456789");
    if (groupParticipants.length) {
      targetParticipant = groupParticipants.find((p) => {
        const pNum = (p.jid || p.id || "").replace(/[^0-9]/g, "");
        const lNum = (p.lid || "").replace(/[^0-9]/g, "");
        return pNum === number || lNum === number || pNum.includes(number) || number.includes(pNum);
      });
      targetJid = targetParticipant ? getParticipantJid(targetParticipant) : number + "@s.whatsapp.net";
    } else {
      targetJid = number + "@s.whatsapp.net";
    }
  } else {
    return m.reply(
      "❌ Tag user atau masukkan nomor!\n\n*Cara pakai:*\n• .infouser @user\n• .infouser 628123456789\n• Reply pesan dengan .infouser"
    );
  }

  if (!targetJid || targetJid.endsWith("@lid"))
    return m.reply("❌ Gagal mendapatkan nomor user!\n\nCoba: .infouser 628xxx");

  targetJid = targetJid.split(":")[0];
  if (!targetJid.includes("@")) targetJid += "@s.whatsapp.net";

  const targetNumber = targetJid.split("@")[0];

  let info = {
    status: "Hey there! I am using WhatsApp",
    statusTimestamp: null,
    picture: "https://i.ibb.co/3dQ5pq7/default-avatar.png",
    isBusiness: false,
    businessProfile: null,
    verifiedName: null,
    notify: null,
  };

  try {
    const [exists] = await conn.onWhatsApp(targetJid);
    if (!exists?.exists)
      return m.reply(`❌ Nomor *${targetNumber}* tidak terdaftar di WhatsApp!`);
    info.verifiedName = exists.verifiedName || null;
    info.isBusiness   = exists.status === "business";
    if (info.isBusiness && exists.businessInfo) {
      const bp = exists.businessInfo;
      info.businessProfile = {
        description:   bp.description    || "Tidak ada deskripsi",
        category:      bp.category       || "Tidak ada kategori",
        email:         bp.email          || null,
        website:       bp.website?.length ? bp.website.join(", ") : null,
        address:       bp.address        || null,
        businessHours: bp.business_hours || null,
        catalogStatus: bp.catalog_status || null,
      };
    }
  } catch (err) {
    return m.reply(`❌ Gagal mengecek nomor!\n\nError: ${err.message}`);
  }

  try { info.picture = await conn.profilePictureUrl(targetJid, "image") || info.picture; } catch {}

  try {
    const status = await conn.fetchStatus(targetJid).catch(() => null);
    if (status?.status) {
      info.status = status.status;
      info.statusTimestamp = status.setAt
        ? moment(status.setAt * 1000).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm")
        : null;
    }
  } catch {}

  if (m.isGroup && targetParticipant)
    info.notify = targetParticipant.notify || targetParticipant.name || targetParticipant.verifiedName || null;


  let msg = `╭━━『 *WHATSAPP INFO* 』━━╮\n\n`;
  msg += `┌─❖ *INFORMASI AKUN*\n│\n`;
  msg += `├ 📱 *Nomor:* ${targetNumber}\n`;
  if (info.verifiedName) msg += `├ ✅ *Verified:* ${info.verifiedName}\n`;
  if (info.notify)       msg += `├ 👤 *Nama:* ${info.notify}\n`;
  msg += `├ 📝 *Bio:* ${info.status}\n`;
  if (info.statusTimestamp) msg += `├ 🕐 *Bio Updated:* ${info.statusTimestamp}\n`;
  msg += `├ 🏢 *Bisnis:* ${info.isBusiness ? "Ya ✅" : "Tidak ❌"}\n│\n`;

  if (info.isBusiness && info.businessProfile) {
    const bp = info.businessProfile;
    msg += `├─❖ *INFORMASI BISNIS*\n│\n`;
    msg += `├ 📋 *Deskripsi:*\n│   ${bp.description.split("\n").join("\n│   ")}\n│\n`;
    msg += `├ 🏷️ *Kategori:* ${bp.category}\n`;
    if (bp.email)         msg += `├ 📧 *Email:* ${bp.email}\n`;
    if (bp.website)       msg += `├ 🌐 *Website:* ${bp.website}\n`;
    if (bp.address)       msg += `├ 📍 *Alamat:* ${bp.address}\n`;
    if (bp.catalogStatus) msg += `├ 🛍️ *Katalog:* ${bp.catalogStatus}\n`;

    if (bp.businessHours?.business_config) {
      msg += `│\n├─❖ *JAM OPERASIONAL*\n│\n`;
      const days = { sun:"Minggu",mon:"Senin",tue:"Selasa",wed:"Rabu",thu:"Kamis",fri:"Jumat",sat:"Sabtu" };
      for (const day of bp.businessHours.business_config) {
        const name = days[day.day_of_week] || day.day_of_week;
        if (day.mode === "open_24h")  msg += `├ ${name}: Buka 24 Jam 🌙\n`;
        else if (day.mode === "closed") msg += `├ ${name}: Tutup ❌\n`;
        else if (day.mode === "specific" && day.hours) {
          const hrs = day.hours.map(h =>
            `${String(h.open_minute||0).padStart(2,"0")}:${String(h.open_second||0).padStart(2,"0")} - ` +
            `${String(h.close_minute||0).padStart(2,"0")}:${String(h.close_second||0).padStart(2,"0")}`
          ).join(", ");
          msg += `├ ${name}: ${hrs} ⏰\n`;
        }
      }
      if (bp.businessHours.timezone) msg += `│\n├ 🌍 *Timezone:* ${bp.businessHours.timezone}\n`;
    }
    msg += `│\n`;
  }

  msg += `└─────────────────\n`;
  msg += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
  msg += `📅 *Dicek:* ${moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss")}`;

  try {
    await conn.sendMessage(m.chat, {
      image: { url: info.picture },
      caption: msg,
      mentions: [targetJid],
    }, { quoted: m });
  } catch {
    await m.reply(msg);
  }
};

handler.command     = ["infouser", "getpp"];
handler.category    = "group";
handler.description = " informasi profil WhatsApp user";

export default handler;
