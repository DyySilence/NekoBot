import fetch from 'node-fetch'
import { format } from 'util'

async function getFileType(buffer) {
  try {
    const { fileTypeFromBuffer } = await import('file-type')
    return await fileTypeFromBuffer(buffer)
  } catch {
    return null
  }
}

async function fetchWithOptions(url, options = {}) {
  const { retries = 3, timeout = 15000 } = options
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(id)
      if (!res.ok) throw new Error(`Request failed with status ${res.status}: ${res.statusText}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      return { response: res, buffer }
    } catch (e) {
      lastError = e
      if (i === retries - 1) throw lastError
    }
  }
}

const handler = async (m, { conn, args, command }) => {
  const usedPrefix = global.prefix || '.'
  const url = args[0]

  if (!url || !/^https?:\/\//.test(url)) {
    return m.reply(
      `URL tidak valid!\n\n` +
      `Gunakan format:\n` +
      `${usedPrefix + command} <url> [---opsi]\n\n` +
      `Contoh:\n` +
      `${usedPrefix + command} https://google.com\n` +
      `${usedPrefix + command} https://google.com ---header\n` +
      `${usedPrefix + command} https://google.com ---jsononly\n` +
      `${usedPrefix + command} https://google.com ---download\n` +
      `${usedPrefix + command} https://google.com ---raw\n` +
      `${usedPrefix + command} https://google.com ---post`
    )
  }

  const isHeaderOnly = args.includes('---header')
  const isDownload   = args.includes('---download')
  const isRaw        = args.includes('---raw')
  const isJsonOnly   = args.includes('---jsononly')
  const isPost       = args.includes('---post')

  const customHeaders = Object.fromEntries(
    args
      .filter(arg => arg.includes(':') && !arg.startsWith('---'))
      .map(line => {
        const [key, ...val] = line.split(':')
        return [key.trim(), val.join(':').trim()]
      })
  )

  try {
    await m.react('⏳')

    const fetchOptions = {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
        ...customHeaders,
      },
    }

    if (global.PROXY) {
      const { default: HttpsProxyAgent } = await import('https-proxy-agent')
      fetchOptions.agent = new HttpsProxyAgent(global.PROXY)
    }

    const { response, buffer } = await fetchWithOptions(url, {
      ...fetchOptions,
      retries: 3,
      timeout: 15000,
    })

    const contentType = response.headers.get('content-type') || ''

    if (isHeaderOnly) {
      const headers = [...response.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')
      return await m.reply(`Header Response:\n\n${headers}`)
    }

    if (contentType.includes('json')) {
      try {
        const json = JSON.parse(buffer.toString())
        const textPreview = format(JSON.stringify(json, null, 2))
        await conn.sendMessage(m.chat, { text: textPreview.slice(0, 65536) }, { quoted: m.fakeObj || m })
        if (isJsonOnly) {
          await conn.sendMessage(m.chat, { document: buffer, fileName: 'data.json', mimetype: 'application/json' }, { quoted: m.fakeObj || m })
        }
        return
      } catch {
        return await m.reply('⚠️ Gagal parsing JSON dari respons.')
      }
    }

    if (contentType.startsWith('text/') || contentType.includes('html')) {
      return await conn.sendMessage(m.chat, { text: buffer.toString().slice(0, 65536) }, { quoted: m.fakeObj || m })
    }

    const fileType = await getFileType(buffer)
    const mime     = fileType?.mime || contentType || 'application/octet-stream'

    if (isDownload || isRaw) {
      return await conn.sendMessage(m.chat, {
        document: buffer,
        fileName: fileType?.ext ? `file.${fileType.ext}` : 'file.bin',
        mimetype: mime,
      }, { quoted: m.fakeObj || m })
    }

    if (mime.startsWith('image/')) {
      await conn.sendMessage(m.chat, { image: buffer, caption: '📷 Image' }, { quoted: m.fakeObj || m })
    } else if (mime.startsWith('video/')) {
      await conn.sendMessage(m.chat, { video: buffer, caption: '🎥 Video' }, { quoted: m.fakeObj || m })
    } else if (mime.startsWith('audio/')) {
      await conn.sendMessage(m.chat, { audio: buffer, mimetype: mime }, { quoted: m.fakeObj || m })
    } else {
      await conn.sendMessage(m.chat, {
        document: buffer,
        fileName: fileType?.ext ? `file.${fileType.ext}` : 'file.bin',
        mimetype: mime,
      }, { quoted: m.fakeObj || m })
    }

    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan:\n\n${err.message || err}`)
  }
}

handler.command     = ['get']
handler.category    = 'tools'
handler.description = 'Fetch URL dan tampilkan isi / download file'

export default handler
