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
const rnd = (min, span) => Math.floor(Math.random() * span) + min
const num = j => String(j || '').split('@')[0].split(':')[0]
const bar = (p, w = 10) => '▰'.repeat(Math.round(p / 100 * w)) + '▱'.repeat(w - Math.round(p / 100 * w))

const DEFS = {
 "cekbodoh": {
  "kind": "tier",
  "alias": [
   "cektolol",
   "tololcek"
  ],
  "title": "🧠 CEK KEBODOHAN / TOLOL",
  "tiers": [
   [
    85,
    "Tolol Abadi 🗿",
    "Tolol murni tanpa rekayasa! Sering lupa nama sendiri!"
   ],
   [
    60,
    "Agak Kurang 🤪",
    "Sering kebalik pake sendal jepit."
   ],
   [
    30,
    "Lemot Sesaat 🐌",
    "Kadang lemot tapi aslinya pintar."
   ],
   [
    0,
    "Jenius Abadi 🎓",
    "Genius! Pintar tiada tanding!"
   ]
  ]
 },
 "cekgay": {
  "kind": "tier",
  "alias": [
   "gaycheck"
  ],
  "title": "🌈 CEK TINGKAT GAY",
  "tiers": [
   [
    85,
    "Gay Akut 🌈",
    "Pelangi abadi! Suka cowok berotot wangi!"
   ],
   [
    60,
    "Agak Melambai 💅",
    "Kadang tatapannya agak mencurigakan ke cowok lain."
   ],
   [
    30,
    "Wajar Saja 👍",
    "Normal tapi suka nonton anime cowok tampan."
   ],
   [
    0,
    "Straight Sejati 🗿",
    "Lelaki tulen, anti belok!"
   ]
  ]
 },
 "ceklesbi": {
  "kind": "tier",
  "alias": [
   "lesbicheck"
  ],
  "title": "👭 CEK TINGKAT LESBI",
  "tiers": [
   [
    85,
    "Lesbi Akut 👭",
    "Sangat suka cewek aesthetic tomboy!"
   ],
   [
    60,
    "Suka Sesama 🫣",
    "Suka salting kalau dipeluk temen cewek."
   ],
   [
    30,
    "Wajar Saja 🌸",
    "Suka mengagumi cewek cantik secara wajar."
   ],
   [
    0,
    "Straight Sejati 💃",
    "Wanita tulen pecinta cowok!"
   ]
  ]
 },
 "ceksange": {
  "kind": "tier",
  "alias": [
   "sangecheck"
  ],
  "title": "🌶️ CEK TINGKAT SANGE",
  "tiers": [
   [
    85,
    "Sange Akut 🥵",
    "Pikiran kotor 24/7! Liat knalpot motor aja ngeres!"
   ],
   [
    60,
    "Agak Liar 🫣",
    "Sering mikir ngeres pas lagi ngelamun sendirian."
   ],
   [
    30,
    "Terkendali 😌",
    "Normal, masih punya rasa malu dan iman."
   ],
   [
    0,
    "Suci Polos 👼",
    "Pikiran suci murni, hatinya sebersih kain kafan!"
   ]
  ]
 },
 "ceksetan": {
  "kind": "tier",
  "alias": [
   "setancheck"
  ],
  "title": "👻 CEK KESETANAN AURA",
  "tiers": [
   [
    85,
    "Raja Iblis 😈",
    "Dajjal minder liat kelakuan lu yang super usil!"
   ],
   [
    60,
    "Tukang Kompor 👺",
    "Hobi ngomporin temen biar ribut."
   ],
   [
    30,
    "Usil Biasa 😜",
    "Kadang nakal dikit kalau lagi iseng."
   ],
   [
    0,
    "Malaikat Bumi 😇",
    "Anak sholeh/sholehah idaman mertua!"
   ]
  ]
 },
 "cekbucin": {
  "kind": "tier",
  "alias": [
   "bucincheck"
  ],
  "title": "💖 CEK TINGKAT BUCIN",
  "tiers": [
   [
    85,
    "Bucin Akut 🫠",
    "Bucin stadium 4! Rela jadi babu asal dia senyum!"
   ],
   [
    60,
    "Bucin Standar 🥰",
    "Suka salah tingkah kalo dichat ayang."
   ],
   [
    30,
    "Cinta Logis 🧠",
    "Masih pake logika, belum dibutakan cinta."
   ],
   [
    0,
    "Hati Baja 🗿",
    "Batu karang! Hatinya beku gak mempan digombalin!"
   ]
  ]
 },
 "ceksial": {
  "kind": "tier",
  "alias": [
   "sialcheck"
  ],
  "title": "💀 CEK TINGKAT KESIALAN",
  "tiers": [
   [
    85,
    "Apes Abadi 😭",
    "Sial abadi! Beli es krim aja jatuh ke lantai!"
   ],
   [
    60,
    "Sering Apes 🫣",
    "Sering kena sial kecil seperti kejatuhan cicak."
   ],
   [
    30,
    "Standar Imbang ☯️",
    "Kadang sial kadang untung, hidup imbang."
   ],
   [
    0,
    "Maha Hoki 🍀",
    "Keberuntungan 100%! Hoki tiada tanding!"
   ]
  ]
 },
 "cekalim": {
  "kind": "score",
  "alias": [],
  "title": "📿 CEK TINGKAT ALIM 📿",
  "tiers": [
   [
    20,
    "Jarang ibadah, hayo buruan taubat sebelum terlambat! 🥺"
   ],
   [
    40,
    "Alim pas ada maunya atau pas kepepet doang~ 😅"
   ],
   [
    60,
    "Rajin ibadah, calon menantu idaman mertua! 🤲"
   ],
   [
    80,
    "Hafal juz amma dan selalu jaga pandangan, masyaAllah! 📖✨"
   ],
   [
    101,
    "ALIM TINGKAT TINGGI, AURA KESALEHAN BERSINAR TERANG! 🌟🕋"
   ]
  ]
 },
 "cekbego": {
  "kind": "score",
  "alias": [],
  "title": "🤪 CEK TINGKAT BEGO 🤪",
  "tiers": [
   [
    20,
    "Aman, masih waras dan punya akal sehat! 😇"
   ],
   [
    40,
    "Bego dikit-dikit pas disuruh mikir logika~ 🙈"
   ],
   [
    60,
    "Sering loading lama kalo diajak ngobrol! 🤦‍♂️"
   ],
   [
    80,
    "Bego stadium 3, jangan biarin bikin keputusan! 😭"
   ],
   [
    101,
    "BEGO TANPA BATAS, OTAKNYA HILANG KETINGGALAN DI RUMAH! 💀"
   ]
  ]
 },
 "cekharam": {
  "kind": "score",
  "alias": [],
  "title": "☠️ CEK KADAR HARAM ☠️",
  "tiers": [
   [
    20,
    "Suci bersih bagaikan bayi baru lahir! 🕊️"
   ],
   [
    40,
    "Dosa kecil dikit pas ghibahin tetangga doang~ 🤭"
   ],
   [
    60,
    "Kelakuan agak haram, sering bolos dan rebahan! 😈"
   ],
   [
    80,
    "Pikiran dan tingkahnya kotor banget astaga! 🙈"
   ],
   [
    101,
    "HARAM BIANG KELADI, SETAN AJA SUJUD SUNGKEM! 👹🔥"
   ]
  ]
 },
 "cekstres": {
  "kind": "score",
  "alias": [],
  "title": "🤯 CEK TINGKAT STRES 🤯",
  "tiers": [
   [
    20,
    "Santai tanpa beban, hidup damai sejahtera! 🧘"
   ],
   [
    40,
    "Agak pusing tugas/pekerjaan dikit, masih wajar~ ☕"
   ],
   [
    60,
    "Mulai sering ngelamun dan overthinking tiap malem! 🌙"
   ],
   [
    80,
    "Stres berat butuh liburan ke Bali sekarang juga! 🏖️"
   ],
   [
    101,
    "STRES MAKSIMAL MAU GILA, BURUAN REFRESHING SEBELUM RUSAK! 💥🚨"
   ]
  ]
 },
 "ceksadboy": {
  "kind": "score",
  "alias": [],
  "title": "🥀 CEK KADAR SADBOY 🥀",
  "tiers": [
   [
    20,
    "Hatinya bahagia tanpa trauma cinta! ☀️"
   ],
   [
    40,
    "Kadang melow kalo denger lagu galau pas hujan~ 🌧️"
   ],
   [
    60,
    "Sering stalking sosmed mantan tengah malem! 📱"
   ],
   [
    80,
    "Spesialis korban ghosting dan cinta bertepuk sebelah tangan! 🥀"
   ],
   [
    101,
    "SADBOY SEJATI, AIR MATANYA BISA BIKIN BANJIR IBU KOTA! 😭💔"
   ]
  ]
 },
 "cekdosa": {
  "kind": "list",
  "alias": [
   "dosacheck"
  ],
  "title": "😈 DETEKTOR DOSA KECIL",
  "min": 50,
  "span": 50,
  "metric": "Kadar Dosa",
  "cat": "Dosa Kecil Lucu 🙈",
  "l2": "Dosa Terdeteksi",
  "list": [
   "Makan gorengan 5 ngakunya cuma 2 ke abang kang gorengan 🥟",
   "Pura-pura budek pas emak manggil nyuruh beli royco 🙉",
   "Nge-read chat gebetan 3 hari kemudian baru bales \"wkwk iya\" 💀",
   "Minjem korek api temen tapi langsung masuk kantong celana 🚬",
   "Pura-pura tidur pas temen lagi bagi-bagi tagihan nongkrong 😴",
   "Nyolong wifi tetangga sambil download game 50GB 📶",
   "Stalking akun mantan pake fake account sampai kepencet like postingan 3 tahun lalu 📱",
   "Ngomong \"otw\" padahal baru bangun tidur masih iler-an 🛵",
   "Ngetik \"wkwkwk\" di chat padahal mukanya datar kayak triplek 🗿",
   "Balikin piring hajatan tetangga tapi isinya malah remahan biskuit 🍽️"
  ]
 },
 "cekstalker": {
  "kind": "list",
  "alias": [
   "stalkerrate"
  ],
  "title": "🕵️‍♂️ CEK TINGKAT STALKER",
  "min": 40,
  "span": 60,
  "metric": "Kadar Stalker",
  "l1": "Tipe Stalker",
  "l2": "Perilaku",
  "list": [
   {
    "tipe": "Stalker Profesional 😎",
    "desc": "Sering kepoin story sampai ke postingan 3 tahun lalu!"
   },
   {
    "tipe": "Pengagum Rahasia 🤫",
    "desc": "Cuma berani ngeliatin foto profil tanpa berani nge-chat."
   },
   {
    "tipe": "Detektif Media Sosial 🕵️‍♂️",
    "desc": "Tahu semua seluk beluk teman & aktivitas harianmu."
   },
   {
    "tipe": "Stalker Gagal 😅",
    "desc": "Niatnya kepoin story tapi kepencet love postingan lama!"
   }
  ]
 },
 "cekwatak": {
  "kind": "list",
  "alias": [
   "ceksifat",
   "watak",
   "watakcheck"
  ],
  "title": "🧠 ANALISIS WATAK ASLI",
  "min": 50,
  "span": 50,
  "metric": "Empati",
  "l1": "Tipe Kepribadian",
  "l2": "Karakteristik",
  "list": [
   {
    "tipe": "Sanguinis (Periang & Ceria) ✨",
    "desc": "Suka bersosialisasi, ceria, & selalu jadi pusat perhatian."
   },
   {
    "tipe": "Koleris (Pemimpin & Tegas) 👑",
    "desc": "Berjiwa pemimpin, mandiri, ambisius, & berani mengambil risiko."
   },
   {
    "tipe": "Melankolis (Perasa & Detail) 🎨",
    "desc": "Pemikir mendalam, perfeksionis, sangat setia, & perasa halus."
   },
   {
    "tipe": "Plegmatis (Damai & Santai) 🌿",
    "desc": "Penyabar, tidak suka konflik, pendengar yang baik, & tenang."
   }
  ]
 },
 "pacarcheck": {
  "kind": "list",
  "alias": [
   "pacaranrate"
  ],
  "title": "👩‍❤️‍👨 CEK POTENSI PACARAN",
  "min": 50,
  "span": 51,
  "metric": "Potensi",
  "need": true,
  "catHi": [
   "Calon Pacar Idaman 💕",
   "Bisa Diusahakan 💓"
  ],
  "l2": "Alasan Cocok",
  "list": [
   "Karena senyumannya bikin meleleh seharian! 😍",
   "Karena kalau ngobrol nyambung banget dari A-Z! 🗣️",
   "Karena tatapan matanya bikin salah tingkah! 😳",
   "Karena sering jajanin kopi estetik tiap weekend! ☕",
   "Karena kalau berantem langsung dikirim makanan enak! 🍕",
   "Karena humornya sefrekuensi bikin ketawa melulu! 🤣"
  ]
 },
 "aura": {
  "kind": "list",
  "alias": [
   "auracheck"
  ],
  "title": "👸 CEK AURA KECANTIKAN",
  "min": 50,
  "span": 51,
  "metric": "Kecantikan",
  "l1": "Tipe Aura",
  "list": [
   "Bidadari Surga Turun Ke Bumi ✨👸",
   "Cewek Skena Estetik Korean Look 💄🌸",
   "Manis Alami Tanpa Filter 💕",
   "Imut Menggemaskan Kayak Anime Girl 👧",
   "Elegan & Anggun Mempesona 🌹"
  ]
 },
 "ceksetia": {
  "kind": "list",
  "alias": [
   "setiacheck"
  ],
  "title": "🔒 CEK TINGKAT KESETIAAN",
  "min": 50,
  "span": 51,
  "metric": "Kesetiaan",
  "catHi": [
   "Setia Setengah Mati 💎",
   "Cukup Setia 💚"
  ],
  "l2": "Alasan",
  "list": [
   "Karena hatinya hanya terpaut pada satu nama selamanya! 💖",
   "Karena anti melirik ke lawan jenis lain kalau udah sayang. 😍",
   "Karena kalau berjanji selalu ditepati sampai akhir. 🤝",
   "Masih agak sering lirak-lirik tapi tetap ingat jalan pulang. 😅",
   "Setia banget kalau lagi ada maunya aja nih! 🙈"
  ]
 }
}

