/**
 * T-ROUTE · TERMESSOS SAHA DEFTERİ – Google Drive sunucusu
 * -----------------------------------------------------------------
 * Bu kod, Hülya Aybek'in Google hesabındaki "T-Route" e-tablosuna bağlı
 * çalışır (Uzantılar → Apps Script). Fotoğraflar "T-Route" Drive klasörüne gider.
 *
 *  • Telefonlardan gelen tüm kayıtlar "_kayitlar" sekmesinde birikir.
 *  • Okunur sekmeler (Etaplar, Rotalar, Noktalar, Notlar, Fotoğraflar)
 *    10 dakikada bir ve "Termessos" menüsünden güncellenir.
 *  • Fotoğraflar Drive'da "T-Route / <Etap adı>/" altına kaydedilir.
 *
 * TEK YAPMANIZ GEREKEN: aşağıdaki EKIP_SIFRESI değerini değiştirmek,
 * sonra "kurulum" işlevini bir kez çalıştırmak ve web uygulaması olarak
 * dağıtmak (ayrıntılar KURULUM.md dosyasında).
 */
const EKIP_SIFRESI = "BURAYA-BIR-SIFRE-YAZIN";

// Hülya Aybek'in Drive'ındaki dosyalar (bağlantılardaki kimlikler)
const TABLO_ID = "1KZMehkYp0wLBp83jTtLL57ij0pUGUqs_9H7YaTJb4c4";   // T-Route e-tablosu
const KLASOR_ID = "13yDvPEQVq-CQv3Q006GAMu4R1OUSy80J";            // T-Route fotoğraf klasörü
const KLASOR_ADI = "T-Route Fotoğraflar";                         // KLASOR_ID açılamazsa yedek
const HAM = "_kayitlar";
const FOTO_INDEX = "_fotolar";
const COLS = ["id", "kind", "stage_id", "data", "created_by", "created_at", "updated_at", "updated_by", "deleted", "seq"];
const KULLANICILAR = ["Hülya Aybek", "Gökhan Deniz"];
const TURLER = {
  yapi: "Yapı kalıntısı", duvar: "Duvar / Sur", su: "Sarnıç / Su yapısı", mezar: "Mezar / Lahit",
  yazit: "Yazıt", mimari: "Mimari parça", buluntu: "Seramik / Buluntu", yol: "Yol / Patika izi",
  bitki: "Bitki örtüsü", gozlem: "Gözlem noktası", tehlike: "Tehlike / Uyarı", diger: "Diğer"
};

/* ============================ web uygulaması ============================ */

function doGet() {
  return json_({ ok: true, info: "T-Route sunucusu çalışıyor." });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: "Geçersiz istek" }); }
  if (EKIP_SIFRESI === "BURAYA-BIR-SIFRE-YAZIN") return json_({ ok: false, error: "Apps Script'te ekip şifresi henüz belirlenmemiş" });
  if (String(req.key || "") !== EKIP_SIFRESI) return json_({ ok: false, error: "Ekip şifresi yanlış" });
  try {
    switch (req.op) {
      case "ping":   return json_({ ok: true, sheet: ss_().getName(), users: KULLANICILAR });
      case "push":   return json_(push_(req.rows || []));
      case "pull":   return json_(pull_(Number(req.since) || 0, Math.min(Number(req.limit) || 2000, 5000)));
      case "upload": return json_(upload_(req));
      default:       return json_({ ok: false, error: "Bilinmeyen işlem: " + req.op });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ yardımcılar ============================ */

function ss_() {
  if (TABLO_ID) return SpreadsheetApp.openById(TABLO_ID);
  const id = PropertiesService.getScriptProperties().getProperty("SS_ID");
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function rawSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(HAM);
  if (!sh) {
    sh = ss.insertSheet(HAM);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold");
    sh.getRange("A:I").setNumberFormat("@");   // metin olarak sakla (tarihler dönüştürülmesin)
    sh.setFrozenRows(1);
  }
  return sh;
}

function photoIndex_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FOTO_INDEX);
  if (!sh) {
    sh = ss.insertSheet(FOTO_INDEX);
    sh.getRange(1, 1, 1, 2).setValues([["path", "file_id"]]).setFontWeight("bold");
    sh.getRange("A:B").setNumberFormat("@");
  }
  return sh;
}

