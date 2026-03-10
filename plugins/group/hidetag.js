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
    const optionNames       = (qMsg.options || []).map((opt) => opt.optionName || "");
    let selectableCount     = qMsg.selectableOptionsCount || 1;
    if (selectableCount === 0) selectableCount = 1;
    await conn.sendMessage(m.chat, {
      poll: { name: qMsg.name || "Poll", values: optionNames, selectableOptionsCount: selectableCount },
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "pollResultSnapshotMessage") {
    const results   = qMsg.pollResults || qMsg.results || {};
    const pollName  = qMsg.name || results.name || "Hasil Poll";
    const options   = results.pollOptions || qMsg.pollOptions || [];
    let resultText  = `📊 *${pollName}*\n\n`;
    for (const opt of options) {
      const name  = opt.optionName || opt.name || "-";
      const count = opt.localCount ?? opt.count ?? 0;
      resultText += `• ${name}: ${count} suara\n`;
    }
    await conn.sendMessage(m.chat, { text: resultText.trim(), mentions });
    return m.react("✅");
  }

  if (qType === "reactionMessage") {
    const emoji   = qMsg.text || qMsg.reaction || "👍";
    const msgText = text?.trim() || `Reaksi: ${emoji}`;
    await conn.sendMessage(m.chat, { text: msgText, mentions });
    return m.react("✅");
  }

  if (qType === "contactMessage") {
    await conn.sendMessage(m.chat, {
      contacts: { displayName: qMsg.displayName, contacts: [{ vcard: qMsg.vcard }] },
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "contactsArrayMessage") {
    const contacts = (qMsg.contacts || []).map((c) => ({ vcard: c.vcard }));
    await conn.sendMessage(m.chat, {
      contacts: { displayName: qMsg.displayName || "Kontak", contacts },
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

  if (qType === "liveLocationMessage") {
    await conn.sendMessage(m.chat, {
      location: {
        degreesLatitude:  qMsg.degreesLatitude,
        degreesLongitude: qMsg.degreesLongitude,
        name:             qMsg.caption || "Live Location",
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

  if (qType === "documentMessage" || qType === "documentWithCaptionMessage") {
    const media = await qMsg.download();
    await conn.sendMessage(m.chat, {
      document: media,
      mimetype: qMsg.mimetype || "application/octet-stream",
      fileName: qMsg.fileName || "file",
      caption:  text?.trim() || qMsg.caption || "",
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "buttonsMessage" || qType === "templateMessage" || qType === "listMessage") {
    const msgBody = qMsg.contentText || qMsg.text || qMsg.body || qMsg.description || "";
    const message = text?.trim() || msgBody || "Tag dari admin";
    await conn.sendMessage(m.chat, {
      text: `📢\n\n${message}`,
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "groupStatusMentionMessage") {
    const message = text?.trim() || "Tag dari admin";
    await conn.sendMessage(m.chat, {
      text: `📢\n\n${message}`,
      mentions,
    });
    return m.react("✅");
  }

  if (qType === "viewOnceMessage" || qType === "viewOnceMessageV2" || qType === "viewOnceMessageV2Extension") {
    try {
      const inner     = qMsg.message?.imageMessage || qMsg.message?.videoMessage;
      const innerType = qMsg.message?.imageMessage ? "imageMessage" : "videoMessage";
      if (inner) {
        const media = await qMsg.download();
        if (innerType === "imageMessage") {
          await conn.sendMessage(m.chat, {
            image:   media,
            caption: text?.trim() || inner.caption || "",
            mentions,
          });
        } else {
          await conn.sendMessage(m.chat, {
            video:   media,
            caption: text?.trim() || inner.caption || "",
            mentions,
          });
        }
        return m.react("✅");
      }
    } catch {}
    await conn.sendMessage(m.chat, {
      text: `📢\n\n${text?.trim() || "Tag dari admin"}`,
      mentions,
    });
    return m.react("✅");
  }

  if (
    qType === "conversation"       ||
    qType === "extendedTextMessage" ||
    qType === "ephemeralMessage"    ||
    qMsg.text ||
    qMsg.body
  ) {
    const message = text?.trim() || qMsg.text || qMsg.body || "Tag dari admin";
    await conn.sendMessage(m.chat, {
      text: `> 📢 *PESAN GROUP*\n\n📝 *Pesan:* ${message}\n> 👤 *Dari:* ${m.pushName || "Admin"}`,
      mentions,
    });
    return m.react("✅");
  }

  const msgText = text?.trim() || qMsg.text || qMsg.body || qMsg.caption || "";
  if (msgText) {
    await conn.sendMessage(m.chat, { text: `📢\n\n${msgText}`, mentions });
    return m.react("✅");
  }

  await conn.sendMessage(m.chat, {
    text: `📢\n\n${text?.trim() || "Tag dari admin"}`,
    mentions,
  });
  return m.react("✅");
};

handler.command     = ["hidetag", "h", "totag"];
handler.category    = "group";
handler.description = "Tag semua member tersembunyi (admin only)";
handler.group       = true;
handler.admin       = true;

export default handler;
