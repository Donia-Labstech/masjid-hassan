'use strict';
/* ---------- إضافات: التوقيت، الحقوق، الغياب اليدوي، بوابة الأولياء، التصوير بالتتابع، رأيكم يهمنا ---------- */
const WD = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const wdOf = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 1) % 7; // 0 = السبت
const gDays = g => Array.isArray(g.wd) ? g.wd : String(g.days || '').includes('–') ? [0, 1, 2, 3, 4] : WD.map((x, i) => String(g.days || '').includes(x) ? i : -1).filter(i => i >= 0);
const daysLabel = g => { const a = gDays(g); return a.join() == '0,1,2,3,4' ? 'السبت – الأربعاء' : a.map(i => WD[i]).join('، ') || '—'; };
const mini = s => s.photo ? `<img class="mini" src="${s.photo}" alt="">` : `<span class="mini" aria-hidden="true">${esc((s.name || '؟').slice(0, 1))}</span>`;
const portalURL = () => location.origin + location.pathname + '#parent';
const CONTACT = 'contact@donialabstech.online';

/* القائمة: التسميع، الأفواج والتوقيت، الحقوق، رأيكم يهمنا */
(() => {
  const ren = (L, v, t) => { const x = L.find(n => n[0] == v); if (x) x[2] = t; };
  const ins = (L, after, item) => { const i = L.findIndex(n => n[0] == after); L.splice(i < 0 ? L.length : i + 1, 0, item); };
  ren(NAV.admin, 'recite', 'التسميع'); ren(NAV.teacher, 'recite', 'التسميع'); ren(NAV.admin, 'groups', 'الأفواج والتوقيت');
  ins(NAV.admin, 'cards', ['fees', '🧾', 'الحقوق', 'var(--gold)']);
  ins(NAV.teacher, 'recite', ['schedule', '🗓', 'التوقيت', 'var(--purple)']);
  NAV.admin.push(['feedback', '💬', 'رأيكم يهمنا', 'var(--warn)']); NAV.teacher.push(['feedback', '💬', 'رأيكم يهمنا', 'var(--warn)']);
})();

/* ---------- التوقيت الأسبوعي ---------- */
function scheduleHTML() {
  const G = Object.values(S.groups), slots = [...new Set(G.map(g => g.time || '—'))].sort();
  if (!G.length) return '';
  return `<div class="panel"><h3>الجدول الأسبوعي</h3><div class="scroll"><table class="sched"><tr><th>التوقيت</th>${WD.map(d => `<th>${d}</th>`).join('')}</tr>
  ${slots.map(t => `<tr><td><b>${esc(t)}</b></td>${WD.map((d, i) => { const c = G.filter(g => (g.time || '—') == t && gDays(g).includes(i)); return `<td>${c.map(g => `<span class="slot">${esc(g.n.replace(/^فوج /, ''))}${g.room ? ` <small>${esc(g.room)}</small>` : ''}</span>`).join('') || '<span class="mut">·</span>'}</td>`; }).join('')}</tr>`).join('')}</table></div></div>`;
}
V.schedule = function () {
  main.innerHTML = head('التوقيت', 'أيام الحلقات وأوقاتها وقاعاتها') + `<div class="grid g3">${myGroups().map(id => { const g = S.groups[id]; return `<div class="panel"><h3>${esc(g.n)}</h3><p>🗓 ${esc(daysLabel(g))}</p><p>⏰ ${esc(g.time || '')}${g.room ? ' · ' + esc(g.room) : ''}</p></div>`; }).join('') || '<div class="panel mut">لا أفواج مسندة إليك بعد.</div>'}</div>` + scheduleHTML();
};
{ const _g = V.groups; V.groups = function () { _g(); if (VIEW == 'groups' && isAdmin()) main.insertAdjacentHTML('beforeend', scheduleHTML()); }; }

