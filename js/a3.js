'use strict';
/* ---------- الواجهات ---------- */
let VIEW = '';
const NAV = {
  admin: [['dash', '🏠', 'الرئيسية', 'var(--emerald)'], ['students', '🎓', 'الطلاب', 'var(--teal)'], ['reqs', '📨', 'طلبات التسجيل', 'var(--blue)'], ['attend', '📋', 'الحضور', 'var(--blue)'], ['fajr', '🌙', 'رجال الفجر', 'var(--purple)'], ['recite', '📖', 'متابعة الحفظ', 'var(--gold)'], ['groups', '👥', 'الأفواج والمعلمون', 'var(--purple)'], ['cards', '🪪', 'البطاقات', 'var(--blue)'], ['blog', '🌿', 'المدونة', 'var(--teal)'], ['ai', '💡', 'المساعد', 'var(--purple)'], ['settings', '⚙️', 'الإعدادات', 'var(--muted)']],
  teacher: [['dash', '🏠', 'أفواجي', 'var(--emerald)'], ['attend', '📋', 'الحضور', 'var(--blue)'], ['fajr', '🌙', 'رجال الفجر', 'var(--purple)'], ['recite', '📖', 'متابعة الحفظ', 'var(--gold)'], ['students', '🎓', 'طلابي', 'var(--teal)'], ['cards', '🪪', 'البطاقات', 'var(--blue)'], ['blog', '🌿', 'المدونة', 'var(--teal)'], ['ai', '💡', 'المساعد', 'var(--purple)'], ['settings', '⚙️', 'حسابي', 'var(--muted)']]
};
const footer = () => `<div class="waqf"><b>وقف لله تعالى</b><p>${WAQF}</p></div><div class="foot">${esc(MOSQUE())} · ${esc(CFG.place || '')}${CFG.supervisor ? ' · المشرف: ' + esc(CFG.supervisor.name) : ''}<span class="credit">تطوير donialabstech</span></div>`;
function go(v) {
  stopCam(); dirty = false;
  const pub = !META.me || !ME();
  $('#nav').hidden = pub; $('#shell').classList.toggle('pub', pub);
  $('#pubnav').hidden = !pub || v == 'scr'; $('#pubnav').querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.v == v));
  if (pub) { if (!['home', 'join', 'blog', 'login', 'setup', 'pair', 'parent', 'feedback', 'guide'].includes(v)) v = 'home'; }
  else { const N = NAV[ME().role] || NAV.teacher; if (!N.some(n => n[0] == v) && v != 'scr') v = 'dash';
    $('#nav').innerHTML = N.map(n => `<button data-v="${n[0]}" style="--c:${n[3]}" aria-current="${n[0] == v}"><i>${n[1]}</i>${n[2]}${n[0] == 'reqs' && pendingReqs() ? ` <span class="pill bad">${pendingReqs()}</span>` : ''}</button>`).join('') + `<div class="who">${esc(ME().name)} · ${ME().role == 'admin' ? 'المدير' : 'معلم'}</div>`; }
  VIEW = v; V[v](); try { history.replaceState(null, '', '#' + v); } catch (e) {} window.scrollTo(0, 0); syncBadge(navigator.onLine ? 'on' : 'off');
}
const back = () => META.me && ME() ? '' : '<div class="back"><button class="btn ghost sm" data-v="home">→ رجوع إلى الرئيسية</button></div>';
const pendingReqs = () => Object.values(S.reqs).filter(r => r.st == 'new').length;

