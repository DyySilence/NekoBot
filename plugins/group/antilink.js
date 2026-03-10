/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { args }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const g   = global.db.groups[m.chat] ?? {};
  if (!g.antilinkCustom) g.antilinkCustom = [];

  const sub   = args[0]?.toLowerCase();
  const input = args.slice(1).join(" ").trim().toLowerCase();

  if (!sub) {
    return m.reply(
      `ℹ️ *Antilink*\n` +
      `WA Group : *${g.antilink ? "ON ✅" : "OFF ❌"}*\n` +
      `Semua URL : *${g.antilinkAll ? "ON ✅" : "OFF ❌"}*\n` +
      `Custom    : *${g.antilinkCustom_enabled ? "ON ✅" : "OFF ❌"}* (${g.antilinkCustom.length} pola)\n\n` +
      `Gunakan:\n` +
      `• .antilink on — blokir link grup WA\n` +
      `• .antilink off — matikan antilink WA\n` +
      `• .antilink all — toggle blokir semua URL\n` +
      `• .antilink custom — toggle blokir link custom\n` +
      `• .antilink add <url> — tambah link custom\n` +
      `• .antilink del <nomor> — hapus link custom\n` +
      `• .antilink list — lihat daftar link custom\n` +
      `• .antilink reset — hapus semua link custom`
    );
  }

  if (sub === "on") {
    g.antilink = true;
    global.db.groups[m.chat] = g;
    return m.reply("> ✅ *Antilink grup WA diaktifkan!*");
  }

  if (sub === "off") {
    g.antilink = false;
    global.db.groups[m.chat] = g;
    return m.reply("> ✅ *Antilink grup WA dinonaktifkan!*");
  }

  if (sub === "all") {
    g.antilinkAll = !g.antilinkAll;
    global.db.groups[m.chat] = g;
    return m.reply(`> ✅ *Antilink semua URL ${g.antilinkAll ? "diaktifkan" : "dinonaktifkan"}!*`);
  }

  if (sub === "custom") {
    if (!g.antilinkCustom.length) return m.reply("❌ Belum ada link custom!\nTambah dulu: .antilink add <url>");
    g.antilinkCustom_enabled = !g.antilinkCustom_enabled;
    global.db.groups[m.chat] = g;
    return m.reply(`> ✅ *Antilink custom ${g.antilinkCustom_enabled ? "diaktifkan" : "dinonaktifkan"}!*\n> ${g.antilinkCustom.length} pola aktif.`);
  }

  if (sub === "add") {
    if (!input) return m.reply("❌ Masukkan URL!\nContoh: .antilink add tiktok.com");
    if (g.antilinkCustom.length >= 50) return m.reply("❌ Maksimal 50 link custom per grup!");

    const normalized = input.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].trim();
    if (!normalized) return m.reply("❌ Format URL tidak valid!");
    if (g.antilinkCustom.includes(normalized)) return m.reply(`⚠️ ${normalized} sudah ada di daftar!`);

    g.antilinkCustom.push(normalized);
    global.db.groups[m.chat] = g;
    return m.reply(
      `> ✅ *Berhasil ditambahkan!*\n> Pola: ${normalized}\n> Total: ${g.antilinkCustom.length}/50\n\n` +
      `${g.antilinkCustom_enabled ? "✅ Antilink custom aktif." : "⚠️ Aktifkan dulu: .antilink custom"}`
    );
  }

  if (sub === "del") {
    if (!g.antilinkCustom.length) return m.reply("❌ Daftar link custom kosong!");
    const idx = parseInt(args[1]) - 1;
    if (isNaN(idx) || idx < 0 || idx >= g.antilinkCustom.length)
      return m.reply("❌ Nomor tidak valid!\nLihat daftar: .antilink list");
    const removed = g.antilinkCustom.splice(idx, 1)[0];
    global.db.groups[m.chat] = g;
    return m.reply(`> ✅ *Berhasil hapus:* ${removed}\n> Sisa: ${g.antilinkCustom.length} link.`);
  }

  if (sub === "list") {
    if (!g.antilinkCustom.length) return m.reply("❌ Belum ada link custom.\nTambah: .antilink add <url>");
    return m.reply(
      `ℹ️ *Daftar Antilink Custom*\nStatus: *${g.antilinkCustom_enabled ? "ON ✅" : "OFF ❌"}*\n\n` +
      g.antilinkCustom.map((l, i) => `${i + 1}. ${l}`).join("\n")
    );
  }

  if (sub === "reset") {
    g.antilinkCustom         = [];
    g.antilinkCustom_enabled = false;
    global.db.groups[m.chat] = g;
    return m.reply("> ✅ *Semua link custom berhasil direset!*");
  }

  return m.reply("❌ Sub-command tidak dikenal!\nKetik .antilink untuk bantuan.");
};

handler.command     = ["antilink"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Antilink: on/off/all/custom/add/del/list/reset";

export default handler;
