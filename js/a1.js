'use strict';
/* منصة المسجد · وقف لله تعالى */
const CFG = window.QS_CONFIG || {};
const TZ = 'Africa/Algiers';
const GEO = 'https://cdn.jsdelivr.net/gh/kossa/algerian-cities@73fba56291b8c62a37b3c175d4aee2d2986fb746/database/seeders/json/';
const JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
const MONTHS = ['جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const GRADES = ['ممتاز','جيد جدًا','جيد','يُعاد'];
const KH = [['sidq','💎','الصدق','var(--blue)'],['adab','🌿','الأدب','var(--teal)'],['awn','🤝','مساعدة الزملاء','var(--purple)'],['waqt','⏰','المواظبة','var(--warn)'],['nadh','✨','النظافة','var(--gold)']];
const WAQF = 'هذه المنصة وقف لله تعالى بالكامل. لا نريد شكرًا ولا ذكرًا، ولا نسألكم إلا دعوة صالحة في ظهر الغيب.';

/* ---------- أدوات ---------- */
const $ = q => document.querySelector(q), main = $('#main'), dlg = $('#dlg');
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dstr = d => new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const today = () => dstr(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmtD = s => { const [y, m, d] = s.split('-'); return +d + ' ' + MONTHS[+m - 1] + ' ' + y; };
const hm = d => d ? d.toLocaleTimeString('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}) : '--:--';
const hijri = () => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(new Date()); } catch (e) { return ''; } };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const b64e = s => btoa(Array.from(new TextEncoder().encode(s), b => String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0)));
const waNum = p => { p = String(p || '').replace(/\D/g, ''); if (p.startsWith('00')) p = p.slice(2); else if (p.startsWith('0')) p = '213' + p.slice(1); return p; };
function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, 2800); }
const head = (t, p, x = '') => `<div class="head"><div><h2>${t}</h2>${p ? `<p>${p}</p>` : ''}</div>${x}</div>`;
function qrSvg(t) { try { const q = qrcode(0, 'M'); q.addData(t); q.make(); return q.createSvgTag({cellSize:2,margin:0,scalable:true}); } catch (e) { return ''; } }
function beep(ok) { try { const a = beep.c || (beep.c = new AudioContext()), o = a.createOscillator(), g = a.createGain(); o.frequency.value = ok ? 880 : 220; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .25); o.start(); o.stop(a.currentTime + .26); } catch (e) {} try { navigator.vibrate && navigator.vibrate(ok ? 60 : [80, 60, 80]); } catch (e) {} }
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name; document.body.append(a); a.click(); a.remove(); }
function copy(t, ok) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(ok || 'تم النسخ'), () => toast('حدّد النص وانسخه يدويًا')); }
const sure = (el, t) => { if (el.dataset.sure) return true; el.dataset.sure = 1; el.textContent = t || 'اضغط مرة أخرى للتأكيد'; return false; };
function readPhoto(file, cb) { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = 200; c.height = 250; const k = Math.max(200 / im.width, 250 / im.height), w = im.width * k, h = im.height * k; c.getContext('2d').drawImage(im, (200 - w) / 2, (250 - h) / 2, w, h); cb(c.toDataURL('image/jpeg', .7)); }; im.src = r.result; }; r.readAsDataURL(file); }
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); }); }

