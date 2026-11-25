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
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const num = j => String(j || '').split('@')[0].split(':')[0]

const TRIVIA = [
	{ q: 'Apa ibu kota Jepang?', a: 'tokyo' },
	{ q: 'Berapa jumlah benua di dunia?', a: '7' },
	{ q: 'Planet apa yang dijuluki Planet Merah?', a: 'mars' },
	{ q: 'Apa nama mata uang Jepang?', a: 'yen' },
	{ q: 'Hewan apa yang dijuluki raja hutan?', a: 'singa' },
	{ q: 'Berapa jumlah hari dalam tahun kabisat?', a: '366' },
	{ q: 'Apa bahasa pemrograman yang dibuat oleh Brendan Eich?', a: 'javascript' },
	{ q: 'Apa nama gas yang dihirup manusia untuk bernapas?', a: 'oksigen' },
	{ q: 'Siapa presiden pertama Republik Indonesia?', a: 'soekarno' },
	{ q: 'Apa mamalia terbesar di dunia?', a: 'paus biru' },
	{ q: 'Unsur kimia dengan lambang Au adalah?', a: 'emas' },
	{ q: 'Berapa jumlah warna pada pelangi?', a: '7' },
	{ q: 'Gunung tertinggi di dunia adalah?', a: 'everest' },
	{ q: 'Organ tubuh manusia yang berfungsi memompa darah adalah?', a: 'jantung' },
	{ q: 'Apa ibu kota negara Australia?', a: 'canberra' },
	{ q: 'Penemu lampu pijar adalah?', a: 'thomas alva edison' },
	{ q: 'Apa nama candi Buddha terbesar di dunia yang ada di Indonesia?', a: 'borobudur' },
	{ q: 'Pulau terbesar di Indonesia adalah pulau?', a: 'papua' },
	{ q: 'Apa nama alat musik gesek berkulit kayu dengan 4 senar?', a: 'biola' },
	{ q: 'Berapa sisi yang dimiliki bangun ruang kubus?', a: '6' },
	{ q: 'Negara manakah yang terkenal dengan Menara Pisa?', a: 'italia' },
	{ q: 'Siapakah penemu teori relativitas?', a: 'albert einstein' },
	{ q: 'Burung yang tidak bisa terbang namun pandai berenang di kutub adalah?', a: 'penguin' },
	{ q: 'Bumi berputar pada porosnya disebut?', a: 'rotasi' },
	{ q: 'Apa mata uang negara Korea Selatan?', a: 'won' }
]
const SCRAMBLE = [
	{ word: 'KOMPUTER', hint: 'Alat elektronik untuk mengolah data' },
	{ word: 'PETUALANGAN', hint: 'Perjalanan penuh tantangan dan eksplorasi' },
	{ word: 'PERSAHABATAN', hint: 'Hubungan dekat dan tulus antar teman' },
	{ word: 'KEBAHAGIAAN', hint: 'Perasaan senang, tenang, dan puas' },
	{ word: 'TEKNOLOGI', hint: 'Ilmu terapan untuk memudahkan kehidupan manusia' },
	{ word: 'IMAJINASI', hint: 'Daya khayal atau kreativitas dalam pikiran' },
	{ word: 'PROGRAMMER', hint: 'Profesi pembuat dan pengembang perangkat lunak' },
	{ word: 'KECERDASAN', hint: 'Kemampuan berpikir dan menyelesaikan masalah' },
	{ word: 'ASTRONOT', hint: 'Orang yang dilatih untuk menjelajahi luar angkasa' },
	{ word: 'NUSANTARA', hint: 'Sebutan kepulauan di wilayah Indonesia' },
	{ word: 'MATEMATIKA', hint: 'Ilmu tentang bilangan, rumus, dan kalkulasi' },
	{ word: 'SMARTPHONE', hint: 'Ponsel pintar dengan beragam fitur dan aplikasi' },
	{ word: 'LABORATORIUM', hint: 'Ruangan khusus untuk riset dan eksperimen ilmiah' },
	{ word: 'HEMISFER', hint: 'Belahan bola bumi atau otak' },
	{ word: 'FOTOSINTESIS', hint: 'Proses tumbuhan hijau membuat makanannya sendiri' }
]
const PAIRS = [
	['Kucing', 'Anjing'], ['Pagi Hari', 'Malam Hari'], ['Pantai', 'Gunung'],
	['Teh Manis', 'Kopi Susu'], ['Nonton Film', 'Baca Buku'], ['Musim Panas', 'Musim Hujan'],
	['Mie Goreng', 'Mie Kuah'], ['Game PC', 'Game Mobile'], ['Uang Banyak', 'Waktu Luang']
]
const WYR = [
  ['Gak bisa pegang HP seminggu', 'Gak bisa makan enak seminggu'], ['Bisa terbang', 'Bisa menghilang'], ['Selalu telat 10 menit', 'Selalu kecepetan 1 jam'],
  ['Kaya tapi kesepian', 'Biasa aja tapi dikelilingi orang tersayang'], ['Tau kapan meninggal', 'Tau cara meninggal'], ['Wifi lemot selamanya', 'Baterai HP cuma 20% selamanya'],
  ['Hidup di masa lalu', 'Hidup di masa depan'], ['Bisa baca pikiran', 'Bisa melihat masa depan'], ['Makan mie instan terus', 'Makan nasi putih tanpa lauk terus'],
  ['Selalu jujur', 'Selalu bisa berbohong tanpa ketahuan'], ['Libur 3 bulan tanpa uang', 'Kerja terus tapi gaji dobel'], ['Tinggal di pantai', 'Tinggal di gunung']
]
const NHIE = ['Tidur di kelas/kantor', 'Nyontek pas ujian', 'Lupa nama orang yang baru dikenalkan', 'Pura-pura gak lihat chat', 'Salah kirim chat ke orang yang dibicarakan', 'Nangis nonton film animasi', 'Telat bangun pas ada acara penting', 'Stalking mantan', 'Ngegas di jalan raya', 'Ketiduran pas telepon']
const uniq = (...ls) => [...new Set(ls.flat())]
const TRUTH = uniq([
  'Siapa orang terakhir yang kamu stalk di media sosial?',
  'Apa hal paling memalukan yang pernah kamu alami di sekolah?',
  'Kebohongan terbesar apa yang pernah kamu bilang ke orang tua?',
  'Apa kebiasaan anehmu yang jarang diketahui orang?',
  'Lagu apa yang malu kamu akui kamu suka?',
  'Kapan terakhir kali kamu menangis, dan kenapa?',
  'Hal apa yang paling kamu takutkan?',
  'Apa isi galeri HP-mu yang paling random?',
  'Siapa teman di grup ini yang paling sering bikin kamu kesal?',
  'Apa mimpi teraneh yang pernah kamu alami?'
], [
  "Siapa orang terakhir yang kamu chat sebelum pesan ini?",
  "Apa rahasia terbesar yang belum pernah kamu ceritakan pada siapapun di grup ini?",
  "Jika kamu diwajibkan menikah dengan salah satu member grup ini, siapa yang akan kamu pilih? Tag orangnya!",
  "Pernahkah kamu menyukai seseorang di grup ini tapi tidak berani mengungkapkannya?",
  "Apa hal paling memalukan yang pernah terjadi padamu di depan umum?",
  "Sebutkan 3 hal yang paling kamu benci dari dirimu sendiri.",
  "Jika kamu bisa kembali ke masa lalu, momen memalukan apa yang ingin kamu ubah?",
  "Siapa mantan terindahmu? Kenapa putus?",
  "Pernahkah kamu berbohong ke orang tua demi bolos sekolah/kuliah/kerja? Ceritakan!",
  "Apa hal paling konyol yang pernah kamu cari di history Google pencarianmu?",
  "Siapa member di grup ini yang menurutmu paling asik, dan siapa yang paling ngeselin?",
  "Kapan terakhir kali kamu menangis dan apa alasannya?",
  "Berapa jumlah saldo di rekening/e-wallet kamu sekarang? Jujur!",
  "Apakah kamu pernah ketahuan stalking sosmed orang? Siapa?",
  "Apa kebohongan terbesar yang pernah kamu ucapkan ke sahabatmu?"
])
const DARE = uniq([
  'Kirim voice note nyanyi satu bait lagu favoritmu.',
  'Ganti foto profil jadi meme selama 1 jam.',
  'Kirim selfie dengan ekspresi paling jelek.',
  'Kirim stiker paling random yang kamu punya ke grup ini.',
  'Ceritakan lelucon yang menurutmu paling lucu.',
  'Kirim voice note pakai suara karakter kartun.',
  'Push up 10 kali lalu kirim buktinya.',
  'Tirukan gaya bicara salah satu member grup lewat voice note.',
  'Tulis status WhatsApp "aku fans berat bot ELYRINE" selama 1 jam.',
  'Kirim foto benda terdekat dari tempatmu duduk sekarang.'
], [
  "Kirim foto selfie kamu dengan gaya paling jelek sekarang juga ke grup!",
  "Kirim VN (Voice Note) nyanyi reff lagu 'Balonku Ada Lima' tapi semua huruf vokalnya diganti jadi 'O'.",
  "Chat mantan kamu sekarang, bilang 'Aku masih sayang', lalu screenshot dan kirim ke grup ini!",
  "Pakai foto profil wajah jelekmu selama 1 jam penuh!",
  "Tulis status WhatsApp 'Aku sayang banget sama [Tag 1 Member Grup]' dan biarkan selama 30 menit. SS ke grup!",
  "Kirim VN bilang 'Mewing mewing sigma skibidi' dengan nada serius ke grup.",
  "Spam 5 stiker paling absurd/nggak jelas yang kamu punya ke grup ini sekarang.",
  "Tag salah satu admin grup dan bilang 'Kamu jelek banget hari ini'.",
  "Ubah bio WhatsApp kamu menjadi 'Saya badut ancol' selama 1 hari.",
  "Kirim gombalan paling maut ke member yang berlawanan jenis di grup ini!",
  "Buat 1 puisi alay tentang ayam goreng, bacakan lewat VN!",
  "Ketik 'Aku ini sebenernya alien' dan tag 3 orang secara acak di grup ini.",
  "Sebutkan nama lengkapmu dengan suara berteriak di VN!",
  "Pilih salah satu nomor secara acak dari kontakmu, chat 'P' sebanyak 10 kali, screenshot ke sini!",
  "Jadikan foto profil bot ini sebagai foto profil WhatsApp kamu selama 30 menit."
])

