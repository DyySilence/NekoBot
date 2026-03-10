/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/pushkontak/setjedapush.js
import fs from "fs";

let handler = async (m, { args, cmd }) => {
  if (!args[0])
    return m.reply(
      `Masukkan jeda push!\n\nContoh: ${cmd} 5000\n1000 = 1 detik\n\nJeda saat ini: ${
        global.jedaPushkontak.toString().replace(/0+$/, "") || "0"
      } detik`
    );

  const delay = parseInt(args[0]);
  if (isNaN(delay) || delay < 0)
    return m.reply("Jeda harus berupa angka (ms) yang valid!");

  try {
    const settingPath = "./config.js";
    const file = fs.readFileSync(settingPath, "utf8");
    const updated = file.replace(
      /global\.jedaPushkontak\s*=\s*\d+/,
      `global.jedaPushkontak = ${delay}`
    );
    fs.writeFileSync(settingPath, updated);
    global.jedaPushkontak = delay;
  } catch (err) {
    console.error(err);
    return m.reply("Gagal mengubah jeda push ❌");
  }

  return m.reply(`Jeda pushkontak berhasil diubah menjadi *${delay}ms* ✅`);
};

handler.help = ["setjedapush <ms>"];
handler.tags = ["pushkontak"];
handler.command = ["setjeda", "setjedapush"];
handler.owner = true;

export default handler;
