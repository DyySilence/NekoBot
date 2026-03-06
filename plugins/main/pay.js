/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { generateWAMessageFromContent, proto } from "baileys";

const handler = async (m, { conn }) => {
  await m.react("⏳");

  const dana  = global.dana  || "Tidak tersedia";
  const gopay = global.gopay || "Tidak tersedia";
  const bank  = global.bank  || "Tidak tersedia";
  const norek = global.norek || "Tidak tersedia";
  const atasNama = global.atasNama || global.namaOwner || "Owner";
  const qrisUrl  = global.qrisUrl  || global.thumbnail;

  const caption =
    `💳 *INFORMASI PEMBAYARAN*\n\n` +
    `Scan QRIS di atas atau pilih metode:\n\n` +
    `Tekan tombol di bawah untuk menyalin nomor.\n` +
    `> _Konfirmasi pembayaran ke owner setelah transfer._`;

  const buttons = [
    {
      name: "cta_copy",
      buttonParamsJson: JSON.stringify({
        display_text: `DANA`,
        copy_code: dana,
      }),
    },
    {
      name: "cta_copy",
      buttonParamsJson: JSON.stringify({
        display_text: `GoPay`,
        copy_code: gopay,
      }),
    },
    {
      name: "cta_copy",
      buttonParamsJson: JSON.stringify({
        display_text: `${bank} — ${norek}`,
        copy_code: norek,
      }),
    },
  ];

  try {
    const { prepareWAMessageMedia } = await import("baileys");
    let imageMsg = null;
    try {
      const media = await prepareWAMessageMedia(
        { image: { url: qrisUrl } },
        { upload: conn.waUploadToServer }
      );
      imageMsg = media?.imageMessage || null;
    } catch {}

    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              header: proto.Message.InteractiveMessage.Header.create({
                title: `💳 ${global.botName || "NekoBot"} — Payment`,
                hasMediaAttachment: !!imageMsg,
                imageMessage: imageMsg || undefined,
              }),
              body: proto.Message.InteractiveMessage.Body.create({
                text: caption,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: `${global.botName || "NekoBot"} • Tekan tombol untuk copy nomor`,
              }),
              nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons,
                }),
            }),
          },
        },
      }),
      { quoted: m.fakeObj || m }
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react("✅");
  } catch {
    try {
      await conn.sendMessage(
        m.chat,
        { image: { url: qrisUrl }, caption },
        { quoted: m.fakeObj || m }
      );
    } catch {
      await m.reply(caption);
    }
    await m.react("✅");
  }
};

handler.command     = ["pay", "payment"];
handler.category    = "main";
handler.description = "Tampilkan info pembayaran QRIS + DANA, GoPay, Bank";

export default handler;
