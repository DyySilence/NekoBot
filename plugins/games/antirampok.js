/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const fmtTime = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}j ${m}m`;
};

const PRICES = {
  6:  { price: 25000, label: '6 Jam',  ms: 6  * 3600000 },
  12: { price: 45000, label: '12 Jam', ms: 12 * 3600000 },
  24: { price: 80000, label: '24 Jam', ms: 24 * 3600000 },
};

const handler = async (m, { args }) => {
  const prefix = global.prefix || '.';
  const u      = (global.db.users[m.sender] ??= {});
  if (typeof u.coin !== 'number') u.coin = 0;

  const isActive = u.antiRampokUntil && u.antiRampokUntil > Date.now();
  const timeLeft = isActive ? u.antiRampokUntil - Date.now() : 0;

  if (args[0] === 'status' || args[0] === 'info') {
    if (!isActive) return m.reply(`> 🛡️ *ANTI-RAMPOK STATUS*\n\n> ❌ Tidak aktif\n\n> 💡 ${prefix}antirampok <durasi>`);
    return m.reply(`> 🛡️ *ANTI-RAMPOK STATUS*\n\n> ✅ Aktif\n> ⏰ Tersisa: ${fmtTime(timeLeft)}\n\n> 💡 Kamu terlindungi dari rampokan!`);
  }

  if (!args[0] || args[0] === 'list') {
    let text =
      `> 🛡️ *ANTI-RAMPOK SHOP*\n\n> 👤 ${m.pushName}\n> 💰 Koin: ${u.coin}\n\n` +
      (isActive ? `> ✅ Status: Aktif\n> ⏰ Tersisa: ${fmtTime(timeLeft)}\n\n` : `> ❌ Status: Tidak aktif\n\n`) +
      `> ━━━━━━━━━━━━━━━━━━━━\n\n> 💎 *PAKET PROTEKSI:*\n\n`;
    for (const [dur, info] of Object.entries(PRICES))
      text += `> 🛡️ ${info.label}\n> 💰 ${info.price.toLocaleString()} koin\n> 💡 ${prefix}antirampok ${dur}\n\n`;
    text += `> ━━━━━━━━━━━━━━━━━━━━\n\n> 🛡️ Kebal rampokan | Bisa ditumpuk | Otomatis aktif`;
    return m.reply(text);
  }

  const duration = parseInt(args[0]);
  if (!PRICES[duration]) return m.reply(`> ⚠️ *Durasi tidak valid!*\n\n> 💡 Pilih: 6, 12, atau 24 jam\n> Contoh: ${prefix}antirampok 6`);

  const { price, label, ms } = PRICES[duration];
  if (u.coin < price) return m.reply(`> ❌ *Koin tidak cukup!*\n\n> 💰 Punya: ${u.coin}\n> 💎 Harga: ${price.toLocaleString()}\n> Kurang: ${price - u.coin}`);

  u.coin           -= price;
  u.antiRampokUntil = Math.max(Date.now(), u.antiRampokUntil || 0) + ms;

  const totalHours = Math.floor((u.antiRampokUntil - Date.now()) / 3600000);

  await m.reply(
    `> ✅ *PROTEKSI AKTIF!*\n\n> 🛡️ Anti-Rampok ${label}\n\n` +
    `> 💰 Biaya: ${price.toLocaleString()}\n> 💵 Sisa koin: ${u.coin.toLocaleString()}\n` +
    `> ⏰ Total proteksi: ${totalHours} jam\n\n` +
    `> 🛡️ Kamu kebal dari rampokan!\n> 💡 Cek: ${prefix}antirampok status`
  );
  await m.react('🛡️');
};

handler.command     = ['antirampok'];
handler.category    = 'games';
handler.description = 'Beli proteksi dari rampokan';

export default handler;