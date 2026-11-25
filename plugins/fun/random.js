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

import crypto from 'crypto'

const FOOTER = 'with love, elyra !!'

const pick = a => a[Math.floor(Math.random() * a.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const num = j => String(j || '').split('@')[0].split(':')[0]
const sleep = ms => new Promise(r => setTimeout(r, ms))
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }

function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h
}
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date())
const dayRand = (seed, min, max) => min + hash(`${seed}|${today()}`) % (max - min + 1)

const AFFIRM = [
	'Kamu jauh lebih kuat dan hebat dari yang kamu kira.',
	'Setiap langkah kecil yang kamu ambil hari ini tetaplah sebuah kemajuan.',
	'Kamu pantas mendapatkan hal-hal baik dan kebahagiaan hari ini.',
	'Kesalahan hari ini adalah guru berharga untuk keberhasilanmu besok.',
	'Percaya pada dirimu sendiri, kamu mampu melewati semua tantangan.'
]
const COMPLI = [
		'punya energi positif yang menular ke orang sekitarnya!',
		'selalu bikin orang sekitar nyaman dan tersenyum.',
		'punya potensi besar dan aura yang memikat!',
		'adalah orang hebat yang pantas dibanggakan.',
		'punya hati yang tulus dan selalu menghangatkan suasana.'
	]
