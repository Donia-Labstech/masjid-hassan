'use strict';
/* ---------- المسح: قارئ QR موصول أو الكاميرا ---------- */
let CAM = null, scanBuf = '', scanT = 0;
function parseCode(raw) { return String(raw || '').trim().replace(/^QS:/i, '').toUpperCase(); }
document.addEventListener('keydown', e => {
  if (!['attend', 'fajr'].includes(VIEW)) return;
  const t = e.target; if (t && t.matches && t.matches('input,textarea,select')) return;
  const now = Date.now(); if (now - scanT > 80) scanBuf = ''; scanT = now;
  if (e.key == 'Enter') { if (scanBuf.length >= 4) { onScan(scanBuf); scanBuf = ''; e.preventDefault(); } return; }
  if (e.key.length == 1) scanBuf += e.key;
});
function onScan(raw) { const n = parseCode(raw); if (!n) return; if (VIEW == 'fajr') fajrMark(n, false); else attMark(n); }
function scanBox(label) {
  return `<div class="panel scanbox"><input class="scaninput" id="scan" placeholder="${label}" autocomplete="off" inputmode="text">
  <div class="tools"><button class="btn gold" data-a="cam">📷 امسح بالكاميرا</button></div>
  <video class="cam" id="cam" hidden playsinline muted></video>
  <div id="flash"></div>
  <p class="mut" style="font-size:12.5px">قارئ الرموز الموصول بالحاسوب أو بالهاتف (USB أو Bluetooth) يعمل مباشرة: وجّهه إلى البطاقة.</p></div>`;
}
function bindScan() { const i = $('#scan'); if (!i) return; i.onkeydown = e => { if (e.key == 'Enter') { e.preventDefault(); onScan(i.value); i.value = ''; } }; if (matchMedia('(pointer:fine)').matches) i.focus(); }
function flash(ok, title, sub) { const f = $('#flash'); beep(ok); if (f) f.innerHTML = `<div class="flash ${ok ? 'good' : 'bad'}">${title}<small>${sub || ''}</small></div>`; else toast(title); }
function stopCam() { if (CAM) { CAM.getTracks().forEach(t => t.stop()); CAM = null; } }
async function startCam() {
  const v = $('#cam'); if (!v) return;
  if (CAM) { stopCam(); v.hidden = true; return; }
  try {
    CAM = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.srcObject = CAM; v.hidden = false; await v.play();
    let det = null; if ('BarcodeDetector' in window) try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {}
    if (!det && !window.jsQR) await loadScript(JSQR);
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true }); let last = '', lastT = 0;
    const loop = async () => {
      if (!CAM) return;
      try {
        let val = '';
        if (det) { const r = await det.detect(v); if (r[0]) val = r[0].rawValue; }
        else if (v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; x.drawImage(v, 0, 0); const r = jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height); if (r) val = r.data; }
        if (val && (val != last || Date.now() - lastT > 4000)) { last = val; lastT = Date.now(); onScan(val); }
      } catch (e) {}
      setTimeout(loop, 300);
    };
    loop();
  } catch (e) { stopCam(); v.hidden = true; toast('تعذر فتح الكاميرا. اسمح للمتصفح باستعمالها'); }
}