/* ---------- الحضور والغياب: اليوم أو أي يوم سابق، مع الغياب اليدوي ---------- */
V.attend = function () {
  const gs = myGroups(), t = today(), sel = V.attend.g && gs.includes(V.attend.g) ? V.attend.g : (gs.length == 1 ? gs[0] : ''), d = V.attend.d && V.attend.d < t ? V.attend.d : t, live = d == t;
  const L = myStudents().filter(s => !sel || s.g == sel).sort((a, b) => a.num < b.num ? -1 : 1);
  const st = s => S.att[s.num] && S.att[s.num].has(d) ? 'p' : S.abs[s.num] && S.abs[s.num].has(d) ? 'a' : '';
  const P = L.filter(s => st(s) == 'p'), Ab = L.filter(s => st(s) == 'a'), U = L.filter(s => !st(s));
  const msg = s => encodeURIComponent(`السلام عليكم ورحمة الله. نُعلمكم أن ${fullName(s)} لم يحضر حلقة القرآن في ${MOSQUE()} يوم ${WD[wdOf(d)]} ${fmtD(d)}. نرجو أن يكون بخير، بارك الله فيكم.`);
  const wa = s => s.phone ? ` <a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(s.phone)}?text=${msg(s)}">أبلغ الولي</a>` : '';
  const row = (s, btns) => `<tr><td>${mini(s)}</td><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td>${btns}</td></tr>`;
  const D = `data-n` , q = s => `${D}="${esc(s.num)}" data-d="${d}"`;
  main.innerHTML = head('الحضور والغياب', `${WD[wdOf(d)]} ${fmtD(d)}${live ? '' : ' · تسجيل يدوي ليوم سابق'}`, `<div class="tools"><input type="date" id="ad" value="${d}" max="${t}" aria-label="اليوم"><select id="ag"><option value="">${isAdmin() ? 'كل الأفواج' : 'كل أفواجي'}</option>${gs.map(g => `<option value="${g}"${g == sel ? ' selected' : ''}>${esc(S.groups[g].n)}</option>`).join('')}</select></div>`) +
  (live ? scanBox('امسح البطاقة أو اكتب الرقم ثم Enter') : '') +
  `<div class="panel att3"><div class="head" style="margin-bottom:6px"><h3>لم يُسجَّلوا بعد (${U.length})</h3>${U.length ? `<button class="btn danger sm" data-a="absRest" data-d="${d}">سجّل الباقين غائبين</button>` : ''}</div><div class="scroll"><table>${U.map(s => row(s, `<div class="tools"><button class="btn sm" data-a="att" ${q(s)}>✔ حاضر</button><button class="btn danger sm" data-a="absM" ${q(s)}>✖ غائب</button><button class="btn ghost sm" data-a="absM" ${q(s)} data-w="1">غائب بعذر</button></div>`)).join('') || '<tr><td class="mut">سُجّل الجميع، بارك الله فيكم</td></tr>'}</table></div></div>
  <div class="grid g2 att3">
  <div class="panel"><h3 class="ok">حاضرون (${P.length})</h3><div class="scroll"><table>${P.map(s => row(s, `<button class="btn ghost sm" data-a="unAtt" ${q(s)}>إلغاء</button>`)).join('') || '<tr><td class="mut">لا أحد بعد</td></tr>'}</table></div></div>
  <div class="panel"><h3 class="bad">غائبون (${Ab.length})</h3><div class="scroll"><table>${Ab.map(s => { const w = S.abs[s.num].get(d); return row(s, `<div class="tools">${w ? `<span class="pill ok">بعذر</span>` : '<span class="pill bad">دون عذر</span>'}<button class="btn ghost sm" data-a="unAbs" ${q(s)}>إلغاء</button>${wa(s)}</div>`); }).join('') || '<tr><td class="mut">لا غياب مسجّل</td></tr>'}</table></div></div></div>`;
  $('#ag').onchange = e => { V.attend.g = e.target.value; V.attend(); };
  $('#ad').onchange = e => { V.attend.d = e.target.value; V.attend(); };
  if (live) bindScan();
};
V.attend.g = ''; V.attend.d = '';

