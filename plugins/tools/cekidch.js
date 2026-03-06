/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/tools/cekidch.js
import { generateWAMessageFromContent } from "baileys";

let handler = async (m, { conn, text, cmd }) => {
  if (!text) return m.reply(`*Contoh:* ${cmd} link/id channel`);
  if (!text.includes("https://whatsapp.com/channel/") && !text.includes("@newsletter"))
    return m.reply("Link atau id channel tidak valid.");

  let result = text.trim(), opsi = "jid";
  if (text.includes("https://whatsapp.com/channel/")) {
    result = text.split("https://whatsapp.com/channel/")[1];
    opsi = "invite";
  }

  const res = await conn.newsletterMetadata(opsi, result);
  const teks =
    `*Channel Information 🌍*\n\n` +
    `- Nama: ${res.name}\n` +
    `- Total Pengikut: ${toRupiah(res.subscribers)}\n` +
    `- ID: ${res.id}\n` +
    `- Link: https://whatsapp.com/channel/${res.invite}`;

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: teks },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({ display_text: "Copy Channel ID", copy_code: res.id }),
                },
              ],
            },
          },
        },
      },
    },
    { userJid: m.sender, quoted: m }
  );

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ["cekidch <link/id channel>"];
handler.tags = ["tools"];
handler.command = ["idch", "cekidch"];

export default handler;
