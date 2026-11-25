/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

const FOOTER = 'with love, elyra !!'
const pick = a => a[Math.floor(Math.random() * a.length)]
const sleep = ms => new Promise(r => setTimeout(r, ms))
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }

const SIGNS = ['aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn']
const LOVE = ['Obrolan ringan hari ini bisa jadi awal kedekatan.', 'Dengarkan lebih banyak, bicara secukupnya.', 'Tunjukkan perhatian lewat hal kecil.', 'Hindari baper berlebihan, nikmati prosesnya.', 'Kejujuran membuat hubungan lebih tenang.']
const WORK = ['Fokus satu tugas dulu, jangan semuanya sekaligus.', 'Ide lamamu layak dicoba lagi.', 'Kerja sama tim membawa hasil lebih baik.', 'Catat target kecil dan selesaikan satu per satu.', 'Jangan ragu bertanya kalau belum paham.']
const MONEY = ['Tahan dulu belanja impulsif.', 'Ada peluang rezeki kecil, syukuri.', 'Rapikan catatan pengeluaranmu.', 'Menabung sedikit tapi rutin lebih baik.', 'Pertimbangkan dua kali sebelum meminjam.']
const TIPS = ['Minum air yang cukup.', 'Jangan lupa istirahat.', 'Rapikan meja kerjamu.', 'Telepon orang yang kamu sayang.', 'Jalan kaki sebentar hari ini.']
const RAMAL2 = [
    '💸 Akan jadi sultan dadakan dari giveaway yang gak sengaja diikutin.',
    '💔 Akan ditikung sahabat sendiri, tapi tetap ikhlas karena jodoh gak ke mana.',
    '🛌 Kamu akan tidur 14 jam dan bangun tetap capek.',
    '📱 HP kamu akan jatuh tapi nggak lecet. Cuma mental kamu yang retak.',
    '🎓 Kamu akan lulus... dari hubungan tanpa kejelasan.',
    '📉 Akan investasi kripto, tapi malah beli token tipu-tipu.',
    '🛍️ Kamu akan belanja banyak, tapi lupa bayar listrik.',
    '👽 Alien bakal culik kamu karena mengira kamu spesies langka.',
    '💘 Akan jatuh cinta sama orang yang ngira kamu bot.',
    '😂 Kamu akan ketawa hari ini gara-gara baca pesan ini.'
  ]
const CARDS = [
  ['The Fool', '🃏', 'Awal baru & keberanian. Berani melangkah meski belum siap sepenuhnya.'],
  ['The Magician', '🪄', 'Kamu punya semua alat yang dibutuhkan. Saatnya eksekusi.'],
  ['The High Priestess', '🌙', 'Dengarkan intuisi. Jawabannya sudah ada di dalam.'],
  ['The Empress', '🌸', 'Kelimpahan & kasih sayang. Rawat apa yang kamu tanam.'],
  ['The Emperor', '👑', 'Disiplin & struktur membawa stabilitas.'],
  ['The Lovers', '💞', 'Pilihan penting soal hubungan atau nilai hidup.'],
  ['The Chariot', '🏇', 'Tekad kuat. Fokus pada tujuan, kemenangan dekat.'],
  ['Strength', '🦁', 'Kekuatan lembut. Sabar mengalahkan emosi.'],
  ['The Hermit', '🕯️', 'Waktunya menyendiri & refleksi.'],
  ['Wheel of Fortune', '🎡', 'Nasib berputar. Perubahan akan datang.'],
  ['Justice', '⚖️', 'Keadilan & konsekuensi. Bertindaklah jujur.'],
  ['The Star', '⭐', 'Harapan & pemulihan. Setelah gelap datang terang.'],
  ['The Sun', '☀️', 'Kebahagiaan, sukses, dan energi positif.'],
  ['The Moon', '🌕', 'Ada hal yang belum jelas. Jangan buru-buru memutuskan.'],
  ['Temperance', '🧪', 'Keseimbangan. Jalan tengah adalah yang terbaik.'],
  ['The World', '🌍', 'Penyelesaian & pencapaian. Satu siklus selesai.']
]
const DREAM_LEVELS = ['Lucid ✨', 'Mystic 🌟', 'Ethereal 💫', 'Divine 🌙', 'Legendary 🎇']
const DREAM_QUALITIES = ['Peaceful 😌', 'Adventure 🚀', 'Mystical 🔮', 'Prophecy 📖', 'Epic 🗺️']
const D_ELEMENTS = [
    '🌊 Lautan Kristal Bercahaya',
    '🌈 Pelangi Mengambang',
    '🌺 Taman Melayang',
    '⭐ Konstelasi Hidup',
    '🌙 Bulan Kembar',
    '🏰 Kastil Awan',
    '🌋 Gunung Prisma',
    '🎭 Theater Bayangan'
]
const D_EVENTS = [
    '🦋 Kupu-kupu membawa pesan rahasia',
    '🎭 Topeng menari sendiri',
    '🌊 Hujan bintang jatuh ke laut',
    '🎪 Parade makhluk ajaib',
    '🌺 Bunga bernyanyi lagu kuno',
    '🎨 Lukisan menjadi hidup',
    '🎵 Musik terlihat sebagai warna',
    '⚡ Petir membentuk tangga ke langit'
]
const D_ENCOUNTERS = [
    '🐉 Naga Pelangi Bijaksana',
    '🧙‍♂️ Penyihir Bintang',
    '🦊 Rubah Spirit Sembilan Ekor',
    '🧝‍♀️ Peri Pembawa Mimpi',
    '🦁 Singa Kristal',
    '🐋 Paus Terbang Mistis',
    '🦅 Burung Phoenix Waktu',
    '🐢 Kura-kura Pembawa Dunia',
    '🦄 Unicorn Dimensi'
]
const D_POWERS = [
    '✨ Mengendalikan Waktu',
    '🌊 Berbicara dengan Elemen',
    '🎭 Shapeshifting',
    '🌈 Manipulasi Realitas',
    '👁️ Penglihatan Masa Depan',
    '🎪 Teleportasi Dimensi',
    '🌙 Penyembuhan Spiritual',
    '⚡ Energi Kosmik'
]
const D_MESSAGES = [
    'Perjalananmu akan membawa perubahan besar',
    'Rahasia kuno akan terungkap dalam waktu dekat',
    'Kekuatan tersembunyi akan segera bangkit',
    'Takdir baru menanti di horizon',
    'Koneksi spiritual akan menguat',
    'Transformasi besar akan terjadi',
    'Pencerahan akan datang dari arah tak terduga',
    'Misi penting akan segera dimulai'
]
const S_ELEMENTS = ['Api 🔥', 'Air 💧', 'Tanah 🌍', 'Angin 🌪️', 'Petir ⚡', 'Es ❄️', 'Cahaya ✨', 'Bayangan 🌑']
const S_ZODIAC = ['♈ Aries', '♉ Taurus', '♊ Gemini', '♋ Cancer', '♌ Leo', '♍ Virgo',
               '♎ Libra', '♏ Scorpio', '♐ Sagittarius', '♑ Capricorn', '♒ Aquarius', '♓ Pisces']
