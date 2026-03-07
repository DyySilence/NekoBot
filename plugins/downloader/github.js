/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from 'axios';
import { generateWAMessageFromContent, proto } from 'baileys';

const githubCache = new Map();

function parseGitHubUrl(url) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i,
    /git@github\.com:([^\/]+)\/(.+)\.git/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { user: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
}

async function getRepoInfo(user, repo) {
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${user}/${repo}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });
    if (!data) return { success: false, error: 'No data returned' };
    return {
      success:        true,
      name:           data.name,
      full_name:      data.full_name,
      description:    data.description || 'No description',
      owner:          data.owner.login,
      stars:          data.stargazers_count,
      forks:          data.forks_count,
      watchers:       data.watchers_count,
      language:       data.language || 'Unknown',
      size:           data.size,
      default_branch: data.default_branch,
      created_at:     data.created_at,
      updated_at:     data.updated_at,
      topics:         data.topics || [],
      license:        data.license?.name || 'No License',
      is_private:     data.private,
      html_url:       data.html_url,
      clone_url:      data.clone_url,
      zipball_url:    `https://api.github.com/repos/${user}/${repo}/zipball`,
      tarball_url:    `https://api.github.com/repos/${user}/${repo}/tarball`,
    };
  } catch (err) {
    if (err.response?.status === 404) return { success: false, error: 'Repository not found' };
    if (err.response?.status === 403) return { success: false, error: 'API rate limit exceeded' };
    return { success: false, error: err.message };
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

const handler = async (m, { conn, args, text, command }) => {
  const prefix  = global.prefix || '.';
  const chatId  = m.chat;
  const sender  = m.sender;
  const cmd     = command?.toLowerCase() || '';

  if (cmd === 'gitclone') {
    const format = args[0];
    if (!format) return m.reply(`> ❌ Format tidak valid.\n> Gunakan: *${prefix}github <url>* terlebih dahulu`);

    const cacheKey  = `${chatId}_${sender}_git`;
    const cached    = githubCache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > 600000) {
      await m.react('❌');
      return m.reply(`> ❌ Cache kedaluwarsa.\n> Silakan search ulang dengan: *${prefix}github <url>*`);
    }

    const info        = cached.info;
    const downloadUrl = format === 'zip' ? info.zipball_url : info.tarball_url;
    const fileName    = `${info.name}.${format === 'zip' ? 'zip' : 'tar.gz'}`;
    const mimetype    = format === 'zip' ? 'application/zip' : 'application/x-tar';
    const ext         = format === 'zip' ? 'ZIP' : 'TAR.GZ';

    await m.react('⏳');

    try {
      const loadingMsg = await m.reply(`> 📥 Mengunduh repository...\n> ⏱️ Ukuran: ~${formatSize(info.size * 1024)}\n\n> 💡 Proses mungkin memakan waktu`);

      await conn.sendMessage(chatId, {
        document: { url: downloadUrl },
        fileName,
        mimetype,
        caption:
          `> 📦 *GitHub Repository*\n\n` +
          `> 📁 *Name:* ${info.full_name}\n` +
          `> 📊 *Size:* ${formatSize(info.size * 1024)}\n` +
          `> 📝 *Format:* ${ext}\n` +
          `> ⚡ *Energy:* -15⚡\n\n` +
          `> ✅ Download berhasil!`,
      }, { quoted: m.fakeObj || m });

      if (loadingMsg?.key) await conn.sendMessage(chatId, { delete: loadingMsg.key });
      await m.react('✅');

    } catch (err) {
      await m.react('❌');
      await m.reply(
        `> ❌ Gagal mendownload repository.\n\n` +
        `> 🔗 Download manual:\n> ${downloadUrl}\n\n` +
        `> 💡 Ukuran terlalu besar atau koneksi bermasalah.`
      );
    }

    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 📦 *GITHUB DOWNLOADER*\n\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> ${prefix}github <url>\n\n` +
      `> 🎯 *Support:*\n` +
      `> • Public Repository\n` +
      `> • ZIP & TAR.GZ format\n` +
      `> • Full repository info\n\n` +
      `> 💡 *Contoh:*\n` +
      `> ${prefix}github https://github.com/DyyEuuee/somnia-md\n\n` +
      `> ⚡ Energy: 15⚡ per download\n\n` +
      `> 📋 *Format URL:*\n` +
      `> • https://github.com/user/repo\n` +
      `> • github.com/user/repo\n` +
      `> • git@github.com:user/repo.git`
    );
  }

  const parsed = parseGitHubUrl(text);
  if (!parsed) {
    await m.react('❌');
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n\n` +
      `> 📝 Format URL yang benar:\n` +
      `> • https://github.com/user/repo\n` +
      `> • github.com/user/repo\n` +
      `> • git@github.com:user/repo.git\n\n` +
      `> 💡 Contoh: ${prefix}github https://github.com/DyyEuuee/somnia-md`
    );
  }

  await m.react('⏳');
  const processingMsg = await m.reply(`> 🔍 Mengambil info repository...\n> ⏱️ Mohon tunggu sebentar`);

  const info = await getRepoInfo(parsed.user, parsed.repo);

  if (!info.success) {
    await m.react('❌');
    let errorMsg = `> ❌ *GAGAL MENGAMBIL INFO*\n\n> 🔧 Error: ${info.error}\n\n`;
    if (info.error === 'Repository not found') {
      errorMsg += `> 💡 *Kemungkinan:*\n> • Repository tidak ada\n> • Repository private\n> • URL salah ketik`;
    } else if (info.error === 'API rate limit exceeded') {
      errorMsg += `> 💡 *GitHub API Rate Limit!*\n> • Coba lagi dalam 1 jam`;
    } else {
      errorMsg += `> 💡 Cek koneksi dan pastikan repository public`;
    }
    if (processingMsg?.key) await conn.sendMessage(chatId, { delete: processingMsg.key });
    return m.reply(errorMsg);
  }

  if (info.is_private) {
    await m.react('🔒');
    if (processingMsg?.key) await conn.sendMessage(chatId, { delete: processingMsg.key });
    return m.reply(
      `> 🔒 *REPOSITORY PRIVATE*\n\n` +
      `> 📁 *Repository:* ${info.full_name}\n\n` +
      `> ❌ Tidak dapat mendownload repository private.\n\n` +
      `> 💡 *Solusi:*\n` +
      `> • Buat repository menjadi public\n` +
      `> • Clone manual menggunakan access token`
    );
  }

  const cacheKey = `${chatId}_${sender}_git`;
  githubCache.set(cacheKey, { info, url: text, timestamp: Date.now() });
  setTimeout(() => githubCache.delete(cacheKey), 600000);

  if (processingMsg?.key) await conn.sendMessage(chatId, { delete: processingMsg.key });

  const repoText =
    `📦 *GITHUB REPOSITORY*\n\n` +
    `📁 *Name:* ${info.full_name}\n` +
    `👤 *Owner:* ${info.owner}\n` +
    `📝 *Description:* ${info.description}\n\n` +
    `📊 *Stats:*\n` +
    `⭐ Stars: ${info.stars.toLocaleString()}\n` +
    `🔱 Forks: ${info.forks.toLocaleString()}\n` +
    `👁️ Watchers: ${info.watchers.toLocaleString()}\n\n` +
    `💻 *Info:*\n` +
    `🔤 Language: ${info.language}\n` +
    `📦 Size: ${formatSize(info.size * 1024)}\n` +
    `🌿 Branch: ${info.default_branch}\n` +
    `📜 License: ${info.license}\n\n` +
    `📅 *Dates:*\n` +
    `🆕 Created: ${formatDate(info.created_at)}\n` +
    `🔄 Updated: ${formatDate(info.updated_at)}\n\n` +
    `🎯 Pilih format download:`;

  try {
    const interactiveMsg = generateWAMessageFromContent(
      chatId,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body:   proto.Message.InteractiveMessage.Body.create({ text: repoText }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: `⚡ Energy: -15⚡ • ${global.botName || 'Bot'}` }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: 'GitHub Downloader', subtitle: info.full_name, hasMediaAttachment: false,
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '📦 Download ZIP', id: `${prefix}gitclone zip` }),
                  },
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '📦 Download TAR.GZ', id: `${prefix}gitclone tar` }),
                  },
                  {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({ display_text: '🔗 Open in GitHub', url: info.html_url, merchant_url: info.html_url }),
                  },
                ],
              }),
            }),
          },
        },
      }),
      { quoted: m.fakeObj || m }
    );

    await conn.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    await m.react('✅');

  } catch {
    await m.reply(
      `> 📦 *GITHUB REPOSITORY*\n\n` +
      `> 📁 *Name:* ${info.full_name}\n` +
      `> 👤 *Owner:* ${info.owner}\n` +
      `> 📝 *Desc:* ${info.description}\n\n` +
      `> ⭐ Stars: ${info.stars.toLocaleString()}  🔱 Forks: ${info.forks.toLocaleString()}\n` +
      `> 🔤 Language: ${info.language}  📦 Size: ${formatSize(info.size * 1024)}\n` +
      `> 🌿 Branch: ${info.default_branch}  📜 License: ${info.license}\n\n` +
      `> 📥 *Download:*\n` +
      `> ZIP: ${prefix}gitclone zip\n` +
      `> TAR.GZ: ${prefix}gitclone tar\n\n` +
      `> 🔗 ${info.html_url}\n\n> ⚡ Energy: -15⚡`
    );
    await m.react('✅');
  }
};

handler.command  = ['github', 'gitclone'];
handler.category = 'downloader';
handler.description = 'Download GitHub Repository (ZIP/TAR.GZ)';

export default handler;
