/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import mime from 'mime-types';

async function mediafireScraper(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':                   'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language':          'en-US,en;q=0.5',
        'Referer':                  'https://www.mediafire.com/',
        'DNT':                      '1',
        'Connection':               'keep-alive',
        'Upgrade-Insecure-Requests':'1',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);

    let fileName =
      $('.dl-btn-label').attr('title') ||
      $('.filename').text().trim() ||
      $('div.dl-info > div.filename').text().trim() ||
      $('div.promoDownloadName').attr('title') ||
      'mediafire_file';
    fileName = fileName.replace(/\s+/g, '_').replace(/[^\w\s.-]/gi, '');

    const fileSize =
      $('a#downloadButton').text().match(/\(([^)]+)\)/)?.[1] ||
      $('.details li:contains("File size")').text().replace('File size:', '').trim() ||
      'Unknown';

    const fileType =
      $('.details li:contains("File type")').text().replace('File type:', '').trim() ||
      path.extname(fileName).substring(1).toUpperCase() ||
      'Unknown';

    let downloadUrl =
      $('#downloadButton').attr('href') ||
      $('a#download_link').attr('href') ||
      $('a.input.popsok').attr('href') ||
      null;

    if (!downloadUrl) {
      for (const el of $('script').toArray()) {
        const txt = $(el).html() || '';
        if (txt.includes('download_url')) {
          const match = txt.match(/download_url['"]\s*:\s*['"]([^'"]+)['"]/);
          if (match) { downloadUrl = match[1]; break; }
        }
      }
    }

    if (!downloadUrl) {
      downloadUrl = $('a[href*="download"]').toArray()
        .map(el => $(el).attr('href'))
        .find(link => link && link.includes('mediafire.com') && !link.includes('javascript:') && !link.includes('#'));
    }

    if (!downloadUrl) throw new Error('Tidak dapat menemukan link download. File mungkin dihapus atau link tidak valid.');

    if (downloadUrl.startsWith('//')) downloadUrl = 'https:' + downloadUrl;
    else if (downloadUrl.startsWith('/')) downloadUrl = 'https://www.mediafire.com' + downloadUrl;

    return { success: true, downloadUrl, fileName, fileSize, fileType };

  } catch (err) {
    return { success: false, error: err.message || 'Gagal mengekstrak informasi dari MediaFire' };
  }
}

function parseFileSize(sizeStr) {
  if (!sizeStr || sizeStr === 'Unknown') return 0;
  const match = sizeStr.match(/([\d.]+)\s*([KMGT]?B)/i);
  if (!match) return 0;
  const units = { 'B': 1 / (1024 * 1024), 'KB': 1 / 1024, 'MB': 1, 'GB': 1024, 'TB': 1024 * 1024 };
  return parseFloat(match[1]) * (units[match[2].toUpperCase()] || 0);
}

const handler = async (m, { conn, text }) => {
  try {
    const prefix = global.prefix || '.';

    if (!text || !text.includes('mediafire.com')) {
      return m.reply(
        `> 📢 *MEDIAFIRE DOWNLOADER*\n>\n` +
        `> 📝 Usage: ${prefix}mediafire <url>\n` +
        `> 💡 Example: ${prefix}mediafire https://www.mediafire.com/file/xxxxx\n>\n` +
        `> ⚠️ Pastikan link dari mediafire.com`
      );
    }

    const url = text.match(/https?:\/\/[^\s]+/)?.[0];
    if (!url) return m.reply('> ❌ URL tidak valid!');

    await m.react('⏳');

    const result = await mediafireScraper(url);

    if (!result.success) {
      await m.react('❌');
      return m.reply(`> ❌ *Gagal!*\n>\n> ${result.error}`);
    }

    const { downloadUrl, fileName, fileSize, fileType } = result;

    if (parseFileSize(fileSize) > 100) {
      await m.react('❌');
      return m.reply(`> ❌ *File terlalu besar!*\n>\n> 📊 Size: ${fileSize}\n> ⚠️ Max: 100MB`);
    }

    await m.react('📥');

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fsSync.existsSync(tempDir)) await fs.mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, fileName);

    const fileResponse = await axios({
      method:       'GET',
      url:          downloadUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':    'https://www.mediafire.com/',
        'Accept':     '*/*',
      },
      maxRedirects: 5,
      timeout:      300000,
    });

    const writer       = fsSync.createWriteStream(filePath);
    const totalBytes   = parseInt(fileResponse.headers['content-length'] || '0');
    let downloadedBytes = 0;
    let lastUpdate      = Date.now();

    fileResponse.data.on('data', async (chunk) => {
      downloadedBytes += chunk.length;
      const now = Date.now();
      if (now - lastUpdate > 10000 && totalBytes) {
        lastUpdate = now;
        const percent      = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
        const totalMB      = (totalBytes / 1024 / 1024).toFixed(2);
        try { await m.reply(`> ⏳ *Downloading...*\n>\n> 📊 ${percent}%\n> 📥 ${downloadedMB} MB / ${totalMB} MB`); } catch {}
      }
    });

    fileResponse.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

    await m.react('📤');

    const buffer = await fs.readFile(filePath);
    const ext    = path.extname(fileName).toLowerCase();

    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];

    if (imageExts.includes(ext)) {
      await conn.sendMessage(m.chat, {
        image:    buffer,
        caption:  `> ✅ *${fileName}*\n>\n> 📊 ${fileSize}\n> 📦 ${fileType}`,
        fileName,
      }, { quoted: m });
    } else if (videoExts.includes(ext)) {
      await conn.sendMessage(m.chat, {
        video:    buffer,
        caption:  `> ✅ *${fileName}*\n>\n> 📊 ${fileSize}\n> 📦 ${fileType}`,
        fileName,
      }, { quoted: m });
    } else if (audioExts.includes(ext)) {
      await conn.sendMessage(m.chat, {
        audio:    buffer,
        mimetype: 'audio/mpeg',
        fileName,
        ptt:      false,
      }, { quoted: m.fakeObj || m });
    } else {
      await conn.sendMessage(m.chat, {
        document: buffer,
        mimetype: mime.lookup(ext) || 'application/octet-stream',
        fileName,
        caption:
          `> ✅ *Downloaded from MediaFire*\n>\n` +
          `> 📁 ${fileName}\n> 📊 ${fileSize}\n> 📦 ${fileType}`,
      }, { quoted: m });
    }

    await m.react('✅');

    setTimeout(async () => {
      try { if (fsSync.existsSync(filePath)) await fs.unlink(filePath); } catch {}
    }, 60000);

  } catch (err) {
    await m.react('❌');
    return m.reply(`> ❌ *Error:*\n> ${err.message}`);
  }
};

handler.command     = ['mediafire', 'mf'];
handler.category    = 'downloader';
handler.description = 'Download file dari MediaFire';

export default handler;
