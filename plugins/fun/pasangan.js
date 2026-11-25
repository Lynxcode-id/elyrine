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
const num = j => String(j || '').split('@')[0].split(':')[0]
const tag = j => '@' + num(j)
const HOUR = 3600000

const ROMANTIC = [
  "Aku bukan pilot, tapi aku bisa buat hatimu terbang tinggi bersamaku 💕",
  "Kamu tau kenapa aku suka hujan? Karena hujan itu seperti kamu, sejuk di hati 🌧️",
  "Kamu adalah alasan kenapa aku senyum tanpa sebab 😊",
  "Kalau kamu bintang, aku mau jadi langit yang selalu nemenin kamu ✨",
  "Aku gak butuh GPS, karena hatiku udah nunjuk ke arahmu 💘",
  "Kamu tau bedanya kamu sama kopi? Kopi bikin melek, kamu bikin aku nggak bisa tidur mikirin kamu ☕",
  "Boleh pinjam hatimu? Janji bakal dijaga selamanya 💖",
  "Kalau cinta itu adalah lagu, kamu adalah melodi terindahnya 🎵",
  "Aku butuh 3 hal: Matahari, Bulan, dan Kamu. Matahari untuk siang, Bulan untuk malam, Kamu untuk selamanya 🌙",
  "Kamu adalah puzzle terakhir yang kubutuhkan untuk melengkapi hidupku 🧩",
]
const CELEB = [
  "Semoga langgeng sampai ke pelaminan! 💍",
  "Dari teman jadi cinta, indahnya! 💕",
  "Love is in the air! 💖",
  "Couple goals detected! 💑",
  "Jangan lupa undang pas nikah ya! 💒",
  "Selamat menempuh hidup berduaan! 🥰",
  "Chemistry-nya kuat banget! 🔥",
  "Match made in heaven! ✨",
]
const REJECT = [
  "Sabar ya, yang lebih baik pasti datang! 🌟",
  "Belum jodoh bukan berarti tidak ada jodoh 💪",
  "Move on! Banyak ikan di laut! 🐟",
  "Yang sabar ya, cinta sejati akan datang 💕",
  "Jangan patah semangat, tetap semangat! 🔥",
  "Penolakan adalah awal dari keberhasilan 💪",
  "Masih banyak kesempatan di luar sana! ✨",
  "Yakin masih ada yang lebih cocok buat kamu! 🌈",
]

if (!global.tembakSessions) global.tembakSessions = {}
if (!global.confessData) global.confessData = new Map()

const box = (emoji, title, body, note) => [`${emoji} *${title}*`, '', body, '', ...(note ? [note, ''] : []), FOOTER].join('\n')
const usage = (emoji, title, lines) => [`${emoji} *${title}*`, '', ...lines, '', FOOTER].join('\n')
const send = (conn, m, text, mentions = []) => conn.sendMessage(m.chat, { text, mentions }, { quoted: m })
const react = async (m, e) => { try { await m.react?.(e) } catch {} }
const U = jid => (global.db.data.users[jid] ||= {})

const targetFrom = (m, text) => {
  if (m.quoted?.sender) return m.quoted.sender
  if (m.mentionedJid?.[0]) return m.mentionedJid[0]
  const n = String(text || '').replace(/[^0-9]/g, '')
  return n.length > 5 && n.length < 20 ? n + '@s.whatsapp.net' : null
}
const botJid = conn => conn.user?.jid || conn.user?.id

const mySession = m => Object.values(global.tembakSessions).find(s => s.target === m.sender && s.chat === m.chat && Date.now() - s.timestamp < HOUR)

