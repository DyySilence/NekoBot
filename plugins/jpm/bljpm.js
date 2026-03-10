/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/jpm/bljpm.js

let handler = async (m, { conn, text }) => {
  if (!text) {
    const a = await conn.groupFetchAllParticipating();
    const Data = Object.values(a);
    if (!Data.length) return m.reply("Tidak ada grup chat.");

    const rows = Data.map((u) => ({
      title: u.subject || "Unknown",
      description: `ID - ${u.id}`,
      id: `.bljpm ${u.id}|${u.subject || "Unknown"}`,
    }));

    return conn.sendMessage(
      m.chat,
      {
        buttons: [
          {
            buttonId: "action",
            buttonText: { displayText: "Pilih Grup" },
            type: 4,
            nativeFlowInfo: {
              name: "single_select",
              paramsJson: JSON.stringify({
                title: "Pilih Grup",
                sections: [{ title: "Pilih Salah Satu Grup Chat", rows }],
              }),
            },
          },
        ],
        headerType: 1,
        viewOnce: true,
        text: `\nPilih Salah Satu Grup Chat\n`,
      },
      { quoted: m }
    );
  }

  const [id, name] = text.split("|");
  if (!id || !name) return;

  if (global.db.settings.bljpm.includes(id))
    return m.reply(`Grup *${name}* sudah terdaftar dalam blacklist!`);

  global.db.settings.bljpm.push(id);
  return m.reply(`✅ Grup *${name}* berhasil ditambahkan ke blacklist Jpm.`);
};

handler.help = ["bljpm"];
handler.tags = ["jpm"];
handler.command = ["bljpm", "bl"];
handler.owner = true;

export default handler;
