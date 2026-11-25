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
const key = (host, env) => global.APIKeys?.[host] || process.env[env] || ''

const NEOXR = 'https://api.neoxr.eu/api'
const SAD_QUOTES = [
    '🥀 Kadang yang paling menyakitkan adalah berpura-pura baik-baik saja.',
    '🌧️ Tidak semua luka terlihat, tidak semua tangis terdengar.',
    '💔 Beberapa orang hadir hanya untuk menjadi kenangan.',
    '🕊️ Aku belajar melepaskan meski hati belum siap.',
    '🌙 Malam selalu tahu apa yang gagal disembunyikan senyum.',
    '🍂 Yang pergi belum tentu salah, yang bertahan belum tentu bahagia.',
    '🎭 Tersenyum bukan berarti tidak terluka.',
    '☔ Hujan mengajarkan bahwa tidak semua yang jatuh akan kembali.',
    '🫀 Ada rindu yang memilih diam daripada mengganggu.',
    '🌑 Kadang menghilang lebih mudah daripada menjelaskan perasaan.',
    '🍃 Kenangan tidak pernah benar-benar pergi.',
    '🌊 Yang tenggelam bukan tubuhku, melainkan harapanku.',
    '🖤 Beberapa luka hanya bisa disimpan, bukan diceritakan.',
    '✨ Aku baik-baik saja, kata kebohongan yang paling sering diucapkan.',
    '🌹 Cinta yang tulus kadang berakhir dengan perpisahan.'
  ]

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')
const react = async (m, e) => { try { await m.react?.(e) } catch {} }
const getJson = async (url, timeout = 30000) => (await axios.get(url, { timeout })).data
const sendImg = (conn, m, url, caption) => conn.sendMessage(m.chat, { image: typeof url === 'string' ? { url } : url, caption }, { quoted: m })

const E = {}
const add = (key, cmds, title, run) => { E[key] = { cmds, title, run } }

const neoxrText = (path, emoji, title) => async ({ m }) => {
  const r = await getJson(`${NEOXR}/${path}?apikey=${key('https://api.neoxr.eu', 'NEOXR_APIKEY')}`)
  if (!r?.status || !r?.data?.text) throw new Error('Data tidak ditemukan dari API.')
  return m.reply(box(emoji, title, r.data.text))
}

add('quotesimage', ['quotesimage', 'quoteimg', 'quotes-image', 'qimg'], 'Quotes Image', async ({ conn, m }) => {
  const r = await getJson(`${NEOXR}/quotesimage?apikey=${key('https://api.neoxr.eu', 'NEOXR_APIKEY')}`)
  if (!r?.status || !r?.data?.url) throw new Error('Gagal mengambil quotes image.')
  return sendImg(conn, m, r.data.url, `💬 *Quotes Image*\n\n${FOOTER}`)
})
add('senja', ['senja', 'katacinta', 'romanticquotes'], 'Kata Senja', neoxrText('senja', '🌇', 'Kata Senja'))
add('puisi', ['puisi', 'puisiku', 'sajak'], 'Puisi', neoxrText('puisi', '📜', 'Puisi'))
add('fml', ['fuckmylife', 'fml'], 'FML Story', neoxrText('fml', '😩', 'FML Story'))

add('meme', ['meme', 'randommeme', 'memeindonesia'], 'Meme', async ({ conn, m }) => {
  const { data } = await getJson(`${NEOXR}/meme?apikey=${key('https://api.neoxr.eu', 'NEOXR_APIKEY')}`)
  if (!data?.url) throw new Error('Meme tidak ditemukan.')
  return sendImg(conn, m, data.url, `😂 *${data.title || 'Meme'}*\n\n${FOOTER}`)
})

