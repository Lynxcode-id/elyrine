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

const DEFS = {
 "akankah": {
  "emoji": "🔮",
  "title": "Akankah",
  "alias": [
   "akan",
   "will"
  ],
  "example": "akankah aku sukses?",
  "answers": [
   "Ya, pasti akan terjadi!",
   "Tidak, sepertinya tidak akan.",
   "Mungkin akan, mungkin tidak.",
   "InsyaAllah akan terjadi!",
   "Hmm, sulit diprediksi.",
   "Pasti! Yakin saja!",
   "Kayaknya nggak deh.",
   "Akan terjadi kalau kamu mau berusaha.",
   "Suatu saat nanti, pasti.",
   "Nggak akan, maaf.",
   "Tentu akan! Tunggu saja!",
   "Hmm, aku ragu.",
   "Akan! Percaya sama proses!",
   "Kemungkinannya kecil.",
   "Pasti akan, aku yakin!",
   "Nggak akan, cari yang lain aja.",
   "Akan, tapi butuh waktu.",
   "InsyaAllah!",
   "Kalau jodoh, pasti akan.",
   "Akan terjadi di saat yang tepat!"
  ]
 },
 "bagaimana": {
  "emoji": "📋",
  "title": "Bagaimana",
  "alias": [
   "gimana",
   "how"
  ],
  "example": "bagaimana cara jadi sukses?",
  "answers": [
   "Caranya gampang, ya tinggal dilakuin aja!",
   "Hmm, susah dijelasin sih. Coba aja dulu!",
   "Dengan usaha dan doa pastinya.",
   "Ya begitulah caranya.",
   "Aku kurang tau sih, coba cari referensi lain.",
   "Pelan-pelan aja, nanti juga bisa.",
   "Dengan kerja keras dan pantang menyerah!",
   "Pertama, percaya sama diri sendiri dulu.",
   "Hmm, tiap orang beda-beda sih caranya.",
   "Ikutin kata hatimu aja.",
   "Belajar dari yang sudah berpengalaman.",
   "Step by step, jangan terburu-buru.",
   "Dengan tekad yang kuat!",
   "Mulai dari yang kecil dulu.",
   "Konsisten aja, nanti juga bisa.",
   "Jangan overthinking, langsung action!",
   "Gampang! Tinggal mulai aja!",
   "Caranya? Ya dicoba dulu!",
   "Dengan strategi yang tepat.",
   "Hmm, aku juga masih belajar sih."
  ]
 },
 "berapa": {
  "emoji": "🔢",
  "title": "Berapa",
  "alias": [
   "howmuch",
   "howmany"
  ],
  "example": "berapa umur jodohku?",
  "answers": [
   "1",
   "7",
   "12",
   "21",
   "99",
   "69",
   "100",
   "50",
   "25",
   "1000",
   "5",
   "17",
   "88",
   "33",
   "nothing (jawabannya selalu nothing)",
   "Banyak banget!",
   "Cuma sedikit.",
   "Tak terhitung!",
   "Hmm, sekitar 10-an.",
   "Lebih dari yang kamu kira!",
   "Gak tau ah, males"
  ]
 },
 "bisakah": {
  "emoji": "💪",
  "title": "Bisakah",
  "alias": [
   "bisa"
  ],
  "example": "bisakah aku lulus ujian?",
  "answers": [
   "Bisa banget! Percaya diri aja!",
   "Hmm, kayaknya susah deh.",
   "Tentu bisa! Semangat!",
   "Nggak bisa, maaf.",
   "Mungkin bisa, kalau usaha keras.",
   "Pasti bisa! Jangan menyerah!",
   "Agak susah sih, tapi bisa dicoba.",
   "Bisa kok! Yakin deh!",
   "Kayaknya nggak deh.",
   "Bisa! Ayo buktikan!",
   "Hmm... aku ragu.",
   "Bisa banget! Gas terus!",
   "Nggak bisa, coba yang lain.",
   "Bisa! Percaya sama diri sendiri!",
   "Susah, tapi bukan berarti nggak mungkin.",
   "Absolutely! Kamu pasti bisa!",
   "Kayaknya perlu usaha ekstra nih.",
   "Bisa! Jangan ragukan dirimu!",
   "Hmm, coba lagi nanti deh.",
   "Bisa! Aku percaya kamu!"
  ]
 },
 "dimana": {
  "emoji": "📍",
  "title": "Dimana",
  "alias": [
   "where",
   "mana"
  ],
  "example": "dimana jodohku berada?",
  "answers": [
   "Di dekatmu!",
   "Jauh di sana.",
   "Di tempat yang tidak kamu duga.",
   "Di hatimu.",
   "Di sekitar sini.",
   "Hmm, coba cari di kamar.",
   "Di luar sana, menunggumu.",
   "Di tempat yang sama denganmu.",
   "Di suatu tempat yang indah.",
   "Di balik pintu.",
   "Di sebelah kirimu.",
   "Di depan matamu!",
   "Jauh banget, di luar negeri mungkin?",
   "Di tempat yang penuh kenangan.",
   "Di mana-mana!",
   "Di dunia maya.",
   "Di alam mimpi.",
   "Di tempat rahasia.",
   "Hmm, susah dijelaskan lokasinya.",
   "Di tempat yang akan membuatmu bahagia."
  ]
 },
 "haruskah": {
  "emoji": "⚖️",
  "title": "Haruskah",
  "alias": [
   "harus",
   "should"
  ],
  "example": "haruskah aku menyatakan cinta?",
  "answers": [
   "Ya, harus!",
   "Tidak usah.",
   "Hmm, terserah kamu sih.",
   "Harus banget! Jangan ragu!",
   "Nggak harus juga.",
   "Kalau menurutmu perlu, lakukan!",
   "Pikir dulu baik-baik.",
   "Harus! Sekarang!",
   "Jangan, mending tunggu dulu.",
   "Harus, tapi hati-hati.",
   "Nggak harus, tapi boleh.",
   "Wajib!",
   "Hmm, skip aja deh.",
   "Lakukan kalau sudah yakin.",
   "Harus, demi masa depanmu!",
   "Nggak harus, santai aja.",
   "Go for it!",
   "Jangan buru-buru, pikir lagi.",
   "Tentu harus!",
   "Lihat situasinya dulu."
  ]
 },
 "kapan": {
  "emoji": "⏰",
  "title": "Kapan",
  "alias": [
   "when"
  ],
  "example": "kapan aku nikah?",
  "answers": [
   "Besok mungkin?",
   "Tahun depan kayaknya.",
   "3 hari lagi!",
   "Hmm, masih lama sih.",
   "Sebentar lagi kok!",
   "Kalau sudah waktunya, pasti terjadi.",
   "Bulan depan!",
   "Entah kapan, yang penting sabar.",
   "Dalam waktu dekat!",
   "10 tahun lagi mungkin?",
   "Nggak lama lagi!",
   "Kalau jodoh, pasti ketemu.",
   "Hmm, susah diprediksi.",
   "Minggu depan!",
   "Kalau usahanya lebih keras, lebih cepat!",
   "Pas waktunya tepat.",
   "Secepatnya, tenang aja.",
   "Ntar kalo udah siap.",
   "Dalam hitungan hari!",
   "Saat kamu sudah siap menerimanya."
  ]
 },
 "mengapa": {
  "emoji": "🤔",
  "title": "Mengapa",
  "alias": [
   "kenapa",
   "why"
  ],
  "example": "mengapa langit biru?",
  "answers": [
   "Karena memang sudah takdirnya begitu.",
   "Hmm, pertanyaan bagus! Aku juga bingung.",
   "Karena itulah cara kerjanya.",
   "Karena Tuhan berkehendak demikian.",
   "Aku nggak tau, cari di Google aja.",
   "Karena ya gitu aja.",
   "Mungkin karena kebetulan?",
   "Karena dunia memang penuh misteri.",
   "Hmm, sulit dijelaskan sih.",
   "Karena alam semesta bekerja dengan cara yang misterius.",
   "Aku juga penasaran, kenapa ya?",
   "Karena hal tersebut memang seharusnya terjadi.",
   "Pertanyaan yang bagus! Sayangnya aku nggak punya jawabannya.",
   "Karena itulah keunikan hidup.",
   "Karena setiap hal punya alasannya masing-masing.",
   "Hmm... aku butuh waktu untuk memikirkannya.",
   "Karena begitulah logikanya.",
   "Aku rasa karena memang harus begitu.",
   "Karena segala sesuatu saling berhubungan.",
   "Nah itu aku juga mikir!"
  ]
 },
 "coba": {
  "emoji": "🎯",
  "title": "Coba",
  "alias": [
   "try"
  ],
  "example": "coba tebak apa yang aku pikirkan",
  "answers": [
   "Hmm, aku coba ya... Kamu lagi mikirin makanan!",
   "Aku tebak... Kamu lagi gabut!",
   "Coba ya... Kayaknya kamu lagi seneng!",
   "Hmm, aku rasa kamu lagi bingung.",
   "Aku coba nebak... Kamu lagi kangen seseorang?",
   "Kayaknya kamu lagi santai deh.",
   "Aku tebak kamu lagi scroll HP terus.",
   "Hmm, pasti lagi bosan ya?",
   "Coba ditebak... Kamu lagi pengen jalan-jalan!",
   "Aku rasa kamu lagi butuh hiburan.",
   "Hmm, kayaknya kamu lagi happy!",
   "Aku coba... Kamu pasti lagi penasaran!",
   "Tebakan aku: kamu lagi rebahan.",
   "Hmm, kamu mungkin lagi mikirin seseorang spesial.",
   "Aku coba: kamu lagi mau curhat?",
   "Kayaknya kamu lagi pengen main game!",
   "Hmm, aku tebak kamu lagi dengerin musik.",
   "Coba aku tebak... Kamu lagi di kamar!",
   "Aku rasa kamu lagi waiting for something.",
   "Hmm, tebakan aku: kamu butuh temen ngobrol!"
  ]
 },
 "benarkah": {
  "emoji": "🧐",
  "title": "Benarkah",
  "alias": [],
  "example": "benarkah kamu bot?",
  "answers": [
   "Iya",
   "Sudah pasti",
   "Sudah pasti bisa",
   "Tidak",
   "Tentu tidak",
   "Sudah pasti tidak"
  ]
 },
 "apakah": {
  "emoji": "🎱",
  "title": "Apakah",
  "alias": [
   "8ball"
  ],
  "example": "apakah besok hujan",
  "answers": [
   "Ya",
   "Tidak",
   "Mungkin",
   "Bisa jadi",
   "Jelas tidak",
   "Pasti!",
   "Kayaknya iya",
   "Kayaknya enggak",
   "Tanya lagi nanti"
  ]
 },
 "kerangajaib": {
  "emoji": "🐚",
  "title": "Kerang Ajaib",
  "alias": [
   "kulitkerang",
   "ajaib"
  ],
  "example": "kerangajaib aku alien?",
  "answers": [
   "Mungkin suatu hari",
   "Tidak juga",
   "Tidak keduanya",
   "Kurasa tidak",
   "Ya",
   "Coba tanya lagi",
   "Tidak ada"
  ]
 },
 "kapankah": {
  "emoji": "⏳",
  "title": "Kapankah",
  "alias": [],
  "example": "kapankah aku kaya?",
  "answers": null,
  "nums": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "6",
   "7",
   "8",
   "9",
   "10"
  ],
  "units": [
   "detik",
   "jam",
   "menit",
   "hari",
   "bulan",
   "tahun",
   "abad",
   "minggu",
   "dekade"
  ]
 }
}