/* ---------- تسجيل الحضور والفجر ---------- */
function attMark(num) {
  const s = S.stu[num]; if (!s || s.off) return flash(false, 'رقم غير معروف: ' + esc(num));
  if (!isAdmin() && !myGroups().includes(s.g)) return flash(false, esc(fullName(s)), 'ليس في أفواجك');
  if (S.att[num] && S.att[num].has(today())) return flash(true, esc(fullName(s)), 'حضوره مسجّل من قبل');
  emit('att', { num, d: today(), name: fullName(s), g: s.g }).then(() => { V.attend(); flash(true, '✔ ' + esc(fullName(s)), 'حاضر · ' + esc(gName(s.g))); });
}
function fajrMark(num, man, day) {
  const s = S.stu[num]; if (!s || s.off) return flash(false, 'رقم غير معروف: ' + esc(num));
  const d = day || today();
  if (!man) { const w = fajrWindow(); if (!w.ok) return flash(false, 'خارج وقت الفجر', 'يُقبل المسح من ' + hm(w.from) + ' إلى ' + hm(w.to)); }
  if (S.fajr[num] && S.fajr[num].has(d)) return flash(true, esc(fullName(s)), 'حضوره للفجر مسجّل اليوم');
  const before = fajrStats(num).cups;
  emit('fajr', { num, d, t: hm(new Date()), man: man ? 1 : 0, name: fullName(s) }).then(() => {
    const st = fajrStats(num);
    if (VIEW == 'fajr') V.fajr();
    flash(true, '🌙 ' + esc(fullName(s)), `أيام متتالية: ${st.cur} · بقي ${st.next} للكأس · النقاط ${st.pts}`);
    if (st.cups > before) cupWin(s, st);
  });
}
function cupWin(s, st) {
  dlg.innerHTML = `<div class="dl" style="text-align:center;align-items:center"><div class="cupwin">🏆</div><h2>ما شاء الله تبارك الله</h2><p style="font-size:18px">${esc(fullName(s))} أتمّ ${S.cfg.cupDays} يومًا متتالية في صلاة الفجر</p><p class="cups">${'🏆'.repeat(st.cups)}</p><p class="mut">«بشّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة»</p><button class="btn gold" data-a="close">الحمد لله</button></div>`;
  dlg.showModal();
}

/* ---------- ملف الطالب ---------- */
const photo = (s, big) => s.photo ? `<img class="ph${big ? ' big' : ''}" src="${s.photo}" alt="">` : `<div class="ph${big ? ' big' : ''}" aria-hidden="true">${esc((s.name || '؟').slice(0, 1))}</div>`;
const H = i => 60 - i;
const pos = s => s.p >= 480 ? 'خاتم' : 'الحزب ' + H(Math.floor(s.p / 8)) + ' · الثُّمن ' + (s.p % 8 + 1);
function monthAbs(s) {
  const m = today().slice(0, 7), days = new Set();
  for (const o of Object.values(S.stu)) if (o.g == s.g && S.att[o.num]) for (const d of S.att[o.num]) if (d.startsWith(m)) days.add(d);
  const mine = S.att[s.num] ? [...S.att[s.num]].filter(d => d.startsWith(m)).length : 0;
  return { sessions: days.size, present: mine, absent: Math.max(0, days.size - mine) };
}
function studentHTML(s) {
  const full = Math.floor(s.p / 8), st = fajrStats(s.num), ab = monthAbs(s), kh = S.kh[s.num] || {}, adm = isAdmin();
  let cells = ''; for (let i = 0; i < 60; i++) cells += `<span class="${i < full ? (s.weak.includes(i) ? 'w' : 'm') : (i == full && s.p % 8 ? 'p' : '')}">${H(i)}</span>`;
  const wa = s.phone ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(s.phone)}">واتساب الولي</a>` : '';
  return `<div class="dl"><div class="head"><div class="tools">${photo(s, 1)}<div><h2>${esc(fullName(s))}</h2><p><span class="code">${esc(s.num)}</span> · ${esc(gName(s.g))}${s.birth ? ' · مواليد ' + esc(s.birth) : ''}<br>الأب: ${esc(s.father || '—')} · الولي: ${esc(s.guardian || '—')} · <span dir="ltr">${esc(s.phone || '')}</span></p></div></div><button class="btn ghost sm" data-a="close">إغلاق</button></div>
  <div class="tools">${adm ? `<button class="btn sm" data-a="editS" data-n="${esc(s.num)}">تعديل البيانات</button><label class="btn ghost sm">صورة البطاقة<input type="file" accept="image/*" data-photo="${esc(s.num)}" hidden></label><button class="btn ghost sm" data-a="manFajr" data-n="${esc(s.num)}">تسجيل فجر يدويًا</button>` : ''}${wa}</div>
  <div class="grid g4"><div class="panel stat" style="--c:var(--gold)"><b>${st.cur}</b><span>أيام فجر متتالية</span></div><div class="panel stat" style="--c:var(--purple)"><b>${st.cups}</b><span>كؤوس رجال الفجر</span></div><div class="panel stat" style="--c:var(--emerald)"><b>${st.pts}</b><span>النقاط</span></div><div class="panel stat" style="--c:var(--red)"><b>${ab.absent}</b><span>غيابات هذا الشهر</span></div></div>
  <div><h3 style="margin-bottom:8px">خريطة الحفظ · ${esc(pos(s))}</h3><div class="board">${cells}</div></div>
  <div><h3 style="margin-bottom:8px">أوسمة الخُلق</h3><div class="tools">${KH.map(k => `<button class="btn ghost sm" style="border-color:${k[3]};color:inherit" data-a="kh" data-n="${esc(s.num)}" data-k="${k[0]}">${k[1]} ${k[2]} <b>${kh[k[0]] || 0}</b></button>`).join('')}</div></div>
  <div class="scroll"><table><tr><th>التاريخ</th><th>النوع</th><th>المقطع</th><th>التقدير</th></tr>${(S.rec[s.num] || []).slice(0, 8).map(r => `<tr><td>${fmtD(dstr(new Date(r.ts)))}</td><td>${r.k == 'n' ? 'حفظ جديد' : 'مراجعة'}</td><td>الحزب ${H(r.i)}${r.th ? ' · الثُّمن ' + r.th : ''}</td><td>${GRADES[r.gr]}</td></tr>`).join('') || '<tr><td>لا توجد حصص مسجلة بعد</td></tr>'}</table></div></div>`;
}
const openS = n => { dlg.innerHTML = studentHTML(S.stu[n]); dlg.showModal(); };

