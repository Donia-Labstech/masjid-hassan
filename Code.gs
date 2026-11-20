/* قاعدة بيانات المنصة في جدول Google للمسجد.
   يُلصق هذا الملف في Apps Script داخل جدول المسجد، ثم يُنشر Web app.
   KEY: كلمة سر الأجهزة، تولّدها المنصة. لا تشاركها إلا مع أجهزة الطاقم. */
var KEY = "ضع-هنا-كلمة-السر";
/* اختياري: رقم الجدول (من رابطه بين /d/ و /edit) إن أُنشئ السكربت منفصلًا عن الجدول */
var SHEET_ID = "";

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, err: "bad" }); }
  if (d.action === "request") return request_(d.data || {});
  if (d.action === "parent") return parent_(String(d.num || "").toUpperCase(), String(d.code || "").toUpperCase());
  if (d.action === "answer") return answer_(String(d.num || "").toUpperCase(), String(d.code || "").toUpperCase(), String(d.xid || ""), d.ans || [], +d.blur || 0);
  if (d.action === "ping" && d.key === KEY) return out({ ok: true });
  if (d.key !== KEY) return out({ ok: false, err: "denied" });
  if (d.action === "push") return push_(d.events || []);
  if (d.action === "pull") return pull_(+d.since || 0);
  return out({ ok: false, err: "unknown" });
}
function doGet() { return out({ ok: true, service: "masjid" }); }

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function book_() {
  var a = null; try { a = SpreadsheetApp.getActiveSpreadsheet(); } catch (x) {}
  return a || SpreadsheetApp.openById(SHEET_ID);
}
function sheet_(n, head) {
  var ss = book_(), s = ss.getSheetByName(n);
  if (!s) { s = ss.insertSheet(n); if (head) s.appendRow(head); }
  return s;
}
function log_() { return sheet_("events", ["seq", "id", "ts", "dev", "by", "type", "data"]); }

function push_(evs) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var s = log_(), seq = s.getLastRow() - 1, rows = [];
    evs.slice(0, 300).forEach(function (v) {
      seq++;
      rows.push([seq, String(v.id), v.ts, String(v.dev || ""), String(v.by || ""), String(v.type), JSON.stringify(v.d || {})]);
    });
    if (rows.length) s.getRange(s.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
    try { mirror_(evs); } catch (x) {}
    return out({ ok: true, n: rows.length });
  } finally { lock.releaseLock(); }
}

function pull_(since) {
  var s = log_(), last = s.getLastRow();
  if (last <= since + 1) return out({ ok: true, seq: Math.max(since, last - 1), events: [] });
  var from = since + 2, n = Math.min(last - from + 1, 3000);
  var vals = s.getRange(from, 1, n, 7).getValues();
  var evs = vals.map(function (r) {
    var d = {}; try { d = JSON.parse(r[6]); } catch (x) {}
    return { seq: r[0], id: String(r[1]), ts: r[2], dev: r[3], by: r[4], type: r[5], d: d };
  });
  return out({ ok: true, seq: since + n, more: from + n - 1 < last, events: evs });
}

function request_(f) {
  var c = function (v) { return String(v || "").slice(0, 80); };
  if (!c(f.name) || !c(f.phone)) return out({ ok: false, err: "missing" });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var s = log_(), id = "req-" + Utilities.getUuid();
    var d = { rid: id, name: c(f.name), surname: c(f.surname), birth: c(f.birth), father: c(f.father),
              phone: c(f.phone), guardian: c(f.guardian), email: c(f.email), note: c(f.note) };
    s.appendRow([s.getLastRow(), id, Date.now(), "web", "", "req", JSON.stringify(d)]);
    sheet_("طلبات التسجيل", ["التاريخ", "الاسم", "اللقب", "تاريخ الميلاد", "اسم الأب", "الهاتف", "الولي", "البريد"])
      .appendRow([new Date(), d.name, d.surname, d.birth, d.father, d.phone, d.guardian, d.email]);
    return out({ ok: true });
  } finally { lock.releaseLock(); }
}

/* بصمة رمز الولي: المنصة تشفّر الرمز، وتحفظ بصمته SHA-256 للتحقق هنا دون كشفه */
function hash_(t) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8)
    .map(function (x) { return ("0" + ((x + 256) % 256).toString(16)).slice(-2); }).join("");
}
function rows_() { var s = log_(), last = s.getLastRow(); return last < 2 ? [] : s.getRange(2, 1, last - 1, 7).getValues(); }
function codeOk_(d, num, code) {
  if (d.ch) return d.ch === hash_(num + ":" + code);
  return !!d.code && String(d.code).toUpperCase() === code;
}
/* الامتحان: مفتوح من موعده إلى نهاية مدته + ساعة (بتوقيت الجزائر) */
function win_(x) {
  var now = Utilities.formatDate(new Date(), "Africa/Algiers", "yyyy-MM-dd HH:mm");
  if (!x.time) return now.slice(0, 10) === x.d ? 0 : (now.slice(0, 10) < x.d ? -1 : 1);
  var p = String(x.time).split(":"), m = (+p[0]) * 60 + (+p[1] || 0), end = m + (+x.m || 30) + 60;
  var t = function (mm) { return x.d + " " + ("0" + Math.floor(mm / 60)).slice(-2) + ":" + ("0" + mm % 60).slice(-2); };
  return now < t(m) ? -1 : (end >= 1440 || now <= t(end) ? 0 : 1);
}

