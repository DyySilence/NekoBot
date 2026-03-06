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

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR   = path.join(process.cwd(), "data", "fonts");
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

const cleanText = (text = "") => {
  text = unicodeBoldToAscii(text);
  text = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u200B-\u200F\u2028-\u202F\uFEFF]/gu, "");
  text = text.replace(/[^\x20-\x7E\u00C0-\u024F]/g, "");
  return text.trim();
};

const ellipsis = (ctx, text, maxW) => {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1);
  return text + "…";
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

const drawNoiseTexture = (ctx, x, y, w, h, alpha = 0.03) => {
  const size = 2;
  for (let i = 0; i < w; i += size) {
    for (let j = 0; j < h; j += size) {
      const v = Math.random();
      if (v > 0.6) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * v})`;
        ctx.fillRect(x + i, y + j, size, size);
      }
    }
  }
};

const buildCanvas = async ({
  groupName, totalMembers, totalAdmins, totalMessages,
  hourlyMessages, admins, topUsers, ppUrl, botName, trackingInfo, avg,
}) => {
  loadFonts();
  const F = fs.existsSync(FONT_REG) ? "Poppins" : "sans-serif";

  const W          = 900;
  const HEADER_H   = 260;
  const STATS_H    = 100;
  const CHART_H    = 420;
  const TOP_H      = topUsers.length * 54 + 80;
  const ADMIN_ROWS = Math.ceil(Math.min(admins.length, 12) / 3);
  const ADMIN_H    = ADMIN_ROWS > 0 ? ADMIN_ROWS * 44 + 80 : 0;
  const FOOTER_H   = 60;
  const H          = HEADER_H + STATS_H + CHART_H + TOP_H + ADMIN_H + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  const ACCENT   = "#7C6FFF";
  const ACCENT2  = "#FF6FD8";
  const BG_DEEP  = "#080810";
  const BG_CARD  = "#0F0F1E";
  const BG_MID   = "#12122A";
  const BORDER   = "rgba(124,111,255,0.18)";
  const TEXT_1   = "#FFFFFF";
  const TEXT_2   = "#A8A8C8";
  const TEXT_3   = "#6060A0";

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   "#080810");
  grad.addColorStop(0.4, "#0C0C20");
  grad.addColorStop(1,   "#100818");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const glowGrad1 = ctx.createRadialGradient(W * 0.15, HEADER_H * 0.6, 0, W * 0.15, HEADER_H * 0.6, 280);
  glowGrad1.addColorStop(0, "rgba(124,111,255,0.12)");
  glowGrad1.addColorStop(1, "rgba(124,111,255,0)");
  ctx.fillStyle = glowGrad1;
  ctx.fillRect(0, 0, W, HEADER_H + STATS_H);

  const glowGrad2 = ctx.createRadialGradient(W * 0.85, H * 0.4, 0, W * 0.85, H * 0.4, 320);
  glowGrad2.addColorStop(0, "rgba(255,111,216,0.07)");
  glowGrad2.addColorStop(1, "rgba(255,111,216,0)");
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  drawNoiseTexture(ctx, 0, 0, W, H, 0.025);

  const drawSection = (y, h, tint = "rgba(124,111,255,0.04)") => {
    roundRect(ctx, 20, y, W - 40, h, 18);
    ctx.fillStyle = tint;
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  drawSection(20, HEADER_H - 30, "rgba(124,111,255,0.06)");

  const AV  = 130;
  const AX  = 50;
  const AY  = 20 + (HEADER_H - 30 - AV) / 2;
  const CCX = AX + AV / 2;
  const CCY = AY + AV / 2;

  ctx.save();
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur  = 28;
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.arc(CCX, CCY, AV / 2 + 4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(CCX, CCY, AV / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  let avatarOk = false;
  if (ppUrl) {
    try { ctx.drawImage(await loadImage(ppUrl), AX, AY, AV, AV); avatarOk = true; } catch {}
  }
  if (!avatarOk) {
    const g = ctx.createRadialGradient(CCX, CCY - 15, 5, CCX, CCY, AV / 2);
    g.addColorStop(0, "#9490F0"); g.addColorStop(1, "#3A3780");
    ctx.fillStyle = g; ctx.fillRect(AX, AY, AV, AV);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(CCX, CCY - 22, 24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CCX, CCY + 55, 38, Math.PI, 0); ctx.fill();
  }
  ctx.restore();

  const TX   = AX + AV + 36;
  const TY0  = 20 + 36;
  const GW   = W - TX - 40;

  const gName = cleanText(groupName).toUpperCase() || "GROUP";
  ctx.font      = `bold 38px "${F}"`;
  ctx.fillStyle = TEXT_1;
  ctx.shadowColor = "rgba(124,111,255,0.5)";
  ctx.shadowBlur  = 12;
  ctx.fillText(ellipsis(ctx, gName, GW), TX, TY0 + 40);
  ctx.shadowBlur = 0;

  const tagGrad = ctx.createLinearGradient(TX, 0, TX + 200, 0);
  tagGrad.addColorStop(0, ACCENT);
  tagGrad.addColorStop(1, ACCENT2);
  roundRect(ctx, TX, TY0 + 52, 130, 26, 13);
  ctx.fillStyle = tagGrad; ctx.fill();
  ctx.font = `500 12px "${F}"`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("GROUP STATS", TX + 12, TY0 + 69);

  ctx.font      = `500 14px "${F}"`;
  ctx.fillStyle = TEXT_2;
  ctx.shadowBlur = 0;

  const pills = [
    `${totalMembers.toLocaleString()} Members`,
    `${totalAdmins.toLocaleString()} Admins`,
    `${totalMessages.toLocaleString()} Msgs`,
  ];
  let px = TX;
  ctx.font = `normal 12px "${F}"`;
  for (const label of pills) {
    const tw = ctx.measureText(label).width + 22;
    roundRect(ctx, px, TY0 + 88, tw, 26, 13);
    ctx.fillStyle   = "rgba(124,111,255,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(124,111,255,0.28)";
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle   = TEXT_2;
    ctx.fillText(label, px + 11, TY0 + 106);
    px += tw + 8;
  }

  ctx.font      = `300 11px "${F}"`;
  ctx.fillStyle = TEXT_3;
  ctx.fillText(trackingInfo, TX, TY0 + 130);

  let curY = HEADER_H + 10;

  drawSection(curY, STATS_H - 10, "rgba(255,111,216,0.04)");
  const statItems = [
    { label: "TOTAL PESAN", value: totalMessages.toLocaleString() },
    { label: "RATA-RATA/JAM", value: avg + "/jam" },
    { label: "PUNCAK JAM", value: (() => { const vals = Object.values(hourlyMessages); const max = Math.max(...vals); const hour = Object.keys(hourlyMessages).find(k => Number(hourlyMessages[k]) === max); return `${hour}:00 (${max})`; })() },
    { label: "ANGGOTA", value: totalMembers.toLocaleString() },
  ];
  const SW = (W - 40) / statItems.length;
  statItems.forEach((s, i) => {
    const sx = 20 + i * SW + SW / 2;
    const sy = curY + 22;
    if (i > 0) {
      ctx.strokeStyle = "rgba(124,111,255,0.15)";
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(20 + i * SW, curY + 14); ctx.lineTo(20 + i * SW, curY + STATS_H - 24); ctx.stroke();
    }
    ctx.font      = `bold 22px "${F}"`;
    ctx.fillStyle = TEXT_1;
    const vw = ctx.measureText(s.value).width;
    ctx.fillText(s.value, sx - vw / 2, sy + 26);
    ctx.font      = `300 11px "${F}"`;
    ctx.fillStyle = TEXT_3;
    const lw = ctx.measureText(s.label).width;
    ctx.fillText(s.label, sx - lw / 2, sy + 46);
  });
  curY += STATS_H + 10;

  drawSection(curY, CHART_H - 10, "rgba(124,111,255,0.03)");

  ctx.font      = `500 13px "${F}"`;
  ctx.fillStyle = TEXT_3;
  ctx.fillText("AKTIVITAS PER JAM", 44, curY + 26);
  ctx.strokeStyle = "rgba(124,111,255,0.2)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(44 + ctx.measureText("AKTIVITAS PER JAM").width + 10, curY + 21);
  ctx.lineTo(W - 40, curY + 21);
  ctx.stroke();

  const PL = 60, PR = 30, PT = 50, PB = 52;
  const CAW = W - 40 - PL - PR;
  const CAH = CHART_H - 10 - PT - PB;
  const CX0 = 20 + PL;
  const CYB = curY + PT + CAH;

  const vals    = Array.from({ length: 24 }, (_, h) => Number(hourlyMessages[h]) || 0);
  const maxV    = Math.max(...vals, 1);
  const niceMax = Math.ceil(maxV / 10) * 10 || 10;
  const steps   = 5;

  for (let s = 0; s <= steps; s++) {
    const yv = (niceMax / steps) * s;
    const yp = CYB - (yv / niceMax) * CAH;
    ctx.strokeStyle = s === 0 ? "rgba(124,111,255,0.25)" : "rgba(255,255,255,0.04)";
    ctx.lineWidth   = s === 0 ? 1.5 : 1;
    ctx.setLineDash(s === 0 ? [] : [4, 6]);
    ctx.beginPath(); ctx.moveTo(CX0, yp); ctx.lineTo(CX0 + CAW, yp); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font      = `300 10px "${F}"`;
    ctx.fillStyle = TEXT_3;
    const lbl = Math.round(yv).toString();
    ctx.fillText(lbl, CX0 - ctx.measureText(lbl).width - 8, yp + 4);
  }

  const barW  = CAW / 24;
  const gap   = 3;
  const bW    = barW - gap * 2;
  const peakV = Math.max(...vals);

  for (let h = 0; h < 24; h++) {
    const v  = vals[h];
    const bh = Math.max(v > 0 ? 4 : 0, (v / niceMax) * CAH);
    const bx = CX0 + h * barW + gap;
    const by = CYB - bh;

    if (bh > 0) {
      ctx.save();
      roundRect(ctx, bx, by, bW, bh, Math.min(5, bW / 2));
      ctx.clip();
      const bg = ctx.createLinearGradient(bx, by, bx, CYB);
      if (v === peakV) {
        bg.addColorStop(0, "#FF6FD8");
        bg.addColorStop(1, "rgba(255,111,216,0.3)");
        ctx.shadowColor = "#FF6FD8";
        ctx.shadowBlur  = 12;
      } else {
        bg.addColorStop(0, "#9490F0");
        bg.addColorStop(1, "rgba(100,96,220,0.25)");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(bx, by, bW, bh);
      ctx.restore();
    }

    if (v > 0) {
      ctx.font      = `300 9px "${F}"`;
      ctx.fillStyle = v === peakV ? "#FF6FD8" : TEXT_2;
      const vs = String(v);
      ctx.fillText(vs, bx + bW / 2 - ctx.measureText(vs).width / 2, by - 5);
    }

    ctx.font      = `300 9px "${F}"`;
    ctx.fillStyle = TEXT_3;
    const xl = String(h);
    ctx.fillText(xl, bx + bW / 2 - ctx.measureText(xl).width / 2, CYB + 14);
  }

  ctx.strokeStyle = "rgba(124,111,255,0.4)";
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(CX0, curY + PT); ctx.lineTo(CX0, CYB); ctx.stroke();

  ctx.font = `300 10px "${F}"`;
  ctx.fillStyle = TEXT_3;
  ctx.save();
  ctx.translate(CX0 - 44, curY + PT + CAH / 2);
  ctx.rotate(-Math.PI / 2);
  const yl = "jumlah pesan";
  ctx.fillText(yl, -ctx.measureText(yl).width / 2, 0);
  ctx.restore();
  const xl2 = "jam (0–23)";
  ctx.fillText(xl2, CX0 + CAW / 2 - ctx.measureText(xl2).width / 2, CYB + 34);

  curY += CHART_H + 10;

  drawSection(curY, TOP_H - 10, "rgba(124,111,255,0.04)");

  ctx.font      = `500 13px "${F}"`;
  ctx.fillStyle = TEXT_3;
  ctx.fillText("TOP CHATTER", 44, curY + 26);
  ctx.strokeStyle = "rgba(124,111,255,0.2)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(44 + ctx.measureText("TOP CHATTER").width + 10, curY + 21);
  ctx.lineTo(W - 40, curY + 21);
  ctx.stroke();

  const rankLabels = ["1","2","3","4","5","6","7","8","9","10"];
  const RANK_W  = 44;
  const NAME_W  = 200;
  const BAR_X   = 36 + RANK_W + NAME_W + 16;
  const BAR_MAX = W - 40 - BAR_X - 90;
  const ROW_PAD = 8;

  topUsers.forEach((u, i) => {
    const ry  = curY + 50 + i * 54;
    const pct = totalMessages > 0 ? u.count / totalMessages : 0;
    roundRect(ctx, 36, ry - ROW_PAD, W - 72, 54 - ROW_PAD * 2 + 8, 10);
    ctx.fillStyle = i % 2 === 0 ? "rgba(124,111,255,0.06)" : "rgba(0,0,0,0)";
    ctx.fill();
    const isTop3 = i < 3;
    const rankBgColors = ["rgba(255,215,0,0.18)","rgba(192,192,192,0.15)","rgba(205,127,50,0.15)"];
    const rankFgColors = ["#FFD700","#C0C0C0","#CD7F32"];
    roundRect(ctx, 40, ry - 2, RANK_W - 4, 32, 8);
    ctx.fillStyle = isTop3 ? rankBgColors[i] : "rgba(255,255,255,0.06)";
    ctx.fill();

    ctx.font      = isTop3 ? `bold 17px "${F}"` : `500 14px "${F}"`;
    ctx.fillStyle = isTop3 ? rankFgColors[i] : TEXT_3;
    ctx.shadowColor = isTop3 ? rankFgColors[i] : "transparent";
    ctx.shadowBlur  = isTop3 ? 8 : 0;
    const rlbl = isTop3 ? ["🥇","🥈","🥉"][i] : `#${rankLabels[i]}`;
    const rlw  = ctx.measureText(rlbl).width;
    ctx.fillText(rlbl, 40 + (RANK_W - 4) / 2 - rlw / 2, ry + 18);
    ctx.shadowBlur = 0;

    // name
    ctx.font      = `500 14px "${F}"`;
    ctx.fillStyle = TEXT_1;
    const nameX = 36 + RANK_W + 10;
    ctx.fillText(ellipsis(ctx, u.name, NAME_W), nameX, ry + 18);
    roundRect(ctx, BAR_X, ry + 4, BAR_MAX, 14, 7);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    const fillW = Math.max(pct * BAR_MAX, pct > 0 ? 8 : 0);
    if (fillW > 0) {
      roundRect(ctx, BAR_X, ry + 4, fillW, 14, 7);
      const bg = ctx.createLinearGradient(BAR_X, 0, BAR_X + fillW, 0);
      bg.addColorStop(0, ACCENT);
      bg.addColorStop(1, ACCENT2);
      ctx.fillStyle = bg;
      ctx.fill();
    }
    ctx.font      = `300 12px "${F}"`;
    ctx.fillStyle = TEXT_2;
    const countStr = `${u.count.toLocaleString()} (${Math.round(pct * 100)}%)`;
    const cw = ctx.measureText(countStr).width;
    ctx.fillText(countStr, W - 40 - cw, ry + 18);
  });
  curY += TOP_H + 10;

  if (admins.length > 0) {
    drawSection(curY, ADMIN_H - 10, "rgba(255,111,216,0.03)");
    ctx.font      = `500 11px "${F}"`;
    ctx.fillStyle = TEXT_3;
    const adminLbl = "GROUP ADMINS";
    ctx.fillText(adminLbl, 44, curY + 26);
    ctx.strokeStyle = "rgba(124,111,255,0.2)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(44 + ctx.measureText(adminLbl).width + 10, curY + 21);
    ctx.lineTo(W - 40, curY + 21);
    ctx.stroke();

    const COLS    = 3;
    const GPAD    = 12;
    const COL_W   = (W - 40 - GPAD * 2 - (COLS - 1) * GPAD) / COLS;
    const PILL_H  = 36;
    const PILL_R  = 10;

    admins.slice(0, 12).forEach((name, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const ax  = 20 + GPAD + col * (COL_W + GPAD);
      const ay  = curY + 38 + row * (PILL_H + 8);
      roundRect(ctx, ax, ay, COL_W, PILL_H, PILL_R);
      ctx.fillStyle   = "rgba(124,111,255,0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(124,111,255,0.18)";
      ctx.lineWidth   = 1;
      ctx.stroke();

      const DOT = 18;
      roundRect(ctx, ax + 8, ay + (PILL_H - DOT) / 2, DOT, DOT, DOT / 2);
      const tg = ctx.createLinearGradient(ax + 8, 0, ax + 8 + DOT, 0);
      tg.addColorStop(0, ACCENT); tg.addColorStop(1, ACCENT2);
      ctx.fillStyle = tg; ctx.fill();
      ctx.font      = `bold 10px "${F}"`;
      ctx.fillStyle = "#FFF";
      const star = "★";
      ctx.fillText(star, ax + 8 + DOT / 2 - ctx.measureText(star).width / 2, ay + PILL_H / 2 + 4);
      ctx.font      = `500 12px "${F}"`;
      ctx.fillStyle = TEXT_1;
      const nameX   = ax + 8 + DOT + 8;
      const maxNameW = COL_W - DOT - 24;
      ctx.fillText(ellipsis(ctx, name, maxNameW), nameX, ay + PILL_H / 2 + 5);
    });

    curY += ADMIN_H + 10;
  }

  const footerY = H - FOOTER_H;
  const footerGrad = ctx.createLinearGradient(0, footerY, W, footerY);
  footerGrad.addColorStop(0, "rgba(124,111,255,0.08)");
  footerGrad.addColorStop(0.5, "rgba(255,111,216,0.08)");
  footerGrad.addColorStop(1, "rgba(124,111,255,0.08)");
  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, footerY, W, FOOTER_H);

  ctx.strokeStyle = "rgba(124,111,255,0.2)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(W, footerY); ctx.stroke();

  const wm  = `✦ ${botName || "NekoBot — DS"} ✦`;
  const dt  = moment().tz("Asia/Jakarta").format("DD MMM YYYY · HH:mm WIB");
  ctx.font      = `500 13px "${F}"`;
  ctx.fillStyle = TEXT_2;
  const wmW = ctx.measureText(wm).width;
  ctx.fillText(wm, W / 2 - wmW / 2, footerY + 24);
  ctx.font      = `300 11px "${F}"`;
  ctx.fillStyle = TEXT_3;
  const dtW = ctx.measureText(dt).width;
  ctx.fillText(dt, W / 2 - dtW / 2, footerY + 44);

  return canvas.toBuffer("image/png");
};

