/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { downloadContentFromMessage } from "baileys"; 
import { createRequire } from "module";

const require = createRequire(import.meta.url);

try {
  const ffmpegPath    = require("ffmpeg-static");
  const ffprobeStatic = require("ffprobe-static");
  if (typeof ffmpegPath === "string") ffmpeg.setFfmpegPath(ffmpegPath);
  if (ffprobeStatic?.path) ffmpeg.setFfprobePath(ffprobeStatic.path);
} catch {}

const tmpRoot = path.join(process.cwd(), "dyy");
if (!fs.existsSync(tmpRoot)) fs.mkdirSync(tmpRoot, { recursive: true });

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const createTmpFile = (ext) =>
  path.join(tmpRoot, `${crypto.randomBytes(8).toString("hex")}${ext}`);

const cleanTmpFiles = async (...files) => {
  for (const file of files) {
    if (!file) continue;
    try {
      if (fs.existsSync(file)) await fs.promises.unlink(file);
    } catch {}
  }
};

const downloadMsgMedia = async (msg, type) => {
  const stream = await downloadContentFromMessage(msg, type);
  return streamToBuffer(stream);
};

const imageToWebp = async (buffer, opt = {}) => {
  const packname = opt.packname || global.namaOwner || "DyySilence";
  const author   = opt.author   || global.dev       || "© 2026";

  try {
    const result = await new Sticker(buffer, {
      pack: packname,
      author,
      type: StickerTypes.FULL,
      quality: 80,
    }).toBuffer();
    return result;
  } catch (err) {
    console.error("[imageToWebp] ERROR:", err.message);
    throw err;
  }
};

const videoToWebp = async (buffer, opt = {}) => {
  const packname = opt.packname || global.namaOwner || "DyySilence";
  const author   = opt.author   || global.dev       || "© 2026";

  const fps    = typeof opt.fps    === "number" ? Math.max(8,   Math.min(20,  opt.fps))    : 12;
  const size   = typeof opt.size   === "number" ? Math.max(256, Math.min(512, opt.size))   : 512;
  const maxSec = typeof opt.maxSec === "number" ? Math.max(1,   Math.min(10,  opt.maxSec)) : 9.8;
  const q      = typeof opt.q      === "number" ? Math.max(20,  Math.min(60,  opt.q))      : 40;

  const inFile  = createTmpFile(".mp4");
  const outFile = createTmpFile(".webp");

  try {
    await fs.promises.writeFile(inFile, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inFile)
        .outputOptions([
          "-t", String(maxSec),
          "-vcodec", "libwebp",
          "-lossless", "0",
          "-q:v", String(q),
          "-preset", "default",
          "-compression_level", "6",
          "-loop", "0",
          "-an",
          "-vsync", "0",
          "-pix_fmt", "yuva420p",
          "-vf",
          `fps=${fps},scale='if(gt(iw,ih),${size},-2)':'if(gt(ih,iw),${size},-2)':force_original_aspect_ratio=decrease`,
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(outFile);
    });

    const webp = await fs.promises.readFile(outFile);

    try {
      return await new Sticker(webp, {
        pack: packname,
        author,
        type: StickerTypes.FULL,
        quality: 55,
        animated: true,
      }).toBuffer();
    } catch {
      return webp;
    }
  } finally {
    await cleanTmpFiles(inFile, outFile);
  }
};

const webpToPng = async (buffer) => {
  const { default: sharp } = await import("sharp");
  return sharp(buffer).png().toBuffer();
};

const webpToMp4 = async (buffer, opt = {}) => {
  const { default: sharp } = await import("sharp");
  const webpmux = await import("node-webpmux");
  const Image   = webpmux.default?.Image || webpmux.Image;

  const fps    = typeof opt.fps    === "number" ? Math.max(8,  Math.min(30, opt.fps))    : 15;
  const maxSec = typeof opt.maxSec === "number" ? Math.max(1,  Math.min(10, opt.maxSec)) : 10;
  const size   = 512;
  const pad4   = (n) => String(n).padStart(4, "0");

  const jobDir   = path.join(tmpRoot, `job_${crypto.randomBytes(6).toString("hex")}`);
  const frameDir = path.join(jobDir, "frames");
  const outFile  = createTmpFile(".mp4");
  const inFile   = path.join(jobDir, "input.webp");

  try {
    await fs.promises.mkdir(frameDir, { recursive: true });
    await fs.promises.writeFile(inFile, buffer);

    const img = new Image();
    await img.load(inFile);

    if (typeof img.demux === "function") {
      try { await img.demux({ path: frameDir }); }
      catch { await img.demux(frameDir); }
    }

    let webpFrames = (await fs.promises.readdir(frameDir).catch(() => []))
      .filter(f => f.toLowerCase().endsWith(".webp"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!webpFrames.length) {
      const singlePng = path.join(frameDir, `frame_${pad4(0)}.png`);
      await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png().toFile(singlePng);
    } else {
      const limitFrames = Math.min(webpFrames.length, Math.floor(maxSec * fps));
      webpFrames = webpFrames.slice(0, limitFrames);
      for (let i = 0; i < webpFrames.length; i++) {
        const src = path.join(frameDir, webpFrames[i]);
        const dst = path.join(frameDir, `frame_${pad4(i)}.png`);
        await sharp(src)
          .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png().toFile(dst);
      }
    }

    const pngs = (await fs.promises.readdir(frameDir).catch(() => []))
      .filter(f => f.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!pngs.length) throw new Error("No frames extracted");

    if (pngs.length === 1) {
      const first = path.join(frameDir, pngs[0]);
      await new Promise((resolve, reject) => {
        ffmpeg().input(first).inputOptions(["-loop", "1"])
          .outputOptions(["-t", String(maxSec), "-r", String(fps), "-c:v", "libx264",
            "-preset", "ultrafast", "-crf", "30", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-an"])
          .on("end", resolve).on("error", reject).save(outFile);
      });
    } else {
      await new Promise((resolve, reject) => {
        ffmpeg().input(path.join(frameDir, "frame_%04d.png"))
          .inputOptions(["-f", "image2", "-start_number", "0", "-framerate", String(fps)])
          .outputOptions(["-t", String(maxSec), "-c:v", "libx264", "-preset", "ultrafast",
            "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"])
          .on("end", resolve).on("error", reject).save(outFile);
      });
    }

    const mp4Buffer = await fs.promises.readFile(outFile);
    await cleanupJobDir(jobDir);
    await cleanTmpFiles(outFile);
    return mp4Buffer;

  } catch (err) {
    await cleanupJobDir(jobDir);
    await cleanTmpFiles(outFile);
    throw new Error(`WebP to MP4 failed: ${err.message}`);
  }
};

const cleanupJobDir = async (dir) => {
  try {
    if (!fs.existsSync(dir)) return;
    const walk = async (d) => {
      const items = await fs.promises.readdir(d).catch(() => []);
      for (const item of items) {
        const p  = path.join(d, item);
        const st = await fs.promises.stat(p).catch(() => null);
        if (!st) continue;
        if (st.isDirectory()) await walk(p);
        else await fs.promises.unlink(p).catch(() => {});
      }
      await fs.promises.rmdir(d).catch(() => {});
    };
    await walk(dir);
  } catch {}
};

export {
  downloadMsgMedia,
  imageToWebp,
  videoToWebp,
  webpToPng,
  webpToMp4,
  createTmpFile,
  cleanTmpFiles,
};