const MUSUH = [
 "Lawan Bebuyutan Sejak TK ⚔️",
 "Musuh Bebuyutan Rebutan Makanan 🍕",
 "Rival Abadi Di Game Online 🎮",
 "Sahabat Tapi Sering Berantem Cekcok 🤼‍♂️",
 "Musuh Karena Mantan 💔"
]

const OTOT = {
 "bentukList": [
  "sixpack samar 😎",
  "berisi dan padat 💪",
  "atlet vibes 🏋️",
  "bodybuilder mode 🔥",
  "lean tapi kuat ⚡",
  "dad bod santai 😌",
  "tipis tapi effort 😅",
  "kenceng kayak batu 🗿"
 ],
 "roastList": [
  "ini otot apa bayangan? 😭",
  "tipis banget njir 🗿",
  "angin lewat langsung goyang 😅",
  "push up 1x udah capek 😭",
  "kayak belum unlock fitur 💀"
 ],
 "pujianList": [
  "gila ini sih tank 🔥",
  "sekali pukul KO 😎",
  "body idaman 😭",
  "auto jadi sigma 💪",
  "monster gym 🗿"
 ]
}

const PERF = {
 "efekList": [
  "getar dikit 😭",
  "mode santai 😌",
  "agresif 🔥",
  "auto aim 🗿",
  "combo cepat ⚡",
  "delay dikit 😅",
  "full fokus 😎",
  "mode barbar 💀"
 ],
 "roastList": [
  "baru mulai udah selesai 🗿",
  "speedrun any% 😭",
  "kayak iklan doang bentar 😅",
  "loading lama, selesai cepet 🗿",
  "timing nya... ya gitu lah 😭"
 ],
 "pujianList": [
  "tahan lama boss 🔥",
  "pro player 😎",
  "gak ada lawan 💀",
  "legendary performa 😭",
  "full combo tanpa miss 🗿"
 ]
}