/* ---------- التخزين المحلي ---------- */
const idb = { db: null,
  open() { return new Promise((res, rej) => { const r = indexedDB.open(window.QS_DEMO ? 'masjid-demo' : 'masjid', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error); }); },
  get(k) { return new Promise((res, rej) => { const r = this.db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  set(k, v) { return new Promise((res, rej) => { const t = this.db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } };
let EV = [], EVM = new Map(), META = { dev: uid(), seq: 0, unsent: [], gs: '', key: '', me: '' }, saveT;
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (idb.db) { idb.set('events', EV).catch(() => {}); idb.set('meta', META).catch(() => {}); } }, 150); };

/* ---------- الحالة المشتقة من السجل ---------- */
let S;
function rebuild() {
  S = { cfg: { cupDays: 40, ptsDay: 10, ptsCup: 100, lock: true, before: 15, commune: null, feeMode: 'f', fee: { m: 0, t: 0, y: 0 }, cur: 'دج' }, users: {}, groups: {}, stu: {}, att: {}, abs: {}, pay: {}, fajr: {}, rec: {}, kh: {}, reqs: {}, posts: [] };
  const evs = [...EV].sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1));
  for (const e of evs) {
    const d = e.d || {};
    switch (e.type) {
      case 'cfg': Object.assign(S.cfg, d); break;
      case 'user': S.users[d.uid] = Object.assign(S.users[d.uid] || {}, d); break;
      case 'group': if (d.del) delete S.groups[d.gid]; else S.groups[d.gid] = Object.assign(S.groups[d.gid] || {}, d); break;
      case 'stu': S.stu[d.num] = Object.assign(S.stu[d.num] || { ts: e.ts, p: 0, weak: [] }, d); break;
      case 'att': { const a = S.att[d.num] || (S.att[d.num] = new Set()); d.x ? a.delete(d.d) : a.add(d.d); break; }
      case 'abs': { const a = S.abs[d.num] || (S.abs[d.num] = new Map()); d.x ? a.delete(d.d) : a.set(d.d, d.why || ''); break; }
      case 'pay': { const a = S.pay[d.num] || (S.pay[d.num] = new Map()); d.x ? a.delete(d.k) : a.set(d.k, { amt: d.amt, ts: e.ts, id: e.id }); break; }
      case 'fajr': { const a = S.fajr[d.num] || (S.fajr[d.num] = new Map()); d.x ? a.delete(d.d) : a.set(d.d, { t: d.t, man: d.man }); break; }
      case 'rec': (S.rec[d.num] || (S.rec[d.num] = [])).unshift({ ts: e.ts, k: d.k, gr: d.gr, i: d.i, th: d.th }); break;
      case 'kh': { const k = S.kh[d.num] || (S.kh[d.num] = {}); k[d.k] = (k[d.k] || 0) + 1; break; }
      case 'req': S.reqs[d.rid] = Object.assign({ ts: e.ts, st: 'new' }, d); break;
      case 'reqdone': if (S.reqs[d.rid]) S.reqs[d.rid].st = d.st; break;
      case 'post': if (d.del) S.posts = S.posts.filter(p => p.pid != d.pid); else S.posts.unshift(Object.assign({ ts: e.ts }, d)); break;
    }
  }
  for (const s of Object.values(S.stu)) {
    s.p = (+s.hz0 || 0) * 8; s.weak = [];
    for (const r of [...(S.rec[s.num] || [])].reverse()) {
      if (r.k == 'n' && r.gr < 3) s.p = Math.min(480, s.p + 1);
      if (r.k == 'r') { const w = s.weak.indexOf(r.i); if (r.gr >= 3 && w < 0) s.weak.push(r.i); if (r.gr < 2 && w >= 0) s.weak.splice(w, 1); }
    }
  }
}
async function emit(type, d) {
  const e = { id: uid(), ts: Date.now(), dev: META.dev, by: META.me || '', type, d };
  EV.push(e); EVM.set(e.id, e); META.unsent.push(e.id); rebuild(); persist(); queueSync(1500); return e;
}

/* ---------- المزامنة مع جدول Google ---------- */
let syncing = false, syncT, lastSync = 0, dirty = false;
async function api(url, o) { const r = await fetch(url, { method: 'POST', body: JSON.stringify(o) }); return r.json(); }
function syncBadge(state) {
  const b = $('#sync'); if (!META.me) { b.hidden = true; return; }
  b.hidden = false;
  if (!META.gs) { b.className = 'sync'; b.textContent = 'هذا الجهاز وحده'; return; }
  const n = META.unsent.length;
  if (state == 'off') { b.className = 'sync off'; b.textContent = 'دون اتصال' + (n ? ' · ' + n + ' في الانتظار' : ''); }
  else { b.className = 'sync on'; b.textContent = n ? 'يُرسل ' + n : 'متزامن'; }
}
function queueSync(ms) { clearTimeout(syncT); syncT = setTimeout(sync, ms || 0); }
async function sync() {
  if (window.QS_DEMO || !META.gs || !META.key || syncing) return; syncing = true;
  try {
    while (META.unsent.length) {
      const ids = META.unsent.slice(0, 150), evs = ids.map(i => EVM.get(i)).filter(Boolean);
      const j = await api(META.gs, { action: 'push', key: META.key, events: evs });
      if (!j.ok) throw new Error(j.err || 'push');
      META.unsent = META.unsent.filter(i => !ids.includes(i)); persist();
    }
    let more = true, got = 0;
    while (more) {
      const j = await api(META.gs, { action: 'pull', key: META.key, since: META.seq });
      if (!j.ok) throw new Error(j.err || 'pull');
      for (const e of j.events) if (!EVM.has(e.id)) { EV.push(e); EVM.set(e.id, e); got++; }
      META.seq = j.seq; more = j.more;
    }
    lastSync = Date.now(); persist(); syncBadge('on');
    if (got) { rebuild(); refresh(); }
  } catch (e) { syncBadge('off'); }
  finally { syncing = false; clearTimeout(syncT); syncT = setTimeout(sync, 30000); }
}
function refresh() {
  const a = document.activeElement;
  if (dlg.open || (a && a.matches && a.matches('main input:not(.scaninput),main textarea,main select'))) { dirty = true; return; }
  if (VIEW && V[VIEW] && !['scr', 'login', 'setup'].includes(VIEW)) { V[VIEW](); }
}
addEventListener('online', () => queueSync(500));
addEventListener('offline', () => syncBadge('off'));