const DADJOKE = [
	'Kenapa programmer suka alam? Karena banyak tree (pohon data)!',
	'Apa minuman favorit hantu? Es kunti(lanak)... eh, es teh maksudnya.',
	'Kenapa komputer gak pernah lapar? Karena udah punya byte!',
	'Kenapa laut gak pernah pinjam uang? Karena udah banyak "bank" (pantai)!',
	'Kenapa bebek goreng enak rasanya? Karena ada huruf B nya, coba kalau gak ada... jadi ekek goreng!',
	'Pocong apa yang paling disenangi ibu-ibu? Pocongan harga!',
	'Kenapa matahari tenggelam? Karena gak bisa berenang!',
	'Hewan apa yang bersaudara? Katak-beradik!',
	'Jus apa yang paling gak enak? Just friend...',
	'Kenapa superman bajunya ketat? Karena kalau longgar namanya super jumbo!'
]
const FAKTA = [
  'Gurita punya tiga jantung dan darahnya berwarna biru.',
  'Di Venus, satu hari (sekali berputar) lebih lama daripada satu tahunnya (sekali mengelilingi Matahari).',
  'Hiu sudah ada di Bumi lebih lama daripada pepohonan.',
  'Cahaya Matahari butuh sekitar 8 menit 20 detik untuk sampai ke Bumi.',
  'Jerapah dan manusia sama-sama punya tujuh tulang leher.',
  'Indonesia adalah negara kepulauan terbesar di dunia dengan belasan ribu pulau.',
  'Kotoran wombat berbentuk kubus.',
  'Pisang mengandung sedikit zat radioaktif alami karena kalium-40, tapi aman dimakan.',
  'Otak manusia hanya sekitar 2% dari berat tubuh, tetapi memakai sekitar 20% energi tubuh.',
  'Komodo di alam liar hanya ditemukan di Indonesia.',
  'Kupu-kupu bisa merasakan rasa lewat kakinya.',
  'Madu hampir tidak pernah basi jika disimpan dengan baik.',
  'Bumi tidak bulat sempurna, sedikit pepat di kutub dan menggembung di khatulistiwa.',
  'Lebah madu bisa mengenali wajah manusia lewat pola yang mereka pelajari.',
  'Petir bisa memanaskan udara di sekitarnya hingga sekitar lima kali lebih panas dari permukaan Matahari.'
]
const KONSPI = [
	'Burung itu sebenarnya drone pengawas pemerintah.',
	'Kucing tidur 16 jam sehari karena merencanakan dominasi dunia.',
	'Setiap kali WiFi lambat, itu karena tetangga lagi download alam semesta paralel.',
	'Semua kaus kaki yang hilang di mesin cuci sebenarnya diculik dimensi lain.',
	'Bulan sebenarnya adalah satelit buatan raksasa yang dipakai untuk pemancar mimpi manusia.',
	'Cermin di rumah kita sebenarnya pintu ke dimensi lain yang cuma terbuka kalau kita gak lihat.'
]
const MOTIVASI = [
  'Progres kecil setiap hari lebih baik daripada rencana besar yang tidak pernah dimulai.',
  'Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk menjadi hebat.',
  'Capek itu wajar. Berhenti sebentar boleh, menyerah jangan.',
  'Kesalahan adalah bukti bahwa kamu sedang mencoba.',
  'Jangan bandingkan bab satu hidupmu dengan bab sepuluh hidup orang lain.',
  'Disiplin adalah jembatan antara tujuan dan hasil.',
  'Hari ini yang kamu lakukan adalah hadiah untuk dirimu di masa depan.',
  'Tidak ada jalan pintas yang sampai ke tempat yang layak dituju.',
  'Mulai dari mana kamu berada, pakai apa yang kamu punya, lakukan apa yang kamu bisa.',
  'Gagal sekali, belajar sekali. Gagal sepuluh kali, ahli sepuluh kali.',
  'Konsisten mengalahkan bakat saat bakat tidak konsisten.',
  'Tenang, tidak semua hal harus selesai hari ini.',
  'Sabar bukan berarti menunggu, tapi tetap berusaha sambil menunggu.',
  'Hal besar selalu dimulai dari langkah yang terasa sepele.',
  'Percaya prosesmu, hasilnya akan menyusul.'
]
const PANTUN = [
  'Pergi ke pasar membeli ikan,\nIkan dibeli dibawa pulang.\nBelajar sungguh jangan bermalasan,\nMasa depan cerah menjelang.',
  'Anak ayam turun sepuluh,\nMati satu tinggal sembilan.\nJangan lekas hati mengeluh,\nSetiap masalah ada jalan.',
  'Kalau ada sumur di ladang,\nBolehlah kita menumpang mandi.\nKalau ada umurku panjang,\nBolehlah kita berjumpa lagi.',
  'Pisang emas dibawa berlayar,\nMasak sebiji di atas peti.\nUtang emas boleh dibayar,\nUtang budi dibawa mati.',
  'Berakit-rakit ke hulu,\nBerenang-renang ke tepian.\nBersakit-sakit dahulu,\nBersenang-senang kemudian.',
  'Jalan-jalan ke kota Medan,\nSinggah sebentar membeli duku.\nSemangat terus dalam perjuangan,\nHasil manis menunggumu.',
  'Buah salak buah kedondong,\nDimakan siang di bawah pohon.\nJangan malu bertanya kawan,\nIlmu bertambah hati pun senang.',
  'Menanam padi di tepi kali,\nMenuai hasil di musim kemarau.\nJangan berhenti mencoba lagi,\nKegagalan guru yang paling handal.'
]
const GOMBAL = [
  'Kamu tahu bedanya kamu sama kalender? Kalender bikin aku ingat tanggal, kamu bikin aku lupa waktu.',
  'Kamu itu kayak WiFi: dekat kamu, sinyal hatiku selalu penuh.',
  'Cuaca hari ini mendung ya? Soalnya senyummu terlalu terang sampai mataharinya minder.',
  'Kamu pasti capek ya? Soalnya dari tadi kamu lari-lari di pikiranku.',
  'Aku bukan fotografer, tapi aku bisa membayangkan kita berdua dalam satu frame.',
  'Kalau kamu jadi password, pasti aku susah lupa. Soalnya sudah kuhafal di luar kepala.',
  'Kamu tahu nggak bedanya kamu sama kopi? Kopi bikin melek, kamu bikin aku semangat melek terus.',
  'Aku suka matematika, tapi lebih suka kamu. Soalnya kamu satu-satunya yang nggak bikin pusing.',
  'Baterai HP-ku boleh habis, tapi semangatku buat chat kamu nggak pernah low.',
  'Kamu itu kayak buku favorit: sudah berkali-kali dibaca tapi nggak pernah bosan.'
]
const JOKES = [
  ['Kenapa programmer suka gelap?', 'Karena light attracts bugs.'],
  ['Kenapa komputer nggak pernah kedinginan?', 'Karena punya banyak Windows... tapi sering hang.'],
  ['Ikan apa yang nggak bisa berenang?', 'Ikan di dalam kaleng.'],
  ['Kenapa kalender nggak pernah sepi?', 'Karena tanggalnya banyak yang ngajak kencan.'],
  ['Kenapa ayam menyeberang jalan?', 'Karena ada yang jualan di seberang.'],
  ['Buah apa yang paling jujur?', 'Semangka, karena isinya kelihatan semua.'],
  ['Kenapa kopi nggak pernah dapat juara?', 'Karena selalu diseruput di babak awal.'],
  ['Kenapa sepeda nggak bisa berdiri sendiri?', 'Karena dua-tired (too tired).'],
  ['Apa bedanya jomblo dan WiFi gratis?', 'Sama-sama banyak yang mau, tapi sering nggak ada yang bertahan.'],
  ['Kenapa uang receh suka bunyi?', 'Karena nggak mau diremehkan.'],
  ['Hewan apa yang paling disiplin?', 'Semut, jalannya selalu baris.'],
  ['Kenapa pensil lebih pintar dari bolpen?', 'Karena bisa dihapus kesalahannya.']
]
const RIZZ = [
  'Kamu tau gak bedanya kamu sama kopi? Kopi bikin melek, kamu bikin aku susah tidur ☕',
  'Bukan jam yang bikin aku telat, tapi mikirin kamu 🕰️',
  'Kamu pasti WiFi ya? Soalnya tiap deket kamu, aku langsung connect 📶',
  'Kalau kamu jadi soal ujian, aku rela remedial berkali-kali 📝',
  'Hari ini cerah, tapi gak secerah senyum kamu ☀️',
  'Aku bukan fotografer, tapi aku bisa bayangin kita berdua di satu frame 📸',
  'Kamu itu kayak password: susah ditebak, tapi aku gak mau ganti 🔐',
  'Apa kamu punya peta? Aku tersesat di matamu 🗺️',
  'Kamu pasti pajak ya, soalnya gak bisa aku hindari 💸',
  'Kalau cinta itu bug, aku gak mau di-fix kalau itu soal kamu 🐛'
]
const ROAST = [
  'wifi di rumah kamu aja lebih stabil daripada keputusan hidupmu 📶',
  'kamu itu kayak update Windows: dateng pas lagi gak dibutuhin 🪟',
  'rencana kamu banyak, eksekusinya kayak sinyal di lift 📉',
  'katanya mau rajin, tapi kasur selalu menang 🛏️',
  'chat kamu centang dua biru tapi gak dibalas, tega banget 😭',
  'baterai kamu 1% tapi masih sempet main HP, mental baja 🔋',
  'janji "bentar lagi" kamu itu setara satu semester ⏳',
  'otak kamu kayak tab Chrome: kebanyakan kebuka, semuanya lemot 🧠',
  'kamu tuh tipe orang yang cek kulkas tiap 5 menit berharap ada isi baru 🧊',
  'alarm kamu bunyi 7 kali, kamu cuma bangun di yang ke-8 ⏰',
  'semangat kamu naik pas gajian, turun pas tanggal 20 📆',
  'kamu bilang diet, tapi gorengan selalu jadi pengecualian 🍤'
]
const FORTUNE = [
  'Seseorang akan membantumu dengan cara yang tak kamu duga.', 'Kerja kerasmu hari ini adalah investasi untuk esok.',
  'Jangan takut mencoba hal baru; kesempatan menyukai orang yang berani.', 'Kabar baik akan segera datang lewat pesan singkat.',
  'Senyum yang kamu bagikan akan kembali berlipat.', 'Sabar. Hal terbaik sedang dipersiapkan untukmu.',
  'Hari ini cocok untuk menyelesaikan yang tertunda.', 'Teman lama akan menghubungimu kembali.',
  'Rezeki kecil hari ini, tapi cukup untuk traktir diri sendiri.', 'Jangan lupa istirahat, tubuhmu juga butuh dihargai.'
]
const COLORS = ['Merah 🔴', 'Biru 🔵', 'Hijau 🟢', 'Kuning 🟡', 'Ungu 🟣', 'Oranye 🟠', 'Putih ⚪', 'Hitam ⚫']
const KATA_W = [['Serendipitas', 'Keberuntungan menemukan hal berharga secara tak sengaja'], ['Nirwana', 'Keadaan bahagia yang sempurna'], ['Senandika', 'Percakapan dengan diri sendiri'], ['Rekah', 'Terbuka atau mekar'], ['Gegas', 'Cepat; terburu-buru'], ['Kala', 'Waktu; masa'], ['Sukma', 'Jiwa; roh'], ['Merdeka', 'Bebas dari penjajahan atau kekangan'], ['Anugerah', 'Pemberian dari yang Mahakuasa'], ['Tabah', 'Tetap kuat menghadapi cobaan'], ['Pelita', 'Lampu kecil; penerang'], ['Sanubari', 'Hati nurani; batin'], ['Elok', 'Indah; cantik'], ['Gigih', 'Tekun dan keras hati'], ['Lestari', 'Tetap tidak berubah; kekal']]
const KATA_Q = ['"Mulailah dari mana kau berdiri, gunakan yang kau miliki, lakukan yang kau bisa." — Arthur Ashe', '"Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas." — Henry Ford', '"Orang yang berhenti belajar adalah orang yang sudah tua." — Henry Ford', '"Jangan menunggu. Waktu takkan pernah tepat." — Napoleon Hill', '"Hidup itu 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponsnya." — Charles Swindoll', '"Satu-satunya cara melakukan pekerjaan hebat adalah mencintai pekerjaanmu." — Steve Jobs']
const TANTANGAN = ['Minum 8 gelas air putih 💧', 'Jalan kaki 15 menit 🚶', 'Rapikan satu sudut kamar 🧹', 'Kirim pesan terima kasih ke seseorang 💌', 'Tidak main medsos selama 1 jam 📵', 'Baca 10 halaman buku 📚', 'Belajar 3 kata bahasa baru 🌐', 'Peregangan 5 menit 🧘', 'Tulis 3 hal yang kamu syukuri 🙏', 'Makan satu buah/sayur ekstra 🥗', 'Tidur sebelum jam 22.30 😴', 'Catat semua pengeluaran hari ini 🧾', 'Telepon keluarga 📞', 'Belajar skill baru 15 menit 🎯']
const WORDS = [
	{ word: 'Serendipity', meaning: 'Menemukan sesuatu yang indah atau baik tanpa direncanakan sebelumnya.' },
	{ word: 'Petrichor', meaning: 'Aroma khas dan menenangkan dari tanah setelah hujan pertama turun.' },
	{ word: 'Ephemeral', meaning: 'Sesuatu yang berlangsung sangat singkat namun meninggalkan keindahan.' },
	{ word: 'Wanderlust', meaning: 'Hasrat dan dorongan kuat untuk terus menjelajah dan bepergian ke tempat baru.' },
	{ word: 'Resilience', meaning: 'Kemampuan untuk bangkit dan pulih kembali saat menghadapi kesulitan.' },
	{ word: 'Euphoria', meaning: 'Perasaan bahagia dan gembira yang luar biasa meluap-luap.' }
]
const ADMIRER = [
	'Seseorang di grup ini diam-diam selalu memperhatikan chat kamu.',
	'Ada yang selalu tersenyum saat melihat foto profil atau pesanmu.',
	'Seseorang menyimpan pesan lucumu sebagai favorit.',
	'Ada seseorang yang merasa hari-harinya lebih berwarna karena kamu.'
]
const ANS8 = [
	'Ya, pasti!', 'Tidak diragukan lagi.', 'Sepertinya begitu.',
	'Tanya lagi nanti.', 'Lebih baik tidak kuberitahu sekarang.',
	'Jangan terlalu berharap.', 'Sangat meragukan.', 'Tidak mungkin.', 'Bisa jadi.',
	'Peluangnya 100%!'
]
const EMOJIS = ['😀','😎','🤔','🥳','😴','🤯','🥶','😇','🤖','👻','🦄','🔥','💎','🌈','⚡','✨','🦊','🐱','🌸','🎉']
const GILA = [
    'Normal... kayak batu bata.',
    'Agak nyeleneh, tapi masih bisa diajak diskusi.',
    'Udah mulai ngaco, tolong dijaga.',
    'Wah ini sih gila bener, cocok masuk rumah tertawa.',
    'Level dewa... gila tapi keren.',
    'Gila banget, sampe bot aja pusing baca chat kamu.',
    'Kayaknya udah enggak bisa diselamatkan 😭',
    'Kamu waras, tapi cuma kalau tidur.',
    'Gila dalam diam... serem banget kamu.',
    'Gila bergaya profesional. Respect.'
  ]