async function answer(conn, m, accept, shooter) {
  const shooterJid = shooter || mySession(m)?.shooter
  if (!shooterJid) return m.reply(usage(accept ? '💕' : '💔', accept ? 'Terima' : 'Tolak', ['Belum ada yang menembakmu (atau sudah lewat 1 jam).', '', `♡ Balas pesan tembakan lalu ketik terima / tolak`]))
  if (shooterJid === m.sender) return m.gagal(`Tidak bisa ${accept ? 'menerima' : 'menolak'} diri sendiri!`, accept ? 'Terima' : 'Tolak')
  if (shooterJid === botJid(conn)) return m.gagal('Bot tidak bisa pacaran!', accept ? 'Terima' : 'Tolak')
  const s = U(shooterJid), me = U(m.sender)
  if (s.pasangan !== m.sender && s.tembakTarget !== m.sender) {
    return send(conn, m, box('❌', 'Tidak Menembak', `${tag(shooterJid)} tidak sedang menembakmu.`), [shooterJid])
  }
  const key = `${m.chat}_${m.sender}`
  if (accept) {
    s.pasangan = m.sender; s.jadiPacar = Date.now(); delete s.tembakTarget
    me.pasangan = shooterJid; me.jadiPacar = Date.now()
    s.terimaCount = (s.terimaCount || 0) + 1
    delete global.tembakSessions[key]
    await react(m, '💕')
    const d = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return send(conn, m, box('💕', 'Cie Cie Diterima!', `${tag(m.sender)} dan ${tag(shooterJid)} resmi pacaran\n\n♡ Tanggal : ${d}\n♡ ${pick(CELEB)}\n\nSemoga langgeng dan bahagia 💍`), [m.sender, shooterJid])
  }
  delete s.pasangan; delete s.tembakTarget; delete me.pasangan
  s.ditolakCount = (s.ditolakCount || 0) + 1
  delete global.tembakSessions[key]
  await react(m, '💔')
  return send(conn, m, box('💔', 'Waduh, Yang Sabar Yak', `${tag(m.sender)} menolak ${tag(shooterJid)} sebagai pacarnya\n\n♡ ${pick(REJECT)}\n\nSabar ya, masih banyak yang lain! 😢`), [m.sender, shooterJid])
}

const E = {}
const add = (key, cmds, run) => { E[key] = { cmds, run } }

add('tembak', ['tembak', 'nembak', 'propose'], async ({ conn, m, text, command, p }) => {
  const t = targetFrom(m, text)
  if (!t) return m.reply(usage('💘', 'Tembak', ['Tag orang yang mau kamu tembak.', '', `♡ ${p}${command} @user`, `♡ balas pesannya lalu ${p}${command}`]))
  if (t === m.sender) return m.gagal('Tidak bisa menembak diri sendiri!', 'Tembak')
  if (t === botJid(conn)) return m.gagal('Bot tidak bisa pacaran!', 'Tembak')
  const s = U(m.sender), tg = U(t)
  if (s.pasangan && U(s.pasangan).pasangan === m.sender) {
    return send(conn, m, box('❌', 'Sudah Punya Pasangan', `Pasanganmu: ${tag(s.pasangan)}\nPutus dulu dengan *${p}putus*`), [s.pasangan])
  }
  if (tg.pasangan && tg.pasangan !== m.sender && U(tg.pasangan).pasangan === t) {
    return send(conn, m, box('💔', 'Dia Sudah Pacaran', `Pasangannya: ${tag(tg.pasangan)}`), [tg.pasangan])
  }
  if (tg.tembakTarget === m.sender || tg.pasangan === m.sender) {
    s.pasangan = t; tg.pasangan = m.sender; s.jadiPacar = tg.jadiPacar = Date.now()
    delete tg.tembakTarget
    delete global.tembakSessions[`${m.chat}_${t}`]
    await react(m, '💕')
    return send(conn, m, box('💕', 'Cie Ciee :3', `${tag(m.sender)} dan ${tag(t)} resmi pacaran!\n\nSemoga langgeng yak! 💍`), [m.sender, t])
  }
  s.tembakTarget = t
  s.tembakCount = (s.tembakCount || 0) + 1
  global.tembakSessions[`${m.chat}_${t}`] = { shooter: m.sender, target: t, chat: m.chat, timestamp: Date.now() }
  await react(m, '💘')
  return send(conn, m, box('💘', 'Ada Yang Nembak Nihh', `Hei ${tag(t)}, kamu ditembak oleh ${tag(m.sender)}\n\n♡ ${pick(ROMANTIC)}\n\n⏱️ Berlaku *1 jam* dari sekarang`, `Jawab dengan *${p}terima* atau *${p}tolak*`), [t, m.sender])
})

