/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { createTmpFile, cleanTmpFiles } from "../../lib/mediaHelper.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execPromise = promisify(exec);

const handler = async (m, { conn, args, text }) => {
  let media   = null;
  let isVideo = false;

  if (m.quoted?.isVideo || m.quoted?.isAudio) {
    media   = await m.quoted.download();
    isVideo = m.quoted.isVideo;
  } else if (m.isVideo || m.isAudio) {
    media   = await m.download();
    isVideo = m.isVideo;
  } else {
    await m.react("❌");
    return m.reply("❌ Kirim atau reply video/audio dengan .tovn");
  }

  if (!media || !Buffer.isBuffer(media) || media.length === 0) {
    await m.react("❌");
    return m.reply("❌ Gagal unduh media, coba lagi!");
  }

  await m.react("⏳");

  const inFile  = createTmpFile("");
  const outFile = createTmpFile(".ogg");

  try {
    fs.writeFileSync(inFile, media);

    await execPromise(
      `ffmpeg -y -i "${inFile}" -vn -ar 48000 -ac 1 -c:a libopus -b:a 128k "${outFile}"`
    );

    if (!fs.existsSync(outFile) || fs.statSync(outFile).size === 0)
      throw new Error("Konversi gagal, output kosong");

    const vnBuffer  = fs.readFileSync(outFile);
    const mediaLabel = isVideo ? "Video" : "Audio";
    const caption    = text || `${mediaLabel} converted to voice note`;

    const channelName = global.channelName || global.botName || "Bot";
    const channelJid  = global.channelJid  || "0@newsletter";

    await conn.sendMessage(m.chat, {
      audio: vnBuffer,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 9999,
        forwardedNewsletterMessageInfo: {
          newsletterJid: channelJid,
          newsletterName: channelName,
          serverMessageId: 100,
        },
      },
    }, { quoted: m.fakeObj || m });

    await m.react("✅");
  } catch (err) {
    console.error("[ToVN] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal konversi: ${err.message}`);
  } finally {
    await cleanTmpFiles(inFile, outFile);
  }
};

handler.command     = ["tovn", "tovoice"];
handler.category    = "converter";
handler.description = "Konversi audio/video ke voice note";

export default handler;
