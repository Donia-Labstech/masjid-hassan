'use strict';
/* ---------- جولة تجريبية: قاعدة منفصلة ببيانات وهمية، لا تمسّ بيانات المسجد ولا تُزامَن ---------- */
async function seedDemo() {
  const bar = $('#demobar'); if (bar) bar.hidden = false;
  if (EV.length) return; // البيانات التجريبية موجودة من زيارة سابقة
  const t = today(), now = Date.now(), DAY = 864e5;
  let k = 0; const ev = (type, d, ago) => EV.push({ id: 'demo' + (k++), ts: now - (ago || 0) - 1e6 + k, dev: 'demo', by: '', type, d });
  const A = 'demo-admin', T1 = 'demo-t1', T2 = 'demo-t2';
  ev('user', { uid: A, name: 'الإمام (تجربة)', role: 'admin', pin: await hashPin('000000', A) }, 60 * DAY);
  ev('user', { uid: T1, name: 'الشيخ عبد القادر', role: 'teacher', phone: '0550000001', pin: await hashPin('111111', T1) }, 60 * DAY);
  ev('user', { uid: T2, name: 'الأستاذ يوسف', role: 'teacher', phone: '0550000002', pin: await hashPin('222222', T2) }, 60 * DAY);
  ev('cfg', { commune: CFG.commune || null }, 60 * DAY);
  const G = [['g1', 'فوج النور', 'المبتدئون', T1], ['g2', 'فوج الفرقان', 'المتوسطون', T1], ['g3', 'فوج الهدى', 'المتقدمون', T2]];
  G.forEach(g => ev('group', { gid: g[0], n: g[1], lvl: g[2], t: g[3], days: 'السبت – الأربعاء', time: '17:00 – 18:30' }, 59 * DAY));
  const N = [['محمد', 'بن علي', 'g1', 2], ['أيوب', 'حمادي', 'g1', 1], ['إلياس', 'زروقي', 'g1', 0], ['عبد الرحمن', 'بوزيد', 'g1', 3],
             ['أنس', 'مسعودي', 'g2', 8], ['يحيى', 'قاسمي', 'g2', 10], ['عمر', 'بلقاسم', 'g2', 6], ['حمزة', 'لعرابي', 'g2', 12],
             ['زكرياء', 'بن عيسى', 'g3', 20], ['سليمان', 'دحماني', 'g3', 25], ['إسحاق', 'شريف', 'g3', 30], ['معاذ', 'رحماني', 'g3', 18]];
  const pre = (CFG.prefix || 'Q') + '-';
  N.forEach((s, i) => ev('stu', { num: pre + String(i + 1).padStart(4, '0'), name: s[0], surname: s[1], g: s[2], hz0: s[3], birth: '201' + (i % 6 + 2) + '-0' + (i % 9 + 1) + '-1' + i % 9, father: 'الأب', guardian: 'الأب', phone: '05500001' + String(i).padStart(2, '0') }, 58 * DAY));
  const num = i => pre + String(i + 1).padStart(4, '0');
  // الحضور: آخر 12 يوم دراسة (دون الخميس والجمعة)
  let d = t, n = 0;
  while (n < 12) { const wd = new Date(d + 'T12:00:00Z').getUTCDay(); if (d == t || (wd != 4 && wd != 5)) { N.forEach((s, i) => { if ((i * 7 + n * 3) % 9 && !(n == 0 && i % 4 == 3)) ev('att', { num: num(i), d, name: s[0] + ' ' + s[1], g: s[2] }, n * DAY); }); n++; } d = addDays(d, -1); }
  // رجال الفجر: سلاسل متتالية مختلفة
  const streak = (i, len, endAgo) => { for (let j = 0; j < len; j++) ev('fajr', { num: num(i), d: addDays(t, -(endAgo + j)), t: '05:4' + (j % 10), man: 0, name: N[i][0] + ' ' + N[i][1] }, (endAgo + j) * DAY); };
  streak(9, 52, 1); streak(4, 38, 1); streak(8, 33, 1); streak(0, 21, 1); streak(5, 14, 1); streak(10, 9, 2); streak(1, 6, 1); streak(6, 15, 9);
  // التسميع: بعض الحصص الأخيرة
  N.forEach((s, i) => { for (let j = 0; j < 4; j++) ev('rec', { num: num(i), k: 'n', gr: (i + j) % 3, i: s[3], th: j + 1 }, (8 - j * 2) * DAY); });
  ev('rec', { num: num(9), k: 'r', gr: 3, i: 4 }, 3 * DAY); ev('rec', { num: num(9), k: 'r', gr: 3, i: 7 }, 2 * DAY);
  ev('kh', { num: num(9), k: 'sidq' }, 5 * DAY); ev('kh', { num: num(4), k: 'awn' }, 4 * DAY);
  ev('req', { rid: 'demo-r1', name: 'بلال', surname: 'بن يوسف', birth: '2016-05-02', father: 'يوسف', phone: '0550009999', guardian: 'الأب' }, DAY);
  EVM = new Map(EV.map(e => [e.id, e])); META.me = A; META.unsent = []; rebuild(); persist();
}
