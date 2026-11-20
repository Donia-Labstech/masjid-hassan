'use strict';
/* ---------- المشرف، توزيع بوابة الأولياء، دليل الاستخدام ---------- */
const SUP = CFG.supervisor || null;
const supLine = () => SUP && SUP.name ? `<div class="sup"><span>👤 المشرف: <b>${esc(SUP.name)}</b></span>${SUP.phone ? `<a class="btn ghost sm" href="tel:${esc(SUP.phone)}" dir="ltr">📞 ${esc(SUP.phone)}</a><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(SUP.phone)}">💬 واتساب</a>` : ''}</div>` : '';

/* القائمة: بوابة الأولياء (للطاقم) ودليل الاستخدام */
(() => {
  const ins = (L, after, item) => { const i = L.findIndex(n => n[0] == after); L.splice(i < 0 ? L.length : i + 1, 0, item); };
  ins(NAV.admin, 'cards', ['portal', '👪', 'بوابة الأولياء', 'var(--purple)']);
  ins(NAV.teacher, 'cards', ['portal', '👪', 'بوابة الأولياء', 'var(--purple)']);
  NAV.admin.push(['guide', '📘', 'دليل الاستخدام', 'var(--blue)']); NAV.teacher.push(['guide', '📘', 'دليل الاستخدام', 'var(--blue)']);
})();

/* الصفحة الرئيسية: أزرار بارزة للأولياء والدليل، وبطاقة المشرف */
{ const _h = V.home; V.home = function () {
  _h();
  const hero = main.querySelector('.hero .in > div');
  if (hero) hero.insertAdjacentHTML('beforeend', `<div class="tools herobtn"><button class="btn gold" data-v="parent">👪 بوابة الأولياء</button><button class="btn" data-v="join">📝 احجز مقعدًا</button><button class="btn ghost" data-v="guide">📘 دليل الاستخدام</button></div>`);
  const t = main.querySelector('.tiles'); if (t && SUP) t.insertAdjacentHTML('afterend', `<div class="panel">${supLine()}</div>`);
}; }
{ const _f = V.login; V.login = function () { _f(); if (VIEW == 'login' && !META.me) main.insertAdjacentHTML('beforeend', `<p class="mut" style="text-align:center">هل أنت وليّ؟ <button class="btn ghost sm" data-v="parent">👪 ادخل بوابة الأولياء</button></p>`); }; }
{ const _j = V.join; V.join = function () { _j(); if (SUP) { const f = main.querySelector('#jf'); if (f) f.insertAdjacentHTML('afterend', `<div class="panel">${supLine()}</div>`); } }; }
{ const _p = V.parent; V.parent = function () { _p(); if (!V.parent.html && SUP) { const f = main.querySelector('#pl'); if (f) f.insertAdjacentHTML('afterend', `<div class="panel">${supLine()}</div>`); } }; }