const KHODAM = [
 {
  "nama": "Kucing Rawa",
  "deskripsi": "Berkeliaran di rawa, suka ngeong bareng genderuwo"
 },
 {
  "nama": "Biawak Samudra",
  "deskripsi": "Punya insang, tapi alergi air"
 },
 {
  "nama": "Kipas Angin",
  "deskripsi": "Suka muter tapi diem di tempat"
 },
 {
  "nama": "Farhan Kebab",
  "deskripsi": "Kalau dipanggil langsung bikin lapar"
 },
 {
  "nama": "Rossi Becak",
  "deskripsi": "Juara MotoGP tapi naik becak"
 },
 {
  "nama": "Karyawan Indomaret",
  "deskripsi": "Senyumnya ga pernah habis, kayak promo diskon"
 },
 {
  "nama": "Peti Harta",
  "deskripsi": "Bisa isi emas, bisa isi utang"
 },
 {
  "nama": "Kuntilanak Lucu",
  "deskripsi": "Suka ngelawak, bikin tuyul ketawa"
 },
 {
  "nama": "Pocong berkepala 3",
  "deskripsi": "Kepalanya banyak, tapi isi tetep kosong"
 },
 {
  "nama": "Pace Yunus",
  "deskripsi": "Pace legendaris, bisa main bola sambil terbang"
 },
 {
  "nama": "Kepala Casan",
  "deskripsi": "Bisa ngisi baterai, tapi suka overheat"
 },
 {
  "nama": "Pisang Hijau",
  "deskripsi": "Manisnya menipu, kayak mantan"
 },
 {
  "nama": "Zebra Merah",
  "deskripsi": "Langka, cuma muncul kalau kamu ngutang"
 },
 {
  "nama": "Handuk Basah",
  "deskripsi": "Nempel terus, terutama pas abis mandi"
 },
 {
  "nama": "Tuyul",
  "deskripsi": "Ahli ekonomi gelap. Master dompet kosong"
 },
 {
  "nama": "Torpedo Kambing",
  "deskripsi": "Bisa meledak kalo disentil"
 },
 {
  "nama": "Semut Hitam",
  "deskripsi": "Kecil tapi suka ngerusuh di dapur"
 },
 {
  "nama": "Naga Merah",
  "deskripsi": "Suka muncul pas listrik padam"
 },
 {
  "nama": "Barbie",
  "deskripsi": "Cantik tapi gak bisa masak"
 },
 {
  "nama": "Gondoruwo Ganteng",
  "deskripsi": "Gondoruwo versi boyband"
 },
 {
  "nama": "Bocah Santet",
  "deskripsi": "Kecil-kecil cabut uban tetangga"
 },
 {
  "nama": "Celana Dalam Hilang",
  "deskripsi": "Sumber misteri terbesar di kosan"
 },
 {
  "nama": "Susu Tumpah",
  "deskripsi": "Suka bikin lantai licin dan hati was-was"
 },
 {
  "nama": "Ikan Gabus Terbang",
  "deskripsi": "Terbang kalau ngantuk"
 },
 {
  "nama": "Bantal Bau",
  "deskripsi": "Pelindung tidur dan pelumpuh lawan"
 },
 {
  "nama": "Spatula Sakti",
  "deskripsi": "Kalau dilempar, bisa balik sendiri"
 },
 {
  "nama": "Sapu Terbang KW",
  "deskripsi": "Cuma bisa melayang 3 cm"
 },
 {
  "nama": "Singa Berkacamata",
  "deskripsi": "Matanya minus, tapi tetap galak"
 },
 {
  "nama": "Genderuwo Fashion Week",
  "deskripsi": "Serem tapi stylish"
 },
 {
  "nama": "Nenek Lampir Reborn",
  "deskripsi": "Versi muda, doyan TikTok"
 },
 {
  "nama": "Penghapus Gaib",
  "deskripsi": "Bisa hapus memori mantan"
 },
 {
  "nama": "Wajan Terbang",
  "deskripsi": "Senjata ibu-ibu ultimate"
 },
 {
  "nama": "Kodok Imut",
  "deskripsi": "Croak-nya bikin orang jatuh cinta"
 },
 {
  "nama": "Bakwan Mistis",
  "deskripsi": "Kalau dibakar, keluar mantra"
 },
 {
  "nama": "Aqua Isi Ulang",
  "deskripsi": "Suci, tapi waspada bakteri"
 },
 {
  "nama": "Kulkas Berhantu",
  "deskripsi": "Isi dikit, bunyi banyak"
 },
 {
  "nama": "Sendal Jepit Arwah",
  "deskripsi": "Sakitnya sampe ke hati"
 },
 {
  "nama": "Kepiting Labil",
  "deskripsi": "Kadang nyapit, kadang nangis"
 },
 {
  "nama": "Odol Kering",
  "deskripsi": "Tak berguna tapi tetap ada di kamar mandi"
 },
 {
  "nama": "Rambutan Setan",
  "deskripsi": "Duri halus, isi horor"
 },
 {
  "nama": "Sate Terbang",
  "deskripsi": "Bisa ngilang kalo ga dijaga"
 },
 {
  "nama": "Kopi Pahit",
  "deskripsi": "Penyeduh galau dan kesadaran"
 },
 {
  "nama": "Bajigur Penunggu",
  "deskripsi": "Hangat, tapi bikin merinding"
 },
 {
  "nama": "Cendol Berdarah",
  "deskripsi": "Dibeli di alam lain"
 },
 {
  "nama": "Bakso Kepala Ular",
  "deskripsi": "Kenyal, tapi tajam"
 },
 {
  "nama": "Obeng Sakti",
  "deskripsi": "Bisa buka nasib orang"
 },
 {
  "nama": "TV Rusak",
  "deskripsi": "Gambarnya semut, isinya tuyul"
 },
 {
  "nama": "Tissue Bekas",
  "deskripsi": "Khodam mantan yang susah dilupakan"
 },
 {
  "nama": "Tenda Bocor",
  "deskripsi": "Bikin kamu deket sama air dan penderitaan"
 },
 {
  "nama": "Celengan Menangis",
  "deskripsi": "Kalau dibuka, isinya utang"
 },
 {
  "nama": "Ayam Berkaki 5",
  "deskripsi": "Kenceng lari, bingung sepatu"
 },
 {
  "nama": "Kentang Hidup",
  "deskripsi": "Goreng dikit kabur"
 },
 {
  "nama": "Sumpit Mistis",
  "deskripsi": "Cocok untuk narik energi negatif"
 },
 {
  "nama": "Gelas Retak",
  "deskripsi": "Mudah pecah, seperti hubungan kita"
 },
 {
  "nama": "Topi Anti Jodoh",
  "deskripsi": "Dipake = jomblo seumur hidup"
 },
 {
  "nama": "Senter Kesurupan",
  "deskripsi": "Kadang nyala, kadang sholat sendiri"
 },
 {
  "nama": "Dasi Terkutuk",
  "deskripsi": "Siapapun pake jadi bucin"
 },
 {
  "nama": "Mie Goreng Mistis",
  "deskripsi": "Wangi sedap, bikin lupa dunia"
 },
 {
  "nama": "Serabi Alien",
  "deskripsi": "Rasa tak dikenal umat manusia"
 },
 {
  "nama": "HP Lag",
  "deskripsi": "Khodam sabar tingkat dewa"
 },
 {
  "nama": "Remote TV Tersesat",
  "deskripsi": "Bisa muncul di kulkas"
 },
 {
  "nama": "Lampu Redup",
  "deskripsi": "Bikin aura horror padahal siang"
 },
 {
  "nama": "Tikus Sakti",
  "deskripsi": "Bisa mencuri mie instan"
 },
 {
  "nama": "Tali Jemuran Halimun",
  "deskripsi": "Hilang kalau hujan"
 },
 {
  "nama": "Jaket Bau Surga",
  "deskripsi": "Baunya aneh tapi adem di hati"
 },
 {
  "nama": "Boneka Misteri",
  "deskripsi": "Senyumnya nyiksa batin"
 },
 {
  "nama": "Klakson Kuntilanak",
  "deskripsi": "Sekali bunyi, tetangga pingsan"
 },
 {
  "nama": "Obat Nyamuk Gagal",
  "deskripsi": "Makin dipake makin rame nyamuk"
 },
 {
  "nama": "Korek Api Emosian",
  "deskripsi": "Nyala pas ga dibutuhin doang"
 },
 {
  "nama": "Cermin Sakti",
  "deskripsi": "Kalau kamu liat, wajah jadi mantan"
 },
 {
  "nama": "Bedak Gaib",
  "deskripsi": "Dipake ilang, muka ikut ilang"
 }
]