const ALASAN_W = [
 "Maaf, tadi sinyalku hilang total",
 "Aku ketiduran, alarm gak bunyi",
 "HP-ku mati kehabisan baterai",
 "Ban motor bocor di jalan",
 "Kucingku sakit mendadak",
 "Listrik padam sejak pagi",
 "Aku lupa kalau hari ini ada acara",
 "Lagi antre panjang banget di bank",
 "Perutku sakit tiba-tiba",
 "Ada tamu dadakan di rumah",
 "Hujan deras, jalanan banjir",
 "Laptop-ku restart sendiri waktu update"
]

const ALASAN_E = [
 "Percayalah, ini kejadian beneran 🙏",
 "Sumpah, bukan alasan dibuat-buat 😭",
 "Besok pasti kuganti ya!",
 "Mohon dimaklumi 🙇"
]

const MAP = {}
for (const [k, d] of Object.entries(DEFS)) {
  MAP[k] = k
  for (const a of d.alias) MAP[a] = k
}
for (const a of ['alasan', 'excuse', 'ngeles']) MAP[a] = 'alasan'

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const key = MAP[cmd]
  if (!key) return
  try {
    if (key === 'alasan') {
      return m.reply(['🙇 *Generator Alasan*', '', `"${pick(ALASAN_W)}. ${pick(ALASAN_E)}"`, '', '_Gunakan dengan tanggung jawab._', '', FOOTER].join('\n'))
    }
    const d = DEFS[key]
    const q = String(text || '').trim()
    if (!q) {
      return m.reply([`${d.emoji} *${d.title}*`, '', 'Tulis pertanyaannya dulu.', '', `♡ ${p}${cmd} ${d.example.replace(/^\S+\s*/, '')}`.trim(), '', FOOTER].join('\n'))
    }
    const jawab = key === 'kapankah'
      ? `${pick(d.nums)} ${pick(d.units)} lagi...`
      : pick(d.answers)
    return m.reply([`${d.emoji} *${d.title}*`, '', `♡ Tanya : ${q}`, `♡ Jawab : ${jawab}`, '', FOOTER].join('\n'))
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Tanya Bot')
  }
}

handler.help = ['akankah', 'apakah', 'bagaimana', 'benarkah', 'berapa', 'bisakah', 'coba', 'dimana', 'haruskah', 'kapan', 'kapankah', 'kerangajaib', 'mengapa', 'alasan'].map(c => c + (c === 'alasan' ? '' : ' <pertanyaan>'))
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