const MATI = [
    'keracunan cilok expired 😵',
    'ditabrak mobil odading 😩',
    'terpeleset di kamar mandi pas nyanyi dangdut 🚿🎤',
    'kecanduan scrolling TikTok 48 jam nonstop 📱💀',
    'ngambek sama bot sendiri terus putus asa 😭',
    'kelamaan jomblo sampe badan menghilang 🫥',
    'makan mie pakai kopi dan susu 🤢',
    'diculik alien terus dikira bahan eksperimen 👽🔬',
    'dipukul karma karena suka nyolong meme 🙃',
    'ketawa ngakak sampai lupa napas 😂'
  ]
const UMUR = [
'12 Tahun, Masih Bocil',
'11 Tahun, Bocilll',
'10 Tahun, Aduh Masih Gaboleh Main Hp Dek',
'16 Tahun, Remaja Lah Ya',
'19 Tahun, Remajaa',
'20 Tahun, Udah Nikah?',
'21 Tahun, Udah Ketemu Calon Nih?',
'14 Tahun',
'15 Tahun',
'17 Tahun',
'18 Tahun, Udah Balig Nih'
]
const NG_LOKASI = [
    'WC umum dekat warung',
    'Toilet kantor lantai 3',
    'WC sekolah yang baunya legendaris',
    'Kamar mandi mertua',
    'Toilet pesawat',
    'Semak-semak pinggir sawah',
    'WC mall yang antrenya panjang',
    'Toilet duduk kos-kosan',
    'Toilet jongkok rest area'
]
const NG_SUARA = [
    'BRRRTTT... plop plop 💦',
    'Hening... tapi mematikan 🤫',
    'DUARRR! kayak halilintar ⚡',
    'Cuma kentut doang, gagal total 😭',
    'Konser orkestra 1 babak penuh 🎶',
    'Sunyi sekali, sampai jangkrik bunyi 🦗',
    'Bunyi kayak motor mogok 🏍️'
]
const NG_KOMEN = [
    'Lega rasanya kayak abis ujian 😌',
    'Hidup terasa lebih ringan~ 🍃',
    'WC butuh direnovasi setelah ini 🚽',
    'Tisu sekampung gak akan cukup 😂',
    'Selamat, misi selesai dengan damai 🎉',
    'Tetangga sebelah ikut merasakan getarannya 🌍',
    'Petugas kebersihan langsung resign 🏃'
]
const TRAITS = ['Humoris', 'Pekerja keras', 'Suka tidur', 'Setia kawan', 'Pelupa', 'Perfeksionis', 'Santai', 'Penolong', 'Kreatif', 'Pemalu tapi hangat', 'Suka makan', 'Penyabar', 'Spontan', 'Pendengar yang baik', 'Suka rebahan', 'Tukang telat', 'Pencinta kucing', 'Penjelajah']
const FOOD = { berat: ['Nasi Padang', 'Nasi Goreng Spesial', 'Ayam Geprek', 'Rawon', 'Soto Ayam', 'Gado-gado', 'Bakso Urat', 'Mie Ayam', 'Nasi Uduk', 'Sate Ayam', 'Pecel Lele', 'Rendang', 'Nasi Liwet', 'Gudeg', 'Coto Makassar'], ringan: ['Roti Bakar', 'Batagor', 'Siomay', 'Martabak Mini', 'Pisang Goreng', 'Bubur Ayam', 'Lontong Sayur', 'Cilok', 'Kentang Goreng', 'Dimsum'], minum: ['Es Teh Manis', 'Kopi Susu', 'Boba', 'Es Jeruk', 'Matcha Latte', 'Wedang Jahe', 'Es Campur', 'Jus Alpukat', 'Teh Tarik', 'Coklat Panas'] }
const NAMA_A = ['Shadow', 'Neo', 'Blaze', 'Frost', 'Nova', 'Zero', 'Ghost', 'Astra', 'Pixel', 'Cyber', 'Luna', 'Storm', 'Echo', 'Viper', 'Orion', 'Kuro', 'Aether', 'Rogue']
const NAMA_B = ['Wolf', 'Hunter', 'Knight', 'Dragon', 'Fox', 'Rider', 'Slayer', 'Phantom', 'Raven', 'Samurai', 'Wizard', 'Falcon', 'Tiger', 'Reaper', 'Mage', 'Ninja']
const NAMA_F1 = ['Ar', 'El', 'Thal', 'Kael', 'Mor', 'Lyr', 'Zan', 'Eri', 'Dra', 'Vel']
const NAMA_F2 = ['andor', 'wyn', 'ithas', 'orin', 'ael', 'adis', 'oth', 'ielle', 'ion', 'ara']
const LUPAKAN = [
    'Masa lalu adalah pelajaran, bukan penjara. Biarkan dirimu terbang lebih tinggi.',
    'Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dari dirimu.',
    'Jangan biarkan kemarin mengambil terlalu banyak dari hari ini.',
    'Lupakan apa yang tidak bisa diubah, fokus pada apa yang bisa kamu lakukan sekarang.',
    'Kehidupan terlalu singkat untuk menyimpan dendam dan penyesalan.',
    'Masa depan menunggu mereka yang berani meninggalkan masa lalu.',
    'Kesalahan adalah guru terbaik, bukan musuh. Belajar dan lanjutkan.',
    'Kamu tidak bisa mengubah masa lalu, tapi kamu bisa membentuk masa depan.',
    'Setiap detik adalah kesempatan untuk memulai ulang.',
    'Lepaskan beban masa lalu dan rasakan kebebasan sejati.',
    'Hidup dimulai ketika kamu berhenti memikirkan apa yang seharusnya terjadi.',
    'Masa lalu tidak mendefinisikan siapa kamu, pilihan hari ini yang melakukannya.',
    'Jangan terjebak dalam cerita lama, tulis cerita baru yang lebih indah.',
    'Keberanian bukan tidak takut, tapi melangkah maju meski takut.',
    'Setiap orang berhak mendapatkan kesempatan kedua, termasuk dirimu sendiri.'
  ]