add('terima', ['terima', 'accept', 'yes'], ({ conn, m }) => answer(conn, m, true, m.quoted?.sender || m.mentionedJid?.[0]))
add('tolak', ['tolak', 'reject', 'no', 'gaktau'], ({ conn, m }) => answer(conn, m, false, m.quoted?.sender || m.mentionedJid?.[0]))

add('putus', ['putus'], async ({ conn, m, p }) => {
  const me = U(m.sender)
  if (!me.pasangan) {
    await react(m, '❌')
    return m.reply(usage('❌', 'Putus', ['Kamu gak punya pacar wehh.', '', `♡ Cari dulu dengan ${p}tembak @tag`]))
  }
  const ex = me.pasangan
  delete me.pasangan
  if (U(ex).pasangan === m.sender) delete U(ex).pasangan
  await react(m, '💔')
  return send(conn, m, box('💔', 'Putus!', `${tag(m.sender)} dan ${tag(ex)} resmi putus!!\n\nSemoga mendapat yang lebih baik 🙏`), [m.sender, ex])
})

add('cekpacar', ['cekpacar', 'pacar', 'gebetan'], async ({ conn, m, text, p }) => {
  const other = targetFrom(m, text)
  const t = other || m.sender
  const nama = other ? tag(t) : 'Kamu'
  const pas = U(t).pasangan
  if (!pas) {
    await react(m, '💔')
    return send(conn, m, box('💔', 'Status Hubungan', `*${nama}* tidak punya pasangan.`, `♡ Cari pasangan dengan ${p}tembak @tag`), other ? [t] : [])
  }
  if (U(pas).pasangan === t) {
    await react(m, '💕')
    return send(conn, m, box('💕', 'Status Hubungan', `*${nama}* sedang pacaran dengan ${tag(pas)}! 🥳`), [t, pas])
  }
  await react(m, '💭')
  return send(conn, m, box('💭', 'Status Hubungan', `*${nama}* lagi pdkt sama ${tag(pas)}\n♡ Status : *Digantung* 😅\n\nMenunggu jawaban...`), [t, pas])
})

add('addpasangan', ['addpasangan'], async ({ conn, m, text, command, p, isOwner }) => {
  if (!isOwner) return m.gagal('Fitur ini khusus owner.', 'Add Pasangan')
  let a = null, b = null
  if ((m.mentionedJid || []).length >= 2) [a, b] = m.mentionedJid
  else if (m.quoted && text) { const n = text.replace(/[^0-9]/g, ''); if (n) { a = m.quoted.sender; b = n + '@s.whatsapp.net' } }
  else if (text) { const ns = text.split(/\s+/).map(v => v.replace(/[^0-9]/g, '')).filter(Boolean); if (ns.length >= 2) { a = ns[0] + '@s.whatsapp.net'; b = ns[1] + '@s.whatsapp.net' } }
  if (!a || !b) return m.reply(usage('💞', 'Add Pasangan', [`♡ ${p}${command} @user1 @user2`, `♡ ${p}${command} 628xxx 628yyy`, `♡ balas salah satu user lalu ${p}${command} 628xxx`]))
  if (a === b) return m.gagal('Tidak bisa memasangkan user yang sama.', 'Add Pasangan')
  if (a === botJid(conn) || b === botJid(conn)) return m.gagal('Bot tidak bisa dijadikan pasangan.', 'Add Pasangan')
  for (const x of [a, b]) { const old = U(x).pasangan; if (old && U(old).pasangan === x) delete U(old).pasangan }
  U(a).pasangan = b; U(b).pasangan = a
  U(a).jadiPacar = U(b).jadiPacar = Date.now()
  delete U(a).tembakTarget; delete U(b).tembakTarget
  return send(conn, m, box('💞', 'Pasangan Ditambahkan', `${tag(a)} ❤ ${tag(b)}\n\nResmi dipasangkan oleh Owner.`), [a, b])
})

