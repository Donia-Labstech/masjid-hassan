'use strict';
/* ---------- الامتحانات: حضورية وعن بعد، مع جدول الامتحانات ---------- */
const KIND = { h: ['حضوري', '🏫'], r: ['عن بعد', '📱'] };
(() => {
  const ins = (L, after, item) => { const i = L.findIndex(n => n[0] == after); L.splice(i < 0 ? L.length : i + 1, 0, item); };
  ins(NAV.admin, 'recite', ['exams', '📝', 'الامتحانات', 'var(--red)']);
  ins(NAV.teacher, 'recite', ['exams', '📝', 'الامتحانات', 'var(--red)']);
})();

/* أسئلة الامتحان عن بعد: كل سؤال فقرة؛ السطر الأول السؤال، ثم الخيارات، والصحيح يبدأ بنجمة * */
function parseQs(txt) {
  return String(txt || '').split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(l => l.length >= 3)
    .map(l => { const o = l.slice(1); let a = o.findIndex(x => x.startsWith('*')); if (a < 0) a = 0; return { q: l[0], o: o.map(x => x.replace(/^\*\s*/, '')), a }; });
}
const qsText = q => (q || []).map(x => [x.q, ...x.o.map((o, j) => (j == x.a ? '*' : '') + o)].join('\n')).join('\n\n');
const xMin = t => { const p = String(t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
/* -1 لم يحن، 0 مفتوح (من موعده إلى نهاية مدته + ساعة)، 1 انتهى */
function xWin(x) {
  const t = today(); if (t < x.d) return -1; if (t > x.d) return 1; if (!x.time) return 0;
  const n = xMin(hm(new Date())), m = xMin(x.time), end = m + (+x.m || 30) + 60;
  return n < m ? -1 : (end >= 1440 || n <= end) ? 0 : 1;
}
const xWhen = x => `${WD[wdOf(x.d)]} ${fmtD(x.d)}`;
const xGrp = x => x.g ? gName(x.g) : 'كل الأفواج';
const xKind = x => `<span class="pill ${x.kind == 'r' ? 'xr' : 'xh'}">${KIND[x.kind || 'h'][1]} ${KIND[x.kind || 'h'][0]}</span>`;
const xWhere = x => x.kind == 'r' ? `${+x.m || 30} دقيقة · ${(x.q || []).length || x.n || 0} سؤالًا` : (x.room || 'في المسجد') + (x.max ? ` · على ${x.max}` : '');
const xSort = (a, b) => (a.d + (a.time || '')).localeCompare(b.d + (b.time || ''));
const xMine = () => { const gs = myGroups(); return Object.values(S.exams).filter(x => isAdmin() || !x.g || gs.includes(x.g)).sort(xSort); };
const xStus = x => myStudents().filter(s => !x.g || s.g == x.g).sort((a, b) => a.num.localeCompare(b.num));
function xStats(x) {
  const r = Object.values(S.res[x.xid] || {}).filter(v => v.sc !== '' && v.sc != null), tot = x.kind == 'r' ? (x.q || []).length : +x.max || 20;
  if (!r.length) return { n: 0, tot };
  const p = r.map(v => +v.sc / (+v.total || tot) * tot);
  return { n: r.length, tot, avg: (p.reduce((a, b) => a + b, 0) / p.length).toFixed(2), hi: Math.max(...p), lo: Math.min(...p) };
}
function xTable(list) {
  if (!list.length) return '<p class="mut">لا امتحانات في هذا الجدول.</p>';
  return `<div class="scroll"><table class="xt"><tr><th>اليوم والتاريخ</th><th>الساعة</th><th>الامتحان</th><th>الفوج</th><th>النوع</th><th>المكان أو المدة</th></tr>
  ${list.map(x => `<tr${xWin(x) == 0 ? ' class="now"' : ''}><td><b>${xWhen(x)}</b>${x.d == today() ? ' <span class="pill ok">اليوم</span>' : ''}</td><td dir="ltr">${esc(x.time || '—')}</td><td>${esc(x.t)}</td><td>${esc(xGrp(x))}</td><td>${xKind(x)}</td><td>${esc(xWhere(x))}</td></tr>`).join('')}</table></div>`;
}
function xCards(list) {
  if (!list.length) return '<p class="mut">لا امتحانات هنا بعد.</p>';
  return `<div class="xlist">${list.map(x => { const st = xStats(x), [y, m, d] = x.d.split('-'); return `<div class="xrow${xWin(x) == 0 ? ' now' : ''}">
   <div class="xdate"><b>${+d}</b><span>${MONTHS[+m - 1]}</span><small>${WD[wdOf(x.d)]}</small></div>
   <div class="xinfo"><h4>${esc(x.t)} ${x.d == today() ? '<span class="pill ok">اليوم</span>' : ''}</h4><p>${xKind(x)} · ${esc(xGrp(x))}${x.time ? ' · ⏰ <span dir="ltr">' + esc(x.time) + '</span>' : ''} · ${esc(xWhere(x))}</p>
   <p class="mut">${st.n ? `${st.n} ممتحَن · المعدل ${st.avg} من ${st.tot}` : 'لا نتائج بعد'}</p></div>
   <div class="tools"><button class="btn sm" data-a="xMarks" data-x="${x.xid}">${x.kind == 'r' ? 'النتائج' : 'رصد العلامات'}</button><button class="btn ghost sm" data-a="xAnn" data-x="${x.xid}">📣 إعلان</button>${x.kind == 'r' ? `<button class="btn ghost sm" data-a="xTry" data-x="${x.xid}">جرّبه</button>` : ''}<button class="btn ghost sm" data-a="xEdit" data-x="${x.xid}">تعديل</button><button class="btn danger sm" data-a="xDel" data-x="${x.xid}">حذف</button></div></div>`; }).join('')}</div>`;
}

V.exams = function () {
  if (V.exams.x && S.exams[V.exams.x]) return xMarks(S.exams[V.exams.x]);
  V.exams.x = '';
  const L = xMine(), t = today(), up = L.filter(x => x.d >= t), past = L.filter(x => x.d < t).reverse();
  main.innerHTML = head('الامتحانات', 'جدول الامتحانات الحضورية وعن بعد، ورصد النتائج', '<div class="tools"><button class="btn" data-a="xNew">＋ امتحان جديد</button><button class="btn ghost" data-a="xPrint">🖨 اطبع الجدول</button></div>') +
  `<div class="grid g2"><div class="panel"><h3>🏫 حضوري</h3><p class="mut">في المسجد، في يوم وساعة وقاعة محددة. يرصد المعلم العلامة من 20 (أو ما تختارون) ويضيف ملاحظة.</p></div>
   <div class="panel"><h3>📱 عن بعد</h3><p class="mut">أسئلة اختيار من متعدد يجيب عنها الطالب من «بوابة الأولياء» في موعده، بعدّاد وقت، وتُصحَّح آليًا وتصل النتيجة إلى المعلم.</p></div></div>
  <div class="panel" id="xsched"><h3>🗓 جدول الامتحانات القادمة</h3>${xCards(up)}</div>
  ${past.length ? `<div class="panel"><h3>امتحانات سابقة</h3>${xCards(past)}</div>` : ''}
  <p class="waqf" style="margin:0">الامتحان عن بعد يعمل من هواتف الأولياء بعد ربط المنصة بجدول Google، وتُصحَّح الإجابات هناك فلا تصل الإجابات الصحيحة إلى هاتف الطالب. وتبقى الأسئلة من إعداد المعلم: المنصة لا تولّد أسئلة ولا نصًّا قرآنيًا.</p>` + footer();
};
V.exams.x = '';

function xForm(x) {
  x = x || { kind: 'h', d: addDays(today(), 7), time: '17:00', m: 30, max: 20 };
  const gs = myGroups();
  dlg.innerHTML = `<form class="dl" id="xf"><h2>${x.xid ? 'تعديل امتحان' : 'امتحان جديد'}</h2>
  <div class="form">
   <label class="wide">عنوان الامتحان<input id="x-t" required maxlength="80" value="${esc(x.t || '')}" placeholder="مثال: امتحان الحزب 5 · امتحان نهاية الفصل"></label>
   <label>النوع<select id="x-k"><option value="h"${x.kind != 'r' ? ' selected' : ''}>🏫 حضوري في المسجد</option><option value="r"${x.kind == 'r' ? ' selected' : ''}>📱 عن بعد من بوابة الأولياء</option></select></label>
   <label>الفوج<select id="x-g">${isAdmin() ? `<option value="">كل الأفواج</option>` : ''}${gs.map(g => `<option value="${g}"${x.g == g ? ' selected' : ''}>${esc(gName(g))}</option>`).join('')}</select></label>
   <label>التاريخ<input id="x-d" type="date" required value="${esc(x.d)}"></label>
   <label>الساعة<input id="x-time" type="time" value="${esc(x.time || '')}"></label>
   <label class="xh">القاعة<input id="x-room" maxlength="40" value="${esc(x.room || '')}" placeholder="القاعة 1"></label>
   <label class="xh">العلامة القصوى<input id="x-max" type="number" min="1" max="100" value="${+x.max || 20}"></label>
   <label class="xr">المدة (دقائق)<input id="x-m" type="number" min="5" max="180" value="${+x.m || 30}"></label>
   <label class="wide xr">الأسئلة<textarea id="x-q" dir="auto" style="min-height:190px" placeholder="كم عدد أحزاب القرآن الكريم؟&#10;*60&#10;30&#10;114&#10;&#10;السؤال التالي…">${esc(qsText(x.q))}</textarea>
   <small class="mut">اكتب كل سؤال في فقرة: السطر الأول السؤال، ثم الخيارات سطرًا سطرًا، وضع نجمة * قبل الخيار الصحيح. اترك سطرًا فارغًا بين الأسئلة.</small></label>
  </div>
  <div class="tools"><button class="btn" type="submit">احفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
  if (!dlg.open) dlg.showModal();
  const sw = () => { const r = $('#x-k').value == 'r'; dlg.querySelectorAll('.xh').forEach(e => e.hidden = r); dlg.querySelectorAll('.xr').forEach(e => e.hidden = !r); };
  $('#x-k').onchange = sw; sw();
  $('#xf').onsubmit = async e => {
    e.preventDefault(); const k = $('#x-k').value, q = k == 'r' ? parseQs($('#x-q').value) : null;
    if (k == 'r' && !q.length) return toast('أضف سؤالًا واحدًا على الأقل: السؤال ثم خياران فأكثر');
    const d = { xid: x.xid || 'x' + uid(), t: $('#x-t').value.trim(), kind: k, g: $('#x-g').value, d: $('#x-d').value, time: $('#x-time').value, room: k == 'h' ? $('#x-room').value.trim() : '', max: k == 'h' ? +$('#x-max').value || 20 : 0, m: k == 'r' ? +$('#x-m').value || 30 : 0, q: q || null };
    await emit('exam', d); dlg.close(); toast('حُفظ الامتحان في الجدول'); V.exams();
  };
}

/* رصد العلامات والنتائج */
function xMarks(x) {
  V.exams.x = x.xid;
  const L = xStus(x), R = S.res[x.xid] || {}, tot = x.kind == 'r' ? (x.q || []).length : +x.max || 20, st = xStats(x);
  main.innerHTML = `<div class="back"><button class="btn ghost sm" data-a="xBack">→ رجوع إلى الجدول</button></div>` + head(esc(x.t), `${xWhen(x)}${x.time ? ' · ' + esc(x.time) : ''} · ${esc(xGrp(x))} · ${KIND[x.kind || 'h'][0]}`, `<button class="btn ghost sm" data-a="xPrintRes" data-x="${x.xid}">🖨 اطبع النتائج</button>`) +
  `<div class="grid g4"><div class="panel stat" style="--c:var(--blue)"><b>${st.n}/${L.length}</b><span>ممتحَن</span></div><div class="panel stat" style="--c:var(--emerald)"><b>${st.n ? st.avg : '—'}</b><span>المعدل على ${tot}</span></div><div class="panel stat" style="--c:var(--ok)"><b>${st.n ? +st.hi.toFixed(2) : '—'}</b><span>أعلى علامة</span></div><div class="panel stat" style="--c:var(--red)"><b>${st.n ? +st.lo.toFixed(2) : '—'}</b><span>أدنى علامة</span></div></div>
  <form class="panel" id="xm"><h3>${x.kind == 'r' ? 'نتائج من أجاب عن بعد' : 'رصد العلامات'}</h3>${x.kind == 'r' ? '<p class="mut">تظهر هنا نتيجة كل من أجاب من بوابة الأولياء. ويمكن رصد علامة يدويًا لمن امتُحن شفهيًا.</p>' : '<p class="mut">اكتب العلامة لكل طالب. اترك الخانة فارغة لمن لم يُمتحن بعد.</p>'}
  <div class="scroll" id="xmt"><table><tr><th>الطالب</th><th>العلامة (من ${tot})</th>${x.kind == 'r' ? '<th>طريقة الإجابة</th><th>مغادرة الصفحة</th>' : ''}<th>ملاحظة</th></tr>
  ${L.map(s => { const r = R[s.num] || {}; return `<tr><td><div class="who2">${mini(s)}<span><b>${esc(fullName(s))}</b><br><span class="code">${esc(s.num)}</span></span></div></td>
   <td><input class="xmk" data-n="${esc(s.num)}" type="number" min="0" max="${tot}" step="0.25" inputmode="decimal" value="${r.sc ?? ''}" style="width:90px"></td>
   ${x.kind == 'r' ? `<td>${r.by == 'p' ? '<span class="pill ok">📱 عن بعد</span>' + (r.wrong && r.wrong.length ? ` <small class="mut">أخطأ في: ${r.wrong.join('، ')}</small>` : '') : r.sc != null ? '<span class="pill">رصد المعلم</span>' : '<span class="mut">لم يُجب</span>'}</td><td>${r.blur ? `<span class="pill warn">${r.blur} مرة</span>` : r.by == 'p' ? '0' : ''}</td>` : ''}
   <td><input class="xnt" data-n="${esc(s.num)}" maxlength="60" value="${esc(r.note || '')}" placeholder="${x.kind == 'h' ? 'غائب، ممتاز…' : ''}"></td></tr>`; }).join('') || `<tr><td class="mut">لا طلاب في هذا الفوج</td></tr>`}</table></div>
  <div class="tools" style="margin-top:12px"><button class="btn" type="submit">احفظ العلامات</button></div></form>` + footer();
  $('#xm').onsubmit = async e => {
    e.preventDefault(); let n = 0;
    for (const i of main.querySelectorAll('.xmk')) {
      const num = i.dataset.n, r = R[num] || {}, v = i.value.trim(), note = main.querySelector(`.xnt[data-n="${num}"]`).value.trim();
      if (v === '' && !note) { if (r.sc != null || r.note) { await emit('res', { xid: x.xid, num, x: 1 }); n++; } continue; }
      const sc = v === '' ? null : Math.max(0, Math.min(tot, +v));
      if (sc === (r.sc ?? null) && note == (r.note || '')) continue;
      const o = { xid: x.xid, num, sc, total: tot, note, by: r.by == 'p' && sc === r.sc ? 'p' : 't' }; if (r.blur) o.blur = r.blur; if (r.wrong) o.wrong = r.wrong;
      await emit('res', o); n++;
    }
    toast(n ? 'حُفظت ' + n + ' علامة' : 'لا تغيير'); xMarks(S.exams[x.xid]);
  };
}

/* ---------- تأدية الامتحان عن بعد ---------- */
let XT = null; const PX = { num: '', code: '', ex: {}, res: {} };
const xStop = () => { if (XT) { clearInterval(XT); XT = null; } };
{ const _go = go; go = function (v) { xStop(); if (v == 'exams') V.exams.x = ''; return _go(v); }; }
function runExam(x, who, submit) {
  xStop(); let left = (+x.m || 30) * 60, blur = 0, done = false;
  main.innerHTML = `<div class="panel xtimer"><div><h2>${esc(x.t)}</h2><p>${esc(who.name)} · <span class="code">${esc(who.num)}</span></p></div><span class="pill warn" id="tm"></span></div>
  <p class="mut">أجب عن كل الأسئلة ثم اضغط «سلّم الإجابات». يُسلَّم الامتحان تلقائيًا عند انتهاء الوقت. لا تغادر هذه الصفحة.</p>
  <form class="dl" id="xa">${x.q.map((q, i) => `<fieldset class="qq panel"><legend>${i + 1}. ${esc(q.q)}</legend>${q.o.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}</fieldset>`).join('')}
  <div class="tools"><button class="btn" type="submit">سلّم الإجابات</button></div></form>`;
  const draw = () => { const e = $('#tm'); if (e) e.textContent = '⏳ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); };
  const onBlur = () => { if (document.hidden && !done) blur++; };
  document.addEventListener('visibilitychange', onBlur);
  const finish = () => {
    if (done) return; done = true; xStop(); document.removeEventListener('visibilitychange', onBlur);
    const f = new FormData($('#xa')); submit(x.q.map((q, i) => f.get('q' + i) === null ? null : +f.get('q' + i)), blur);
  };
  draw(); XT = setInterval(() => { left--; draw(); if (left <= 0) finish(); }, 1000);
  $('#xa').onsubmit = e => { e.preventDefault(); const miss = x.q.filter((q, i) => !$('#xa').querySelector(`[name=q${i}]:checked`)).length; if (miss && !sure(e.submitter, `بقي ${miss} سؤالًا دون إجابة. اضغط مرة أخرى للتسليم`)) return; finish(); };
  window.scrollTo(0, 0);
}
const grade = (x, ans) => { let sc = 0; const wrong = []; x.q.forEach((q, i) => { if (ans[i] !== null && ans[i] === +q.a) sc++; else wrong.push(i + 1); }); return { sc, total: x.q.length, wrong }; };
function xDone(x, r) {
  main.innerHTML = `<div class="panel" style="text-align:center"><div class="cupwin">${r.sc / r.total >= .5 ? '🌟' : '🌱'}</div><h2>سُلّمت الإجابات</h2><p class="mut">${esc(x.t)}</p>
  <p style="font-size:34px;font-weight:800;margin:10px 0">${r.sc} من ${r.total}</p>${r.wrong && r.wrong.length ? `<p class="mut">راجع الأسئلة: ${r.wrong.join('، ')}</p>` : '<p>أحسنت! أجبت عن كل الأسئلة إجابة صحيحة.</p>'}
  <p class="mut">بارك الله فيك، ونفعك بما تعلّمت.</p><div class="tools" style="justify-content:center"><button class="btn" data-a="xPortal">رجوع إلى البوابة</button></div></div>` + footer();
}

/* جدول الامتحانات في بوابة الأولياء */
function parentExamsHTML(s) {
  const L = Object.values(S.exams).filter(x => !x.del && (!x.g || x.g == s.g)).sort(xSort); if (!L.length) return '';
  PX.ex = {}; PX.res = {}; L.forEach(x => { PX.ex[x.xid] = JSON.parse(JSON.stringify(x)); const r = (S.res[x.xid] || {})[s.num]; if (r) PX.res[x.xid] = r; });
  const t = today(), row = x => { const r = PX.res[x.xid], w = xWin(x), tot = x.kind == 'r' ? ((x.q || []).length || x.n || 0) : +x.max || 20;
    const st = r && r.sc != null ? `<span class="pill ok">${+r.sc} من ${+r.total || tot}</span>${r.note ? ' <small class="mut">' + esc(r.note) + '</small>' : ''}`
      : x.kind == 'r' ? (w == 0 ? `<button class="btn sm" data-a="xTake" data-x="${x.xid}">ابدأ الامتحان</button>` : w < 0 ? '<span class="mut">يُفتح في موعده</span>' : '<span class="mut">انتهى</span>')
      : (x.d < t ? '<span class="mut">بانتظار العلامة</span>' : '<span class="mut">في المسجد</span>');
    return `<tr${w == 0 ? ' class="now"' : ''}><td><b>${xWhen(x)}</b></td><td dir="ltr">${esc(x.time || '—')}</td><td>${esc(x.t)}</td><td>${xKind(x)}</td><td>${esc(xWhere(x))}</td><td>${st}</td></tr>`; };
  return `<div class="panel"><h3>📝 جدول الامتحانات</h3><div class="scroll"><table class="xt"><tr><th>اليوم</th><th>الساعة</th><th>الامتحان</th><th>النوع</th><th>المكان أو المدة</th><th>النتيجة</th></tr>${L.map(row).join('')}</table></div>
  <p class="mut" style="font-size:12.5px;margin-top:6px">الامتحان عن بعد يُفتح في ساعته ويبقى مفتوحًا مدته وساعة بعدها. يجيب الطالب وحده، مرة واحدة.</p></div>`;
}
{ const _ph = parentHTML; parentHTML = function (s) { PX.num = s.num; const h = _ph(s), x = parentExamsHTML(s), i = h.indexOf('<div class="grid g4">'); return i < 0 ? h + x : h.slice(0, i) + x + h.slice(i); }; }
{ const _vp = V.parent; V.parent = function () { _vp(); const f = $('#pl'); if (f && f.onsubmit) { const h = f.onsubmit; f.onsubmit = e => { PX.code = $('#p-code').value.trim().toUpperCase(); return h(e); }; } }; V.parent.html = ''; }

/* لوحة المعلم: الامتحانات القريبة */
{ const _d = V.dash; V.dash = function () { _d(); const t = today(), L = xMine().filter(x => x.d >= t && x.d <= addDays(t, 7)); if (!L.length) return;
  const p = document.createElement('div'); p.className = 'panel'; p.innerHTML = `<h3>📝 امتحانات هذا الأسبوع</h3>${xTable(L)}<div class="tools" style="margin-top:8px"><button class="btn ghost sm" data-v="exams">كل الامتحانات</button></div>`;
  const h = main.querySelector('.head'); h ? h.after(p) : main.prepend(p); }; }

const xMsg = x => `السلام عليكم ورحمة الله.\n📝 ${x.t}\nالفوج: ${xGrp(x)}\nالموعد: ${xWhen(x)}${x.time ? ' · الساعة ' + x.time : ''}\n` +
  (x.kind == 'r' ? `📱 امتحان عن بعد مدته ${+x.m || 30} دقيقة: يجيب الطالب من بوابة الأولياء برقم التسجيل ورمز الولي:\n${portalURL()}` : `🏫 امتحان حضوري في ${MOSQUE()}${x.room ? ' · ' + x.room : ''}.`) + '\nوفق الله أبناءنا.';

Object.assign(A5, {
  xNew() { xForm(); },
  xEdit(el) { xForm(S.exams[el.dataset.x]); },
  async xDel(el) { if (!sure(el)) return; await emit('exam', { xid: el.dataset.x, del: 1 }); toast('حُذف الامتحان'); V.exams(); },
  xMarks(el) { xMarks(S.exams[el.dataset.x]); window.scrollTo(0, 0); },
  xBack() { V.exams.x = ''; V.exams(); },
  xAnn(el) { const m = xMsg(S.exams[el.dataset.x]);
    dlg.innerHTML = `<div class="dl"><h2>📣 إعلان الامتحان للأولياء</h2><textarea id="xmsg" readonly style="min-height:200px">${esc(m)}</textarea><div class="tools"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(m)}" target="_blank" rel="noopener">أرسل بواتساب</a><button class="btn ghost" data-a="xCopy">انسخ</button><button class="btn ghost" data-a="close">إغلاق</button></div></div>`; dlg.showModal(); },
  xCopy() { copy($('#xmsg').value, 'نُسخ الإعلان'); },
  xTry(el) { const x = S.exams[el.dataset.x]; if (!x.q || !x.q.length) return toast('لا أسئلة');
    runExam(x, { name: 'تجربة المعلم', num: '—' }, ans => { const r = grade(x, ans); xDone(x, r); main.querySelector('[data-a="xPortal"]').outerHTML = '<button class="btn" data-a="xBack">رجوع إلى الامتحانات</button>'; }); },
  xPrint() { const L = xMine().filter(x => x.d >= today()); $('#print').innerHTML = `<h2>جدول الامتحانات · ${esc(MOSQUE())}</h2>` + xTable(L); window.print(); },
  xPrintRes(el) { const x = S.exams[el.dataset.x], R = S.res[x.xid] || {}, tot = x.kind == 'r' ? (x.q || []).length : +x.max || 20;
    $('#print').innerHTML = `<h2>${esc(x.t)} · ${esc(xGrp(x))}</h2><p>${xWhen(x)} · ${KIND[x.kind || 'h'][0]}</p><table><tr><th>الرقم</th><th>الطالب</th><th>العلامة (من ${tot})</th><th>ملاحظة</th></tr>${xStus(x).map(s => { const r = R[s.num] || {}; return `<tr><td>${esc(s.num)}</td><td>${esc(fullName(s))}</td><td>${r.sc ?? ''}</td><td>${esc(r.note || '')}</td></tr>`; }).join('')}</table>`; window.print(); },
  xPortal() { V.parent.html = PX.num && V.parent.html ? V.parent.html : ''; go('parent'); },
  xTake(el) {
    const x = PX.ex[el.dataset.x]; if (!x) return;
    if (PX.res[x.xid]) return toast('أجبتم عن هذا الامتحان');
    if (xWin(x) != 0) return toast('الامتحان غير مفتوح الآن');
    if (!x.q || !x.q.length) return toast('حدّثوا الصفحة وادخلوا من جديد لتحميل الأسئلة');
    const s = S.stu[PX.num], who = { name: s ? fullName(s) : PX.num, num: PX.num }, local = x.q[0].a !== undefined;
    const send = async (ans, blur) => {
      main.innerHTML = '<div class="panel">جارٍ إرسال الإجابات…</div>';
      try {
        let r;
        if (local) { r = grade(x, ans); await emit('res', { xid: x.xid, num: PX.num, sc: r.sc, total: r.total, blur, wrong: r.wrong, by: 'p' }); }
        else { r = await api(CFG.gs || META.gs, { action: 'answer', num: PX.num, code: PX.code, xid: x.xid, ans, blur });
          if (!r.ok) { toast({ done: 'أُرسلت إجابة هذا الطالب من قبل', closed: 'انتهى وقت الامتحان' }[r.err] || 'تعذر قبول الإجابة'); throw 'x'; } }
        PX.res[x.xid] = { sc: r.sc, total: r.total }; V.parent.html = V.parent.html.replace(`<button class="btn sm" data-a="xTake" data-x="${x.xid}">ابدأ الامتحان</button>`, `<span class="pill ok">${r.sc} من ${r.total}</span>`);
        xDone(x, r);
      } catch (e) {
        if (e == 'x') return go('parent');
        main.innerHTML = `<div class="panel dl"><h3>تعذّر الإرسال</h3><p>تحقّقوا من الإنترنت ثم أعيدوا الإرسال. الإجابات محفوظة في هذه الصفحة.</p><div class="tools"><button class="btn" id="xre">أعد الإرسال</button></div></div>`;
        $('#xre').onclick = () => send(ans, blur);
      }
    };
    runExam(x, who, send);
  }
});
GUIDE.splice(GUIDE.findIndex(g => g[1] == 'بوابة الأولياء'), 0,
 ['📝', 'الامتحانات وجدولها', [
  'من «الامتحانات» اضغط «امتحان جديد»: اكتب العنوان، واختر النوع (حضوري أو عن بعد) والفوج والتاريخ والساعة.',
  'الحضوري: حدّدوا القاعة والعلامة القصوى (20 مثلًا). يوم الامتحان افتحوا «رصد العلامات»، واكتبوا علامة كل طالب وملاحظة إن شئتم، ثم «احفظ العلامات».',
  'عن بعد: حدّدوا المدة، واكتبوا الأسئلة: كل سؤال في فقرة، السطر الأول السؤال ثم الخيارات، ونجمة * قبل الصحيح. زر «جرّبه» يعرضه كما يراه الطالب.',
  'كل الامتحانات القادمة تظهر في «جدول الامتحانات» مرتبة بالتاريخ والساعة، وفي الرئيسية امتحانات الأسبوع. «اطبع الجدول» يطبعه لتعليقه في المسجد.',
  'زر «📣 إعلان» يكتب رسالة جاهزة بالموعد والمكان أو رابط البوابة، تُرسل لمجموعة الأولياء بواتساب.',
  'بعد الامتحان: صفحة النتائج تعرض المعدل وأعلى وأدنى علامة، وزر «اطبع النتائج».']],
 ['📱', 'الامتحان عن بعد للطالب والولي', [
  'الولي يدخل «بوابة الأولياء» برقم التسجيل ورمز الولي، فيرى «جدول الامتحانات» لابنه مع النتائج.',
  'في ساعة الامتحان يظهر زر «ابدأ الامتحان». يبقى مفتوحًا مدة الامتحان وساعة بعدها، ويُجاب عنه مرة واحدة.',
  'عدّاد الوقت يُسلّم الإجابات تلقائيًا عند انتهائه. وتُحسب مرات مغادرة الصفحة وتظهر للمعلم.',
  'بعد ربط جدول Google تُصحَّح الإجابات هناك، فلا تصل الإجابات الصحيحة إلى هاتف الطالب، وتظهر النتيجة للمعلم وللولي.']]);
