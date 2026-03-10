/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import os from "os";
import { execSync } from "child_process";

function getLocalIPs() {
  const result = [];
  const ifaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const addr of addrs) {
      if (addr.internal) continue; 
      result.push({ iface: name, ip: addr.address, family: addr.family });
    }
  }
  return result;
}

function getPublicIPFromCmd() {
  const cmds = [
    `curl -s --max-time 4 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null`,      
    `curl -s --max-time 4 http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/externalIp -H "Metadata-Flavor: Google" 2>/dev/null`, 
    `curl -s --max-time 4 http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null`, 
    `curl -s --max-time 5 https://api.ipify.org 2>/dev/null`,
    `curl -s --max-time 5 https://ipv4.icanhazip.com 2>/dev/null`,
    `curl -s --max-time 5 https://checkip.amazonaws.com 2>/dev/null`,
  ];

  for (const cmd of cmds) {
    try {
      const result = execSync(cmd, { timeout: 6000 }).toString().trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(result)) return result;
    } catch {}
  }
  return null;
}

function getHostname() {
  try { return os.hostname(); } catch { return "-"; }
}

function getGateway() {
  try {
    const out = execSync("ip route | grep default | awk '{print $3}' | head -1", { timeout: 3000 }).toString().trim();
    return out || "-";
  } catch {
    try {
      const out = execSync("netstat -rn | grep '^0.0.0.0' | awk '{print $2}' | head -1", { timeout: 3000 }).toString().trim();
      return out || "-";
    } catch { return "-"; }
  }
}

function getIPInfo(ip) {
  try {
    const out = execSync(`curl -s --max-time 5 https://ipinfo.io/${ip}/json 2>/dev/null`, { timeout: 6000 }).toString().trim();
    const data = JSON.parse(out);
    return {
      org:      data.org      || "-",
      city:     data.city     || "-",
      region:   data.region   || "-",
      country:  data.country  || "-",
      timezone: data.timezone || "-",
    };
  } catch { return null; }
}

const handler = async (m, { conn }) => {
  await m.react("🔍");

  try {
    const localIPs  = getLocalIPs();
    const hostname  = getHostname();
    const gateway   = getGateway();
    const publicIP  = getPublicIPFromCmd();
    const ipInfo    = publicIP ? getIPInfo(publicIP) : null;

    let msg = `╭━━『 *INFO IP VPS* 』━━╮\n│\n`;
    msg += `├─❖ *PUBLIC IP*\n│\n`;
    if (publicIP) {
      msg += `├ 🌐 *IP Publik:* \`${publicIP}\`\n`;
      if (ipInfo) {
        msg += `├ 🏢 *ISP:* ${ipInfo.org}\n`;
        msg += `├ 🏙️ *Kota:* ${ipInfo.city}, ${ipInfo.region}\n`;
        msg += `├ 🌍 *Negara:* ${ipInfo.country}\n`;
        msg += `├ 🕐 *Timezone:* ${ipInfo.timezone}\n`;
      }
    } else {
      msg += `├ ⚠️ Tidak bisa ambil IP publik\n`;
    }

    msg += `│\n├─❖ *LOCAL IP*\n│\n`;
    msg += `├ 🖥️ *Hostname:* ${hostname}\n`;
    msg += `├ 🔀 *Gateway:* ${gateway}\n│\n`;

    if (localIPs.length) {
      for (const { iface, ip, family } of localIPs) {
        msg += `├ 📡 *${iface}* (${family}): \`${ip}\`\n`;
      }
    } else {
      msg += `├ ⚠️ Tidak ada interface lokal\n`;
    }

    msg += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;

    await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
    await m.react("✅");

  } catch (err) {
    console.error("[IP] Error:", err);
    await m.react("❌");
    await m.reply(`❌ Gagal ambil info IP!\n\nError: ${err.message}`);
  }
};

handler.command     = ["ip", "myip", "ipvps"];
handler.category    = "tools";
handler.owner       = false;
handler.description = "Ambil info IP publik & lokal VPS";

export default handler;