const handler = async (m, { conn, participants, metadata }) => {
  const groupId = m.chat;
  await m.react("📊");

  const groupStats = global.db.groups[groupId]?.stats ?? {};
  const topUsers   = Object.entries(groupStats)
    .map(([num, data]) => ({ num, name: (data.name && data.name !== "undefined" && data.name.trim()) ? data.name.trim() : num, count: data.count || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (!topUsers.length) {
    await m.react("❌");
    return m.reply("📊 Belum ada data chat. Data terekam otomatis saat ada pesan masuk.");
  }

  const hourlyStats    = global.db.groups[groupId]?.hourlyStats ?? {};
  const totalMessages  = topUsers.reduce((s, u) => s + u.count, 0);
  const hourlyMessages = Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, hourlyStats[h] || 0]));

  const trackingSince = global.db.groups[groupId]?.statsSince ?? Date.now();
  const dH  = Math.max(1, Math.floor((Date.now() - trackingSince) / 3600000));
  const dD  = Math.floor(dH / 24);
  const avg = Math.round(totalMessages / dH);
  const trackingInfo = `Avg ${avg}/jam · Tracking ${dD > 0 ? dD + " hari" : dH + " jam"}`;

  let groupName    = metadata?.subject || groupId.split("@")[0];
  let totalMembers = participants.length;
  let totalAdmins  = 0;
  let adminNames   = [];
  let ppUrl        = null;

  const al = participants.filter((p) => p.admin);
  totalAdmins = al.length;
  const memberNames = global.db.groups[groupId]?.memberNames ?? {};

  const resolveAdminName = async (p) => {
    const num = (p.jid || p.id || "").replace(/@.*$/, "").replace(/[^0-9]/g, "");

    if (p.notify?.trim())       return p.notify.trim();
    if (p.name?.trim())         return p.name.trim();
    if (p.verifiedName?.trim()) return p.verifiedName.trim();
    if (memberNames[num]?.trim()) return memberNames[num].trim();

    const st = groupStats[num];
    if (st?.name && st.name !== "Unknown" && st.name.trim()) return st.name.trim();

    try {
      const jid = (p.jid || p.id || "").endsWith("@s.whatsapp.net")
        ? (p.jid || p.id)
        : num + "@s.whatsapp.net";
      const result = await conn.onWhatsApp(jid);
      const info   = Array.isArray(result) ? result[0] : result;
      if (info?.name?.trim()) {
        if (!global.db.groups[groupId]) global.db.groups[groupId] = {};
        if (!global.db.groups[groupId].memberNames) global.db.groups[groupId].memberNames = {};
        global.db.groups[groupId].memberNames[num] = info.name.trim();
        return info.name.trim();
      }
    } catch {}

    return num.length > 8
      ? `+${num.slice(0,2)} ${num.slice(2,5)}-${num.slice(5,9)}-${num.slice(9)}`
      : num;
  };

  adminNames = await Promise.all(al.map(resolveAdminName));

  try { ppUrl = await conn.profilePictureUrl(groupId, "image").catch(() => null); } catch {}

  try {
    const buf = await buildCanvas({
      groupName, totalMembers, totalAdmins, totalMessages,
      hourlyMessages, admins: adminNames, topUsers, ppUrl,
      botName: global.botName || "NekoBot — DS", trackingInfo, avg,
    });

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
handler.description = "Statistik top chat grup dengan visualisasi canvas premium + HD";
handler.group       = true;

export default handler;