const SES = { trivia: new Map(), scramble: new Map(), hilo: new Map(), angka: new Map() }
const EXPIRE = 10 * 60 * 1000

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const card = (emoji, title, rows, note) => {
  const w = Math.max(...rows.map(r => r[0].length))
  return box(emoji, title, rows.map(([k, v]) => `♡ ${k.padEnd(w)} : ${v}`).join('\n'), note)
}
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')
const send = (conn, m, text, mentions = []) => conn.sendMessage(m.chat, { text, mentions }, { quoted: m })
const react = async (m, e) => { try { await m.react?.(e) } catch {} }
const scramble = w => { const a = w.split(''); for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]] } return a.join('') }

const E = {}
const add = (key, cmds, run) => { E[key] = { cmds, run } }

add('trivia', ['trivia'], async ({ m, p }) => {
  const item = pick(TRIVIA)
  SES.trivia.set(m.chat, { a: String(item.a).toLowerCase(), at: Date.now() })
  await react(m, '🧠')
  return m.reply(box('🧠', 'Trivia Time!', item.q, `♡ Jawab dengan *${p}jawabtrivia <jawaban>*`))
})
add('jawabtrivia', ['jawabtrivia'], async ({ m, text, p }) => {
  const s = SES.trivia.get(m.chat)
  if (!s || Date.now() - s.at > EXPIRE) { SES.trivia.delete(m.chat); return m.reply(usage('🧠', 'Trivia', ['Belum ada trivia aktif di chat ini.', '', `♡ ${p}trivia`])) }
  const ans = String(text || '').toLowerCase().trim()
  if (!ans) return m.reply(usage('🧠', 'Trivia', ['Tulis jawabanmu.', '', `♡ ${p}jawabtrivia tokyo`]))
  if (ans === s.a) {
    SES.trivia.delete(m.chat)
    await react(m, '🎉')
    return m.reply(box('🎉', 'Benar Sekali!', `Jawaban tepat: *${s.a.toUpperCase()}*\nKamu pintar banget, terus asah wawasanmu!`))
  }
  await react(m, '❌')
  return m.reply(box('❌', 'Jawaban Salah', `Coba tebak lagi atau ketik *${p}trivia* untuk ganti soal.`))
})