const S_TYPES = [
    "Pemimpin Yang Berani", "Penyeimbang Bijaksana", "Kreator Ekspresif", "Pembangun Solid",
    "Petualang Bebas", "Pelindung Setia", "Pemikir Mistis", "Penakluk Kuat", "Humanitarian Murni"
]

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')

const CUT = [[1, 20, 'aquarius'], [2, 19, 'pisces'], [3, 21, 'aries'], [4, 20, 'taurus'], [5, 21, 'gemini'], [6, 21, 'cancer'], [7, 23, 'leo'], [8, 23, 'virgo'], [9, 23, 'libra'], [10, 23, 'scorpio'], [11, 22, 'sagitarius'], [12, 22, 'capricorn']]
const zodiac = (day, month) => {
  let r = 'capricorn'
  for (const [mo, d, name] of CUT) if (month > mo || (month === mo && day >= d)) r = name
  return r
}

const seeded = seed => {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296)
}

const E = {}
const add = (key, cmds, run) => { E[key] = { cmds, run } }

add('ramalan', ['ramalan', 'horoskop'], ({ m, text, command, p }) => {
  const raw = String(text || '').trim().split(/\s+/)[0].toLowerCase()
  let sign = SIGNS.find(s => s === raw || (raw.length >= 3 && s.startsWith(raw)))
  const dm = raw.match(/^(\d{1,2})[-/.](\d{1,2})/)
  if (!sign && dm) sign = zodiac(Number(dm[1]), Number(dm[2]))
  if (!sign) return m.reply(usage('🔮', 'Ramalan Zodiak', ['Masukkan zodiak atau tanggal lahir.', '', `♡ ${p}${command} leo`, `♡ ${p}${command} 17-08`, '', `Zodiak: ${SIGNS.join(', ')}`]))
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
  const r = seeded(`${sign}-${today}`)
  const pk = a => a[Math.floor(r() * a.length)]
  const stars = () => '⭐'.repeat(1 + Math.floor(r() * 5))
  const tgl = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', weekday: 'long', day: 'numeric', month: 'long' })
  return m.reply(box('🔮', `Ramalan ${sign[0].toUpperCase() + sign.slice(1)}`, [
    `_${tgl}_`, '',
    `💘 Cinta ${stars()}`, `♡ ${pk(LOVE)}`, '',
    `💼 Karier ${stars()}`, `♡ ${pk(WORK)}`, '',
    `💰 Keuangan ${stars()}`, `♡ ${pk(MONEY)}`, '',
    `🍀 Angka keberuntungan : ${Math.floor(r() * 99) + 1}`,
    `💡 Saran : ${pk(TIPS)}`
  ].join('\n'), '_Hanya hiburan, bukan ramalan sungguhan._'))
})