const TRAITS_RAW = [
 [
  "ganteng",
  "Kegantengan",
  "ganteng",
  "😎"
 ],
 [
  "cantik",
  "Kecantikan",
  "cantik",
  "💅"
 ],
 [
  "pintar",
  "Kepintaran",
  "pintar",
  "🧠"
 ],
 [
  "kaya",
  "Kekayaan",
  "kaya",
  "💰"
 ],
 [
  "jomblo",
  "Kejombloan",
  "jomblo",
  "💔"
 ],
 [
  "bucin",
  "Kebucinan",
  "bucin",
  "😍"
 ],
 [
  "baper",
  "Kebaperan",
  "baper",
  "🥺"
 ],
 [
  "galau",
  "Kegalauan",
  "galau",
  "😢"
 ],
 [
  "kepo",
  "Kekepoan",
  "kepo",
  "🔍"
 ],
 [
  "mager",
  "Kemageran",
  "mager",
  "🛋️"
 ],
 [
  "rajin",
  "Kerajinan",
  "rajin",
  "💪"
 ],
 [
  "sabar",
  "Kesabaran",
  "sabar",
  "🧘"
 ],
 [
  "lucu",
  "Kelucuan",
  "lucu",
  "🤣"
 ],
 [
  "keren",
  "Kekerenan",
  "keren",
  "🕶️"
 ],
 [
  "setia",
  "Kesetiaan",
  "setia",
  "🐕"
 ],
 [
  "romantis",
  "Keromantisan",
  "romantis",
  "🌹"
 ],
 [
  "cuek",
  "Kecuekan",
  "cuek",
  "😐"
 ],
 [
  "pelit",
  "Kepelitan",
  "pelit",
  "🤏"
 ],
 [
  "boros",
  "Keborosan",
  "boros",
  "💸"
 ],
 [
  "gaul",
  "Kegaulan",
  "gaul",
  "🕺"
 ],
 [
  "alay",
  "Keanehan alay",
  "alay",
  "🤪"
 ],
 [
  "pemalu",
  "Kepemaluan",
  "pemalu",
  "🙈"
 ],
 [
  "cerewet",
  "Kecerewetan",
  "cerewet",
  "🗣️"
 ],
 [
  "ceria",
  "Keceriaan",
  "ceria",
  "😄"
 ],
 [
  "sombong",
  "Kesombongan",
  "sombong",
  "😏"
 ],
 [
  "polos",
  "Kepolosan",
  "polos",
  "😇"
 ],
 [
  "bijak",
  "Kebijaksanaan",
  "bijak",
  "🦉"
 ],
 [
  "hoki",
  "Kehokian",
  "hoki",
  "🍀"
 ],
 [
  "sial",
  "Kesialan",
  "sial",
  "⛈️"
 ],
 [
  "ngantuk",
  "Tingkat ngantuk",
  "ngantuk",
  "😴"
 ],
 [
  "ambis",
  "Keambisan",
  "ambis",
  "🎯"
 ],
 [
  "santuy",
  "Kesantuyan",
  "santuy",
  "😌"
 ],
 [
  "sultan",
  "Kesultanan",
  "sultan",
  "👑"
 ],
 [
  "receh",
  "Kerecehan",
  "receh",
  "🪙"
 ],
 [
  "kalem",
  "Kekalemam",
  "kalem",
  "🍃"
 ],
 [
  "garang",
  "Kegarangan",
  "garang",
  "🐯"
 ],
 [
  "imut",
  "Keimutan",
  "imut",
  "🧸"
 ],
 [
  "wibu",
  "Kewibuan",
  "wibu",
  "🎌"
 ],
 [
  "kutubuku",
  "Kekutubukuan",
  "kutu buku",
  "📚"
 ],
 [
  "penakut",
  "Kepenakutan",
  "penakut",
  "😱"
 ],
 [
  "pemberani",
  "Keberanian",
  "pemberani",
  "🦁"
 ],
 [
  "jenius",
  "Kejeniusan",
  "jenius",
  "💡"
 ],
 [
  "gamer",
  "Kegameran",
  "gamer",
  "🎮"
 ],
 [
  "ceroboh",
  "Keceroboan",
  "ceroboh",
  "🤦"
 ],
 [
  "disiplin",
  "Kedisiplinan",
  "disiplin",
  "⏰"
 ],
 [
  "kreatif",
  "Kekreatifan",
  "kreatif",
  "🎨"
 ],
 [
  "dermawan",
  "Kedermawanan",
  "dermawan",
  "🎁"
 ],
 [
  "ramah",
  "Keramahan",
  "ramah",
  "🤝"
 ],
 [
  "panik",
  "Kepanikan",
  "panik",
  "😰"
 ]
]

