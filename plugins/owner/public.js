
/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

// plugins/owner/public.js

let handler = async (m) => {
  if (global.db.settings.mode === "public") {
    return m.reply("ℹ️ Bot sudah dalam mode *public*.");
  }

  global.db.settings.mode = "public";
  return m.reply(
    "✅ Mode *public* diaktifkan.\n" +
    "Bot merespon pesan dari *semua pengguna*."
  );
};

handler.help = ["public"];
handler.tags = ["owner"];
handler.command = ["public"];
handler.owner = true;

export default handler;
