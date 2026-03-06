/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import moment from "moment-timezone";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR  = path.join(process.cwd(), "data", "fonts");
const FONT_BOLD  = path.join(FONT_DIR, "Poppins-Bold.ttf");
const FONT_MED   = path.join(FONT_DIR, "Poppins-Medium.ttf");
const FONT_REG   = path.join(FONT_DIR, "Poppins-Regular.ttf");
const FONT_LIGHT = path.join(FONT_DIR, "Poppins-Light.ttf");

let _fontsLoaded = false;
const loadFonts = () => {
  if (_fontsLoaded) return;
  try {
    if (fs.existsSync(FONT_BOLD))  registerFont(FONT_BOLD,  { family: "Poppins", weight: "bold" });
    if (fs.existsSync(FONT_MED))   registerFont(FONT_MED,   { family: "Poppins", weight: "500" });
    if (fs.existsSync(FONT_REG))   registerFont(FONT_REG,   { family: "Poppins", weight: "normal" });
    if (fs.existsSync(FONT_LIGHT)) registerFont(FONT_LIGHT, { family: "Poppins", weight: "300" });
    _fontsLoaded = true;
  } catch (e) { console.error("[TOPCHAT] Font:", e.message); }
};

const unicodeBoldToAscii = (text) =>
  [...text].map(ch => {
    const cp = ch.codePointAt(0);
    if (cp >= 0x1D400 && cp <= 0x1D419) return String.fromCharCode(cp - 0x1D400 + 65);
    if (cp >= 0x1D41A && cp <= 0x1D433) return String.fromCharCode(cp - 0x1D41A + 97);
    if (cp >= 0x1D7CE && cp <= 0x1D7D7) return String.fromCharCode(cp - 0x1D7CE + 48);
    return ch;
  }).join("");

const cleanGroupName = (text) => {
  text = unicodeBoldToAscii(text);
  text = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u200B-\u200F\u2028-\u202F\uFEFF]/gu, "");
  text = text.replace(/[^\x20-\x7E\u00C0-\u024F]/g, "");
  return text.trim();
};

const ellipsis = (ctx, text, maxW) => {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + "\u2026").width > maxW) text = text.slice(0, -1);
  return text + "\u2026";
};

