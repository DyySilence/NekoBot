import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const pluginDir  = path.resolve(__dirname, "..");

function scanAllFiles(dir, base = dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(scanAllFiles(full, base));
    } else if (item.isFile() && item.name.endsWith(".js")) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

const handler = async (m, { conn, args }) => {
  if (!args[0]) {
    const allFiles = scanAllFiles(pluginDir);

    const grouped = {};
    for (const f of allFiles) {
      const parts  = f.split(path.sep);
      const folder = parts.length > 1 ? parts[0] : ".";
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(parts[parts.length - 1]);
    }

    const folders = Object.keys(grouped).sort();
    const lines   = [];
    for (const folder of folders) {
      lines.push(`📂 *${folder === "." ? "root" : folder}*`);
      for (const f of grouped[folder].sort()) lines.push(`  ├ ${f}`);
    }

    return m.reply(
      `╭━━『 *GET PLUGIN* 』━━╮\n` +
      `│ 📄 Total : ${allFiles.length} file\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      lines.join("\n") + "\n\n" +
      `*Cara pakai:*\n` +
      `• \`.getplugin folder/nama.js\`\n` +
      `• \`.getplugin nama.js\` _(cari otomatis)_\n\n` +
      `*Contoh:*\n` +
      `• \`.getplugin owner/addplugin.js\`\n` +
      `• \`.getplugin addplugin.js\``
    );
  }

  let target   = args[0].trim().replace(/\\/g, "/");
  let filePath = null;

  const directPath = path.join(pluginDir, target);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    filePath = directPath;
  }

  if (!filePath) {
    const baseName = path.basename(target);
    const allFiles = scanAllFiles(pluginDir);
    const found    = allFiles.find(f => path.basename(f) === baseName);
    if (found) filePath = path.join(pluginDir, found);
  }

  if (!filePath) {
    return m.reply(
      `❌ Plugin *${target}* tidak ditemukan!\n\n` +
      `Ketik \`.getplugin\` tanpa argumen untuk lihat daftar lengkap.`
    );
  }

  let code;
  try {
    code = fs.readFileSync(filePath, "utf-8");
  } catch {
    return m.reply("❌ Gagal baca file plugin!");
  }

  const relPath  = path.relative(pluginDir, filePath);
  const fileName = path.basename(filePath);
  const size     = Buffer.byteLength(code, "utf-8");

  await conn.sendMessage(
    m.chat,
    {
      document: Buffer.from(code, "utf-8"),
      fileName: fileName,
      mimetype: "application/javascript",
      caption:
        `📄 *${fileName}*\n` +
        `📂 Path : plugins/${relPath.replace(/\\/g, "/")}\n` +
        `📝 Size : ${size} bytes`,
    },
    { quoted: m.fakeObj || m }
  );
};

handler.command     = ["getplugin"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Ambil / download file plugin dari bot";

export default handler;