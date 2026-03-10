/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const EMOJIS = ['🗿','🤓','🫩','🤡','🫠','🫨','🫥','😵‍💫','👁️','👀','👄','👃','🦷','🦴','🧠','🫁','🦶','🦶🏻','🫃','🧍','🧍‍♂️','🧎','🪑','🪨','🪵','🪜','🪞','🪠','🪦','🪤','🪬','🧿','🦠','🦧','🦑','🐸','🧌','👹','🧟','🧛','🧞','🧜','🧝','🤖','🫡','🫶','🫦','🫣','🫢','😶‍🌫️','🤠','🥴','🤪','🫤','🦿','🦾','🪰','🪱','🪲','🐌','🐛','🐜','🦗','🦂','🐙','🐡','🐠','🐟','🐢','🦎','🐍','🐊','🦖','🦕','🐘','🦛','🦏','🐪','🦒','🦘','🦥','🦦','🦨','🦡','🐿️','🦔','🐓','🦃','🐧','🦩','🦚','🦜','🦢','🦤','🐉','🐲','👺','🥸','🫠','🫨'];

const handler = async (m, { args }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isOwner) return m.reply(global.mess?.owner ?? "❌ Hanya owner!");

  const groupData = global.db.groups[m.chat] ?? {};
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "on") {
    groupData.autoreact = true;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Autoreact diaktifkan!*\nBot akan auto react ke setiap pesan masuk.");
  }
  if (sub === "off") {
    groupData.autoreact = false;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Autoreact dinonaktifkan!*");
  }

  await m.reply(`ℹ️ *Autoreact*\nStatus: *${groupData.autoreact ? "ON" : "OFF"}*\n\nGunakan:\n• \`autoreact on\`\n• \`autoreact off\``);
};

handler.command  = ["autoreact"];
handler.category = "group";
handler.owner    = true;
handler.group    = true;
handler.description = "Toggle autoreact di grup";

export const reactToNewMessage = async (conn, groupId, key) => {
  const groupData = global.db?.groups?.[groupId];
  if (!groupData?.autoreact) return;
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  try {
    await conn.sendMessage(groupId, { react: { text: emoji, key } });
  } catch {}
};

export default handler;
