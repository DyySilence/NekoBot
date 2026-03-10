/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { generateWAMessageFromContent } from 'baileys';

export const getPtla   = () => global.ptla  || '';
export const getPtlc   = () => global.ptlc  || '';
export const getDomain = () => global.ptld  || '';
export const getNestId = () => global.ptln  || '1';
export const getEgg    = () => global.ptle  || '15';
export const getLoc    = () => global.ptll  || '1';

export const fmtRam  = v => v == 0 ? 'Unlimited' : v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`;
export const fmtDisk = v => v == 0 ? 'Unlimited' : v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`;
export const fmtCpu  = v => v == 0 ? 'Unlimited' : `${v}%`;

export const fmtDate = (ts = Date.now()) =>
  new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

export const expiredDate = (ts = Date.now(), days = 30) =>
  fmtDate(ts + days * 86400000);

export const expiredTs = (ts = Date.now(), days = 30) => ts + days * 86400000;

export const resourceMap = {
  '1gb':       { ram: 1000,  disk: 1000, cpu: 40  },
  '2gb':       { ram: 2000,  disk: 1000, cpu: 60  },
  '3gb':       { ram: 3000,  disk: 2000, cpu: 80  },
  '4gb':       { ram: 4000,  disk: 2000, cpu: 100 },
  '5gb':       { ram: 5000,  disk: 3000, cpu: 120 },
  '6gb':       { ram: 6000,  disk: 3000, cpu: 140 },
  '7gb':       { ram: 7000,  disk: 4000, cpu: 160 },
  '8gb':       { ram: 8000,  disk: 4000, cpu: 180 },
  '9gb':       { ram: 9000,  disk: 5000, cpu: 200 },
  '10gb':      { ram: 10000, disk: 5000, cpu: 220 },
  'unlimited': { ram: 0,     disk: 0,    cpu: 0   },
  'unli':      { ram: 0,     disk: 0,    cpu: 0   },
};

export const ptlFetch = async (path, method = 'GET', body = null, useClient = false) => {
  const domain = getDomain();
  const apikey = useClient ? getPtlc() : getPtla();
  const opts = {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apikey}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${domain}${path}`, opts);
  if (res.status === 204) return null;
  return res.json();
};

export const getOwnerJid = () => {
  const ownerNum = (global.owner || '').replace(/[^0-9]/g, '');
  if (!ownerNum) return null;
  return ownerNum + '@s.whatsapp.net';
};

export const sendPanelInfo = async (conn, _targetJid, teks, username, password) => {
  const domain    = getDomain();
  const ownerJid  = getOwnerJid();
  const sendToJid = ownerJid || _targetJid.replace('@lid', '@s.whatsapp.net');

  const msg = generateWAMessageFromContent(sendToJid, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: teks },
          nativeFlowMessage: {
            buttons: [
              { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Username', copy_code: username }) },
              { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Password', copy_code: password }) },
              { name: 'cta_url',  buttonParamsJson: JSON.stringify({ display_text: 'Login Panel',   url: domain }) },
            ],
          },
          contextInfo: { isForwarded: true },
        },
      },
    },
  }, {});

  await conn.relayMessage(sendToJid, msg.message, { messageId: msg.key.id });
};

export const sendSelectList = async (conn, m, title, bodyText, rows) => {
  await conn.sendMessage(m.chat, {
    buttons: [{
      buttonId: 'action',
      buttonText: { displayText: 'Pilih' },
      type: 4,
      nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title,
          sections: [{ title: `© ${global.botName || 'NekoBot'}`, rows }],
        }),
      },
    }],
    headerType: 1,
    viewOnce: true,
    text: `\n${bodyText}\n`,
  }, { quoted: m.fakeObj || m });
};

export const getResellerGroups  = ()    => global.db?.settings?.resellerGroups ?? [];
export const saveResellerGroups = (arr) => {
  if (!global.db.settings) global.db.settings = {};
  global.db.settings.resellerGroups = arr;
};
export const isResellerGroup = (chat) => getResellerGroups().includes(chat);

export const getServerTracker  = ()    => global.db?.settings?.ptlServers ?? {};
export const saveServerTracker = (obj) => {
  if (!global.db.settings) global.db.settings = {};
  global.db.settings.ptlServers = obj;
};
export const trackServer = (serverId, userId, username) => {
  const list = getServerTracker();
  list[String(serverId)] = {
    userId,
    username,
    createdAt: Date.now(),
    expiry:    expiredTs(Date.now(), 30),
  };
  saveServerTracker(list);
};
export const untrackServer = (serverId) => {
  const list = getServerTracker();
  delete list[String(serverId)];
  saveServerTracker(list);
};

export const canCreate = (m) => m.isOwner || (m.isGroup && isResellerGroup(m.chat));

export const checkConfig = (m) => {
  if (!getDomain() || !getPtla()) {
    m.reply(
      '> ❌ *Konfigurasi panel belum lengkap!*\n>\n' +
      '> Tambahkan di `set/config.js`:\n' +
      '> `global.ptld` — Domain panel\n' +
      '> `global.ptla` — Application API Key\n' +
      '> `global.ptlc` — Client API Key\n' +
      '> `global.ptln` — Nest ID\n' +
      '> `global.ptle` — Egg ID\n' +
      '> `global.ptll` — Location ID'
    );
    return false;
  }
  return true;
};