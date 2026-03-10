/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";
import { writeFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execPromise = promisify(exec);

function pickText(m, text) {
  let teks = (text || "").trim();
  if (m.quoted?.text) {
    const q = m.quoted.text.trim();
    if (q) teks = teks ? `${q} ${teks}` : q;
  } else if (m.quoted?.body) {
    const q = m.quoted.body.trim();
    if (q) teks = teks ? `${q} ${teks}` : q;
  }
  return teks.trim();
}

function getTargetInfo(m) {
  if (m.quoted?.sender) {
    return { jid: m.quoted.sender, pushName: m.quoted.pushName || "" };
  }
  return { jid: m.sender, pushName: m.pushName || "" };
}

function resolveJidForPP(rawJid) {
  if (!rawJid) return null;
  let jid = rawJid.split(":")[0];
  if (!jid.includes("@")) jid += "@s.whatsapp.net";
  if (jid.endsWith("@lid")) jid = jid.replace("@lid", "@s.whatsapp.net");
  return jid;
}

function getJakartaTime() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  });
}

async function getPPUrl(conn, rawJid) {
  const num = rawJid.replace(/@.*$/, "").replace(/[^0-9]/g, "");
  const candidates = [
    resolveJidForPP(rawJid),
    num ? num + "@s.whatsapp.net" : null,
    num ? num + "@c.us" : null,
  ].filter(Boolean);

  for (const jid of candidates) {
    for (const type of ["image", "preview"]) {
      try {
        const url = await conn.profilePictureUrl(jid, type);
        if (url) return url;
      } catch {}
    }
  }
  return null;
}

