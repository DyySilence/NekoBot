/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const activeGames = new Map();

const fmtTime = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

function createDeck() {
  const suits = ['♠️','♥️','♦️','♣️'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck  = [];
  for (let d = 0; d < 2; d++)
    for (const suit of suits)
      for (const rank of ranks)
        deck.push({ suit, rank });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCard(deck) { return deck.shift(); }

function handValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (['J','Q','K'].includes(c.rank)) total += 10;
    else if (c.rank === 'A') { total += 11; aces++; }
    else total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

const cardStr = (c) => `${c.rank}${c.suit}`;
const handStr = (hand) => hand.map(cardStr).join(' ');

async function showTable(conn, m, game) {
  const playerVal = handValue(game.playerHand);
  const msg = await conn.sendMessage(m.chat, {
    text: `> 🃏 *DEALING CARDS...*\n\n> 💰 Bet: ${game.bet}\n\n> 🎭 Dealer: [ ? ]\n> 👤 You: [ ? ]`,
  }, { quoted: m.fakeObj || m });
  await new Promise(r => setTimeout(r, 800));
  let text =
    `> 🃏 *BLACKJACK 21*\n\n> 💰 Bet: ${game.bet}\n\n` +
    `> 🎭 Dealer:\n> [ ${cardStr(game.dealerHand[0])} ] [ 🂠 ]\n\n` +
    `> 👤 You: ${playerVal}\n> [ ${handStr(game.playerHand)} ]\n\n` +
    `> ━━━━━━━━━━━━━━━\n> 🎮 Aksi:\n> • .bj hit\n> • .bj stand\n`;
  if (game.playerHand.length === 2 && !game.doubled)
    text += `> • .bj double (${game.bet * 2})\n`;
  text += `> • .bj quit`;
  await conn.sendMessage(m.chat, { text, edit: msg.key });
}

async function resolveGame(conn, m, game, outcome) {
  const u       = (global.db.users[m.sender] ??= {});
  let playerVal = handValue(game.playerHand);
  let dealerVal = handValue(game.dealerHand);

  if (outcome === 'stand' && playerVal <= 21) {
    while (dealerVal < 17) { game.dealerHand.push(drawCard(game.deck)); dealerVal = handValue(game.dealerHand); }
  }

  const msg = await conn.sendMessage(m.chat, {
    text:
      `> 🃏 *DEALER REVEALING...*\n\n` +
      `> 🎭 Dealer: ${dealerVal}\n> [ ${handStr(game.dealerHand)} ]\n\n` +
      `> 👤 You: ${playerVal}\n> [ ${handStr(game.playerHand)} ]`,
  }, { quoted: m.fakeObj || m });
  await new Promise(r => setTimeout(r, 1500));

  let result = '', winAmount = 0, netProfit = 0;

  if (outcome === 'player_bust')   { result = '💥 *BUST! KALAH!*';              winAmount = 0;                       netProfit = -game.bet; }
  else if (outcome === 'player_bj'){ result = '🎉 *BLACKJACK! 2.5x!*';         winAmount = Math.floor(game.bet*2.5); netProfit = winAmount - game.bet; }
  else if (outcome === 'dealer_bj'){ result = '💀 *Dealer Blackjack!*';         winAmount = 0;                       netProfit = -game.bet; }
  else if (outcome === 'push_bj')  { result = '🤝 *PUSH! Seri!*';               winAmount = game.bet;                netProfit = 0; }
  else if (outcome === 'stand') {
    if (dealerVal > 21)              { result = '🎉 *DEALER BUST!*';             winAmount = game.bet * 2;            netProfit = game.bet; }
    else if (playerVal > dealerVal)  { result = `🎉 *MENANG! ${playerVal} vs ${dealerVal}*`; winAmount = game.bet*2; netProfit = game.bet; }
    else if (playerVal === dealerVal){ result = `🤝 *PUSH! Seri ${playerVal}*`; winAmount = game.bet;                netProfit = 0; }
    else                             { result = `💀 *KALAH! ${playerVal} vs ${dealerVal}*`;  winAmount = 0;          netProfit = -game.bet; }
  }

  u.coin = Math.max(0, (u.coin || 0) + winAmount);

  if (!u.bjStats) u.bjStats = { games: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, totalWon: 0, totalLost: 0, bestStreak: 0, currentStreak: 0 };
  u.bjStats.games++;
  if (netProfit > 0) {
    u.bjStats.wins++; u.bjStats.totalWon += netProfit; u.bjStats.currentStreak++;
    if (u.bjStats.currentStreak > u.bjStats.bestStreak) u.bjStats.bestStreak = u.bjStats.currentStreak;
    if (outcome === 'player_bj') u.bjStats.blackjacks++;
  } else if (netProfit === 0) {
    u.bjStats.pushes++; u.bjStats.currentStreak = 0;
  } else {
    u.bjStats.losses++; u.bjStats.totalLost += Math.abs(netProfit); u.bjStats.currentStreak = 0;
  }

  u.bjCooldown = Date.now() + 30000;
  activeGames.delete(m.sender);

  const profit = u.bjStats.totalWon - u.bjStats.totalLost;
  const text2  =
    `> 🃏 *HASIL AKHIR*\n\n` +
    `> 🎭 Dealer: ${dealerVal > 21 ? 'BUST' : dealerVal}\n> [ ${handStr(game.dealerHand)} ]\n\n` +
    `> 👤 You: ${playerVal > 21 ? 'BUST' : playerVal}\n> [ ${handStr(game.playerHand)} ]\n\n` +
    `> ━━━━━━━━━━━━━━━\n> ${result}\n> ━━━━━━━━━━━━━━━\n\n` +
    `> 💰 Taruhan: ${game.bet}\n> 🎁 Bayar: ${winAmount}\n` +
    `> ${netProfit >= 0 ? '📈 Profit' : '📉 Loss'}: ${netProfit >= 0 ? '+' : ''}${netProfit}\n` +
    `> 💵 Saldo: ${u.coin}\n\n` +
    `> 📊 Stats:\n> Games: ${u.bjStats.games} | W: ${u.bjStats.wins} | L: ${u.bjStats.losses}\n` +
    `> Profit: ${profit}\n\n> ⏰ Cooldown: 30s`;

  await conn.sendMessage(m.chat, { text: text2, edit: msg.key });
  await m.react(netProfit > 0 ? '🃏' : netProfit === 0 ? '🤝' : '💀');
}

const handler = async (m, { conn, args }) => {
  const prefix = global.prefix || '.';
  const u      = (global.db.users[m.sender] ??= {});
  if (typeof u.coin !== 'number') u.coin = 0;

  if (!args[0] || args[0] === 'help') {
    return m.reply(
      `> 🃏 *BLACKJACK 21*\n\n> 🎯 Tujuan: Kartu ≤21, lebih tinggi dari dealer\n\n` +
      `> 📝 Cara:\n> ${prefix}bj <bet> - Mulai\n> ${prefix}bj hit - Ambil kartu\n` +
      `> ${prefix}bj stand - Berhenti\n> ${prefix}bj double - 2x taruhan\n> ${prefix}bj quit - Keluar\n\n` +
      `> 💎 Bayar:\n> Blackjack = 2.5x | Menang = 2x | Seri = refund\n\n> 💰 Koin: ${u.coin}`
    );
  }

  const action  = args[0].toLowerCase();
  const hasGame = activeGames.has(m.sender);

  if (action === 'quit') {
    if (!hasGame) return m.reply('> ❌ *Tidak ada game aktif!*');
    const game = activeGames.get(m.sender);
    u.coin += game.bet;
    activeGames.delete(m.sender);
    return m.reply(`> 🚪 *DIBATALKAN*\n> 💰 Refund: ${game.bet}`);
  }

  if (!hasGame && !['hit','stand','double'].includes(action)) {
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 10) return m.reply('> ⚠️ *Bet minimal 10!*');
    if (bet > u.coin) return m.reply(`> 💰 *Koin kurang!*\n> Punya: ${u.coin}`);

    const cdLeft = u.bjCooldown ? u.bjCooldown - Date.now() : null;
    if (cdLeft > 0) return m.reply(`> ⏰ *COOLDOWN*\n> Tunggu: ${fmtTime(cdLeft)}`);
    else if (u.bjCooldown) delete u.bjCooldown;

    u.coin -= bet;

    const deck       = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck), drawCard(deck)];
    const playerVal  = handValue(playerHand);
    const dealerVal  = handValue(dealerHand);
    const game       = { bet, deck, playerHand, dealerHand, doubled: false, timestamp: Date.now() };

    if (playerVal === 21 && dealerVal === 21) return resolveGame(conn, m, game, 'push_bj');
    if (playerVal === 21) return resolveGame(conn, m, game, 'player_bj');
    if (dealerVal === 21) return resolveGame(conn, m, game, 'dealer_bj');

    activeGames.set(m.sender, game);
    return showTable(conn, m, game);
  }

  if (!hasGame) return m.reply(`> ❌ *Tidak ada game aktif!*\n> Mulai: ${prefix}bj <bet>`);

  const game = activeGames.get(m.sender);

  if (action === 'hit') {
    game.playerHand.push(drawCard(game.deck));
    const pv = handValue(game.playerHand);
    if (pv > 21) return resolveGame(conn, m, game, 'player_bust');
    if (pv === 21) return resolveGame(conn, m, game, 'stand');
    activeGames.set(m.sender, game);
    return showTable(conn, m, game);
  }

  if (action === 'stand') return resolveGame(conn, m, game, 'stand');

  if (action === 'double') {
    if (game.playerHand.length !== 2) return m.reply('> ❌ *Double hanya di awal!*');
    if (game.bet > u.coin) return m.reply('> 💰 *Koin kurang untuk double!*');
    u.coin    -= game.bet;
    game.doubled = true;
    game.bet  *= 2;
    game.playerHand.push(drawCard(game.deck));
    const pv = handValue(game.playerHand);
    return pv > 21 ? resolveGame(conn, m, game, 'player_bust') : resolveGame(conn, m, game, 'stand');
  }

  return m.reply('> ❌ *Aksi tidak valid!*');
};

handler.command     = ['blackjack', 'bj'];
handler.category    = 'games';
handler.description = 'Blackjack 21 dengan animasi';

setInterval(() => {
  const now = Date.now();
  for (const [id, game] of activeGames.entries())
    if (now - game.timestamp > 600000) activeGames.delete(id);
}, 60000);

export default handler;