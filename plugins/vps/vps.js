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

import * as V from '../../lib/vps.js'

const ACTIONS = {
    turnon: { type: 'power_on', icon: '🟢', label: 'MENYALAKAN' },
    turnoff: { type: 'power_off', icon: '🔴', label: 'MEMATIKAN' },
    restartvps: { type: 'reboot', icon: '🔄', label: 'ME-RESTART' },
    rebootvps: { type: 'reboot', icon: '🔄', label: 'ME-RESTART' }
}
const CEK = ['cekvps', 'cekdroplet', 'infovps', 'vpsstatus']
const LIST = ['listvps', 'listdroplet', 'vpslist']
const DEL = ['delvps', 'deldroplet', 'deletevps']
const SISA = ['sisavps', 'sisadroplet', 'vpsquota']
const busy = new Set()

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    const c = command.toLowerCase()
    const token = await V.guard(m, isOwner, usedPrefix)
    if (!token) return
    const arg = String(text || '').trim()
    const idFormat = () => m.reply(`☾ ${V.B('FORMAT')}\n${usedPrefix}${command} <droplet_id>\n${CEK.includes(c) ? `Contoh : ${usedPrefix}${command} 123456789\n` : ''}\nLihat ID lewat ${usedPrefix}listvps`)

    if (CEK.includes(c)) {
        if (!V.validId(arg)) return idFormat()
        const r = await V.call(token, 'GET', `/droplets/${arg}`)
        if (!r.ok) return m.reply(V.errText(usedPrefix, command, r))
        const d = r.data.droplet
        return m.reply([
            `☾ ${V.B('DETAIL VPS')}`, V.LINE,
            `ID     : ${d.id}`, `Nama   : ${d.name}`,
            `Status : ${d.status === 'active' ? '🟢 Active' : '🔴 ' + d.status}`,
            `IPv4   : ${V.publicIp(d)}`, `IPv6   : ${V.publicIp(d, 'v6')}`, V.LINE,
            `RAM    : ${d.memory} MB`, `CPU    : ${d.vcpus} vCPU`, `Disk   : ${d.disk} GB`,
            `Region : ${d.region?.name || d.region?.slug || '-'}`,
            `OS     : ${[d.image?.distribution, d.image?.name].filter(Boolean).join(' ') || '-'}`, V.LINE,
            `Dibuat : ${V.fmtDate(d.created_at)}`
        ].join('\n'))
    }

    if (LIST.includes(c)) {
        const r = await V.call(token, 'GET', '/droplets?per_page=100')
        if (!r.ok) return m.reply(V.errText(usedPrefix, command, r))
        const list = r.data.droplets || []
        if (!list.length) return m.reply(`☾ ${V.B('LIST VPS')}\n${V.LINE}\nBelum ada VPS.`)
        const rows = list.map(d => [
            `${d.status === 'active' ? '🟢' : '🔴'} ${V.B(d.name)}`,
            `ID     : ${d.id}`,
            `IP     : ${V.publicIp(d)}`,
            `Spek   : ${d.memory} MB • ${d.vcpus} vCPU • ${d.disk} GB`,
            `Region : ${d.region?.slug || '-'}`
        ].join('\n'))
        return m.reply([`☾ ${V.B('LIST VPS DIGITALOCEAN')}`, `Total : ${list.length} droplet`, V.LINE, rows.join('\n\n')].join('\n'))
    }

    if (DEL.includes(c)) {
        if (!V.validId(arg)) return idFormat()
        const r = await V.call(token, 'DELETE', `/droplets/${arg}`)
        if (!r.ok) return m.reply(V.errText(usedPrefix, command, r))
        return m.reply(`☾ ${V.B('VPS DIHAPUS')}\n${V.LINE}\nID : ${arg}\nVPS beserta datanya sudah dihapus permanen.`)
    }

    if (SISA.includes(c)) {
        const [acc, drops] = await Promise.all([V.call(token, 'GET', '/account'), V.call(token, 'GET', '/droplets?per_page=1')])
        if (!acc.ok) return m.reply(V.errText(usedPrefix, command, acc))
        if (!drops.ok) return m.reply(V.errText(usedPrefix, command, drops))
        const a = acc.data.account
        const used = drops.data.meta?.total ?? (drops.data.droplets || []).length
        return m.reply([
            `☾ ${V.B('KUOTA DIGITALOCEAN')}`, V.LINE,
            `Limit    : ${a.droplet_limit} droplet`, `Terpakai : ${used} droplet`, `Sisa     : ${Math.max(0, a.droplet_limit - used)} droplet`, V.LINE,
            `Email  : ${a.email}`, `Status : ${a.status}`
        ].join('\n'))
    }

    if (ACTIONS[c]) {
        if (!V.validId(arg)) return idFormat()
        const act = ACTIONS[c]
        const r = await V.call(token, 'POST', `/droplets/${arg}/actions`, { type: act.type })
        if (!r.ok) return m.reply(V.errText(usedPrefix, command, r))
        return m.reply(`☾ ${V.B('AKSI DIKIRIM')}\n${V.LINE}\n${act.icon} ${act.label} VPS\nID     : ${arg}\nStatus : ${r.data.action?.status || 'in-progress'}`)
    }

    const plans = V.plans()
    const spec = plans[c]
    const hostname = arg.split(/\s+/)[0]
    if (!spec || !hostname) {
        return m.reply([
            `☾ ${V.B('FORMAT')}`, `${usedPrefix}<paket> <hostname>`, `Contoh : ${usedPrefix}${Object.keys(plans)[0]} myserver`, '',
            V.B('Paket tersedia'),
            ...Object.entries(plans).map(([k, s]) => `• ${usedPrefix}${k} — ${s.ram} RAM, ${s.cpu}`)
        ].join('\n'))
    }
    if (!/^[a-zA-Z0-9-]{1,63}$/.test(hostname)) return m.reply('Hostname hanya boleh huruf, angka, dan minus (maks 63 karakter).')
    const key = hostname.toLowerCase()
    if (busy.has(key)) return m.reply('VPS dengan hostname itu sedang dibuat.')
    busy.add(key)

    try {
        const password = V.genPassword()
        const d = V.cfg()
        const region = d.region || 'sgp1'
        await m.reply(`☾ ${V.B('MEMBUAT VPS')}\n${V.LINE}\nHostname : ${hostname}\nSpek     : ${spec.ram} RAM, ${spec.cpu}\nRegion   : ${region}`)

        const created = await V.call(token, 'POST', '/droplets', {
            name: hostname, region, size: spec.size, image: d.image || 'ubuntu-22-04-x64',
            backups: false, ipv6: true, tags: d.tags || ['elyrine-bot'],
            user_data: `#cloud-config\npassword: ${password}\nchpasswd: { expire: False }\nssh_pwauth: True`
        })
        if (!created.ok) return m.reply(V.errText(usedPrefix, command, created))

        const id = created.data.droplet.id
        await m.reply(`☾ ${V.B('MENUNGGU VPS SIAP')}\n${V.LINE}\nID : ${id}\nEstimasi sekitar 1 menit.`)

        let info = null
        for (let i = 0; i < 18; i++) {
            await V.sleep(10000)
            const r = await V.call(token, 'GET', `/droplets/${id}`)
            if (r.ok && r.data.droplet.status === 'active' && V.publicIp(r.data.droplet) !== '-') { info = r.data.droplet; break }
        }
        const ip = info ? V.publicIp(info) : `belum tersedia (cek ${usedPrefix}cekvps ${id})`
        const detail = [
            `☾ ${V.B('VPS BERHASIL DIBUAT')}`, V.LINE,
            `ID       : ${id}`, `Hostname : ${hostname}`, `IP       : ${ip}`, `User     : root`, `Password : ${password}`, V.LINE,
            `RAM      : ${spec.ram}`, `CPU      : ${spec.cpu}`, `Region   : ${region}`, `OS       : Ubuntu 22.04`, V.LINE,
            'Simpan data ini baik-baik. Password tidak bisa dikirim ulang.'
        ].join('\n')

        const sent = await conn.sendMessage(m.sender, { text: detail }).then(() => true).catch(() => false)
        return m.reply(sent
            ? `☾ ${V.B('VPS SIAP')}\n${V.LINE}\nData login dikirim ke chat pribadi kamu.`
            : `☾ ${V.B('VPS SIAP')}\n${V.LINE}\nDM gagal, jadi data login ditampilkan di sini:\n\n${detail}`)
    } finally { busy.delete(key) }
}

handler.help = ['createvps', 'cekvps', 'listvps', 'delvps', 'sisavps', 'turnon', 'turnoff', 'restartvps', ...Object.keys(V.plans())]
handler.tags = ['vps']
handler.command = [...CEK, ...LIST, ...DEL, ...SISA, ...Object.keys(ACTIONS), 'createvps', ...Object.keys(V.plans())]

export default handler
