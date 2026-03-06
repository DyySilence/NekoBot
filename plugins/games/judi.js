/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const symbols = ['🍎','🍊','🍋','🍉','🍇','⭐','💎','7️⃣','🎰','🍫'];

const multiplierMap = {
  '🎰🎰🎰': 10, '💎💎💎': 5, '7️⃣7️⃣7️⃣': 4,
  '⭐⭐⭐': 3,  '🍉🍉🍉': 2.5, '🍇🍇🍇': 2.5,
};

function getMultiplier(slot) {
  const key = slot.join('');
  if (multiplierMap[key]) return { mult: multiplierMap[key], label: `JACKPOT ${slot[0]}` };
  if (slot[0] === slot[1] && slot[1] === slot[2]) return { mult: 2, label: '3 SAMA!' };
  if (slot[0] === slot[1] || slot[1] === slot[2] || slot[0] === slot[2]) return { mult: 1.5, label: '2 SAMA!' };
  return { mult: 0, label: 'KALAH' };
}

const getGlobalWinrate = () => global.db?.settings?.judiWinrate ?? 30;

function resolveSlot(winrate) {
  const roll = Math.random() * 100;
  if (roll < winrate * 0.1) {
    const j = ['🎰','💎','7️⃣','⭐'];
    const s = j[Math.floor(Math.random() * j.length)];
    return [s, s, s];
  }
  if (roll < winrate) {
    const s = symbols[Math.floor(Math.random() * (symbols.length - 2))];
    if (Math.random() < 0.3) {
      const s2 = symbols[Math.floor(Math.random() * symbols.length)];
      return Math.random() < 0.5 ? [s, s, s2] : [s, s2, s];
    }
    return [s, s, s];
  }
  let slot;
  do {
    slot = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
  } while (getMultiplier(slot).mult > 0);
  return slot;
}

