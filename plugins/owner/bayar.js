/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import crypto from "crypto";
import QRCode from "qrcode";

class OrderKuota {
  static API_URL          = "https://app.orderkuota.com/api/v2";
  static HOST             = "app.orderkuota.com";
  static USER_AGENT       = "okhttp/4.12.0";
  static APP_VERSION_NAME = "25.09.18";
  static APP_VERSION_CODE = "250918";
  static APP_REG_ID       = "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztcwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw";
  static PHONE_MODEL      = "23124RA7EO";
  static PHONE_UUID       = "cdzXkBynRECkAODZEHwkeV";
  static PHONE_ANDROID    = "15";

  constructor(username, authToken) {
    this.username  = username;
    this.authToken = authToken;
  }

  async generateQr(amount = "") {
    const payload = new URLSearchParams({
      request_time:                              Date.now(),
      app_reg_id:                                OrderKuota.APP_REG_ID,
      phone_android_version:                     OrderKuota.PHONE_ANDROID,
      app_version_code:                          OrderKuota.APP_VERSION_CODE,
      phone_uuid:                                OrderKuota.PHONE_UUID,
      auth_username:                             this.username,
      auth_token:                                this.authToken,
      "requests[qris_merchant_terms][jumlah]":   amount,
      "requests[0]":                             "qris_merchant_terms",
      app_version_name:                          OrderKuota.APP_VERSION_NAME,
      phone_model:                               OrderKuota.PHONE_MODEL,
    });
    const res = await this._request("POST", `${OrderKuota.API_URL}/get`, payload);
    return res?.success && res?.qris_merchant_terms ? res.qris_merchant_terms.results : null;
  }

  async getTransactionQris() {
    const userId  = this.authToken.split(":")[0];
    const payload = new URLSearchParams({
      request_time:                        Date.now(),
      app_reg_id:                          OrderKuota.APP_REG_ID,
      phone_android_version:               OrderKuota.PHONE_ANDROID,
      app_version_code:                    OrderKuota.APP_VERSION_CODE,
      phone_uuid:                          OrderKuota.PHONE_UUID,
      auth_username:                       this.username,
      auth_token:                          this.authToken,
      "requests[qris_history][jumlah]":    "",
      "requests[qris_history][jenis]":     "",
      "requests[qris_history][page]":      "1",
      "requests[qris_history][dari_tanggal]": "",
      "requests[qris_history][ke_tanggal]":   "",
      "requests[qris_history][keterangan]":   "",
      "requests[0]":                       "account",
      app_version_name:                    OrderKuota.APP_VERSION_NAME,
      ui_mode:                             "light",
      phone_model:                         OrderKuota.PHONE_MODEL,
    });
    return await this._request("POST", `${OrderKuota.API_URL}/qris/mutasi/${userId}`, payload);
  }

  async _request(method, url, body = null) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Host:              OrderKuota.HOST,
          "User-Agent":      OrderKuota.USER_AGENT,
          "Content-Type":    "application/x-www-form-urlencoded",
          "accept-encoding": "gzip",
        },
        body: body ? body.toString() : null,
      });
      return await res.json();
    } catch {
      return { error: "Connection Error" };
    }
  }
}

function convertCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return ("000" + (crc & 0xffff).toString(16).toUpperCase()).slice(-4);
}

async function createDynamicQRBuffer(amount, codeqr) {
  try {
    let qrisData  = codeqr.slice(0, -4);
    const step1   = qrisData.replace("010211", "010212");
    const step2   = step1.split("5802ID");
    const amtStr  = amount.toString();
    const uang    = "54" + ("0" + amtStr.length).slice(-2) + amtStr;
    const base    = step2[0] + uang + "5802ID" + step2[1];
    const final   = base + convertCRC16(base);
    return await QRCode.toBuffer(final);
  } catch {
    return null;
  }
}

const sleep    = (ms) => new Promise((r) => setTimeout(r, ms));
const rupiah   = (n)  => "Rp " + Number(n || 0).toLocaleString("id-ID");