const TIERS_D = [
 [
  20,
  [
   "Hampir nol besar, {adj}-nya belum kelihatan 😅",
   "Belum ada tanda-tanda {adj}, tapi tenang, masih ada hari esok."
  ]
 ],
 [
  40,
  [
   "Level {adj}-nya masih pemula, terus semangat!",
   "Ada sedikit {adj}-nya, tipis tapi nyata."
  ]
 ],
 [
  60,
  [
   "Lumayan {adj}, ya standar manusia normal lah.",
   "Tingkat {adj}-nya pas-pasan, nggak kurang nggak lebih."
  ]
 ],
 [
  80,
  [
   "Wah, {adj}-nya di atas rata-rata!",
   "Cukup {adj}, banyak yang diam-diam iri nih."
  ]
 ],
 [
  100,
  [
   "Legenda {adj}! Levelnya sudah dewa 👑",
   "Sulit dipercaya, {adj}-nya maksimal!"
  ]
 ]
]

const ITEMS = {
  cekiq: { ic: '🧠', t: 'IQ', unit: '', min: 60, max: 180, line: (v) => (v > 140 ? 'Jenius sejati! 🤯' : v > 110 ? 'Di atas rata-rata 😎' : v > 90 ? 'Normal, stabil 👍' : 'Masih bisa belajar lagi 😅'), scale: [60, 180] },
  cekrezeki: { ic: '💸', t: 'REZEKI HARI INI', unit: '%', min: 10, max: 100, line: (v) => (v > 80 ? 'Rezeki deras, siapin dompet! 🤑' : v > 50 ? 'Cukup lancar 👌' : 'Pelan-pelan, tetap semangat 🌱') },
  cekmood: { ic: '🌈', t: 'MOOD HARI INI', unit: '%', min: 5, max: 100, line: (v) => (v > 80 ? 'Ceria banget! 😄' : v > 50 ? 'Biasa aja 🙂' : 'Butuh es krim 🍦') },
  cekcuan: { ic: '🤑', t: 'AURA SULTAN', unit: '%', min: 0, max: 100, line: (v) => (v > 80 ? 'Sultan Andara! 👑' : v > 40 ? 'Menengah ke atas 💼' : 'Sultan tanggal tua 🍜') },
  cekaura: { ic: '🔮', t: 'AURA HARI INI', unit: '%', min: 5, max: 100, line: (v) => (v > 80 ? 'Aura bersinar terang ✨' : v > 45 ? 'Aura stabil 🌤️' : 'Aura redup, butuh istirahat 🌙') },
  cekenergi: { ic: '⚡', t: 'ENERGI HARI INI', unit: '%', min: 5, max: 100, line: (v) => (v > 80 ? 'Siap tempur seharian 💪' : v > 45 ? 'Cukup bertenaga ☕' : 'Low battery, isi daya dulu 🔋') },
  cekkarisma: { ic: '👑', t: 'KARISMA', unit: '%', min: 10, max: 100, line: (v) => (v > 80 ? 'Magnet perhatian 🧲' : v > 45 ? 'Cukup berkarisma 🙂' : 'Kalem tapi dalam 🌊') }
}

