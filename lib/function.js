/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
 // lib/function.js
import moment from "moment-timezone";
import fs from "fs";
import axios from "axios";
import Jimp from "jimp";

global.getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

global.capital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

global.generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

global.ucapan = () => {
  const currentTime = moment().tz("Asia/Jakarta");
  const currentHour = currentTime.hour();
  let greeting;
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Pagi Kak ";
  } else if (currentHour >= 12 && currentHour < 15) {
    greeting = "Siang Kak ";
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = "Sore Kak ";
  } else {
    greeting = "Malam Kak ";
  }
  return greeting;
};

global.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

global.generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer);
  const min = jimp.getWidth();
  const max = jimp.getHeight();
  const cropped = jimp.crop(0, 0, min, max);
  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
  };
};

global.getTime = (format, date) => {
  if (date) {
    return moment(date).locale("id").format(format);
  } else {
    return moment.tz("Asia/Jakarta").locale("id").format(format);
  }
};

global.getBuffer = async (url, options) => {
  try {
    options ? options : {};
    const res = await axios({
      method: "get",
      url,
      headers: {
        DNT: 1,
        "Upgrade-Insecure-Request": 1,
      },
      ...options,
      responseType: "arraybuffer",
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options) => {
  try {
    options ? options : {};
    const res = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      },
      ...options,
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.runtime = function (seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + "d " : "";
  var hDisplay = h > 0 ? h + "h " : "";
  var mDisplay = m > 0 ? m + "m " : "";
  var sDisplay = s > 0 ? s + "s " : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

global.clockString = function (ms) {
  let d = Math.floor(ms / (24 * 60 * 60 * 1000));
  let h = Math.floor(ms / (60 * 60 * 1000)) % 24;
  let m = Math.floor(ms / (60 * 1000)) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [
    d ? d + "hari" : "",
    h ? h + "jam" : "",
    m ? m + "menit" : "",
    s ? s + "detik" : "",
  ]
    .join(" ")
    .trim();
};

global.tanggal = function (numer) {
  const myMonths = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const myDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
  const tgl = new Date(numer);
  const day = tgl.getDate();
  const bulan = tgl.getMonth();
  let thisDay = tgl.getDay();
  thisDay = myDays[thisDay];
  const yy = tgl.getYear();
  const year = yy < 1000 ? yy + 1900 : yy;
  return `${thisDay}, ${day}/${myMonths[bulan]}/${year}`;
};

global.toRupiah = function (x) {
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x)) x = x.replace(pattern, "$1.$2");
  return x;
};

global.resize = async (input, width = 100, height = 100) => {
  try {
    let imageBuffer;
    if (Buffer.isBuffer(input)) {
      imageBuffer = input;
    } else if (typeof input === "string" && /^https?:\/\//.test(input)) {
      const res = await axios.get(input, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(res.data);
    } else if (typeof input === "string" && fs.existsSync(input)) {
      imageBuffer = fs.readFileSync(input);
    } else {
      throw new Error("Input tidak valid (harus Buffer, URL, atau file path)");
    }
    const image = await Jimp.read(imageBuffer);
    return await image.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
  } catch (err) {
    throw err;
  }
};