/* ---------- الحقوق ---------- */
const MODES = { f: 'مجاني', m: 'شهري', t: 'فصلي', y: 'سنوي' };
const SY = () => { const t = today(), y = +t.slice(0, 4), m = +t.slice(5, 7); return m >= 9 ? y : y - 1; };
function periods(mode) {
  const sy = SY();
  if (mode == 'm') { const a = [], last = today().slice(0, 7); let y = sy, m = 9; while (a.length < 12) { const k = y + '-' + String(m).padStart(2, '0'); if (k > last) break; a.push({ k, l: MONTHS[m - 1] + ' ' + y }); if (++m > 12) { m = 1; y++; } } return a; }
  if (mode == 't') return ['الأول', 'الثاني', 'الثالث'].map((x, i) => ({ k: sy + '-t' + (i + 1), l: 'الفصل ' + x + ' ' + sy + '/' + (sy + 1) }));
  return [{ k: sy + '-y', l: 'السنة الدراسية ' + sy + '/' + (sy + 1) }];
}
const feeAmt = () => +(S.cfg.fee || {})[S.cfg.feeMode] || 0;
function receiptNo(num, k) { const all = []; for (const [n, m] of Object.entries(S.pay)) for (const [kk, v] of m) all.push([v.ts, n, kk]); all.sort((a, b) => a[0] - b[0]); return SY() + '-' + String(all.findIndex(x => x[1] == num && x[2] == k) + 1).padStart(4, '0'); }
V.fees = function () {
  if (!isAdmin()) return go('dash');
  const mode = S.cfg.feeMode || 'f', msel = `<select id="fm" aria-label="نظام الحقوق">${Object.entries(MODES).map(([k, v]) => `<option value="${k}"${mode == k ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
  if (mode == 'f') { main.innerHTML = head('الحقوق والوصولات', 'نظام الحقوق يحدده المسجد: مجاني، شهري، فصلي أو سنوي', `<div class="tools">${msel}</div>`) + `<div class="panel">الحلقات مجانية في هذا الإعداد، فلا حقوق تُحصَّل. غيّر النظام من القائمة أعلاه إن أردتم.</div>`; $('#fm').onchange = e => emit('cfg', { feeMode: e.target.value }).then(V.fees); return; }
  const P = periods(mode), k = P.some(p => p.k == V.fees.k) ? V.fees.k : (mode == 'm' ? P[P.length - 1].k : P[0].k), per = P.find(p => p.k == k), amt = feeAmt(), cur = S.cfg.cur || 'دج';
  const L = Object.values(S.stu).filter(s => !s.off && (!V.fees.g || s.g == V.fees.g)).sort((a, b) => a.num < b.num ? -1 : 1);
  const paid = s => S.pay[s.num] && S.pay[s.num].has(k), due = L.filter(s => !s.exempt), un = due.filter(s => !paid(s));
  const total = due.filter(paid).reduce((a, s) => a + (+S.pay[s.num].get(k).amt || 0), 0);
  const wmsg = s => encodeURIComponent(`السلام عليكم. تذكير من ${MOSQUE()}: حقوق ${per.l} للطالب ${fullName(s)} (${amt} ${cur}) لم تُسدَّد بعد. بارك الله فيكم.`);
  main.innerHTML = head('الحقوق والوصولات', per.l, `<div class="tools">${msel}<label class="inl">المبلغ <input id="famt" type="number" min="0" value="${amt}" style="width:110px"> ${esc(cur)}</label><select id="fp">${P.map(p => `<option value="${p.k}"${p.k == k ? ' selected' : ''}>${p.l}</option>`).join('')}</select><select id="fgr"><option value="">كل الأفواج</option>${Object.keys(S.groups).map(g => `<option value="${g}"${g == V.fees.g ? ' selected' : ''}>${esc(S.groups[g].n)}</option>`).join('')}</select></div>`) +
  `<div class="grid g4"><div class="panel stat" style="--c:var(--ok)"><b>${due.length - un.length}</b><span>سدّدوا</span></div><div class="panel stat" style="--c:var(--red)"><b>${un.length}</b><span>لم يسدّدوا</span></div><div class="panel stat" style="--c:var(--muted)"><b>${L.length - due.length}</b><span>معفَون</span></div><div class="panel stat" style="--c:var(--gold)"><b>${total}</b><span>المحصَّل (${esc(cur)})</span></div></div>
  <div class="panel scroll"><table><tr><th></th><th>الرقم</th><th>الطالب</th><th>الفوج</th><th>الحالة</th><th></th></tr>${L.map(s => `<tr><td>${mini(s)}</td><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td>${esc(gName(s.g))}</td>
  <td>${s.exempt ? '<span class="pill">معفى</span>' : paid(s) ? '<span class="pill ok">مسدَّد</span>' : '<span class="pill bad">غير مسدَّد</span>'}</td>
  <td class="nowrap">${s.exempt ? '' : paid(s) ? `<button class="btn ghost sm" data-a="rcpt" data-n="${esc(s.num)}" data-k="${k}">الوصل</button> <button class="btn ghost sm" data-a="unpay" data-n="${esc(s.num)}" data-k="${k}">إلغاء</button>` : `<button class="btn sm" data-a="pay" data-n="${esc(s.num)}" data-k="${k}">تسديد</button>${s.phone ? ` <a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(s.phone)}?text=${wmsg(s)}">تذكير</a>` : ''}`} <button class="btn ghost sm" data-a="exempt" data-n="${esc(s.num)}">${s.exempt ? 'إلغاء الإعفاء' : 'إعفاء'}</button></td></tr>`).join('') || '<tr><td>لا طلاب</td></tr>'}</table></div>`;
  $('#fm').onchange = e => emit('cfg', { feeMode: e.target.value }).then(V.fees);
  $('#famt').onchange = e => emit('cfg', { fee: Object.assign({}, S.cfg.fee, { [mode]: Math.max(0, +e.target.value || 0) }) }).then(() => { toast('حُفظ المبلغ'); V.fees(); });
  $('#fp').onchange = e => { V.fees.k = e.target.value; V.fees(); };
  $('#fgr').onchange = e => { V.fees.g = e.target.value; V.fees(); };
};
V.fees.k = ''; V.fees.g = '';
function receipt(num, k) {
  const s = S.stu[num], v = S.pay[num] && S.pay[num].get(k); if (!s || !v) return;
  const per = periods(S.cfg.feeMode).find(p => p.k == k) || { l: k };
  dlg.innerHTML = `<div class="dl"><div class="receipt" id="rc"><img src="logo.webp" alt="" width="64" height="64"><h2>وصل تسديد</h2><div>${esc(MOSQUE())} · ${esc(CFG.place || '')}</div>
  <dl><dt>رقم الوصل</dt><dd class="code">${receiptNo(num, k)}</dd><dt>الطالب</dt><dd>${esc(fullName(s))} (${esc(s.num)})</dd><dt>الفوج</dt><dd>${esc(gName(s.g))}</dd><dt>الفترة</dt><dd>${esc(per.l)}</dd><dt>المبلغ</dt><dd>${esc(v.amt)} ${esc(S.cfg.cur || 'دج')}</dd><dt>التاريخ</dt><dd>${fmtD(dstr(new Date(v.ts)))}</dd></dl><div class="waqf" style="padding:8px">وقف لله تعالى</div></div>
  <div class="tools"><button class="btn" data-a="printRc">طباعة الوصل</button><button class="btn ghost" data-a="close">إغلاق</button></div></div>`;
  if (!dlg.open) dlg.showModal();
}

/* ---------- رأيكم يهمنا ---------- */
V.feedback = function () {
  main.innerHTML = back() + head('رأيكم يهمنا', 'اقتراح، ملاحظة، أو شكوى: نقرؤها كلها') + `<form class="panel form" id="fb">
   <label>الاسم (اختياري)<input id="b-name" maxlength="60"></label>
   <label>الصفة<select id="b-role"><option>ولي</option><option>طالب</option><option>معلم</option><option>مصلٍّ</option><option>إمام أو مسؤول</option></select></label>
   <label>الموضوع<select id="b-to"><option value="m">${esc(THE())}: الحلقات والتنظيم</option><option value="p">المنصة: اقتراح لتطويرها</option></select></label>
   <label>للتواصل (اختياري)<input id="b-contact" maxlength="60" dir="ltr"></label>
   <label class="wide">رسالتكم<textarea id="b-text" required maxlength="1200"></textarea></label>
   <div class="wide tools"><button class="btn" type="submit">جهّز الرسالة</button></div></form><div class="panel" id="fbout" hidden></div>` + (META.me ? '' : footer());
  $('#fb').onsubmit = e => {
    e.preventDefault(); const v = id => $('#b-' + id).value.trim(), toM = v('to') == 'm';
    const msg = `${toM ? 'رسالة إلى ' + MOSQUE() : 'اقتراح لتطوير منصة ' + MOSQUE()}\nالاسم: ${v('name') || '—'}\nالصفة: ${v('role')}\nللتواصل: ${v('contact') || '—'}\n\n${v('text')}`;
    const o = $('#fbout'); o.hidden = false;
    const wa = toM && CFG.wa ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${waNum(CFG.wa)}?text=${encodeURIComponent(msg)}">أرسلها عبر واتساب</a>` : '';
    const mail = toM ? '' : `<a class="btn" href="mailto:${CONTACT}?subject=${encodeURIComponent('اقتراح لمنصة ' + MOSQUE())}&body=${encodeURIComponent(msg)}">أرسلها بالبريد</a>`;
    o.innerHTML = `<h3>رسالتكم جاهزة</h3><textarea id="fbmsg" readonly style="margin:10px 0;min-height:160px">${esc(msg)}</textarea><div class="tools">${wa}${mail}<button class="btn ghost" type="button" data-a="copyFb">انسخ الرسالة</button></div>${toM && !CFG.wa ? `<p class="mut" style="margin-top:8px">انسخ الرسالة وسلّمها لإدارة ${esc(THE())}.</p>` : ''}`;
    o.scrollIntoView({ behavior: 'smooth' });
  };
};

/* ---------- بوابة الأولياء ---------- */
function parentHTML(s) {
  const g = S.groups[s.g] || {}, ab = monthAbs(s), f = fajrStats(s.num), full = Math.floor(s.p / 8), kh = S.kh[s.num] || {};
  let cells = ''; for (let i = 0; i < 60; i++) cells += `<span class="${i < full ? (s.weak.includes(i) ? 'w' : 'm') : (i == full && s.p % 8 ? 'p' : '')}">${H(i)}</span>`;
  return `<div class="panel pcard"><div class="tools">${photo(s, 1)}<div><h2>${esc(fullName(s))}</h2><p><span class="code">${esc(s.num)}</span> · ${esc(g.n || '')}</p><p class="mut">🗓 ${esc(daysLabel(g))} · ⏰ ${esc(g.time || '')}${g.room ? ' · ' + esc(g.room) : ''}</p></div></div></div>
  <div class="grid g4"><div class="panel stat" style="--c:var(--ok)"><b>${ab.present}</b><span>حضور هذا الشهر</span></div><div class="panel stat" style="--c:var(--red)"><b>${ab.absent}</b><span>غيابات هذا الشهر${ab.excused ? ' (' + ab.excused + ' بعذر)' : ''}</span></div><div class="panel stat" style="--c:var(--emerald)"><b>${full}</b><span>حزبًا محفوظًا · ${esc(pos(s))}</span></div><div class="panel stat" style="--c:var(--purple)"><b>${f.cur}</b><span>أيام فجر متتالية · ${'🏆'.repeat(f.cups) || 'نحو الكأس'}</span></div></div>
  ${ab.list.length ? `<div class="panel"><h3>أيام الغياب هذا الشهر</h3><p>${ab.list.map(([d, w]) => `<span class="pill ${w ? 'ok' : 'bad'}" style="margin:3px">${WD[wdOf(d)]} ${fmtD(d)}${w ? ' · بعذر' : ''}</span>`).join('')}</p></div>` : ''}
  <div class="panel dawn"><h3 style="color:var(--gold2)">🌙 رجال الفجر</h3><div class="tools">${ring(f.cur)}<p>أيام متتالية: <b>${f.cur}</b> · بقي ${f.next} يومًا للكأس · مجموع أيام الحضور ${f.days} · النقاط <b>${f.pts}</b></p></div></div>
  <div class="panel"><h3 style="margin-bottom:8px">خريطة الحفظ</h3><div class="board">${cells}</div><p class="mut" style="font-size:12.5px;margin-top:6px">الأخضر محفوظ، والبرتقالي يحتاج مراجعة، والأزرق قيد الحفظ.</p></div>
  <div class="panel scroll"><h3>آخر حصص التسميع</h3><table><tr><th>التاريخ</th><th>النوع</th><th>المقطع</th><th>التقدير</th></tr>${(S.rec[s.num] || []).slice(0, 8).map(r => `<tr><td>${fmtD(dstr(new Date(r.ts)))}</td><td>${r.k == 'n' ? 'حفظ جديد' : 'مراجعة'}</td><td>الحزب ${H(r.i)}${r.th ? ' · الثُّمن ' + r.th : ''}</td><td>${GRADES[r.gr]}</td></tr>`).join('') || '<tr><td class="mut">لا توجد حصص مسجلة بعد</td></tr>'}</table></div>
  ${Object.keys(kh).length ? `<div class="panel"><h3>أوسمة الخُلق</h3><p>${KH.filter(k => kh[k[0]]).map(k => `<span class="pill" style="margin:3px">${k[1]} ${k[2]} × ${kh[k[0]]}</span>`).join('')}</p></div>` : ''}`;
}
V.parent = function () {
  if (V.parent.html) { main.innerHTML = back() + head('بوابة الأولياء', 'متابعة الحضور والحفظ وصلاة الفجر', '<button class="btn ghost sm" data-a="parentOut">خروج</button>') + V.parent.html + footer(); return; }
  main.innerHTML = back() + head('بوابة الأولياء', 'ادخلوا برقم التسجيل ورمز الولي اللذين سلّمتهما إدارة ' + esc(THE())) + `<form class="panel form lockw" id="pl">
   <label>رقم التسجيل<input id="p-num" placeholder="${esc((CFG.prefix || 'Q') + '-0001')}" required dir="ltr" autocomplete="username"></label>
   <label>رمز الولي<input id="p-code" required dir="ltr" autocomplete="current-password" maxlength="12"></label>
   <div class="wide tools"><button class="btn" type="submit">دخول</button></div></form>
   <p class="mut" style="font-size:13px">لا تملكون الرمز؟ اطلبوه من معلم الحلقة أو إدارة ${esc(THE())}.</p>` + footer();
  $('#pl').onsubmit = async e => {
    e.preventDefault(); const b = e.submitter, num = $('#p-num').value.trim().toUpperCase(), code = $('#p-code').value.trim().toUpperCase();
    const loc = S.stu[num]; if (loc && loc.code && loc.code == code && !loc.off) { V.parent.html = parentHTML(loc); return V.parent(); }
    const url = window.QS_DEMO ? '' : CFG.gs || META.gs; if (!url) return toast('الرقم أو الرمز غير صحيح');
    b.disabled = true; b.textContent = 'جارٍ التحقق…';
    try {
      const j = await api(url, { action: 'parent', num, code }); if (!j.ok) throw j.err || 'denied';
      const keepEV = EV; EV = j.events; rebuild(); const s = S.stu[num]; V.parent.html = s ? parentHTML(s) : ''; EV = keepEV; rebuild();
      if (!V.parent.html) throw 'denied'; V.parent();
    } catch (x) { b.disabled = false; b.textContent = 'دخول'; toast(x == 'denied' ? 'الرقم أو الرمز غير صحيح' : 'تعذر الاتصال. أعيدوا المحاولة'); }
  };
};
V.parent.html = '';

/* ---------- ترحيب بعد التسجيل وإرسال الرمز للولي ---------- */
function welcome(s) {
  dlg.innerHTML = `<div class="dl" style="text-align:center;align-items:center"><div class="cupwin">🌿</div><h2>سُجّل ${esc(fullName(s))}</h2><p class="mut">رقم التسجيل</p><p class="code" style="font-size:30px">${esc(s.num)}</p><p class="mut">رمز الولي لبوابة الأولياء: <span class="code">${esc(s.code)}</span></p>
  <div class="tools" style="justify-content:center"><button class="btn gold" data-a="shoot1" data-n="${esc(s.num)}">📸 صوّره الآن للبطاقة</button><button class="btn" data-a="sendCode" data-n="${esc(s.num)}">👪 أرسل الرقم والرمز للولي</button><button class="btn ghost" data-a="close">تم</button></div></div>`;
  if (!dlg.open) dlg.showModal();
}
const codeMsg = s => `السلام عليكم ورحمة الله. سُجّل ابنكم ${fullName(s)} في حلقات القرآن بـ${MOSQUE()}.\nرقم التسجيل: ${s.num}\nرمز الولي: ${s.code}\nلمتابعة الحضور والحفظ وصلاة الفجر: ${portalURL()}`;

/* ---------- التصوير بالتتابع ---------- */
let PH = null;
async function shootList(list, title) {
  if (!list.length) return toast('لا أحد في القائمة');
  PH = { list, i: 0, title, stream: null, facing: 'environment', done: 0 };
  dlg.innerHTML = `<div class="dl shoot"><div class="head"><div><h2>📸 ${esc(title)}</h2><p id="sh-p"></p></div><button class="btn ghost sm" data-a="close">إنهاء</button></div>
  <div class="shootbox"><video id="sh-v" playsinline muted autoplay></video><div class="sframe"></div><div id="sh-err" class="mut" hidden>تعذر فتح الكاميرا. اسمح للمتصفح باستعمالها، أو اختر صورة من ملف.</div></div>
  <div id="sh-who" class="shwho"></div>
  <div class="tools" style="justify-content:center"><button class="btn ghost" data-a="shPrev">→ السابق</button><button class="btn gold big" data-a="shSnap">📸 التقط</button><button class="btn ghost" data-a="shNext">تخطَّ ←</button></div>
  <div class="tools" style="justify-content:center"><button class="btn ghost sm" data-a="shFlip">🔄 الكاميرا الأمامية/الخلفية</button><label class="btn ghost sm">🖼 من ملف<input type="file" accept="image/*" id="sh-f" hidden></label></div>
  <p class="mut" style="font-size:12.5px;text-align:center">ضع وجه الطالب داخل الإطار ثم التقط. زر المسافة أو Enter يلتقط أيضًا، وتنتقل المنصة وحدها إلى الطالب الموالي.</p></div>`;
  if (!dlg.open) dlg.showModal();
  $('#sh-f').onchange = e => { const f = e.target.files[0]; if (f) readPhoto(f, shSave); e.target.value = ''; };
  shDraw(); await shCam();
}
function shStop() { if (PH && PH.stream) { PH.stream.getTracks().forEach(t => t.stop()); PH.stream = null; } }
async function shCam() {
  if (!PH) return; shStop(); const v = $('#sh-v');
  try { PH.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: PH.facing, width: { ideal: 720 } } }); v.srcObject = PH.stream; v.classList.toggle('mirror', PH.facing == 'user'); $('#sh-err').hidden = true; await v.play().catch(() => {}); }
  catch (e) { $('#sh-err').hidden = false; }
}
function shDraw() {
  if (!PH) return; const s = PH.list[PH.i];
  $('#sh-p').textContent = `${PH.i + 1} من ${PH.list.length} · صُوّر ${PH.done}`;
  $('#sh-who').innerHTML = `${photo(s)}<div><b>${esc(fullName(s))}</b><small class="code">${esc(s.num)}</small><small>${esc(gName(s.g))}${s.photo ? ' · له صورة، والتقاط جديدة يستبدلها' : ''}</small></div>`;
}
function shSnap() {
  const v = $('#sh-v'); if (!PH || !v || !v.videoWidth) return toast('الكاميرا غير جاهزة');
  const c = document.createElement('canvas'); c.width = 200; c.height = 250; const vw = v.videoWidth, vh = v.videoHeight, k = Math.min(vw / 4, vh / 5), w = k * 4, h = k * 5, x = c.getContext('2d');
  if (PH.facing == 'user') { x.translate(200, 0); x.scale(-1, 1); }
  x.drawImage(v, (vw - w) / 2, (vh - h) / 2, w, h, 0, 0, 200, 250); beep(true); shSave(c.toDataURL('image/jpeg', .72));
}
async function shSave(u) {
  if (!PH) return; const s = PH.list[PH.i]; await emit('stu', { num: s.num, photo: u }); PH.done++; PH.list[PH.i] = S.stu[s.num];
  if (PH.i < PH.list.length - 1) { PH.i++; shDraw(); }
  else { shStop(); const n = PH.done; PH = null; dlg.innerHTML = `<div class="dl" style="text-align:center;align-items:center"><div class="cupwin">📸</div><h2>اكتمل التصوير</h2><p>صُوّر ${n} طالبًا. تظهر الصور الآن في البطاقات والترتيب.</p><button class="btn" data-a="close">تم</button></div>`; }
}
dlg.addEventListener('close', () => { if (PH) { shStop(); PH = null; } if (['cards', 'fajr', 'students'].includes(VIEW)) V[VIEW](); });
document.addEventListener('keydown', e => { if (PH && dlg.open && (e.key == ' ' || e.key == 'Enter') && !(e.target.matches && e.target.matches('input,textarea,select,button'))) { e.preventDefault(); shSnap(); } });