function nextSeq_(n) {
  const p = PropertiesService.getScriptProperties();
  const cur = Number(p.getProperty("SEQ") || 0);
  p.setProperty("SEQ", String(cur + n));
  return cur;   // bu çağrının ilk değeri cur+1
}

function toValues_(r, seq) {
  return [
    String(r.id), String(r.kind || ""), String(r.stage_id || ""), JSON.stringify(r.data || {}),
    String(r.created_by || ""), String(r.created_at || ""), String(r.updated_at || ""), String(r.updated_by || ""),
    r.deleted ? "1" : "0", seq
  ];
}

function fromValues_(v) {
  let data = {};
  try { data = JSON.parse(v[3] || "{}"); } catch (e) {}
  return {
    id: String(v[0]), kind: String(v[1]), stage_id: v[2] ? String(v[2]) : null, data: data,
    created_by: String(v[4]), created_at: String(v[5]), updated_at: String(v[6]), updated_by: String(v[7]),
    deleted: String(v[8]) === "1", seq: Number(v[9])
  };
}

/* ============================ eşitleme ============================ */

function push_(rows) {
  if (!rows.length) return { ok: true, n: 0 };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = rawSheet_();
    const last = sh.getLastRow();
    const index = {};
    if (last > 1) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      const upd = sh.getRange(2, 7, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) index[ids[i][0]] = { row: i + 2, updated_at: String(upd[i][0]) };
    }
    // aynı istekte aynı kaydın birden fazla sürümü varsa en yenisini al
    const latest = {};
    rows.forEach(function (r) { if (r && r.id && (!latest[r.id] || String(r.updated_at) >= String(latest[r.id].updated_at))) latest[r.id] = r; });
    const list = Object.keys(latest).map(function (k) { return latest[k]; });
    let seq = nextSeq_(list.length);
    const appends = [];
    let updated = 0, skipped = 0;
    list.forEach(function (r) {
      const ex = index[r.id];
      if (ex) {
        if (String(r.updated_at) < ex.updated_at) { skipped++; return; }   // sunucudaki daha yeni
        sh.getRange(ex.row, 1, 1, COLS.length).setValues([toValues_(r, ++seq)]);
        updated++;
      } else {
        appends.push(toValues_(r, ++seq));
      }
    });
    if (appends.length) sh.getRange(sh.getLastRow() + 1, 1, appends.length, COLS.length).setValues(appends);
    SpreadsheetApp.flush();
    return { ok: true, added: appends.length, updated: updated, skipped: skipped };
  } finally {
    lock.releaseLock();
  }
}

function pull_(since, limit) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return pullLocked_(since, limit); } finally { lock.releaseLock(); }
}

function pullLocked_(since, limit) {
  const sh = rawSheet_();
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, rows: [], more: false };
  const vals = sh.getRange(2, 1, last - 1, COLS.length).getValues();
  const out = [];
  for (let i = 0; i < vals.length; i++) if (Number(vals[i][9]) > since) out.push(vals[i]);
  out.sort(function (a, b) { return Number(a[9]) - Number(b[9]); });
  const page = out.slice(0, limit).map(fromValues_);
  return { ok: true, rows: page, more: out.length > limit };
}

/* ============================ fotoğraflar ============================ */

