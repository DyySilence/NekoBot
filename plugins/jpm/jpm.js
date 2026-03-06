/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/jpm/jpm.js

let handler = async (m, { conn, text, cmd, mime }) => {
  if (!text)
    return m.reply(`*Contoh Penggunaan:*\n${cmd} pesannya\n\nBisa dengan foto juga.`);

  let mediaBuffer;
  if (/image/.test(mime)) {
    mediaBuffer = m.quoted ? await m.quoted.download() : await m.download();
  }

  const allGroups = await conn.groupFetchAllParticipating();
  const groupIds = Object.keys(allGroups);
  let successCount = 0, fail = 0, bl = 0;

  await m.reply(
    `🚀 Memproses ${mediaBuffer ? "Jpm Teks & Foto" : "Jpm Teks"}\n- Total Grup: ${groupIds.length}`
  );

  for (const id of groupIds) {
    if (global.db.settings.bljpm.includes(id)) { bl++; continue; }
    try {
      if (mediaBuffer) {
        await conn.sendMessage(id, { image: mediaBuffer, caption: text });
      } else {
        await conn.sendMessage(id, { text }, { quoted: global.qtext });
      }
      successCount++;
    } catch (e) {
      fail++;
      console.error(`Gagal kirim ke grup ${id}:`, e.message);
    }
    await sleep(global.jedaPushkontak);
  }

  await conn.sendMessage(
    m.chat,
    {
      text: `Jpm ${mediaBuffer ? "Teks & Foto" : "Teks"} selesai ✅\nBerhasil : ${successCount}\nGagal    : ${fail}\nBlacklist: ${bl}`,
    },
    { quoted: m }
  );
};

handler.help = ["jpm <pesan>"];
handler.tags = ["jpm"];
handler.command = ["jasher", "jpm"];
handler.owner = true;

export default handler;