GUIDE.splice(GUIDE.findIndex(g => g[1] == 'الأمان والنسخ الاحتياطية'), 1,
 ['🔒', 'تشفير البيانات والنسخ الاحتياطية', [
  'بيانات الطلاب الحساسة مشفّرة بمعيار AES-256: هاتف الولي، تاريخ الميلاد، اسم الأب، الولي، البريد، رمز الولي، وصورة الطالب.',
  'تُشفَّر قبل أن تُحفظ أو تُرسل، فلا تظهر في جدول Google إلا «🔒 مشفّر». ويبقى الاسم واللقب ورقم التسجيل ظاهرة ليقرأ المسجد جدوله.',
  'مفتاح التشفير عند أجهزة الطاقم وحدها، وينتقل مع «رمز الربط». لذلك لا ترسلوا رمز الربط إلا لمعلم أو جهاز موثوق.',
  'رمز الولي لا يُحفظ في جدول Google أصلًا، بل بصمته فقط، يتحقق بها الجدول عند دخول الولي.',
  '«نزّل نسخة احتياطية» من الإعدادات تطلب كلمة سر تقفل الملف. احفظوها في مكان آمن: لا تُفتح النسخة دونها. انزلوا نسخة كل شهر.',
  'التشفير لا يغني عن قفل الهاتف: اجعلوا لأجهزة الطاقم قفلًا، واضغطوا «خروج من هذا الجهاز» إن استعمله غيركم. وغيّروا كلمات السر السهلة.']]);