function parseNominal(input) {
  const n = parseInt(String(input || "").replace(/[^\d]/g, "") || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

function parseDbAmount(x) {
  return parseInt((x?.kredit || x?.amount || x?.nominal || "0").toString().replace(/[^\d]/g, "") || "0", 10);
}

function parseTxTime(x) {
  const s  = String(x?.tanggal || x?.waktu || x?.time || x?.created_at || x?.date || "").trim();
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (m1) {
    const t = new Date(+m1[3], +m1[2] - 1, +m1[1], +m1[4], +m1[5], 0).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  const t2 = Date.parse(s);
  return Number.isFinite(t2) ? t2 : 0;
}

function statusOk(x) {
  const st = String(x?.status || "").toUpperCase().trim();
  if (!st) return true;
  return ["IN", "SUCCESS", "SETTLEMENT", "BERHASIL", "PAID", "DONE", "OK"].includes(st);
}

function jenisOk(x) {
  const j = String(x?.jenis || "").toUpperCase().trim();
  if (!j) return true;
  return ["MASUK", "IN", "CREDIT"].includes(j);
}

function fingerprint(x) {
  return `${parseDbAmount(x)}|${x?.status || ""}|${x?.tanggal || x?.waktu || x?.time || ""}|${x?.keterangan || x?.desc || x?.remark || ""}`.slice(0, 350);
}

const pendingByChat = new Map();

const handler = async (m, { conn, args, command }) => {
  const PAY_USER  = global.payUser  || global.db?.settings?.payUser  || "";
  const PAY_TOKEN = global.payToken || global.db?.settings?.payToken || "";

  if (!PAY_USER || !PAY_TOKEN)
    return m.reply("❌ PAY_USER / PAY_TOKEN belum diset!\nSet di config: global.payUser & global.payToken");

  const ok = new OrderKuota(PAY_USER, PAY_TOKEN);

  if (command === "bayarcek") {
    const mutasi  = await ok.getTransactionQris();
    const history = mutasi?.qris_history?.results || [];
    if (!history.length) return m.reply("Mutasi kosong / belum kebaca.");

    const list = history.slice(0, 8).map((x, i) => {
      const amt = parseDbAmount(x);
      return (
        `${i + 1}. ${rupiah(amt)} | st:${x?.status || "-"} | j:${x?.jenis || "-"}\n` +
        `   t:${x?.tanggal || x?.waktu || "-"}\n` +
        `   ${x?.keterangan || x?.desc || "-"}`
      );
    });
    return m.reply(`*8 Mutasi Terakhir:*\n\n${list.join("\n\n")}`);
  }

  if (command === "batalbayar") {
    const cur = pendingByChat.get(m.chat);
    if (!cur) return m.reply("Ga ada pembayaran pending.");
    pendingByChat.delete(m.chat);
    try { await conn.sendMessage(m.chat, { delete: cur.qrKey }); } catch {}
    return m.reply("> ✅ Pending dibatalkan.");
  }


  const base = parseNominal(args[0]);
  if (!base) return m.reply(`Format: *${global.prefix}bayar 35000*`);

  if (pendingByChat.has(m.chat))
    return m.reply(`Masih ada pembayaran pending.\nPakai *${global.prefix}batalbayar* dulu.`);

  const uniq       = crypto.randomInt(1, 300);
  const finalPrice = base - (base % 1000) + uniq;
  const uniqStr    = String(uniq).padStart(3, "0");

  await m.react("⏳");

  const qrRaw = await ok.generateQr(finalPrice);
  if (!qrRaw?.qris_data) return m.reply("🍂 Gagal generate QRIS Payment.");

  const qrBuffer = await createDynamicQRBuffer(finalPrice, qrRaw.qris_data);
  if (!qrBuffer) return m.reply("🍂 Gagal membuat QR image.");

  const startAt    = Date.now();
  const allowBefore = 10_000;

  const qrMsg = await conn.sendMessage(
    m.chat,
    {
      image:   qrBuffer,
      caption:
        `🧾 *TAGIHAN OWNER*\n\n` +
        `💵 Request : *${rupiah(base)}*\n` +
        `💰 Bayar   : *${rupiah(finalPrice)}*\n` +
        `🧩 3 digit unik: *${uniqStr}*\n` +
        `⏳ Expired : 3 Menit\n\n` +
        `⚠️ Transfer harus sesuai *nominal bayar* (termasuk 3 digit terakhir).`,
    },
    { quoted: m.fakeObj || m }
  );

  pendingByChat.set(m.chat, {
    amount:  finalPrice,
    startAt,
    seen:    new Set(),
    qrKey:   qrMsg.key,
  });

  for (let i = 0; i < 60; i++) {
    await sleep(3000);

    const cur = pendingByChat.get(m.chat);
    if (!cur || cur.amount !== finalPrice) return;

    const mutasi  = await ok.getTransactionQris();
    const history = mutasi?.qris_history?.results || [];
    if (!Array.isArray(history) || !history.length) continue;

    let found = null;
    for (const x of history) {
      const fp = fingerprint(x);
      if (cur.seen.has(fp)) continue;

      const amt = parseDbAmount(x);
      if (amt !== finalPrice) continue;
      if (!statusOk(x) || !jenisOk(x)) continue;

      const txTime = parseTxTime(x);
      if (txTime && txTime < cur.startAt - allowBefore) continue;

      found = x;
      cur.seen.add(fp);
      break;
    }

    if (!found) {
      for (const x of history) cur.seen.add(fingerprint(x));
      continue;
    }

    pendingByChat.delete(m.chat);
    try { await conn.sendMessage(m.chat, { delete: qrMsg.key }); } catch {}
    await m.react("✅");

    return m.reply(
      `✅ *PEMBAYARAN DITERIMA*\n\n` +
      `💰 Nominal : *${rupiah(finalPrice)}*\n` +
      `🧩 Unik    : *${uniqStr}*\n` +
      `📌 Status  : *${String(found?.status || "OK")}*\n` +
      `🕒 Waktu   : *${String(found?.tanggal || found?.waktu || "-")}*`
    );
  }
  pendingByChat.delete(m.chat);
  try { await conn.sendMessage(m.chat, { delete: qrMsg.key }); } catch {}
  await m.react("❌");
  return m.reply(`❌ *Waktu Habis* (3 menit) — silakan ulangi ${global.prefix}bayar <nominal>.`);
};

handler.command     = ["bayar", "batalbayar", "bayarcek"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Buat tagihan QRIS + polling otomatis pembayaran";

export default handler;
