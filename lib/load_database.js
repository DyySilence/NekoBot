/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// lib/load_database.js 

async function LoadDataBase(conn, m) {
  try {
    if (!m || !m.sender || !m.chat) return; 

    if (typeof global.db.users !== "object") global.db.users = {};
    if (typeof global.db.groups !== "object") global.db.groups = {};
    if (typeof global.db.settings !== "object") global.db.settings = {};
  
    const defaultSettings = { bljpm: [], owner: [], list: {}, mode: "public" };
    for (let key in defaultSettings) {
      if (!(key in global.db.settings))
        global.db.settings[key] = defaultSettings[key];
    }

    if (typeof global.db.users[m.sender] !== "object")
      global.db.users[m.sender] = {};
    const defaultUser = { premium: false };
    for (let key in defaultUser) {
      if (!(key in global.db.users[m.sender]))
        global.db.users[m.sender][key] = defaultUser[key];
    }

    if (m.isGroup) {
      if (typeof global.db.groups[m.chat] !== "object")
        global.db.groups[m.chat] = {};
      const defaultGroup = {
        antilink: false,
        antilink2: false,
        autopromosi: false,
        welcome: false,
      };
      for (let key in defaultGroup) {
        if (!(key in global.db.groups[m.chat]))
          global.db.groups[m.chat][key] = defaultGroup[key];
      }
    }
  } catch (e) {
    throw e;
  }
}

export default LoadDataBase;