GUIDE.push(
 ['🧪', 'الجولة التجريبية', [
  'رابط «جولة تجريبية» في أعلى الموقع يفتح نسخة ببيانات وهمية منفصلة تمامًا عن بيانات المسجد، ولا تُرسل إلى أي جدول.',
  'شريط الجولة فيه: «👪 جرّب بوابة الأولياء كولي» يفتحها بطالب تجريبي، و«🔑 عودة إلى لوحة المدير»، و«📘 الدليل».',
  'للدخول اليدوي: المدير 000000، والمعلم 111111، والولي برقم HN-0010 ورمز DEMO10. وفيها امتحان عن بعد مفتوح للتجربة.']],
 ['📷', 'مسح البطاقات دون إنترنت', [
  'بعد تثبيت المنصة كتطبيق وفتحها مرة واحدة بالإنترنت، تعمل كاميرا الهاتف لمسح البطاقات دون إنترنت، للحضور ولرجال الفجر.',
  'على أندرويد يعمل المسح الأصلي في Chrome، وعلى iPhone قارئ بديل مدمج. أول مرة يطلب الهاتف الإذن بالكاميرا: اختاروا «السماح».',
  'التسجيلات تُحفظ في الهاتف، وتُرسل وحدها إلى جدول المسجد عند عودة الاتصال.']]);