const MOVE_TEKS = [
    "⏳ *Menjalankan perintah: moveon.exe*",
    "⌛ Mengakses direktori kenangan...",
    "⌛ Menemukan 1.042 file terkait: mantan.jpg, tawa.mp3, chat_kita.txt, pelukan terakhir.mp4",
    "⌛ Menghapus file: mantan.jpg",
    "⌛ Menghapus file: tawa.mp3",
    "⌛ Menghapus file: chat_kita.txt",
    "⌛ Menghapus file: pelukan terakhir.mp4",
    "⌛ Membersihkan folder: /hati/kenangan/spesial",
    "⌛ Menghapus log malam_nangis.log",
    "⌛ Menghapus config: harapan.yaml",
    "⌛ Menonaktifkan modul: berharap_lagi.dll",
    "⌛ Menutup port luka_terbuka 4040",
    "⌛ Mencabut izin akses memori emosional",
    "⌛ Restart sistem perasaan...",
    "⌛ Verifikasi status...",
    "❌ *Gagal*"
  ]
const MOVE_ALASAN = [
    "*Error: Masih menyimpan fotonya di galeri*",
    "*Error: Masih suka stalking story-nya tiap malam*",
    "*Error: File hati sedang digunakan oleh proses lain: 'rindu.exe'*",
    "*Error: Gagal menghapus karena kenangan terlalu dalam*",
    "*Error: Sistem mendeteksi denyut jantung meningkat saat melihat namanya*",
    "*Error: Modul 'ikhlas.dll' belum terpasang*",
    "*Error: Masih berharap tanpa sadar*",
    "*Error: Masih ingat semua kata sandi dia*",
    "*Error: Proses move on terhenti, karena lagu 'Kenangan Manis.mp3' diputar kembali*",
    "*Error: Chat terakhir belum dihapus, masih dibaca berulang-ulang*"
  ]
