'use strict';
/* ---------- الولايات والبلديات ---------- */
let GEOD = null;
async function geo() {
  try {
    if (!GEOD) { const [w, c] = await Promise.all([fetch(GEO + 'Wilaya_Of_Algeria.json').then(r => r.json()), fetch(GEO + 'Commune_Of_Algeria.json').then(r => r.json())]);
      GEOD = { w: w.filter(x => x.id <= 58), c }; }
    const cur = place(), wsel = $('#w'), csel = $('#cm'); if (!wsel) return;
    const cw = (GEOD.c.find(x => x.ar_name == cur.name) || {}).wilaya_id || CFG.wilaya;
    wsel.innerHTML = GEOD.w.map(x => `<option value="${x.id}"${x.id == cw ? ' selected' : ''}>${String(x.id).padStart(2, '0')} · ${esc(x.ar_name)}</option>`).join('');
    const fill = () => { const L = GEOD.c.filter(x => x.wilaya_id == wsel.value).sort((a, b) => a.ar_name.localeCompare(b.ar_name, 'ar')); csel.innerHTML = '<option value="">اختر البلدية</option>' + L.map(x => `<option value="${x.id}"${x.ar_name == cur.name ? ' selected' : ''}>${esc(x.ar_name)}</option>`).join(''); };
    fill(); wsel.onchange = fill;
    csel.onchange = () => { const x = GEOD.c.find(y => y.id == csel.value); if (!x) return; let lat = +x.latitude, lng = +x.longitude;
      if (!(lat > 18 && lat < 38 && lng > -9 && lng < 12.5)) { const o = GEOD.c.filter(y => y.wilaya_id == x.wilaya_id && y !== x); lat = o.reduce((a, y) => a + +y.latitude, 0) / o.length; lng = o.reduce((a, y) => a + +y.longitude, 0) / o.length; }
      emit('cfg', { commune: { name: x.ar_name, lat, lng } }).then(() => { toast('البلدية: ' + x.ar_name); V.settings(); }); };
  } catch (e) { const w = $('#w'); if (w) w.innerHTML = '<option>تعذر تحميل القائمة. تحقق من الاتصال</option>'; }
}

/* ---------- ربط جدول Google ---------- */
function gsGuide() {
  const key = Array.from(crypto.getRandomValues(new Uint8Array(18)), x => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[x % 55]).join('');
  dlg.innerHTML = `<div class="dl"><h2>ربط المنصة بجدول Google للمسجد</h2><ol style="margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:6px">
  <li>ادخل حساب Gmail الخاص بالمسجد، وأنشئ جدولًا جديدًا في Google Sheets باسم المسجد.</li>
  <li>من القائمة: Extensions ثم Apps Script. امسح ما في المحرر.</li>
  <li>ألصق محتوى ملف <b>Code.gs</b> (الزر أدناه)، ثم ضع في سطره الأول كلمة السر هذه مكان «ضع-هنا-كلمة-السر»:<br><span class="code">${key}</span> <button class="btn ghost sm" data-a="copyKey" data-k="${key}">انسخ</button></li>
  <li>Deploy ثم New deployment، النوع Web app، Execute as: Me، Who has access: Anyone. وافق على الأذونات.</li>
  <li>انسخ رابط Web app والصقه هنا:</li></ol>
  <input id="gsu" dir="ltr" placeholder="https://script.google.com/macros/s/…/exec">
  <div class="tools"><a class="btn ghost" href="Code.gs" target="_blank" rel="noopener">افتح Code.gs</a><button class="btn" data-a="gsLink" data-k="${key}">اربط وأرسل البيانات</button><button class="btn ghost" data-a="close">إغلاق</button></div>
  <p class="mut" style="font-size:12.5px">الجدول ملك للمسجد. بعد الربط ضع رابط Web app أيضًا في ملف config.js (الخانة gs) ليعمل نموذج الحجز للأولياء.</p></div>`;
  dlg.showModal();
}

