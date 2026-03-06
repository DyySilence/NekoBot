/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "baileys";

const MEDIA_MAP = {
  imageMessage:    { dl: "image",    key: "image",    ext: "jpg",  label: "Foto" },
  videoMessage:    { dl: "video",    key: "video",    ext: "mp4",  label: "Video" },
  audioMessage:    { dl: "audio",    key: "audio",    ext: "mp3",  label: "Audio/VN" },
  stickerMessage:  { dl: "sticker",  key: "sticker",  ext: "webp", label: "Stiker" },
  documentMessage: { dl: "document", key: "document", ext: "bin",  label: "Dokumen" },
};

const unwrap = (msg) => {
  if (!msg) return null;
  const inner =
    msg.ephemeralMessage?.message ||
    msg.viewOnceMessage?.message ||
    msg.viewOnceMessageV2?.message ||
    msg.viewOnceMessageV2Extension?.message;
  return inner ? unwrap(inner) : msg;
};

const detectMedia = (rawMsg) => {
  if (!rawMsg) return null;
  const msg = unwrap(rawMsg);
  if (!msg) return null;
  for (const [mtype, info] of Object.entries(MEDIA_MAP)) {
    if (msg[mtype]) return { mtype, info, node: msg[mtype] };
  }
  return null;
};

const uploadBuffer = async (buf, filename) => {
  const form = new FormData();
  form.append("file", buf, { filename });
  const res = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
    headers: form.getHeaders(),
    timeout: 40000,
  });
  const url = res.data?.data?.url;
  if (!url) throw new Error("tmpfiles tidak return URL");
  return url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
};

const handler = async (m, { text }) => {
  const raw = text.trim();

  if (!raw) {
    return m.reply(
      "> 📝 *ADDRESPON*\n>\n" +
      "> *Format teks:*\n" +
      "> `.addrespon keyword|teks respon`\n>\n" +
      "> *Format media (kirim/reply + caption):*\n" +
      "> `.addrespon keyword`\n" +
      "> `.addrespon keyword|caption`\n>\n" +
      "> *Support:* foto · video · audio · VN\n" +
      "> dokumen · zip · stiker\n>\n" +
      "> Keyword harus kata utuh:\n" +
      "> \"panel\" ✅  \"panelnya\" ❌"
    );
  }

  const sepIdx  = raw.indexOf("|");
  const keyword = (sepIdx >= 0 ? raw.slice(0, sepIdx) : raw).trim().toLowerCase();
  const extra   = (sepIdx >= 0 ? raw.slice(sepIdx + 1) : "").trim();

  if (!keyword)            return m.reply("❌ Keyword tidak boleh kosong!");
  if (keyword.length > 50) return m.reply("❌ Keyword terlalu panjang (maks 50 karakter)!");
  let detected = null;

  if (m.quoted) {
    detected = detectMedia(m.quoted.message) || detectMedia(m.quoted.msg);
  }

  const TEXT_TYPES = new Set(["conversation", "extendedTextMessage", "reactionMessage", "protocolMessage"]);
  if (!detected && m.message && !TEXT_TYPES.has(m.mtype)) {
    detected = detectMedia(m.message);
  }

  const chat = m.chat;
  if (!global.db.groups[chat])            global.db.groups[chat]            = {};
  if (!global.db.groups[chat].autoRespon) global.db.groups[chat].autoRespon = {};

  await m.react("⏳");

  if (detected) {
    const { info, node } = detected;
    try {
      const stream = await downloadContentFromMessage(node, info.dl);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      if (!buf.length) throw new Error("Buffer kosong");

      const mime = node.mimetype || "";
      const ext  = mime.includes("mp4")  ? "mp4"
                 : mime.includes("webm") ? "webm"
                 : mime.includes("mp3") || mime.includes("mpeg") ? "mp3"
                 : mime.includes("ogg")  ? "ogg"
                 : mime.includes("pdf")  ? "pdf"
                 : mime.includes("zip")  ? "zip"
                 : mime.includes("webp") ? "webp"
                 : mime.includes("png")  ? "png"
                 : info.ext;

      const filename = "respon_" + keyword + "_" + Date.now() + "." + ext;
      const url      = await uploadBuffer(buf, filename);

      const respon = {
        mediaKey: info.key,
        mediaUrl: url,
        mimetype: mime || null,
        filename: node.fileName || filename,
      };
      if (info.dl === "audio") respon.ptt = !!(node.ptt);
      if (extra)               respon.caption = extra;

      global.db.groups[chat].autoRespon[keyword] = respon;
      await m.react("✅");
      return m.reply(
        "> ✅ *Auto Respon Ditambah!*\n>\n" +
        "> 🔑 Keyword: `" + keyword + "`\n" +
        "> 📎 Tipe: " + info.label + "\n" +
        (extra ? "> 📝 Caption: " + extra + "\n" : "") +
        ">\n> Bot auto reply saat ada kata `" + keyword + "`"
      );
    } catch (e) {
      await m.react("❌");
      console.error("[addrespon]", e);
      return m.reply("❌ Gagal proses media: " + e.message);
    }
  }

  if (!extra) {
    await m.react("❌");
    return m.reply(
      "❌ Tidak ada media & teks kosong!\n\n" +
      "Teks: `.addrespon " + keyword + "|isi respon`\n" +
      "Media: reply/kirim media + `.addrespon " + keyword + "`"
    );
  }

  global.db.groups[chat].autoRespon[keyword] = { text: extra };
  await m.react("✅");
  return m.reply(
    "> ✅ *Auto Respon Ditambah!*\n>\n" +
    "> 🔑 Keyword: `" + keyword + "`\n" +
    "> 💬 Respon: " + extra + "\n>\n" +
    "> Bot auto reply saat ada kata `" + keyword + "`"
  );
};

handler.command     = ["addrespon"];
handler.category    = "group";
handler.description = "Tambah auto respon keyword (teks/foto/video/audio/VN/dokumen/stiker)";
handler.admin       = true;

export default handler;