/* ---------- الصلاحيات ---------- */
async function hashPin(pin, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode('masjid:' + salt), iterations: 120000, hash: 'SHA-256' }, k, 256);
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
}
const ME = () => S.users[META.me];
const isAdmin = () => ME() && ME().role == 'admin';
const myGroups = () => isAdmin() ? Object.keys(S.groups) : Object.keys(S.groups).filter(g => S.groups[g].t == META.me);
const myStudents = () => { const gs = myGroups(); return Object.values(S.stu).filter(s => !s.off && (isAdmin() || gs.includes(s.g))); };
const fullName = s => (s.name || '') + ' ' + (s.surname || '');
const gName = g => (S.groups[g] || {}).n || '—';
const MOSQUE = () => CFG.name || 'المسجد';
const THE = () => CFG.the || 'المسجد';

/* ---------- أوقات الصلاة حسب البلدية ---------- */
function place() { return S.cfg.commune || CFG.commune || { name: '', lat: 35.77, lng: 4.75 }; }
function prayers(day) {
  if (!window.adhan) return null;
  try {
    const [y, m, d] = (day || today()).split('-').map(Number), c = place();
    const p = new adhan.CalculationParameters('Other', 18, 17);
    return new adhan.PrayerTimes(new adhan.Coordinates(+c.lat, +c.lng), new Date(y, m - 1, d, 12), p);
  } catch (e) { return null; }
}
function fajrWindow() {
  const t = prayers(); if (!t) return { ok: true, why: '' };
  const from = new Date(t.fajr.getTime() - (+S.cfg.before || 15) * 60000), to = t.sunrise, now = new Date();
  return { ok: !S.cfg.lock || (now >= from && now <= to), from, to, fajr: t.fajr, sunrise: t.sunrise };
}
const timesStrip = () => { const t = prayers(); if (!t) return ''; return `<div class="times">${[['الفجر', t.fajr, 'fj'], ['الشروق', t.sunrise], ['الظهر', t.dhuhr], ['العصر', t.asr], ['المغرب', t.maghrib], ['العشاء', t.isha]].map(x => `<div class="${x[2] || ''}"><span>${x[0]}</span><b>${hm(x[1])}</b></div>`).join('')}</div>`; };

/* ---------- رجال الفجر: السلسلة والكؤوس والنقاط ---------- */
function fajrStats(num) {
  const m = S.fajr[num], dates = m ? [...m.keys()].sort() : [], C = +S.cfg.cupDays || 40;
  let run = 0, cups = 0, prev = null;
  for (const d of dates) { run = prev && addDays(prev, 1) == d ? run + 1 : 1; if (run % C == 0) cups++; prev = d; }
  const t = today(), cur = prev && (prev == t || prev == addDays(t, -1)) ? run : 0;
  return { days: dates.length, cups, cur, next: C - (cur % C), pts: dates.length * (+S.cfg.ptsDay || 10) + cups * (+S.cfg.ptsCup || 100), last: prev, todayIn: !!(m && m.has(t)) };
}
function ranking(gs) {
  return Object.values(S.stu).filter(s => !s.off && (!gs || gs.includes(s.g))).map(s => Object.assign({ s }, fajrStats(s.num)))
    .filter(r => r.days).sort((a, b) => b.pts - a.pts || b.cur - a.cur || b.cups - a.cups);
}
function ring(cur) {
  const C = +S.cfg.cupDays || 40, v = cur % C, r = 26, L = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 64 64" aria-label="${v} من ${C}"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#C9962A40" stroke-width="7"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="#C9962A" stroke-width="7" stroke-linecap="round" stroke-dasharray="${L * v / C} ${L}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${v}</text></svg>`;
}