const prettyTitle = t => {
  const parts = String(t).trim().split(/\s+/)
  const emoji = parts.shift()
  while (parts.length && !/[\p{L}\p{N}]/u.test(parts[parts.length - 1])) parts.pop()
  const title = parts.join(' ').toLowerCase().replace(/\p{L}+/gu, w => w[0].toUpperCase() + w.slice(1))
  return { emoji, title }
}

const card = (emoji, title, rows, note) => {
  const w = Math.max(...rows.map(r => r[0].length))
  return [
    `${emoji} *${title}*`,
    '',
    ...rows.map(([k, v]) => `♡ ${k.padEnd(w)} : ${v}`),
    '',
    ...(note ? [note, ''] : []),
    FOOTER
  ].join('\n')
}

function getTarget(m, text) {
  const t = String(text || '').trim()
  let jid = m.mentionedJid?.[0] || m.quoted?.sender || null
  let name = ''
  if (!jid && t) {
    const n = t.replace(/[^0-9]/g, '')
    if (n.length >= 7 && n.length <= 15 && /^[\d\s+\-]+$/.test(t)) jid = n + '@s.whatsapp.net'
    else name = t.slice(0, 40)
  }
  if (!jid && !name) jid = m.sender
  return { jid, label: jid ? '@' + num(jid) : name }
}

