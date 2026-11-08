/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { AIRich } from 'elyra-baileys'

const LOGO_KOMUNITAS = 'https://raw.githubusercontent.com/Lynxcode-id/picture/main/1793014664390.jpeg'
const LOGO_BOT = 'https://raw.githubusercontent.com/its-dinda/image/main/1793884065104.jpeg'

const REPO_URL = 'https://github.com/Lynx-decode/ERINE-AI'
const ELYRINE_URL = 'https://github.com/Lynxcode-id/elyrine'
const BASE_URL = 'https://github.com/ShirokamiRyzen/Nao-MD'
const BAILEYS_URL = 'https://github.com/Lynxcode-id/elyra-baileys'

const CH_DEV = 'https://whatsapp.com/channel/0029VbAnuii6GcGCu73oep1i'
const CH_CODE = 'https://whatsapp.com/channel/0029VbCUDdOHFxOyVb2Hfe2X'
const CH_API = 'https://whatsapp.com/channel/0029VbCMzVqE50UZAnV44u05'

const OWNER_1 = '6288258041396'
const OWNER_2 = '6281362133135'

const FOOTER = '© Elyra Labs'

const GITHUB_REPOS = [
  {
    name: 'ERINE-AI',
    owner: 'Lynx-decode',
    repo: 'ERINE-AI'
  },
  {
    name: 'Elyra Baileys',
    owner: 'Lynxcode-id',
    repo: 'elyra-baileys'
  },
  {
    name: 'Nao-MD',
    owner: 'ShirokamiRyzen',
    repo: 'Nao-MD'
  },
  {
    name: '@itsliaaa/baileys',
    owner: 'itsliaaa',
    repo: 'baileys'
  },
  {
    name: 'WhiskeySockets Baileys',
    owner: 'WhiskeySockets',
    repo: 'Baileys'
  },
  {
    name: 'MessageBuilder',
    owner: 'FgsiDev',
    repo: 'Baileys-MessageBuilder'
  }
]

const GITHUB_CACHE = new Map()
const GITHUB_CACHE_TTL = 60 * 60 * 1000
const MAX_CONTRIBUTORS = 8

async function getGitHubContributors(owner, repo) {
  const key = `${owner}/${repo}`
  const cached = GITHUB_CACHE.get(key)

  if (cached && Date.now() - cached.time < GITHUB_CACHE_TTL) {
    return cached
  }

  const endpoint =
    `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(12000),
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ERINE-AI-Credits'
      }
    })

    if (!response.ok) {
      const result = {
        time: Date.now(),
        available: false,
        contributors: []
      }

      GITHUB_CACHE.set(key, result)
      return result
    }

    const data = await response.json()

    const contributors = Array.isArray(data)
      ? data
          .filter(user =>
            user?.login &&
            !user.login.endsWith('[bot]')
          )
          .slice(0, MAX_CONTRIBUTORS)
          .map(user => ({
            username: user.login,
            commits: user.contributions,
            profile: user.html_url
          }))
      : []

    const result = {
      time: Date.now(),
      available: true,
      contributors
    }

    GITHUB_CACHE.set(key, result)
    return result
  } catch (error) {
    console.error(
      `[CREDITS GITHUB] ${key}:`,
      error.message
    )

    return {
      time: Date.now(),
      available: false,
      contributors: []
    }
  }
}

async function createGitHubSection() {
  const results = await Promise.all(
    GITHUB_REPOS.map(async repository => {
      const contributors = await getGitHubContributors(
        repository.owner,
        repository.repo
      )

      return {
        ...repository,
        ...contributors
      }
    })
  )

  const output = [
    '📊 *GitHub Contributors — Live Data*',
    '',
    'Daftar kontributor diambil langsung dari GitHub REST API.',
    `Maksimal ${MAX_CONTRIBUTORS} kontributor teratas ditampilkan per repository.`,
    ''
  ]

  for (const item of results) {
    const graph =
      `https://github.com/${item.owner}/${item.repo}/graphs/contributors`

    output.push(`▸ *${item.name}*`)

    if (!item.available) {
      output.push('  Data tidak tersedia melalui GitHub API publik.')
    } else if (!item.contributors.length) {
      output.push('  Belum ada data kontributor yang dapat ditampilkan.')
    } else {
      for (const contributor of item.contributors) {
        output.push(
          `  • ${contributor.username} — ${contributor.commits} commits`
        )
      }
    }

    output.push(`  Contributors: ${graph}`)
    output.push('')
  }

  output.push(
    'Catatan: daftar ini merupakan data kontribusi commit GitHub, bukan penilaian keseluruhan kontribusi pengembangan.'
  )

  return output.join('\n')
}