add('scramble', ['wordscramble', 'scramble', 'tebakkata'], async ({ m, p }) => {
  const item = pick(SCRAMBLE)
  SES.scramble.set(m.chat, { a: String(item.word).toLowerCase(), at: Date.now() })
  await react(m, '🔀')
  return m.reply(card('🔀', 'Tebak Kata Acak', [['Huruf', `*${scramble(item.word)}*`], ['Hint', item.hint]], `♡ Jawab dengan *${p}jawabscramble <kata>*`))
})
add('jawabscramble', ['jawabscramble'], async ({ m, text, p }) => {
  const s = SES.scramble.get(m.chat)
  if (!s || Date.now() - s.at > EXPIRE) { SES.scramble.delete(m.chat); return m.reply(usage('🔀', 'Tebak Kata Acak', ['Belum ada game aktif di chat ini.', '', `♡ ${p}wordscramble`])) }
  const ans = String(text || '').toLowerCase().trim()
  if (!ans) return m.reply(usage('🔀', 'Tebak Kata Acak', ['Tulis kata tebakanmu.', '', `♡ ${p}jawabscramble komputer`]))
  if (ans === s.a) {
    SES.scramble.delete(m.chat)
    await react(m, '🎉')
    return m.reply(box('🎉', 'Benar Sekali!', `Kata yang tepat: *${s.a.toUpperCase()}*`))
  }
  await react(m, '❌')
  return m.reply(box('❌', 'Jawaban Salah', `Coba lagi atau ketik *${p}wordscramble* untuk kata baru.`))
})