function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date())
const dayRand = (seed, min, max) => min + hash(`${seed}|${today()}`) % (max - min + 1)

const TRAITS = TRAITS_RAW
  .map(([key, label, adj, emoji]) => ({ key, cmd: `cek${key}`, label, adj, emoji }))
  .filter(t => !DEFS[t.cmd])
const PROFILE = ['pintar', 'kaya', 'sabar', 'lucu', 'keren', 'setia', 'rajin', 'mager', 'baper', 'hoki']
const dailyScore = (key, trait) => hash(`${trait}|${key}|${today()}`) % 101
const dailyComment = (t, p, key) => {
  const tier = TIERS_D.find(([max]) => p <= max)[1]
  return tier[hash(`${t.key}!${key}`) % tier.length].replace(/\{adj\}/g, t.adj)
}

const MAP = {}
for (const [k, d] of Object.entries(DEFS)) {
  MAP[k] = ['def', k]
  for (const a of d.alias || []) MAP[a] = ['def', k]
}
for (const a of ['cekmusuh', 'rivalcheck', 'musuh']) MAP[a] = ['musuh']
for (const a of ['cekotot', 'ototcheck', 'cekmuscle']) MAP[a] = ['otot']
for (const a of ['cekperforma', 'performa', 'cekperf']) MAP[a] = ['perf']
for (const a of ['cekkhodam', 'cekkodam', 'kodam', 'khodam']) MAP[a] = ['khodam']
for (const k of Object.keys(ITEMS)) if (!MAP[k]) MAP[k] = ['meter', k]
for (const t of TRAITS) if (!MAP[t.cmd]) MAP[t.cmd] = ['trait', t.key]
MAP.cekprofil = ['profil']
MAP.daftarcek = ['daftar']

