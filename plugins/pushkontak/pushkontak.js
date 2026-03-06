/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/pushkontak/pushkontak.js

let handler = async (m, { conn, text, cmd }) => {
  if (!text) return m.reply(`*Contoh:* ${cmd} isi pesan`);

  global.textpushkontak = text;

  const groups = await conn.groupFetchAllParticipating();
  if (!groups || !Object.keys(groups).length)
    return m.reply("❌ Bot tidak tergabung di grup manapun.");

  global.dataAllGrup = groups;

  const rows = Object.values(groups).map((g) => ({
    title: g.subject || "Tanpa Nama",
    description: `👥 ${g.participants.length} member`,
    id: `.pushkontak-response ${g.id}`,
  }));

  await conn.sendMessage(
    m.chat,
    {
      text: `📢 *PUSH KONTAK*\n\nSilahkan pilih grup target:`,
      viewOnce: true,
      buttons: [
        {
          buttonId: "select_gc",
          buttonText: { displayText: "📂 Pilih Grup" },
          type: 4,
          nativeFlowInfo: {
            name: "single_select",
            paramsJson: JSON.stringify({
              title: "Daftar Grup",
              sections: [{ title: "Pilih Target Grup", rows }],
            }),
          },
        },
      ],
      headerType: 1,
    },
    { quoted: m }
  );
};

handler.help = ["pushkontak <pesan>"];
handler.tags = ["pushkontak"];
handler.command = ["pushkontak", "puskontak"];
handler.owner = true;

export default handler;