/* ---------- نموذج التسجيل ---------- */
function nextNum() { const pre = (CFG.prefix || 'Q') + '-'; let m = 0; for (const k of Object.keys(S.stu)) if (k.startsWith(pre)) m = Math.max(m, +k.slice(pre.length) || 0); return pre + String(m + 1).padStart(4, '0'); }
function stuForm(s, req) {
  s = s || req || {}; const gs = Object.keys(S.groups);
  return `<form class="dl" id="sf"><h2>${S.stu[s.num] ? 'تعديل بيانات الطالب' : 'تسجيل طالب'}</h2><div class="form">
  <label>رقم التسجيل<input id="f-num" value="${esc(S.stu[s.num] ? s.num : nextNum())}" ${S.stu[s.num] ? 'readonly' : ''} required dir="ltr"></label>
  <label>الاسم<input id="f-name" value="${esc(s.name)}" required></label>
  <label>اللقب<input id="f-surname" value="${esc(s.surname)}" required></label>
  <label>تاريخ الميلاد<input id="f-birth" type="date" value="${esc(s.birth)}"></label>
  <label>اسم الأب<input id="f-father" value="${esc(s.father)}"></label>
  <label>رقم الهاتف<input id="f-phone" inputmode="tel" value="${esc(s.phone)}" dir="ltr"></label>
  <label>الولي<input id="f-guardian" value="${esc(s.guardian)}"></label>
  <label>البريد الإلكتروني<input id="f-email" type="email" value="${esc(s.email)}" dir="ltr"></label>
  <label>الفوج<select id="f-g">${gs.map(g => `<option value="${g}"${g == s.g ? ' selected' : ''}>${esc(S.groups[g].n)}</option>`).join('') || '<option value="">أنشئ فوجًا أولًا</option>'}</select></label>
  <label>الأحزاب المحفوظة عند الالتحاق<input id="f-hz0" type="number" min="0" max="60" value="${esc(s.hz0 || 0)}"></label>
  </div><div class="tools"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-a="close">إلغاء</button>${S.stu[s.num] ? `<button class="btn danger" type="button" data-a="offS" data-n="${esc(s.num)}">إيقاف الطالب</button>` : ''}</div></form>`;
}
function openForm(s, req) {
  dlg.innerHTML = stuForm(s, req); dlg.showModal();
  $('#sf').onsubmit = async e => {
    e.preventDefault(); const v = k => $('#f-' + k).value.trim(), num = v('num').toUpperCase();
    if (!S.stu[s && s.num] && S.stu[num]) return toast('هذا الرقم مستعمل');
    const d = { num, name: v('name'), surname: v('surname'), birth: v('birth'), father: v('father'), phone: v('phone'), guardian: v('guardian'), email: v('email'), g: v('g'), hz0: Math.min(60, Math.max(0, +v('hz0') || 0)) };
    if (!S.stu[num]) d.code = uid().slice(-6).toUpperCase();
    await emit('stu', d); if (req) await emit('reqdone', { rid: req.rid, st: 'ok' });
    dlg.close(); toast('حُفظ الطالب ' + num); V[VIEW]();
  };
}