add('lahelu', ['lahelu'], 'Lahelu', async ({ conn, m }) => {
  const res = await getJson(`https://api.cuki.biz.id/api/random/lahelu?apikey=${key('https://api.cuki.biz.id', 'CUKI_APIKEY')}`)
  const it = pick(res.data || [])
  if (!it?.media) throw new Error('Konten tidak ditemukan.')
  const caption = `🤣 *${it.title || 'Lahelu'}*\n\n${FOOTER}`
  if (String(it.media).includes('.mp4')) return conn.sendMessage(m.chat, { video: { url: it.media }, caption }, { quoted: m })
  return sendImg(conn, m, it.media, caption)
})

add('barandom', ['barandom', 'ba'], 'Blue Archive', ({ conn, m }) => sendImg(conn, m, 'https://api.nexray.web.id/random/ba', `🎀 *Random Blue Archive*\n\n${FOOTER}`))

add('cosba', ['cosba', 'cosplayba'], 'Cosplay BA', async ({ conn, m }) => {
  const res = await axios.get('https://api.ryuu-dev.offc.my.id/random/cosplay-ba', { responseType: 'arraybuffer', timeout: 30000 })
  if (!res?.data?.length) throw new Error('API tidak mengembalikan gambar.')
  return sendImg(conn, m, Buffer.from(res.data), `🎀 *Random Blue Archive Cosplay*\n\n${FOOTER}`)
})

add('simi2', ['simi2', 'simisimi2'], 'Simi', async ({ m, text, command, p }) => {
  const t = String(text || '').trim()
  if (!t) return m.reply(usage('🐥', 'Simi', [`♡ ${p}${command} halo`]))
  const r = await getJson(`https://api.nexray.web.id/ai/simisimi?text=${encodeURIComponent(t)}`)
  if (!r?.status) throw new Error('Gagal mendapatkan respon dari Simi.')
  return m.reply(box('🐥', 'Simi', r.result))
})

const fmt = v => (typeof v === 'number' ? v.toLocaleString('id-ID') : (v ?? '-'))
add('lifefact', ['lifefact', 'funfacthidup', 'livefunfact'], 'Fakta Kehidupan', async ({ m, text, command, p }) => {
  const bd = String(text || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) return m.reply(usage('🧬', 'Fakta Kehidupan', ['Masukkan tanggal lahir (YYYY-MM-DD).', '', `♡ ${p}${command} 2002-01-11`]))
  if (Number.isNaN(new Date(`${bd}T00:00:00Z`).getTime())) throw new Error('Tanggal tidak valid.')
  await react(m, '🧬')
  const { result: r, status } = await getJson(`https://api.nexray.web.id/fun/livefunfact?birthdate=${encodeURIComponent(bd)}`, 20000)
  if (!status || !r) throw new Error('Data tidak ditemukan.')
  const L = (k, v, u = '') => `♡ ${k} : ${fmt(v)}${u}`
  return m.reply(box('🧠', 'Fakta Kehidupan', [
    '📅 *Informasi Dasar*', L('Umur', r.basic_info?.age_in_years, ' tahun'), L('Hari hidup', r.basic_info?.age_in_days, ' hari'), L('Jam hidup', r.basic_info?.age_in_hours, ' jam'), L('Menit hidup', r.basic_info?.age_in_minutes, ' menit'), L('Detik hidup', r.basic_info?.age_in_seconds, ' detik'), '',
    '❤️ *Sistem Kardiovaskular*', L('Total detak jantung', r.cardiovascular?.heart_beats_total), L('Darah dipompa', r.cardiovascular?.blood_pumped_l, ' liter'), L('Jarak aliran darah', r.cardiovascular?.blood_distance_km, ' km'), '',
    '🫁 *Sistem Pernapasan*', L('Total napas', r.respiratory?.total_breaths), L('Oksigen dikonsumsi', r.respiratory?.oxygen_consumed_l, ' liter'), L('CO₂ dihasilkan', r.respiratory?.co2_produced_l, ' liter'), '',
    '🧠 *Saraf & Otak*', L('Aktivitas saraf', r.neurological?.action_potentials), L('Transmisi sinaps', r.neurological?.synaptic_transmissions), L('Energi otak', r.neurological?.brain_energy_consumed_kj, ' kJ'), '',
    '🔥 *Metabolisme*', L('Kalori terbakar', r.metabolic_summary?.total_calories_burned, ' kcal'), L('Energi dihasilkan', r.metabolic_summary?.energy_produced_kj, ' kJ'), L('Air diproses', r.metabolic_summary?.water_processed_l, ' liter'), '',
    '✨ *Fakta Menakjubkan*', L('Total sel tubuh', r.amazing_facts?.total_body_cells), L('Panjang DNA', r.amazing_facts?.total_dna_length_km, ' km'), L('Panjang pembuluh darah', r.amazing_facts?.blood_vessel_length_km, ' km'), L('Kekuatan tulang', r.amazing_facts?.bone_strength_psi, ' PSI'), '',
    '🌍 *Perbandingan Kehidupan*', L('Harapan hidup dunia', r.life_comparison?.world_life_expectancy, ' tahun'), L('Hidup dijalani', r.life_comparison?.percentage_of_life_lived, '%'), L('Estimasi sisa umur', r.life_comparison?.estimated_remaining_years, ' tahun'), L('Kondisi biologis', r.life_comparison?.biological_systems_optimal)
  ].join('\n'), `_${r.medical_disclaimer || 'Hanya hiburan, bukan saran medis.'}_`))
})

