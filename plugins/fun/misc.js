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

import axios from 'axios'
import * as cheerio from 'cheerio'

const FOOTER = 'with love, elyra !!'
const pick = a => a[Math.floor(Math.random() * a.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

const NASIP = [
"Hari ini hoki banget, rezeki nyangkut di jalan 😎",
"Sedikit sial, hati-hati dengan benda tajam 🗡️",
"Nasip biasa aja, tapi senyummu manis ❤️",
"Rejeki datang tak terduga, siap-siap senyum 😏",
"Hari ini banyak godaan, tapi kamu kuat 💪",
"Nasip baik, kemungkinan dapat hadiah kecil 🎁",
"Sedikit sial, jangan lupa bawa payung ☂️",
"Nasip gokil! Orang jatuh cinta sama kamu hari ini 🥰",
"Peruntungan naik, tapi jangan sombong ya 😉",
"Nasip netral, santai aja dan nikmati hari 😎"
]
const STORY = [
'https://telegra.ph/file/0d4fb93951c620aacb229.mp4',
'https://g.top4top.io/m_2391c90iu1.mp4',
'https://h.top4top.io/m_2391mfvy22.mp4',
'https://i.top4top.io/m_2391iwmee3.mp4',
'https://j.top4top.io/m_23915x5204.mp4',
'https://l.top4top.io/m_2391e795x5.mp4',
'https://a.top4top.io/m_2391jcee66.mp4',
'https://b.top4top.io/m_2391ho0bz7.mp4',
'https://c.top4top.io/m_23910hulw8.mp4',
'https://d.top4top.io/m_2391dj01a9.mp4',
'https://e.top4top.io/m_23912fdr210.mp4',
'https://a.top4top.io/m_23911dhqx1.mp4',
'https://b.top4top.io/m_2391wwr402.mp4',
'https://c.top4top.io/m_2391vfkp63.mp4',
'https://d.top4top.io/m_2391b7cey4.mp4',
'https://e.top4top.io/m_2391fxdc85.mp4',
'https://telegra.ph/file/c3deeb5b0b7f7738a95ad.mp4',
'https://telegra.ph/file/7ca9eef850f5edc53f7f2.mp4',
'https://telegra.ph/file/44f73812ae0c19f097264.mp4',
'https://telegra.ph/file/10399f910bb90de8a6c53.mp4',
'https://telegra.ph/file/f7b440b02e742d1d4bed6.mp4',
'https://telegra.ph/file/3571f86c9c8843f48ce03.mp4',
'https://telegra.ph/file/c0b4e700e2d696f6ae448.mp4',
'https://telegra.ph/file/c0b4e700e2d696f6ae448.mp4',
'https://telegra.ph/file/fbfa5ac6baca454de22ad.mp4',
'https://telegra.ph/file/899cb30e29de1f0692ea1.mp4',
'https://telegra.ph/file/30e226e2d30e51bda678f.mp4',
'https://telegra.ph/file/4b20016e2f4ff96280fea.mp4',
'https://telegra.ph/file/d48fde63f91f9aa585716.mp4',
'https://telegra.ph/file/3a1f2afb1172b4606cd50.mp4',
'https://telegra.ph/file/fe7de67cadcddf80e4f23.mp4',
'https://telegra.ph/file/f4eabe96d994b28b7020d.mp4',
'https://telegra.ph/file/f8adc8f3af8ce6f80254b.mp4',
'https://telegra.ph/file/909a4beb3be92dae9e8ef.mp4',
'https://telegra.ph/file/57dff983fe52d49cf9e11.mp4',
'https://telegra.ph/file/70ed984ecf1382e0e74ce.mp4',
'https://telegra.ph/file/a922d3d0214e7b95dfb89.mp4',
'https://telegra.ph/file/ff7a0e8598bfd47898932.mp4',
'https://telegra.ph/file/c992c64d4bb59df46f06e.mp4',
'https://telegra.ph/file/137346459c02371cf5de9.mp4',
'https://telegra.ph/file/2ae60a3fc1509f779cba0.mp4',
'https://telegra.ph/file/223ac432cbca27313c59c.mp4',
'https://telegra.ph/file/6411bbcedc5da320b8656.mp4',
'https://telegra.ph/file/33a005837185d86435a26.mp4',
'https://telegra.ph/file/3b5cf36d1fc154ee36345.mp4',
'https://telegra.ph/file/c5606fb628f4c8268f1bb.mp4',
'https://telegra.ph/file/a91ba184bd2faedf2ca93.mp4',
'https://telegra.ph/file/aebad466be77f72498981.mp4',
'https://telegra.ph/file/a38ff1a80c53fb374af90.mp4',
'https://telegra.ph/file/607217019e1e5952920c1.mp4',
'https://telegra.ph/file/8a98532caa714b28acce1.mp4',
'https://telegra.ph/file/9eb4be5e79b7e71bfecc5.mp4',
'https://telegra.ph/file/10bbd3972f7b75a8b2ef6.mp4',
'https://telegra.ph/file/3fae1c6aacaba812ea651.mp4',
'https://telegra.ph/file/68378ab14e55b8a4113c2.mp4',
'https://telegra.ph/file/9cb140f6f74012cce30c7.mp4',
'https://telegra.ph/file/17a3d58921c2754cf86ef.mp4',
'https://telegra.ph/file/3ac2c8447b8915a879e7a.mp4',
'https://telegra.ph/file/269cd09dcf42f8bd3a6f9.mp4',
'https://telegra.ph/file/d2e59e56cfdaac79ca7f8.mp4',
'https://telegra.ph/file/504ac80844f99a8e3fc54.mp4',
'https://telegra.ph/file/dd2b8fba0010f539085d1.mp4',
'https://telegra.ph/file/af9726aad0dce10dc4529.mp4',
'https://telegra.ph/file/c693724dba3bb96bb6c70.mp4',
'https://telegra.ph/file/5b91438135d01c11e7c92.mp4',
'https://telegra.ph/file/d2a468ff7cd4c29dcdb4a.mp4',
'https://telegra.ph/file/9cc245954979317b3484c.mp4',
'https://telegra.ph/file/cde12f0fd2c73ab8eb933.mp4',
'https://telegra.ph/file/ab58119a87c7f2c2367dc.mp4',
'https://telegra.ph/file/9146e2d5490c1b01c6e87.mp4',
'https://telegra.ph/file/09c9e72d3e0d44175c304.mp4',
'https://telegra.ph/file/2f01ddd037c40477ed07f.mp4',
'https://telegra.ph/file/be72f95d92490f0a1db3b.mp4',
'https://telegra.ph/file/d1464f070543fb3aaeaee.mp4',
'https://telegra.ph/file/99f02aa82825f1bf61e9a.mp4',
'https://telegra.ph/file/d540762b1d4f9e767357d.mp4',
'https://telegra.ph/file/98d09d227e8552d4e2bea.mp4',
'https://telegra.ph/file/4a9dc4ba09484791dfa9a.mp4',
'https://telegra.ph/file/91d8701c2783775637125.mp4',
]
const ISLAM = [
'Segala sesuatu telah Allah takdirkan. - QS. Al Qamar : 49',
'Dan sesungguhnya DIA lah yang menjadikan orang tertawa dan menangis. - QS. An Najm: 43',
'Janganlah kamu berduka cita, sesungguhnya Allah selalu bersama kita.- QS At-Taubah: 40',
'Maka sesungguhnya bersama kesulitan itu ada kemudahan.QS Al Insyirah: 5',
'Sesungguhnya Allah tidak akan mengubah keadaan suatu kaum hingga mereka merubah keadaan yang ada pada diri mereka sendiri. - Q.S. Ar Rad: 11',
'Sesungguhnya Kami telah menciptakan manusia dalam bentuk yang sebaik-baiknya. - QS At- Tin: 4',
'Dan Kami jadikan kamu berpasang-pasangan. - QS. An-Naba: 8',
'Maka jangan sekali-kali membiarkan kehidupan dunia ini memperdayakan kamu. - QS. Fatir: 5',
'Dan bersabarlah kamu, sesungguhnya janji Allah adalah benar. - QS. Ar-Rum: 60',
'Dan barang siapa yang bertakwa kepada Allah, niscaya Allah menjadikan baginya kemudahan dalam urusannya. - Q.S At-Talaq: 4',
'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya. - QS. Al-Baqarah: 286',
'Tidakkah dia menyadari bahwa sesungguhnya Allah melihat segala perbuatannya?. - QS. Al-Alaq: 14',
'Bersabarlah wahai hati kelak akan ada seseorang yang datang dan siap menemani sisa hidupmu dalam ketaatan',
'Diri kita sendiri yang bisa menentukan apakah cinta kita berbuah dosa ataukah berbuah pahala',
'Dirimu yang sebenarnya adalah apa yang kamu lakukan di saat di ada orang yang melihatmu',
'Janji Allah tak pernah mengecewakan, dan bila kamu masih meras kecewa mungkin ada yang salah dengan imanmu',
'Rasa syukur tidak akan datang kepada orang yang tidak beriman dan tidak pernah kenyang',
'Maafkan aku andai apa yang aku tulis dan aku share tentang ilmu agama tidak sesuai dengan coberku dan kehidupanku yang asli',
'Kebanyakan manusia lebih senang menyalahkan orang lain daripada menyalahkan diri sendiri',
'Biarlah orang melihat penampilah kita biasa, tetapi luar biasa di mata Allah',
'Bersyukurlah bila dalam penantianmu, kau tetap gigih dalam kesendirian, sebab artinya kau telah memuliakan jalan Allah',
'Malu akan sebuah masalah itu boleh tapi jangan berlebihan sebab jika kita Yakin Pertolongan Allah itu sangatlah nyata',
'Yakinlah bahwa ada do’a yang terus dipanjatkan kepada Allah yang tidak putus-putus dari orang tua kita agar kita senantiasa menjadi anak yang sholeh dan sholehah',
'Setiap hari aku berusaha semaksimal mungkin mencari rizki yang halal demi bisa menghalalkanmu',
'Jatuh cinta bisa jadi sangat menyakitkan jika kita tidak mampu untuk mengendalikannya',
]
const PANTUN2 = [
'Ada anak kecil bermain batu,\nBatu dilempar masuk ke sumur,\nBelajar itu tak kenal waktu,\nJuga tidak memandang umur. ',
'Tanam kacang di pagi hari,\nTumbuh enam layu sebatang,\nKeburukan orang jangan dicari,\nBila kalian sedang puasa. ',
'Akhir bulan mendapat gaji,\nGaji untuk membeli ketupat,\nRajin-rajinlah sholat dan mengaji,\nJanganlah lupa puasa dan zakat. ',
'Waktu daftar hari terakhir,\nWaktu terasa banyak terbuang,\nKamu nggak perlu khawatir,\ncintaku hanya untukmu seorang. ',
'Ada anak kecil bermain batu,\nBatu dilempar masuk ke sumur,\nBelajar itu tak kenal waktu,\nJuga tidak memandang umur. ',
'Seribu bebek di kandang singa,\nhanya satu berwarna belang,\nBeribu cewek di Indonesia,\nhanya engkau yang aku sayang. ',
'Hari minggu pergi ke pasar,\nBeli sayur dan juga beras,\nTiap hari harus belajar,\nPasti akan menjadi cerdas. ',
'Ayam goreng setengah mateng,\nBelinya di depan tugu.\nAbang sayang, abangku ganteng,\nlneng di sini setia menunggu. ',
'Api kecil dari tungku,\nApinya kecil habis kayu.\nSudah lama kutunggu-tunggu,\nkapan kamu bilang I love you. ',
'Seribu bebek di kandang singa,\nhanya satu berwarna belang\nBeribu cewek di Indonesia,\nhanya engkau yang aku sayang. ',
'Pergi memancing saat fajar,\nPulang siang membawa ikan\nSiapa yang rajin belajar\nJadi orang sukses kemudian. ',
'Beli computer itu biasa\nSupaya belajar jadi semangat\nMari kita belajar puasa\nAgar kita jadi kuat ',
'Minum sekoteng hangat rasanya,\nminum segelas ada yang minta.\nLaki-laki ganteng siapa yang punya?\nBolehkah aku jatuh cinta.',
'Raja gagah lagi sakti Laksamana pergi berperang Supaya tidak sesal di hati Janganlah kena perdaya orang ',
'Pergi mendaki Gunung Daik Hendak menjerat kancil dan rusa Bergotong-royong amalan yang baik Elok diamalkan setiap masa',
'Pinang muda dibelah dua Manik-manik mati dirempuh Dari muda sampai ke tua Pengajaran baik jangan diubah ',
'Tegak-tegak cocokkan pancang Pasang bendera bunyikan tabuh Agak-agak mengatai orang Supaya cedera jangan tumbuh ',
'Batang ketumbar dahan-dahan Kelapa jatuh ke tepi bangsal Biarlah sabar dengan perlahan Siapa gopoh nanti menyesal ',
'Kayu bakar dibuat arang Arang dibakar memanaskan diri Jangan mudah menyalahkan orang Cermin muka lihat sendiri ',
'Lepas di jemur baju dilipat Disimpan dalam almari lama Jangan kita tinggalkan sholat Karena sholat tiang agama',
'Ke restoran membeli makan Perginya bersama sang istri Perintah Tuhan ayo kerjakan Larangan Tuhan ayo jauhi',
'Pulau Sumatra pulau Kalimantan Pulau Bali pulau Sumba Shalat lima waktu ayo tegakkan Tiang agama nan utama',
'Membeli beras ke Mang Duloh Membeli semen ke Mang Omat Iman dan takwa kepada Allah Kunci bahagia dunia akhirat',
'Beli bensin satu tangki Bensi dibeli oleh Mak Rosa Bersihkan hati dari dengki Sucikan raga dari dosa'
]
const RENUNGAN = [
    "https://telegra.ph/file/f52f8d6312f3ac2590727.jpg",
    "https://telegra.ph/file/35cb9decc525a3453ba87.jpg",
    "https://telegra.ph/file/5996566cb5cd615f60f51.jpg",
    "https://telegra.ph/file/87ecb0f385ae390c609e8.jpg",
    "https://telegra.ph/file/7ca48dd2329937b7f86da.jpg",
    "https://telegra.ph/file/e2d603fa0ec9004ca9e2f.jpg",
    "https://telegra.ph/file/f8f9ac3d38c9e3c9456ec.jpg",
    "https://telegra.ph/file/9e1f626f4005b6f16d904.jpg",
    "https://telegra.ph/file/6300478b6ffdf0c0001e9.jpg",
    "https://telegra.ph/file/dca222749fb98ce0384f7.jpg",
    "https://telegra.ph/file/295f6f6164794a2156d2e.jpg",
    "https://telegra.ph/file/429cb39112f2870327398.jpg",
    "https://telegra.ph/file/9d96d5fcc89c6f30e086f.jpg",
    "https://telegra.ph/file/c396c9da3800536792139.jpg",
    "https://telegra.ph/file/6d2fc9ac5c878fa93c43f.jpg",
    "https://telegra.ph/file/09174bfbe94a756a90411.jpg",
    "https://telegra.ph/file/2dcd363e5f9eb42d88cc0.jpg",
    "https://telegra.ph/file/798daf4f7a87bbabc8694.jpg",
    "https://telegra.ph/file/4052c388390385d9c79f3.jpg",
    "https://telegra.ph/file/d8f1a14f712d6a860b36c.jpg",
    "https://telegra.ph/file/eed16ec2df3cc22102e7b.jpg",
    "https://telegra.ph/file/0738833300f1620285b36.jpg",
    "https://telegra.ph/file/dc464f93b5a579c279979.jpg",
    "https://telegra.ph/file/0e0aa4e97675b2e649ddc.jpg",
    "https://telegra.ph/file/2b58e9e63b38ac837e8cd.jpg",
    "https://telegra.ph/file/49029a0e94ee5d710b6a9.jpg",
    "https://telegra.ph/file/3a1ecc7774208670ec781.jpg",
    "https://telegra.ph/file/46a125a6a3dc13cee931e.jpg",
    "https://telegra.ph/file/37c358438489180b48723.jpg",
    "https://telegra.ph/file/6287bc3f9b7876aeb5554.jpg",
    "https://telegra.ph/file/684f268210c2de5d44bc6.jpg",
    "https://telegra.ph/file/166b0d7fd1fcc55a09449.jpg",
    "https://telegra.ph/file/f6713bdd595530bb38df9.jpg",
    "https://telegra.ph/file/6738bff78091aa85a6cd7.jpg",
    "https://telegra.ph/file/370d394c23fd162c6c9be.jpg",
    "https://telegra.ph/file/38f2ceb0daf966fe7ddcf.jpg",
    "https://telegra.ph/file/d23c4cedab7bf64915ba2.jpg",
    "https://telegra.ph/file/3e72698c996538ee50ccf.jpg",
    "https://telegra.ph/file/0379370add3bbae122008.jpg",
    "https://telegra.ph/file/873d1b18acf16088786ca.jpg",
    "https://telegra.ph/file/823e0664c7edec135b847.jpg",
    "https://telegra.ph/file/8c8da910ab52c7a2b7ccf.jpg",
    "https://telegra.ph/file/8037b52b84e8c39060f89.jpg",
    "https://telegra.ph/file/e6da062c873aca03d25d4.jpg",
    "https://telegra.ph/file/ef307b95c45e77defd0e1.jpg",
    "https://telegra.ph/file/d66123bde1e967adf72b9.jpg",
    "https://telegra.ph/file/7a2a376d1d152d382ae1a.jpg",
    "https://telegra.ph/file/f8d0253bb97ea30e04275.jpg",
    "https://telegra.ph/file/bbe65705f8dc9558eb177.jpg",
    "https://telegra.ph/file/c7530031da08b4441ee9f.jpg",
    "https://telegra.ph/file/5c1f7320f1b457911c3c2.jpg",
    "https://telegra.ph/file/5a8600f4651e9497f6562.jpg",
    "https://telegra.ph/file/053032e59ced4dac9ed3d.jpg",
    "https://telegra.ph/file/ef61d077b685d47a11ff0.jpg",
    "https://telegra.ph/file/c8a5cc9b9da57299a1f25.jpg",
    "https://telegra.ph/file/2ed057545501fc3bc8de0.jpg",
    "https://telegra.ph/file/b3b7c0c22e7dba04cab03.jpg",
    "https://telegra.ph/file/62579a62376550e6590b1.jpg",
    "https://telegra.ph/file/d140b0791799af2f67315.jpg",
    "https://telegra.ph/file/81fd213f74b1235ef18fc.jpg",
    "https://telegra.ph/file/d00db1507843f4ead46d8.jpg",
    "https://telegra.ph/file/dedfa2294f4eb845acac4.jpg",
    "https://telegra.ph/file/2b3700178b39c9c01e9b4.jpg",
    "https://telegra.ph/file/a7be3d06c7dd9b8475579.jpg",
    "https://telegra.ph/file/f7d91295ec35c44af8c90.jpg",
    "https://telegra.ph/file/01e42d9181311dd7d2d70.jpg",
    "https://telegra.ph/file/e5cf6db288acbfbb13f2b.jpg",
    "https://telegra.ph/file/5a6ee797141b96fcebcce.jpg",
    "https://telegra.ph/file/88d5b22d7a40365f59fc4.jpg",
    "https://telegra.ph/file/0de4de20e35f6c9b12af6.jpg",
    "https://telegra.ph/file/6b60a05a32e7bdbb62c2d.jpg",
    "https://telegra.ph/file/549e5a1dbd0aebbd909c6.jpg",
    "https://telegra.ph/file/d9d0c658ef1ea088d3579.jpg",
    "https://telegra.ph/file/4c8fa9809897b7bd3eb03.jpg",
    "https://telegra.ph/file/a58ee2c51fdc6c78ed7f6.jpg",
    "https://telegra.ph/file/f2253a885cb84af5d588c.jpg",
    "https://telegra.ph/file/f17bd255b176da6943240.jpg",
    "https://telegra.ph/file/279afb02b1fcf93abdae4.jpg",
    "https://telegra.ph/file/8ba4a8f31cf0673f6aa87.jpg",
    "https://telegra.ph/file/c842818563065460b022e.jpg",
    "https://telegra.ph/file/99e10142aeef70961437a.jpg",
    "https://telegra.ph/file/33da8321603f78cd165f4.jpg",
    "https://telegra.ph/file/63678732998176b22fa96.jpg",
    "https://telegra.ph/file/b79bb874be90a34cd5786.jpg",
    "https://telegra.ph/file/148875b883f91ac8b42e6.jpg",
    "https://telegra.ph/file/275d948e0ed99652b4c52.jpg",
    "https://telegra.ph/file/dbfa4e1043d1bbc9441b2.jpg",
    "https://telegra.ph/file/1ab030093aea5937e0468.jpg",
    "https://telegra.ph/file/b5b64e5e5ee0df73bc5b5.jpg",
    "https://telegra.ph/file/a7032cdd783d8f1656424.jpg",
    "https://telegra.ph/file/5ea4218fedab8e124496b.jpg",
    "https://telegra.ph/file/0e0fef10d278f886a5f4a.jpg",
    "https://telegra.ph/file/09e81d73081d6f2811ca3.jpg",
    "https://telegra.ph/file/816866bef7a307029e6b6.jpg",
    "https://telegra.ph/file/5b5736027ae57a787d00c.jpg",
    "https://telegra.ph/file/68899ab649fa4711905ce.jpg",
    "https://telegra.ph/file/47b0c825cdf8ebaa90a05.jpg",
    "https://telegra.ph/file/06aaa229521191de3895e.jpg",
    "https://telegra.ph/file/68551e562c4e343efd965.jpg",
    "https://telegra.ph/file/9487c11c728cd279b8da3.jpg"
]

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const card = (emoji, title, rows, note) => {
  const w = Math.max(...rows.map(r => r[0].length))
  return box(emoji, title, rows.map(([k, v]) => `♡ ${k.padEnd(w)} : ${v}`).join('\n'), note)
}
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')
const react = async (m, e) => { try { await m.react?.(e) } catch {} }
const getJson = async (url, timeout = 30000) => (await axios.get(url, { timeout })).data
const sendImg = (conn, m, image, caption) => conn.sendMessage(m.chat, { image: typeof image === 'string' ? { url: image } : image, caption }, { quoted: m })

const E = {}
const add = (key, cmds, title, run) => { E[key] = { cmds, title, run } }

add('nasip', ['gachanasip'], 'Gacha Nasip', ({ m }) => m.reply(card('🍀', 'Gacha Nasip', [['Player', m.pushName || 'Kamu'], ['Nasip', pick(NASIP)]], '_Hanya hiburan, semoga harimu menyenangkan!_')))

add('bluearchive', ['bluearchive', 'baimg', 'blue-archive'], 'Blue Archive', async ({ conn, m }) => {
  const data = await getJson('https://raw.githubusercontent.com/rynxzyy/blue-archive-r-img/refs/heads/main/links.json')
  if (!Array.isArray(data) || !data.length) throw new Error('Gambar tidak ditemukan.')
  return sendImg(conn, m, pick(data), `🎀 *Random Blue Archive*\n\n${FOOTER}`)
})

add('animeinfo', ['animeinfo'], 'Anime Info', async ({ conn, m, text, command, p }) => {
  const q = String(text || '').trim()
  if (!q) return m.reply(usage('🎌', 'Anime Info', ['Masukkan judul anime.', '', `♡ ${p}${command} one piece`]))
  const j = await getJson('https://api.jikan.moe/v4/anime?q=' + encodeURIComponent(q))
  const a = j?.data?.[0]
  if (!a) throw new Error('Anime tidak ditemukan.')
  const syn = String(a.synopsis || '-').slice(0, 700)
  const caption = card('🎌', 'Anime Info', [
    ['Judul', a.title_japanese || a.title], ['Tipe', a.type || '-'], ['Genre', (a.genres || []).map(g => g.name).join(', ') || '-'],
    ['Skor', a.score ?? '-'], ['Member', a.members ?? '-'], ['Status', a.status || '-'], ['Favorit', a.favorites ?? '-'], ['URL', a.url]
  ], `*Sinopsis*\n${syn}${a.synopsis?.length > 700 ? '...' : ''}`)
  const img = a.images?.jpg?.image_url
  return img ? sendImg(conn, m, img, caption) : m.reply(caption)
})

add('animerandom', ['animerandom'], 'Anime Random', async ({ conn, m }) => {
  const d = await getJson('https://lance-frank-asta.onrender.com/api/anime-random')
  if (!d?.status) throw new Error('Gagal ambil data anime.')
  const i = d.random
  return sendImg(conn, m, i.imgAnime, card('🎌', 'Anime Random', [['ID', i.ID], ['Nama', i.name], ['Movie', i.movie]]))
})

add('storyanime', ['storyanime', 'storianime', 'animestory', 'animestori'], 'Story Anime', ({ conn, m }) =>
  conn.sendMessage(m.chat, { video: { url: pick(STORY) }, caption: `🎬 *Random Story Anime*\n\n${FOOTER}` }, { quoted: m }))

add('animequotes', ['animequotes'], 'Anime Quotes', async ({ m }) => {
  const { data } = await axios.get('https://otakotaku.com/quote/feed/' + rand(0, 183), { timeout: 30000 })
  const $ = cheerio.load(data)
  const links = $('div.kotodama-list').map((i, el) => $(el).find('a.kuroi').attr('href')).get().slice(0, 6)
  if (!links.length) throw new Error('Quote tidak ditemukan.')
  const url = pick(links)
  const { data: q } = await axios.get(url, { timeout: 30000 })
  const $q = cheerio.load(q)
  const r = {
    char: $q('.char-info .tebal a[href*="/character/"]').text().trim(),
    anime: $q('.char-info a[href*="/anime/"]').text().trim(),
    eps: $q('.char-info span.meta').text().trim().replace('- ', ''),
    quote: $q('.post-content blockquote p').text().trim()
  }
  return m.reply(card('🌸', 'Anime Quotes', [['Karakter', r.char || '-'], ['Anime', r.anime || '-'], ['Episode', r.eps || '-'], ['Quote', `❝ ${r.quote || '-'} ❞`]]))
})

add('ongoing', ['ongoing'], 'Anime Ongoing', async ({ m }) => {
  const now = new Date()
  const season = ['winter', 'spring', 'summer', 'fall'][Math.floor(now.getUTCMonth() / 3)]
  const { data } = await axios.get(`https://www.livechart.me/${season}-${now.getUTCFullYear()}/tv`, { timeout: 30000 })
  const $ = cheerio.load(data)
  const list = []
  $('#content > main > article').each((i, e) => {
    const judul = $(e).find('div > h3 > a').text().trim()
    const ts = Number($(e).find("time[data-anime-card-target='countdown']").attr('data-timestamp'))
    if (!judul || !ts) return
    const eps = $(e).find('div > div.poster-container > a > div').text().trim()
    const studio = $(e).find('div > div.anime-info > ul > li > a').first().text().trim()
    list.push({ judul, ts, eps, studio })
  })
  if (!list.length) throw new Error('Data anime musim ini tidak ditemukan.')
  list.sort((a, b) => a.ts - b.ts)
  const upcoming = list.filter(x => x.ts * 1000 > Date.now()).slice(0, 10)
  const rows = (upcoming.length ? upcoming : list.slice(0, 10)).map(x => {
    const d = Math.max(0, x.ts * 1000 - Date.now())
    const cd = `${Math.floor(d / 86400000)}h ${Math.floor(d % 86400000 / 3600000)}j ${Math.floor(d % 3600000 / 60000)}m`
    const when = new Date(x.ts * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    return `♡ *${x.judul}*${x.eps ? ` (${x.eps})` : ''}\n   ${when} WITA • ${cd} lagi${x.studio ? ` • ${x.studio}` : ''}`
  })
  return m.reply(box('📺', `Anime Ongoing (${season})`, rows.join('\n'), '_Sumber: livechart.me_'))
})

add('qislam', ['qislam', 'q-islam'], 'Islam', ({ m }) => m.reply(box('🕌', 'Islam', pick(ISLAM))))
add('pantun2', ['pantun2'], 'Pantun', ({ m }) => m.reply(box('📜', 'Pantun', pick(PANTUN2))))

add('sertifikat2', ['sertifikat2', 'sertif2', 'sertifikattolol2', 'sertolol2'], 'Sertifikat Tolol', async ({ conn, m, text, command, p }) => {
  const t = String(text || '').trim()
  if (!t) return m.reply(usage('📜', 'Sertifikat Tolol', ['Tulis nama untuk sertifikat.', '', `♡ ${p}${command} Budi Santoso`]))
  await react(m, '⏳')
  const { data } = await axios.get('https://api-xemoz-official.my.id/api/maker/sertifikat-tolol.php', { params: { text: t }, timeout: 20000 })
  if (!data?.result?.image) throw new Error('Gagal generate sertifikat.')
  const buf = Buffer.from(data.result.image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  return conn.sendMessage(m.chat, { image: buf, mimetype: data.result.mimetype || 'image/jpeg', caption: `📜 *Sertifikat Tolol*\n♡ ${t}\n\n${FOOTER}` }, { quoted: m })
})

add('renungan', ['renungan'], 'Renungan', ({ conn, m }) => sendImg(conn, m, pick(RENUNGAN), `🕊️ *Renungan*\n\n${FOOTER}`))

const MAP = {}
for (const [k, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/misc] command ganda: ${c}`)
  MAP[c] = k
}

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const k = MAP[cmd]
  if (!k) return
  try {
    return await E[k].run({ conn, m, text, command: cmd, p })
  } catch (e) {
    return m.gagal(e?.response?.data?.message || e?.message || String(e), E[k].title)
  }
}

handler.help = ['gachanasip', 'bluearchive', 'animeinfo <judul>', 'animerandom', 'storyanime', 'animequotes', 'ongoing', 'qislam', 'pantun2', 'sertifikat2 <nama>', 'renungan']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