/* الإعدادات: لوحة حماية البيانات */
{ const _s = V.settings; V.settings = function () { _s(); if (!isAdmin()) return;
  const L = Object.values(S.stu), lk = L.filter(s => s.locked).length, p = document.createElement('div'); p.className = 'panel dl';
  p.innerHTML = `<h3>🔒 حماية البيانات</h3><p><span class="pill ok">التشفير مفعّل</span> AES-256-GCM · بصمة المفتاح <span class="code" dir="ltr">${esc(KID || '—')}</span></p>
  <p class="mut">هاتف الولي وتاريخ الميلاد واسم الأب والولي والبريد ورمز الولي والصورة تُحفظ وتُرسل مشفّرة، فلا تُقرأ في جدول Google ولا في ملفات الجهاز. المفتاح عند أجهزة الطاقم المربوطة وحدها.</p>
  ${lk ? `<p class="warnbox">${lk} طالبًا بياناتهم مشفّرة بمفتاح ليس على هذا الجهاز. اربطه برمز الربط الصحيح من جهاز المدير.</p>` : ''}`;
  const b = [...main.querySelectorAll('.panel h3')].find(h => h.textContent.includes('نسخة احتياطية')); b ? b.parentElement.before(p) : main.append(p); }; }

/* ---------- قفل الإعدادات التقنية (ربط جدول Google واسترجاع النسخ) برمز تقني ---------- */
{ const _s2 = V.settings; V.settings = function () { _s2(); if (!isAdmin()) return;
  const gp = [...main.querySelectorAll('.panel h3')].find(h => h.textContent.includes('قاعدة بيانات المسجد'));
  const imp = $('#imp'); const restore = imp && imp.closest('label');
  if (!gp) return; const panel = gp.parentElement;
  if (!S.cfg.tech) { const t = document.createElement('div'); t.className = 'tools'; t.style.marginTop = '10px'; t.innerHTML = '<button class="btn ghost sm" data-a="techSet">🔒 اقفل هذا القسم برمز تقني</button>'; panel.append(t); return; }
  if (V.settings.open) { const t = document.createElement('div'); t.className = 'tools'; t.style.marginTop = '10px'; t.innerHTML = '<span class="pill ok">مفتوح بالرمز التقني</span><button class="btn ghost sm" data-a="techLock">أعد القفل</button>'; panel.append(t); return; }
  panel.innerHTML = `<h3>قاعدة بيانات المسجد (جدول Google)</h3><p>${META.gs ? '<span class="pill ok">مربوطة</span> ' : ''}🔒 هذا القسم مقفل برمز تقني حتى لا يُغيَّر الربط بالخطأ.</p>
   <div class="tools">${META.gs ? '<button class="btn" data-a="showPair">📱 رمز ربط جهاز معلم</button><button class="btn ghost" data-a="syncNow">زامن الآن</button>' : ''}<button class="btn ghost" data-a="techOpen">🔓 فتح بالرمز التقني</button></div>`;
  if (restore) restore.hidden = true;
}; V.settings.open = false; }
{ const _go2 = go; go = function (v) { if (v != 'settings') V.settings.open = false; return _go2(v); }; }
Object.assign(A5, {
  techSet() { dlg.innerHTML = `<form class="dl" id="tf"><h2>🔒 رمز تقني</h2><p class="mut">يقفل قسم «جدول Google» واسترجاع النسخ الاحتياطية على كل أجهزة المسجد. يحفظه المسؤول التقني وحده.</p><label>الرمز (6 أحرف أو أرقام على الأقل)<input id="t1" type="password" minlength="6" required autocomplete="new-password"></label><label>أعده<input id="t2" type="password" minlength="6" required autocomplete="new-password"></label><div class="tools"><button class="btn" type="submit">اقفل</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`; dlg.showModal();
    $('#tf').onsubmit = async e => { e.preventDefault(); if ($('#t1').value != $('#t2').value) return toast('الرمزان غير متطابقين'); await emit('cfg', { tech: await hashPin($('#t1').value, 'tech') }); dlg.close(); V.settings.open = false; toast('قُفل القسم'); V.settings(); }; },
  techOpen() { dlg.innerHTML = `<form class="dl" id="tf"><h2>🔓 الرمز التقني</h2><label>الرمز<input id="t1" type="password" required autocomplete="current-password"></label><div class="tools"><button class="btn" type="submit">افتح</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`; dlg.showModal();
    $('#tf').onsubmit = async e => { e.preventDefault(); if (await hashPin($('#t1').value, 'tech') != S.cfg.tech) { toast('الرمز غير صحيح'); return; } dlg.close(); V.settings.open = true; V.settings(); }; },
  techLock() { V.settings.open = false; V.settings(); }
});