add('superhero', ['superhero', 'hero', 'pahlawan'], 'Superhero', async ({ conn, m, text, command, p }) => {
  const q = String(text || '').trim()
  if (!q) return m.reply(usage('🦸', 'Superhero', ['Masukkan nama superhero.', '', `♡ ${p}${command} batman`]))
  const apiKey = key('https://api.lolhuman.xyz', 'LOLHUMAN_APIKEY')
  if (!apiKey) throw new Error('API key lolhuman belum diisi (LOLHUMAN_APIKEY).')
  const res = await axios.get(`https://api.lolhuman.xyz/api/superhero?apikey=${apiKey}&query=${encodeURIComponent(q)}`, { timeout: 30000 })
  if (res.data?.status !== 200 || !res.data?.result) throw new Error('Superhero tidak ditemukan.')
  const h = res.data.result, st = h.powerstats || {}, bio = h.biography || {}, ap = h.appearance || {}, wk = h.work || {}
  const j = a => (Array.isArray(a) ? a.join(' / ') : '-')
  const body = [
    '👤 *Identitas*', `♡ Nama : ${h.name || '-'}`, `♡ Nama asli : ${bio['full-name'] || '-'}`, `♡ Alignment : ${bio.alignment || '-'}`, `♡ Publisher : ${bio.publisher || '-'}`, '',
    '⚡ *Power Stats*', `♡ Intelligence : ${st.intelligence || '-'}`, `♡ Strength : ${st.strength || '-'}`, `♡ Speed : ${st.speed || '-'}`, `♡ Durability : ${st.durability || '-'}`, `♡ Power : ${st.power || '-'}`, `♡ Combat : ${st.combat || '-'}`, '',
    '📊 *Penampilan*', `♡ Gender : ${ap.gender || '-'}`, `♡ Ras : ${ap.race || '-'}`, `♡ Tinggi : ${j(ap.height)}`, `♡ Berat : ${j(ap.weight)}`, `♡ Mata : ${ap['eye-color'] || '-'}`, `♡ Rambut : ${ap['hair-color'] || '-'}`,
    ...(bio.aliases?.length ? ['', '🎭 *Alias*', bio.aliases.slice(0, 5).join(', ')] : []), '',
    '💼 *Pekerjaan*', `♡ Pekerjaan : ${wk.occupation || '-'}`, `♡ Markas : ${wk.base || '-'}`
  ].join('\n')
  const caption = box('🦸', 'Superhero Info', body)
  if (h.image?.url) return sendImg(conn, m, h.image.url, caption)
  return m.reply(caption)
})

