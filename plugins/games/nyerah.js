/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { resolveAnyLidToJid, getParticipantJid } from '../../lib/serialize.js';

const ensureUser = (jid) => {
  if (!global.db.users[jid]) global.db.users[jid] = {};
  const u = global.db.users[jid];
  if (typeof u.coin !== 'number') u.coin = 0;
  if (typeof u.exp  !== 'number') u.exp  = 0;
  return u;
};

const ensureGroup = (chat) => {
  if (!global.db.groups[chat]) global.db.groups[chat] = {};
  return global.db.groups[chat];
};

const getGameSession = (chat) => {
  const g = ensureGroup(chat);
  if (!g.gameSession) return null;
  if (g.gameSession.expiry && Date.now() > g.gameSession.expiry) {
    delete g.gameSession;
    global.db.groups[chat] = g;
    return null;
  }
  return g.gameSession;
};

const deleteGameSession = (chat) => {
  const g = ensureGroup(chat);
  delete g.gameSession;
  global.db.groups[chat] = g;
};

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup) return m.reply('> ⚠️ *Command ini hanya untuk grup!*');

  const sesi = getGameSession(m.chat);
  if (!sesi) {
    await m.react('❌');
    return m.reply('> ❌ *Tidak ada game yang sedang berjalan!*');
  }

  let surrendererJid = m.sender;
  if (participants?.length) {
    const rawSender = m.key?.participant || m.sender || '';
    const rawNum    = rawSender.replace(/[^0-9]/g, '');
    const found     = participants.find(p =>
      (p.jid || p.id || '').replace(/[^0-9]/g, '') === rawNum ||
      (p.lid || '').replace(/[^0-9]/g, '') === rawNum
    );
    if (found) {
      surrendererJid = getParticipantJid(found) || resolveAnyLidToJid(rawSender, participants);
    } else {
      surrendererJid = resolveAnyLidToJid(rawSender, participants);
    }
  }

  const u       = ensureUser(surrendererJid);
  const penalty = Math.floor((sesi.reward?.coin || 100) * 0.3);

  u.coin = Math.max(0, u.coin - penalty);
  global.db.users[surrendererJid] = u;

  const answer     = Array.isArray(sesi.answer) ? sesi.answer.join(', ') : sesi.answer;
  const senderNum  = surrendererJid.split('@')[0];

  let text =
    `> 🏳️ *MENYERAH*\n>\n` +
    `> 👤 @${senderNum}\n` +
    `> 📝 Soal: ${sesi.question}\n` +
    `> ✅ Jawaban: *${answer}*\n>\n` +
    `> ⚠️ Penalty: -${penalty} coin\n` +
    `> 💰 Saldo: ${u.coin} coin\n>\n` +
    `> 💪 Jangan menyerah lagi!`;

  await conn.sendMessage(m.chat, {
    text,
    mentions: [surrendererJid],
  }, { quoted: m.fakeObj || m });

  await m.react('🏳️');

  deleteGameSession(m.chat);
};

handler.command     = ['nyerah'];
handler.category    = 'games';
handler.description = 'Menyerah dari game yang sedang berjalan (-30% coin penalty)';
handler.group       = true;

export default handler;