add('ramal', ['ramal'], ({ m, text }) => {
  const nama = String(text || '').trim() || m.pushName || 'Kamu'
  return m.reply(box('🔮', 'Ramalan Masa Depan', `${nama}, ${pick(RAMAL2)}`))
})

add('tarot', ['tarot', 'kartutarot'], ({ m, text }) => {
  const three = ['3', 'tiga'].includes(String(text || '').trim().toLowerCase())
  const deck = shuffle(CARDS)
  const pos = three ? ['⏮️ Masa Lalu', '⏺️ Saat Ini', '⏭️ Masa Depan'] : ['🎴 Kartumu']
  const lines = pos.map((ps, i) => {
    const [n, e, mm] = deck[i]
    const rev = Math.random() < 0.3
    return `*${ps}*\n${e} *${n}*${rev ? ' (terbalik)' : ''}\n_${rev ? 'Waspada: ' : ''}${mm}_`
  })
  return m.reply(box('🔮', 'Tarot Reading', lines.join('\n\n'), '_Hanya hiburan & bahan renungan._'))
})

add('mimpi', ['mimpi', 'dream', 'dreamworld'], async ({ m, text }) => {
  const name = String(text || '').trim() || m.pushName || String(m.sender).split('@')[0]
  const seedNum = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0)
  const fix = a => a[seedNum % a.length]
  const multi = (a, n) => shuffle(a).slice(0, n)
  const list = a => a.map(x => `  ♡ ${x}`).join('\n')
  await m.reply('🌙 *Memasuki alam mimpi...*')
  await sleep(1500)
  return m.reply(box('🌙', 'Dream World', [
    `♡ Explorer : ${name}`,
    `♡ Level    : ${fix(DREAM_LEVELS)}`,
    `♡ Quality  : ${fix(DREAM_QUALITIES)}`,
    '', '🌈 *Elements*', list(multi(D_ELEMENTS, 3)),
    '', '🎪 *Events*', list(multi(D_EVENTS, 2)),
    '', '🌟 *Encounters*', list(multi(D_ENCOUNTERS, 2)),
    '', '💫 *Powers*', list(multi(D_POWERS, 2)),
    '', '🔮 *Message*', fix(D_MESSAGES)
  ].join('\n')))
})

add('soulmatch', ['soulmatch'], ({ m, text, command, p }) => {
  const t = String(text || '')
  if (!t.includes('|')) return m.reply(usage('💫', 'Soul Match', ['Cek kecocokan jiwa 2 orang.', '', `♡ ${p}${command} Raiden|Mei`]))
  const [n1, n2] = t.split('|').map(x => x.trim())
  if (!n1 || !n2) return m.gagal(`Masukkan 2 nama dengan format ${p}${command} nama1|nama2`, 'Soul Match')
  const soul = (name, seed) => {
    const v = Array.from(name.toLowerCase()).reduce((a, c) => a + c.charCodeAt(0), 0)
    return { el: S_ELEMENTS[(v + seed) % S_ELEMENTS.length], zo: S_ZODIAC[(v + seed * 2) % S_ZODIAC.length], ty: S_TYPES[(v + seed * 3) % S_TYPES.length] }
  }
  const a = soul(n1, Date.now() % 100), b = soul(n2, (Date.now() + 50) % 100)
  const score = (Array.from(n1.toLowerCase() + n2.toLowerCase()).reduce((x, c) => x + c.charCodeAt(0), 0) % 51) + 50
  const desc = score >= 90 ? '💫 Takdir Sejati' : score >= 80 ? '✨ Harmoni Sempurna' : score >= 70 ? '🌟 Koneksi Kuat' : score >= 60 ? '⭐ Potensi Bagus' : '🌙 Perlu Perjuangan'
  const read = score >= 80 ? 'Jiwa kalian punya koneksi yang istimewa dan langka. Takdir telah merencanakan pertemuan ini.'
    : score >= 60 ? 'Ada chemistry yang kuat di antara kalian. Perbedaan justru menciptakan harmoni.'
    : 'Butuh waktu untuk saling memahami. Setiap tantangan akan memperkuat ikatan kalian.'
  const row = (n, s) => `👤 *${n}*\n♡ Soul    : ${s.ty}\n♡ Element : ${s.el}\n♡ Zodiac  : ${s.zo}`
  return m.reply(box('💫', 'Soul Match', `${row(n1, a)}\n\n${row(n2, b)}\n\n♡ Skor   : *${score}%*\n♡ Status : ${desc}\n\n🔮 ${read}`))
})

const MAP = {}
for (const [key, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/ramalan] command ganda: ${c}`)
  MAP[c] = key
}

let handler = async (m, { text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const key = MAP[cmd]
  if (!key) return
  try {
    return await E[key].run({ m, text, command: cmd, p })
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Ramalan')
  }
}

handler.help = ['ramalan <zodiak|tgl-bln>', 'ramal', 'tarot [3]', 'mimpi <nama>', 'soulmatch nama1|nama2']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