function rootFolder_() {
  if (KLASOR_ID) { try { return DriveApp.getFolderById(KLASOR_ID); } catch (e) {} }
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty("FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const it = DriveApp.getFoldersByName(KLASOR_ADI);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(KLASOR_ADI);
  p.setProperty("FOLDER_ID", f.getId());
  return f;
}

function subFolder_(parent, name) {
  name = String(name || "Etapsız").replace(/[\\\/]+/g, "-").slice(0, 100);
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function upload_(req) {
  if (!req.path || !req.b64) return { ok: false, error: "Eksik fotoğraf verisi" };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ix = photoIndex_();
    const last = ix.getLastRow();
    if (last > 1) {
      const v = ix.getRange(2, 1, last - 1, 2).getValues();
      for (let i = 0; i < v.length; i++) if (v[i][0] === req.path) return { ok: true, id: String(v[i][1]), existed: true };
    }
    const blob = Utilities.newBlob(Utilities.base64Decode(req.b64), req.mime || "image/jpeg", req.name || "foto.jpg");
    const file = subFolder_(rootFolder_(), req.folder).createFile(blob);
    file.setDescription(req.path);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    ix.appendRow([req.path, file.getId()]);
    return { ok: true, id: file.getId() };
  } finally {
    lock.releaseLock();
  }
}

/* ============================ okunur sekmeler ============================ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu("T-Route")
    .addItem("Tabloları şimdi güncelle", "tablolariGuncelle")
    .addItem("Kurulumu çalıştır", "kurulum")
    .addToUi();
}

function fmt_(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return Utilities.formatDate(d, "Europe/Istanbul", "dd.MM.yyyy HH:mm");
}

function hav_(a, b) {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t;
  const x = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.pow(Math.sin(dLng / 2), 2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function writeSheet_(name, header, rows, widths) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold").setBackground("#ece4d4");
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  sh.setFrozenRows(1);
  (widths || []).forEach(function (w, i) { if (w) sh.setColumnWidth(i + 1, w); });
  return sh;
}

function tablolariGuncelle() {
  const sh = rawSheet_();
  const last = sh.getLastRow();
  const all = last > 1 ? sh.getRange(2, 1, last - 1, COLS.length).getValues().map(fromValues_) : [];
  const live = all.filter(function (r) { return !r.deleted; });
  const by = function (k) { return live.filter(function (r) { return r.kind === k; }); };
  const stages = {}; by("stage").forEach(function (s) { stages[s.id] = s; });
  const stName = function (id) { return stages[id] ? stages[id].data.name : ""; };
  const feats = {}; by("feature").forEach(function (f) { feats[f.id] = f; });

  // rota noktaları
  const pts = {};
  by("point").forEach(function (p) { (pts[p.data.track_id] = pts[p.data.track_id] || []).push(p); });
  Object.keys(pts).forEach(function (k) { pts[k].sort(function (a, b) { return a.data.seq - b.data.seq; }); });
  const trackLen = function (id) { const a = pts[id] || []; let s = 0; for (let i = 1; i < a.length; i++) s += hav_(a[i - 1].data, a[i].data); return s; };

  const entries = by("entry").sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
  const photos = by("photo").sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
  const notesOf = {}; entries.forEach(function (e) { (notesOf[e.data.feature_id] = notesOf[e.data.feature_id] || []).push(e); });
  const photosOf = {}; photos.forEach(function (p) { (photosOf[p.data.feature_id] = photosOf[p.data.feature_id] || []).push(p); });

  // Etaplar
  writeSheet_("Etaplar", ["No", "Etap", "Başlatan", "Başlangıç", "Rota sayısı", "Toplam rota (km)", "Nokta sayısı"],
    by("stage").sort(function (a, b) { return (a.data.no || 0) - (b.data.no || 0); }).map(function (s) {
      const tr = by("track").filter(function (t) { return t.stage_id === s.id; });
      const km = tr.reduce(function (a, t) { return a + trackLen(t.id); }, 0) / 1000;
      return [s.data.no || "", s.data.name, s.created_by, fmt_(s.created_at), tr.length, Math.round(km * 100) / 100, by("feature").filter(function (f) { return f.stage_id === s.id; }).length];
    }), [50, 260, 130, 130, 90, 120, 100]);

  // Rotalar
  writeSheet_("Rotalar", ["Etap", "Rota", "Kaydeden", "Yöntem", "Başlangıç", "Bitiş", "Uzunluk (m)", "Nokta sayısı", "Son düzenleyen", "Rota ID"],
    by("track").sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).map(function (t) {
      const a = pts[t.id] || [];
      const eds = {}; a.forEach(function (p) { if (p.updated_by && p.updated_by !== t.created_by) eds[p.updated_by] = 1; });
      return [stName(t.stage_id), t.data.name, t.created_by, t.data.mode === "manual" ? "Elle çizildi" : "GPS", fmt_(t.data.started_at || t.created_at), fmt_(t.data.ended_at), Math.round(trackLen(t.id)), a.length, Object.keys(eds).join(", ") || t.updated_by, t.id];
    }), [200, 220, 120, 90, 120, 120, 90, 90, 130, 80]);

  // Noktalar
  writeSheet_("Noktalar", ["Etap", "Başlık", "Unsur türü", "Enlem", "Boylam", "Doğruluk (m)", "Rakım (m)", "Kaydeden", "Kayıt zamanı", "Son düzenleyen", "Notlar", "Foto sayısı", "Haritada aç", "Nokta ID"],
    by("feature").sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).map(function (f) {
      const ns = (notesOf[f.id] || []).map(function (e) { return "[" + e.created_by + ", " + fmt_(e.created_at) + "] " + e.data.text; }).join("\n");
      const url = "https://www.google.com/maps?q=" + f.data.lat + "," + f.data.lng;
      return [stName(f.stage_id), f.data.title, TURLER[f.data.category] || f.data.category, f.data.lat, f.data.lng, f.data.acc == null ? "" : f.data.acc, f.data.alt == null ? "" : f.data.alt, f.created_by, fmt_(f.created_at), f.updated_by, ns, (photosOf[f.id] || []).length, '=HYPERLINK("' + url + '","Harita")', f.id];
    }), [180, 220, 140, 90, 90, 80, 70, 120, 120, 120, 380, 70, 80, 80]).getRange("K:K").setWrap(true);

  // Notlar
  writeSheet_("Notlar", ["Etap", "Nokta", "Yazan", "Zaman", "Not", "Düzenlendi"],
    entries.filter(function (e) { return feats[e.data.feature_id]; }).map(function (e) {
      const f = feats[e.data.feature_id];
      return [stName(f.stage_id), f.data.title, e.created_by, fmt_(e.created_at), e.data.text, e.updated_at !== e.created_at ? fmt_(e.updated_at) : ""];
    }), [180, 200, 120, 120, 480, 110]).getRange("E:E").setWrap(true);

  // Fotoğraflar
  writeSheet_("Fotoğraflar", ["Önizleme", "Etap", "Nokta", "Çeken", "Zaman", "Bağlantı", "Dosya ID"],
    photos.filter(function (p) { return feats[p.data.feature_id]; }).map(function (p) {
      const f = feats[p.data.feature_id]; const id = p.data.file_id || "";
      return [id ? '=IMAGE("https://drive.google.com/thumbnail?id=' + id + '&sz=w300")' : "(yükleniyor)", stName(f.stage_id), f.data.title, p.created_by, fmt_(p.created_at), id ? '=HYPERLINK("https://drive.google.com/file/d/' + id + '/view","Aç")' : "", id];
    }), [130, 180, 200, 120, 120, 60, 80]);
  const fs = ss_().getSheetByName("Fotoğraflar");
  if (fs.getLastRow() > 1) fs.setRowHeights(2, fs.getLastRow() - 1, 90);

  // sekme sırası
  ["Etaplar", "Rotalar", "Noktalar", "Notlar", "Fotoğraflar"].forEach(function (n, i) {
    const s = ss_().getSheetByName(n); if (s) { ss_().setActiveSheet(s); ss_().moveActiveSheet(i + 1); }
  });
}

/* ============================ kurulum ============================ */

function kurulum() {
  const p = PropertiesService.getScriptProperties();
  p.setProperty("SS_ID", ss_().getId());
  rawSheet_(); photoIndex_(); rootFolder_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "tablolariGuncelle") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("tablolariGuncelle").timeBased().everyMinutes(10).create();
  tablolariGuncelle();
  const def = ss_().getSheetByName("Sayfa1") || ss_().getSheetByName("Sheet1");
  if (def && def.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(def);
  if (EKIP_SIFRESI === "BURAYA-BIR-SIFRE-YAZIN") {
    throw new Error("Kurulum tamamlandı, ancak EKIP_SIFRESI hâlâ değiştirilmedi. Kodun başındaki şifreyi değiştirip kaydedin.");
  }
}
