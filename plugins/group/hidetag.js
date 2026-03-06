/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
 
const handler = async (m, { conn, text, command, participants }) => {
  const mentions = participants.length
    ? participants.map((p) => p.jid || p.id || p.lid || "").filter(Boolean)
    : (await conn.groupMetadata(m.chat)).participants.map((p) => p.id || p.jid || "").filter(Boolean);

  if (!m.quoted) {
    const message = text?.trim() || "Tag dari admin";
    await conn.sendMessage(m.chat, {
      text: `📢\n\n📝 *Pesan:* ${message}\n\n> 👤 *Dari:* ${m.pushName || "Admin"}`,
      mentions,
    });
    return m.react("✅");
  }

  const qType = m.quoted.mtype;
  const qMsg  = m.quoted;

  if (qType === "pollCreationMessageV3" || qType === "pollCreationMessage") {
    const optionNames = (qMsg.options || []).map((opt) => opt.optionName || "");
    let selectableCount = qMsg.selectableOptionsCount || 1;
    if (selectableCount === 0) selectableCount = 1;
    await conn.sendMessage(m.chat, {
      poll: { name: qMsg.name || "Poll", values: optionNames, selectableOptionsCount: selectableCount },
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "contactMessage") {
    await conn.sendMessage(m.chat, {
      contacts: { displayName: qMsg.displayName, contacts: [{ vcard: qMsg.vcard }] },
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "locationMessage") {
    await conn.sendMessage(m.chat, {
      location: {
        degreesLatitude:  qMsg.degreesLatitude,
        degreesLongitude: qMsg.degreesLongitude,
        name:             qMsg.name,
        address:          qMsg.address,
        jpegThumbnail:    qMsg.jpegThumbnail,
      },
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "imageMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, {
      image:   media,
      caption: text?.trim() || qMsg.caption || "",
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "videoMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, {
      video:   media,
      caption: text?.trim() || qMsg.caption || "",
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "stickerMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, { sticker: media, mentions });
    return m.react("✅");
  }

  if (qType === "audioMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, {
      audio:    media,
      mimetype: "audio/mp4",
      ptt:      qMsg.ptt || false,
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "documentMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, {
      document: media,
      mimetype: qMsg.mimetype,
      fileName: qMsg.fileName,
      mentions,
    });
    return m.react("✅");
  }

  if (
    qType === "conversation" ||
    qType === "extendedTextMessage" ||
    qMsg.text ||
    qMsg.body
  ) {
    const message = text?.trim() || qMsg.text || qMsg.body || "Tag dari admin";
    const meta = await conn.groupMetadata(m.chat);
    const groupName = meta?.subject || "Group";
    await conn.sendMessage(m.chat, {
      text: `> 📢 *PESAN GROUP*\n\n📝 *Pesan:* ${message}\n> 👤 *Dari:* ${m.pushName || "Admin"}`,
      mentions,
    });
    return m.react("✅");
  }

  await m.react("⚠️");
  await m.reply(`❌ Tipe pesan tidak didukung untuk hidetag! (${qType})`);
};

handler.command     = ["hidetag", "h", "totag"];
handler.category    = "group";
handler.description = "Tag semua member tersembunyi (admin only)";
handler.group       = true;
handler.admin       = true;

export default handler;