const roundRect = (ctx, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const buildCanvas = async ({ groupName, totalMembers, totalAdmins, totalMessages, hourlyMessages, admins, ppUrl, botName }) => {
  loadFonts();
  const F = fs.existsSync(FONT_REG) ? "Poppins" : "sans-serif";

  const W        = 720;
  const HEADER_H = 220;
  const CHART_H  = 360;
  const ADMIN_ROWS = admins.length > 0 ? Math.ceil(Math.min(admins.length, 16) / 4) : 0;
  const FOOTER_H = ADMIN_ROWS * 44 + 90;
  const H        = HEADER_H + CHART_H + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  ctx.fillStyle = "#F5F5F8";
  ctx.fillRect(0, 0, W, HEADER_H);

  const AV = 120, AX = 40, AY = Math.floor((HEADER_H - AV) / 2);
  const CR = AV / 2, CCX = AX + CR, CCY = AY + CR;

  ctx.save();
  ctx.beginPath(); ctx.arc(CCX, CCY, CR, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  let avatarOk = false;
  if (ppUrl) { try { ctx.drawImage(await loadImage(ppUrl), AX, AY, AV, AV); avatarOk = true; } catch {} }
  if (!avatarOk) {
    const g = ctx.createRadialGradient(CCX, CCY - 12, 8, CCX, CCY, CR);
    g.addColorStop(0, "#9490F0"); g.addColorStop(1, "#4A47A3");
    ctx.fillStyle = g; ctx.fillRect(AX, AY, AV, AV);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.arc(CCX, CCY - 20, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CCX, CCY + 50, 36, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "#6E6ADC"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(CCX, CCY, CR + 2, 0, Math.PI * 2); ctx.stroke();

  const TX  = AX + AV + 30;
  const midY = HEADER_H / 2;

  const cleanName = cleanGroupName(groupName).toUpperCase();
  ctx.fillStyle = "#1A1A2E";
  ctx.font      = `bold 34px "${F}"`;
  ctx.fillText(ellipsis(ctx, cleanName, W - TX - 24), TX, midY - 42);

  ctx.fillStyle = "#5A5A6E";
  ctx.font      = `500 15px "${F}"`;
  ctx.fillText(`${totalMembers.toLocaleString()} MEMBERS`, TX, midY - 2);
  ctx.fillText(`${totalAdmins.toLocaleString()} ADMINS`, TX, midY + 26);
  ctx.font      = `normal 14px "${F}"`;
  ctx.fillText(`${totalMessages.toLocaleString()} TOTAL MESSAGES SENT`, TX, midY + 68);

  ctx.fillStyle = "#D2D2DC"; ctx.fillRect(0, HEADER_H - 1, W, 2);

  ctx.fillStyle = "#1C1C24"; ctx.fillRect(0, HEADER_H, W, CHART_H);
  ctx.fillStyle = "#A0A0B4"; ctx.font = `500 18px "${F}"`;
  const ctW = ctx.measureText("chart").width;
  ctx.fillText("chart", W / 2 - ctW / 2, HEADER_H + 28);

  const PL = 54, PR = 14, PT = 52, PB = 54;
  const CAW = W - PL - PR, CAH = CHART_H - PT - PB;
  const CY0 = HEADER_H + PT, CYB = HEADER_H + PT + CAH;

  const vals    = Array.from({ length: 24 }, (_, h) => Number(hourlyMessages[h]) || 0);
  const maxV    = Math.max(...vals, 1);
  const niceMax = Math.ceil(maxV / 40) * 40 || 40;

  ctx.font = `300 11px "${F}"`;
  [0, 40, 80, 120, 160, 200, 240].filter(v => v <= niceMax + 20).forEach(yv => {
    const yp = CYB - (yv / niceMax) * CAH;
    ctx.strokeStyle = "#2D2D3A"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PL, yp); ctx.lineTo(W - PR, yp); ctx.stroke();
    ctx.fillStyle = "#A0A0B4";
    const lbl = String(yv), lw = ctx.measureText(lbl).width;
    ctx.fillText(lbl, PL - lw - 7, yp + 4);
  });

  const barW = CAW / 24, gap = 1.5, bInner = barW - gap * 2;
  for (let h = 0; h < 24; h++) {
    const v = vals[h], bh = (v / niceMax) * CAH;
    const bx = PL + h * barW + gap, by = CYB - bh;
    if (bh > 1) {
      const g = ctx.createLinearGradient(bx, by, bx, CYB);
      g.addColorStop(0, "#9490F0"); g.addColorStop(1, "#6E6ADC");
      ctx.fillStyle = g;
      roundRect(ctx, bx, by, bInner, bh, Math.min(3, bInner / 2)); ctx.fill();
    }
    if (v > 0) {
      ctx.fillStyle = "#FFFFFF"; ctx.font = `300 11px "${F}"`;
      const vs = String(v), vw = ctx.measureText(vs).width;
      ctx.fillText(vs, bx + bInner / 2 - vw / 2, by - 4);
    }
    ctx.fillStyle = "#A0A0B4"; ctx.font = `300 11px "${F}"`;
    const xl = String(h), xw = ctx.measureText(xl).width;
    ctx.fillText(xl, bx + bInner / 2 - xw / 2, CYB + 16);
  }

  ctx.fillStyle = "#A0A0B4"; ctx.font = `300 12px "${F}"`;
  ctx.fillText("jam", W / 2 - ctx.measureText("jam").width / 2, CYB + 34);
  ctx.save();
  ctx.translate(13, CY0 + CAH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText("jumlah pesan", -ctx.measureText("jumlah pesan").width / 2, 0);
  ctx.restore();

  const FY = HEADER_H + CHART_H;
  ctx.fillStyle = "#1C1C24"; ctx.fillRect(0, FY, W, FOOTER_H);
  ctx.fillStyle = "#2A2A38"; ctx.fillRect(0, FY, W, 1);

  ctx.fillStyle = "#A0A0B4"; ctx.font = `500 15px "${F}"`;
  const ftW = ctx.measureText("group managed by").width;
  ctx.fillText("group managed by", W / 2 - ftW / 2, FY + 26);

  const COLS  = 4;
  const H_PAD = 24;
  const COL_W = (W - H_PAD * 2) / COLS;
  const ROW_H = 44;
  const GRID_Y = FY + 50;

  ctx.font = `normal 13px "${F}"`;
  admins.slice(0, 16).forEach((name, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx  = H_PAD + col * COL_W + COL_W / 2;
    const cy  = GRID_Y + row * ROW_H;
    const dn  = ellipsis(ctx, name, COL_W - 10);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(dn, cx - ctx.measureText(dn).width / 2, cy);
  });

  ctx.fillStyle = "#4A4A60"; ctx.font = `300 12px "${F}"`;
  const wm = `made by ${botName || "dyy bot"}`;
  ctx.fillText(wm, W / 2 - ctx.measureText(wm).width / 2, FY + FOOTER_H - 14);

  return canvas.toBuffer("image/png");
};

const handler = async (m, { conn, participants, metadata }) => {
  const groupId = m.chat;
  await m.react("📊");

  const groupStats = global.db.groups[groupId]?.stats ?? {};
  const topUsers = Object.entries(groupStats)
    .map(([num, data]) => ({ num, name: data.name || "Unknown", count: data.count || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (!topUsers.length) {
    await m.react("❌");
    return m.reply("📊 Belum ada data chat. Data terekam otomatis saat ada pesan masuk.");
  }

  const hourlyStats = global.db.groups[groupId]?.hourlyStats ?? {};
  const totalMessages = topUsers.reduce((s, u) => s + u.count, 0);
  const hourlyMessages = Object.fromEntries(
    Array.from({ length: 24 }, (_, h) => [h, hourlyStats[h] || 0])
  );

  let groupName    = metadata?.subject || groupId.split("@")[0];
  let totalMembers = participants.length;
  let totalAdmins  = 0;
  let adminNames   = [];
  let ppUrl        = null;

  try {
    const al = participants.filter((p) => p.admin);
    totalAdmins = al.length;
    adminNames = al.map((p) => {
      const jid = p.jid || p.id || "";
      const num = jid.split("@")[0];
      const displayName = p.notify || p.name || p.verifiedName;
      if (displayName?.trim()) return displayName.trim();
      const ud = groupStats[num];
      if (ud?.name && ud.name !== "Unknown") return ud.name;
      return num;
    });
  } catch (e) {
    console.error("[TOPCHAT] meta:", e.message);
  }

  try {
    ppUrl = await conn.profilePictureUrl(groupId, "image").catch(() => null);
  } catch {}

  try {
    const buf = await buildCanvas({
      groupName,
      totalMembers,
      totalAdmins,
      totalMessages,
      hourlyMessages,
      admins: adminNames,
      ppUrl,
      botName: global.botName || "dyy bot",
    });

    const trackingSince = global.db.groups[groupId]?.statsSince ?? Date.now();
    const dH  = Math.max(1, Math.floor((Date.now() - trackingSince) / 3600000));
    const dD  = Math.floor(dH / 24);
    const avg = Math.round(totalMessages / dH);
    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

    let cap = `📊 *TOP CHAT — ${groupName}*\n\n`;
    topUsers.forEach((u, i) => {
      const pct = totalMessages > 0 ? Math.round((u.count / totalMessages) * 100) : 0;
      cap += `${medals[i]} *${u.name}* — ${u.count.toLocaleString()} (${pct}%)\n`;
    });
    cap += `\n📈 Total *${totalMessages.toLocaleString()}* · Avg *${avg}/jam*`;
    cap += `\n🕒 Tracking *${dD > 0 ? dD + " hari" : dH + " jam"}*`;
    cap += `\n📅 ${moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm")} WIB`;

    await conn.sendMessage(m.chat, { image: buf, caption: cap, mimetype: "image/png" }, { quoted: m.fakeObj || m });
    await m.react("✅");
  } catch (err) {
    console.error("[TOPCHAT CANVAS]", err);
    await m.react("⚠️");
    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    let text = `📊 *TOP CHAT — ${groupName}*\n\n`;
    topUsers.forEach((u, i) => {
      const pct = totalMessages > 0 ? Math.round((u.count / totalMessages) * 100) : 0;
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      text += `${medals[i]} *${u.name}*\n   💬 ${u.count.toLocaleString()} (${pct}%)\n   [${bar}]\n\n`;
    });
    text += `⚠️ Canvas error: ${err.message}`;
    await m.reply(text);
  }
};

handler.command     = ["topchat", "tc"];
handler.category    = "group";
handler.description = "Statistik top chat grup dengan visualisasi canvas";
handler.group       = true;

export default handler;