/* ---------- صفحة الطاقم: بوابة الأولياء وتوزيع الرموز ---------- */
const slip = s => `<div class="slip"><header><img src="logo.webp" alt="">${esc(MOSQUE())} · بوابة الأولياء</header><div class="in"><div><b>${esc(fullName(s))}</b><small>${esc(gName(s.g))}</small><dl><dt>رقم التسجيل</dt><dd class="code">${esc(s.num)}</dd><dt>رمز الولي</dt><dd class="code">${esc(s.code || '—')}</dd></dl><small dir="ltr">${esc(portalURL())}</small></div><div class="qr">${qrSvg(portalURL())}</div></div><footer>امسحوا الرمز بكاميرا الهاتف، ثم أدخلوا الرقم والرمز. احتفظوا بهذه الورقة.${SUP ? ' · للاستفسار: ' + esc(SUP.name) + ' ' + esc(SUP.phone || '') : ''}</footer></div>`;
V.portal = function () {
  const gs = myGroups(), g = gs.includes(V.portal.g) ? V.portal.g : '', L = myStudents().filter(s => !g || s.g == g).sort((a, b) => a.num < b.num ? -1 : 1);
  const online = !!(CFG.gs || META.gs), noCode = L.filter(s => !s.code);
  main.innerHTML = head('بوابة الأولياء', 'يتابع الولي حضور ابنه وغيابه وحفظه وصلاة الفجر برقم التسجيل ورمز خاص به', `<div class="tools"><select id="pg"><option value="">${isAdmin() ? 'كل الأفواج' : 'كل أفواجي'}</option>${gs.map(x => `<option value="${x}"${x == g ? ' selected' : ''}>${esc(S.groups[x].n)}</option>`).join('')}</select></div>`) +
  (online ? '' : `<div class="panel warnbox">⚠️ البوابة تعمل الآن على هذا الجهاز فقط. ليفتحها الأولياء من هواتفهم يجب ربط المنصة بجدول Google للمسجد (الإعدادات ← اربط بجدول Google). يمكنكم تجهيز الأوراق والرسائل من الآن.</div>`) +
  `<div class="grid g2"><div class="panel dl"><h3>رابط البوابة</h3><p class="code" dir="ltr" style="font-size:14px;word-break:break-all">${esc(portalURL())}</p><div class="tools"><button class="btn" data-a="copyPortal">انسخ الرابط</button><button class="btn gold" data-a="poster">🖨 ملصق للمسجد</button></div>
    <p class="mut" style="font-size:13px">الرابط واحد للجميع، والرمز خاص بكل طالب. لا تنشروا الرموز في مجموعات واتساب العامة.</p></div>
   <div class="panel dl"><h3>كيف نوصلها للأولياء؟</h3><ol class="steps"><li><b>ورقة لكل طالب</b> فيها الرقم والرمز ورمز QR للرابط: تُطبع وتُسلّم في الحلقة.</li><li><b>رسالة واتساب خاصة</b> لكل ولي بزر «أرسل» في الجدول أدناه.</li><li><b>ملصق عند باب المسجد</b> برمز QR للرابط فقط، دون الرموز.</li></ol>
    <div class="tools"><button class="btn gold" data-a="printSlips">🖨 اطبع أوراق الأولياء (${L.length})</button>${noCode.length && isAdmin() ? `<button class="btn ghost" data-a="genCodes">🔑 أنشئ رموزًا لـ ${noCode.length} طالبًا</button>` : ''}</div></div></div>
  <div class="panel scroll"><table><tr><th></th><th>الرقم</th><th>الطالب</th><th>الفوج</th><th>رمز الولي</th><th>هاتف الولي</th><th></th></tr>${L.map(s => `<tr><td>${mini(s)}</td><td class="code">${esc(s.num)}</td><td>${esc(fullName(s))}</td><td>${esc(gName(s.g))}</td><td class="code">${esc(s.code || '—')}</td><td dir="ltr">${esc(s.phone || '—')}</td><td>${s.code ? `<button class="btn sm" data-a="sendCode" data-n="${esc(s.num)}">${s.phone ? '💬 أرسل' : '📋 انسخ الرسالة'}</button>` : ''}</td></tr>`).join('') || '<tr><td class="mut">لا طلاب</td></tr>'}</table></div>
  <div id="slips" hidden>${L.filter(s => s.code).map(slip).join('')}</div>`;
  $('#pg').onchange = e => { V.portal.g = e.target.value; V.portal(); };
};
V.portal.g = '';

