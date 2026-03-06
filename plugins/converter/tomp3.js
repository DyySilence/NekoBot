/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { createTmpFile, cleanTmpFiles } from "../../lib/mediaHelper.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

const handler = async (m, { conn }) => {
  const isQuotedVideo = m.quoted?.isVideo;
  const isQuotedAudio = m.quoted?.isAudio || m.quoted?.isVoice;
  const isDirectVideo = m.isVideo;
  const isDirectAudio = m.isAudio || m.isVoice;

  const hasMedia = isQuotedVideo || isQuotedAudio || isDirectVideo || isDirectAudio;
  if (!hasMedia) return m.reply("❌ Reply video atau audio/VN dengan .tomp3");

  await m.react("⏳");

  const isVideo  = isQuotedVideo || isDirectVideo;
  const inFile   = createTmpFile(isVideo ? ".mp4" : ".ogg");
  const outFile  = createTmpFile(".mp3");

  try {
    const buffer = m.quoted
      ? await m.quoted.download()
      : await m.download();

    if (!buffer || !buffer.length) throw new Error("Buffer kosong, gagal download media");

    await fs.promises.writeFile(inFile, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inFile)
        .audioCodec("libmp3lame")
        .audioBitrate(128)
        .format("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(outFile);
    });

    const mp3Buffer = await fs.promises.readFile(outFile);
    await conn.sendMessage(m.chat, {
      audio: mp3Buffer,
      mimetype: "audio/mp4",
      ptt: false,
    }, { quoted: m.fakeObj || m });

    await m.react("✅");
  } catch (err) {
    console.error("[ToMP3] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal konversi: ${err.message}`);
  } finally {
    await cleanTmpFiles(inFile, outFile);
  }
};

handler.command     = ["tomp3", "toaudio"];
handler.category    = "converter";
handler.description = "Konversi video/audio/VN ke MP3";

export default handler;