const sections = [
  [
    '🌷 *ELYRINE MD — PROJECT CREDITS*',
    '',
    '♡ Nama Project : Elyrine MD',
    '♡ Identity : ERINE-AI / ELYRA',
    '♡ Platform : WhatsApp Multi-Device',
    '♡ Runtime : Node.js',
    '♡ Architecture : JavaScript ESM',
    '♡ Main Language : JavaScript',
    '♡ License : Mengikuti lisensi masing-masing upstream',
    '',
    `♡ Main Repository : ${REPO_URL}`,
    `♡ Elyrine Repository : ${ELYRINE_URL}`,
    `♡ Custom Baileys : ${BAILEYS_URL}`,
    `♡ Base Script : ${BASE_URL}`
  ],

  [
    '🌱 *PROJECT FOUNDER & DEVELOPMENT*',
    '',
    '01. Founder / Lead Developer : Lynx Decode',
    '02. Real Name : Arman Maulana',
    '03. Project Maintainer : Lynx Decode',
    '04. Main Development : Elyra Labs',
    "05. Development Infrastructure : INF Project's",
    '06. Source Maintenance : Elyra Labs Team',
    '07. Quality Control : Lynx Decode',
    '08. Feature Development : Lynx Decode & Contributors',
    '',
    '🏛️ *COMMUNITY STRUCTURE*',
    '♡ Parent Community : General District Ofc',
    '♡ Development Laboratory : Elyra Labs Corp',
    "♡ Community Support : INF Project's"
  ],

  [
    '📦 *BASE SCRIPT & ORIGINAL SOURCE*',
    '',
    '♡ Base Project : Nao-MD',
    '♡ Original Developer : Fatih Firdaus',
    '♡ GitHub : ShirokamiRyzen',
    `♡ Repository : ${BASE_URL}`,
    '♡ Architecture : Node.js / ESM / WhatsApp MD',
    '♡ Original License : GPL-3.0',
    '',
    'Nao-MD merupakan salah satu sumber dasar pengembangan.',
    'Pengembangan Elyrine dilakukan melalui modifikasi, penyesuaian arsitektur, penambahan fitur, serta pemeliharaan tersendiri.',
    '',
    '⚠️ Pertahankan pemberitahuan lisensi dan hak cipta upstream yang berlaku.'
  ],

  [
    '⚙️ *BAILEYS FORK LINEAGE*',
    '',
    'Elyra Baileys',
    '      ↓',
    '@vanzxy/baileys',
    '      ↓',
    '@itsliaaa/baileys',
    '      ↓',
    'WhiskeySockets/Baileys',
    '',
    '01. WhiskeySockets/Baileys',
    '    Original upstream project.',
    '    Maintainer / Copyright : Rajeh Taher / WhiskeySockets.',
    '',
    '02. Original Baileys contributors',
    '    • adiwajshing',
    '    • purpshell',
    '    • jlucaso1',
    '',
    '03. @itsliaaa/baileys',
    '    Developer : Lia Wynn / itsliaaa.',
    '    Enhancements : Newsletter upload, interactive messages, album, auth utilities, and additional message types.',
    '',
    '04. @vanzxy/baileys',
    '    Dicantumkan sebagai bagian dari jalur fork berdasarkan catatan proyek.',
    '    Versi dan sumber dependency aktif harus dicocokkan dengan package-lock.json.',
    '',
    `05. Elyra Baileys`,
    '    Maintainer : Lynx Decode / Elyra Labs.',
    `    Repository : ${BAILEYS_URL}`,
    '',
    '06. Protocol Buffer',
    '    WPP Connect — wa-proto.',
    '',
    'Seluruh upstream dan pengembang fork tetap memperoleh atribusi sesuai kontribusi serta lisensinya.'
  ],

  [
    '🧩 *MESSAGE BUILDER & RICH COMPONENTS*',
    '',
    '01. Nixel (NIXCODE)',
    '    Original MessageBuilder author.',
    '',
    '02. Ahmad Tumbuh Kembang',
    '    MessageBuilder contributor.',
    '',
    '03. FongsiDev / FgsiDev',
    '    MessageBuilder contributor and package publisher.',
    '',
    '04. Lia Wynn / itsliaaa',
    '    Baileys fork enhancements and sticker toolkit.',
    '',
    '05. vinikjkkj',
    '    Zapo protocol and messaging ecosystem.',
    '',
    '🔗 Related source repositories:',
    '• https://github.com/FgsiDev/Baileys-MessageBuilder',
    '• https://github.com/rexxhayanasi/elaina-baileys',
    '• https://github.com/itsliaaa/baileys',
    '• https://github.com/itsliaaa/starseal',
    '• https://github.com/vinikjkkj/zapo'
  ],

  [
    '🔬 *BAILEYS EXTENSION CONTRIBUTORS*',
    '',
    '01. Lia Wynn / itsliaaa',
    '    SQLite authentication, WAProto updates, newsletter media upload, and interactive messaging.',
    '',
    '02. Nixel & Ahmad Tumbuh Kembang',
    '    MessageBuilder, AIRich, Button, Carousel, and related toolkit.',
    '',
    '03. FongsiDev / FgsiDev',
    '    MessageBuilder integration and distribution.',
    '',
    '04. vinikjkkj',
    '    Zapo protocol, message handling, and button/list-related adjustments.',
    '',
    '05. QueenAnya',
    '    Button helper, native-flow layer, username management, and framework improvements.',
    '',
    '06. LuferOS',
    '    Bot framework and TypeScript rewrite lineage.',
    '',
    '07. innovatorssoft',
    '    Rich response, cache manager, chat controls, and message utilities.',
    '',
    '08. JAPofc / J.AP',
    '    Auto reconnect, auth utilities, humanizer, mock socket, Meta AI, JID tools, and voice-note utilities.',
    '',
    '09. nexustechpro2',
    '    Additional USync protocol support.',
    '',
    '10. lpzeravk / systemzero',
    '     Reconnect backoff, Bad MAC handling, and connection watchdog.',
    '',
    '11. ourin-baileys',
    '     VoIP WASM call stack, WebRTC relay, and newsletter extensions.',
    '',
    '12. rexxhayanasi',
    '     Group metadata cache and username utilities.',
    '',
    '13. kangwifi72',
    '     Disconnect reason and phone utilities.',
    '',
    '14. xbibzlibrary',
    '     Pairing utilities and text formatting.',
    '',
    '15. betton',
    '     Builder upgrade pass.',
    '',
    '🔗 Additional source repositories:',
    '• https://github.com/JAPofc/baileys',
    '• https://github.com/innovatorssoft/Baileys',
    '• https://github.com/QueenAnya/Bail',
    '• https://github.com/nexustechpro2/baileys'
  ],

  [
    '✨ *FEATURE CONTRIBUTORS — ELYRINE*',
    '',
    '01. Lynx Decode',
    '    Core development, plugin architecture, system integration, and maintenance.',
    '',
    '02. Dinda Novelina',
    '    Feature and project contribution.',
    '',
    '03. Elyra Labs Team',
    '    Testing, feature review, quality control, and development support.',
    '',
    '04. Community contributors',
    '    Feedback, bug reports, testing, and technical suggestions.',
    '',
    'Terima kasih kepada seluruh pihak yang berkontribusi dalam proses pengembangan.'
  ],

  [
    '🌐 *REST API — PROJECT INTEGRATIONS*',
    '',
    '01. Lynx APIs',
    '    Domain : lynxapis.my.id',
    '    Developer : Lynx Decode',
    '    Integrasi : Image processing, background removal, downloader, and media utilities.',
    '    Example : /api/image/remove-bg',
    '',
    '02. Theresa API',
    '    Domain : api.theresav.eu',
    '    Creator : Blackrosé',
    '    Integrasi : Pinterest downloader, Spotify search, Claude AI, ChatGPT AI.',
    '    Endpoints:',
    '    • /api/download/pinterest',
    '    • /api/search/spotify',
    '    • /api/ai/claude',
    '    • /api/ai/chatgpt',
    '',
    '03. Faa API',
    '    Domain : api-faa.my.id',
    '    Creator : Faa',
    '    Integrasi : Lyrics search.',
    '    Endpoint : /faa/lyrics',
    '',
    '04. NexaDev API',
    '    Domain : api.nexadev.my.id',
    '    Creator : NexaDev',
    '    Integrasi : Facebook downloader dan CapCut downloader.',
    '    Endpoints:',
    '    • /api/fb',
    '    • /api/capcut',
    '',
    '05. Ryzumi API',
    '    Domain : api.ryzumi.net',
    '    Developer : Fatih Firdaus / ShirokamiRyzen.',
    '    Integrasi : Utilities, uploader, dan media-related services.',
    '',
    '06. MyQuran API',
    '    Domain : api.myquran.com',
    '    Integrasi : Jadwal sholat, data kota, kalender Hijriah, dan arah kiblat.',
    '',
    '07. SimSimi API',
    '    Domain : o.simsimi.com',
    '    Integrasi : Chat / conversational response.',
    '',
    '08. IPWhois',
    '    Domain : ipwho.is',
    '    Integrasi : Informasi alamat IP dan jaringan.',
    '',
    '09. Noxxyrorr',
    '    Domain : am.noxxyrorr.biz.id',
    '    Integrasi : Verifikasi email.',
    '',
    '10. Emailnator',
    '     Domain : emailnator.com',
    '     Integrasi : Temporary email service.',
    '',
    '11. Nexray',
    '     Domain : api.nexray.web.id',
    '     Integrasi : Media uploader.',
    '',
    'REST API yang menggunakan autentikasi mengikuti konfigurasi API key masing-masing.'
  ],

  [
    '📤 *UPLOADER & MEDIA HOSTING*',
    '',
    '01. TermAI CDN',
    '    Domain : c.termai.cc',
    '    Fungsi : Upload gambar dan file.',
    '',
    '02. Catbox',
    '    Domain : catbox.moe',
    '    Fungsi : Media hosting.',
    '',
    '03. Uguu',
    '    Domain : uguu.se',
    '    Fungsi : Temporary file hosting.',
    '',
    '04. TmpFiles',
    '    Domain : tmpfiles.org',
    '    Fungsi : Temporary file hosting.',
    '',
    '05. Ryzumi CDN',
    '    Domain : r1.ryzumi.net',
    '    Fungsi : Media CDN sesuai layanan Ryzumi.',
    '',
    'Penggunaan uploader mengikuti ketersediaan layanan dan kebijakan masing-masing penyedia.'
  ],

  [
    '🛠️ *EXTERNAL TOOLS & SERVICES*',
    '',
    '01. EzEnhancer AI',
    '    Image enhancement dan upscaling.',
    '',
    '02. EZGIF',
    '    WebP, GIF, dan media conversion.',
    '',
    '03. Fast.com',
    '    Internet speed test.',
    '',
    '04. FFmpeg',
    '    Video processing, audio conversion, dan media encoding.',
    '',
    '05. Sharp',
    '    Image processing dan thumbnail manipulation.',
    '',
    '06. node-webpmux',
    '    WebP metadata dan sticker processing.',
    '',
    '07. Starseal',
    '    Sticker creation toolkit dari Lia Wynn.',
    '',
    'Catatan: beberapa layanan pada bagian ini merupakan external tools atau website, bukan seluruhnya REST API.'
  ],

  [
    '🧪 *SCRAPER & COMMUNITY SOURCE*',
    '',
    '01. Remini',
    '    Razeerh.',
    '',
    '02. Fake Call iOS',
    '    Rin Imup / Princes.',
    '',
    '03. Fake Group Chat',
    '    Rin Imup / Princes.',
    '',
    '04. Brat / Brat Video',
    '    Community scraper, disusun ulang oleh Elyrine Team.',
    '',
    '05. Jarvis Meme',
    '    Community scraper, disusun ulang oleh Elyrine Team.',
    '',
    '06. Emailnator',
    '    Adaptasi dan integrasi pada sistem Elyrine.',
    '',
    'Seluruh scraper dan komponen pihak ketiga tetap mengikuti atribusi sumber masing-masing.'
  ],

  [
    '📢 *OFFICIAL CHANNELS*',
    '',
    `♡ Development Channel : ${CH_DEV}`,
    `♡ Share Code Channel : ${CH_CODE}`,
    `♡ REST API Channel : ${CH_API}`,
    '',
    'Follow saluran resmi untuk mendapatkan pembaruan project, source code, API, dan informasi pengembangan.'
  ],

  [
    '📜 *LICENSE & ATTRIBUTION NOTICE*',
    '',
    'Elyrine MD dikembangkan dengan memanfaatkan berbagai proyek open-source dan layanan pihak ketiga.',
    '',
    '• Nao-MD : GPL-3.0.',
    '• WhiskeySockets/Baileys : MIT.',
    '• @itsliaaa/baileys : MIT.',
    '• MessageBuilder : Pertahankan copyright dan ketentuan upstream.',
    '• Starseal : MIT.',
    '',
    'Setiap komponen mengikuti lisensi serta ketentuan redistribusi dari pemilik aslinya.',
    '',
    'Dilarang menghapus atribusi, copyright notice, atau lisensi yang diwajibkan oleh sumber masing-masing.'
  ],

  [
    '🛡️ *DISCLAIMER & REPORT*',
    '',
    '> Infrastruktur dan pengembangan project berada di bawah Elyra Labs.',
    '',
    '> Apabila menemukan penyalahgunaan, pelanggaran, atau distribusi ulang tanpa atribusi yang semestinya, silakan laporkan kepada developer.',
    '',
    `> wa.me/${OWNER_1}`,
    `> wa.me/${OWNER_2}`,
    '',
    '⚠️ *DISCLAIMER*',
    '> ERINE-AI merupakan project independen dan tidak berafiliasi dengan WhatsApp maupun Meta.',
    '',
    '> Layanan API pihak ketiga dapat berubah, mengalami gangguan, atau menghentikan endpoint sewaktu-waktu.',
    '',
    '> Developer tidak bertanggung jawab atas penyalahgunaan sistem oleh pengguna.',
    '',
    '> Gunakan script dengan bijak dan hormati seluruh kontributor.',
    '',
    'Thank you for respecting open-source development. 💐'
  ]
].map(section => section.join('\n'))

