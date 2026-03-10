/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { tmpdir } from "os";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const handler = async (m, { conn, args }) => {
  const format = (args[0] || "vcf").toLowerCase();

  if (!["vcf", "csv"].includes(format)) {
    return m.reply(
      `❌ Format tidak valid!\n\n` +
      `📋 *Penggunaan:*\n` +
      `• \`${global.prefix}savekontak\` — export format VCF (direkomendasikan)\n` +
      `• \`${global.prefix}savekontak vcf\` — export format VCF\n` +
      `• \`${global.prefix}savekontak csv\` — export format CSV\n\n` +
      `💡 *VCF* bisa langsung diimpor ke kontak HP Android/iPhone.\n` +
      `💡 *CSV* bisa dibuka di Excel/Google Sheets.`
    );
  }

  await m.react("⏳");

  let metadata;
  try {
    metadata = await conn.groupMetadata(m.chat);
  } catch {
    return m.reply("❌ Gagal mengambil data grup. Coba lagi.");
  }

  const groupName    = metadata.subject || "Grup";
  const participants = metadata.participants || [];

  if (!participants.length) return m.reply("❌ Grup ini tidak memiliki anggota.");

  const members = [];
  for (const p of participants) {
    const jid    = p.jid || p.id || "";
    const number = jid.replace(/@.+/, "").replace(/[^0-9]/g, "");
    if (!number || number.length < 7) continue;

    const internationalNumber = number.startsWith("0") ? "62" + number.slice(1) : number;
    const isSuperAdmin        = p.admin === "superadmin";
    const isAdmin             = p.admin === "admin" || isSuperAdmin;

    const displayName = isSuperAdmin
      ? `[Owner] WA ${internationalNumber}`
      : isAdmin
        ? `[Admin] WA ${internationalNumber}`
        : `WA ${internationalNumber}`;

    members.push({ number: internationalNumber, displayName, isAdmin, isSuperAdmin });
  }

  if (!members.length) return m.reply("❌ Tidak ada nomor valid yang ditemukan di grup ini.");

  const safeGroupName = groupName.replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_") || "Grup";
  const timestamp     = Date.now();
  let fileContent     = "";
  let fileName        = "";
  let mimeType        = "";
  let caption         = "";

  if (format === "vcf") {
    fileContent = members.map((member) =>
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${member.displayName}`,
        `N:${member.displayName};;;;`,
        `TEL;type=CELL;type=VOICE;waid=${member.number}:+${member.number}`,
        "END:VCARD",
      ].join("\n")
    ).join("\n\n");

    fileName = `Kontak_${safeGroupName}_${timestamp}.vcf`;
    mimeType = "text/vcard";
    caption  =
      `📱 *EKSPOR KONTAK GRUP*\n\n` +
      `👥 Grup: *${groupName}*\n` +
      `📊 Total: *${members.length} kontak*\n` +
      `📁 Format: *VCF (vCard)*\n\n` +
      `✅ *Cara import ke HP:*\n` +
      `*Android:* Buka file → ketuk "Tambahkan semua ke kontak"\n` +
      `*iPhone:* Buka file → ketuk "Tambahkan semua kontak"\n\n` +
      `⚠️ Nama kontak menggunakan format default karena bot tidak bisa mengambil nama asli.`;
  } else {
    const rows = [
      ["Name", "Phone", "Role"],
      ...members.map((member) => [
        member.displayName,
        `+${member.number}`,
        member.isSuperAdmin ? "Owner" : member.isAdmin ? "Admin" : "Member",
      ]),
    ];

    fileContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    fileName = `Kontak_${safeGroupName}_${timestamp}.csv`;
    mimeType = "text/csv";
    caption  =
      `📊 *EKSPOR KONTAK GRUP (CSV)*\n\n` +
      `👥 Grup: *${groupName}*\n` +
      `📊 Total: *${members.length} kontak*\n` +
      `📁 Format: *CSV*\n\n` +
      `✅ *Cara pakai:*\n` +
      `• Buka di Google Contacts → Import\n` +
      `• Buka di Excel untuk lihat data\n\n` +
      `💡 Untuk import langsung ke HP, gunakan *${global.prefix}savekontak vcf*`;
  }

  const tempPath = path.join(tmpdir(), fileName);

  try {
    await writeFile(tempPath, fileContent, "utf8");

    await conn.sendMessage(
      m.chat,
      { document: { url: tempPath }, mimetype: mimeType, fileName, caption },
      { quoted: m.fakeObj || m }
    );

    await m.react("✅");
  } catch (err) {
    console.error("[savekontak] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal membuat file: ${err.message}`);
  } finally {
    try {
      if (existsSync(tempPath)) await unlink(tempPath);
    } catch {}
  }
};

handler.command     = ["savekontak"];
handler.category    = "owner";
handler.description = "Ekspor semua nomor anggota grup ke file VCF/CSV";
handler.owner       = true;
handler.group       = true;

export default handler;
