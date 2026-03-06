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
  if (m.quoted?.body) {
    const q = m.quoted.body.trim();
    if (q) teks = teks ? `${q} ${teks}` : q;
  }
  return teks.trim();
}

function getTargetJid(m) {
  return m.quoted?.sender || m.sender;
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

function getJakartaTime() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function getPPUrl(conn, jid) {
  let ppUrl = null;
  try {
    ppUrl = await conn.profilePictureUrl(jid, "image");
  } catch {}
  if (!ppUrl) {
    try {
      ppUrl = await conn.profilePictureUrl(jid, "preview");
    } catch {}
  }
  return ppUrl || null;
}

async function generateQcImage(conn, jid, name, text) {
  const W = 512, H = 512;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, W, H);

  const FONT = 24;
  const LINE_H = 32;
  const PAD = 20;
  const MAX_W = 360;
  const AV_SIZE = 72;
  const AV_X = 50;
  const AV_Y = H / 2;

  ctx.font = `${FONT}px Sans-Serif`;

  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  let maxLW = 0;

  for (const w of words) {
    const test = cur + w + " ";
    if (ctx.measureText(test).width > MAX_W - PAD * 2 && cur) {
      lines.push(cur.trim());
      maxLW = Math.max(maxLW, ctx.measureText(cur.trim()).width);
      cur = w + " ";
    } else {
      cur = test;
    }
  }
  if (cur) {
    lines.push(cur.trim());
    maxLW = Math.max(maxLW, ctx.measureText(cur.trim()).width);
  }

  const bW = Math.max(180, Math.min(MAX_W, maxLW + PAD * 2));
  const bH = Math.max(72, lines.length * LINE_H + PAD + 30);
  const bX = AV_X + AV_SIZE / 2 + 14;
  const bY = AV_Y - bH / 2;

  let ppImg = null;
  const ppUrl = await getPPUrl(conn, jid);
  if (ppUrl) {
    try {
      const res = await fetch(ppUrl, { timeout: 10000 });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        ppImg = await loadImage(buf);
      }
    } catch {}
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(AV_X, AV_Y, AV_SIZE / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (ppImg) {
    ctx.drawImage(ppImg, AV_X - AV_SIZE / 2, AV_Y - AV_SIZE / 2, AV_SIZE, AV_SIZE);
  } else {
    ctx.fillStyle = "#1f6f8b";
    ctx.fillRect(AV_X - AV_SIZE / 2, AV_Y - AV_SIZE / 2, AV_SIZE, AV_SIZE);
    ctx.restore();
    ctx.save();
    ctx.font = `bold ${Math.floor(AV_SIZE * 0.45)}px Sans-Serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(name || "U")[0].toUpperCase(), AV_X, AV_Y);
    ctx.textAlign = "start";
  }
  ctx.restore();

  ctx.font = "bold 22px Sans-Serif";
  ctx.fillStyle = "#00a884";
  ctx.textBaseline = "middle";
  ctx.fillText(String(name || "User").slice(0, 22), bX + PAD, bY - 26);

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;
  roundRect(bX, bY, bW, bH, 16);
  ctx.fillStyle = "rgba(0, 92, 75, 0.92)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0, 92, 75, 0.92)";
  ctx.beginPath();
  ctx.moveTo(bX, bY + 16);
  ctx.lineTo(bX - 10, bY + 8);
  ctx.lineTo(bX, bY + 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.font = `${FONT}px Sans-Serif`;
  ctx.fillStyle = "#e9edef";
  ctx.textBaseline = "top";
  let ty = bY + PAD / 2;
  for (const ln of lines) {
    ctx.fillText(ln, bX + PAD, ty);
    ty += LINE_H;
  }

  const timeStr = getJakartaTime();
  ctx.font = "15px Sans-Serif";
  ctx.fillStyle = "rgba(233,237,239,0.6)";
  const tw = ctx.measureText(timeStr).width;
  ctx.fillText(timeStr, bX + bW - tw - 10, bY + bH - 20);

  return canvas.toBuffer("image/png");
}

async function imageToWebp(pngBuffer) {
  const tempDir = path.join(process.cwd(), global.tempDir || "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const ts = Date.now();
  const inp = path.join(tempDir, `qc-${ts}.png`);
  const out = path.join(tempDir, `qc-${ts}.webp`);
  await writeFile(inp, pngBuffer);
  await execPromise(
    `ffmpeg -i "${inp}" -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 "${out}"`
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
    let jid = getTargetJid(m);

    jid = jid.split(":")[0];
    if (!jid.includes("@")) jid += "@s.whatsapp.net";

    const fallback = m.quoted?.pushName || m.pushName || "User";
    const name = await safeGetName(conn, jid, fallback);
    const png = await generateQcImage(conn, jid, name, teks);
    const webp = await imageToWebp(png);
    await m.replySticker(webp);
    await m.react("✅");
  } catch (err) {
    console.error("[QC]", err);
    await m.react("❌");
    await m.reply(`> ❌ Gagal buat QC. Pastikan ffmpeg terinstall.`);
  }
};

handler.command = ["qc"];
handler.category = "tools";
handler.description = "Buat sticker quote chat WhatsApp style";

export default handler;