/* بوابة الأولياء: يعيد سجلّ طالب واحد فقط إذا طابق رقمُ التسجيل رمزَ الولي */
function parent_(num, code) {
  if (!num || code.length < 6) return out({ ok: false, err: "denied" });
  var evs = [], ok = false, grp = "", ex = {}, own = { stu: 1, att: 1, abs: 1, fajr: 1, rec: 1, kh: 1, res: 1 };
  rows_().forEach(function (r) {
    var t = String(r[5]), d = {};
    if (t !== "cfg" && t !== "group" && t !== "exam" && !own[t]) return;
    try { d = JSON.parse(r[6]); } catch (x) { return; }
    if (t === "cfg") { evs.push({ id: String(r[1]), ts: r[2], type: t, d: { cupDays: d.cupDays, ptsDay: d.ptsDay, ptsCup: d.ptsCup } }); return; }
    if (t === "group") { evs.push({ id: String(r[1]), ts: r[2], type: t, d: { gid: d.gid, n: d.n, time: d.time, room: d.room, wd: d.wd, days: d.days, del: d.del } }); return; }
    if (t === "exam") { var o = ex[d.xid] = ex[d.xid] || {}; for (var k in d) o[k] = d[k]; o._id = String(r[1]); o._ts = r[2]; return; }
    if (String(d.num).toUpperCase() !== num) return;
    if (t === "stu") { if (d.ch || d.code) ok = codeOk_(d, num, code); if (d.g) grp = d.g; }
    evs.push({ id: String(r[1]), ts: r[2], type: t, d: d });
  });
  if (!ok) { Utilities.sleep(800); return out({ ok: false, err: "denied" }); }
  Object.keys(ex).forEach(function (k) {
    var x = ex[k]; if (x.del || (x.g && x.g !== grp)) return;
    var e = { xid: x.xid, t: x.t, kind: x.kind, g: x.g, d: x.d, time: x.time, m: x.m, room: x.room, max: x.max };
    if (x.kind === "r" && x.q && win_(x) === 0) e.q = x.q.map(function (q) { return { q: q.q, o: q.o }; }); // دون الإجابات الصحيحة
    if (x.kind === "r" && x.q) e.n = x.q.length;
    evs.push({ id: x._id, ts: x._ts, type: "exam", d: e });
  });
  return out({ ok: true, events: evs });
}

/* إجابة امتحان عن بعد: تُصحَّح هنا، فلا تصل الإجابات الصحيحة إلى هاتف الطالب */
function answer_(num, code, xid, ans, blur) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ok = false, x = null, done = false;
    rows_().forEach(function (r) {
      var t = String(r[5]), d = {};
      if (t !== "stu" && t !== "exam" && t !== "res") return;
      try { d = JSON.parse(r[6]); } catch (e) { return; }
      if (t === "exam" && d.xid === xid) { x = x || {}; for (var k in d) x[k] = d[k]; }
      if (String(d.num || "").toUpperCase() !== num) return;
      if (t === "stu" && (d.ch || d.code)) ok = codeOk_(d, num, code);
      if (t === "res" && d.xid === xid && d.by === "p" && !d.x) done = true;
    });
    if (!ok) { Utilities.sleep(800); return out({ ok: false, err: "denied" }); }
    if (!x || x.del || x.kind !== "r" || !x.q) return out({ ok: false, err: "noexam" });
    if (done) return out({ ok: false, err: "done" });
    if (win_(x) !== 0) return out({ ok: false, err: "closed" });
    var sc = 0, wrong = [];
    x.q.forEach(function (q, i) { if (+ans[i] === +q.a && ans[i] !== null && ans[i] !== "") sc++; else wrong.push(i + 1); });
    var d = { xid: xid, num: num, sc: sc, total: x.q.length, blur: blur, wrong: wrong, by: "p" };
    var s = log_(), id = "res-" + Utilities.getUuid();
    s.appendRow([s.getLastRow(), id, Date.now(), "web", "", "res", JSON.stringify(d)]);
    return out({ ok: true, sc: sc, total: x.q.length, wrong: wrong, id: id });
  } finally { lock.releaseLock(); }
}

/* نسخ مقروءة للمسجد: الطلاب، الحضور، رجال الفجر */
function mirror_(evs) {
  var st = null, att = [], fj = [];
  evs.forEach(function (v) {
    var d = v.d || {};
    if (v.type === "stu") {
      st = st || sheet_("الطلاب", ["الرقم", "الاسم", "اللقب", "تاريخ الميلاد", "اسم الأب", "الهاتف", "الولي", "البريد"]);
      var nums = st.getRange(1, 1, Math.max(st.getLastRow(), 1), 1).getValues().map(function (r) { return String(r[0]); });
      var lockd = d.enc ? "🔒 مشفّر" : "", i = nums.indexOf(String(d.num));
      var row = [d.num, d.name, d.surname, d.birth || lockd, d.father || lockd, d.phone || lockd, d.guardian || lockd, d.email || lockd];
      if (i > 0) { var old = st.getRange(i + 1, 1, 1, 8).getValues()[0]; row = row.map(function (v, j) { return v === undefined || v === "" ? old[j] : v; }); st.getRange(i + 1, 1, 1, 8).setValues([row]); }
      else st.appendRow(row.map(function (v) { return v === undefined ? "" : v; }));
    }
    if (v.type === "att" && !d.x) att.push([d.d, d.num, d.name || ""]);
    if (v.type === "fajr" && !d.x) fj.push([d.d, d.t || "", d.num, d.name || "", d.man ? "يدوي" : "مسح"]);
  });
  if (att.length) { var a = sheet_("الحضور", ["التاريخ", "الرقم", "الاسم"]); a.getRange(a.getLastRow() + 1, 1, att.length, 3).setValues(att); }
  if (fj.length) { var f = sheet_("رجال الفجر", ["التاريخ", "الوقت", "الرقم", "الاسم", "الطريقة"]); f.getRange(f.getLastRow() + 1, 1, fj.length, 5).setValues(fj); }
}
