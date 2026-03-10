/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const LANG_MAP = {
  id: { name: "Indonesia",   native: "Bahasa Indonesia" },
  en: { name: "Inggris",     native: "English"          },
  ar: { name: "Arab",        native: "العربية"          },
  ja: { name: "Jepang",      native: "日本語"            },
  ko: { name: "Korea",       native: "한국어"            },
  zh: { name: "Mandarin",    native: "中文"              },
  fr: { name: "Prancis",     native: "Français"         },
  de: { name: "Jerman",      native: "Deutsch"          },
  es: { name: "Spanyol",     native: "Español"          },
  pt: { name: "Portugis",    native: "Português"        },
  ru: { name: "Rusia",       native: "Русский"          },
  it: { name: "Italia",      native: "Italiano"         },
  hi: { name: "Hindi",       native: "हिन्दी"           },
  th: { name: "Thailand",    native: "ภาษาไทย"          },
  ms: { name: "Melayu",      native: "Bahasa Melayu"    },
  jv: { name: "Jawa",        native: "Basa Jawa"        },
  su: { name: "Sunda",       native: "Basa Sunda"       },
  nl: { name: "Belanda",     native: "Nederlands"       },
  tr: { name: "Turki",       native: "Türkçe"           },
  pl: { name: "Polandia",    native: "Polski"           },
  sv: { name: "Swedia",      native: "Svenska"          },
  da: { name: "Denmark",     native: "Dansk"            },
  fi: { name: "Finlandia",   native: "Suomi"            },
  no: { name: "Norwegia",    native: "Norsk"            },
  cs: { name: "Ceko",        native: "Čeština"          },
  hu: { name: "Hungaria",    native: "Magyar"           },
  ro: { name: "Rumania",     native: "Română"           },
  uk: { name: "Ukraina",     native: "Українська"       },
  el: { name: "Yunani",      native: "Ελληνικά"         },
  he: { name: "Ibrani",      native: "עברית"            },
  fa: { name: "Persia",      native: "فارسی"            },
  ur: { name: "Urdu",        native: "اردو"             },
  bn: { name: "Bengali",     native: "বাংলা"            },
  ta: { name: "Tamil",       native: "தமிழ்"            },
  vi: { name: "Vietnam",     native: "Tiếng Việt"       },
  tl: { name: "Tagalog",     native: "Tagalog"          },
  sw: { name: "Swahili",     native: "Kiswahili"        },
  af: { name: "Afrikaans",   native: "Afrikaans"        },
  la: { name: "Latin",       native: "Latina"           },
  eo: { name: "Esperanto",   native: "Esperanto"        },
};

function buildHelpText() {
  const prefix  = global.prefix || ".";
  const entries = Object.entries(LANG_MAP);
  const mid     = Math.ceil(entries.length / 2);
  const colA    = entries.slice(0, mid);
  const colB    = entries.slice(mid);

  let rows = "";
  for (let i = 0; i < colA.length; i++) {
    const [codeA, langA] = colA[i];
    const [codeB, langB] = colB[i] || [];
    const left  = `${codeA.padEnd(5)}${langA.name}`.padEnd(22);
    const right = codeB ? `${codeB.padEnd(5)}${langB.name}` : "";
    rows += `${left}${right}\n`;
  }

  return (
    `🌐 *TRANSLATE — DAFTAR BAHASA*\n\n` +
    `*Format:*\n` +
    `› \`${prefix}tr <kode> <teks>\`\n` +
    `› Reply pesan → \`${prefix}tr <kode>\`\n\n` +
    `*Kode  Bahasa*\n` +
    `${"─".repeat(40)}\n` +
    rows.trimEnd() + "\n" +
    `${"─".repeat(40)}\n\n` +
    `*Contoh:*\n` +
    `› \`${prefix}tr en halo apa kabar\`\n` +
    `› \`${prefix}tr ja selamat pagi\`\n` +
    `› \`${prefix}tr zh 好的，明白了\`\n` +
    `› Reply pesan → \`${prefix}tr id\``
  );
}

async function translateText(text, targetLangName, targetCode) {
  const keys = global.geminiKeys || (global.geminiKey ? [global.geminiKey] : []);
  if (!keys.length) throw new Error("Gemini API key belum diset di config.");

  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];
  let lastError = null;

  for (const apiKey of keys) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of models) {
      try {
        const model  = genAI.getGenerativeModel({ model: modelName });
        const prompt =
          `Terjemahkan teks berikut ke bahasa ${targetLangName} (kode ISO: ${targetCode}).\n` +
          `Pertahankan format, emoji, tanda baca, dan struktur aslinya.\n` +
          `Hanya balas dengan hasil terjemahannya saja. Tanpa penjelasan, tanpa tanda kutip, tanpa label apapun.\n\n` +
          `Teks:\n${text}`;
        const result     = await model.generateContent(prompt);
        const translated = result?.response?.text?.()?.trim();
        if (!translated) throw new Error("Hasil terjemahan kosong.");
        return translated;
      } catch (e) {
        lastError    = e;
        const msg    = String(e?.message || "").toLowerCase();
        if (msg.includes("quota") || msg.includes("limit") || msg.includes("exceeded")) break;
        if (msg.includes("invalid") || msg.includes("api key")) break;
      }
    }
  }

  throw new Error(lastError?.message || "Semua API Key Gemini gagal.");
}

const handler = async (m, { conn, args }) => {
  const prefix  = global.prefix || ".";
  const sub     = (args[0] || "").toLowerCase();
  const allKeys = Object.keys(LANG_MAP);

  if (!sub || sub === "--help" || sub === "help" || sub === "list") {
    return m.reply(buildHelpText());
  }

  const target = LANG_MAP[sub];

  if (!target) {
    const suggestions = allKeys.filter((k) =>
      LANG_MAP[k].name.toLowerCase().includes(sub) || k.startsWith(sub[0])
    ).slice(0, 3);

    let msg = `❌ Kode bahasa *${sub}* tidak dikenali.\n\nKetik \`${prefix}tr --help\` untuk daftar lengkap.`;
    if (suggestions.length) {
      msg += `\n\nMungkin maksud kamu:\n` + suggestions.map((k) => `› \`${prefix}tr ${k}\` — ${LANG_MAP[k].name}`).join("\n");
    }
    return m.reply(msg);
  }

  let sourceText = "";

  if (m.quoted) {
    sourceText = (
      m.quoted.text        ||
      m.quoted.body        ||
      m.quoted.caption     ||
      m.quoted.msg?.caption ||
      m.quoted.msg?.text   ||
      ""
    ).trim();
  }

  const manualText = args.slice(1).join(" ").trim();
  if (!sourceText && manualText) sourceText = manualText;

  if (!sourceText) {
    return m.reply(
      `🌐 *Translate → ${target.name}* (${target.native})\n\n` +
      `Cara pakai:\n` +
      `1. Reply pesan lalu ketik \`${prefix}tr ${sub}\`\n` +
      `2. Atau ketik langsung: \`${prefix}tr ${sub} <teks>\``
    );
  }

  await m.react("🌐");

  try {
    const result = await translateText(sourceText, target.name, sub);
    await m.reply(`${result}`);
    await m.react("✅");
  } catch (err) {
    await m.react("❌");
    await m.reply(`❌ Gagal: ${err.message}`);
  }
};

handler.command     = ["tr", "translate"];
handler.category    = "tools";
handler.description = "Translate teks ke berbagai bahasa | .tr <kode> <teks> | .tr --help";

export default handler;