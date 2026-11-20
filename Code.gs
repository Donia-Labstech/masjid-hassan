/* قاعدة بيانات المنصة في جدول Google للمسجد.
   يُلصق هذا الملف في Apps Script داخل جدول المسجد، ثم يُنشر Web app.
   KEY: كلمة سر الأجهزة، تولّدها المنصة. لا تشاركها إلا مع أجهزة الطاقم. */
var KEY = "ضع-هنا-كلمة-السر";

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, err: "bad" }); }
  if (d.action === "request") return request_(d.data || {});
  if (d.action === "parent") return parent_(String(d.num || "").toUpperCase(), String(d.code || "").toUpperCase());
  if (d.action === "ping" && d.key === KEY) return out({ ok: true });
  if (d.key !== KEY) return out({ ok: false, err: "denied" });
  if (d.action === "push") return push_(d.events || []);
  if (d.action === "pull") return pull_(+d.since || 0);
  return out({ ok: false, err: "unknown" });
}
function doGet() { return out({ ok: true, service: "masjid" }); }

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet_(n, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
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

/* بوابة الأولياء: يعيد سجلّ طالب واحد فقط إذا طابق رقمُ التسجيل رمزَ الولي */
function parent_(num, code) {
  if (!num || code.length < 6) return out({ ok: false, err: "denied" });
  var s = log_(), last = s.getLastRow(); if (last < 2) return out({ ok: false, err: "denied" });
  var vals = s.getRange(2, 1, last - 1, 7).getValues(), evs = [], real = "", own = { stu: 1, att: 1, abs: 1, fajr: 1, rec: 1, kh: 1 };
  vals.forEach(function (r) {
    var t = String(r[5]), d = {};
    if (t !== "cfg" && t !== "group" && !own[t]) return;
    try { d = JSON.parse(r[6]); } catch (x) { return; }
    if (t === "cfg") { evs.push({ id: String(r[1]), ts: r[2], type: t, d: { cupDays: d.cupDays, ptsDay: d.ptsDay, ptsCup: d.ptsCup } }); return; }
    if (t === "group") { evs.push({ id: String(r[1]), ts: r[2], type: t, d: { gid: d.gid, n: d.n, time: d.time, room: d.room, wd: d.wd, days: d.days, del: d.del } }); return; }
    if (String(d.num).toUpperCase() !== num) return;
    if (t === "stu" && d.code) real = String(d.code).toUpperCase();
    evs.push({ id: String(r[1]), ts: r[2], type: t, d: d });
  });
  if (!real || real !== code) { Utilities.sleep(800); return out({ ok: false, err: "denied" }); }
  return out({ ok: true, events: evs });
}

/* نسخ مقروءة للمسجد: الطلاب، الحضور، رجال الفجر */
function mirror_(evs) {
  var st = null, att = [], fj = [];
  evs.forEach(function (v) {
    var d = v.d || {};
    if (v.type === "stu") {
      st = st || sheet_("الطلاب", ["الرقم", "الاسم", "اللقب", "تاريخ الميلاد", "اسم الأب", "الهاتف", "الولي", "البريد"]);
      var nums = st.getRange(1, 1, Math.max(st.getLastRow(), 1), 1).getValues().map(function (r) { return String(r[0]); });
      var row = [d.num, d.name, d.surname, d.birth, d.father, d.phone, d.guardian, d.email], i = nums.indexOf(String(d.num));
      if (i > 0) st.getRange(i + 1, 1, 1, 8).setValues([row]); else st.appendRow(row);
    }
    if (v.type === "att" && !d.x) att.push([d.d, d.num, d.name || ""]);
    if (v.type === "fajr" && !d.x) fj.push([d.d, d.t || "", d.num, d.name || "", d.man ? "يدوي" : "مسح"]);
  });
  if (att.length) { var a = sheet_("الحضور", ["التاريخ", "الرقم", "الاسم"]); a.getRange(a.getLastRow() + 1, 1, att.length, 3).setValues(att); }
  if (fj.length) { var f = sheet_("رجال الفجر", ["التاريخ", "الوقت", "الرقم", "الاسم", "الطريقة"]); f.getRange(f.getLastRow() + 1, 1, fj.length, 5).setValues(fj); }
}