/* ---------- الأحداث ---------- */
const A = {
  close() { dlg.close(); if (dirty) { dirty = false; refresh(); } },
  cam() { startCam(); },
  async newS() { if (!Object.keys(S.groups).length) return toast('أنشئ فوجًا أولًا'); if (META.gs && navigator.onLine) await sync(); openForm(null); },
  editS(el) { openForm(S.stu[el.dataset.n]); },
  async offS(el) { if (!sure(el)) return; await emit('stu', { num: el.dataset.n, off: true }); dlg.close(); toast('أُوقف الطالب'); V[VIEW](); },
  async okReq(el) { if (!Object.keys(S.groups).length) return toast('أنشئ فوجًا أولًا'); if (META.gs && navigator.onLine) await sync(); const r = S.reqs[el.dataset.r]; openForm(null, r); },
  async noReq(el) { if (!sure(el)) return; await emit('reqdone', { rid: el.dataset.r, st: 'no' }); V.reqs(); },
  att(el) { attMark(el.dataset.n); },
  async unAtt(el) { await emit('att', { num: el.dataset.n, d: today(), x: 1 }); V.attend(); },
  manFajr(el) {
    const n = el.dataset.n;
    dlg.innerHTML = `<form class="dl" id="mf"><h2>تسجيل فجر يدويًا</h2><p class="mut">للأيام التي تعذّر فيها المسح. يُكتب في السجل أنه يدوي.</p><label class="form"><span class="mut">التاريخ</span><input id="mf-d" type="date" value="${today()}" max="${today()}" required></label><div class="tools"><button class="btn" type="submit">سجّل</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    $('#mf').onsubmit = e => { e.preventDefault(); dlg.close(); fajrMark(n, true, $('#mf-d').value); toast('سُجّل'); };
  },
  async kh(el) { await emit('kh', { num: el.dataset.n, k: el.dataset.k }); dlg.innerHTML = studentHTML(S.stu[el.dataset.n]); toast('مُنح الوسام'); },
  async rec(el) { const s = S.stu[el.dataset.n], gr = +el.dataset.g, rv = el.dataset.i !== undefined;
    await emit('rec', rv ? { num: s.num, k: 'r', gr, i: +el.dataset.i } : { num: s.num, k: 'n', gr, i: Math.floor(s.p / 8), th: s.p % 8 + 1 });
    toast(fullName(s) + ': ' + GRADES[gr] + (rv ? '' : gr < 3 ? ' · ' + pos(S.stu[s.num]) : '')); V.recite(); },
  newG() { A.editG({ dataset: {} }); },
  editG(el) {
    const id = el.dataset.g, g = S.groups[id] || {}, T = Object.values(S.users).filter(u => u.role == 'teacher' && !u.off);
    dlg.innerHTML = `<form class="dl" id="gf"><h2>${id ? 'تعديل الفوج' : 'فوج جديد'}</h2><div class="form"><label>اسم الفوج<input id="g-n" value="${esc(g.n)}" required></label><label>المستوى<input id="g-lvl" value="${esc(g.lvl)}"></label>
    <label>المعلم المسند<select id="g-t"><option value="">دون معلم</option>${T.map(u => `<option value="${u.uid}"${u.uid == g.t ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
    <label>الأيام<input id="g-days" value="${esc(g.days || 'السبت – الأربعاء')}"></label><label>التوقيت<input id="g-time" value="${esc(g.time || '17:00 – 18:30')}"></label></div>
    <div class="tools"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    dlg.showModal();
    $('#gf').onsubmit = async e => { e.preventDefault(); const v = k => $('#g-' + k).value.trim(); await emit('group', { gid: id || uid(), n: v('n'), lvl: v('lvl'), t: v('t'), days: v('days'), time: v('time') }); dlg.close(); toast('حُفظ الفوج'); V.groups(); };
  },
  newT() { A.editT({ dataset: {} }); },
  editT(el) {
    const id = el.dataset.u, u = S.users[id] || {};
    dlg.innerHTML = `<form class="dl" id="tf"><h2>${id ? 'تعديل المعلم' : 'معلم جديد'}</h2><div class="form"><label>الاسم<input id="t-name" value="${esc(u.name)}" required></label><label>الهاتف<input id="t-phone" value="${esc(u.phone)}" dir="ltr"></label>
    <label>${id ? 'رمز سري جديد (اتركه فارغًا للإبقاء)' : 'الرمز السري (6 أرقام على الأقل)'}<input id="t-pin" type="password" inputmode="numeric" ${id ? '' : 'required minlength="6"'} autocomplete="new-password"></label>
    ${id ? `<label>الحالة<select id="t-off"><option value="">نشط</option><option value="1"${u.off ? ' selected' : ''}>موقوف</option></select></label>` : ''}</div>
    <p class="mut" style="font-size:13px">بعد الحفظ أسند إليه الأفواج من بطاقة كل فوج.</p><div class="tools"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    dlg.showModal();
    $('#tf').onsubmit = async e => { e.preventDefault(); const nid = id || uid(), d = { uid: nid, name: $('#t-name').value.trim(), phone: $('#t-phone').value.trim(), role: u.role || 'teacher' };
      const p = $('#t-pin').value; if (p) { if (p.length < 6) return toast('الرمز 6 أرقام على الأقل'); d.pin = await hashPin(p, nid); }
      if ($('#t-off')) d.off = !!$('#t-off').value; await emit('user', d); dlg.close(); toast('حُفظ'); V.groups(); };
  },
  myPin() {
    dlg.innerHTML = `<form class="dl" id="mp"><h2>تغيير رمزي السري</h2><input id="mp-1" type="password" inputmode="numeric" minlength="6" required placeholder="الرمز الجديد" autocomplete="new-password"><input id="mp-2" type="password" inputmode="numeric" minlength="6" required placeholder="أعده للتأكيد" autocomplete="new-password"><div class="tools"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    dlg.showModal(); $('#mp').onsubmit = async e => { e.preventDefault(); if ($('#mp-1').value != $('#mp-2').value) return toast('الرمزان غير متطابقين'); await emit('user', { uid: META.me, pin: await hashPin($('#mp-1').value, META.me) }); dlg.close(); toast('تغيّر الرمز'); };
  },
  logout(el) { if (!sure(el)) return; META.me = ''; persist(); go('home'); },
  newPost() {
    dlg.innerHTML = `<form class="dl" id="pf2"><h2>مقال جديد</h2><p class="mut">اكتب بنفسك أو انقل عن مصدر موثوق. انسب كل آية إلى سورتها وكل حديث إلى من رواه.</p><div class="form"><label>التصنيف<select id="p-cat"><option>الصلاة</option><option>الأخلاق</option><option>التلاحم</option><option>القرآن</option><option>أخبار المسجد</option></select></label><label>العنوان<input id="p-title" required></label><label class="wide">النص<textarea id="p-body" required style="min-height:180px"></textarea></label></div><div class="tools"><button class="btn" type="submit">انشر</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    dlg.showModal(); $('#pf2').onsubmit = async e => { e.preventDefault(); await emit('post', { pid: uid(), cat: $('#p-cat').value, title: $('#p-title').value.trim(), body: $('#p-body').value.trim() }); dlg.close(); V.blog(); };
  },
  async delPost(el) { if (!sure(el)) return; await emit('post', { pid: el.dataset.p, del: 1 }); V.blog(); },
  printCards() { $('#print').innerHTML = '<div class="grid">' + $('#cardsGrid').innerHTML + '</div>'; window.print(); },
  printRank() { $('#print').innerHTML = `<h2>ترتيب جائزة رجال الفجر · ${esc(MOSQUE())} · ${fmtD(today())}</h2>` + $('#rank').innerHTML; window.print(); },
  csv() { download('students.csv', '﻿' + ['الرقم,الاسم,اللقب,تاريخ الميلاد,اسم الأب,الهاتف,الولي,البريد,الفوج,أيام الفجر,الكؤوس,النقاط'].concat(Object.values(S.stu).filter(s => !s.off).map(s => { const f = fajrStats(s.num); return [s.num, s.name, s.surname, s.birth, s.father, s.phone, s.guardian, s.email, gName(s.g), f.days, f.cups, f.pts].map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(','); })).join('\n'), 'text/csv'); },
  backup() { download('masjid-backup-' + today() + '.json', JSON.stringify({ v: 1, events: EV }), 'application/json'); },
  gsGuide() { gsGuide(); },
  copyKey(el) { copy(el.dataset.k); },
  async gsLink(el) {
    const u = $('#gsu').value.trim(), key = el.dataset.k;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(u)) return toast('الرابط يبدأ بـ https://script.google.com/macros/s/ وينتهي بـ /exec');
    el.disabled = true; el.textContent = 'جارٍ التحقق…';
    try { const j = await api(u, { action: 'ping', key }); if (!j.ok) throw 0; } catch (x) { el.disabled = false; el.textContent = 'اربط وأرسل البيانات'; return toast('لم يستجب السكربت. تحقق من كلمة السر في Code.gs ومن إعداد النشر'); }
    META.gs = u; META.key = key; META.seq = 0; META.unsent = EV.map(e => e.id); persist(); dlg.close(); toast('رُبطت القاعدة. جارٍ إرسال البيانات…'); await sync(); V.settings();
  },
  copyPair() { copy('MQ1-' + b64e(JSON.stringify([META.gs, META.key])), 'نُسخ رمز الربط'); },
  showPair() { dlg.innerHTML = `<div class="dl" style="align-items:center;text-align:center"><h2>رمز ربط جهاز جديد</h2><div style="width:240px;background:#fff;padding:10px;border-radius:12px">${qrSvg('MQ1-' + b64e(JSON.stringify([META.gs, META.key])))}</div><p class="mut">امسحه بكاميرا الهاتف الجديد ثم ألصق النص في «ربط هذا الجهاز». لا تعرضه لغير الطاقم.</p><button class="btn ghost" data-a="close">إغلاق</button></div>`; dlg.showModal(); },
  syncNow() { sync().then(() => { toast(META.unsent.length ? 'لم تكتمل المزامنة' : 'تمت المزامنة'); V.settings(); }); }
};
document.addEventListener('click', e => {
  const d = e.target.closest('[data-a],[data-v],[data-s]'); if (!d) return;
  if (d.dataset.a && A[d.dataset.a]) return A[d.dataset.a](d);
  if (d.dataset.v) { if (dlg.open) dlg.close(); return go(d.dataset.v); }
  if (d.dataset.s && S.stu[d.dataset.s]) openS(d.dataset.s);
});
document.addEventListener('change', e => { const n = e.target.dataset.photo; if (n && e.target.files[0]) readPhoto(e.target.files[0], u => emit('stu', { num: n, photo: u }).then(() => { dlg.innerHTML = studentHTML(S.stu[n]); toast('أُضيفت الصورة'); })); });
dlg.addEventListener('close', () => { if (dirty) { dirty = false; refresh(); } });

/* ---------- الافتتاح والتشغيل ---------- */
let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#inst').hidden = false; });
$('#inst').onclick = () => { if (deferred) { deferred.prompt(); deferred = null; $('#inst').hidden = true; } };
function intro() {
  const el = $('#intro'); $('#introName').textContent = MOSQUE();
  let seen = false; try { seen = sessionStorage.getItem('intro') == '1'; } catch (e) {}
  if (seen || location.hash.length > 1) { el.remove(); return; }
  const close = () => { el.classList.add('gone'); try { sessionStorage.setItem('intro', '1'); } catch (e) {} setTimeout(() => el.remove(), 700); };
  setTimeout(() => el.classList.add('open'), 500);
  $('#enter').onclick = close; setTimeout(close, 7000);
}
async function boot() {
  $('#tName').textContent = MOSQUE(); $('#tPlace').textContent = CFG.place || ''; document.title = MOSQUE() + ' · وقف لله تعالى';
  intro();
  if ('serviceWorker' in navigator && location.protocol == 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  try { await idb.open(); const [ev, me] = await Promise.all([idb.get('events'), idb.get('meta')]); if (Array.isArray(ev)) EV = ev; if (me) META = Object.assign(META, me); } catch (e) {}
  EVM = new Map(EV.map(e => [e.id, e])); rebuild();
  if (META.me && !S.users[META.me]) META.me = '';
  go(location.hash.slice(1) || (META.me ? 'dash' : 'home'));
  if (META.gs) sync();
}
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h != VIEW && S) go(h); });
boot();
