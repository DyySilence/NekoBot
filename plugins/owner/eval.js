import util from "util";

const handler = async (m, { conn, args, text, command, metadata, admins, participants, commands, db }) => {
  if (!text) {
    return m.reply(
      `╭━━『 *EVAL / EXEC* 』━━╮\n` +
      `│\n` +
      `│ ━━ INSPECT (>) ━━\n` +
      `│ Evaluasi ekspresi, tampilkan hasilnya\n` +
      `│ > m.sender\n` +
      `│ > global.db.groups[m.chat]\n` +
      `│ > process.memoryUsage()\n` +
      `│ > await conn.groupMetadata(m.chat)\n` +
      `│\n` +
      `│ ━━ EXEC (!!) ━━\n` +
      `│ Jalankan code multi-line, return nilai\n` +
      `│ !!\n` +
      `│ const x = 1 + 1\n` +
      `│ return x\n` +
      `│\n` +
      `│ ━━ OBJECT TERSEDIA ━━\n` +
      `│ m                  → seluruh object pesan\n` +
      `│ m.key              → { remoteJid, fromMe, id, participant }\n` +
      `│ m.message          → raw proto message\n` +
      `│ m.mtype            → tipe pesan\n` +
      `│ m.body             → isi teks / caption\n` +
      `│ m.sender           → JID pengirim\n` +
      `│ m.senderNumber     → nomor pengirim\n` +
      `│ m.chat             → JID chat / grup\n` +
      `│ m.pushName         → nama kontak\n` +
      `│ m.isGroup          → boolean\n` +
      `│ m.isOwner          → boolean\n` +
      `│ m.isAdmin          → boolean\n` +
      `│ m.isBotAdmin       → boolean\n` +
      `│ m.fromMe           → boolean\n` +
      `│ m.isBaileys        → boolean\n` +
      `│ m.fakeObj          → proto.WebMessageInfo\n` +
      `│ m.mentionedJid     → array JID mention\n` +
      `│ m.quoted           → object pesan quoted\n` +
      `│ m.quoted.sender    → JID pengirim quoted\n` +
      `│ m.quoted.mtype     → tipe quoted\n` +
      `│ m.quoted.body      → teks quoted\n` +
      `│ m.quoted.msg       → isi message quoted\n` +
      `│ m.quoted.fakeObj   → proto untuk reply\n` +
      `│ m.quoted.download  → fungsi download media\n` +
      `│ m.download()       → download media pesan ini\n` +
      `│ m.reply(teks)      → balas pesan\n` +
      `│ m.react(emoji)     → react ke pesan\n` +
      `│\n` +
      `│ conn               → socket Baileys\n` +
      `│ conn.user          → { id, name, lid }\n` +
      `│ conn.user.id       → JID bot\n` +
      `│ conn.user.name     → nama bot\n` +
      `│\n` +
      `│ ━━ AWAIT CONN ━━\n` +
      `│ await conn.sendMessage(jid, content, opts)\n` +
      `│ await conn.sendMessage(m.chat, { text: 'hi' }, { quoted: m.fakeObj })\n` +
      `│ await conn.sendMessage(m.chat, { image: { url: '...' }, caption: '' })\n` +
      `│ await conn.sendMessage(m.chat, { video: { url: '...' } })\n` +
      `│ await conn.sendMessage(m.chat, { audio: { url: '...' }, ptt: true })\n` +
      `│ await conn.sendMessage(m.chat, { sticker: buffer })\n` +
      `│ await conn.sendMessage(m.chat, { document: buf, fileName: 'f' })\n` +
      `│ await conn.sendMessage(m.chat, { delete: m.key })\n` +
      `│ await conn.sendMessage(m.chat, { react: { text: '👍', key: m.key } })\n` +
      `│ await conn.groupMetadata(m.chat)\n` +
      `│ await conn.groupParticipantsUpdate(jid, [jid], 'add'/'remove'/'promote'/'demote')\n` +
      `│ await conn.groupSettingUpdate(jid, 'announcement'/'not_announcement')\n` +
      `│ await conn.groupLeave(jid)\n` +
      `│ await conn.profilePictureUrl(jid, 'image')\n` +
      `│ await conn.updateProfilePicture(jid, buffer)\n` +
      `│ await conn.updateProfileStatus(text)\n` +
      `│ await conn.updateProfileName(text)\n` +
      `│ await conn.sendPresenceUpdate('recording'/'composing', jid)\n` +
      `│ await conn.readMessages([m.key])\n` +
      `│ await conn.downloadMediaMessage(msg, type)\n` +
      `│\n` +
      `│ metadata           → groupMetadata\n` +
      `│ metadata.id        → JID grup\n` +
      `│ metadata.subject   → nama grup\n` +
      `│ metadata.desc      → deskripsi grup\n` +
      `│ metadata.owner     → JID owner grup\n` +
      `│ metadata.participants → array member\n` +
      `│ metadata.participants[0].id    → JID member\n` +
      `│ metadata.participants[0].admin → 'admin'/'superadmin'/null\n` +
      `│ participants       → array participants\n` +
      `│ admins             → array JID admin\n` +
      `│\n` +
      `│ global.db                   → seluruh database\n` +
      `│ global.db.users             → semua user\n` +
      `│ global.db.users[m.sender]   → data user pengirim\n` +
      `│ global.db.groups            → semua grup\n` +
      `│ global.db.groups[m.chat]    → data grup ini\n` +
      `│ global.db.settings          → settings global\n` +
      `│ global.db.statusStore       → status WA tersimpan\n` +
      `│ global.prefix               → prefix bot\n` +
      `│ global.owner                → nomor owner\n` +
      `│ global.mess                 → pesan error default\n` +
      `│ global.statusStore          → Map status WA\n` +
      `│ global.groupMetadataCache   → Map cache metadata\n` +
      `│\n` +
      `│ commands           → list semua command\n` +
      `│ db                 → dbHelper\n` +
      `│ process.version    → versi Node.js\n` +
      `│ process.memoryUsage()\n` +
      `│ process.uptime()\n` +
      `│ process.env\n` +
      `│ process.platform\n` +
      `│ process.pid\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  const safeInspect = (val) => {
    const seen = new WeakSet();
    const replacer = (_, v) => {
      if (typeof v === "bigint")       return `BigInt(${v.toString()})`;
      if (Buffer.isBuffer(v))          return `Buffer<${v.length} bytes>`;
      if (v instanceof Uint8Array)     return `Uint8Array<${v.length} bytes>`;
      if (v instanceof Map)            return Object.fromEntries(v);
      if (v instanceof Set)            return [...v];
      if (v instanceof Date)           return `Date(${v.toISOString()})`;
      if (v instanceof RegExp)         return v.toString();
      if (v instanceof Error)          return `${v.name}: ${v.message}`;
      if (typeof v === "symbol")       return v.toString();
      if (typeof v === "function")     return `[Function: ${v.name || "anonymous"}]`;
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    };
    try {
      return util.inspect(JSON.parse(JSON.stringify(val, replacer)), {
        depth:           6,
        colors:          false,
        maxArrayLength:  Infinity,
        maxStringLength: Infinity,
        breakLength:     120,
        compact:         false,
      });
    } catch {
      return util.inspect(val, {
        depth:          3,
        colors:         false,
        maxArrayLength: 50,
        compact:        false,
      });
    }
  };

  const buildFn = (code, isExec) => {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const body = isExec ? code : `return (${code});`;
    return new AsyncFunction(
      "m", "conn", "metadata", "admins", "participants", "commands", "db", "global", "process", "text", "args",
      body
    );
  };

  const isExec = command === "!!" || m.body.trimStart().replace(/^[^a-zA-Z0-9>!]*/, "").startsWith("!!");
  let result;

  try {
    const fn = buildFn(text, isExec);
    result = await fn(m, conn, metadata, admins, participants, commands, db, global, process, text, args);
  } catch (e) {
    return m.reply(`❌ ${e.name}: ${e.message}\n\n${(e.stack || "").split("\n").slice(0, 5).join("\n")}`);
  }

  if (result === undefined && isExec) return;

  let output = "";

  if (result === undefined)              output = "undefined";
  else if (result === null)              output = "null";
  else if (typeof result === "string")   output = result;
  else if (typeof result === "number")   output = String(result);
  else if (typeof result === "boolean")  output = String(result);
  else if (typeof result === "bigint")   output = `BigInt(${result.toString()})`;
  else if (typeof result === "symbol")   output = result.toString();
  else if (typeof result === "function") output = result.toString();
  else if (Buffer.isBuffer(result))      output = `Buffer<${result.length} bytes>\n${result.toString("hex")}`;
  else if (result instanceof Uint8Array) output = `Uint8Array<${result.length} bytes>\n${Buffer.from(result).toString("hex")}`;
  else if (result instanceof Map)        output = safeInspect(Object.fromEntries(result));
  else if (result instanceof Set)        output = safeInspect([...result]);
  else if (result instanceof Date)       output = result.toISOString();
  else if (result instanceof Error)      output = `${result.name}: ${result.message}\n${result.stack || ""}`;
  else if (result instanceof RegExp)     output = result.toString();
  else                                   output = safeInspect(result);

  await m.reply(output);
};

handler.command     = [">", "eval", "!!"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Eval/inspect (>) dan exec multi-line code (!!)";

export default handler;