add('putuspasangan', ['putuspasangan', 'delpasangan'], async ({ conn, m, text, command, p, isOwner }) => {
  if (!isOwner) return m.gagal('Fitur ini khusus owner.', 'Putus Pasangan')
  const t = targetFrom(m, text)
  if (!t) return m.reply(usage('💔', 'Putus Pasangan', [`♡ ${p}${command} @user`, `♡ ${p}${command} 628xxx`]))
  const pas = U(t).pasangan
  if (!pas) return m.gagal('User tersebut tidak memiliki pasangan.', 'Putus Pasangan')
  delete U(t).pasangan
  if (U(pas).pasangan === t) delete U(pas).pasangan
  return send(conn, m, box('💔', 'Pasangan Diputuskan', `${tag(t)} 💔 ${tag(pas)}\n\nHubungan mereka diputuskan oleh Owner.`), [t, pas])
})

add('confess', ['confess', 'confession', 'menfess', 'anonim'], async ({ conn, m, text, command, p }) => {
  const input = String(text || '').trim()
  if (!input.includes('|')) {
    return m.reply(usage('💌', 'Menfess Anonim', ['Kirim pesan rahasia tanpa ketahuan.', '', `♡ ${p}${command} nomor|pesan`, `♡ ${p}${command} 6281234567890|Hai, aku suka senyum kamu!`, '', '_Identitas pengirim dirahasiakan._']))
  }
  const [raw, ...parts] = input.split('|')
  const message = parts.join('|').trim()
  let n = raw.trim().replace(/[^0-9]/g, '')
  if (n.startsWith('0')) n = '62' + n.slice(1)
  if (n.length < 10 || n.length > 15) return m.gagal('Nomor tujuan tidak valid.', 'Menfess')
  if (n === num(m.sender)) return m.gagal('Masa ngirim menfess buat diri sendiri? Kasih ke orang lain dong!', 'Menfess')
  if (message.length < 5) return m.gagal('Pesan terlalu pendek, minimal 5 karakter.', 'Menfess')
  if (message.length > 1000) return m.gagal('Pesan terlalu panjang, maksimal 1000 karakter.', 'Menfess')
  try {
    const [on] = await conn.onWhatsApp(n)
    if (!on?.exists) return m.gagal(`Nomor ${n} tidak terdaftar di WhatsApp.`, 'Menfess')
  } catch {}
  const jid = n + '@s.whatsapp.net'
  const sent = await conn.sendMessage(jid, { text: box('💌', 'Ada Pesan Rahasia Buat Kamu!', `Seseorang diam-diam mengirim pesan:\n\n\`\`\`${message}\`\`\``, '_Pesan ini dikirim anonim, identitas pengirim dirahasiakan._') })
  if (sent?.key?.id) global.confessData.set(sent.key.id, { senderJid: m.sender, senderChat: m.chat, targetJid: jid, createdAt: Date.now() })
  return m.reply(box('✅', 'Menfess Terkirim', `Pesanmu sudah dikirim ke ${n} secara anonim.`))
})

const MAP = {}
for (const [key, e] of Object.entries(E)) for (const c of e.cmds) {
  if (MAP[c]) throw new Error(`[fun/pasangan] command ganda: ${c}`)
  MAP[c] = key
}

let handler = async (m, { conn, text, command, usedPrefix: p = '.', isOwner }) => {
  const cmd = String(command || '').toLowerCase()
  const key = MAP[cmd]
  if (!key) return
  try {
    return await E[key].run({ conn, m, text, command: cmd, p, isOwner })
  } catch (e) {
    return m.gagal(e?.message || String(e), 'Pasangan')
  }
}

handler.before = async function (m) {
  const t = String(m.text || '').trim().toLowerCase()
  if ((t !== 'terima' && t !== 'tolak') || !m.quoted || !m.isGroup) return
  if (!mySession(m)) return
  await answer(this, m, t === 'terima', mySession(m).shooter)
  return true
}

handler.help = ['tembak @user', 'terima', 'tolak', 'putus', 'cekpacar', 'confess nomor|pesan']
handler.tags = ['fun']
handler.command = new RegExp('^(' + Object.keys(MAP).join('|') + ')$', 'i')
handler.register = true

export default handler