const send = (conn, m, text, mentions = []) => conn.sendMessage(m.chat, { text, mentions }, { quoted: m })

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const route = MAP[cmd]
  if (!route) return
  try {
    if (route[0] === 'def') {
      const d = DEFS[route[1]]
      const { emoji, title } = prettyTitle(d.title)
      if (d.need && !m.mentionedJid?.[0] && !m.quoted && !String(text || '').trim()) {
        return m.reply([`${emoji} *${title}*`, '', 'Tag gebetan atau tulis namanya.', '', `♡ ${p}${cmd} @user`, '', FOOTER].join('\n'))
      }
      const { jid, label } = getTarget(m, text)
      const mentions = jid ? [jid] : []
      if (d.kind === 'tier') {
        const pct = rnd(0, 101)
        const [, cat, note] = d.tiers.find(t => pct > t[0] || t[0] === 0)
        return send(conn, m, card(emoji, title, [['Target', label], ['Hasil', `${bar(pct)} ${pct}%`], ['Status', cat], ['Catatan', note]]), mentions)
      }
      if (d.kind === 'score') {
        const pct = rnd(0, 101)
        const [, verdict] = d.tiers.find(t => pct < t[0])
        return send(conn, m, card(emoji, title, [['Target', label], ['Hasil', `${bar(pct)} ${pct}%`], ['Penilaian', verdict]]), mentions)
      }
      const rate = rnd(d.min, d.span)
      const item = pick(d.list)
      const rows = [['Target', label], [d.metric, `${bar(rate)} ${rate}%`]]
      if (d.catHi) rows.push(['Status', rate > 75 ? d.catHi[0] : d.catHi[1]])
      if (d.cat) rows.push(['Kategori', d.cat])
      if (typeof item === 'object') {
        rows.push([d.l1, item.tipe], [d.l2, item.desc])
      } else {
        rows.push([d.l1 || d.l2, item])
      }
      return send(conn, m, card(emoji, title, rows), mentions)
    }

    if (route[0] === 'musuh') {
      const ments = m.mentionedJid || []
      let t1 = m.sender, t2 = null, n1 = '', n2 = ''
      if (ments.length >= 2) { t1 = ments[0]; t2 = ments[1] }
      else if (ments.length === 1) t2 = ments[0]
      else if (m.quoted?.sender) t2 = m.quoted.sender
      else if (String(text || '').includes('|')) {
        const [a, b] = text.split('|')
        n1 = a.trim(); n2 = (b || '').trim()
      }
      if (!t2 && !(n1 && n2)) {
        return m.reply(['⚔️ *Cek Permusuhan & Rival*', '', 'Tag lawanmu atau tulis dua nama.', '', `♡ ${p}${cmd} @user`, `♡ ${p}${cmd} @user1 @user2`, `♡ ${p}${cmd} nama1 | nama2`, '', FOOTER].join('\n'))
      }
      const rate = rnd(20, 80)
      const who = t2 ? `@${num(t1)} vs @${num(t2)}` : `${n1} vs ${n2}`
      return send(conn, m, card('⚔️', 'Cek Permusuhan & Rival', [['Rival', who], ['Permusuhan', `${bar(rate)} ${rate}%`], ['Kategori', pick(MUSUH)]]), t2 ? [t1, t2] : [])
    }

    if (route[0] === 'otot') {
      const nama = String(text || '').trim() || m.pushName || 'Kamu'
      const power = rnd(1, 100)
      const komentar = power <= 30 ? pick(OTOT.roastList) : power >= 80 ? pick(OTOT.pujianList) : 'lumayan lah masih progress 👍'
      return send(conn, m, card('💪', 'Cek Otot', [['Nama', nama], ['Power', `${bar(power)} ${power}%`], ['Bentuk', pick(OTOT.bentukList)], ['Komentar', komentar]]))
    }

    if (route[0] === 'perf') {
      const nama = String(text || '').trim() || m.pushName || 'Kamu'
      const durasi = rnd(1, 30)
      const stamina = rnd(1, 100)
      const skill = rnd(1, 100)
      const komentar = durasi <= 5 ? pick(PERF.roastList) : durasi >= 20 ? pick(PERF.pujianList) : 'standar aman 👍'
      return send(conn, m, card('⏱️', 'Cek Performa', [['Nama', nama], ['Durasi', `${durasi} menit`], ['Stamina', `${bar(stamina)} ${stamina}%`], ['Skill', `${bar(skill)} ${skill}%`], ['Efek', pick(PERF.efekList)], ['Komentar', komentar]]))
    }

    if (route[0] === 'khodam') {
      const nama = String(text || '').trim()
      if (!nama) return m.reply(['🔮 *Cek Khodam*', '', 'Tulis namamu dulu.', '', `♡ ${p}${cmd} Budi`, '', FOOTER].join('\n'))
      conn.khodam = conn.khodam || {}
      const key = nama.toLowerCase()
      const k = conn.khodam[key] || pick(KHODAM)
      conn.khodam[key] = k
      return m.reply(card('🔮', 'Cek Khodam', [['Nama', nama], ['Khodam', k.nama], ['Arti', k.deskripsi]]))
    }

    if (route[0] === 'meter') {
      const it = ITEMS[route[1]]
      const { jid } = getTarget({ ...m, quoted: m.quoted }, '')
      const v = dayRand(`${route[1]}|${num(jid)}`, it.min, it.max)
      const pct = it.scale ? Math.round(((v - it.scale[0]) / (it.scale[1] - it.scale[0])) * 100) : v
      const t = it.t.length <= 3 ? it.t : it.t.toLowerCase().replace(/\p{L}+/gu, w => w[0].toUpperCase() + w.slice(1))
      return send(conn, m, card(it.ic, `Cek ${t}`, [['Nama', '@' + num(jid)], ['Hasil', `${v}${it.unit}`], ['Level', `${bar(pct, 12)} ${pct}%`], ['Catatan', it.line(v)]], '_Hanya hiburan, hasil berubah tiap hari._'), [jid])
    }

    const first = m.mentionedJid?.[0] || m.quoted?.sender || null
    const nameArg = !first && String(text || '').trim() ? String(text).trim().slice(0, 40) : ''
    const who = first || m.sender
    const key = nameArg ? nameArg.toLowerCase() : num(who)
    const label = nameArg ? `*${nameArg}*` : `@${num(who)}`
    const mentions = nameArg ? [] : [who]

    if (route[0] === 'daftar') {
      const rows = TRAITS.map(t => `♡ ${t.emoji} ${p}${t.cmd}`)
      return m.reply(['🎲 *Daftar Cek-cekan*', '', `${TRAITS.length} jenis, hasil berubah tiap hari.`, '', ...rows, '', FOOTER].join('\n'))
    }

    if (route[0] === 'profil') {
      const rows = PROFILE.map(k => TRAITS.find(t => t.key === k)).filter(Boolean).map(t => ({ t, v: dailyScore(key, t.key) }))
      const top = [...rows].sort((a, b) => b.v - a.v)[0]
      return send(conn, m, [
        '🎲 *Cek Profil*', '',
        `♡ Target : ${label}`, '',
        ...rows.map(({ t, v }) => `♡ ${t.emoji} ${t.key.padEnd(7)} ${bar(v)} ${v}%`), '',
        `♡ Paling menonjol : ${top.t.emoji} ${top.t.adj} (${top.v}%)`, '',
        FOOTER
      ].join('\n'), mentions)
    }

    const t = TRAITS.find(x => x.key === route[1])
    const v = dailyScore(key, t.key)
    return send(conn, m, card(t.emoji, `Cek ${t.label}`, [['Target', label], ['Hasil', `${bar(v)} ${v}%`], ['Catatan', dailyComment(t, v, key)]], `_Hanya hiburan, hasil berubah tiap hari. Coba ${p}daftarcek._`), mentions)
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Cek-cekan')
  }
}

handler.help = ['cekgay', 'ceklesbi', 'cekbodoh', 'ceksange', 'ceksetan', 'cekbucin', 'ceksial', 'cekalim', 'cekbego', 'cekharam', 'cekstres', 'ceksadboy', 'cekdosa', 'cekstalker', 'cekwatak', 'pacarcheck', 'aura', 'ceksetia', 'cekmusuh', 'cekotot', 'cekperforma', 'cekkhodam', 'cekiq', 'cekprofil', 'daftarcek']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