/* ---------- المدونة: نصوص ثابتة مراجعة ---------- */
const POSTS = [
 ['الصلاة', 'صلاة الفجر نور يومك', [
  'قال الله تعالى: ﴿أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾ [الإسراء: 78].',
  'وقال النبي ﷺ: «من صلّى الصبح فهو في ذمة الله» رواه مسلم.',
  'نصيحة عملية: نم مبكرًا، واجعل المنبّه بعيدًا عن سريرك، واتفق مع صديق تمرّ عليه في طريقك إلى المسجد.']],
 ['الصلاة', 'بشرى المشّائين في الظلام', [
  'قال النبي ﷺ: «بشّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة» رواه أبو داود والترمذي.',
  'كل خطوة في ظلمة الفجر إلى المسجد لها شأن عند الله. فاحتسب خطاك، وامشِ بسكينة ووقار.']],
 ['الصلاة', 'ركعتان خير من الدنيا', [
  'قال النبي ﷺ: «ركعتا الفجر خير من الدنيا وما فيها» رواه مسلم.',
  'هذا في سنّة الفجر وحدها، فكيف بالفريضة في جماعة؟ احرص على أن تصل قبل الإقامة لتصليهما.']],
 ['الصلاة', 'القليل الدائم', [
  'قال النبي ﷺ: «أحبّ الأعمال إلى الله أدومها وإن قلّ» متفق عليه.',
  'المواظبة على الفجر أربعين يومًا ليست سباقًا قصيرًا، بل عادة تبنيها لتبقى معك العمر كله.']],
 ['الأخلاق', 'إنما بُعث ليتمّم الأخلاق', [
  'قال النبي ﷺ: «إنما بُعثتُ لأتمّم صالح الأخلاق» رواه أحمد.',
  'حامل القرآن يُعرف بصدقه وأمانته وحسن كلامه قبل أن يُعرف بكثرة حفظه.']],
 ['الأخلاق', 'برّ الوالدين', [
  'قال الله تعالى: ﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ [الإسراء: 23].',
  'ابدأ يومك بالسلام على والديك وتقبيل يديهما، واسألهما: هل تحتاجان شيئًا قبل أن أخرج؟']],
 ['التلاحم', 'كالجسد الواحد', [
  'قال النبي ﷺ: «مثل المؤمنين في توادّهم وتراحمهم وتعاطفهم مثل الجسد، إذا اشتكى منه عضو تداعى له سائر الجسد بالسهر والحمّى» متفق عليه.',
  'إذا غاب زميلك عن الحلقة فاسأل عنه، وإذا تعثّر في حفظه فأعنه ولا تسخر منه.']],
 ['التلاحم', 'واعتصموا بحبل الله', [
  'قال الله تعالى: ﴿وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا﴾ [آل عمران: 103].',
  'المسجد بيت الجميع. نتعاون على الخير، ونترك الخلاف، ونقدّم الكلمة الطيبة.']],
 ['القرآن', 'خيركم من تعلّم القرآن وعلّمه', [
  'قال النبي ﷺ: «خيركم من تعلّم القرآن وعلّمه» رواه البخاري.',
  'إذا حفظت آية فعلّمها أخاك الصغير، فأنت بذلك معلّم ومتعلّم معًا.']]
];
function postsHTML() {
  const extra = S.posts.map(p => [p.cat || 'من المسجد', p.title, String(p.body || '').split('\n').filter(Boolean), p.pid]);
  return [...extra, ...POSTS].map((p, i) => `<details class="post"${i ? '' : ' open'}><summary><span class="cat">${esc(p[0])}</span><h3>${esc(p[1])}</h3></summary><div class="body">${p[2].map(x => `<p>${esc(x).replace(/﴿[^﴾]+﴾/g, m => `<span class="q">${m}</span>`)}</p>`).join('')}${p[3] && isAdmin() ? `<div><button class="btn danger sm" data-a="delPost" data-p="${esc(p[3])}">حذف</button></div>` : ''}</div></details>`).join('');
}