/* ---------- الصفحة الرئيسية: منشور الأسبوع وبوابة الأولياء ---------- */
{ const _h = V.home; V.home = function () {
  _h(); const p = typeof weeklyPosts == 'function' && weeklyPosts()[0], t = main.querySelector('.tiles'); if (!t) return;
  t.insertAdjacentHTML('beforeend', `<button class="tile" style="--c:var(--purple)" data-v="parent"><i>👪</i><b>بوابة الأولياء</b><span>تابعوا حضور أبنائكم وحفظهم وصلاة الفجر</span></button>`);
  if (p) t.insertAdjacentHTML('beforebegin', `<section class="panel weekly"><span class="cat">🆕 منشور ${p.day} ${fmtD(p.d)} · ${esc(p.cat)}</span><h3>${esc(p.title)}</h3><div class="body">${postBody(p.body.slice(0, 1))}</div><div><button class="btn ghost sm" data-v="blog">اقرأ المنشور كاملًا</button></div></section>`);
}; }

/* ---------- تعديل الفوج: الأيام والتوقيت والقاعة ---------- */
const A5 = {
  editG(el) {
    const id = el.dataset.g, g = S.groups[id] || {}, T = Object.values(S.users).filter(u => u.role == 'teacher' && !u.off), on = id ? gDays(g) : [0, 1, 2, 3, 4];
    dlg.innerHTML = `<form class="dl" id="gf"><h2>${id ? 'تعديل الفوج' : 'فوج جديد'}</h2><div class="form"><label>اسم الفوج<input id="g-n" value="${esc(g.n)}" required></label><label>المستوى<input id="g-lvl" value="${esc(g.lvl)}"></label>
    <label>المعلم المسند<select id="g-t"><option value="">دون معلم</option>${T.map(u => `<option value="${u.uid}"${u.uid == g.t ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
    <label>التوقيت<input id="g-time" value="${esc(g.time || '17:00 – 18:30')}" dir="ltr"></label><label>القاعة<input id="g-room" value="${esc(g.room || '')}" placeholder="القاعة 1"></label>
    <div class="wide"><span class="mut" style="font-size:13px">أيام الحلقة</span><div class="checks">${WD.map((d, i) => `<label><input type="checkbox" value="${i}"${on.includes(i) ? ' checked' : ''}> ${d}</label>`).join('')}</div></div></div>
    <div class="tools"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button></div></form>`;
    dlg.showModal();
    $('#gf').onsubmit = async e => { e.preventDefault(); const v = k => $('#g-' + k).value.trim(), wd = [...dlg.querySelectorAll('.checks input:checked')].map(x => +x.value);
      if (!wd.length) return toast('اختر يومًا واحدًا على الأقل');
      const tmp = { wd }; await emit('group', { gid: id || uid(), n: v('n'), lvl: v('lvl'), t: v('t'), time: v('time'), room: v('room'), wd, days: daysLabel(tmp) }); dlg.close(); toast('حُفظ الفوج'); V.groups(); };
  },
  att(el) { attMark(el.dataset.n, el.dataset.d); },
  async unAtt(el) { await emit('att', { num: el.dataset.n, d: el.dataset.d || today(), x: 1 }); V.attend(); },
  async absM(el) { const n = el.dataset.n, d = el.dataset.d || today(); if (S.att[n] && S.att[n].has(d)) await emit('att', { num: n, d, x: 1 }); await emit('abs', { num: n, d, why: el.dataset.w ? 'مبرر' : '' }); V.attend(); },
  async unAbs(el) { await emit('abs', { num: el.dataset.n, d: el.dataset.d, x: 1 }); V.attend(); },
  async absRest(el) { if (!sure(el, 'تأكيد: سجّل الباقين غائبين')) return; const d = el.dataset.d; for (const b of [...main.querySelectorAll('[data-a="absM"]:not([data-w])')]) await emit('abs', { num: b.dataset.n, d, why: '' }); V.attend(); },
  async pay(el) { const n = el.dataset.n, k = el.dataset.k; await emit('pay', { num: n, k, amt: feeAmt() }); V.fees(); receipt(n, k); toast('سُجّل التسديد'); },
  async unpay(el) { if (!sure(el)) return; await emit('pay', { num: el.dataset.n, k: el.dataset.k, x: 1 }); V.fees(); },
  async exempt(el) { const s = S.stu[el.dataset.n]; await emit('stu', { num: s.num, exempt: !s.exempt }); V.fees(); },
  rcpt(el) { receipt(el.dataset.n, el.dataset.k); },
  printRc() { $('#print').innerHTML = $('#rc').outerHTML; window.print(); },
  copyFb() { copy($('#fbmsg').value); },
  parentOut() { V.parent.html = ''; V.parent(); },
  sendCode(el) { const s = S.stu[el.dataset.n]; if (!s.code) return; const m = codeMsg(s); if (s.phone) window.open('https://wa.me/' + waNum(s.phone) + '?text=' + encodeURIComponent(m), '_blank', 'noopener'); else copy(m, 'نُسخت رسالة الولي'); },
  shoot1(el) { shootList([S.stu[el.dataset.n]], 'صورة البطاقة'); },
  shootG(el) { const L = myStudents().filter(s => s.g == el.dataset.g && (!el.dataset.only || !s.photo)).sort((a, b) => a.num < b.num ? -1 : 1); shootList(L, 'تصوير ' + gName(el.dataset.g) + ' بالتتابع'); },
  shootF(el) { const L = ranking(isAdmin() ? null : myGroups()).map(r => r.s).filter(s => !el.dataset.only || !s.photo); shootList(L, 'تصوير رجال الفجر بالتتابع'); },
  shSnap() { shSnap(); },
  shNext() { if (PH && PH.i < PH.list.length - 1) { PH.i++; shDraw(); } else if (PH) dlg.close(); },
  shPrev() { if (PH && PH.i > 0) { PH.i--; shDraw(); } },
  shFlip() { if (!PH) return; PH.facing = PH.facing == 'user' ? 'environment' : 'user'; shCam(); }
};