const V = {
/* ----- العام ----- */
home() {
  main.innerHTML = `<section class="hero"><div class="in"><img src="logo.webp" alt=""><div><h1>${esc(MOSQUE())}</h1><p>${esc(CFG.place || '')}</p><p class="motto">«خيركم من تعلّم القرآن وعلّمه»</p></div></div></section>
  ${timesStrip() ? `<div><h3 class="sec" style="margin-bottom:10px">أوقات الصلاة اليوم · ${esc(place().name)}</h3>${timesStrip()}</div>` : ''}
  <section class="dawn"><div class="moon"></div><small>${hijri()}</small><h2>رجال الفجر</h2><p class="q">﴿إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾</p><p class="hd">قال ﷺ: «بشّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة»</p><p style="margin-top:8px">من يحضر صلاة الفجر في المسجد ${S.cfg.cupDays} يومًا متتالية ينال كأس «رجال الفجر»، ثم تتواصل النقاط والترتيب لجائزة رجال الفجر.</p></section>
  <div class="tiles">
   <button class="tile" style="--c:var(--gold)" data-v="join"><i>📝</i><b>احجز مقعدًا لابنك</b><span>نموذج تسجيل يُرسل إلى إدارة ${esc(THE())}</span></button>
   <button class="tile" style="--c:var(--teal)" data-v="blog"><i>🌿</i><b>المدونة</b><span>الصلاة، الأخلاق، والتلاحم</span></button>
   <button class="tile" style="--c:var(--emerald)" data-v="login"><i>🔑</i><b>دخول الطاقم</b><span>الإدارة والمعلمون</span></button>
  </div>${footer()}`;
},
join() {
  const url = window.QS_DEMO ? '' : CFG.gs || META.gs, wa = waNum(CFG.wa || '');
  main.innerHTML = back() + head('حجز مقعد في حلقات القرآن', 'املأ النموذج، وتتصل بك إدارة ' + esc(THE()) + ' لتأكيد التسجيل') +
  `<form class="panel form" id="jf">
   <label>الاسم<input id="j-name" required maxlength="60"></label><label>اللقب<input id="j-surname" required maxlength="60"></label>
   <label>تاريخ الميلاد<input id="j-birth" type="date"></label><label>اسم الأب<input id="j-father" maxlength="60"></label>
   <label>رقم الهاتف<input id="j-phone" required inputmode="tel" dir="ltr" maxlength="20"></label><label>الولي<input id="j-guardian" maxlength="60"></label>
   <label>البريد الإلكتروني (اختياري)<input id="j-email" type="email" dir="ltr" maxlength="80"></label><label>ملاحظة (اختياري)<input id="j-note" maxlength="80"></label>
   <div class="wide tools"><button class="btn gold big" type="submit">${url ? 'أرسل الطلب' : 'أرسل الطلب عبر واتساب'}</button></div></form>` + footer();
  $('#jf').onsubmit = async e => {
    e.preventDefault(); const b = e.submitter;
    const data = {}; ['name', 'surname', 'birth', 'father', 'phone', 'guardian', 'email', 'note'].forEach(k => data[k] = $('#j-' + k).value.trim());
    const done = how => { main.innerHTML = back() + `<div class="panel" style="text-align:center"><div class="cupwin">🌿</div><h2>${how}، بارك الله فيكم</h2><p>تتصل بكم الإدارة على الرقم <span dir="ltr">${esc(data.phone)}</span>.</p></div>` + footer(); };
    if (!url) {
      const L = [['الاسم', data.name], ['اللقب', data.surname], ['تاريخ الميلاد', data.birth], ['اسم الأب', data.father], ['الهاتف', data.phone], ['الولي', data.guardian], ['البريد', data.email], ['ملاحظة', data.note]].filter(x => x[1]).map(x => x[0] + ': ' + x[1]);
      const text = encodeURIComponent('السلام عليكم. طلب حجز مقعد في حلقات القرآن · ' + MOSQUE() + '\n' + L.join('\n'));
      window.open('https://wa.me/' + (wa || '') + '?text=' + text, '_blank', 'noopener'); return done('جُهّز طلبكم في واتساب');
    }
    b.disabled = true; b.textContent = 'جارٍ الإرسال…';
    try { const j = await api(url, { action: 'request', data }); if (!j.ok) throw 0; done('وصل طلبكم'); }
    catch (x) { b.disabled = false; b.textContent = 'أرسل الطلب'; toast('تعذر الإرسال. تحقق من الاتصال وأعد المحاولة'); }
  };
},
blog() { main.innerHTML = back() + head('المدونة', 'في المحافظة على الصلاة، والأخلاق، والتلاحم') + (isAdmin() ? '<div><button class="btn" data-a="newPost">مقال جديد</button></div>' : '') + `<div class="panel">${postsHTML()}</div><p class="mut" style="font-size:12.5px">النصوص مكتوبة ومراجَعة يدويًا، ولا يكتبها الذكاء الاصطناعي. يُستحسن أن يراجع إمام ${esc(THE())} كل مقال قبل نشره.</p>` + (META.me ? '' : footer()); },
login() {
  const us = Object.values(S.users).filter(u => !u.off);
  if (!us.length) return V.setup();
  main.innerHTML = back() + `<form class="panel dl lock" id="lf"><h2>دخول الطاقم</h2><label class="form"><span class="mut">الاسم</span><select id="l-u">${us.map(u => `<option value="${u.uid}">${esc(u.name)} · ${u.role == 'admin' ? 'المدير' : 'معلم'}</option>`).join('')}</select></label>
  <label class="form"><span class="mut">كلمة السر</span><input id="l-p" type="password" autocomplete="current-password" required></label>
  <div class="tools"><button class="btn" type="submit">دخول</button><button class="btn ghost" type="button" data-v="pair">ربط هذا الجهاز بقاعدة المسجد</button></div></form>`;
  $('#lf').onsubmit = async e => { e.preventDefault(); const u = S.users[$('#l-u').value]; const h = await hashPin($('#l-p').value, u.uid);
    if (h !== u.pin) return toast('الرمز غير صحيح'); META.me = u.uid; persist(); toast('السلام عليكم ' + u.name); go('dash'); queueSync(); };
},
setup() {
  main.innerHTML = back() + `<div class="panel dl lock"><h2>تهيئة المنصة</h2><p class="mut">لا يوجد حساب على هذا الجهاز بعد.</p>
  <form class="dl" id="sf"><h3>إنشاء حساب المدير</h3><label class="form"><span class="mut">الاسم</span><input id="s-n" required></label>
  <label class="form"><span class="mut">رمز سري (6 أحرف أو أرقام على الأقل)</span><input id="s-p" type="password" minlength="6" required autocomplete="new-password"></label>
  <label class="form"><span class="mut">أعده للتأكيد</span><input id="s-p2" type="password" minlength="6" required autocomplete="new-password"></label>
  <button class="btn" type="submit">أنشئ الحساب</button></form><hr style="border:0;border-top:1px solid var(--line);width:100%"><button class="btn ghost" data-v="pair">هذا جهاز إضافي: اربطه بقاعدة المسجد</button></div>`;
  $('#sf').onsubmit = async e => { e.preventDefault(); if ($('#s-p').value !== $('#s-p2').value) return toast('الرمزان غير متطابقين');
    const id = uid(); META.me = id; await emit('user', { uid: id, name: $('#s-n').value.trim(), role: 'admin', pin: await hashPin($('#s-p').value, id) });
    await emit('cfg', { commune: CFG.commune || null }); toast('أُنشئ حساب المدير'); go('groups'); };
},
pair() {
  main.innerHTML = `<form class="panel dl lock" id="pf"><h2>ربط هذا الجهاز</h2><p class="mut">ألصق «رمز الربط» الذي يظهر عند المدير في الإعدادات، ثم ادخل باسمك ورمزك.</p>
  <textarea id="p-c" dir="ltr" required placeholder="MQ2-…" style="min-height:80px"></textarea><div class="tools"><button class="btn" type="submit">اربط</button><button class="btn ghost" type="button" data-v="login">رجوع</button></div></form>`;
  $('#pf').onsubmit = async e => { e.preventDefault(); let d; try { d = JSON.parse(b64d($('#p-c').value.trim().replace(/^MQ[12]-/, ''))); } catch (x) {}
    if (!Array.isArray(d) || !/^https:\/\/script\.google\.com\//.test(d[0] || '')) return toast('رمز الربط غير صحيح');
    toast('جارٍ جلب بيانات المسجد…');
    try { const j = await api(d[0], { action: 'ping', key: d[1] }); if (!j.ok) throw 0; } catch (x) { return toast('تعذر الاتصال بقاعدة المسجد. تحقق من الرمز والإنترنت'); }
    META.gs = d[0]; META.key = d[1]; META.seq = 0;
    if (Array.isArray(d[2]) && d[2].length) { META.dks = [...(META.dks || []).filter(k => !d[2].includes(k)), ...d[2]]; await keysInit(); }
    persist(); await sync(); await decAll(); rebuild(); toast('رُبط الجهاز'); go('login'); };
},

/* ----- الطاقم ----- */
dash() {
  const L = myStudents(), t = today(), pres = L.filter(s => S.att[s.num] && S.att[s.num].has(t)), fj = L.filter(s => S.fajr[s.num] && S.fajr[s.num].has(t));
  const top = ranking(isAdmin() ? null : myGroups()).slice(0, 5), gs = myGroups();
  main.innerHTML = `<section class="hero" style="min-height:190px"><div class="in"><img src="logo.webp" alt=""><div><h1 style="font-size:clamp(20px,3.6vw,28px)">السلام عليكم ${esc(ME().name)}</h1><p>${fmtD(t)} · ${hijri()}</p><p class="motto">«خيركم من تعلّم القرآن وعلّمه»</p></div></div></section>
  ${timesStrip()}
  <div class="grid g4"><div class="panel stat" style="--c:var(--teal)"><b>${L.length}</b><span>${isAdmin() ? 'طالبًا مسجّلًا' : 'طالبًا في أفواجك'}</span></div><div class="panel stat" style="--c:var(--blue)"><b>${pres.length}</b><span>حاضرون اليوم</span></div><div class="panel stat" style="--c:var(--purple)"><b>${fj.length}</b><span>في صلاة الفجر اليوم</span></div>${isAdmin() ? `<div class="panel stat" style="--c:var(--red)"><b>${pendingReqs()}</b><span>طلبات تسجيل جديدة</span></div>` : `<div class="panel stat" style="--c:var(--gold)"><b>${gs.length}</b><span>أفواجك</span></div>`}</div>
  <div class="grid g2"><div class="panel"><h3>${isAdmin() ? 'الأفواج' : 'أفواجي المسندة'}</h3><div class="scroll"><table><tr><th>الفوج</th><th>المعلم</th><th>التوقيت</th><th>العدد</th><th>حاضر اليوم</th></tr>${gs.map(g => { const m = L.filter(s => s.g == g); return `<tr><td>${esc(S.groups[g].n)}</td><td>${esc((S.users[S.groups[g].t] || {}).name || '—')}</td><td>${esc(daysLabel(S.groups[g]))} · ${esc(S.groups[g].time || '')}${S.groups[g].room ? ' · ' + esc(S.groups[g].room) : ''}</td><td>${m.length}</td><td>${m.filter(s => S.att[s.num] && S.att[s.num].has(t)).length}</td></tr>`; }).join('') || '<tr><td>لا توجد أفواج بعد</td></tr>'}</table></div></div>
  <div class="panel dawn"><h3 style="color:var(--gold2)">🌙 صدارة رجال الفجر</h3>${top.map((r, i) => `<p>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${esc(fullName(r.s))} · <b>${r.pts}</b> نقطة · ${'🏆'.repeat(r.cups)}</p>`).join('') || '<p>لم يُسجّل حضور للفجر بعد.</p>'}<div style="margin-top:10px"><button class="btn gold sm" data-v="fajr">افتح رجال الفجر</button></div></div></div>`;
},
students() {
  let q = '', g = '';
  main.innerHTML = head(isAdmin() ? 'الطلاب' : 'طلابي', 'اضغط على الطالب لفتح ملفه', `<div class="tools"><input id="q" type="search" placeholder="ابحث بالاسم أو الرقم"><select id="fg"><option value="">كل الأفواج</option>${myGroups().map(x => `<option value="${x}">${esc(S.groups[x].n)}</option>`).join('')}</select>${isAdmin() ? '<button class="btn" data-a="newS">تسجيل طالب</button><button class="btn ghost" data-a="csv">تصدير CSV</button>' : ''}</div>`) + '<div class="panel scroll"><table id="tb"></table></div>';
  const draw = () => { const L = myStudents().filter(s => (!g || s.g == g) && (fullName(s) + s.num).includes(q)).sort((a, b) => a.num < b.num ? -1 : 1);
    $('#tb').innerHTML = '<tr><th>الرقم</th><th>الاسم واللقب</th><th>الفوج</th><th>الهاتف</th><th>الحفظ</th><th>الفجر</th></tr>' + (L.map(s => { const f = fajrStats(s.num); return `<tr class="click" data-s="${esc(s.num)}"><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td>${esc(gName(s.g))}</td><td dir="ltr">${esc(s.phone || '')}</td><td>${Math.floor(s.p / 8)} حزبًا</td><td>${f.cur} 🌙 ${'🏆'.repeat(f.cups)}</td></tr>`; }).join('') || '<tr><td>لا يوجد طلاب</td></tr>'); };
  draw(); $('#q').oninput = e => { q = e.target.value.trim(); draw(); }; $('#fg').onchange = e => { g = e.target.value; draw(); };
},
reqs() {
  const R = Object.values(S.reqs).sort((a, b) => b.ts - a.ts);
  main.innerHTML = head('طلبات التسجيل', 'تصل من نموذج الحجز في الصفحة العامة') + `<div class="panel scroll"><table><tr><th>التاريخ</th><th>الاسم واللقب</th><th>الميلاد</th><th>الأب</th><th>الهاتف</th><th>الولي</th><th>الحالة</th><th></th></tr>${R.map(r => `<tr><td>${fmtD(dstr(new Date(r.ts)))}</td><td>${esc(r.name + ' ' + (r.surname || ''))}</td><td>${esc(r.birth || '')}</td><td>${esc(r.father || '')}</td><td dir="ltr">${esc(r.phone)}</td><td>${esc(r.guardian || '')}</td><td>${r.st == 'new' ? '<span class="pill warn">جديد</span>' : r.st == 'ok' ? '<span class="pill ok">سُجّل</span>' : '<span class="pill bad">مرفوض</span>'}</td><td>${r.st == 'new' ? `<button class="btn sm" data-a="okReq" data-r="${esc(r.rid)}">سجّله</button> <button class="btn danger sm" data-a="noReq" data-r="${esc(r.rid)}">رفض</button>` : ''}</td></tr>`).join('') || '<tr><td>لا توجد طلبات</td></tr>'}</table></div>`;
},
attend() {
  const gs = myGroups(), sel = V.attend.g && gs.includes(V.attend.g) ? V.attend.g : (gs.length == 1 ? gs[0] : ''), t = today();
  const L = myStudents().filter(s => !sel || s.g == sel), P = L.filter(s => S.att[s.num] && S.att[s.num].has(t)), A = L.filter(s => !P.includes(s));
  const msg = s => encodeURIComponent(`السلام عليكم ورحمة الله. نُعلمكم أن ${fullName(s)} لم يحضر اليوم حلقة القرآن في ${MOSQUE()}. نرجو أن يكون بخير، بارك الله فيكم.`);
  main.innerHTML = head('الحضور والغياب', fmtD(t), `<select id="ag"><option value="">${isAdmin() ? 'كل الأفواج' : 'كل أفواجي'}</option>${gs.map(g => `<option value="${g}"${g == sel ? ' selected' : ''}>${esc(S.groups[g].n)}</option>`).join('')}</select>`) + scanBox('امسح البطاقة أو اكتب الرقم ثم Enter') +
  `<div class="grid g2"><div class="panel"><h3 class="ok">حاضرون (${P.length})</h3><div class="scroll"><table>${P.map(s => `<tr><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td><button class="btn ghost sm" data-a="unAtt" data-n="${esc(s.num)}">إلغاء</button></td></tr>`).join('') || '<tr><td class="mut">لا أحد بعد</td></tr>'}</table></div></div>
  <div class="panel"><h3 class="bad">لم يحضروا (${A.length})</h3><div class="scroll"><table>${A.map(s => `<tr><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td><button class="btn sm" data-a="att" data-n="${esc(s.num)}">حاضر</button>${s.phone ? ` <a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(s.phone)}?text=${msg(s)}">أبلغ الولي</a>` : ''}</td></tr>`).join('') || '<tr><td class="mut">الجميع حاضر، ما شاء الله</td></tr>'}</table></div></div></div>`;
  $('#ag').onchange = e => { V.attend.g = e.target.value; V.attend(); }; bindScan();
},
fajr() {
  const w = fajrWindow(), t = today(), gs = isAdmin() ? null : myGroups(), R = ranking(V.fajr.g ? [V.fajr.g] : gs), T = Object.values(S.stu).filter(s => S.fajr[s.num] && S.fajr[s.num].has(t));
  const pod = R.slice(0, 3), C = S.cfg.cupDays;
  main.innerHTML = `<section class="dawn"><div class="moon"></div><small>${fmtD(t)} · ${hijri()}</small><h2>رجال الفجر</h2>
  <p class="q">﴿إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾</p><p class="hd">قال رسول الله ﷺ: «بشّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة»</p>
  <div class="tools" style="margin-top:12px"><span class="pill">الفجر ${hm(w.fajr)}</span><span class="pill">الشروق ${hm(w.sunrise)}</span><span class="pill">${esc(place().name)}</span><span class="pill" style="background:${w.ok ? '#22865A66' : '#B5402F66'}">${S.cfg.lock ? (w.ok ? 'المسح مفتوح الآن' : 'المسح مغلق: يُفتح ' + hm(w.from)) : 'قيد الوقت معطّل'}</span><button class="btn gold sm" data-v="scr">🖥 شاشة المسجد</button></div></section>
  ${scanBox('امسح بطاقة الطالب عند دخوله لصلاة الفجر')}
  <div class="panel"><h3>حضروا الفجر اليوم (${T.length})</h3><p>${T.map(s => `<span class="pill" style="margin:3px">${esc(fullName(s))} · ${S.fajr[s.num].get(t).t || ''}</span>`).join('') || '<span class="mut">لا أحد بعد</span>'}</p></div>
  <div class="head"><h3 class="sec">ترتيب جائزة رجال الفجر</h3><div class="tools"><select id="fg"><option value="">${isAdmin() ? 'كل الطلاب' : 'كل أفواجي'}</option>${myGroups().map(g => `<option value="${g}"${g == V.fajr.g ? ' selected' : ''}>${esc(S.groups[g].n)}</option>`).join('')}</select><button class="btn ghost sm" data-a="printRank">طباعة الترتيب</button><button class="btn gold sm" data-a="shootF" data-only="1">📸 صوّر من لا صورة له</button><button class="btn ghost sm" data-a="shootF">📸 تصوير الكل بالتتابع</button></div></div>
  ${pod.length ? `<div class="podium">${[pod[1], pod[0], pod[2]].map((r, i) => r ? `<div class="p${[2, 1, 3][i]}"><span class="medal">${['🥈', '🥇', '🥉'][i]}</span>${photo(r.s)}<span class="nm">${esc(fullName(r.s))}</span>${r.pts} نقطة<br>${'🏆'.repeat(r.cups)}</div>` : '<div></div>').join('')}</div>` : ''}
  <div class="panel scroll" id="rank"><table><tr><th>#</th><th>الطالب</th><th>الفوج</th><th>المتتالية</th><th>نحو الكأس</th><th>الكؤوس</th><th>أيام الحضور</th><th>النقاط</th></tr>${R.map((r, i) => `<tr class="click" data-s="${esc(r.s.num)}"><td>${i + 1}</td><td><span class="who2">${mini(r.s)} ${esc(fullName(r.s))}</span></td><td>${esc(gName(r.s.g))}</td><td>${r.cur}</td><td><div class="tools">${ring(r.cur)}<span class="mut">${r.cur && r.cur % S.cfg.cupDays == 0 ? 'كأس جديدة 🏆' : 'بقي ' + r.next}</span></div></td><td class="cups">${'🏆'.repeat(r.cups) || '—'}</td><td>${r.days}</td><td><b>${r.pts}</b></td></tr>`).join('') || '<tr><td>لا ترتيب بعد</td></tr>'}</table></div>
  <p class="mut" style="font-size:13px">القاعدة: كل ${C} يومًا متتالية من حضور الفجر = كأس. الغياب يومًا واحدًا يعيد عدّ الأيام المتتالية إلى الصفر، ولا تضيع الكؤوس والنقاط السابقة. النقاط: ${S.cfg.ptsDay} لكل يوم حضور، و${S.cfg.ptsCup} لكل كأس.</p>`;
  $('#fg').onchange = e => { V.fajr.g = e.target.value; V.fajr(); }; bindScan();
},
scr() {
  $('#nav').hidden = true; $('#shell').classList.add('pub');
  const R = ranking().slice(0, 10), t = today(), n = Object.values(S.stu).filter(s => S.fajr[s.num] && S.fajr[s.num].has(t)).length, w = fajrWindow();
  main.innerHTML = `<section class="dawn" style="min-height:80vh;font-size:20px"><div class="moon"></div><div class="head"><div><h2 style="font-size:40px">رجال الفجر</h2><small>${esc(MOSQUE())} · ${fmtD(t)} · ${hijri()}</small></div><button class="btn gold sm" data-v="fajr">رجوع</button></div>
  <p class="q" style="font-size:34px">﴿إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾</p><p>حضر الفجر اليوم: <b style="font-size:30px;color:var(--gold2)">${n}</b> · الفجر ${hm(w.fajr)}</p>
  <table style="color:#FFF3D6;font-size:22px">${R.map((r, i) => `<tr><td>${['🥇', '🥈', '🥉'][i] || i + 1}</td><td><span class="who2">${mini(r.s)} ${esc(fullName(r.s))}</span></td><td>${'🏆'.repeat(r.cups)}</td><td>${r.cur} يومًا</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
  <p class="hd" style="margin-top:16px">«بشّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة»</p></section>`;
  clearTimeout(V.scr.t); V.scr.t = setTimeout(() => { if (VIEW == 'scr') V.scr(); }, 20000);
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
},
recite() {
  const gs = myGroups(); if (!gs.length) { main.innerHTML = head('التسميع', '') + '<div class="panel">لا توجد أفواج مسندة إليك بعد.</div>'; return; }
  const g = gs.includes(V.recite.g) ? V.recite.g : gs[0], rv = V.recite.k == 'r';
  const revOf = s => { const f = Math.floor(s.p / 8); if (!f) return null; return s.weak.length ? s.weak[0] : (Math.floor(Date.now() / 864e5) + s.num.length) % f; };
  main.innerHTML = head('التسميع', rv ? 'المنصة تقترح لكل طالب حزب مراجعة، وتبدأ بما ضعف عنده' : 'ضغطة واحدة تسجّل التسميع وتنقل الطالب إلى الثُّمن الموالي', `<div class="tools"><select id="rg">${gs.map(x => `<option value="${x}"${x == g ? ' selected' : ''}>${esc(S.groups[x].n)}</option>`).join('')}</select><select id="rk"><option value="n">حفظ جديد</option><option value="r"${rv ? ' selected' : ''}>مراجعة</option></select></div>`) +
  `<div class="panel">${myStudents().filter(s => s.g == g).map(s => { const r = revOf(s), can = rv ? r !== null : s.p < 480;
    return `<div class="rec"><div><b class="click" data-s="${esc(s.num)}" style="cursor:pointer">${esc(fullName(s))}</b><div class="mut" style="font-size:13px">${rv ? (r === null ? 'لا محفوظ للمراجعة بعد' : 'مراجعة: الحزب ' + H(r) + (s.weak.includes(r) ? ' (ضعيف)' : '')) : pos(s)}</div></div><div class="gr">${can ? GRADES.map((x, i) => `<button class="btn ${i == 3 ? 'ghost' : ''} sm" data-a="rec" data-n="${esc(s.num)}" data-g="${i}"${rv ? ` data-i="${r}"` : ''}>${x}</button>`).join('') : '<span class="pill ok">خاتم</span>'}</div></div>`; }).join('') || '<p class="mut">لا طلاب في هذا الفوج.</p>'}</div>`;
  $('#rg').onchange = e => { V.recite.g = e.target.value; V.recite(); }; $('#rk').onchange = e => { V.recite.k = e.target.value; V.recite(); };
},
groups() {
  if (!isAdmin()) return go('dash');
  const T = Object.values(S.users).filter(u => u.role == 'teacher');
  main.innerHTML = head('الأفواج والتوقيت', 'كل معلم يرى الأفواج المسندة إليه فقط، والجدول الأسبوعي أسفل الصفحة', '<div class="tools"><button class="btn" data-a="newG">فوج جديد</button><button class="btn gold" data-a="newT">معلم جديد</button></div>') +
  `<div class="grid g3">${Object.entries(S.groups).map(([id, g]) => `<div class="panel"><h3>${esc(g.n)}</h3><p class="mut">${esc(g.lvl || '')}</p><p>👤 ${esc((S.users[g.t] || {}).name || 'دون معلم')}</p><p>🗓 ${esc(daysLabel(g))}</p><p>⏰ ${esc(g.time || '')}${g.room ? ' · ' + esc(g.room) : ''}</p><p class="mut">${Object.values(S.stu).filter(s => !s.off && s.g == id).length} طالبًا</p><div class="tools"><button class="btn ghost sm" data-a="editG" data-g="${id}">تعديل</button></div></div>`).join('') || '<div class="panel mut">ابدأ بإنشاء أول فوج.</div>'}</div>
  <h3 class="sec">المعلمون</h3><div class="panel scroll"><table><tr><th>المعلم</th><th>الهاتف</th><th>أفواجه</th><th>الحالة</th><th></th></tr>${T.map(u => `<tr><td>${esc(u.name)}</td><td dir="ltr">${esc(u.phone || '')}</td><td>${Object.values(S.groups).filter(g => g.t == u.uid).map(g => esc(g.n)).join('، ') || '—'}</td><td>${u.off ? '<span class="pill bad">موقوف</span>' : '<span class="pill ok">نشط</span>'}</td><td><button class="btn ghost sm" data-a="editT" data-u="${u.uid}">تعديل</button></td></tr>`).join('') || '<tr><td>لا يوجد معلمون بعد</td></tr>'}</table></div>`;
},
cards() {
  const gs = myGroups(), g = gs.includes(V.cards.g) ? V.cards.g : gs[0];
  main.innerHTML = head('بطاقات الطلاب', 'رمز QR على كل بطاقة يُمسح للحضور ولصلاة الفجر', `<div class="tools"><select id="cg">${gs.map(x => `<option value="${x}"${x == g ? ' selected' : ''}>${esc(S.groups[x].n)}</option>`).join('')}</select>${g ? `<button class="btn" data-a="shootG" data-g="${g}" data-only="1">📸 صوّر من لا صورة له</button><button class="btn ghost" data-a="shootG" data-g="${g}">📸 تصوير الفوج بالتتابع</button>` : ''}<button class="btn gold" data-a="printCards">طباعة البطاقات</button></div>`) +
  `<div class="grid g3" id="cardsGrid">${myStudents().filter(s => s.g == g).map(s => `<div class="card"><header><img src="logo.webp" alt="">${esc(MOSQUE())}</header><div class="in">${photo(s)}<div><b>${esc(fullName(s))}</b><small class="code">${esc(s.num)}</small><small>${esc(gName(s.g))}</small><small>رجل من رجال الفجر بإذن الله</small></div><div class="qr">${qrSvg('QS:' + s.num)}</div></div><footer>وقف لله تعالى</footer></div>`).join('') || '<div class="panel mut">لا طلاب في هذا الفوج.</div>'}</div>`;
  if ($('#cg')) $('#cg').onchange = e => { V.cards.g = e.target.value; V.cards(); };
},
ai() {
  const t = today(), gs = isAdmin() ? null : myGroups(), L = myStudents();
  const Q = {
   'من غاب اليوم؟': () => { const a = L.filter(s => !(S.att[s.num] && S.att[s.num].has(t))); return a.length ? a.map(s => fullName(s) + ' (' + gName(s.g) + ')').join('، ') : 'لا غياب مسجّل اليوم.'; },
   'من اقترب من كأس رجال الفجر؟': () => { const r = ranking(gs).filter(x => x.cur > 0 && x.next <= 10); return r.length ? r.map(x => `${fullName(x.s)}: بقي ${x.next} أيام`).join(' · ') : 'لا أحد على بعد عشرة أيام أو أقل من الكأس.'; },
   'من انقطع عن الفجر؟': () => { const r = ranking(gs).filter(x => x.cur == 0 && x.last && x.last >= addDays(t, -7)); return r.length ? r.map(x => fullName(x.s) + ' (آخر حضور ' + fmtD(x.last) + ')').join('، ') + '. كلمة تشجيع لطيفة قد تعيده.' : 'لا أحد انقطع خلال الأسبوع الأخير.'; },
   'صدارة رجال الفجر': () => ranking(gs).slice(0, 10).map((x, i) => `${i + 1}. ${fullName(x.s)} (${x.pts})`).join(' · ') || 'لا ترتيب بعد.',
   'من يحتاج مراجعة؟': () => { const r = L.filter(s => s.weak.length >= 2); return r.length ? r.map(s => `${fullName(s)}: الأحزاب ${s.weak.map(H).join('، ')}`).join(' · ') : 'لا أحزاب ضعيفة مسجّلة.'; }
  };
  main.innerHTML = head('المساعد', 'يجيب من بيانات ' + esc(THE()) + ' فقط') + `<div class="panel dl"><p>هذا المساعد لا يُفتي، ولا يفسّر، ولا يجيب عن أسئلة الدين، ولا يكتب نصًّا قرآنيًا. يعرض أرقام المسجد كما هي، وما سواها يُسأل عنه الإمام.</p><div class="tools">${Object.keys(Q).map(k => `<button class="btn ghost" data-q="${k}">${k}</button>`).join('')}</div><div class="panel" id="ans" style="background:var(--bg)">اختر سؤالًا.</div></div>`;
  main.querySelectorAll('[data-q]').forEach(b => b.onclick = () => $('#ans').textContent = Q[b.dataset.q]());
},
settings() {
  const me = ME(), adm = isAdmin(), c = S.cfg, code = META.gs ? pairCode() : '';
  main.innerHTML = head(adm ? 'الإعدادات' : 'حسابي', '') +
  `<div class="panel dl"><h3>حسابي</h3><p>${esc(me.name)} · ${adm ? 'المدير' : 'معلم'}</p><div class="tools"><button class="btn ghost" data-a="myPin">تغيير رمزي السري</button><button class="btn danger" data-a="logout">خروج من هذا الجهاز</button></div></div>` +
  (adm ? `<div class="panel dl"><h3>البلدية ووقت الفجر</h3><p class="mut">أوقات الصلاة تُحسب من إحداثيات البلدية بزاوية 18° للفجر. قد تختلف دقيقة أو دقيقتين عن رزنامة الوزارة.</p>
  <div class="form"><label>الولاية<select id="w"><option>جارٍ التحميل…</option></select></label><label>البلدية<select id="cm"></select></label></div>
  <p>البلدية الحالية: <b>${esc(place().name)}</b> · الفجر اليوم ${hm(fajrWindow().fajr)}</p>
  <h3>قواعد رجال الفجر</h3><div class="form" id="fr">
   <label>أيام الكأس المتتالية<input id="r-cupDays" type="number" min="7" max="120" value="${c.cupDays}"></label>
   <label>نقاط كل يوم حضور<input id="r-ptsDay" type="number" min="0" value="${c.ptsDay}"></label>
   <label>نقاط كل كأس<input id="r-ptsCup" type="number" min="0" value="${c.ptsCup}"></label>
   <label>يُفتح المسح قبل الأذان بـ (دقائق)<input id="r-before" type="number" min="0" max="60" value="${c.before}"></label>
   <label>قيد وقت الفجر<select id="r-lock"><option value="1"${c.lock ? ' selected' : ''}>مفعّل: من الأذان إلى الشروق</option><option value="0"${c.lock ? '' : ' selected'}>معطّل</option></select></label></div></div>
  <div class="panel dl"><h3>قاعدة بيانات المسجد (جدول Google)</h3>
  ${META.gs ? `<p><span class="pill ok">مربوطة</span> ${lastSync ? 'آخر مزامنة ' + new Date(lastSync).toLocaleTimeString('en-GB', { timeZone: TZ }) : ''}</p><p class="mut">لربط جهاز آخر (هاتف معلم أو هاتف الباب): افتح المنصة فيه، ثم «ربط هذا الجهاز»، وألصق هذا الرمز. لا تشاركه إلا مع الطاقم.</p>
  <div class="tools"><button class="btn" data-a="copyPair">انسخ رمز الربط</button><button class="btn ghost" data-a="showPair">اعرضه كرمز QR</button><button class="btn ghost" data-a="syncNow">زامن الآن</button></div>` :
  `<p class="mut">الآن تُحفظ البيانات في هذا الجهاز وحده. اربطها بجدول Google للمسجد لتظهر على كل الأجهزة.</p><div class="tools"><button class="btn gold" data-a="gsGuide">اربط بجدول Google</button></div>`}</div>
  <div class="panel dl"><h3>نسخة احتياطية مشفّرة</h3><p class="mut">تُقفل النسخة بكلمة سر تختارها، ولا تُفتح إلا بها. احفظ كلمة السر في مكان آمن: إن ضاعت لا يمكن فتح النسخة.</p><div class="tools"><button class="btn ghost" data-a="backup">نزّل نسخة احتياطية</button><label class="btn ghost">استرجاع نسخة<input type="file" id="imp" accept=".json,application/json" hidden></label></div></div>` : '');
  if (!adm) return;
  $('#fr').onchange = e => { const k = e.target.id.slice(2), v = e.target.value; emit('cfg', { [k]: k == 'lock' ? v == '1' : +v }).then(() => toast('حُفظ')); };
  $('#imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(async t => { let d = JSON.parse(t);
    if (d.c && d.s) { const pw = prompt('كلمة سر النسخة الاحتياطية'); if (!pw) return; try { d = await openBox(d, pw); } catch (x) { return toast('كلمة السر غير صحيحة'); } }
    if (!Array.isArray(d.events)) throw 0;
    if (Array.isArray(d.dks)) { META.dks = [...d.dks.filter(k => !(META.dks || []).includes(k)), ...(META.dks || [])]; await keysInit(); }
    let n = 0; for (const x of d.events) if (!EVM.has(x.id)) { await decEv(x); EV.push(x); EVM.set(x.id, x); META.unsent.push(x.id); n++; }
    await encMigrate(); rebuild(); persist(); queueSync(); toast('استُرجع ' + n + ' سجلًا'); V.settings(); }).catch(() => toast('الملف غير صالح')); };
  geo();
}
};
V.attend.g = ''; V.fajr.g = ''; V.recite.g = ''; V.recite.k = 'n'; V.cards.g = '';

