/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/jpm/delbljpm.js
import { generateWAMessageFromContent } from "baileys";

let handler = async (m, { conn }) => {
  if (global.db.settings.bljpm.length < 1)
    return m.reply("Tidak ada data blacklist grup.");

  const groups = await conn.groupFetchAllParticipating();
  const Data = Object.values(groups);

  const rows = [
    { title: "🗑️ Hapus Semua", description: "Hapus semua grup dari blacklist", id: `.delbl-response all` },
    ...global.db.settings.bljpm.map((id) => {
      const grup = Data.find((g) => g.id === id);
      const name = grup?.subject || "Unknown";
      return { title: name, description: `ID Grup - ${id}`, id: `.delbl-response ${id}|${name}` };
    }),
  ];

  const msg = await generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: `Pilih Grup Untuk Dihapus Dari Blacklist\n\nTotal Blacklist: ${global.db.settings.bljpm.length}`,
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "Daftar Blacklist Grup",
                    sections: [{ title: "Blacklist Terdaftar", rows }],
                  }),
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

handler.help = ["delbljpm"];
handler.tags = ["jpm"];
handler.command = ["delbl", "delbljpm"];
handler.owner = true;

export default handler;