/* ---------- دليل الاستخدام ---------- */
const GUIDE = [
 ['🚀', 'البداية: أول يوم للمدير', [
  'افتح الموقع، ثم «دخول الطاقم». أول مرة تظهر «تهيئة المنصة»: اكتب اسم المدير وكلمة سر (6 أحرف أو أرقام على الأقل) واحفظها جيدًا، فلا استرجاع لها.',
  'من «الأفواج والتوقيت»: اضغط «فوج جديد»، واكتب الاسم والمستوى والتوقيت والقاعة، واختر أيام الحلقة.',
  'اضغط «معلم جديد» لكل معلم، ثم أسند إليه أفواجه من زر «تعديل» في بطاقة الفوج.',
  'من «الطلاب» اضغط «تسجيل طالب». رقم التسجيل يُعطى تلقائيًا، ويظهر بعد الحفظ مع رمز الولي وزر التصوير.']],
 ['🪪', 'البطاقات والصور', [
  'من «البطاقات» اختر الفوج، ثم «📸 تصوير الفوج بالتتابع»: تظهر الكاميرا واسم الطالب، تلتقط الصورة فتنتقل المنصة إلى الطالب الموالي.',
  'زر «صوّر من لا صورة له» يكمل الناقصين فقط. يمكن أيضًا اختيار صورة من ملف.',
  'اضغط «طباعة البطاقات» واطبعها على ورق مقوّى. رمز QR في البطاقة يُمسح للحضور ولصلاة الفجر.']],
 ['📋', 'الحضور والغياب', [
  'قارئ الرموز USB أو Bluetooth: صِله بالحاسوب أو الهاتف، وافتح «الحضور»، ووجّهه إلى البطاقة. لا يحتاج أي إعداد.',
  'دون قارئ: «📷 امسح بالكاميرا»، أو اكتب رقم الطالب ثم Enter، أو اضغط «حاضر» بجانب اسمه.',
  'لكل طالب ثلاثة أزرار: حاضر، غائب، غائب بعذر. وزر «سجّل الباقين غائبين» يغلق اليوم بضغطة.',
  'لتسجيل يوم سابق غيّر التاريخ أعلى الصفحة. وزر «أبلغ الولي» يفتح رسالة واتساب جاهزة.']],
 ['🌙', 'رجال الفجر', [
  'افتح «رجال الفجر» على هاتف أو حاسوب عند باب المسجد، ومعه القارئ أو الكاميرا. المسح مفتوح من 15 دقيقة قبل الأذان إلى الشروق، حسب توقيت بلدية المسجد.',
  'كل 40 يومًا متتالية = كأس 🏆. الغياب يومًا يعيد العدّ المتتالي إلى الصفر، ولا تضيع الكؤوس ولا النقاط (10 لكل يوم و100 لكل كأس). تُعدّل القواعد من الإعدادات.',
  'زر «🖥 شاشة المسجد» يعرض الترتيب على تلفاز أو شاشة كبيرة. ولمن تعذّر مسحه: افتح ملف الطالب ثم «تسجيل فجر يدويًا».']],
 ['📖', 'التسميع والمراجعة', [
  'من «التسميع» اختر الفوج و«حفظ جديد»: ضغطة على التقدير (ممتاز، جيد جدًا، جيد) تسجّل الحصة وتنقل الطالب إلى الثُّمن الموالي، و«يُعاد» تبقيه مكانه.',
  'في «مراجعة» تقترح المنصة لكل طالب حزبًا، وتبدأ بالأحزاب الضعيفة.']],
 ['👪', 'بوابة الأولياء', [
  'لكل طالب رمز ولي يُنشأ عند تسجيله. من صفحة «بوابة الأولياء» اطبعوا ورقة لكل طالب، أو أرسلوا الرمز برسالة واتساب خاصة.',
  'الولي يفتح الموقع، ثم «بوابة الأولياء»، ويكتب رقم التسجيل والرمز، فيرى الحضور والغياب والحفظ وصلاة الفجر.',
  'لتعمل البوابة من هواتف الأولياء يجب ربط المنصة بجدول Google (انظر الفقرة التالية).']],
 ['🔗', 'جدول Google والأجهزة الأخرى', [
  'الإعدادات ← «اربط بجدول Google»: تُتبع الخطوات مرة واحدة من حساب Gmail الخاص بالمسجد. بعدها تُحفظ كل البيانات في جدول المسجد وتظهر على كل الأجهزة.',
  'لإضافة هاتف معلم أو هاتف الباب: الإعدادات ← «انسخ رمز الربط»، ثم في الجهاز الجديد «دخول الطاقم» ← «ربط هذا الجهاز». لا يُعطى رمز الربط إلا للطاقم.']],
 ['🧾', 'الحقوق وطلبات التسجيل', [
  'من «الحقوق» اختاروا النظام (مجاني، شهري، فصلي، سنوي) والمبلغ. «تسديد» يسجّل الدفع ويطبع وصلًا، و«تذكير» يرسل رسالة للولي، و«إعفاء» للمعفَين.',
  'طلبات «احجز مقعدًا» تصل إلى «طلبات التسجيل» (أو إلى واتساب المشرف قبل ربط جدول Google). «سجّله» يحوّل الطلب إلى طالب برقم تسجيل.']],
 ['🧑‍🏫', 'المعلم', [
  'المعلم يدخل باسمه وكلمة سره، فيرى أفواجه فقط: الحضور، رجال الفجر، التسميع، البطاقات، رموز أولياء طلابه، والتوقيت.']],
 ['📱', 'تثبيت المنصة كتطبيق', [
  'على أندرويد: افتح الموقع في Chrome ← القائمة ⋮ ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». على الحاسوب: زر «ثبّت التطبيق» أعلى الصفحة.',
  'تعمل المنصة دون إنترنت، وتُرسل التسجيلات عند عودة الاتصال.']],
 ['🛡️', 'الأمان والنسخ الاحتياطية', [
  'غيّروا كلمات السر السهلة، ولا تتركوا الجهاز مفتوحًا بعد الحلقة («خروج من هذا الجهاز» في الإعدادات).',
  'نزّلوا «نسخة احتياطية» من الإعدادات كل شهر واحفظوها في مكان آمن.']]
];
V.guide = function () {
  main.innerHTML = back() + head('دليل الاستخدام', 'كل ما يحتاجه المدير والمعلم والولي، خطوة بخطوة', '<button class="btn ghost sm" data-a="printGuide">🖨 اطبع الدليل</button>') +
  `<div class="panel" id="guideBody">${GUIDE.map((g, i) => `<details class="post"${i ? '' : ' open'}><summary><h3>${g[0]} ${esc(g[1])}</h3></summary><div class="body"><ol class="steps">${g[2].map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></details>`).join('')}</div>` +
  (SUP ? `<div class="panel">${supLine()}</div>` : '') + (META.me ? '' : footer());
};

Object.assign(A5, {
  demoParent() { if (!window.QS_DEMO) return; META.me = ''; persist(); V.parent.html = ''; go('parent'); $('#p-num').value = (CFG.prefix || 'Q') + '-0010'; $('#p-code').value = 'DEMO10'; toast('اضغط «دخول» لترى ما يراه الولي'); },
  demoAdmin() { if (!window.QS_DEMO) return; META.me = 'demo-admin'; persist(); go('dash'); },
  copyPortal() { copy(portalURL(), 'نُسخ رابط البوابة'); },
  printSlips() { const h = $('#slips').innerHTML; if (!h) return toast('لا رموز بعد'); $('#print').innerHTML = '<div class="slips">' + h + '</div>'; window.print(); },
  poster() { $('#print').innerHTML = `<div class="poster"><img src="logo.webp" alt=""><h1>${esc(MOSQUE())}</h1><h2>👪 بوابة الأولياء</h2><p>تابعوا حضور أبنائكم وحفظهم وصلاة الفجر</p><div class="qr">${qrSvg(portalURL())}</div><p dir="ltr">${esc(portalURL())}</p><p>امسحوا الرمز بكاميرا الهاتف، وأدخلوا رقم التسجيل ورمز الولي المسلَّمين لكم.</p>${SUP ? `<p>للاستفسار: ${esc(SUP.name)} · <span dir="ltr">${esc(SUP.phone || '')}</span></p>` : ''}<small>وقف لله تعالى</small></div>`; window.print(); },
  async genCodes(el) { if (!sure(el)) return; for (const s of myStudents().filter(s => !s.code)) await emit('stu', { num: s.num, code: newCode() }); toast('أُنشئت الرموز'); V.portal(); },
  printGuide() { $('#print').innerHTML = `<h1>دليل استخدام منصة ${esc(MOSQUE())}</h1>` + GUIDE.map(g => `<h2>${g[0]} ${esc(g[1])}</h2><ol>${g[2].map(x => `<li>${esc(x)}</li>`).join('')}</ol>`).join(''); window.print(); }
});
