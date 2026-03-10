/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/converter/tourl.js
import { generateWAMessageFromContent } from "baileys";

let handler = async (m, { conn, mime }) => {
  if (!/image/.test(mime))
    return m.reply(`*ex:* .tourl dengan kirim atau reply image`);

  try {
    const media = m.quoted ? await m.quoted.download() : await m.download();
    const directLink = await global.uploadImageBuffer(media);

    if (!directLink) return m.reply("❌ Gagal mengupload gambar.");

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: `✅ Foto berhasil diupload!\n\nURL: ${directLink}` },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: `{"display_text":"Copy URL","copy_code":"${directLink}"}`,
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
  } catch (err) {
    console.error("Tourl Error:", err);
    m.reply("Terjadi kesalahan saat mengubah media menjadi URL.");
  }
};

handler.help = ["tourl <reply/kirim image>"];
handler.tags = ["tools"];
handler.command = ["tourl"];

export default handler;
