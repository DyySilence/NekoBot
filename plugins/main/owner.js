/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn }) => {
  await m.react("👑");

  const ownerNum  = (global.owner || "").replace(/[^0-9]/g, "");
  const ownerName = global.namaOwner  || "DyySilence";
  const botName   = global.botName    || "NekoBot — DS";
  const website   = global.websiteUrl || "";
  const linkOwner = global.linkOwner  || "";
  const groupUrl  = global.groupUrl   || "";
  const channelJid = global.channelJid || "";

  const vcard =
    `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `FN:${ownerName}\n` +
    `ORG:${botName};\n` +
    `TEL;type=CELL;type=VOICE;waid=${ownerNum}:+${ownerNum}\n` +
    (website   ? `URL;type=Website:${website}\n`    : "") +
    (linkOwner ? `URL;type=Telegram:${linkOwner}\n` : "") +
    (groupUrl  ? `URL;type=Grup WA:${groupUrl}\n`   : "") +
    (channelJid ? `URL;type=Channel WA:https://whatsapp.com/channel/${channelJid.replace("@newsletter","")}\n` : "") +
    `X-WA-BIZ-DESCRIPTION:Developer & Owner ${botName}\n` +
    `X-WA-BIZ-NAME:${ownerName}\n` +
    `END:VCARD`;

  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: ownerName,
      contacts: [{ vcard }],
    },
  }, { quoted: m.fakeObj || m });
};

handler.command     = ["owner"];
handler.category    = "main";
handler.description = "Tampilkan kontak bisnis owner";

export default handler;