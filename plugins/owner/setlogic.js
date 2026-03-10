/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn, text, args }) => {
  const subCmd = (args[0] || "").toLowerCase();

  if (!global.db.settings) global.db.settings = {};

  if (subCmd === "reset") {
    delete global.db.settings.nekoLogic;
    return m.reply(
      `Logic Neko direset ke default.\n\nNeko akan menggunakan persona bawaan.`
    );
  }

  if (subCmd === "view") {
    const current = global.db.settings.nekoLogic;
    if (!current) return m.reply("Belum ada custom logic. Neko menggunakan persona default.");
    return m.reply(`*Custom Logic Neko saat ini:*\n\n${current}`);
  }

  const logic = subCmd === "set" ? args.slice(1).join(" ").trim() : text.trim();

  if (!logic) {
    return m.reply(
      `*SETLOGIC NEKO*\n\n` +
      `Gunakan command ini untuk mengatur kepribadian/instruksi custom Neko AI.\n\n` +
      `*Format:*\n` +
      `.setlogic <instruksi>\n` +
      `.setlogic set <instruksi>\n\n` +
      `*Subcommand:*\n` +
      `.setlogic view — lihat logic saat ini\n` +
      `.setlogic reset — reset ke default\n\n` +
      `*Contoh:*\n` +
      `.setlogic Kamu adalah asisten bernama Luna, berbicara dengan gaya formal dan profesional. Selalu awali jawaban dengan salam.\n\n` +
      `*Tips:*\n` +
      `- Tulis instruksi sejelas mungkin\n` +
      `- Bisa tentukan nama, gaya bicara, larangan, dll\n` +
      `- Logic ini menggantikan seluruh kepribadian default Neko`
    );
  }

  global.db.settings.nekoLogic = logic;

  return m.reply(
    `*Custom Logic Neko berhasil disimpan!*\n\n` +
    `*Preview:*\n${logic.slice(0, 200)}${logic.length > 200 ? "..." : ""}\n\n` +
    `Neko sekarang akan mengikuti instruksi ini.\n` +
    `Ketik .setlogic reset untuk kembali ke default.`
  );
};

handler.command     = ["setlogic"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Set custom logic/persona untuk Neko AI";

export default handler;