add('hilo', ['guesshilo', 'hilo'], async ({ m, p }) => {
  SES.hilo.set(m.chat, { n: rand(1, 100), at: Date.now() })
  await react(m, '🔢')
  return m.reply(box('🔢', 'Higher or Lower', 'Aku punya angka rahasia antara 1 sampai 100.\nBot akan bilang angkanya lebih tinggi atau lebih rendah.', `♡ Tebak dengan *${p}tebakhilo <angka>*`))
})
add('tebakhilo', ['tebakhilo'], async ({ m, text, p }) => {
  const s = SES.hilo.get(m.chat)
  if (!s || Date.now() - s.at > EXPIRE) { SES.hilo.delete(m.chat); return m.reply(usage('🔢', 'Higher or Lower', ['Belum ada game aktif di chat ini.', '', `♡ ${p}guesshilo`])) }
  const g = parseInt(String(text || '').trim())
  if (isNaN(g)) return m.reply(usage('🔢', 'Higher or Lower', ['Cara pakai:', '', `♡ ${p}tebakhilo 50`]))
  if (g === s.n) {
    SES.hilo.delete(m.chat)
    await react(m, '🎉')
    return m.reply(box('🎉', 'Tepat Sekali!', `Angka rahasianya memang *${s.n}*. Terima kasih sudah bermain.`))
  }
  if (g < s.n) { await react(m, '📈'); return m.reply(box('📈', 'Lebih Tinggi!', `Angka rahasia lebih *TINGGI* dari *${g}*.`)) }
  await react(m, '📉')
  return m.reply(box('📉', 'Lebih Rendah!', `Angka rahasia lebih *RENDAH* dari *${g}*.`))
})

add('tebakangka', ['tebakangka', 'tebak'], async ({ m, text, command, p }) => {
  let g = SES.angka.get(m.chat)
  if (g && Date.now() - g.at > EXPIRE) { SES.angka.delete(m.chat); g = null }
  if (command === 'tebakangka') {
    if (g) return m.reply(usage('🎯', 'Tebak Angka', ['Game masih berjalan.', '', `♡ ${p}tebak <angka>`]))
    SES.angka.set(m.chat, { n: rand(1, 100), left: 7, at: Date.now() })
    return m.reply(box('🎯', 'Tebak Angka', 'Aku memilih angka 1-100.\nKamu punya 7 kesempatan.', `♡ Tebak dengan *${p}tebak <angka>*`))
  }
  if (!g) return m.reply(usage('🎯', 'Tebak Angka', ['Belum ada game.', '', `♡ ${p}tebakangka`]))
  const guess = Number(String(text || '').trim().split(/\s+/)[0])
  if (!Number.isInteger(guess) || guess < 1 || guess > 100) return m.reply(usage('🎯', 'Tebak Angka', ['Masukkan angka 1-100.']))
  g.left--
  if (guess === g.n) {
    const reward = 100 * (g.left + 1)
    SES.angka.delete(m.chat)
    const u = global.db?.data?.users?.[m.sender]
    if (u) u.exp = (u.exp || 0) + reward
    return m.reply(card('🎉', 'Benar!', [['Angka', g.n], ['Hadiah', `${reward} exp`]]))
  }
  if (g.left <= 0) {
    SES.angka.delete(m.chat)
    return m.reply(card('😵', 'Kesempatan Habis', [['Angka', g.n]]))
  }
  return m.reply(card('🎯', guess < g.n ? 'Terlalu Kecil' : 'Terlalu Besar', [['Sisa kesempatan', g.left]]))
})

