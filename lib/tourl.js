/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// lib/tourl.js
import FormData from "form-data";
import { ImageUploadService } from "node-upload-images";

export async function CatBox(buffer) {
  try {
    const { fromBuffer } = await import("file-type");
    const fetchModule = await import("node-fetch");
    const fetch = fetchModule.default;
    const type = await fromBuffer(buffer);
    const ext = type?.ext ?? "bin";
    const form = new FormData();
    form.append("fileToUpload", buffer, `file.${ext}`);
    form.append("reqtype", "fileupload");
    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });
    return await res.text();
  } catch {
    return null;
  }
}

export async function uploadImageBuffer(buffer) {
  try {
    const service = new ImageUploadService("pixhost.to");
    const { directLink } = await service.uploadFromBinary(buffer, "image.png");
    return directLink || null;
  } catch {
    return null;
  }
}
