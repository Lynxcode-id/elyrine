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

const DATA = {
 "quotesbacot": {
  "title": "Quotes Bacot",
  "emoji": "💬",
  "cmds": [
   "quotesbacot",
   "bacot"
  ],
  "list": [
   "Kamu suka kopi nggak? Aku sih suka. Tau kenapa alesannya? Kopi itu ibarat kamu, pahit sih tapi bikin candu jadi pingin terus.",
   "Gajian itu kayak mantan ya? Bisanya cuman lewat sebentar saja.",
   "Kata pak haji, cowok yang gak sholat jumat disuruh pake rok mini aja.",
   "Boro-boro mau beli masa depan, beli seblak aja masih mikir nambah ceker apa nggak.",
   "Muka lo kayak uang kembalian permen, ga diharapkan tapi tetep diterima.",
   "Jangan kepedean disapa ramah, kang parkir juga ramah ke semua orang.",
   "Lo itu ibarat sinyal di pelosok, kadang hilang kadang bikin emosi.",
   "Kalau ngomong jangan tinggi-tinggi, nanti ketabrak pesawat garuda.",
   "Gue kira lo tulus, ternyata lo cuma modus biar dapet tebengan gratis.",
   "Duit tinggal goceng, gaya selangit kayak sultan minyak dari Dubai.",
   "Jangan bangga dibilang manis, gula aren juga manis tapi bikin semutan.",
   "Kamera sekarang makin canggih, sayang nggak bisa dipake buat scan otak lo.",
   "Kalo gak suka ya bilang depan muka, jangan ngomong di belakang kayak knalpot bocor.",
   "Pacaran kok kayak kredit motor, kalo gak dibayar ditarik dealer.",
   "Tampang pas-pasan, selera selangit, maunya jalan-jalan ke Mars gratis.",
   "Jangan suka ngumbar janji, janji itu hutang, mending lunasin hutang kopi lo dulu.",
   "Hidup lo kebanyakan drama, pantesan ratingnya anjlok di mata orang.",
   "Gak usah sok keras, kena gerimis dikit aja langsung bikin status galau.",
   "Omonganmu kayak wifi gratisan, gampang nyambung tapi lemot dan banyak gangguan.",
   "Sahabat itu saling bantu, bukan pas butuh baru nyari kayak nyari sinyal di goa.",
   "Gak usah sok sibuk, dichat balesnya tiga abad kemudian kayak prasasti kuno.",
   "Otak lo jangan disimpen terus buat museum, dipake sesekali biar gak karatan.",
   "Cinta itu buta, tapi untung tetangga lo gak buta liat kelakuan lo.",
   "Penampilan boleh keren, tapi saldo rekening jangan kayak nilai ulangan fisika.",
   "Muka dua aja sombong, kalau mau beli bedak kan bayarnya dobel.",
   "Janji manis lo itu kayak sirup basi, manis diawal tapi bikin mules di akhir.",
   "Gaya lo udah kayak CEO ternama, giliran patungan makan langsung pura-pura ke toilet.",
   "Sok jual mahal, padahal kalo diskon 90% juga gak ada yang mau nawar.",
   "Kalau gak bisa bikin bangga, minimal jangan bikin polusi emosi orang lain.",
   "Mulut lo kayak knalpot racing, berisik banget padahal kecepatannya nol besar."
  ]
 },
 "quotesbijak": {
  "title": "Quotes Bijak",
  "emoji": "🦉",
  "cmds": [
   "quotesbijak",
   "bijak"
  ],
  "list": [
   "Keyakinan merupakan suatu pengetahuan di dalam hati, jauh tak terjangkau oleh bukti.",
   "Rasa bahagia dan tak bahagia bukan berasal dari apa yang kamu miliki, tapi berasal dari pikiran kamu.",
   "Sakit dalam perjuangan itu hanya sementara. Namun jika menyerah, rasa sakit itu akan terasa selamanya.",
   "Hanya seseorang yang takut yang bisa bertindak berani. Tanpa rasa takut itu tidak ada keberanian.",
   "Jadilah diri kamu sendiri. Siapa lagi yang bisa melakukannya lebih baik ketimbang diri kamu sendiri?",
   "Kesempatan kamu untuk sukses selalu dapat diukur oleh seberapa besar kepercayaan kamu pada diri sendiri.",
   "Kebanggaan kita yang terbesar adalah bukan tidak pernah gagal, tetapi bangkit kembali setiap kali kita jatuh.",
   "Suatu pekerjaan yang paling tak kunjung bisa diselesaikan adalah pekerjaan yang tak kunjung pernah dimulai.",
   "Pikiran kamu bagaikan api yang perlu dinyalakan, bukan bejana yang menanti untuk diisi.",
   "Kejujuran adalah batu penjuru dari segala kesuksesan. Pengakuan adalah motivasi terkuat.",
   "Segala sesuatu memiliki kesudahan, yang sudah berakhir biarlah berlalu dan yakinlah semua akan baik-baik saja.",
   "Setiap detik sangatlah berharga karena waktu mengetahui banyak hal, termasuk rahasia hati.",
   "Jika kamu tak menemukan buku yang kamu cari di rak, maka tulislah sendiri.",
   "Jika hatimu banyak merasakan sakit, maka belajarlah untuk tidak memberikan rasa sakit pada orang lain.",
   "Hidup tak selamanya tentang pacar.",
   "Rumah bukan hanya sebuah tempat, tetapi itu adalah perasaan.",
   "Pilih mana: Orang yang memimpikan kesuksesan atau orang yang membuatnya menjadi kenyataan?",
   "Bukan bahagia yang menjadikan kita bersyukur, tetapi dengan bersyukurlah yang akan menjadikan hidup kita bahagia.",
   "Aku memang diam. Tapi aku tidak buta.",
   "Kamu tidak bisa menyiram bunga yang layu, tapi kamu bisa menanam bunga yang baru dengan harapan yang lebih baik.",
   "Jangan pernah menyesali sehari pun dalam hidupmu. Hari baik memberimu kebahagiaan, hari buruk memberimu pengalaman.",
   "Kesabaran bukanlah kemampuan untuk menunggu, melainkan bagaimana kita bersikap saat sedang menunggu.",
   "Orang yang kuat bukanlah orang yang tidak pernah menangis, melainkan orang yang tetap tegar meski air matanya mengalir.",
   "Kebaikan yang kamu tanam hari ini mungkin tidak berbuah esok hari, tapi pasti akan berbuah pada waktunya.",
   "Waktu adalah pedang; jika kamu tidak memanfaatkannya dengan bijak, ia yang akan menebasmu.",
   "Memaafkan bukan berarti melupakan, tetapi melepaskan beban di hati agar bisa melangkah lebih ringan.",
   "Kekayaan sejati bukanlah tentang seberapa banyak yang kamu miliki, melainkan seberapa sedikit kebutuhanmu untuk merasa cukup.",
   "Kadang kita harus tersesat terlebih dahulu untuk menemukan jalan terbaik yang belum pernah terpikirkan.",
   "Belajarlah merendah sampai tidak ada seorang pun yang bisa merendahkanmu.",
   "Diam adalah jawaban terbaik untuk orang yang tidak menghargai perkataanmu.",
   "Kelemahan terbesar kita adalah mudah menyerah. Cara paling pasti untuk sukses adalah selalu mencoba satu kali lagi.",
   "Jangan membandingkan prosesmu dengan orang lain, karena pelangi dan bintang bersinar pada waktu yang berbeda.",
   "Ketenangan batin dimulai saat kamu berhenti membiarkan tindakan orang lain mengendalikan emosimu."
  ]
 },
 "quotesbucin": {
  "title": "Quotes Bucin",
  "emoji": "💖",
  "cmds": [
   "quotesbucin",
   "bucin"
  ],
  "list": [
   "Aku memilih untuk sendiri, bukan karena menunggu yang sempurna, tetapi butuh yang tak pernah menyerah.",
   "Seorang yang single diciptakan bersama pasangan yang belum ditemukannya.",
   "Jomblo. Mungkin itu cara Tuhan untuk menyelamatkanmu dari orang yang salah.",
   "Kasih sayang yang tulus tidak akan pernah pudar meski waktu terus berganti.",
   "Cinta itu bukan tentang seberapa lama kamu mengenal seseorang, tapi tentang seberapa tulus kamu mencintainya.",
   "Aku tidak butuh orang yang sempurna, aku hanya butuh seseorang yang bisa membuatku merasa cukup.",
   "Jika mencintaimu adalah kesalahan, maka aku tidak pernah ingin menjadi benar.",
   "Bersamamu, bahkan diam pun terasa begitu nyaman dan menenangkan.",
   "Bukan karena kamu yang terbaik, tapi karena kamu yang membuat hatiku berhenti mencari.",
   "Rindu ini seperti ombak di lautan, tak pernah berhenti mendekat ke tepian hatimu.",
   "Aku ingin menjadi alasan di balik senyum pertamamu setiap pagi.",
   "Cinta sejati tidak butuh alasan, karena cinta adalah alasan itu sendiri.",
   "Mungkin aku bukan yang pertama di hatimu, tapi biarkan aku menjadi yang terakhir.",
   "Setiap detak jantungku selalu berbisik namamu pelan-pelan.",
   "Hujan di luar mungkin dingin, tapi mengingat senyummu selalu menghangatkan jiwaku.",
   "Dunia ini terlalu luas untuk dijelajahi sendiri, maukah kamu menemaniku sampai akhir?",
   "Jika satu detik bersamamu adalah keabadian, maka aku ingin hidup di detik itu selamanya.",
   "Aku tidak pernah takut jatuh cinta, asalkan yang menyambut jatuhku adalah kamu.",
   "Kamu adalah bait puisi terindah yang pernah dituliskan takdir dalam hidupku.",
   "Terkadang aku cemburu pada bayanganmu, karena dia selalu mengikutimu kemanapun kamu melangkah.",
   "Jarak itu hanya angka, selama namamu masih tersimpan rapi di dalam doa-doaku.",
   "Cintaku padamu bagaikan lingkaran, tidak memiliki titik awal dan tidak akan pernah berujung.",
   "Melihatmu bahagia sudah cukup, tapi menjadi alasan di balik bahagiamu adalah impian terbesarku.",
   "Aku mencintaimu bukan karena siapa dirimu, melainkan siapa diriku saat bersamamu.",
   "Senyummu adalah pemandangan favoritku, dan tawamu adalah melodi paling merdu yang pernah kudengar.",
   "Di antara miliaran manusia di bumi, hatiku hanya memilihmu untuk menetap.",
   "Cinta bukan tentang mencari seseorang yang bisa hidup bersamamu, tapi tentang menemukan seseorang yang tanpanya kamu tak bisa hidup.",
   "Terima kasih sudah hadir dan mengubah hal-hal biasa menjadi luar biasa indah.",
   "Kalau cinta itu luka, biarkan aku terluka asalkan itu karenamu.",
   "Tak peduli seberapa lelah hariku, mendengar suaramu selalu mampu mengembalikan energiku."
  ]
 },
 "quotesgalau": {
  "title": "Quotes Galau",
  "emoji": "🌧️",
  "cmds": [
   "quotesgalau",
   "galau"
  ],
  "list": [
   "Gak salah kalo aku lebih berharap sama orang yang lebih pasti tanpa khianati janji-janji.",
   "Kalau aku memang tidak sayang sama kamu ngapain aku mikirin kamu. Tapi semuanya kamu yang ngganggap aku gak sayang sama kamu.",
   "Mungkin kamu tak pernah sadar, betapa seringnya aku menatap layar hanya untuk menunggu satu pesan darimu.",
   "Hal paling menyakitkan adalah berpura-pura bahagia ketika hati sedang hancur lebur.",
   "Aku lelah mengejar seseorang yang langkahnya selalu menjauh dari arahku.",
   "Terkadang, melepaskan bukan berarti berhenti mencintai, melainkan menyadari bahwa dia lebih bahagia tanpamu.",
   "Kita pernah sedekat nadi, sebelum akhirnya menjadi sejauh matahari.",
   "Bagian terberat dari perpisahan bukanlah kepergiannya, tapi kenangan yang tertinggal di setiap sudut ingatan.",
   "Aku rindu kita yang dulu, sebelum rasa ego dan keheningan menghancurkan segalanya.",
   "Tersenyum di depan semua orang itu mudah, yang sulit adalah menahan air mata saat sendirian di kamar.",
   "Mungkin aku yang terlalu berharap pada seseorang yang hanya menganggapku persinggahan sementara.",
   "Sudah terbiasa diabaikan, sampai-sampai perhatian kecil terasa seperti keajaiban.",
   "Bukan jarak yang memisahkan kita, melainkan rasa yang perlahan memudar tanpa kita sadari.",
   "Menunggu kabar darimu seperti menunggu hujan di tengah teriknya gurun pasir.",
   "Ternyata, rasa sakit terdalam berasal dari orang yang pernah berjanji tidak akan pernah melukai kita.",
   "Aku tetap bertahan bukan karena bodoh, tapi karena hatiku belum siap menerima kenyataan bahwa kamu sudah pergi.",
   "Kehilangan seseorang yang kita cintai itu berat, tapi kehilangan diri sendiri demi mempertahankan seseorang jauh lebih menyakitkan.",
   "Hati ini seperti cangkir retak; tetap bisa menampung air, tapi perlahan-lahan menetes habis.",
   "Selamat malam untuk kamu yang tak lagi bisa kusapa, semoga mimpimu selalu indah meski tanpaku.",
   "Terima kasih telah mengajarkanku bahwa tidak semua ketulusan akan berbuah kebersamaan.",
   "Rasanya aneh ketika seseorang yang dulu tahu segalanya tentangmu kini bertingkah seperti orang asing.",
   "Luka ini tak berdarah, tapi rasa perihnya menembus hingga ke dasar jiwa.",
   "Aku berhenti mencarimu, bukan karena tak peduli, tapi karena sadar kehadiranku tak lagi dinanti.",
   "Mencintai dalam diam itu menyakitkan, tapi melihatnya mencintai orang lain di depan mata jauh lebih menghancurkan.",
   "Waktu memang menyembuhkan, tapi bekas lukanya tetap mengingatkan pada rasa sakit yang pernah ada."
  ]
 },
 "quotesgombal": {
  "title": "Quotes Gombal",
  "emoji": "💘",
  "cmds": [
   "quotesgombal"
  ],
  "list": [
   "Hal yang paling aku suka yaitu ngemil, namun tau gak ngemil apa yang paling aku suka? ngemilikin kamu sepenuhnya.",
   "Seandainya sekarang adalah tanggal 28 oktober 1928, aku akan ubah naskah sumpah pemuda menjadi sumpah setia padamu.",
   "Kamu tau gak bedanya kamu sama modem? Kalau modem connect-nya ke internet, kalau kamu connect-nya langsung ke hatiku.",
   "Aku gak sedih kok kalo besok hari senin, asalkan seninnya dilewati bareng kamu.",
   "Muka kamu jangan dimanis-manisin gitu napa, ntar aku kena diabetes liat kamu terus.",
   "Kamu punya peta gak? Soalnya aku tersesat di dalam matamu yang indah.",
   "Bapak kamu tukang las ya? Soalnya tatapan matamu menyengat dan bikin meleleh hatiku.",
   "Cita-citaku dulu pengen jadi pilot, tapi sekarang berubah pengen jadi pendamping hidupmu aja.",
   "Kamu tau gak apa bedanya garuda sama kamu? Kalau garuda di dadaku, kalau kamu di hatiku.",
   "Rumah sakit jiwa dimana ya? Soalnya aku udah gila banget sama pesonamu.",
   "Jangan jalan-jalan terus di pikiranku dong, capek tau mikirin kamu seharian.",
   "Kamu itu kayak garam di lautan, gak keliatan tapi selalu memberi rasa di hidupku.",
   "Kalau kamu jadi senar gitar, aku gak mau jadi pemetiknya. Aku takut mutusin kamu.",
   "Kopi apa yang paling manis? Kopi-kirkan kamu setiap malam sebelum tidur.",
   "Kamu punya spidol gak? Aku mau coret nama mantanku dan tulis namamu di hatiku.",
   "Meskipun tanggal merah banyak, rasa rinduku padamu gak pernah libur barang sedetik pun.",
   "Kamu tau gak persamaan kamu sama matematika? Sama-sama bikin pusing, tapi kamu bikin pusing saking cantiknya.",
   "Aku gak butuh bintang di langit, karena senyumanmu udah cukup menerangi duniaku yang gelap.",
   "Tahu gak kenapa aku suka hujan? Karena setiap tetesnya mengingatkanku pada sejuknya senyumanmu.",
   "Kalau ada lomba mencintaimu, aku yakin pasti kalah, karena aku mencintaimu tanpa batas dan aturan.",
   "Kamu itu seperti wifi berbayar, susah didapetin tapi worth it banget bikin bahagia.",
   "Kucing apa yang paling romantis? Kucing-ta kamu selamanya tanpa ragu.",
   "Kamu tau gak kenapa menara pisa miring? Soalnya ketarik sama gravitasi kecantikanmu.",
   "Napas aku sesak nih, kayaknya gara-gara oksigen di ruangan ini habis diserap sama pesonamu.",
   "Aku rela ditilang polisi setiap hari, asalkan SIM yang disita adalah Surat Izin Menikahimu."
  ]
 },
 "quotesheker": {
  "title": "Quotes Heker",
  "emoji": "💻",
  "cmds": [
   "quoteshacker",
   "heker"
  ],
  "list": [
   "Dear kamu yang tertulis di halaman defacementku, Kapan jadi pacarku?",
   "Aku rela ko jadi Processor yg kepanasan, asalkan kmu yg jadi heatsink'y yg setiap saat bisa mendinginkan ku.",
   "Gak usah nyari celah xss deh, karena ketika kamu ngeklik hatiku udah muncul pop up namamu.",
   "berharap setelah aku berhasil login di hati kamu ga akan ada tombol logout, dan sessionku ga bakal pernah expired.",
   "Masa aku harus pake teknik symlink bypass buat buka-buka folder hatimu yg open_basedir enabled.",
   "Diriku dan Dirimu itu ibarat PHP dan MySQL yang belum terkoneksi.",
   "Jangan cuma bisa inject hatinya, tapi harus bisa patchnya juga. Biar tidak selingkuh sama hacker lain.",
   "Aku memang programmer PHP, tapi aku nggak akan php-in kamu kok.",
   "Eneeeng. | Apache? | Km wanita yg paling Unix yg pernah aku kenal.",
   "Sayang, capslock kamu nyala ya? | ngga, kenapa emangnya? | soalnya nama kamu ketulis gede bgt di hati aku.",
   "Aku deketin kamu cuma untuk redirect ke hati temenmu.",
   "Domain aja bisa parkir, masa cintaku ga bisa parkir dihatimu?",
   "Aku boleh jadi pacarmu? | 400 (Bad Request) | Aku cium boleh? | 401 (Authorization Required).",
   "kamu tau ga bedanya kamu sama sintax PHP, kalo sintax PHP itu susah dihafalin kalo kamu itu susah dilupain.",
   "Menjaring hatimu lewat komputerku adalah keahlian utamaku.",
   "Jika cinta itu Array, maka cintaku padamu tak pernah empty jika di unset().",
   "SQLI ( Structured Query Love Injection ) sedang berjalan di hatimu.",
   "aku ingin kamu rm -rf kan semua mantan di otak mu, akulah root hati kamu.",
   "Senyumu bagaikan cooler yang menyejukan hatiku ketika sedang overclock.",
   "kamu adalah terminalku, dimana aku menghabiskan waktuku untuk mengetikan beribu baris kode cinta untukmu.",
   "hatiku ibarat vps hanya untukmu saja bukan shared hosting yg bisa tumpuk berbagai domain cinta.",
   "Jangan men-dualboot-kan hatiku kepadamu.",
   "cintaku kan ku Ctrl+A lalu kan ku Ctrl+C dan kan ku Ctrl+V tepat di folder system hatimu.",
   "Cintamu bagaikan TeamViewer yang selalu mengendalikan hatiku.",
   "cinta kita tak akan bisa dipisahkan walau setebal apapun itu firewall...!!",
   "while (alive) { love(you); } // Infinite loop cinta yang tidak akan pernah berhenti.",
   "Kamu itu bagaikan git commit -m 'final love', keputusan terbaik yang pernah kupush ke repo hidupku.",
   "Jangan pernah git reset --hard kenangan indah yang sudah pernah kita branch bersama.",
   "Cintaku padamu seperti kernel Linux, selalu open source, stabil, dan siap running 24/7.",
   "Error di kodingan bisa kudebug dengan mudah, tapi error saat melihat senyum manismu bikin otakku stuck selamanya."
  ]
 },
 "quotesislam": {
  "title": "Quotes Islami",
  "emoji": "🕌",
  "cmds": [
   "quotesislami",
   "quotesislam",
   "islamquotes"
  ],
  "list": [
   {
    "arabic": "مَنْ سَارَ عَلىَ الدَّرْبِ وَصَلَ",
    "arti": "Barang siapa berjalan pada jalannya, maka dia akan sampai pada tujuannya."
   },
   {
    "arabic": "مَنْ صَبَرَ ظَفِرَ",
    "arti": "Barang siapa bersabar, beruntunglah ia."
   },
   {
    "arabic": "مَنْ جَدَّ وَجَدَ",
    "arti": "Barang siapa bersungguh-sungguh, maka dapatlah ia."
   },
   {
    "arabic": "جَالِسْ أَهْلَ الصِّدْقِ وَالوَفَاءِ",
    "arti": "Bergaullah dengan orang yang jujur dan menepati janji."
   },
   {
    "arabic": "مَوَدَّةُ الصَّدِيقِ تَظْهَرُ وَقْتَ الضِّيقِ",
    "arti": "Ketulusan cinta seorang teman akan tampak di saat kesusahan."
   },
   {
    "arabic": "وَقْتُ النَّدَمِ لَا يَنْفَعُ",
    "arti": "Waktu penyesalan itu tidak ada gunanya."
   },
   {
    "arabic": "خَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابٌ",
    "arti": "Sebaik-baik teman duduk di setiap waktu adalah buku."
   },
   {
    "arabic": "التَّعَلُّمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى الحَجَرِ",
    "arti": "Belajar di waktu kecil bagaikan mengukir di atas batu."
   },
   {
    "arabic": "لَنْ تَرْجِعَ الأَيَّامُ الَّتِي مَضَتْ",
    "arti": "Tidak akan kembali hari-hari yang telah berlalu."
   },
   {
    "arabic": "أَصْلِحْ نَفْسَكَ يَصْلُحْ لَكَ النَّاسُ",
    "arti": "Perbaikilah dirimu, niscaya orang lain akan baik kepadamu."
   },
   {
    "arabic": "فَكِّرْ قَبْلَ أَنْ تَعْزِمَ",
    "arti": "Berpikirlah sebelum kamu bertindak."
   },
   {
    "arabic": "مَنْ عَرَفَ بُعْدَ السَّفَرِ اسْتَعَدَّ",
    "arti": "Barang siapa tahu jauhnya perjalanan, maka ia akan bersiap-siap."
   },
   {
    "arabic": "مَنْ يَزْرَعْ يَحْصُدْ",
    "arti": "Barang siapa menanam, dialah yang akan memanen."
   },
   {
    "arabic": "خَيْرُ الأَصْحَابِ مَنْ يَدُلُّكَ عَلَى الخَيْرِ",
    "arti": "Sebaik-baik teman adalah yang menunjukkanmu pada kebaikan."
   },
   {
    "arabic": "لَوْلَا العِلْمُ لَكَانَ النَّاسُ كَالبَهَائِمِ",
    "arti": "Kalaulah bukan karena ilmu, niscaya manusia itu seperti binatang."
   },
   {
    "arabic": "الصَّبْرُ يُعِينُ عَلَى كُلِّ عَمَلٍ",
    "arti": "Kesabaran itu menolong atas segala pekerjaan."
   },
   {
    "arabic": "جَرِّبْ وَلَاحِظْ تَكُنْ عَارِفًا",
    "arti": "Cobalah dan perhatikanlah, niscaya kamu akan menjadi orang yang tahu."
   },
   {
    "arabic": "اطْلُبِ العِلْمَ مِنَ المَهْدِ إِلَى اللَّحْدِ",
    "arti": "Tuntutlah ilmu dari buaian hingga liang lahat."
   },
   {
    "arabic": "بَيْضَةُ اليَوْمِ خَيْرٌ مِنْ دَجَاجَةِ الغَدِ",
    "arti": "Telur hari ini lebih baik daripada ayam esok hari."
   },
   {
    "arabic": "الوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ",
    "arti": "Waktu itu lebih berharga daripada emas."
   },
   {
    "arabic": "العَقْلُ السَّلِيمُ فِي الجِسْمِ السَّلِيمِ",
    "arti": "Akal yang sehat terletak pada badan yang sehat."
   },
   {
    "arabic": "عَثْرَةُ القَدَمِ أَسْلَمُ مِنْ عَثْرَةِ اللِّسَانِ",
    "arti": "Tergelincirnya kaki lebih aman daripada tergelincirnya lidah."
   },
   {
    "arabic": "سَلَامَةُ الإِنْسَانِ فِي حِفْظِ اللِّسَانِ",
    "arti": "Keselamatan manusia terletak pada penjagaan lisannya."
   },
   {
    "arabic": "آدَابُ المَرْءِ خَيْرٌ مِنْ ذَهَبِهِ",
    "arti": "Adab seseorang itu lebih baik daripada emas perhiasannya."
   },
   {
    "arabic": "سُوءُ الخُلُقِ يُعْدِي",
    "arti": "Akhlak yang buruk itu menular."
   },
   {
    "arabic": "آفَةُ العِلْمِ النِّسْيَانُ",
    "arti": "Bencana ilmu adalah lupa."
   },
   {
    "arabic": "إِذَا صَدَقَ العَزْمُ وَضَحَ السَّبِيلُ",
    "arti": "Jika tekad sudah bulat, jalan akan terbuka terang."
   },
   {
    "arabic": "لَا تَحْتَقِرْ مَنْ دُونَكَ فَلِكُلِّ شَيْءٍ مَزِيَّةٌ",
    "arti": "Jangan meremehkan orang yang di bawahmu, karena setiap sesuatu punya kelebihan."
   },
   {
    "arabic": "أَصْلُ النَّجَاحِ التَّوَكُّلُ عَلَى اللهِ",
    "arti": "Pangkal keberhasilan adalah tawakal kepada Allah."
   },
   {
    "arabic": "كُنْ عَالِمًا أَوْ مُتَعَلِّمًا أَوْ مُسْتَمِعًا",
    "arti": "Jadilah orang alim, atau penuntut ilmu, atau pendengar yang baik."
   },
   {
    "arabic": "الحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ",
    "arti": "Rasa malu itu adalah sebagian dari iman."
   },
   {
    "arabic": "الدُّنْيَا مَزْرَعَةُ الآخِرَةِ",
    "arti": "Dunia adalah ladang tempat bercocok tanam untuk akhirat."
   },
   {
    "arabic": "حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا",
    "arti": "Hisablah dirimu sebelum kamu dihisab di hari perhitungan."
   },
   {
    "arabic": "مَنْ تَأَنَّى نَالَ مَا تَمَنَّى",
    "arti": "Barang siapa berhati-hati, niscaya ia akan memperoleh apa yang ia cita-citakan."
   },
   {
    "arabic": "قُلِ الحَقَّ وَلَوْ كَانَ مُرًّا",
    "arti": "Katakanlah kebenaran walaupun itu pahit rasanya."
   }
  ]
 },
 "quotesmotivasi": {
  "title": "Quotes Motivasi",
  "emoji": "🔥",
  "cmds": [
   "quotesmotivasi"
  ],
  "list": [
   "ᴊᴀɴɢᴀɴ ʙɪᴄᴀʀᴀ, ʙᴇʀᴛɪɴᴅᴀᴋ ꜱᴀᴊᴀ. ᴊᴀɴɢᴀɴ ᴋᴀᴛᴀᴋᴀɴ, ᴛᴜɴᴊᴜᴋᴋᴀɴ ꜱᴀᴊᴀ. ᴊᴀɴɢᴀɴ ᴊᴀɴᴊɪ, ʙᴜᴋᴛɪᴋᴀɴ ꜱᴀᴊᴀ.",
   "ᴊᴀɴɢᴀɴ ᴘᴇʀɴᴀʜ ʙᴇʀʜᴇɴᴛɪ ᴍᴇʟᴀᴋᴜᴋᴀɴ ʏᴀɴɢ ᴛᴇʀʙᴀɪᴋ ʜᴀɴʏᴀ ᴋᴀʀᴇɴᴀ ꜱᴇꜱᴇᴏʀᴀɴɢ ᴛɪᴅᴀᴋ ᴍᴇᴍʙᴇʀɪ ᴀɴᴅᴀ ᴘᴇɴɢʜᴀʀɢᴀᴀɴ.",
   "ʙᴇᴋᴇʀᴊᴀ ꜱᴀᴀᴛ ᴍᴇʀᴇᴋᴀ ᴛɪᴅᴜʀ. ʙᴇʟᴀᴊᴀʀ ꜱᴀᴀᴛ ᴍᴇʀᴇᴋᴀ ʙᴇʀᴘᴇꜱᴛᴀ. ʜᴇᴍᴀᴛ ꜱᴇᴍᴇɴᴛᴀʀᴀ ᴍᴇʀᴇᴋᴀ ᴍᴇɴɢʜᴀʙɪꜱᴋᴀɴ. ʜɪᴅᴜᴘʟᴀʜ ꜱᴇᴘᴇʀᴛɪ ᴍɪᴍᴘɪ ᴍᴇʀᴇᴋᴀ.",
   "ᴋᴜɴᴄɪ ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ ᴀᴅᴀʟᴀʜ ᴍᴇᴍᴜꜱᴀᴛᴋᴀɴ ᴘɪᴋɪʀᴀɴ ꜱᴀᴅᴀʀ ᴋɪᴛᴀ ᴘᴀᴅᴀ ʜᴀʟ-ʜᴀʟ ʏᴀɴɢ ᴋɪᴛᴀ ɪɴɢɪɴᴋᴀɴ, ʙᴜᴋᴀɴ ʜᴀʟ-ʜᴀʟ ʏᴀɴɢ ᴋɪᴛᴀ ᴛᴀᴋᴜᴛɪ.",
   "ᴊᴀɴɢᴀɴ ᴛᴀᴋᴜᴛ ɢᴀɢᴀʟ. ᴛᴀᴋᴜᴛʟᴀʜ ʙᴇʀᴀᴅᴀ ᴅɪ ᴛᴇᴍᴘᴀᴛ ʏᴀɴɢ ꜱᴀᴍᴀ ᴛᴀʜᴜɴ ᴅᴇᴘᴀɴ ꜱᴇᴘᴇʀᴛɪ ꜱᴇᴋᴀʀᴀɴɢ.",
   "ꜱᴇᴛɪᴀᴘ ʜᴀʀɪ ᴀᴅᴀʟᴀʜ ᴋᴇꜱᴇᴍᴘᴀᴛᴀɴ ʙᴀʀᴜ ᴜɴᴛᴜᴋ ᴍᴇɴᴊᴀᴅɪ ᴠᴇʀꜱɪ ᴛᴇʀʙᴀɪᴋ ᴅᴀʀɪ ᴅɪʀɪᴍᴜ.",
   "ᴅɪꜱɪᴘʟɪɴ ᴀᴅᴀʟᴀʜ ᴊᴇᴍʙᴀᴛᴀɴ ᴀɴᴛᴀʀᴀ ᴛᴜᴊᴜᴀɴ ᴅᴀɴ ᴘᴇɴᴄᴀᴘᴀɪᴀɴ.",
   "ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ ᴛɪᴅᴀᴋ ᴅᴀᴛᴀɴɢ ᴋᴇᴘᴀᴅᴀ ᴍᴇʀᴇᴋᴀ ʏᴀɴɢ ᴍᴇɴᴜɴɢɢᴜ, ᴛᴇᴛᴀᴘɪ ᴋᴇᴘᴀᴅᴀ ᴍᴇʀᴇᴋᴀ ʏᴀɴɢ ʙᴇʀᴊᴜᴀɴɢ.",
   "ʀᴀꜱᴀ ꜱᴀᴋɪᴛ ᴋᴀʀᴇɴᴀ ᴅɪꜱɪᴘʟɪɴ ᴊᴀᴜʜ ʟᴇʙɪʜ ʀɪɴɢᴀɴ ᴅᴀʀɪᴘᴀᴅᴀ ʀᴀꜱᴀ ꜱᴀᴋɪᴛ ᴋᴀʀᴇɴᴀ ᴘᴇɴʏᴇꜱᴀʟᴀɴ.",
   "ᴊɪᴋᴀ ᴋᴀᴍᴜ ᴛɪᴅᴀᴋ ᴍᴇᴍʙᴀɴɢᴜɴ ᴍɪᴍᴘɪᴍᴜ, ᴏʀᴀɴɢ ʟᴀɪɴ ᴀᴋᴀɴ ᴍᴇɴʏᴇᴡᴀᴍᴜ ᴜɴᴛᴜᴋ ᴍᴇᴍʙᴀɴɢᴜɴ ᴍɪᴍᴘɪ ᴍᴇʀᴇᴋᴀ.",
   "Keringat yang kamu keluarkan hari ini adalah bukti perjuangan untuk masa depan yang lebih cerah.",
   "Jangan biarkan hari kemarin menghabiskan terlalu banyak waktu hari ini.",
   "Masa depan dimiliki oleh mereka yang percaya pada keindahan mimpi-mimpi mereka.",
   "Satu-satunya batasan untuk meraih mimpi kita adalah keragu-raguan kita hari ini.",
   "Jatuh tujuh kali, bangkit delapan kali. Pantang menyerah sebelum tujuan tercapai.",
   "Ketika kamu merasa ingin menyerah, ingatlah kembali alasan mengapa kamu memulainya.",
   "Fokuslah pada kemajuan, sekecil apapun itu, bukan pada kesempurnaan.",
   "Keberanian bukanlah ketiadaan rasa takut, melainkan kemampuan untuk terus melangkah meski takut.",
   "Kerja keras mengalahkan bakat ketika bakat tidak mau bekerja keras.",
   "Impian besar tidak pernah terwujud dari zona nyaman yang sempit.",
   "Setiap ahli dulunya adalah seorang pemula yang tidak pernah berhenti berlatih.",
   "Batu karang yang kokoh terbentuk dari deburan ombak yang tak henti-hentinya.",
   "Jangan takut berjalan lambat, takutlah jika kamu hanya berdiam diri.",
   "Waktu terbaik untuk menanam pohon adalah 20 tahun yang lalu. Waktu terbaik kedua adalah sekarang.",
   "Kesuksesan berawal dari langkah pertama yang berani dan konsistensi yang terjaga.",
   "Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas.",
   "Tantangan adalah apa yang membuat hidup menarik, dan mengatasinya adalah apa yang membuat hidup bermakna.",
   "Masa sulit tidak bertahan selamanya, tetapi orang yang tangguh akan selalu bertahan.",
   "Percayalah pada prosesmu; mutiara berharga butuh waktu dan tekanan untuk tercipta indah.",
   "Jadilah pribadi yang lebih baik dari dirimu yang kemarin, bukan dari orang lain."
  ]
 }
}

const MAP = {}
for (const [key, d] of Object.entries(DATA)) for (const c of d.cmds) {
  if (MAP[c]) throw new Error(`[fun/quotes] command ganda: ${c}`)
  MAP[c] = key
}

let handler = async (m, { command }) => {
  const d = DATA[MAP[String(command || '').toLowerCase()]]
  if (!d) return
  try {
    const q = pick(d.list)
    const body = typeof q === 'string'
      ? `"${q}"`
      : [q.arabic, '', `_${q.arti || q.arti_indonesia || ''}_`, ...(q.latin ? ['', q.latin] : [])].join('\n')
    return m.reply([`${d.emoji} *${d.title}*`, '', body, '', FOOTER].join('\n'))
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Quotes')
  }
}

handler.help = ['quotesbacot', 'quotesbijak', 'quotesbucin', 'quotesgalau', 'quotesgombal', 'quotesheker', 'quotesislami', 'quotesmotivasi']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