add('thisorthat', ['thisorthat', 'pilihmana'], ({ m }) => {
  const [a, b] = pick(PAIRS)
  return m.reply(box('⚖️', 'This or That', `*${a}* 🆚 *${b}*`, '_Pilih salah satu dan tuliskan alasanmu!_'))
})
add('wyr', ['wyr', 'wouldyourather', 'pilihsatu'], ({ m }) => {
  const [a, b] = pick(WYR)
  return m.reply(box('⚖️', 'Would You Rather', `🅰️ ${a}\n\n_atau_\n\n🅱️ ${b}`, '_Balas A atau B dan jelaskan alasannya!_'))
})
add('nhie', ['nhie', 'nevereverhave'], ({ m }) => m.reply(box('🙋', 'Never Have I Ever', `Aku belum pernah...\n♡ *${pick(NHIE)}*`, '_Yang pernah, angkat tangan (balas "pernah")!_')))

const tag = j => '@' + num(j)
add('truth', ['truth', 'jujur'], ({ conn, m }) => send(conn, m, box('🗣️', 'Truth', `${tag(m.sender)}\n\n${pick(TRUTH)}`), [m.sender]))
add('dare', ['dare', 'tantangan'], ({ conn, m }) => send(conn, m, box('😈', 'Dare', `${tag(m.sender)}\n\n${pick(DARE)}`), [m.sender]))
add('tod', ['tod', 'truthordare', 'td'], ({ conn, m, text, p }) => {
  let mode = String(text || '').trim().split(/\s+/)[0].toLowerCase()
  if (mode === 'jujur') mode = 'truth'
  if (!['truth', 'dare', 'acak'].includes(mode)) {
    return m.reply(usage('🎭', 'Truth or Dare', ['Berani pilih yang mana?', '', `♡ ${p}tod truth`, `♡ ${p}tod dare`, `♡ ${p}tod acak`]))
  }
  if (mode === 'acak') mode = pick(['truth', 'dare'])
  const t = mode === 'truth'
  return send(conn, m, box(t ? '🗣️' : '😈', t ? 'Truth' : 'Dare', `${tag(m.sender)}\n\n${pick(t ? TRUTH : DARE)}`), [m.sender])
})
add('spin', ['spin', 'putarbotol'], async ({ conn, m }) => {
  if (!m.isGroup) return m.gagal('Fitur ini hanya bisa dipakai di grup.', 'Putar Botol')
  const meta = await conn.groupMetadata(m.chat)
  const target = pick(meta.participants).jid || pick(meta.participants).id
  const t = Math.random() > 0.5
  return send(conn, m, box('🍾', 'Botol Diputar!', `Botol berputar kencang... lalu berhenti menunjuk kepada\n\n👉 ${tag(target)} 👈\n\n${t ? '🗣️ *TRUTH* _(jawab dengan jujur!)_' : '😈 *DARE* _(harus dilakukan!)_'}\n♡ ${pick(t ? TRUTH : DARE)}`), [target])
})

const MAP = {}
for (const [key, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/game] command ganda: ${c}`)
  MAP[c] = key
}

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const key = MAP[cmd]
  if (!key) return
  try {
    return await E[key].run({ conn, m, text, command: cmd, p })
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Game')
  }
}

handler.help = ['trivia', 'tebakkata', 'guesshilo', 'tebakangka', 'thisorthat', 'wyr', 'nhie', 'truth', 'dare', 'tod', 'spin']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