async function sendFallback(conn, m, content) {
  const MAX_LENGTH = 3500

  for (let i = 0; i < content.length; i += MAX_LENGTH) {
    await conn.sendMessage(m.chat, {
      text: content.slice(i, i + MAX_LENGTH)
    }, {
      quoted: m
    })
  }
}

const handler = async (m, { conn, usedPrefix }) => {
  const prefix = usedPrefix || '.'

  await m.react('⏳').catch(() => {})

  let githubSection = ''

  try {
    githubSection = await createGitHubSection()

    const allSections = [
      ...sections.slice(0, 6),
      githubSection,
      ...sections.slice(6)
    ]

    const rich = new AIRich(conn)

    let builder = rich

    const use = (method, ...args) => {
      if (typeof builder?.[method] === 'function') {
        builder = builder[method](...args) || builder
      }
    }

    use('setTitle', '🌷 Elyrine MD — Complete Credits')

    use('addProduct', [
      {
        title: 'Elyrine MD - WhatsApp Bot Multi Device',
        brand: 'Lynx Decode',
        price: 'Elyra Labs',
        product_url: REPO_URL,
        icon_url: LOGO_BOT,
        image_url: LOGO_BOT
      },
      {
        title: "INF Project - Elyra Development Community",
        brand: "INF Project's",
        price: 'Development Community',
        product_url: CH_DEV,
        icon_url: LOGO_KOMUNITAS,
        image_url: LOGO_KOMUNITAS
      }
    ])

    for (const section of allSections) {
      use('addText', section)
    }

    use('addSuggest', [
      `${prefix}menu`,
      `${prefix}sc`,
      `${prefix}owner`
    ])

    use('addFooterAction', [
      {
        text: 'Developer Channel',
        url: CH_DEV
      },
      {
        text: 'Share Code',
        url: CH_CODE
      },
      {
        text: 'REST API',
        url: CH_API
      },
      {
        text: 'GitHub Repository',
        url: REPO_URL
      }
    ])

    use('setFooter', FOOTER)

    await builder.send(m.chat, {
      quoted: m
    })

    await m.react('💐').catch(() => {})
  } catch (error) {
    console.error(
      '[ELYRINE CREDITS]',
      error?.stack || error?.message || error
    )

    await m.react('☘️').catch(() => {})

    const fallback = [
      ...sections.slice(0, 6),
      githubSection,
      ...sections.slice(6),
      FOOTER
    ].filter(Boolean).join('\n\n')

    await sendFallback(conn, m, fallback)
  }
}

handler.help = ['credits']
handler.tags = ['info']
handler.command = /^(credits|tqto|thanksto)$/i

export default handler
