/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveAnyLidToJid, getParticipantJid, resolveTarget } from '../../lib/serialize.js';

const COOLDOWN_MS  = 3 * 60 * 1000;
const TARGET_CD_MS = 60 * 60 * 1000;

const fmtTime = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const handler = async (m, { conn, args, participants }) => {
  const prefix = global.prefix || '.';
  const u      = (global.db.users[m.sender] ??= {});
  if (typeof u.coin !== 'number') u.coin = 0;

  const cdLeft = u.malingCooldown ? u.malingCooldown - Date.now() : null;
  if (cdLeft > 0) {
    const progress = Math.min(1, 1 - cdLeft / COOLDOWN_MS);
    const filled   = Math.floor(progress * 20);
    return m.reply(
      `> ⏰ *COOLDOWN AKTIF*\n\n> 🥷 Maling\n> ⏳ Tunggu: ${fmtTime(cdLeft)}\n\n` +
      `> [${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${Math.floor(progress * 100)}%`
    );
  } else if (u.malingCooldown) {
    delete u.malingCooldown;
  }

  if (!m.isGroup) return m.reply('> ⚠️ *Command ini hanya untuk grup!*');

  let targetJid = null;

  if (m.mentionedJid?.length) {
    targetJid = resolveAnyLidToJid(m.mentionedJid[0], participants);
  } else if (m.quoted?.sender) {
    targetJid = resolveAnyLidToJid(m.quoted.sender, participants);
  } else if (args[0]) {
    const num   = args[0].replace(/[^0-9]/g, '');
    const found = participants.find(p => (p.jid || p.id || '').replace(/[^0-9]/g, '') === num || (p.lid || '').replace(/[^0-9]/g, '') === num);
    targetJid   = found ? getParticipantJid(found) : num + '@s.whatsapp.net';
  } else {
    const ownerNum   = (global.owner || '').replace(/[^0-9]/g, '');
    const memberJids = participants.map(p => getParticipantJid(p)).filter(Boolean);
    const potentials = memberJids.filter(jid => {
      if (jid === m.sender) return false;
      if (ownerNum && jid.replace(/[^0-9]/g, '') === ownerNum) return false;
      const tu = global.db.users[jid];
      return tu && (tu.coin || 0) > 50;
    });
    if (!potentials.length) return m.reply('> ⚠️ *Tidak ada target!*\n> Semua member terlindungi atau terlalu miskin.');
    targetJid = potentials[Math.floor(Math.random() * potentials.length)];
  }

  if (!targetJid || targetJid === m.sender) {
    return m.reply(
      `> 🥷 *MALING*\n\n> 💡 *Cara pakai:*\n> ${prefix}maling @user\n` +
      `> ${prefix}maling (reply)\n> ${prefix}maling 628xxx\n> ${prefix}maling (random)\n\n` +
      `> ⚠️ *Konsekuensi:*\n> • Max 30% coin target\n> • Risiko gagal: 60%\n> • Gagal: -30% koin`
    );
  }

  const ownerNum  = (global.owner || '').replace(/[^0-9]/g, '');
  const targetNum = targetJid.replace(/[^0-9]/g, '');
  if (ownerNum && targetNum === ownerNum) return m.reply('> 🛡️ *Tidak bisa merampok owner!*');

  const tu = global.db.users[targetJid];
  if (!tu)                  return m.reply('> ⚠️ *Target belum ada data!*');
  if ((tu.coin || 0) <= 50) return m.reply('> ⚠️ *Koin target terlalu sedikit!*\n> Minimal 50 koin.');

  if (tu.antiRampokUntil && tu.antiRampokUntil > Date.now()) {
    return m.reply(
      `> 🛡️ *TARGET TERLINDUNGI!*\n\n> @${targetNum} punya anti-rampok aktif!\n> ⏰ Tersisa: ${fmtTime(tu.antiRampokUntil - Date.now())}`,
      { mentions: [targetJid] }
    );
  }

  const targetCdKey = `malingTarget_${targetNum}`;
  const tcdLeft     = u[targetCdKey] ? u[targetCdKey] - Date.now() : null;
  if (tcdLeft > 0) {
    return m.reply(
      `> ⏰ *TARGET COOLDOWN!*\n\n> Baru saja merampok @${targetNum}!\n> ⏳ Tunggu: ${fmtTime(tcdLeft)}`,
      { mentions: [targetJid] }
    );
  } else if (u[targetCdKey]) {
    delete u[targetCdKey];
  }

  const warningMsg = await conn.sendMessage(m.chat, {
    text:
      `> ⚠️ *PERINGATAN!*\n\n> 🎯 Target: @${targetNum}\n> 💰 Koin target: ${tu.coin}\n` +
      `> 📊 Max rampok: ${Math.floor((tu.coin || 0) * 0.3)} (30%)\n\n> 🥷 Memulai dalam 3 detik...`,
    mentions: [targetJid],
  }, { quoted: m.fakeObj || m });

  await new Promise(r => setTimeout(r, 3000));

  const loadingMsg = await conn.sendMessage(m.chat, {
    text: `> 🥷 *AKSI PENCURIAN*\n\n> [${'░'.repeat(20)}]\n> ⏳ Merencanakan...`,
    edit: warningMsg.key,
  });

  const stages = [
    { text: 'Mengintai', emoji: '👀', progress: 25  },
    { text: 'Mendekat',  emoji: '🚶', progress: 50  },
    { text: 'Mencuri',   emoji: '🥷', progress: 75  },
    { text: 'Kabur',     emoji: '🏃', progress: 100 },
  ];

  for (const stage of stages) {
    await new Promise(r => setTimeout(r, 1500));
    const filled = Math.floor((stage.progress / 100) * 20);
    await conn.sendMessage(m.chat, {
      text: `> ${stage.emoji} *PENCURIAN*\n\n> 🎯 @${targetNum}\n> ${stage.text}...\n\n> [${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${stage.progress}%`,
      edit: loadingMsg.key,
      mentions: [targetJid],
    });
  }

  await new Promise(r => setTimeout(r, 1000));

  const success      = Math.random() > 0.6;
  const maxSteal     = Math.floor((tu.coin || 0) * 0.3);
  const stolenAmount = success ? Math.max(1, Math.floor(Math.random() * maxSteal) + Math.floor(maxSteal * 0.3)) : 0;

  u.malingCooldown = Date.now() + COOLDOWN_MS;

  let text = `> 🥷 *HASIL PENCURIAN*\n\n> 🎯 Target: @${targetNum}\n\n`;

  if (success) {
    u.coin              = (u.coin || 0) + stolenAmount;
    tu.coin             = Math.max(0, (tu.coin || 0) - stolenAmount);
    u[targetCdKey]      = Date.now() + TARGET_CD_MS;
    global.db.users[targetJid] = tu;

    text +=
      `> ✅ *BERHASIL!*\n\n> 🪙 Dicuri: ${stolenAmount} koin\n` +
      `> 💵 Koin kamu: ${u.coin}\n> 💵 Sisa target: ${tu.coin}\n\n` +
      `> ⏰ Cooldown: 3 menit\n> 🚫 Target cooldown: 1 jam`;
  } else {
    const penalty  = Math.floor((u.coin || 0) * 0.3);
    u.coin         = Math.max(0, (u.coin || 0) - penalty);

    const ownerJid = ownerNum ? ownerNum + '@s.whatsapp.net' : null;
    if (ownerJid) {
      const ou = (global.db.users[ownerJid] ??= {});
      ou.coin  = (ou.coin || 0) + penalty;
    }

    text +=
      `> ❌ *TERTANGKAP!*\n\n> 🚔 Hampir ditangkap!\n` +
      `> 💸 Penalty: -${penalty} koin (30%)\n> 👑 Dikirim ke owner\n` +
      `> 💵 Sisa koin: ${u.coin}\n\n> ⏰ Cooldown: 3 menit`;
  }

  await conn.sendMessage(m.chat, { text, edit: loadingMsg.key, mentions: [targetJid] });
  await m.react(success ? '🥷' : '🚨');
};

handler.command     = ['maling', 'rampok'];
handler.category    = 'games';
handler.description = 'Mencuri koin dari user lain';

export default handler;