const handler = async (m, { conn, args }) => {
  const prefix  = global.prefix || '.';
  const u       = (global.db.users[m.sender] ??= {});
  if (!u.judiStats) u.judiStats = { totalGambles: 0, totalWins: 0, totalSpent: 0, totalEarned: 0, biggestWin: 0, biggestLoss: 0, jackpotHits: 0, currentStreak: 0, bestStreak: 0 };
  if (typeof u.coin !== 'number') u.coin = 0;

  const winrate = getGlobalWinrate();
  if (args[0] === 'setwinrate') {
    if (!m.isOwner) return m.reply(global.mess?.owner ?? '❌ Owner only!');
    const v = parseInt(args[1]);
    if (isNaN(v) || v < 0 || v > 100) {
      return m.reply(`> 📊 *SET WINRATE JUDI*\n>\n> Winrate saat ini: *${winrate}%*\n>\n> 💡 Contoh: ${prefix}judi setwinrate 40`);
    }
    if (!global.db.settings) global.db.settings = {};
    global.db.settings.judiWinrate = v;
    return m.reply(`> ✅ *Winrate judi diubah ke ${v}%*\n>\n> Berlaku untuk semua user!`);
  }

  if (args[0] === 'stats') {
    const wr     = u.judiStats.totalGambles > 0 ? Math.round((u.judiStats.totalWins / u.judiStats.totalGambles) * 100) : 0;
    const profit = u.judiStats.totalEarned - u.judiStats.totalSpent;
    return m.reply(
      `> 📊 *STATISTIK SLOT*\n>\n` +
      `> 👤 ${m.pushName}\n> 💰 Koin: ${u.coin}\n> 🎯 Winrate: ${winrate}%\n>\n` +
      `> 🎰 *GAME STATS:*\n` +
      `> 🎲 Total Spin: ${u.judiStats.totalGambles}\n` +
      `> ✅ Menang: ${u.judiStats.totalWins}\n` +
      `> ❌ Kalah: ${u.judiStats.totalGambles - u.judiStats.totalWins}\n` +
      `> 📈 Win Rate: ${wr}%\n` +
      `> 💎 Jackpot: ${u.judiStats.jackpotHits}\n>\n` +
      `> 💎 *RECORDS:*\n` +
      `> 🏆 Biggest Win: ${u.judiStats.biggestWin}\n` +
      `> 💀 Biggest Loss: ${u.judiStats.biggestLoss}\n` +
      `> 🔥 Best Streak: ${u.judiStats.bestStreak}\n>\n` +
      `> 💸 Total Spent: ${u.judiStats.totalSpent}\n` +
      `> 💸 Total Earned: ${u.judiStats.totalEarned}\n` +
      `> Net: ${profit >= 0 ? '+' : ''}${profit}`
    );
  }

  // ── Help ──────────────────────────────────────────────────────────────────
  if (!args[0] || args[0] === 'help') {
    return m.reply(
      `> 🎰 *SLOT MACHINE*\n>\n` +
      `> 💰 Koin kamu: ${u.coin}\n> 🎯 Winrate: ${winrate}%\n>\n` +
      `> 📝 *COMMANDS:*\n` +
      `> ${prefix}judi <bet> — Spin 1x\n` +
      `> ${prefix}judi <bet> 3 — Spin 3x\n` +
      `> ${prefix}judi <bet> 5 — Spin 5x\n` +
      `> ${prefix}judi <bet> 10 — Spin 10x\n` +
      `> ${prefix}judi stats — Statistik\n>\n` +
      `> 💎 *MULTIPLIER:*\n` +
      `> 2 sama = 1.5x | 3 sama = 2x\n` +
      `> 🎰 Jackpot = 10x | 💎 = 5x | 7️⃣ = 4x | ⭐ = 3x`
    );
  }

  const betAmount = parseInt(args[0]);
  const spinCount = parseInt(args[1]) || 1;

  if (isNaN(betAmount) || betAmount < 10) return m.reply('> ⚠️ *Minimal bet: 10 koin*');
  if (![1, 3, 5, 10].includes(spinCount))  return m.reply('> ⚠️ *Jumlah spin: 1, 3, 5, atau 10*');

  const totalBet = betAmount * spinCount;
  if (totalBet > u.coin) {
    return m.reply(
      `> 💰 *KOIN TIDAK CUKUP!*\n>\n` +
      `> Taruhan: ${betAmount} x ${spinCount} = ${totalBet}\n` +
      `> Koin kamu: ${u.coin}\n> Kurang: ${totalBet - u.coin}`
    );
  }

  const warningMsg = await m.reply(
    `> ⚠️ *PERINGATAN!*\n>\n> 💰 Taruhan: ${betAmount} x ${spinCount}\n` +
    `> 💸 Total: ${totalBet} koin\n\n> 🎲 Memulai dalam 3 detik...`
  );
  await new Promise(r => setTimeout(r, 3000));

  const spinResults = [];
  let totalEarned = 0, totalLost = 0, jackpotCount = 0, bonusTriggered = false, bonusWin = 0;

  for (let i = 0; i < spinCount; i++) {
    const slot            = resolveSlot(winrate);
    const { mult, label } = getMultiplier(slot);
    const isBonus         = slot.join('') === '🍫🍫🍫';
    let earn              = 0;
    if (isBonus) bonusTriggered = true;
    else if (mult >= 3) { earn = Math.floor(betAmount * mult); jackpotCount++; }
    else if (mult > 0)    earn = Math.floor(betAmount * mult);
    spinResults.push({ slot, mult, label, earn, isBonus });
    totalEarned += earn;
    if (earn === 0 && !isBonus) totalLost += betAmount;
  }

  if (bonusTriggered) {
    for (let b = 0; b < 3; b++) {
      const slot        = resolveSlot(Math.min(100, winrate * 2));
      const { mult }    = getMultiplier(slot);
      const earn        = mult > 0 ? Math.floor(betAmount * mult * 2) : 0;
      bonusWin         += earn;
      spinResults.push({ slot, mult, label: `BONUS ${b + 1}`, earn, isBonus: false, isBonusRound: true });
      totalEarned      += earn;
    }
  }

  u.coin = Math.max(0, u.coin - totalBet + totalEarned);

  const wins = spinResults.filter(r => r.earn > 0 && !r.isBonusRound).length;
  u.judiStats.totalGambles += spinCount;
  u.judiStats.totalWins    += wins;
  u.judiStats.totalSpent   += totalBet;
  u.judiStats.totalEarned  += totalEarned;
  u.judiStats.jackpotHits  += jackpotCount;
  if (wins > 0) {
    u.judiStats.currentStreak += wins;
    if (u.judiStats.currentStreak > u.judiStats.bestStreak) u.judiStats.bestStreak = u.judiStats.currentStreak;
  } else {
    u.judiStats.currentStreak = 0;
  }
  if (totalEarned > u.judiStats.biggestWin)  u.judiStats.biggestWin  = totalEarned;
  if (totalLost   > u.judiStats.biggestLoss) u.judiStats.biggestLoss = totalLost;

  const netProfit = totalEarned - totalBet;

  if (spinCount === 1) {
    const loadingMsg = await conn.sendMessage(m.chat, {
      text: `> 🎰 *SLOT MACHINE*\n\n> [ ❓ ❓ ❓ ]\n\n> 🎲 Spinning...`,
      edit: warningMsg.key,
    });
    for (let f = 1; f <= 6; f++) {
      await new Promise(r => setTimeout(r, 500));
      const preview = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        f < 4 ? '❓' : symbols[Math.floor(Math.random() * symbols.length)],
      ];
      const pct    = Math.floor((f / 6) * 100);
      const filled = Math.floor((pct / 100) * 20);
      await conn.sendMessage(m.chat, {
        text: `> 🎰 *SLOT MACHINE*\n\n> [ ${preview[0]} | ${preview[1]} | ${preview[2]} ]\n\n> [${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${pct}%`,
        edit: loadingMsg.key,
      });
    }
    await new Promise(r => setTimeout(r, 800));
    const r = spinResults[0];
    let out = `> 🎰 *HASIL SPIN*\n\n> ┌─────────────────┐\n> │  ${r.slot[0]}  │  ${r.slot[1]}  │  ${r.slot[2]}  │\n> └─────────────────┘\n\n`;
    out += r.earn > 0
      ? `> 🎉 *${r.label}!*\n> 💰 Taruhan: ${betAmount}\n> 🎁 Menang: ${r.earn} (${r.mult}x)\n> 💵 Saldo: ${u.coin}\n> 📈 Net: +${r.earn - betAmount}\n`
      : `> 💀 *KALAH!*\n> 💸 Hilang: ${betAmount}\n> 💰 Saldo: ${u.coin}\n`;
    out += `\n> 🎲 Total Spin: ${u.judiStats.totalGambles}`;
    await conn.sendMessage(m.chat, { text: out, edit: loadingMsg.key });
    await m.react(r.earn > 0 ? '🎰' : '💀');

  } else {
    const loadingMsg = await conn.sendMessage(m.chat, {
      text: `> 🎰 *AUTO SPIN ${spinCount}x*\n\n> [${'░'.repeat(20)}]\n> 🎲 Memulai...`,
      edit: warningMsg.key,
    });
    for (let i = 0; i < spinResults.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      const r      = spinResults[i];
      const pct    = Math.floor(((i + 1) / spinResults.length) * 100);
      const filled = Math.floor((pct / 100) * 20);
      const lbl    = r.isBonusRound ? `🎁 BONUS ${i - spinCount + 1}` : `Spin ${i + 1}`;
      await conn.sendMessage(m.chat, {
        text: `> 🎰 *${lbl}*\n\n> [ ${r.slot[0]} | ${r.slot[1]} | ${r.slot[2]} ] ${r.earn > 0 ? `✅ +${r.earn}` : '❌'}\n\n> [${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${pct}%\n> 💰 Earned: ${totalEarned}`,
        edit: loadingMsg.key,
      });
    }
    await new Promise(r => setTimeout(r, 800));
    let out =
      `> 🎰 *HASIL AUTO SPIN ${spinCount}x*\n\n> 📊 *SUMMARY:*\n> ━━━━━━━━━━━━━━━━━━━━\n` +
      `> 🎲 Spin: ${spinCount} | 🎁 Bonus: ${bonusTriggered ? '3 (TRIGGERED!)' : '0'}\n` +
      `> ✅ Menang: ${wins}/${spinCount} | 💎 Jackpot: ${jackpotCount}x\n> ━━━━━━━━━━━━━━━━━━━━\n\n` +
      `> 💰 *KEUANGAN:*\n> 💸 Total Bet: ${totalBet}\n> 🎁 Total Earn: ${totalEarned}\n` +
      (bonusTriggered ? `> 🎁 Bonus Win: ${bonusWin}\n` : '') +
      `> ${netProfit >= 0 ? '📈 Profit' : '📉 Loss'}: ${netProfit >= 0 ? '+' : ''}${netProfit}\n> 💵 Saldo: ${u.coin}\n\n> 📋 *DETAIL:*\n`;
    spinResults.forEach((r, idx) => {
      const lbl = r.isBonusRound ? `B${idx - spinCount + 1}` : `${idx + 1}`;
      out += `> ${lbl}. [ ${r.slot[0]} ${r.slot[1]} ${r.slot[2]} ] ${r.earn > 0 ? `✅ +${r.earn}` : '❌'}\n`;
    });
    await conn.sendMessage(m.chat, { text: out, edit: loadingMsg.key });
    await m.react(netProfit >= 0 ? '🎰' : '💀');
  }
};

handler.command     = ['judi', 'putar', 'slot'];
handler.category    = 'games';
handler.description = 'Judi koin dengan slot machine';

export default handler;