const GOJO = {
 gquote:[
  "Percaya diri boleh, tapi tetap belajar dari kesalahan.",
  "Kekuatan terbaik adalah kemampuan untuk tetap tenang saat keadaan kacau.",
  "Jangan menunggu sempurna untuk mulai menjadi lebih baik."
 ],
 gfact:[
  "Satoru Gojo adalah karakter dari Jujutsu Kaisen.",
  "Gojo dikenal sebagai penyihir jujutsu yang sangat kuat.",
  "Six Eyes dan Limitless adalah bagian penting dari kemampuan Gojo."
 ],
 ghype:[
  "⚡ Fokus. Tenang. Jangan panik.",
  "🔥 Saatnya naik level, bukan menyerah.",
  "🌀 Mode serius aktif. Tetap santai, tetap tajam."
 ],
 gpower:[
  "🔵 Limitless — manipulasi ruang.",
  "🟣 Hollow Purple — teknik gabungan Blue dan Red.",
  "👁️ Six Eyes — kemampuan mata khusus Gojo."
 ],
 gtech:[
  "🔵 Blue — teknik tarik berbasis Limitless.",
  "🔴 Red — teknik dorong berbasis Limitless.",
  "🟣 Purple — serangan gabungan Blue dan Red."
 ]
}
const TSTYLE = {
  uwu: (s) => s.replace(/[rl]/g, 'w').replace(/[RL]/g, 'W').replace(/n([aeiou])/g, 'ny$1') + ' uwu~ 🥺',
  alay: (s) => [...s].map((c, i) => (ALAY[c.toLowerCase()] && i % 2 ? ALAY[c.toLowerCase()] : i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''),
  spasi: (s) => [...s].join(' '),
  gema: (s) => `${s}... ${s.slice(-Math.ceil(s.length / 2))}... ${s.slice(-Math.ceil(s.length / 4))}...`,
  ngegas: (s) => `${s.toUpperCase()}!!! ${'🔥'.repeat(3)}`,
  lirih: (s) => `${s.toLowerCase()}... 🥀`,
  mocking: (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('')
}
const EMOJI_M = { '!': '❗', '?': '❓', '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣' }

const SURAT = target => ({
  pembuka: [
    `Untukmu yang selalu hadir dalam lamunanku, ${target},`,
    `Dear ${target},`,
    `Kepada ${target} yang diam-diam kucintai,`,
    `Hai ${target}, bintang di langit malamku,`,
    `Wahai ${target}, pemilik senyum yang menghancurkan dompetku,`
  ],
  isi: [
    `Setiap kali aku melihat status-mu, hatiku bergetar seperti sinyal WiFi tetangga.`,
    `Kau hadir dalam hidupku bagaikan notif Shopee di tengah malam, mengejutkan tapi bikin senang.`,
    `Aku tau kamu bukan SPBU, tapi kenapa kamu selalu ngisi hatiku?`,
    `Kalau cinta itu buta, maka aku sudah lama tersesat di labirin wajahmu.`,
    `Tanpamu hidupku seperti Indomie tanpa micin, hambar dan menyedihkan.`
  ],
  penutup: [
    `Salam terhangat, dari seseorang yang bahkan kamu gak save nomornya.`,
    `Dari aku, yang hanya bisa memandangmu dari status WhatsApp.`,
    `Dengan penuh cinta palsu,`,
    `Yang mencintaimu dalam diam dan chat yang tak pernah kamu balas.`,
    `Sekian, sebelum kamu buang surat ini ke spam.`
  ]
})

function gayaHalah(text) {
  if (/cangratalataans|laval|rala|raward|samakan|sarang|barantaraksa|nashakaga chasata/i.test(text)) return null
  return text.replace(/[aeou]/gi, "a").replace(/congratulations/gi, "cangratalataans").replace(/you/gi, "yaa").replace(/level/gi, "laval").replace(/role/gi, "rala").replace(/reward/gi, "raward").replace(/semakin/gi, "samakan").replace(/sering/gi, "sarang").replace(/berinteraksi/gi, "barantaraksa").replace(/dengan/gi, "dangan").replace(/nishikigi chisato/gi, "nashakaga chasata").replace(/money/gi, "manay")
}

function gayaHilih(text) {
  if (/cingritilitiins|livil|rili|riwird|simikin|siring|birintiriksi|nishikigi chisiti/i.test(text)) return null
  return text.replace(/[aeou]/gi, "i").replace(/congratulations/gi, "cingritilitiins").replace(/you/gi, "yii").replace(/level/gi, "livil").replace(/role/gi, "rili").replace(/reward/gi, "riwird").replace(/semakin/gi, "simikin").replace(/sering/gi, "siring").replace(/berinteraksi/gi, "birintiriksi").replace(/dengan/gi, "dingin").replace(/nishikigi chisato/gi, "nishikigi chisiti").replace(/money/gi, "miniy")
}

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const card = (emoji, title, rows, note) => {
  const w = Math.max(...rows.map(r => r[0].length))
  return box(emoji, title, rows.map(([k, v]) => `♡ ${k.padEnd(w)} : ${v}`).join('\n'), note)
}
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')
const send = (conn, m, text, mentions = []) => conn.sendMessage(m.chat, { text, mentions }, { quoted: m })
const bar = (p, w = 10) => '▰'.repeat(Math.round(p / 100 * w)) + '▱'.repeat(w - Math.round(p / 100 * w))
const targetsOf = m => [...new Set([...(m.mentionedJid || []), m.quoted?.sender].filter(Boolean))]
const quotedText = m => m.quoted?.text || m.quoted?.body || m.quoted?.msg?.text || m.quoted?.msg?.caption || ''

const E = {}
const add = (key, cmds, run) => { E[key] = { cmds, run } }

add('affirmation', ['affirmation', 'afirmasi'], ({ m }) => m.reply(box('🌻', 'Afirmasi Hari Ini', `"${pick(AFFIRM)}"`)))

add('compliment', ['compliment', 'puji'], ({ conn, m }) => {
  const t = m.mentionedJid?.[0] || m.quoted?.sender || null
  const puji = pick(COMPLI)
  return send(conn, m, box('✨', 'Pujian', t ? `@${num(t)} ${puji}` : `Kamu ${puji}`), t ? [t] : [])
})

add('dadjoke', ['dadjoke'], ({ m }) => m.reply(box('😂', 'Dad Joke', pick(DADJOKE))))
add('fakta', ['fakta', 'faktaunik'], ({ m }) => m.reply(box('🧠', 'Fakta Unik', pick(FAKTA))))
add('konspirasi', ['konspirasi', 'conspiracy'], ({ m }) => m.reply(box('👽', 'Teori Konspirasi Random', pick(KONSPI), '_(murni untuk hiburan ya!)_')))
add('motivasi', ['motivasi', 'quotes', 'semangat'], ({ m }) => m.reply(box('💬', 'Motivasi', `_${pick(MOTIVASI)}_`)))
add('pantun', ['pantun'], ({ m }) => m.reply(box('📜', 'Pantun', pick(PANTUN))))
add('gombal', ['gombal', 'gombalan'], ({ m }) => m.reply(box('💘', 'Gombal', pick(GOMBAL))))
add('jokes', ['jokes', 'receh', 'lawak'], ({ m }) => { const [q, a] = pick(JOKES); return m.reply(box('😆', 'Jokes Receh', `${q}\n\n➡️ ${a}`)) })
add('rizz', ['rizz', 'pickup', 'gombalan2'], ({ m }) => m.reply(box('😏', 'Rizz Mode', pick(RIZZ), '_Dipakai dengan bijak ya!_')))

add('roast', ['roast', 'ejek'], ({ conn, m }) => {
  const t = targetsOf(m)[0] || m.sender
  return send(conn, m, box('🔥', 'Roasting Time', `@${num(t)}, ${pick(ROAST)}`, '_Cuma bercanda ya, jangan baper 😆_'), [t])
})

add('fortune', ['fortune', 'nasib', 'fortunecookie'], ({ m }) => m.reply(card('🥠', 'Fortune Cookie', [
  ['Pesan', `_"${pick(FORTUNE)}"_`],
  ['Angka Hoki', [rand(1, 99), rand(1, 99), rand(1, 99)].join(' • ')],
  ['Warna Hoki', pick(COLORS)],
  ['Jam Hoki', `${String(rand(0, 23)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`]
])))

add('kataharian', ['kataharian', 'katabaru', 'quotehariini'], ({ m }) => {
  const [w, d] = KATA_W[dayRand('kata', 0, KATA_W.length - 1)]
  return m.reply(box('📖', 'Kata Hari Ini', `✨ *${w}*\n_${d}_\n\n💬 *Kutipan harian*\n${KATA_Q[dayRand('quote', 0, KATA_Q.length - 1)]}`))
})

add('tantanganharian', ['tantanganharian', 'challenge', 'tantangan1'], ({ m }) => {
  const i = dayRand('chal', 0, TANTANGAN.length - 1)
  return m.reply(box('🎯', 'Tantangan Hari Ini', `${TANTANGAN[i]}\n\n⭐ *Bonus:* ${TANTANGAN[(i + 5) % TANTANGAN.length]}`, '_Berganti tiap hari. Selesaikan sebelum tidur!_'))
})

add('wordofday', ['wordofday', 'katabijak'], ({ m }) => { const w = pick(WORDS); return m.reply(box('📖', 'Kata Hari Ini', `*${w.word}*\n_${w.meaning}_`)) })
add('secretadmirer', ['secretadmirer'], ({ m }) => m.reply(box('💌', 'Pesan Misterius', `"${pick(ADMIRER)}"`)))

add('magic8ball', ['magic8ball'], ({ m, text }) => {
  const q = String(text || '').trim()
  return m.reply(card('🎱', 'Magic 8-Ball', [...(q ? [['Tanya', q]] : []), ['Jawab', pick(ANS8)]]))
})

add('randomemoji', ['randomemoji'], async ({ m }) => {
  const e = pick(EMOJIS)
  try { await m.react?.(e) } catch {}
  return m.reply(box('🎲', 'Emoji Random', e))
})

add('luckynumber', ['luckynumber', 'angkehoki'], ({ m }) => m.reply(card('🍀', 'Angka Keberuntungan', [['Angka Hoki', `*${rand(1, 99)}*`]], 'Semoga harimu penuh keberuntungan!')))

add('ratemyday', ['ratemyday'], ({ m }) => {
  const score = rand(1, 10)
  const C = {
    low: 'Hari yang cukup berat dan melelahkan, tapi besok pasti jauh lebih baik! Tetap semangat ya!',
    mid: 'Hari yang cukup stabil dan oke, pertahankan energi positifmu!',
    high: 'Hari yang sangat luar biasa indah, bersyukur dan nikmati harimu!'
  }
  return m.reply(card('📅', 'Rating Hari Ini', [['Skor', `${score}/10`], ['Catatan', C[score <= 3 ? 'low' : score <= 7 ? 'mid' : 'high']]]))
})

add('rate', ['rate', 'nilai'], ({ m, text, command, p }) => {
  const t = String(text || '').trim()
  if (!t) return m.reply(usage('📊', 'Rate', ['Mau menilai apa?', '', `♡ ${p}${command} ganteng gue`]))
  const v = rand(0, 100)
  return m.reply(card('📊', 'Rate', [['Objek', t], ['Nilai', `${bar(v)} ${v}%`]]))
})

add('seberapagila', ['seberapagila'], ({ m, text }) => {
  const nama = String(text || '').trim() || m.pushName || 'Kamu'
  const persen = rand(0, 100)
  return m.reply(card('🧠', 'Tes Kegilaan Hari Ini', [['Nama', nama], ['Gila', `${bar(persen)} ${persen}%`], ['Komentar', pick(GILA)]]))
})

add('kematian', ['kematian'], ({ m, text }) => {
  const nama = String(text || '').trim() || m.pushName || 'Kamu'
  const now = new Date()
  const future = new Date(now.getFullYear() + 70, 0, 1)
  const tanggal = new Date(now.getTime() + Math.random() * (future.getTime() - now.getTime())).toDateString()
  return m.reply(card('💀', 'Ramalan Kematian', [['Nama', nama], ['Tanggal', tanggal], ['Penyebab', pick(MATI)]], '_Murni bercanda, jangan dianggap serius._'))
})

add('tebakumur', ['tebakumur'], ({ m, text, command, p }) => {
  const t = String(text || '').trim()
  if (!t) return m.reply(usage('🎂', 'Tebak Umur', ['Masukkan namamu dulu.', '', `♡ ${p}${command} Budi`]))
  return m.reply(card('🎂', 'Tebak Umur', [['Nama', t], ['Umur', pick(UMUR)]]))
})

add('umurhewan', ['umurhewan', 'umurkucing', 'umuranjing'], ({ m, text, command, p }) => {
  const args = String(text || '').trim().split(/\s+/).filter(Boolean)
  let jenis = (args[0] || '').toLowerCase()
  let u = Number(String(args[1] || args[0] || '').replace(',', '.'))
  if (command === 'umurkucing') { jenis = 'kucing'; u = Number(String(args[0]).replace(',', '.')) }
  if (command === 'umuranjing') { jenis = 'anjing'; u = Number(String(args[0]).replace(',', '.')) }
  if (!['kucing', 'anjing'].includes(jenis) || !(u > 0 && u <= 40)) {
    return m.reply(usage('🐾', 'Umur Hewan', [`♡ ${p}umurhewan kucing 3`, `♡ ${p}umuranjing 5`]))
  }
  const h = jenis === 'kucing'
    ? (u <= 1 ? u * 15 : u <= 2 ? 15 + (u - 1) * 9 : 24 + (u - 2) * 4)
    : (u <= 1 ? u * 15 : u <= 2 ? 15 + (u - 1) * 9 : 24 + (u - 2) * 5)
  return m.reply(card('🐾', `Umur ${jenis[0].toUpperCase() + jenis.slice(1)}`, [['Umur hewan', `${u} tahun`], ['Setara manusia', `±${Math.round(h)} tahun`]], '_Perkiraan umum, tiap ras berbeda._'))
})

add('ngising', ['ngising', 'ngeden', 'boker', 'pup'], ({ conn, m }) => {
  const bau = rand(0, 100)
  const status = bau >= 80 ? '☣️ Bahaya' : bau >= 50 ? '⚠️ Lumayan' : '🌸 Aman'
  return send(conn, m, card('💩', 'Status Ngising', [
    ['User', '@' + num(m.sender)],
    ['Lokasi', pick(NG_LOKASI)],
    ['Durasi', `${rand(1, 20)} menit ${rand(0, 59)} detik`],
    ['Bau', `${bau}% (${status})`],
    ['Efek', pick(NG_SUARA)],
    ['Komentar', pick(NG_KOMEN)]
  ]), [m.sender])
})

add('sifat', ['sifat', 'kepribadian'], ({ conn, m, text }) => {
  const t = targetsOf(m)[0]
  const arg = String(text || '').trim()
  const label = t ? '@' + num(t) : arg || '@' + num(m.sender)
  const key = t ? num(t) : arg.toLowerCase() || num(m.sender)
  let h = 2166136261
  for (const c of `sifat-${key}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296)
  const pool = [...TRAITS]
  const chosen = [0, 1, 2].map(() => pool.splice(Math.floor(r() * pool.length), 1)[0])
  const body = chosen.map(x => `♡ ${x} : ${Math.floor(r() * 61) + 40}%`).join('\n')
  const mentions = t ? [t] : label.startsWith('@') ? [m.sender] : []
  return send(conn, m, box('🧬', 'Sifat', `${label}\n\n${body}`, '_Hanya hiburan, hasil tetap sama untuk orang yang sama._'), mentions)
})

add('jodoh', ['jodoh', 'cocok', 'ship'], ({ conn, m, command, p }) => {
  const t = targetsOf(m)
  const [a, b] = t.length >= 2 ? t : [m.sender, t[0]]
  if (!b) return m.reply(usage('💘', 'Kecocokan', ['Tag orangnya.', '', `♡ ${p}${command} @user`, `♡ ${p}${command} @user1 @user2`]))
  const key = [num(a), num(b)].sort().join(':')
  const v = crypto.createHash('md5').update(key).digest().readUInt16BE(0) % 101
  const hearts = '❤️'.repeat(Math.round(v / 10)) + '🖤'.repeat(10 - Math.round(v / 10))
  const verdict = v >= 90 ? 'Jodoh banget! 💍' : v >= 70 ? 'Cocok nih, gas! 💕' : v >= 50 ? 'Lumayan, perlu usaha 😊' : v >= 30 ? 'Hmm, agak berat 😅' : 'Mending temenan aja 😬'
  return send(conn, m, card('💘', 'Kecocokan', [['Pasangan', `@${num(a)} ❤ @${num(b)}`], ['Level', hearts], ['Hasil', `${v}%`], ['Vonis', verdict]]), [a, b])
})

add('pilihmakan', ['pilihmakan', 'makanapa', 'laper'], ({ m, text }) => {
  const k = String(text || '').trim().split(/\s+/)[0]?.toLowerCase() || ''
  const menu = FOOD[k] ? pick(FOOD[k]) : pick(FOOD.berat)
  const alt = shuffle([...FOOD.berat, ...FOOD.ringan]).filter(x => x !== menu).slice(0, 2)
  return m.reply(card('🍽️', 'Makan Apa Hari Ini?', [['Menu', `*${menu}*`], ['Minum', pick(FOOD.minum)], ['Cadangan', alt.join(' / ')]], '_Kategori: berat, ringan, minum_'))
})

add('pilih', ['pilih', 'pick'], ({ m, text, command, p }) => {
  const opts = String(text || '').split(/\s*(?:\||,|\batau\b)\s*/i).map(s => s.trim()).filter(Boolean)
  if (opts.length < 2) return m.reply(usage('🎯', 'Pilih', ['Beri minimal 2 pilihan.', '', `♡ ${p}${command} makan | tidur | main game`]))
  return m.reply(card('🎯', 'Pilih', [['Pilihan', opts.join(' / ')], ['Aku pilih', `*${pick(opts)}*`]]))
})

add('koin', ['koin', 'coin', 'flip'], ({ m }) => m.reply(card('🪙', 'Lempar Koin', [['Hasil', `*${pick(['Kepala', 'Ekor'])}*`]])))

add('dadu', ['dadu', 'roll'], ({ m, text }) => {
  const sides = Math.min(Math.max(parseInt(String(text || '').trim().split(/\s+/)[0], 10) || 6, 2), 1000)
  return m.reply(card('🎲', 'Lempar Dadu', [['Sisi', sides], ['Hasil', `*${rand(1, sides)}*`]]))
})

add('namagen', ['namagen', 'nickgen', 'namaff', 'namafantasi'], ({ m, text }) => {
  const base = String(text || '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 12)
  const nicks = Array.from({ length: 6 }, () => base
    ? pick([`${base}${pick(NAMA_B)}`, `${pick(NAMA_A)}${base}`, `${base}_${rand(10, 99)}`, `xX${base}Xx`, `${base}${pick(NAMA_A)}`])
    : `${pick(NAMA_A)}${pick(NAMA_B)}${pick(['', '_', 'x'])}${rand(1, 99)}`)
  const fant = Array.from({ length: 4 }, () => pick(NAMA_F1) + pick(NAMA_F2) + ' ' + pick(NAMA_F1) + pick(NAMA_F2))
  return m.reply(box('🪪', 'Generator Nama', `*Nama game*\n${nicks.map(n => `♡ ${n}`).join('\n')}\n\n*Nama fantasi*\n${fant.map(n => `♡ ${n}`).join('\n')}`))
})

add('emojify', ['emojify', 'hurufemoji', 'bigtext'], ({ m, text, command, p }) => {
  const s = String(text || quotedText(m) || '').toLowerCase().slice(0, 60)
  if (!s) return m.reply(usage('🔤', 'Emojify', [`♡ ${p}${command} halo`]))
  const regional = c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 97)
  return m.reply([...s].map(c => (/[a-z]/.test(c) ? `${regional(c)} ` : EMOJI_M[c] || (c === ' ' ? '   ' : c))).join('').trim())
})

add('textstyle', ['uwu', 'gema', 'ngegas', 'lirih', 'mocking'], ({ m, text, command, p }) => {
  const s = String(text || quotedText(m) || '').trim()
  if (!s) return m.reply(usage('✍️', 'Gaya Teks', ['Masukkan teks atau balas pesan.', '', `♡ ${p}${command} aku lapar banget`]))
  if (s.length > 500) return m.gagal('Teks terlalu panjang (maks 500 karakter).', 'Gaya Teks')
  return m.reply(TSTYLE[command](s))
})

add('halah', ['halah', 'hilih'], ({ m, text, command, p }) => {
  const s = String(text || quotedText(m) || '').trim()
  if (!s) return m.reply(usage('🔁', 'Halah / Hilih', [`Kirim teks setelah ${p}${command} atau balas pesan teks.`]))
  const out = command === 'hilih' ? gayaHilih(s) : gayaHalah(s)
  if (!out) return m.gagal('Teks ini sudah pernah diubah sebelumnya.', 'Halah / Hilih')
  return m.reply(out)
})

const GOJO_ALIAS = { gojoquote: 'gquote', gojofact: 'gfact', gojohype: 'ghype', gojopower: 'gpower', gojotech: 'gtech' }
const GOJO_TITLE = { gquote: 'Gojo Quote', gfact: 'Gojo Fact', ghype: 'Gojo Hype', gpower: 'Gojo Power', gtech: 'Gojo Tech' }
add('gojo', [...Object.keys(GOJO), ...Object.keys(GOJO_ALIAS)], ({ m, command }) => {
  const k = GOJO[command] ? command : GOJO_ALIAS[command]
  return m.reply(box('♾️', GOJO_TITLE[k] || 'Gojo', pick(GOJO[k])))
})

add('lupakan', ['lupakan'], ({ m }) => m.reply(box('🕊️', 'Lupakan Masa Lalu', `${pick(LUPAKAN)}\n\nIngat, kamu lebih kuat dari yang kamu pikirkan. Masa depan penuh kemungkinan! 💪✨`)))

add('moveon', ['moveon'], async ({ conn, m }) => {
  for (const t of MOVE_TEKS) { await conn.sendMessage(m.chat, { text: t }, { quoted: m }); await sleep(1600) }
  return conn.sendMessage(m.chat, { text: pick(MOVE_ALASAN) + `\n\n${FOOTER}` }, { quoted: m })
})

add('suratcinta', ['suratcinta'], ({ m, text, command, p }) => {
  const target = String(text || '').trim()
  if (!target) return m.reply(usage('💌', 'Surat Cinta Palsu', ['Tulis nama orang yang mau dikirimi surat.', '', `♡ ${p}${command} Budi`]))
  const s = SURAT(target)
  return m.reply(box('💌', 'Surat Cinta Palsu', `${pick(s.pembuka)}\n\n${pick(s.isi)}\n\n${pick(s.penutup)}`))
})

const MAP = {}
for (const [key, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/random] command ganda: ${c}`)
  MAP[c] = key
}

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const key = MAP[cmd]
  if (!key) return
  try {
    return await E[key].run({ conn, m, text, command: cmd, p })
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Fun')
  }
}

handler.help = ['afirmasi', 'puji', 'dadjoke', 'fakta', 'konspirasi', 'motivasi', 'pantun', 'gombal', 'jokes', 'rizz', 'roast', 'fortune', 'kataharian', 'tantanganharian', 'wordofday', 'secretadmirer', 'magic8ball', 'randomemoji', 'luckynumber', 'ratemyday', 'rate <apa>', 'seberapagila', 'kematian', 'tebakumur <nama>', 'umurhewan <kucing|anjing> <tahun>', 'ngising', 'sifat', 'jodoh @user', 'pilihmakan', 'pilih a | b', 'koin', 'dadu', 'namagen', 'emojify <teks>', 'uwu <teks>', 'halah <teks>', 'gquote', 'lupakan', 'moveon', 'suratcinta <nama>']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
