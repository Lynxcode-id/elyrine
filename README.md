<div align="center">

# 🌱 ERINE-AI • ELYRINE

**Bot WhatsApp Multi-Device berbasis Node.js (ESM) dengan engine `elyra-baileys`.**
Ringan, rapi, penuh fitur: AI, downloader, sticker & maker, grup, sistem limit/premium, sampai manajemen saluran.

[![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Engine](https://img.shields.io/badge/engine-elyra--baileys-7c4dff?style=for-the-badge)](https://github.com/Lynxcode-id/elyra-baileys)
[![License](https://img.shields.io/badge/license-Source--Available%20Non--Commercial-orange?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-ff69b4?style=for-the-badge)](package.json)
[![Platform](https://img.shields.io/badge/WhatsApp-Multi--Device-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](#)

[✨ Fitur](#-fitur-unggulan) ·
[📜 Perintah](#-daftar-perintah) ·
[🚀 Instalasi](#-instalasi-cepat) ·
[⚙️ Konfigurasi](#️-konfigurasi) ·
[🧩 Plugin](#-membuat-plugin) ·
[🤝 Kontributor](#-kontributor--kredit) ·
[📄 Lisensi](#-lisensi)

</div>

---

## 📌 Sekilas

| | |
|---|---|
| **Nama project** | ERINE-AI • ELYRINE |
| **Platform** | WhatsApp Multi-Device |
| **Runtime** | Node.js ≥ 20 (ES Modules) |
| **Engine** | [`elyra-baileys`](https://github.com/Lynxcode-id/elyra-baileys) (fork Baileys milik Elyra Labs) |
| **Penyimpanan sesi** | SQLite (`better-sqlite3`), data bot di database JSON (`lowdb`) |
| **Plugin** | 150+ plugin dalam 23 folder, plus 7 plugin sistem otomatis |
| **Developer** | Arman Maulana (Lynx decode) |
| **Komunitas** | General District (induk) · INF Project · Elyra Labs |
| **Lisensi** | ELYRINE Source-Available Non-Commercial v1.0 |

---

## ✨ Fitur unggulan

<table>
<tr>
<td width="50%" valign="top">

### 🤖 AI & Pencarian
- Tanya **ChatGPT** dan **Claude** langsung dari chat
- Cari lagu: YouTube, Spotify, Apple Music, SoundCloud
- Lirik lagu (biasa & Spotify), pencarian TikTok, Pinterest
- Chat santai dengan mode **Simi** per grup

### 📥 Downloader
- TikTok, Instagram, Facebook, Pinterest, CapCut, YouTube MP3
- `.play` lagu, dan `.playch` untuk memutar ke **saluran** WhatsApp

### 🎨 Sticker & Maker
- Sticker dari gambar/video, brat (teks, video, 3 baris), smeme, watermark sticker
- Maker gambar: fake call (iOS/Android), fake grup chat, fake notif, fake OVO, IG/iOS quote, meme Drake & Jarvis, dan lainnya

### 🖼️ Pengolah Gambar & Video
- HD upscale, Remini (foto & video), BigJPG, Nano Banana, hapus background

</td>
<td width="50%" valign="top">

### 👥 Manajemen Grup
- Add, kick, promote, demote, tagall, hidetag, link, revoke, ganti nama/foto grup
- Buka/tutup grup, info grup, cek ID grup & saluran

### 💎 Sistem Tier & Limit
- Tier **Free / Premium / VIP / Owner** dengan kuota harian berbeda
- Sistem **expired** otomatis untuk premium, VIP, dan sewa grup
- Level & XP, registrasi pengguna, klaim limit

### 🛠️ Kendali Owner
- Tambah/hapus **plugin, lib, scrape** langsung dari chat (tanpa restart)
- Prefix dinamis dan mode **no-prefix**
- Broadcast, ban/unban, blocklist, sinkronisasi database, restart
- Buat server **Pterodactyl** lewat perintah

### 🛡️ Stabil & Hemat
- Perbaikan **Bad MAC**, auto-reconnect dengan backoff + jitter
- Lock sesi supaya tidak ada proses ganda
- Batas heap otomatis menyesuaikan RAM
- Respons tombol (button/list/native flow) dibaca sebagai perintah

</td>
</tr>
</table>

---

## 📜 Daftar perintah

> Contoh memakai prefix `.` — prefix bisa diganti (lihat [Prefix & no-prefix](#-prefix--no-prefix)).
> Ketik `.menu` di bot untuk menu interaktif, atau `.totalfitur` untuk jumlah fitur yang aktif.

<details>
<summary><b>🏠 Utama</b> — menu, akun, level</summary>

| Perintah | Fungsi |
|---|---|
| `.menu` / `.help` | Menu utama interaktif |
| `.daftar` / `.unreg` | Daftar / batalkan registrasi |
| `.levelup` | Naik level |
| `.claimlimit` | Klaim limit |
| `.afk [alasan]` | Tandai diri sedang AFK |
| `.owner` / `.creator` | Kontak owner |
| `.premium` | Info paket premium & donasi |
| `.ceksn` | Cek serial number |

</details>

<details>
<summary><b>ℹ️ Info</b> — status & informasi bot</summary>

| Perintah | Fungsi |
|---|---|
| `.ping` / `.ping2` | Cek kecepatan respons |
| `.speedtest` | Tes kecepatan internet server |
| `.limitstatus` | Lihat sisa limit & tier |
| `.sholat` | Jadwal sholat |
| `.sc` / `.sizesc` | Info script & ukuran |
| `.totalfitur` | Jumlah fitur |
| `.credits` | Daftar kredit & kontributor |
| `.report` | Lapor bug ke owner |

</details>

<details>
<summary><b>🤖 AI</b></summary>

| Perintah | Fungsi |
|---|---|
| `.chatgpt <pertanyaan>` | Tanya ChatGPT |
| `.claude <pertanyaan>` | Tanya Claude |

</details>

<details>
<summary><b>📥 Downloader</b></summary>

| Perintah | Fungsi |
|---|---|
| `.tiktok <link>` | Unduh video TikTok |
| `.ig <link>` | Unduh dari Instagram |
| `.fb <link>` | Unduh dari Facebook |
| `.pindl <url>` | Unduh dari Pinterest |
| `.capcutdl <url>` | Unduh template CapCut |
| `.ytmp3 <link>` | YouTube ke MP3 |

</details>

<details>
<summary><b>🎵 Musik & Pencarian</b></summary>

| Perintah | Fungsi |
|---|---|
| `.play <judul/link>` | Putar & kirim lagu |
| `.playch <judul/link> \| <nomor/owner/idch>` | Kirim lagu ke saluran |
| `.yts <kata kunci>` | Cari video YouTube |
| `.spotifys <query>` | Cari lagu Spotify |
| `.applemusic <query>` | Cari lagu Apple Music |
| `.soundclouds <query>` | Cari di SoundCloud |
| `.lyrics <judul>` / `.spotifylyrics <judul>` | Lirik lagu |
| `.ttsearch <query>` | Cari video TikTok |
| `.pins <query>` | Cari gambar Pinterest |

</details>

<details>
<summary><b>🎨 Sticker</b></summary>

| Perintah | Fungsi |
|---|---|
| `.s` | Gambar/video jadi sticker |
| `.brat <teks>` · `.bratvid <teks>` · `.bratvid2 <teks>` | Sticker brat (gambar & animasi) |
| `.brat3 <atas \| tengah \| bawah>` | Brat tiga baris |
| `.smeme <atas>\|<bawah>` | Sticker meme |
| `.swm <packname>\|<author>` | Ganti watermark sticker |
| `.toimg` · `.tovideo` | Sticker ke gambar / video |

</details>

<details>
<summary><b>🖼️ Gambar & Video</b></summary>

| Perintah | Fungsi |
|---|---|
| `.hd` | Perjelas gambar |
| `.remini` · `.reminivideo` | Enhance foto / video |
| `.bigjpg [style]` | Upscale gambar |
| `.nanobanana <prompt>` | Edit/upscale gambar dengan prompt |
| `.removebg` | Hapus background |
| `.tomp3` | Video/voice note ke audio |

</details>

<details>
<summary><b>🎭 Maker</b></summary>

`.fakecall` · `.fakecall2` · `.fakegc` · `.fakeffduo` · `.fakenotif` · `.fakeovo` · `.igqc` · `.iqc` · `.drake` · `.jarvismeme` · `.twobuttons` · `.windows`

</details>

<details>
<summary><b>👥 Grup</b> (admin grup)</summary>

| Perintah | Fungsi |
|---|---|
| `.add` · `.kick` | Tambah / keluarkan anggota |
| `.promote` · `.demote` | Jadikan / cabut admin |
| `.group open/close` | Buka / tutup grup |
| `.tagall` · `.hidetag` · `.tagme` | Mention anggota |
| `.link` · `.linkgc` · `.revoke` | Tautan undangan |
| `.setgcname` · `.setppgc` | Nama & foto grup |
| `.infogrup` · `.cekidgc` · `.cekidch` | Info & ID |
| `.delete` | Hapus pesan |
| `.enable` / `.disable` | Atur fitur grup (mis. Simi) |

</details>

<details>
<summary><b>⏳ Expired & Sewa</b></summary>

| Perintah | Fungsi |
|---|---|
| `.addsewa <waktu>` | Pasang masa sewa bot di grup |
| `.cekexpired` | Cek sisa waktu |
| `.delexpired` | Hapus masa sewa |

Saat waktu habis, bot otomatis keluar dari grup.

</details>

<details>
<summary><b>🛠️ Tools & Lainnya</b></summary>

| Perintah | Fungsi |
|---|---|
| `.ip <alamat>` | Info IP |
| `.readmore` | Teks "baca selengkapnya" |
| `.read` | Baca pesan sekali-lihat |
| `.tempmail` | Email sementara |
| `.setcmd` · `.delcmd` · `.listcmd` · `.lockcmd` | Ikat perintah ke sticker |
| `.amprem` · `.netflix` · `.viu` | Layanan premium |
| `.broadcast` · `.bcgc` · `.broadcastchats` | Broadcast (owner) |

</details>

<details>
<summary><b>👑 Owner</b> — kendali penuh (54 perintah)</summary>

| Kelompok | Perintah |
|---|---|
| **Plugin & kode** | `.addplugin` `.delplugin` `.listplugin` `.getplugin` `.addlib` `.dellib` `.addscrape` `.delscrape` `.listscrape` `.addfile` `.getfile` `.df` `.sf` |
| **Pengguna** | `.addprem` `.delprem` `.listprem` `.addvip` `.delvip` `.listvip` `.ban` `.unban` `.deluser` `.blocklist` |
| **Chat & grup** | `.banchat` `.unbanchat` `.join` `.leavegc` `.kick` `.o-tagall` `.clearchat` |
| **Prefix & limit** | `.addprefix` `.delprefix` `.listprefix` `.noprefix` `.limitsystem on/off` |
| **Saluran** | `.addsaluran` `.delsaluran` `.listsaluran` `.msgch` |
| **Tampilan bot** | `.setpp` `.addthumb` `.changethumb` `.delthumb` `.setaudiomenu` `.delaudiomenu` |
| **Sistem** | `.restart` `.syncdb` `.getdb` `.getsessi` `.fixsession` `.cleartmp` `.simulate` `.inspect` |
| **Panel** | `.createpanel <nomor> <ramGB> <diskGB> <cpu%> <hari>` · `.cekpanel` |
| **Eksekusi** | `>` dan `=>` (JavaScript), plus shell |

</details>

> 💡 Tidak semua perintah tampil di sini. Daftar terbaru selalu ada di `.menu` dan `.listplugin`.

---

## 💎 Tier & limit

| Tier | Kuota default / hari |
|---|---|
| 👤 Free | 15 |
| 💎 Premium | 100 |
| 👑 VIP | 500 |
| 🛡️ Owner | Tanpa batas |

- Limit direset setiap hari (zona waktu WITA).
- Premium dan VIP punya masa aktif; saat habis, status turun otomatis dan pengguna diberi tahu.
- Owner bisa mematikan seluruh sistem lewat `.limitsystem off`.
- Cek sisa kuota kapan saja dengan `.limitstatus`.

## 🔣 Prefix & no-prefix

Bot menerima banyak prefix bawaan (`. ! # / $ + ...`). Owner bisa mengaturnya langsung:

```text
.addprefix >        tambah prefix
.delprefix >        hapus prefix
.listprefix         lihat semua prefix aktif
.noprefix owner     perintah tanpa prefix khusus owner
.noprefix all       tanpa prefix untuk semua orang
.noprefix off       kembali normal
```

Pengaturan tersimpan di database, jadi tetap ada setelah restart.

---

## 🚀 Instalasi cepat

**Kebutuhan:** Node.js 20 atau lebih baru, `git`, dan koneksi internet. FFmpeg ikut terpasang lewat dependency.

```bash
# 1. Ambil kode
git clone https://github.com/Lynx-decode/ERINE-AI.git
cd ERINE-AI

# 2. Pasang dependency
npm install

# 3. Isi config.js (owner, nomor bot, API key) — lihat bagian Konfigurasi

# 4. Jalankan
npm start
```

Saat pertama jalan, bot menampilkan **QR** untuk di-scan. Mau pakai **pairing code**? Isi `global.pairing` di `config.js` dengan nomor bot (format `628xxxx`).

<details>
<summary><b>✅ Checklist sebelum jalan</b></summary>

- [ ] `global.owner` berisi nomor owner kamu
- [ ] `global.nomorbot` & `global.pairing` sesuai nomor bot
- [ ] API key di `global.APIKeys` sudah diisi untuk fitur yang dipakai
- [ ] Jalankan lewat `npm start` atau `node index.js` (jangan `main.js` langsung)
- [ ] Hanya **satu** proses bot per sesi

</details>

<details>
<summary><b>🧪 Perintah npm & opsi jalan</b></summary>

| Perintah | Fungsi |
|---|---|
| `npm start` | Jalankan bot |
| `npm run dev` | Mode pengembangan (nodemon) |
| `npm test` | Cek syntax seluruh file |

| Opsi | Fungsi |
|---|---|
| `BOT_HEAP_MB=384 node index.js` | Atur batas heap V8 manual |
| `BOT_SHARP_THREADS=2 node index.js` | Atur thread pemrosesan gambar |
| `node index.js --insecure-tls` | Matikan verifikasi TLS (hanya jika terpaksa) |

</details>

---

## ⚙️ Konfigurasi

Semua pengaturan ada di `config.js` dan ikut ter-reload otomatis saat file disimpan.

| Pengaturan | Fungsi |
|---|---|
| `global.owner` | Daftar owner `[nomor, nama, true]` |
| `global.nomorbot` · `global.nomorown` | Nomor bot dan owner utama |
| `global.pairing` | Nomor untuk pairing code (kosongkan untuk QR) |
| `global.namebot` · `global.wm` | Nama bot dan watermark |
| `global.sessionId` · `global.sessionDir` | Nama dan folder sesi |
| `global.autoFollowChannel` | Auto-follow saluran bawaan engine (`false` secara default) |
| `global.stickpack` · `global.stickauth` | Nama pack dan author sticker |
| `global.APIs` · `global.APIKeys` | Alamat dan kunci layanan REST API |
| `global.panelCfg` | Pengaturan server Pterodactyl untuk `.createpanel` |
| `global.wait` · `global.eror` · `global.limitHabis` · `global.sukses` | Template pesan respons |
| `global.multiplier` | Pengali XP level |

> 🔐 **Jangan** unggah `config.js` yang sudah berisi API key atau nomor pribadi ke repo publik.

---

## 🗂️ Struktur folder

```text
ERINE-AI/
├── index.js            # launcher: fork worker, restart aman, batas memori
├── main.js             # inisialisasi database, sesi, event
├── handler.js          # pemroses pesan & event grup
├── config.js           # pengaturan bot
├── lib/                # library inti (function, limit, prefix, identity, SQLsessions, ...)
├── plugins/            # perintah, satu folder per kategori
│   └── system/         # plugin otomatis (afk, premium, expired, allfake, ...)
├── scrape/             # scraper & generator gambar
├── src/                # aset gambar
├── font/               # font untuk maker
├── database/           # data bot (termasuk thumbnail custom)
├── LICENSE             # lisensi utama
├── ELYRINE-ADDITIONAL-TERMS.md  # ketentuan tambahan & bukti izin
└── LISENSI             # ringkasan lisensi
```

Folder plugin otomatis menjadi **tag menu** bila plugin belum menulis `handler.tags`.

---

## 🧩 Membuat plugin

Tidak perlu restart. Kirim kode lewat chat sebagai owner:

```text
.addplugin tool|halo          (reply kode, atau tulis kode di baris bawah)
.addplugin owner|cek.js       (".js" otomatis, tidak dobel)
.addplugin tool|halo --force  (timpa yang sudah ada)
```

Syntax dicek dulu, lalu plugin langsung aktif. Pengelolaan lain: `.listplugin [folder]` · `.getplugin folder/nama` · `.delplugin folder|nama`.

Contoh plugin sederhana:

```js
const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Contoh:* ${usedPrefix + command} halo`
  m.reply(`Kamu bilang: ${text}`)
}

handler.help = ['echo <teks>']
handler.tags = ['tools']
handler.command = /^echo$/i

handler.limit = true      // memakai 1 limit
handler.register = true   // wajib terdaftar

export default handler
```

<details>
<summary><b>🏷️ Flag plugin yang tersedia</b></summary>

| Flag | Arti |
|---|---|
| `handler.owner` / `handler.rowner` | Khusus owner / owner utama |
| `handler.group` / `handler.private` | Hanya di grup / chat pribadi |
| `handler.admin` / `handler.botAdmin` | Perlu admin / bot harus admin |
| `handler.premium` | Khusus premium |
| `handler.limit` | Memotong limit |
| `handler.register` | Wajib registrasi |

</details>

---

## 🛡️ Stabilitas

Dibanding base lamanya, ERINE-AI memperbaiki beberapa masalah yang sering bikin sesi rusak:

- **Bad MAC:** restart kini menunggu worker lama benar-benar mati, retry pesan memakai cache pesan, dan `.fixsession` hanya menyentuh berkas sesi yang aman (dengan dry-run dulu).
- **Reconnect:** `autoReconnect` dengan backoff + jitter, plus connection watchdog dan penghitung Bad MAC di log.
- **Lock sesi:** proses kedua ditolak otomatis, jadi tidak ada dua bot satu sesi.
- **Hemat sumber daya:** database ditulis tiap 30 detik, pembersihan hanya menyentuh `./tmp` milik bot, heap V8 menyesuaikan RAM.
- **Keamanan:** verifikasi TLS aktif secara default.

---

## 🤝 Kontributor & kredit

### 👑 Tim ELYRINE

| Peran | Nama |
|---|---|
| Founder / Lead Developer / Maintainer | **Lynx Decode** (Arman Maulana) |
| Kontributor fitur | **Dinda Novelina** |
| Testing, review, quality control | **Elyra Labs Team** |
| Feedback & bug report | Komunitas |
| Induk komunitas | General District |
| Laboratorium pengembangan | Elyra Labs |
| Dukungan komunitas | INF Project |

### 📦 Base script

| Proyek | Pembuat | Lisensi |
|---|---|---|
| [Nao-MD / RyzumiMD-ESM](https://github.com/ShirokamiRyzen/Nao-MD) | Fatih Firdaus (ShirokamiRyzen) | GPL-3.0 |

### ⚙️ Jalur fork Baileys

`Elyra Baileys` → `@vanzxy/baileys` → `@itsliaaa/baileys` → `WhiskeySockets/Baileys`

<details>
<summary><b>Lihat kontributor engine & ekstensi</b></summary>

| Kontributor | Kontribusi |
|---|---|
| WhiskeySockets (Rajeh Taher), adiwajshing, purpshell, jlucaso1 | Baileys asli |
| Lia Wynn / itsliaaa | Autentikasi SQLite, upload media saluran, pesan interaktif, album, Starseal |
| Nixel, Ahmad Tumbuh Kembang, FongsiDev / FgsiDev | MessageBuilder, AIRich, Button, Carousel |
| vinikjkkj | Protokol Zapo, penyesuaian button/list |
| QueenAnya | Button helper, native flow, manajemen username |
| LuferOS | Lineage framework bot |
| innovatorssoft | Rich response, cache manager, kontrol chat |
| JAPofc / J.AP | Auto reconnect, utilitas auth, humanizer, Meta AI, JID tools |
| nexustechpro2 | Dukungan USync tambahan |
| lpzeravk / systemzero | Reconnect backoff, penanganan Bad MAC, watchdog |
| ourin-baileys | VoIP WASM, relay WebRTC, ekstensi saluran |
| rexxhayanasi | Cache metadata grup, utilitas username |
| kangwifi72 | Alasan disconnect, utilitas nomor |
| xbibzlibrary | Utilitas pairing, format teks |
| betton | Upgrade builder |
| WPP Connect | `wa-proto` (Protocol Buffer) |

</details>

<details>
<summary><b>Lihat layanan REST API & uploader</b></summary>

| Layanan | Dipakai untuk |
|---|---|
| Lynx APIs (`lynxapis.my.id`) | Pemrosesan gambar, hapus background, downloader |
| Theresa API (`api.theresav.eu`, oleh Blackrosé) | Pinterest, Spotify, Claude, ChatGPT |
| Ryzumi API (`api.ryzumi.net`, oleh ShirokamiRyzen) | Utilitas, uploader, media |
| NexaDev API | Facebook & CapCut downloader |
| Faa API | Pencarian lirik |
| MyQuran API | Jadwal sholat, kalender Hijriah, kiblat |
| SimSimi | Chat percakapan |
| IPWhois | Informasi IP |
| Noxxyrorr, Emailnator | Verifikasi email, email sementara |
| Nexray | Uploader media |
| TermAI CDN, Catbox, Uguu, TmpFiles, Ryzumi CDN | Hosting file |

Layanan pihak ketiga bisa berubah atau berhenti kapan saja, dan yang memakai autentikasi mengikuti API key masing-masing.

</details>

<details>
<summary><b>Lihat scraper & tool pihak ketiga</b></summary>

| Komponen | Sumber |
|---|---|
| Remini | Razeerh |
| Fake Call & Fake Group Chat | Rin Imup / Princes |
| Brat, Brat Video, Jarvis Meme | Scraper komunitas, disusun ulang Tim Elyrine |
| Emailnator | Adaptasi sistem Elyrine |
| FFmpeg · Sharp · node-webpmux · Starseal | Pemrosesan media & sticker |
| EzEnhancer AI · EZGIF · Fast.com | Layanan eksternal |

Setiap berkas di `scrape/` mempertahankan atribusi pembuat aslinya di bagian header.

</details>

> Ingin lihat daftar kontributor GitHub yang selalu terbaru? Ketik `.credits` di bot.

### 💬 Bergabung & dukung

| | |
|---|---|
| 📢 Saluran pengembangan | [Buka saluran](https://whatsapp.com/channel/0029VbAnuii6GcGCu73oep1i) |
| 💻 Saluran share code | [Buka saluran](https://whatsapp.com/channel/0029VbCUDdOHFxOyVb2Hfe2X) |
| 🌐 Saluran REST API | [Buka saluran](https://whatsapp.com/channel/0029VbCMzVqE50UZAnV44u05) |
| 🐙 Repository | [Lynx-decode/ERINE-AI](https://github.com/Lynx-decode/ERINE-AI) |
| 🐞 Menemukan bug / pelanggaran atribusi | Ketik `.report` di bot atau hubungi owner lewat `.owner` |

Ingin berkontribusi? Fork repo ini, buat perubahan, jalankan `npm test`, lalu kirim pull request. Pertahankan atribusi dan header lisensi yang sudah ada, dan baca [`LICENSE`](LICENSE) dulu.

---

## 📄 Lisensi

Proyek ini memakai **ELYRINE Source-Available Non-Commercial License v1.0** ditambah ketentuan tambahan proyek.

- Teks lengkap: [`LICENSE`](LICENSE)
- Ketentuan tambahan & cara minta izin: [`ELYRINE-ADDITIONAL-TERMS.md`](ELYRINE-ADDITIONAL-TERMS.md)
- Ringkasan: [`LISENSI`](LISENSI)

| | |
|---|---|
| ✅ **Boleh** | Pakai gratis, belajar, modifikasi, dan bagikan gratis dengan kredit utuh |
| 📝 **Wajib izin tertulis** | Jual script atau remake, tarik bayaran untuk akses bot, pakai di produk komersial |
| 🧾 **Remake yang dijual** | Wajib menyertakan **bukti izin** (mis. screenshot chat asli dengan nama/nomor owner, tanggal, dan kalimat izin yang jelas) |
| ⛔ **Dilarang** | Hapus kredit, mengaku buatan sendiri, rebrand seolah karya sendiri |

Setiap remake wajib mencantumkan: *"Berdasarkan ERINE-AI • ELYRINE oleh Arman Maulana (Lynx decode)"*.

Komponen pihak ketiga (Nao-MD, Baileys, MessageBuilder, Starseal, scraper komunitas, dependency npm) tetap mengikuti lisensi dan atribusi pemilik aslinya.

## ⚠️ Disclaimer

ERINE-AI adalah proyek independen dan **tidak berafiliasi** dengan WhatsApp maupun Meta. Layanan API pihak ketiga dapat berubah atau berhenti sewaktu-waktu. Developer tidak bertanggung jawab atas penyalahgunaan bot oleh pengguna. Gunakan dengan bijak dan hormati seluruh kontributor.

<div align="center">

**Dibuat dengan 💚 oleh Lynx Decode · Elyra Labs · INF Project · General District**

</div>