async function safeGetName(conn, jid, fallback) {
  try {
    if (conn && typeof conn.getName === "function") {
      const n = await conn.getName(jid);
      if (n?.trim()) return n.trim();
    }
  } catch {}
  return String(fallback || "").trim() || "User";
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const AVATAR_COLORS = [
  "#1a73e8","#6b3fa0","#c0392b","#16a085",
  "#d35400","#2980b9","#8e44ad","#27ae60",
];

async function generateQcImage(conn, rawJid, name, text) {
  const SIZE = 512;

  // layout constants — besar semua
  const MARGIN  = 24;          // margin dari tepi canvas
  const AV_R    = 52;          // radius avatar
  const AV_X    = MARGIN + AV_R;
  const AV_Y    = SIZE / 2;
  const GAP     = 16;          // jarak avatar ke bubble
  const PAD_X   = 20;
  const PAD_TOP = 18;
  const PAD_BOT = 18;
  const NAME_SZ = 26;
  const TEXT_SZ = 28;
  const TIME_SZ = 18;
  const LINE_H  = 36;
  const BUB_X   = AV_X + AV_R + GAP;
  const BUB_W   = SIZE - BUB_X - MARGIN;  // bubble memenuhi sisa canvas
  const MAX_TW  = BUB_W - PAD_X * 2;

  // hitung baris teks
  const tmpCanvas = createCanvas(SIZE, SIZE);
  const tmpCtx    = tmpCanvas.getContext("2d");
  tmpCtx.font     = `${TEXT_SZ}px Sans-Serif`;
  const lines     = wrapText(tmpCtx, text, MAX_TW);

  const BUB_H = PAD_TOP + NAME_SZ + 10 + lines.length * LINE_H + PAD_BOT + TIME_SZ + 4;
  const BUB_Y = AV_Y - BUB_H / 2;

  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext("2d");

  // TRANSPARAN
  ctx.clearRect(0, 0, SIZE, SIZE);

  // --- AVATAR ---
  let ppImg = null;
  const ppUrl = await getPPUrl(conn, rawJid);
  if (ppUrl) {
    try {
      const res = await fetch(ppUrl, { timeout: 10000 });
      if (res.ok) ppImg = await loadImage(Buffer.from(await res.arrayBuffer()));
    } catch {}
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(AV_X, AV_Y, AV_R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (ppImg) {
    ctx.drawImage(ppImg, AV_X - AV_R, AV_Y - AV_R, AV_R * 2, AV_R * 2);
  } else {
    const ci = (name.charCodeAt(0) || 65) % AVATAR_COLORS.length;
    ctx.fillStyle = AVATAR_COLORS[ci];
    ctx.fillRect(AV_X - AV_R, AV_Y - AV_R, AV_R * 2, AV_R * 2);
    ctx.restore();
    ctx.save();
    ctx.font         = `bold ${Math.floor(AV_R * 0.85)}px Sans-Serif`;
    ctx.fillStyle    = "#ffffff";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(name)[0].toUpperCase(), AV_X, AV_Y);
  }
  ctx.restore();

  // --- BUBBLE (abu-abu gelap mode gelap) ---
  const BUB_COLOR = "rgba(42, 44, 46, 0.97)";

  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,0.5)";
  ctx.shadowBlur    = 20;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 5;
  drawRoundRect(ctx, BUB_X, BUB_Y, BUB_W, BUB_H, 20);
  ctx.fillStyle = BUB_COLOR;
  ctx.fill();
  ctx.restore();

  // ekor bubble
  ctx.save();
  ctx.fillStyle = BUB_COLOR;
  ctx.beginPath();
  ctx.moveTo(BUB_X + 1,  BUB_Y + 24);
  ctx.lineTo(BUB_X - 14, BUB_Y + 32);
  ctx.lineTo(BUB_X + 1,  BUB_Y + 44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- NAMA ---
  let ty = BUB_Y + PAD_TOP;
  ctx.font         = `bold ${NAME_SZ}px Sans-Serif`;
  ctx.fillStyle    = "#4fc3f7";   // biru muda — kontras di dark mode
  ctx.textBaseline = "top";
  ctx.textAlign    = "left";
  ctx.fillText(String(name).slice(0, 22), BUB_X + PAD_X, ty);
  ty += NAME_SZ + 10;

  // --- TEKS ---
  ctx.font      = `${TEXT_SZ}px Sans-Serif`;
  ctx.fillStyle = "#e9edef";
  for (const ln of lines) {
    ctx.fillText(ln, BUB_X + PAD_X, ty);
    ty += LINE_H;
  }

  // --- TIMESTAMP ---
  const timeStr = getJakartaTime();
  ctx.font      = `${TIME_SZ}px Sans-Serif`;
  ctx.fillStyle = "rgba(180,180,180,0.7)";
  const tw      = ctx.measureText(timeStr).width;
  ctx.fillText(timeStr, BUB_X + BUB_W - PAD_X - tw, BUB_Y + BUB_H - PAD_BOT - TIME_SZ);

  return canvas.toBuffer("image/png");
}

async function pngToWebpSticker(pngBuffer) {
  const tempDir = path.join(process.cwd(), global.tempDir || "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ts  = Date.now();
  const inp = path.join(tempDir, `qc-${ts}.png`);
  const out = path.join(tempDir, `qc-${ts}.webp`);

  await writeFile(inp, pngBuffer);

  // lossless + transparansi alpha preserved
  await execPromise(
    `ffmpeg -y -i "${inp}" ` +
    `-vcodec libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ` +
    `"${out}"`
  );

  const webp = fs.readFileSync(out);
  try { fs.unlinkSync(inp); fs.unlinkSync(out); } catch {}
  return webp;
}

const handler = async (m, { conn, text }) => {
  const teks = pickText(m, text);

  if (!teks) {
    await m.react("📝");
    return m.reply(
      `> 📢 *Quote Chat (QC)*\n>\n` +
      `> Cara pakai: .qc <teks>\n` +
      `> Atau reply pesan lalu .qc\n>\n` +
      `> Contoh: .qc Halo semuanya!`
    );
  }

  await m.react("⏳");

  try {
    const { jid: rawJid, pushName } = getTargetInfo(m);
    const cleanJid = resolveJidForPP(rawJid);
    const name     = await safeGetName(conn, cleanJid, pushName);
    const png      = await generateQcImage(conn, rawJid, name, teks);
    const webp     = await pngToWebpSticker(png);
    await m.replySticker(webp);
    await m.react("✅");
  } catch (err) {
    console.error("[QC]", err);
    await m.react("❌");
    await m.reply(`> ❌ Gagal buat QC.\n> Error: ${err.message}`);
  }
};

handler.command     = ["qc"];
handler.category    = "tools";
handler.description = "Buat sticker quote chat WhatsApp style";

export default handler;