add('ppcouple', ['ppcouple', 'cp', 'ppcp'], 'PP Couple', async ({ conn, m }) => {
  const { result: d } = await getJson('https://api.deline.web.id/random/ppcouple')
  if (!d?.cowo || !d?.cewe) throw new Error('Data PP couple tidak ditemukan.')
  await sendImg(conn, m, d.cowo, `👦 *PP Couple (Cowok)*\n\n${FOOTER}`)
  return sendImg(conn, m, d.cewe, `👧 *PP Couple (Cewek)*\n\n${FOOTER}`)
})

add('artinama2', ['artinama2'], 'Arti Nama', async ({ m, text, command, p }) => {
  const nama = String(text || '').trim()
  if (!nama) return m.reply(usage('📛', 'Arti Nama', ['Namanya siapa?', '', `♡ ${p}${command} Budi`]))
  const { data: html } = await axios.post('http://www.primbon.com/arti_nama.php', new URLSearchParams({ nama1: nama, proses: ' Submit! ' }).toString(), { headers: { 'content-type': 'application/x-www-form-urlencoded' }, timeout: 20000 })
  const $ = cheerio.load(html)
  const y = $.html().split('arti:')[1]
  if (!y) throw new Error('Arti nama tidak ditemukan.')
  const t = y.split('method="get">')[1]
  const f = t ? y.replace(t, ' ') : y
  const out = f.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').trim()
  return m.reply(box('📛', 'Arti Nama', `♡ Nama : ${nama}\n\n${out}`))
})

add('fakepilih', ['fakepilih'], 'Fake Pilih', async ({ conn, m, text, command, p }) => {
  const [a, b] = String(text || '').split(',').map(s => s?.trim())
  if (!a || !b) return m.reply(usage('🎧', 'Fake Pilih', ['Tulis dua pilihan dipisah koma.', '', `♡ ${p}${command} Messi,Ronaldo`]))
  await react(m, '⏳')
  return sendImg(conn, m, `https://api.synoxcloud.biz.id/canvas/drakehotline?teks1=${encodeURIComponent(a)}&teks2=${encodeURIComponent(b)}`, `🎧 *Fake Pilih*\n\n${FOOTER}`)
})

add('sad', ['sad'], 'Sad Music', async ({ conn, m, text, command, p }) => {
  const n = parseInt(String(text || '').trim(), 10)
  if (isNaN(n) || n < 1 || n > 34) return m.reply(usage('🎧', 'Sad Music', ['Masukkan nomor 1 sampai 34.', '', `♡ ${p}${command} 2`]))
  const quote = pick(SAD_QUOTES)
  const res = await axios.get(`https://github.com/Rangelofficial/Sad-Music/raw/main/audio-sad/sad${n}.mp3`, { responseType: 'arraybuffer', timeout: 60000 })
  await m.reply(box('🎧', `Sad Music #${n}`, quote))
  return conn.sendMessage(m.chat, { audio: Buffer.from(res.data), mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
})

const MAP = {}
for (const [k, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/api] command ganda: ${c}`)
  MAP[c] = k
}

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const cmd = String(command || '').toLowerCase()
  const k = MAP[cmd]
  if (!k) return
  try {
    await react(m, '🕕')
    const r = await E[k].run({ conn, m, text, command: cmd, p })
    await react(m, '✅')
    return r
  } catch (e) {
    await react(m, '❌')
    return m.gagal(e?.response?.data?.message || e?.message || String(e), E[k].title)
  }
}

handler.help = ['quotesimage', 'senja', 'puisi', 'fml', 'meme', 'lahelu', 'barandom', 'cosba', 'simi2 <teks>', 'lifefact <yyyy-mm-dd>', 'superhero <nama>', 'ppcouple', 'artinama2 <nama>', 'fakepilih a,b', 'sad <1-34>']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
