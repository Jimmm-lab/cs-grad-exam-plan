/* 手寫作答板：每一題「看答案」上方加一塊可以用觸控筆（S Pen）寫字的方格紙。
 *
 * - 筆跡以向量存（每一筆的點座標＋壓力），座標以「紙寬 1000」為基準，
 *   手機轉橫、換電腦看時等比例縮放，不會糊掉。
 * - 版面：工具列兩排，第一排是工具（筆、螢光筆、橡皮擦、選取｜插入、更多），第二排是現在這支筆的
 *   快速選色、粗細（打開筆的設定），和復原、重做。「插入」「更多」「筆的設定」是工具列下面展開的面板，一次只開一個。
 *   「更多」裡面是存成圖片、清除，和觸控筆模式、筆停住的開關。紙的下面一排是縮放和加長、縮短。
 * - 提示訊息在畫面下方短暫出現（不佔紙的位置）；操作說明同一種最多出現 TIP_MAX 次，錯誤每次都會出現。
 * - 紙可以縮放：兩指捏合／拖曳、紙下面的放大縮小鈕、電腦上 Ctrl＋滾輪。
 * - 存在這台裝置瀏覽器的 IndexedDB（notes/assets/inkdb.js），key 是「頁面:題目 id」。
 *   側欄可以把全部筆跡匯出成一個 JSON 檔，換裝置時再匯入；登入 Supabase 後會自動同步（sync.js）。
 * - 觸控筆模式：只有筆會寫字，一指拖曳是捲動頁面（第一次偵測到觸控筆時自動開啟）。
 * - 四種筆：鋼筆（預設，壓力越大越粗）、原子筆（粗細穩定）、鉛筆（淡一點、有筆觸）、螢光筆（半透明，畫在字的下面）。
 *   鋼筆、原子筆、鉛筆共用工具列的「筆」按鈕（在筆的設定裡換種類），螢光筆自己一顆；選中的筆再點一次打開設定。
 *   每種筆各自記住粗細和顏色（設定裡有推薦色系和自訂顏色）。
 * - 「加長」一次多一段紙；「縮短」一次收回一段，但不會切到筆跡、也不會比原本短；兩個都可以「復原」。
 * - 「選取」：用筆圈起來（或直接點一筆）選取筆跡，拖框裡面移動、拖右下角的圓點縮放，也可以複製、刪除；都可以「復原」。
 * - 筆停住：畫完筆尖停住半秒（HOLD_MS，「更多」裡可以關掉），直線會拉直；圓、橢圓、三角形、矩形、多邊形換成標準的圖形（inkx.js 辨識）。
 *   拉直線還沒放開前可以繼續拖動調整方向和長度，接近水平、垂直、45° 時自動對齊。寫字、小的圈圈不會被換掉。
 * - 插入：圖片（相簿、檔案、貼上、拖進來）和 .md 筆記（排版成卡片）。放在筆跡下面，可以直接在上面寫字；
 *   用「選取」移動、縮放、複製、刪除，橡皮擦不會擦到它們。
 *
 * 一筆的資料：{ p: [x, y, 壓力, ...], c: 顏色, sw: 粗細, t: 筆的種類, pen: 是否觸控筆, k: 縮放倒數 }
 *   c 是數字 0–3 時是會跟著深色模式變的黑紅藍綠（舊資料都是這種），字串則是固定的色碼。
 *   舊資料用 w（0–2，細中粗）代替 sw、沒有 t（＝鋼筆），照樣能畫。
 * 一題的資料：{ v, H: 紙長, s: 筆畫, o: 插入的東西, t }；插入的東西是 { kind: "img", id, x, y, w, h } 或
 *   { kind: "md", md: 原文, name: 檔名, x, y, w, h }。圖片本身另外存一筆「img:id」（{ v, img: dataURL, w, h, t }），
 *   同一張圖只存一份，跟筆跡一樣同步。
 */
(function () {
  "use strict";
  if (!document.querySelector("details.quiz")) return;

  var I = window.CGEP_ICON || function () { return ""; };
  var SLUG = document.body.getAttribute("data-slug") || location.pathname;
  var W = 1000;                       // 紙的邏輯寬度
  var DEFAULT_H = 900, STEP_H = 600, MAX_H = 6000;
  var GRID = 50, ZMAX = 4;
  var SIZES = [3.5, 6, 10];           // 舊資料的細、中、粗（邏輯單位，縮放 100% 時）
  var COLOR_VARS = ["--pen-ink", "--pen-red", "--pen-blue", "--pen-green"];
  var LIGHT = ["#1a2130", "#d0343f", "#2d5fd3", "#2f7d3b"];   // 存成圖片時用白底配色
  var PREF_KEY = "cgep:ink:pref";
  var HOLD_MS = 500;                  // 筆停住多久變成直線或標準圖形（毫秒）
  var X = window.CGEP_INKX;           // inkx.js：圖形辨識、.md 卡片、圖片處理
  var IMG_KEY = "img:";               // 圖片在資料庫裡的 key 開頭
  var MD_W = X.MD_W;                  // .md 卡片排版的寬度（紙上的單位）
  var TIP_MAX = 3;                    // 同一種操作說明最多出現幾次
  // 筆的種類。粗細範圍是紙寬 1000 時的單位
  var PENS = {
    fountain: { name: "鋼筆", icon: "penFountain", min: 1, max: 20, step: 0.5 },
    ball: { name: "原子筆", icon: "penBall", min: 1, max: 16, step: 0.5 },
    pencil: { name: "鉛筆", icon: "pencil", min: 1, max: 16, step: 0.5 },
    hl: { name: "螢光筆", icon: "highlighter", min: 8, max: 48, step: 1 }
  };
  var PEN_ORDER = ["fountain", "ball", "pencil", "hl"];
  // 推薦色系：數字 0–3 是黑紅藍綠（深色模式會自動變亮），其他是固定色碼
  var PALETTES = [
    { name: "經典", colors: [0, 1, 2, 3, "#e8590c", "#7048e8", "#8d5524", "#868e96"] },
    { name: "螢光", colors: ["#ffd43b", "#8ce99a", "#ffa8d4", "#74c0fc", "#ffc078", "#d0bfff"] },
    { name: "低飽和", colors: ["#5f6b7a", "#b0566a", "#4f7396", "#5f8a68", "#a8834a", "#7a6a9c"] }
  ];
  var QUICK = { pen: [0, 1, 2, 3], hl: ["#ffd43b", "#8ce99a", "#ffa8d4", "#74c0fc"] };
  var COLOR_NAME = { 0: "黑", 1: "紅", 2: "藍", 3: "綠", "#e8590c": "橘", "#7048e8": "紫", "#8d5524": "棕", "#868e96": "灰",
    "#ffd43b": "黃", "#8ce99a": "淺綠", "#ffa8d4": "粉紅", "#74c0fc": "淺藍", "#ffc078": "淺橘", "#d0bfff": "淺紫",
    "#5f6b7a": "灰藍", "#b0566a": "玫瑰", "#4f7396": "霧藍", "#5f8a68": "灰綠", "#a8834a": "卡其", "#7a6a9c": "灰紫" };

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ---------- 儲存（notes/assets/inkdb.js） ---------- */
  var DB = window.CGEP_INKDB;
  var store = {
    get: DB.get, keys: DB.keys, dump: DB.pads, putMany: DB.putMany,
    put: DB.put,
    del: function (k) { return DB.remove(k, Date.now()); }
  };
  var askedPersist = false;
  function askPersist() {
    if (askedPersist) return;
    askedPersist = true;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  }

  function loadPref() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}") || {}; } catch (e) { return {}; } }
  var pref = loadPref();
  function savePref() { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) {} }

  /* ---------- 每種筆的粗細和顏色 ---------- */
  function penType() { return PENS[pref.pen] ? pref.pen : "fountain"; }
  // 工具列「筆」按鈕現在代表的筆（鋼筆、原子筆、鉛筆其中一種）：螢光筆以外最後用的那一種
  function writePen() {
    if (PENS[pref.wpen] && pref.wpen !== "hl") return pref.wpen;
    return PENS[pref.pen] && pref.pen !== "hl" ? pref.pen : "fountain";
  }
  function choosePen(tp) {
    pref.pen = tp;
    if (tp !== "hl") pref.wpen = tp;
    savePref();
  }
  // 預設值：鋼筆沿用原本的設定（以前選的顏色和細中粗），其他筆各有適合的預設
  function penDefault(tp) {
    if (tp === "hl") return { c: "#ffd43b", sw: 22 };
    if (tp === "ball") return { c: 0, sw: 4 };
    if (tp === "pencil") return { c: 0, sw: 3.5 };
    return { c: pref.color || 0, sw: SIZES[pref.size == null ? 1 : pref.size] || 6 };
  }
  function penCfg(tp) {
    var d = penDefault(tp), v = (pref.tools && pref.tools[tp]) || {};
    return { c: v.c != null ? v.c : d.c, sw: v.sw != null ? v.sw : d.sw };
  }
  function setPenCfg(patch) {
    var tp = penType();
    pref.tools = pref.tools || {};
    var v = penCfg(tp);
    for (var k in patch) v[k] = patch[k];
    pref.tools[tp] = v;
    savePref();
  }
  function parseColor(v) { return /^\d+$/.test(v) ? +v : String(v).toLowerCase(); }
  function sameColor(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }
  function colorName(c) { return COLOR_NAME[String(c).toLowerCase()] || "自訂顏色 " + c; }
  function swatchCss(c) { return typeof c === "number" ? "var(" + (COLOR_VARS[c] || COLOR_VARS[0]) + ")" : c; }
  function hexOf(c) { return typeof c === "number" ? LIGHT[c] || LIGHT[0] : c; }

  /* ---------- 觸控筆偵測 ---------- */
  var openPads = [];
  var activePad = null;               // 最後碰過的手寫板：Ctrl＋V 貼上的圖片放到這一塊
  var lastPen = 0;
  function notePen() {
    lastPen = Date.now();
    if (pref.penOnly === undefined) {
      pref.penOnly = true; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); });
      if (openPads.length) toast("偵測到觸控筆：已切換成觸控筆模式，一指拖曳會捲動頁面（可以在「更多」裡關掉）");
    }
  }
  ["pointerdown", "pointermove"].forEach(function (t) {
    document.addEventListener(t, function (e) { if (e.pointerType === "pen") notePen(); }, { passive: true, capture: true });
  });

  /* ---------- 畫筆 ---------- */
  function palette(light) {
    if (light) return LIGHT;
    var cs = getComputedStyle(document.documentElement);
    return COLOR_VARS.map(function (v, i) { return cs.getPropertyValue(v).trim() || LIGHT[i]; });
  }
  // 深色模式：很暗的自訂顏色（例如黑色）在深色紙上看不到，畫的時候改用亮的墨水色
  var darkNow = false;
  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return 1;
    var n = parseInt(m[1], 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function isDark() { return lum(getComputedStyle(document.documentElement).getPropertyValue("--card").trim()) < 0.3; }
  // s.k：寫這一筆時的縮放倒數。放大時寫的字，線條在紙上會比較細，看起來跟 100% 時一樣粗
  function baseW(s) { return (s.sw != null ? s.sw : SIZES[s.w] || SIZES[1]) * (s.k || 1); }
  // 觸控筆的壓力：鋼筆變化最大、鉛筆中等、原子筆幾乎不變；手指和滑鼠一律固定粗細
  function widthAt(s, pr) {
    var b = baseW(s), t = s.t || "fountain";
    if (!s.pen || t === "hl") return b;
    if (t === "ball") return b * (0.8 + (pr / 100) * 0.4);
    if (t === "pencil") return b * (0.55 + (pr / 100) * 0.9);
    return b * (0.35 + (pr / 100) * 1.3);
  }
  // 畫第 k 段：從 (k-2,k-1) 的中點到 (k-1,k) 的中點，以第 k-1 點為控制點，線條才會圓滑
  function seg(ctx, s, k) {
    var p = s.p, i = 3 * k;
    var x1 = p[i - 3], y1 = p[i - 2], x2 = p[i], y2 = p[i + 1];
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.beginPath();
    if (k === 1) { ctx.moveTo(x1, y1); ctx.lineTo(mx, my); }
    else { ctx.moveTo((p[i - 6] + x1) / 2, (p[i - 5] + y1) / 2); ctx.quadraticCurveTo(x1, y1, mx, my); }
    ctx.lineWidth = widthAt(s, (p[i - 1] + p[i + 2]) / 2);
    ctx.stroke();
  }
  function tail(ctx, s) {
    var p = s.p, n = p.length / 3;
    if (n < 2) return;
    var i = 3 * (n - 1);
    ctx.beginPath();
    ctx.moveTo((p[i - 3] + p[i]) / 2, (p[i - 2] + p[i + 1]) / 2);
    ctx.lineTo(p[i], p[i + 1]);
    ctx.lineWidth = widthAt(s, p[i + 2]);
    ctx.stroke();
  }
  function colorOf(s, pal) {
    if (typeof s.c !== "string") return pal[s.c] || pal[0];
    if (pal !== LIGHT && darkNow && s.t !== "hl" && lum(s.c) < 0.16) return pal[0];
    return s.c;
  }
  // 鉛筆半透明一點（線段重疊的地方比較深，像石墨的筆觸）；螢光筆更透明
  function setColor(ctx, s, pal) {
    ctx.strokeStyle = ctx.fillStyle = colorOf(s, pal);
    ctx.globalAlpha = s.t === "hl" ? (darkNow && pal !== LIGHT ? 0.42 : 0.34) : s.t === "pencil" ? 0.82 : 1;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  }
  // 螢光筆整筆一次畫成一條路徑（分段畫的話，半透明的接縫會一節一節變深）
  function hlPath(ctx, s) {
    var p = s.p, n = p.length / 3;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    if (n === 1) ctx.lineTo(p[0] + 0.01, p[1]);
    for (var k = 1; k < n; k++) {
      var i = 3 * k;
      ctx.quadraticCurveTo(p[i - 3], p[i - 2], (p[i - 3] + p[i]) / 2, (p[i - 2] + p[i + 1]) / 2);
    }
    if (n > 1) ctx.lineTo(p[3 * n - 3], p[3 * n - 2]);
    ctx.lineWidth = baseW(s);
    ctx.stroke();
  }
  function drawStroke(ctx, s, pal) {
    setColor(ctx, s, pal);
    var n = s.p.length / 3;
    if (s.t === "hl") hlPath(ctx, s);
    else if (n === 1) { ctx.beginPath(); ctx.arc(s.p[0], s.p[1], widthAt(s, s.p[2]) / 2, 0, Math.PI * 2); ctx.fill(); }
    else { for (var k = 1; k < n; k++) seg(ctx, s, k); tail(ctx, s); }
    ctx.globalAlpha = 1;
  }
  // 螢光筆先畫（在下面），其他筆畫在上面，劃重點不會蓋住字
  function drawAll(ctx, strokes, pal) {
    var i;
    for (i = 0; i < strokes.length; i++) if (strokes[i].t === "hl") drawStroke(ctx, strokes[i], pal);
    for (i = 0; i < strokes.length; i++) if (strokes[i].t !== "hl") drawStroke(ctx, strokes[i], pal);
  }
  /* ---------- 插入的圖片和 .md 筆記 ---------- */
  function isObj(o) { return !!(o && o.kind); }
  // 圖片：第一次用到時從資料庫讀出來。state：load（讀取中）、ok、none（這台裝置還沒有這張圖）
  var imgs = {};
  function onImg(id) {
    openPads.forEach(function (p) { if (p.objs.some(function (o) { return o.id === id; })) p.requestDraw(); });
  }
  function useImg(id, url) {
    var e = imgs[id] = { im: new Image(), state: "load" };
    e.im.onload = function () { e.state = "ok"; onImg(id); };
    e.im.onerror = function () { e.state = "none"; onImg(id); };
    e.im.src = url;
    return e;
  }
  function imgOf(id) {
    var e = imgs[id];
    if (e) return e;
    e = imgs[id] = { im: null, state: "load" };
    store.get(IMG_KEY + id).then(function (v) {
      if (imgs[id] !== e) return;
      if (v && v.img) useImg(id, v.img); else { e.state = "none"; onImg(id); }
    }).catch(function () { e.state = "none"; onImg(id); });
    return e;
  }
  // .md 卡片：排版成圖要一點時間，先畫「排版中」，好了再重畫。依螢幕上需要的清晰度重排，最多留 6 張
  var cards = [], cardJobs = {}, cardFail = {};
  function cardKey(o, dark) { return (dark ? "d" : "l") + "\u0001" + (o.name || "") + "\u0001" + o.md; }
  function cardF(f, lh) {
    var want = Math.min(4, Math.pow(2, Math.ceil(Math.log(Math.max(0.25, f)) / Math.LN2)));
    var cap = Math.sqrt(8e6 / (MD_W * Math.max(200, lh)));
    while (want > 0.25 && want > cap) want /= 2;
    return want;
  }
  function cardOf(o, dark, f) {
    var key = cardKey(o, dark), best = null;
    cards.forEach(function (c) { if (c.key === key && (!best || c.f > best.f)) best = c; });
    if (best) best.t = Date.now();
    var want = cardF(f, best ? best.lh : o.h * MD_W / o.w), job = key + "\u0001" + want;
    if ((!best || best.f < want) && !cardJobs[job] && !cardFail[key]) {
      cardJobs[job] = 1;
      X.renderCard(o.md, o.name, dark, want).then(function (r) {
        delete cardJobs[job];
        cards = cards.filter(function (c) { return c.key !== key || c.f > want; });
        cards.push({ key: key, f: want, cv: r.cv, lh: r.lh, t: Date.now() });
        if (cards.length > 6) { cards.sort(function (a, b) { return b.t - a.t; }); cards.length = 6; }
        openPads.forEach(function (p) { p.cardReady(key, r.lh); });
      }, function () {
        delete cardJobs[job];
        cardFail[key] = 1;
        openPads.forEach(function (p) { p.requestDraw(); });
      });
    }
    return best;
  }
  function placeholder(ctx, o, text, light) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = !light && darkNow ? "#232a36" : "#f3f4f6";
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = "#9aa3b2"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.strokeRect(o.x + 1, o.y + 1, Math.max(0, o.w - 2), Math.max(0, o.h - 2));
    ctx.setLineDash([]);
    ctx.fillStyle = !light && darkNow ? "#aab2c0" : "#5f6878";
    ctx.font = "26px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, o.x + o.w / 2, o.y + Math.min(o.h / 2, 60), Math.max(40, o.w - 20));
    ctx.restore();
  }
  // 插入的東西畫在筆跡下面（螢光筆也畫在它們上面，才能劃重點）
  function drawObjs(ctx, objs, f, light) {
    objs.forEach(function (o) {
      if (o.kind === "img") {
        var e = imgOf(o.id);
        if (e.state === "ok") ctx.drawImage(e.im, o.x, o.y, o.w, o.h);
        else placeholder(ctx, o, e.state === "load" ? "圖片載入中…" : "這張圖片還沒同步到這台裝置", light);
      } else if (o.kind === "md") {
        var dark = !light && darkNow, c = cardOf(o, dark, f);
        if (c) ctx.drawImage(c.cv, o.x, o.y, o.w, o.w * c.lh / MD_W);
        else placeholder(ctx, o, cardFail[cardKey(o, dark)] ? "這份 .md 排版失敗" : "正在排版 " + (o.name || ".md") + "…", light);
      }
    });
  }
  function drawObjHalo(ctx, objs, color, u) {
    if (!objs.length) return;
    ctx.save();
    ctx.globalAlpha = darkNow ? 0.45 : 0.32; ctx.strokeStyle = color; ctx.lineWidth = 12 * u; ctx.lineJoin = "round";
    objs.forEach(function (o) { ctx.strokeRect(o.x - 6 * u, o.y - 6 * u, o.w + 12 * u, o.h + 12 * u); });
    ctx.restore();
  }
  // 圈選：九個取樣點（四角、四邊中點、中心）有五個以上在圈裡就算圈到
  function objHits(objs, L) {
    return objs.filter(function (o) {
      var k = 0;
      for (var i = 0; i <= 2; i++) for (var j = 0; j <= 2; j++) if (inPoly(o.x + o.w * i / 2, o.y + o.h * j / 2, L)) k++;
      return k >= 5;
    });
  }
  function objAt(objs, x, y) {
    for (var i = objs.length - 1; i >= 0; i--) { var o = objs[i]; if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o; }
    return null;
  }
  function rectOf(o) { return { x: o.x, y: o.y, w: o.w, h: o.h }; }
  function setRect(o, r) { o.x = r.x; o.y = r.y; o.w = r.w; o.h = r.h; }

  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = 0;
    if (L > 0) t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    var x = ax + t * dx - px, y = ay + t * dy - py;
    return Math.sqrt(x * x + y * y);
  }
  function near(s, x, y, R) {
    var p = s.p, n = p.length / 3;
    if (n === 1) return Math.hypot(p[0] - x, p[1] - y) <= R;
    for (var k = 1; k < n; k++) {
      if (distSeg(x, y, p[3 * k - 3], p[3 * k - 2], p[3 * k], p[3 * k + 1]) <= R) return true;
    }
    return false;
  }
  // 點在不在圈起來的多邊形裡（射線法）
  function inPoly(x, y, poly) {
    var inside = false, n = poly.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = poly[2 * i], yi = poly[2 * i + 1], xj = poly[2 * j], yj = poly[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // 圈選規則：筆畫有一半以上的點在圈裡就算圈到（邊圈邊預覽和放開時選取都用這個）
  function lassoHits(strokes, L) {
    var lx0 = Infinity, ly0 = Infinity, lx1 = -Infinity, ly1 = -Infinity, out = [];
    for (var i = 0; i < L.length; i += 2) {
      lx0 = Math.min(lx0, L[i]); lx1 = Math.max(lx1, L[i]);
      ly0 = Math.min(ly0, L[i + 1]); ly1 = Math.max(ly1, L[i + 1]);
    }
    strokes.forEach(function (st) {
      var p = st.p, n = p.length / 3, need = n / 2, k = 0, miss = 0;
      for (var j = 0; j < p.length; j += 3) {
        var x = p[j], y = p[j + 1];
        if (x >= lx0 && x <= lx1 && y >= ly0 && y <= ly1 && inPoly(x, y, L)) { if (++k >= need) break; }
        else if (++miss > n - need) break;
      }
      if (k && k >= need) out.push(st);
    });
    return out;
  }
  // 圈到的筆跡底下墊一層半透明的強調色光暈，看得出選到哪些字。
  // 同樣粗細的筆畫合成一條路徑一次畫，交叉的地方才不會疊得比較深
  function drawHalo(ctx, strokes, color, u) {
    var groups = {}, keys = [];
    strokes.forEach(function (s) {
      var w = Math.round((baseW(s) + 12 * u) * 2) / 2;
      if (!groups[w]) { groups[w] = []; keys.push(w); }
      groups[w].push(s);
    });
    ctx.save();
    ctx.globalAlpha = darkNow ? 0.45 : 0.32;
    ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round";
    keys.forEach(function (w) {
      ctx.beginPath();
      groups[w].forEach(function (s) {
        var p = s.p;
        ctx.moveTo(p[0], p[1]);
        if (p.length === 3) ctx.lineTo(p[0] + 0.01, p[1]);
        for (var i = 3; i < p.length; i += 3) ctx.lineTo(p[i], p[i + 1]);
      });
      ctx.lineWidth = w;
      ctx.stroke();
    });
    ctx.restore();
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  /* 提示訊息：畫面下方短暫出現一句（不佔紙的位置、不擋筆）。空字串＝收起來。
     ms 沒給的話依字數決定停留多久（2.5–7 秒） */
  var toastEl = null, toastTimer = 0;
  function toast(t, ms) {
    if (!toastEl) {
      toastEl = el("div", "ink-toast");
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    clearTimeout(toastTimer);
    if (!t) { toastEl.classList.remove("on"); return; }
    toastEl.textContent = t;
    toastEl.classList.add("on");
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, ms || clamp(t.length * 110, 2500, 7000));
  }
  // 操作說明：同一種最多出現 TIP_MAX 次（看過幾次就知道了，之後不再出現）
  function tipLeft(key) {
    var n = pref.tips && pref.tips[key] != null ? pref.tips[key] : key === "line" ? pref.snapTip || 0 : 0;
    return n < TIP_MAX;
  }
  function tipSeen(key) {
    pref.tips = pref.tips || {};
    pref.tips[key] = (pref.tips[key] != null ? pref.tips[key] : key === "line" ? pref.snapTip || 0 : 0) + 1;
    savePref();
  }
  // 面板上方的標題列：標題、小字說明、關閉鈕
  function popHead(title, sub) {
    return '<div class="ink-pop-head"><b>' + title + "</b>" + (sub ? "<span>" + sub + "</span>" : "") +
      '<button type="button" class="ink-pop-x" data-close aria-label="收起' + title + '" title="收起">' + I("close") + "</button></div>";
  }

  /* ---------- 一塊手寫板 ---------- */
  function Pad(wrap, key, toggle) {
    this.key = key; this.toggle = toggle;
    this.strokes = []; this.objs = []; this.hist = []; this.fut = [];
    this.H = DEFAULT_H; this.tool = "pen"; this.scale = 1; this.ratio = 1; this.ctx = null;
    this.z = 1; this.ox = 0; this.oy = 0; this.raf = 0;
    this.saveTimer = 0; this.persist = true;

    function tool(attr, icon, name, extra) {
      return '<button type="button" class="ink-tool" ' + attr + (extra || "") + ">" + I(icon) + "<span>" + name + "</span></button>";
    }
    function btn(act, icon, name, title) {
      return '<button type="button" data-act="' + act + '"' + (name ? "" : ' aria-label="' + title + '"') + ' title="' + title + '">' + I(icon) + (name ? "<span>" + name + "</span>" : "") + "</button>";
    }
    function big(attr, icon, name, sub) {
      return '<button type="button" ' + attr + ">" + I(icon) + "<span>" + name + "</span><small>" + sub + "</small></button>";
    }
    var panel = this.panel = el("div", "ink-panel");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ink-tools" role="toolbar" aria-label="手寫工具">' +
        // 第一排：寫字用的工具｜插入、更多
        '<div class="ink-row">' +
          tool('data-pen="w"', PENS.fountain.icon, PENS.fountain.name) +
          tool('data-pen="hl"', "highlighter", "螢光筆") +
          tool('data-tool="eraser"', "eraser", "橡皮擦") +
          tool('data-tool="select"', "lasso", "選取") +
          '<span class="ink-div" aria-hidden="true"></span>' +
          tool('data-act="ins"', "plus", "插入", ' aria-expanded="false" title="插入圖片或 .md 筆記"') +
          tool('data-act="menu"', "more", "更多", ' aria-expanded="false" title="存成圖片、清除、設定"') +
        "</div>" +
        // 第二排：這支筆的快速選色和粗細｜復原、重做
        '<div class="ink-row"><div class="ink-colors"></div>' +
          '<div class="ink-hist">' + btn("undo", "undo", "", "復原") + btn("redo", "redo", "", "重做") + "</div></div>" +
      "</div>" +
      // 工具列下面展開的面板（一次只開一個）
      '<div class="ink-pop ink-cfg" hidden></div>' +
      '<div class="ink-pop ink-ins" hidden>' + popHead("插入", "放在筆跡下面，可以直接在上面寫") +
        '<div class="ink-btns">' +
          big('data-ins="img"', "image", "圖片", "從相簿或檔案選") +
          big('data-ins="paste"', "paste", "貼上圖片", "剛剛複製的圖片") +
          big('data-ins="md"', "file", ".md 筆記", "排版好放在紙上") +
        "</div>" +
        "<p>要移動、縮放或刪除，用「選取」點一下；橡皮擦不會擦到。電腦上也可以按 Ctrl＋V，或把檔案拖進紙裡。</p>" +
        '<input type="file" accept="image/*" data-file="img" hidden><input type="file" data-file="md" hidden>' +
      "</div>" +
      '<div class="ink-pop ink-menu" hidden>' + popHead("更多") +
        '<div class="ink-btns">' +
          big('data-act="png"', "download", "存成圖片", "下載 PNG 檔") +
          big('data-act="clear"', "trash", "清除這一題", "清掉後可以復原") +
        "</div>" +
        '<div class="ink-opts">' +
          '<label class="ink-opt"><span><b>觸控筆模式</b><small>只有筆會寫字，一指拖曳是捲動頁面</small></span><input type="checkbox" role="switch" data-opt="pen"></label>' +
          '<label class="ink-opt"><span><b>筆停住變標準圖形</b><small>畫完筆尖停住半秒：直線拉直，圓、三角形、矩形變工整</small></span><input type="checkbox" role="switch" data-opt="snap"></label>' +
        "</div>" +
      "</div>" +

      '<div class="ink-sheet"><canvas class="ink-canvas" aria-label="手寫區"></canvas>' +
        // 選取後浮在選取範圍旁邊的操作列（不放在紙的上方，免得紙被往下推、筆點歪）
        '<div class="ink-selbar" role="toolbar" aria-label="選取的筆跡" hidden><span class="ink-selinfo"></span>' +
          '<button type="button" data-sel="dup">' + I("copy") + "<span>複製</span></button>" +
          '<button type="button" data-sel="del">' + I("trash") + "<span>刪除</span></button>" +
          '<button type="button" data-sel="none" aria-label="取消選取">' + I("close") + "</button></div>" +
      "</div>" +
      // 紙的下面：縮放｜加長、縮短
      '<div class="ink-foot">' +
        '<div class="ink-grp" role="group" aria-label="縮放">' + btn("zout", "zoomOut", "", "縮小") +
          '<button type="button" data-act="zreset" class="ink-zl" aria-label="恢復 100%" title="恢復 100%">100%</button>' + btn("zin", "zoomIn", "", "放大") + "</div>" +
        '<div class="ink-grp" role="group" aria-label="紙張長度">' + btn("shrink", "shrink", "縮短", "收回一段（不會切到筆跡）") + btn("grow", "extend", "加長", "紙張加長一段") + "</div>" +
      "</div>";
    wrap.appendChild(panel);
    this.sheet = panel.querySelector(".ink-sheet");
    this.canvas = panel.querySelector("canvas");
    this.penBox = panel.querySelector('[data-opt="pen"]');
    this.snapBox = panel.querySelector('[data-opt="snap"]');
    this.zLabel = panel.querySelector(".ink-zl");
    this.swBox = panel.querySelector(".ink-colors");
    this.cfgBox = panel.querySelector(".ink-cfg");
    this.insBox = panel.querySelector(".ink-ins");
    this.menuBox = panel.querySelector(".ink-menu");
    this.selBar = panel.querySelector(".ink-selbar");
    this.sel = []; this.lasso = null; this.xf = null;
    this.bindTools();
    this.bindPointer();
    this.syncTools();
    this.syncPenOnly();
    this.syncSnap();

    var self = this, lastW = 0;
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var w = self.sheet.clientWidth;
        if (w && Math.abs(w - lastW) > 1) { lastW = w; self.layout(); }
      }).observe(this.sheet);
    }
  }

  Pad.prototype.load = function () {
    var self = this;
    return store.get(this.key).then(function (v) {
      if (v && (v.s || v.o)) { self.strokes = v.s || []; self.objs = v.o || []; self.H = v.H || DEFAULT_H; }
      self.loaded = true;
    }).catch(function () {
      self.persist = false;
      self.status("這個瀏覽器不能存筆跡（可能是無痕模式），關掉頁面就會消失", 8000);
    }).then(function () { self.layout(); });
  };

  Pad.prototype.layout = function () {
    var cssW = this.sheet.clientWidth;
    if (!cssW) return;
    this.scale = cssW / W;
    var cssH = Math.round(this.H * this.scale);
    var r = Math.min(window.devicePixelRatio || 1, 2.5);
    while (cssW * cssH * r * r > 16e6 && r > 1) r -= 0.25;
    this.ratio = r;
    var c = this.canvas;
    c.style.height = cssH + "px";
    c.width = Math.round(cssW * r);
    c.height = Math.round(cssH * r);
    this.ctx = c.getContext("2d");
    this.clampView();
    this.redraw();
    this.syncZoom();
  };

  /* 縮放：畫面顯示紙上 (ox, oy) 開始、寬 W/z、高 H/z 的範圍 */
  Pad.prototype.clampView = function () {
    this.z = clamp(this.z, 1, ZMAX);
    this.ox = clamp(this.ox, 0, W - W / this.z);
    this.oy = clamp(this.oy, 0, this.H - this.H / this.z);
  };
  Pad.prototype.toLogical = function (cx, cy) {
    var r = this.canvas.getBoundingClientRect(), s = this.scale * this.z;
    return [(cx - r.left) / s + this.ox, (cy - r.top) / s + this.oy];
  };
  Pad.prototype.setView = function () {
    var k = this.ratio * this.scale * this.z;
    this.ctx.setTransform(k, 0, 0, k, -this.ox * k, -this.oy * k);
  };
  Pad.prototype.zoomAt = function (nz, cx, cy) {
    var L = this.toLogical(cx, cy), r = this.canvas.getBoundingClientRect();
    this.z = clamp(nz, 1, ZMAX);
    var s = this.scale * this.z;
    this.ox = L[0] - (cx - r.left) / s;
    this.oy = L[1] - (cy - r.top) / s;
    this.clampView();
    this.requestDraw();
    this.syncZoom();
  };
  Pad.prototype.zoomBy = function (f) {
    var r = this.canvas.getBoundingClientRect();
    this.zoomAt(this.z * f, r.left + r.width / 2, r.top + Math.min(r.height, window.innerHeight) / 2);
  };
  Pad.prototype.syncZoom = function () {
    this.zLabel.textContent = Math.round(this.z * 100) + "%";
    this.panel.querySelector('[data-act="zout"]').disabled = this.z <= 1.001;
    this.panel.querySelector('[data-act="zin"]').disabled = this.z >= ZMAX - 0.001;
  };
  Pad.prototype.requestDraw = function () {
    var self = this;
    if (this.raf) return;
    this.raf = requestAnimationFrame(function () { self.raf = 0; self.redraw(); });
  };

  Pad.prototype.redraw = function () {
    var ctx = this.ctx;
    if (!ctx) return;
    darkNow = isDark();
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setView();
    // 方格線畫在紙上，縮放時跟著放大
    var x1 = this.ox + W / this.z, y1 = this.oy + this.H / this.z, x, y;
    ctx.beginPath();
    for (x = Math.ceil(this.ox / GRID) * GRID; x <= x1; x += GRID) { ctx.moveTo(x, this.oy); ctx.lineTo(x, y1); }
    for (y = Math.ceil(this.oy / GRID) * GRID; y <= y1; y += GRID) { ctx.moveTo(this.ox, y); ctx.lineTo(x1, y); }
    ctx.lineWidth = 1 / (this.scale * this.z);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--grid").trim() || "#e9ecf2";
    ctx.stroke();
    var pal = palette(false), sel = this.sel, xf = this.xf, u = 1 / (this.scale * this.z), f = this.ratio * this.scale * this.z;
    // 正在圈：預覽會圈到的筆畫和插入的東西；圈好了：標出選到的
    var hot = this.lasso ? this.lassoPreview() : sel;
    var glow = hot.length ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c42f3d" : "";
    var hotS = hot.filter(function (x) { return !isObj(x); }), hotO = hot.filter(isObj);
    if (sel.length && xf) {
      var move = function () { ctx.translate(xf.ox + xf.dx, xf.oy + xf.dy); ctx.scale(xf.s, xf.s); ctx.translate(-xf.ox, -xf.oy); };
      drawObjs(ctx, this.objs.filter(function (o) { return sel.indexOf(o) < 0; }), f);
      ctx.save(); move(); drawObjs(ctx, hotO, f * xf.s); drawObjHalo(ctx, hotO, glow, u / xf.s); ctx.restore();
      drawAll(ctx, this.strokes.filter(function (st) { return sel.indexOf(st) < 0; }), pal);
      ctx.save(); move(); drawHalo(ctx, hotS, glow, u / xf.s); drawAll(ctx, hotS, pal); ctx.restore();
    } else {
      drawObjs(ctx, this.objs, f);
      drawObjHalo(ctx, hotO, glow, u);
      if (hotS.length) drawHalo(ctx, hotS, glow, u);
      drawAll(ctx, this.strokes, pal);
    }
    this.drawOverlay(ctx);
    if (this.sel.length) this.placeSelBar();
  };

  /* ---------- 選取：圈選、移動、縮放、複製、刪除 ---------- */
  // 選取範圍（含線條粗細）；moved＝true 時算上正在拖曳的位移和縮放
  Pad.prototype.selBox = function (moved) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    this.sel.forEach(function (st) {
      if (isObj(st)) {
        x0 = Math.min(x0, st.x); y0 = Math.min(y0, st.y); x1 = Math.max(x1, st.x + st.w); y1 = Math.max(y1, st.y + st.h);
        return;
      }
      var r = baseW(st) / 2;
      for (var i = 0; i < st.p.length; i += 3) {
        x0 = Math.min(x0, st.p[i] - r); x1 = Math.max(x1, st.p[i] + r);
        y0 = Math.min(y0, st.p[i + 1] - r); y1 = Math.max(y1, st.p[i + 1] + r);
      }
    });
    var pad = 6 / (this.scale * this.z);
    var b = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
    var xf = this.xf;
    if (moved && xf) {
      b = { x0: xf.ox + (b.x0 - xf.ox) * xf.s + xf.dx, y0: xf.oy + (b.y0 - xf.oy) * xf.s + xf.dy,
            x1: xf.ox + (b.x1 - xf.ox) * xf.s + xf.dx, y1: xf.oy + (b.y1 - xf.oy) * xf.s + xf.dy };
    }
    return b;
  };
  Pad.prototype.drawOverlay = function (ctx) {
    if (!this.lasso && !this.sel.length) return;
    var u = 1 / (this.scale * this.z), cs = getComputedStyle(document.documentElement);
    var accent = cs.getPropertyValue("--accent").trim() || "#c42f3d", card = cs.getPropertyValue("--card").trim() || "#fff";
    ctx.save();
    ctx.globalAlpha = 1; ctx.lineWidth = 1.6 * u; ctx.strokeStyle = accent; ctx.setLineDash([6 * u, 5 * u]);
    var L = this.lasso;
    if (L && L.length >= 4) {
      ctx.beginPath(); ctx.moveTo(L[0], L[1]);
      for (var i = 2; i < L.length; i += 2) ctx.lineTo(L[i], L[i + 1]);
      ctx.stroke();
    }
    if (this.sel.length) {
      var b = this.selBox(true);
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(b.x1, b.y1, 9 * u, 0, Math.PI * 2);
      ctx.fillStyle = card; ctx.fill(); ctx.lineWidth = 2.4 * u; ctx.stroke();
    }
    ctx.restore();
  };
  // 「3 筆、1 張圖、1 份筆記」
  function selText(list) {
    var ns = 0, ni = 0, nm = 0, out = [];
    list.forEach(function (x) { if (!isObj(x)) ns++; else if (x.kind === "img") ni++; else nm++; });
    if (ns) out.push(ns + " 筆");
    if (ni) out.push(ni + " 張圖");
    if (nm) out.push(nm + " 份筆記");
    return out.join("、");
  }
  Pad.prototype.setSel = function (list) {
    this.sel = list; this.xf = null;
    this.selBar.hidden = !list.length;
    if (list.length) this.selBar.querySelector(".ink-selinfo").textContent = selText(list);
    this.requestDraw();
  };
  // 操作列放在選取範圍下面；下面放不下就放上面；拖曳時先藏起來
  Pad.prototype.placeSelBar = function () {
    var bar = this.selBar;
    if (!this.sel.length) return;
    bar.classList.toggle("dragging", !!this.xf);
    var b = this.selBox(true), k = this.scale * this.z;
    var bw = bar.offsetWidth, bh = bar.offsetHeight, sw = this.sheet.clientWidth, sh = this.canvas.clientHeight;
    var left = (b.x0 - this.ox) * k, top = (b.y1 - this.oy) * k + 10;
    if (top + bh > sh - 4) top = (b.y0 - this.oy) * k - bh - 10;
    bar.style.left = clamp(left, 4, Math.max(4, sw - bw - 4)) + "px";
    bar.style.top = clamp(top, 4, Math.max(4, sh - bh - 4)) + "px";
  };
  // 邊圈邊預覽圈到哪些筆畫。筆跡很多時重算比較花時間，所以最多每 40ms 算一次
  // （算一次很久的話，間隔拉長成花費時間的 4 倍，畫面才不會卡）；
  // 筆停下來時補算最後一次，預覽才會跟放開時選到的一樣
  Pad.prototype.lassoPreview = function () {
    var L = this.lasso, self = this, now = Date.now(), gap = this.hitGap || 40;
    if (!L || L.length < 6) return [];
    if (this.hitLen !== L.length) {
      if (now - (this.hitAt || 0) >= gap) {
        this.hits = lassoHits(this.strokes, L).concat(objHits(this.objs, L)); this.hitLen = L.length;
        this.hitAt = Date.now(); this.hitGap = Math.max(40, (this.hitAt - now) * 4);
        if (this.hits.length !== this.hitShown && tipLeft("lasso")) {
          this.hitShown = this.hits.length;
          this.status(this.hits.length ? "圈到 " + selText(this.hits) + "（有光暈的），放開就選取" : "把要選的東西圈起來：一筆有一半以上在圈裡就算圈到");
        }
      } else if (!this.hitTimer) {
        this.hitTimer = setTimeout(function () { self.hitTimer = 0; self.requestDraw(); }, gap - (now - (this.hitAt || 0)) + 5);
      }
    }
    return this.hits || [];
  };
  // 圈完：筆畫有一半以上的點在圈裡就選進來；圈得太小（等於點一下）就選手指下面最上層的那一筆
  Pad.prototype.finishLasso = function () {
    var L = this.lasso, found = [];
    this.lasso = null;
    this.hits = null; this.hitLen = 0; this.hitAt = 0; this.hitShown = -1;
    var w = 0, h = 0;
    if (L) {
      var xs = L.filter(function (v, i) { return i % 2 === 0; }), ys = L.filter(function (v, i) { return i % 2 === 1; });
      w = Math.max.apply(null, xs) - Math.min.apply(null, xs); h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    }
    var tiny = !L || L.length < 6 || (w < 12 / this.z && h < 12 / this.z);
    if (tiny && L) {
      // 點一下：先找筆跡，沒有的話選手指下面最上層的圖片或筆記
      for (var i = this.strokes.length - 1; i >= 0; i--) if (near(this.strokes[i], L[0], L[1], 10 / this.z + baseW(this.strokes[i]) / 2)) { found = [this.strokes[i]]; break; }
      if (!found.length) { var o = objAt(this.objs, L[0], L[1]); if (o) found = [o]; }
    } else if (L) {
      found = lassoHits(this.strokes, L).concat(objHits(this.objs, L));
    }
    this.setSel(found);
    // 點空白的地方只是取消選取，不用提示；真的圈了卻沒圈到才說明
    if (found.length) this.hint("lasso", "選到 " + selText(found) + "（有光暈的就是）：拖框裡面可以移動，拖右下角的圓點可以縮放");
    else if (!tiny) this.status("沒有圈到東西：一筆要有一半以上在圈裡才算");
    else if (!this.lassoHad) this.hint("tap", "這裡沒有東西：用筆把要選的東西圈起來，或直接點一下那一筆、那張圖");
    else this.status("");
    this.lassoHad = false;
  };
  // 放開時把位移、縮放真的寫進筆畫（可以復原）
  Pad.prototype.commitXf = function () {
    var xf = this.xf;
    this.xf = null;
    if (!xf || (Math.abs(xf.dx) < 0.5 && Math.abs(xf.dy) < 0.5 && Math.abs(xf.s - 1) < 0.005)) { this.requestDraw(); return; }
    function r10(v) { return Math.round(v * 10) / 10; }
    var items = this.sel.filter(function (x) { return !isObj(x); }).map(function (st) {
      var it = { s: st, p0: st.p.slice(), sw0: st.sw };
      for (var i = 0; i < st.p.length; i += 3) {
        st.p[i] = r10(xf.ox + (st.p[i] - xf.ox) * xf.s + xf.dx);
        st.p[i + 1] = r10(xf.oy + (st.p[i + 1] - xf.oy) * xf.s + xf.dy);
      }
      if (xf.s !== 1) st.sw = Math.round((st.sw != null ? st.sw : SIZES[st.w] || SIZES[1]) * xf.s * 100) / 100;
      it.p1 = st.p.slice(); it.sw1 = st.sw;
      return it;
    });
    var objs = this.sel.filter(isObj).map(function (o) {
      var r0 = rectOf(o);
      setRect(o, { x: r10(xf.ox + (o.x - xf.ox) * xf.s + xf.dx), y: r10(xf.oy + (o.y - xf.oy) * xf.s + xf.dy), w: r10(o.w * xf.s), h: r10(o.h * xf.s) });
      return { o: o, r0: r0, r1: rectOf(o) };
    });
    this.push({ t: "xf", items: items, objs: objs });
    this.redraw();
  };
  Pad.prototype.dupSel = function () {
    if (!this.sel.length) return;
    var self = this, off = 30;
    var b = this.selBox(false);
    if (b.y1 + off > this.H) off = -30;
    var copies = this.sel.map(function (st) {
      var c = JSON.parse(JSON.stringify(st));
      if (isObj(c)) { c.x += 30; c.y += off; self.objs.push(c); return c; }
      for (var i = 0; i < c.p.length; i += 3) { c.p[i] += 30; c.p[i + 1] += off; }
      self.strokes.push(c);
      return c;
    });
    this.push({ t: "dup", items: copies.filter(function (x) { return !isObj(x); }), objs: copies.filter(isObj) });
    this.setSel(copies);
    this.status("已複製，可以拖到想放的位置");
  };
  Pad.prototype.delSel = function () {
    if (!this.sel.length) return;
    var removed = [], gone = [], i;
    for (i = this.strokes.length - 1; i >= 0; i--) {
      if (this.sel.indexOf(this.strokes[i]) >= 0) { removed.push([i, this.strokes[i]]); this.strokes.splice(i, 1); }
    }
    for (i = this.objs.length - 1; i >= 0; i--) {
      if (this.sel.indexOf(this.objs[i]) >= 0) { gone.push([i, this.objs[i]]); this.objs.splice(i, 1); }
    }
    this.setSel([]);
    this.push({ t: "del", items: removed, objs: gone });
    this.redraw();
    this.status("已刪除選取的東西（可以按「復原」救回來）");
  };

  /* ---------- 插入圖片和 .md 筆記 ---------- */
  // 紙上「現在看得到的地方」的最上面（頁面頂端有固定的標題列，留 70px）
  Pad.prototype.visibleTop = function () {
    var r = this.canvas.getBoundingClientRect(), s = this.scale * this.z;
    return clamp(this.oy + Math.max(0, 70 - r.top) / s, 0, this.H);
  };
  // 放到紙上：太長就縮小、紙不夠長就自動加長；插入後直接選取，馬上可以移動、縮放
  // 會跟已經插入的圖片、筆記重疊的話，往下移到它們的下面
  Pad.prototype.freeY = function (x, y, w, h) {
    for (var moved = true, n = 0; moved && n < 60; n++) {
      moved = false;
      for (var i = 0; i < this.objs.length; i++) {
        var o = this.objs[i];
        if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) { y = Math.round(o.y + o.h + 20); moved = true; }
      }
    }
    return y;
  };
  // tip、note：第一次幾次的操作說明；short：之後只顯示這句
  Pad.prototype.addObj = function (o, tip, note, short) {
    var H0 = this.H;
    if (o.h > MAX_H - 40) { var s = (MAX_H - 40) / o.h; o.w = Math.round(o.w * s); o.h = Math.round(o.h * s); o.x = Math.round((W - o.w) / 2); }
    o.y = this.freeY(o.x, o.y, o.w, o.h);
    if (o.y + o.h > MAX_H - 20) o.y = Math.max(20, MAX_H - 20 - o.h);
    var need = Math.ceil((o.y + o.h + 40) / GRID) * GRID;
    if (need > this.H) this.setH(Math.min(MAX_H, need));
    this.objs.push(o);
    this.push({ t: "addO", o: o, from: H0, to: this.H });
    this.tool = "select";
    this.openPop(null);
    this.setSel([o]);
    this.syncTools();
    this.hint(tip, note, short);
    // 放在畫面下方看不到的地方時，把頁面捲過去
    var r = this.canvas.getBoundingClientRect(), top = r.top + (o.y - this.oy) * this.scale * this.z;
    if (top > window.innerHeight - 120 || top < 60) window.scrollBy({ top: top - 120, behavior: "smooth" });
  };
  // .md 排好之後才知道真正的高度：更新卡片的高度，超出紙的話把紙加長（太長就縮小卡片）
  Pad.prototype.cardReady = function (key, lh) {
    var self = this, grew = false;
    this.objs.forEach(function (o) {
      if (o.kind !== "md" || (cardKey(o, false) !== key && cardKey(o, true) !== key)) return;
      var h = Math.round(o.w * lh / MD_W * 10) / 10;
      if (o.y + h > MAX_H - 10) {
        var s = Math.max(0.3, (MAX_H - 10 - o.y) / h);
        o.w = Math.round(o.w * s); h = Math.round(h * s * 10) / 10;
      }
      if (Math.abs(h - o.h) > 0.5) { o.h = h; grew = true; }
    });
    var need = 0;
    this.objs.forEach(function (o) { need = Math.max(need, o.y + o.h + 40); });
    need = Math.min(MAX_H, Math.ceil(need / GRID) * GRID);
    if (need > this.H) { this.setH(need); grew = true; }
    if (grew && this.loaded) this.changed();
    this.requestDraw();
    if (this.sel.length) this.placeSelBar();
  };
  Pad.prototype.insertImage = function (blob) {
    var self = this;
    if (!blob || !/^image\//.test(blob.type || "")) { this.status("這不是圖片檔"); return Promise.resolve(); }
    this.status("正在處理圖片…");
    return X.prepImage(blob).then(function (r) {
      useImg(r.id, r.url);
      return store.get(IMG_KEY + r.id).catch(function () { return null; }).then(function (v) {
        if (v && v.img) return r;
        return store.put(IMG_KEY + r.id, { v: 1, img: r.url, w: r.w, h: r.h, t: Date.now() }).then(function () { return r; });
      });
    }).then(function (r) {
      var w = clamp(r.w, 200, 900), h = w * r.h / r.w;
      if (h > 1100) { h = 1100; w = h * r.w / r.h; }
      self.addObj({ kind: "img", id: r.id, x: Math.round((W - w) / 2), y: Math.round(self.visibleTop() + 20), w: Math.round(w), h: Math.round(h) },
        "insImg", "已插入圖片：拖框裡面可以移動，拖右下角的圓點可以縮放；不要的話按「刪除」", "已插入圖片");
    }).catch(function () { self.status("這張圖片讀不出來，或這個瀏覽器不能存圖片（例如無痕模式）"); });
  };
  Pad.prototype.insertMd = function (file) {
    var self = this;
    if (file.size > 300000) { this.status("這個檔案太大（超過 300 KB），請分成幾個小一點的 .md"); return Promise.resolve(); }
    return file.text().then(function (txt) {
      if (/\u0000/.test(txt)) throw new Error("binary");
      var name = file.name || "筆記.md", h = Math.min(MAX_H - 60, X.guessCardH(txt));
      self.addObj({ kind: "md", md: txt, name: name, x: Math.round((W - MD_W) / 2), y: Math.round(self.visibleTop() + 20), w: MD_W, h: h },
        "insMd", "已插入 " + name + "：可以直接在上面寫字、劃重點；用「選取」點一下就能移動、縮放、刪除", "已插入 " + name);
    }).catch(function () { self.status("讀不出這個檔案：請選 .md 或 .txt 的文字檔"); });
  };
  Pad.prototype.insertFiles = function (files) {
    var self = this;
    Array.prototype.forEach.call(files || [], function (f) {
      if (/^image\//.test(f.type)) self.insertImage(f);
      else if (/\.(md|markdown|txt)$/i.test(f.name || "") || /^text\//.test(f.type)) self.insertMd(f);
      else self.status("只能插入圖片，或 .md、.txt 的文字檔");
    });
  };
  // 手機上沒有 Ctrl＋V：按鈕直接讀剪貼簿（瀏覽器會問要不要允許）
  Pad.prototype.pasteClipboard = function () {
    var self = this;
    if (!navigator.clipboard || !navigator.clipboard.read) {
      this.status("這個瀏覽器不讓網頁讀剪貼簿：請改按「圖片」從相簿選；電腦上可以直接按 Ctrl＋V");
      return Promise.resolve();
    }
    return navigator.clipboard.read().then(function (items) {
      for (var i = 0; i < items.length; i++) {
        var t = items[i].types.filter(function (x) { return /^image\//.test(x); })[0];
        if (t) return items[i].getType(t).then(function (b) { return self.insertImage(b.type ? b : new Blob([b], { type: t })); });
      }
      self.status("剪貼簿裡沒有圖片：先在別的地方「複製圖片」，再按一次「貼上圖片」");
    }).catch(function () { self.status("沒辦法讀剪貼簿（可能沒有允許）：請改按「圖片」從相簿選"); });
  };
  /* 工具列下面的面板：筆的設定（cfg）、插入（ins）、更多（menu），一次只開一個；null＝全部收起 */
  Pad.prototype.openPop = function (name) {
    var boxes = { cfg: this.cfgBox, ins: this.insBox, menu: this.menuBox };
    for (var k in boxes) boxes[k].hidden = k !== name;
    if (name === "cfg") this.renderCfg();
    this.syncTools();
  };
  Pad.prototype.togglePop = function (name) {
    var box = { cfg: this.cfgBox, ins: this.insBox, menu: this.menuBox }[name];
    this.openPop(box.hidden ? name : null);
  };

  // 提示訊息（畫面下方短暫出現）；hint 是操作說明，同一種最多出現 TIP_MAX 次，之後改顯示 short（沒有就不顯示）
  Pad.prototype.status = function (t, ms) { this.lastStatus = t; toast(t, ms); };
  Pad.prototype.hint = function (key, t, short) {
    if (tipLeft(key)) { tipSeen(key); this.status(t); }
    else if (short) this.status(short);
  };

  Pad.prototype.syncTools = function () {
    var self = this, tp = penType(), wp = writePen(), cfg = penCfg(tp), pen = this.tool === "pen";
    // 第一排：「筆」按鈕換成現在用的那一種筆的圖示和名稱；選中的工具凸起來
    var wb = this.panel.querySelector('[data-pen="w"]');
    if (wb.dataset.type !== wp) {
      wb.dataset.type = wp;
      wb.innerHTML = I(PENS[wp].icon) + "<span>" + PENS[wp].name + "</span>";
    }
    this.panel.querySelectorAll(".ink-tools [data-pen], .ink-tools [data-tool]").forEach(function (b) {
      var on = b.dataset.pen ? pen && (b.dataset.pen === "hl") === (tp === "hl") : b.dataset.tool === self.tool;
      b.setAttribute("aria-pressed", String(on));
      if (b.dataset.pen) b.title = on ? "再點一次：" + (tp === "hl" ? "粗細和顏色" : "換筆、粗細和顏色") : b.textContent;
    });
    this.panel.querySelector('[data-act="menu"]').setAttribute("aria-expanded", String(!this.menuBox.hidden));
    // 第二排：快速選色（一般的筆是黑紅藍綠，螢光筆是四個螢光色），最後一顆「● 數字」打開筆的設定
    var quick = tp === "hl" ? QUICK.hl : QUICK.pen;
    var dot = Math.max(6, Math.min(18, cfg.sw * (tp === "hl" ? 0.5 : 1.4)));
    this.swBox.innerHTML = quick.map(function (c) {
      return '<button type="button" class="ink-sw" data-color="' + c + '" aria-label="' + colorName(c) + '" title="' + colorName(c) + '" aria-pressed="' + (pen && sameColor(cfg.c, c)) + '"><span style="background:' + swatchCss(c) + '"></span></button>';
    }).join("") +
      '<button type="button" class="ink-cur" data-act="cfg" aria-expanded="' + !this.cfgBox.hidden + '" aria-label="' + PENS[tp].name + "的粗細和顏色" + '" title="粗細和顏色">' +
      '<i style="width:' + dot + "px;height:" + dot + "px;background:" + swatchCss(cfg.c) + (tp === "hl" ? ";opacity:.6" : "") + '"></i><b>' + cfg.sw + "</b></button>";
    this.panel.querySelector('[data-act="ins"]').setAttribute("aria-expanded", String(!this.insBox.hidden));
    this.panel.querySelector('[data-act="undo"]').disabled = !this.hist.length;
    this.panel.querySelector('[data-act="redo"]').disabled = !this.fut.length;
    this.panel.querySelector('[data-act="grow"]').disabled = this.H >= MAX_H;
    this.panel.querySelector('[data-act="shrink"]').disabled = this.H <= DEFAULT_H;
    this.canvas.style.cursor = this.tool === "eraser" ? "cell" : this.tool === "select" ? "default" : "crosshair";
    if (!this.cfgBox.hidden) this.syncCfg();
  };
  // 筆的設定：種類（螢光筆以外）、粗細和顏色，套用在現在選的那種筆
  Pad.prototype.renderCfg = function () {
    var tp = penType(), P = PENS[tp], cfg = penCfg(tp);
    this.cfgFor = tp;
    var types = tp === "hl" ? "" : '<div class="ink-types" role="group" aria-label="筆的種類">' +
      PEN_ORDER.filter(function (t) { return t !== "hl"; }).map(function (t) {
        return '<button type="button" data-type="' + t + '" aria-pressed="' + (t === tp) + '">' + I(PENS[t].icon) + "<span>" + PENS[t].name + "</span></button>";
      }).join("") + "</div>";
    this.cfgBox.innerHTML =
      popHead(tp === "hl" ? "螢光筆" : "筆", tp === "hl" ? "粗細和顏色" : "每一種筆各自記住粗細和顏色") + types +
      '<label class="ink-w"><span>粗細</span><input type="range" min="' + P.min + '" max="' + P.max + '" step="' + P.step + '" value="' + cfg.sw + '"><output>' + cfg.sw + "</output></label>" +
      '<canvas class="ink-prev" aria-hidden="true"></canvas>' +
      PALETTES.map(function (g) {
        return '<div class="ink-pal"><span>' + g.name + "</span><div>" + g.colors.map(function (c) {
          return '<button type="button" data-pc="' + c + '" aria-label="' + colorName(c) + '" title="' + colorName(c) + '"><span style="background:' + swatchCss(c) + '"></span></button>';
        }).join("") + "</div></div>";
      }).join("") +
      '<div class="ink-custom"><label>自訂顏色 <input type="color" value="' + hexOf(cfg.c) + '"></label>' +
      '<button type="button" data-cfg="reset">恢復這支筆的預設</button></div>';
    this.syncCfg();
  };
  Pad.prototype.syncCfg = function () {
    var tp = penType();
    if (this.cfgFor !== tp) { this.renderCfg(); return; }
    var cfg = penCfg(tp), box = this.cfgBox;
    var r = box.querySelector("input[type=range]");
    if (document.activeElement !== r) r.value = cfg.sw;
    box.querySelector("output").textContent = cfg.sw;
    box.querySelectorAll("[data-pc]").forEach(function (b) { b.setAttribute("aria-pressed", String(sameColor(b.dataset.pc, cfg.c))); });
    var ci = box.querySelector("input[type=color]");
    if (document.activeElement !== ci) ci.value = hexOf(cfg.c);
    this.preview(cfg, tp);
  };
  // 預覽：用現在的粗細和顏色畫一條波浪線（跟紙上 100% 時一樣粗）
  Pad.prototype.preview = function (cfg, tp) {
    var cv = this.cfgBox.querySelector(".ink-prev"), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    var r = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * r); cv.height = Math.round(h * r);
    var x = cv.getContext("2d"), sc = this.scale || w / W;
    x.setTransform(r, 0, 0, r, 0, 0);
    darkNow = isDark();
    var s = { c: cfg.c, sw: cfg.sw * sc, t: tp === "fountain" ? undefined : tp, pen: true, p: [] };
    for (var i = 0; i <= 40; i++) {
      var t = i / 40, px = 14 + t * (w - 28), py = h / 2 + Math.sin(t * Math.PI * 2) * (h / 2 - 12) * 0.6;
      s.p.push(px, py, 35 + 40 * Math.sin(t * Math.PI));
    }
    drawStroke(x, s, palette(false));
  };
  Pad.prototype.syncPenOnly = function () { this.penBox.checked = pref.penOnly === true; };
  // 筆停住變直線、標準圖形的開關：pref.snapOff＝關掉（停多久是固定的 HOLD_MS）
  Pad.prototype.syncSnap = function () { this.snapBox.checked = pref.snapOff !== true; };

  Pad.prototype.bindTools = function () {
    var self = this;
    // 工具列、「更多」、紙下面那一排的按鈕（筆的設定、插入面板裡的按鈕另外處理）
    this.panel.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !self.panel.contains(b) || b.closest(".ink-sheet")) return;
      var a = b.dataset.act;
      if (b.hasAttribute("data-close")) { self.openPop(null); return; }
      if (b.dataset.pen) {
        // 選中的筆再點一次：打開（或收起）筆的設定
        var hl = b.dataset.pen === "hl";
        if (self.tool === "pen" && (penType() === "hl") === hl) { self.togglePop("cfg"); return; }
        choosePen(hl ? "hl" : writePen());
        self.tool = "pen";
        syncAll();
      }
      else if (b.dataset.tool) {
        self.tool = b.dataset.tool;
        if (!self.cfgBox.hidden) self.openPop(null);
        if (self.tool === "select") self.hint("select", "用筆把要選的東西圈起來，或直接點一下那一筆、那張圖");
      }
      else if (b.dataset.color != null) { setPenCfg({ c: parseColor(b.dataset.color) }); self.tool = "pen"; syncAll(); }
      else if (a === "cfg") { self.tool = "pen"; self.togglePop("cfg"); return; }
      else if (a === "ins") { activePad = self; self.togglePop("ins"); return; }
      else if (a === "menu") { self.togglePop("menu"); return; }
      else if (a === "undo") self.undo();
      else if (a === "redo") self.redo();
      else if (a === "zin") self.zoomBy(1.5);
      else if (a === "zout") self.zoomBy(1 / 1.5);
      else if (a === "zreset") { self.z = 1; self.ox = self.oy = 0; self.requestDraw(); self.syncZoom(); }
      else if (a === "grow") self.extend();
      else if (a === "shrink") self.shrink();
      else if (a === "clear") { self.openPop(null); self.clear(); }
      else if (a === "png") { self.openPop(null); self.png(); }
      else return;
      if (self.tool !== "select" && self.sel.length) self.setSel([]);
      self.syncTools();
    });
    this.selBar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.sel === "dup") self.dupSel();
      else if (b.dataset.sel === "del") self.delSel();
      else if (b.dataset.sel === "none") { self.setSel([]); self.status(""); }
      self.syncTools();
    });
    // 設定面板：拖粗細的滑桿時即時預覽，放開才存；點顏色、自訂顏色、恢復預設
    var box = this.cfgBox;
    box.addEventListener("input", function (e) {
      if (e.target.type === "range") {
        var v = +e.target.value;
        box.querySelector("output").textContent = v;
        self.preview({ c: penCfg(penType()).c, sw: v }, penType());
      } else if (e.target.type === "color") {
        setPenCfg({ c: e.target.value.toLowerCase() }); syncAll();
      }
    });
    box.addEventListener("change", function (e) {
      if (e.target.type === "range") { setPenCfg({ sw: +e.target.value }); syncAll(); }
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.type) { choosePen(b.dataset.type); self.tool = "pen"; syncAll(); }
      else if (b.dataset.pc != null) { setPenCfg({ c: parseColor(b.dataset.pc) }); syncAll(); }
      else if (b.dataset.cfg === "reset") { if (pref.tools) delete pref.tools[penType()]; savePref(); syncAll(); }
    });
    this.penBox.addEventListener("change", function () {
      pref.penOnly = self.penBox.checked; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); });
    });
    this.snapBox.addEventListener("change", function () {
      pref.snapOff = !self.snapBox.checked; savePref();
      openPads.forEach(function (p) { p.syncSnap(); });
    });
    // 插入：三個按鈕（圖片、貼上、.md）；選好檔案就放到紙上
    this.insBox.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      activePad = self;
      if (b.dataset.ins === "img") self.insBox.querySelector('[data-file="img"]').click();
      else if (b.dataset.ins === "md") self.insBox.querySelector('[data-file="md"]').click();
      else if (b.dataset.ins === "paste") self.pasteClipboard();
    });
    this.insBox.querySelectorAll("input[type=file]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var files = Array.prototype.slice.call(inp.files || []);
        inp.value = "";
        files.forEach(function (f) { if (inp.dataset.file === "img") self.insertImage(f); else self.insertMd(f); });
      });
    });
  };

  Pad.prototype.bindPointer = function () {
    var self = this, c = this.canvas, act = null, touches = new Map();
    function pos(e) {
      var L = self.toLogical(e.clientX, e.clientY);
      return [Math.round(L[0] * 10) / 10, Math.round(L[1] * 10) / 10];
    }
    function pres(e) { return e.pointerType === "pen" ? Math.round((e.pressure || 0.5) * 100) : 50; }
    function twoTouches() { var v = []; touches.forEach(function (t) { v.push(t); }); return v; }
    function startPinch() {
      var t = twoTouches(), mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
      act = { mode: "pinch", d0: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1, z0: self.z, L0: self.toLogical(mx, my) };
    }
    function movePinch() {
      var t = twoTouches(), mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
      var d = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1;
      var r = c.getBoundingClientRect();
      self.z = clamp(act.z0 * d / act.d0, 1, ZMAX);
      var s = self.scale * self.z;
      self.ox = act.L0[0] - (mx - r.left) / s;
      self.oy = act.L0[1] - (my - r.top) / s;
      self.clampView();
      self.requestDraw();
      self.syncZoom();
    }

    /* 筆停住：筆尖停住 HOLD_MS 毫秒，直線拉成筆直的線（還可以拖動終點）；
       圓、橢圓、三角形、矩形、多邊形換成標準的圖形（inkx.js 的 fitShape 判斷，寫字和小圈圈不會被換掉） */
    function r1(v) { return Math.round(v * 10) / 10; }
    // 筆尖移動超過 4 個螢幕像素才算「還在畫」，重新計時（停住時的手抖不算移動）
    function holdFrom(a, e) {
      a.hx = e.clientX; a.hy = e.clientY; a.hi = a.s.p.length / 3;
      clearTimeout(a.timer);
      if (pref.snapOff !== true) a.timer = setTimeout(function () { snapShape(a); }, HOLD_MS);
    }
    function snapShape(a) {
      if (act !== a || a.straight || a.shaped) return;
      var p = a.s.p, n = p.length / 3, k = self.scale * self.z;   // 紙上 1 單位在螢幕上是 k 像素
      if (n < 2) return;
      var m = Math.max(2, Math.min(a.hi, n));                      // 只看停住以前畫的點
      var f = X.fitShape(p, m, k);
      if (!f) return;
      var prs = [];
      for (var i = 0; i < m; i++) prs.push(p[3 * i + 2]);
      prs.sort(function (u, v) { return u - v; });
      var pr = prs[prs.length >> 1];                               // 粗細用這一筆壓力的中位數
      if (f.kind === "line") {
        a.straight = { x: p[0], y: p[1], pr: pr };
        lineTo(a, p[3 * n - 3], p[3 * n - 2]);
        self.hint("line", "拉成直線了：還沒放開前可以拖動調整方向和長度，接近水平、垂直、45° 會自動對齊");
      } else {
        // 圖形定下來之後，放開前筆再怎麼動都不會改變它
        a.shaped = true;
        var pts = X.shapePoints(f, 6), out = [];
        for (i = 0; i < pts.length; i += 2) out.push(r1(pts[i]), r1(pts[i + 1]), pr);
        a.s.p = out;
        self.hint("shape", "變成" + (X.SHAPE_NAME[f.name] || "標準圖形") + "了（不要的話按「復原」；不想要這個功能可以在「更多」裡關掉）");
      }
      self.requestDraw();
    }
    // 直線的終點跟著筆尖；接近水平、垂直（5° 以內）或 45°（3° 以內）就對齊
    function lineTo(a, x1, y1) {
      var st = a.straight, dx = x1 - st.x, dy = y1 - st.y, L = Math.hypot(dx, dy);
      if (L > 0) {
        var step = Math.PI / 4, ang = Math.atan2(dy, dx), j = Math.round(ang / step);
        if (Math.abs(ang - j * step) < (j % 2 === 0 ? 5 : 3) * Math.PI / 180) {
          dx = L * Math.cos(j * step); dy = L * Math.sin(j * step);
        }
      }
      // 中間每隔約 6 單位放一個點，圈選（看一半以上的點在不在圈裡）和橡皮擦才跟一般筆畫一樣
      var nSeg = Math.max(1, Math.min(120, Math.ceil(L / 6))), out = [];
      for (var i = 0; i <= nSeg; i++) out.push(r1(st.x + dx * i / nSeg), r1(st.y + dy * i / nSeg), st.pr);
      a.s.p = out;
    }

    c.addEventListener("pointerdown", function (e) {
      if (!self.ctx) return;
      activePad = self;
      var isPen = e.pointerType === "pen";
      if (isPen) notePen();
      if (e.pointerType === "touch") {
        // 觸控筆模式：剛用過筆（手掌靠在螢幕上）或接觸面積很大的觸碰直接忽略，不捲動也不縮放
        if (pref.penOnly === true && (Date.now() - lastPen < 600 || (e.width > 40 && e.height > 40))) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) {
          // 第二根手指：改成縮放／移動紙張。第一根手指如果已經開始畫，那一筆取消
          if (act && act.mode === "draw" && !act.s.pen) {
            clearTimeout(act.timer);
            var at = self.strokes.lastIndexOf(act.s);
            if (at >= 0) self.strokes.splice(at, 1);
            self.requestDraw();
          } else if (act && act.mode === "erase" && act.removed.length) {
            self.push({ t: "del", items: act.removed });
          }
          if (!act || act.mode !== "draw" || !act.s.pen) { e.preventDefault(); startPinch(); self.busy = false; }
          return;
        }
        if (touches.size > 2 || act) return;
        if (pref.penOnly === true) {
          // 觸控筆模式：一根手指只用來捲動頁面
          act = { id: e.pointerId, mode: "scroll", y: e.clientY };
          return;
        }
      } else if (act) {
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch (err) {}
      var q = pos(e);
      var sideButton = (e.buttons & 32) || (isPen && (e.buttons & 2));
      if (self.tool === "select" && !sideButton) {
        self.busy = true;
        var bb = self.sel.length ? self.selBox(false) : null, tol = 22 / (self.scale * self.z);
        if (bb && Math.hypot(q[0] - bb.x1, q[1] - bb.y1) <= tol) {
          act = { id: e.pointerId, mode: "scale", bb: bb };
        } else if (bb && q[0] >= bb.x0 && q[0] <= bb.x1 && q[1] >= bb.y0 && q[1] <= bb.y1) {
          act = { id: e.pointerId, mode: "move", start: q, bb: bb };
        } else {
          self.lassoHad = self.sel.length > 0;   // 原本有選東西的話，點空白只是取消選取
          self.setSel([]);
          self.lasso = [q[0], q[1]];
          self.hits = null; self.hitLen = 0; self.hitAt = 0; self.hitShown = -1;
          act = { id: e.pointerId, mode: "lasso" };
          return;
        }
        self.xf = { dx: 0, dy: 0, s: 1, ox: bb.x0, oy: bb.y0 };
        return;
      }
      if (self.tool === "eraser" || sideButton) {
        act = { id: e.pointerId, mode: "erase", removed: [] };
        self.busy = true;
        self.eraseAt(q[0], q[1], act);
        return;
      }
      var tp = penType(), cfg = penCfg(tp);
      var s = { c: cfg.c, sw: cfg.sw, pen: isPen, p: [q[0], q[1], pres(e)] };
      if (tp !== "fountain") s.t = tp;
      if (self.z > 1.001) s.k = Math.round(100 / self.z) / 100;
      self.strokes.push(s);
      self.busy = true;
      act = { id: e.pointerId, mode: "draw", s: s, pal: palette(false) };
      holdFrom(act, e);
    });

    c.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" && touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!act) return;
      if (act.mode === "pinch") {
        if (touches.has(e.pointerId) && touches.size >= 2) { e.preventDefault(); movePinch(); }
        return;
      }
      if (e.pointerId !== act.id) return;
      if (act.mode === "scroll") { window.scrollBy(0, act.y - e.clientY); act.y = e.clientY; return; }
      e.preventDefault();
      if (act.mode === "lasso" || act.mode === "move" || act.mode === "scale") {
        var q0 = pos(e), b0 = act.bb;
        if (act.mode === "lasso") {
          var Ln = self.lasso, m = Ln.length;
          if (Math.hypot(q0[0] - Ln[m - 2], q0[1] - Ln[m - 1]) > 2 / self.z) Ln.push(q0[0], q0[1]);
        } else if (act.mode === "move") {
          // 拖曳：選取框不能拖出紙外
          self.xf.dx = clamp(q0[0] - act.start[0], -b0.x0, W - b0.x1);
          self.xf.dy = clamp(q0[1] - act.start[1], -b0.y0, self.H - b0.y1);
        } else {
          // 縮放：以左上角為基準，等比例；最小 0.2 倍，最大不超出紙
          var w0 = Math.max(1, b0.x1 - b0.x0), h0 = Math.max(1, b0.y1 - b0.y0);
          var sc = Math.max((q0[0] - b0.x0) / w0, (q0[1] - b0.y0) / h0);
          self.xf.s = clamp(sc, 0.2, Math.min(5, (W - b0.x0) / w0, (self.H - b0.y0) / h0));
        }
        self.requestDraw();
        return;
      }
      if (act.mode === "draw" && act.shaped) return;
      if (act.mode === "draw" && act.straight) {
        // 已經拉成直線：終點跟著筆尖，整張重畫（之前一段一段畫上去的彎線要清掉）
        var qe = pos(e);
        lineTo(act, qe[0], qe[1]);
        self.requestDraw();
        return;
      }
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!list.length) list = [e];
      for (var i = 0; i < list.length; i++) {
        var q = pos(list[i]);
        if (act.mode === "erase") { self.eraseAt(q[0], q[1], act); continue; }
        var p = act.s.p, n = p.length;
        if (Math.hypot(q[0] - p[n - 3], q[1] - p[n - 2]) < 0.6 / self.z) continue;
        p.push(q[0], q[1], pres(list[i]));
        if (act.s.t === "hl") continue;
        setColor(self.ctx, act.s, act.pal);
        seg(self.ctx, act.s, p.length / 3 - 1);
        self.ctx.globalAlpha = 1;
      }
      if (act.mode === "draw") {
        if (Math.hypot(e.clientX - act.hx, e.clientY - act.hy) > 4) holdFrom(act, e);
        // 螢光筆是半透明的整條路徑，邊畫邊整張重畫（才會畫在字的下面、接縫不會變深）
        if (act.s.t === "hl") self.requestDraw();
      }
    });

    function end(e) {
      if (e.pointerType === "touch") touches.delete(e.pointerId);
      if (!act) return;
      if (act.mode === "pinch") { if (touches.size < 2) act = null; return; }
      if (e.pointerId !== act.id) return;
      var a = act;
      act = null;
      self.busy = false;
      if (a.mode === "draw") {
        clearTimeout(a.timer);
        if (a.straight || a.shaped || a.s.t === "hl") self.requestDraw();
        else if (a.s.p.length === 3) drawStroke(self.ctx, a.s, a.pal);
        else { setColor(self.ctx, a.s, a.pal); tail(self.ctx, a.s); self.ctx.globalAlpha = 1; }
        self.push({ t: "add", s: a.s });
      } else if (a.mode === "erase" && a.removed.length) {
        self.push({ t: "del", items: a.removed });
      } else if (a.mode === "lasso") {
        self.finishLasso();
      } else if (a.mode === "move" || a.mode === "scale") {
        self.commitXf();
      }
    }
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    // 電腦上把圖片、.md 檔拖進紙裡
    c.addEventListener("dragover", function (e) {
      if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }
    });
    c.addEventListener("drop", function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      e.preventDefault();
      activePad = self;
      self.insertFiles(e.dataTransfer.files);
    });
    c.addEventListener("wheel", function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
        self.zoomAt(self.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
        return;
      }
      if (self.z <= 1.001) return;
      var s = self.scale * self.z, ox = self.ox, oy = self.oy;
      self.ox += e.deltaX / s; self.oy += e.deltaY / s;
      self.clampView();
      if (ox !== self.ox || oy !== self.oy) { e.preventDefault(); self.requestDraw(); }
    }, { passive: false });
  };

  Pad.prototype.eraseAt = function (x, y, a) {
    var hit = false, R = 14 / this.z;
    for (var i = this.strokes.length - 1; i >= 0; i--) {
      var s = this.strokes[i];
      if (near(s, x, y, R + baseW(s))) { a.removed.push([i, s]); this.strokes.splice(i, 1); hit = true; }
    }
    if (hit) this.redraw();
  };

  Pad.prototype.push = function (h) { this.hist.push(h); this.fut = []; this.changed(); };
  Pad.prototype.undo = function () {
    var h = this.hist.pop();
    if (!h) return;
    if (this.sel.length) this.setSel([]);
    var st = this.strokes, ob = this.objs, i;
    function drop(list, x) { var at = list.indexOf(x); if (at >= 0) list.splice(at, 1); }
    if (h.t === "add") st.splice(st.lastIndexOf(h.s), 1);
    else if (h.t === "addO") { drop(ob, h.o); if (h.from !== h.to) this.setH(h.from); }
    else if (h.t === "del") {
      for (i = h.items.length - 1; i >= 0; i--) st.splice(h.items[i][0], 0, h.items[i][1]);
      for (i = (h.objs || []).length - 1; i >= 0; i--) ob.splice(h.objs[i][0], 0, h.objs[i][1]);
    }
    else if (h.t === "clear") { this.strokes = h.items.slice(); this.objs = (h.objs || []).slice(); }
    else if (h.t === "h") this.setH(h.from);
    else if (h.t === "xf") {
      h.items.forEach(function (it) { it.s.p = it.p0.slice(); if (it.sw0 == null) delete it.s.sw; else it.s.sw = it.sw0; });
      (h.objs || []).forEach(function (it) { setRect(it.o, it.r0); });
    }
    else if (h.t === "dup") { h.items.forEach(function (c) { drop(st, c); }); (h.objs || []).forEach(function (c) { drop(ob, c); }); }
    this.fut.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.redo = function () {
    var h = this.fut.pop();
    if (!h) return;
    if (this.sel.length) this.setSel([]);
    var st = this.strokes, ob = this.objs, i;
    if (h.t === "add") st.push(h.s);
    else if (h.t === "addO") { ob.push(h.o); if (h.from !== h.to) this.setH(h.to); }
    else if (h.t === "del") {
      for (i = 0; i < h.items.length; i++) st.splice(h.items[i][0], 1);
      for (i = 0; i < (h.objs || []).length; i++) ob.splice(h.objs[i][0], 1);
    }
    else if (h.t === "clear") { this.strokes = []; this.objs = []; }
    else if (h.t === "h") this.setH(h.to);
    else if (h.t === "xf") {
      h.items.forEach(function (it) { it.s.p = it.p1.slice(); if (it.sw1 == null) delete it.s.sw; else it.s.sw = it.sw1; });
      (h.objs || []).forEach(function (it) { setRect(it.o, it.r1); });
    }
    else if (h.t === "dup") { h.items.forEach(function (c) { st.push(c); }); (h.objs || []).forEach(function (c) { ob.push(c); }); }
    this.hist.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.clear = function () {
    if (!this.strokes.length && !this.objs.length) return;
    if (!window.confirm(this.objs.length ? "清除這一題的所有筆跡、圖片和筆記？（清除後還可以按「復原」救回來）" : "清除這一題的所有筆跡？（清除後還可以按「復原」救回來）")) return;
    if (this.sel.length) this.setSel([]);
    this.hist.push({ t: "clear", items: this.strokes.slice(), objs: this.objs.slice() });
    this.fut = []; this.strokes = []; this.objs = []; this.redraw(); this.changed();
  };
  /* 紙張長度：加長一次多 600；縮短一次收回 600，但停在最後一筆的下面、不會比原本的 900 短。都可以復原 */
  Pad.prototype.setH = function (h) { this.H = h; this.clampView(); this.layout(); };
  Pad.prototype.minH = function () {
    var maxY = 0;
    this.strokes.forEach(function (s) {
      var r = baseW(s) / 2;
      for (var i = 1; i < s.p.length; i += 3) if (s.p[i] + r > maxY) maxY = s.p[i] + r;
    });
    this.objs.forEach(function (o) { maxY = Math.max(maxY, o.y + o.h); });
    return Math.max(DEFAULT_H, Math.ceil((maxY + 40) / GRID) * GRID);
  };
  Pad.prototype.extend = function () {
    if (this.H >= MAX_H) { this.status("已經是最長了"); return; }
    var from = this.H, to = Math.min(MAX_H, from + STEP_H);
    this.setH(to);
    this.push({ t: "h", from: from, to: to });
    this.hint("grow", "紙張加長了一段；用不到的話按「縮短」收回");
  };
  Pad.prototype.shrink = function () {
    var from = this.H, to = Math.max(from - STEP_H, this.minH());
    if (to >= from) {
      this.status(from <= DEFAULT_H ? "已經是原本的長度了" : "下面還有筆跡或插入的東西，先擦掉或移上來才能再縮短");
      return;
    }
    this.setH(to);
    this.push({ t: "h", from: from, to: to });
    this.status(to > from - STEP_H ? "縮短到最後一筆的下面（再往上會切到筆跡）" : to <= DEFAULT_H ? "回到原本的長度了" : "收回了一段");
  };

  Pad.prototype.hasInk = function () { return this.strokes.length > 0 || this.objs.length > 0; };
  Pad.prototype.changed = function () {
    var self = this;
    this.syncTools();
    markToggle(this.toggle, this.hasInk());
    if (!this.persist) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(function () {
      var data = { v: 1, H: self.H, s: self.strokes, t: Date.now() };
      if (self.objs.length) data.o = self.objs;
      var job = self.hasInk() ? store.put(self.key, data) : store.del(self.key);
      // 存好不另外說（筆跡會自動存，每一筆都跳訊息太吵），存不了才提醒
      job.then(function () { askPersist(); })
         .catch(function () { self.status("儲存失敗：瀏覽器的儲存空間可能滿了", 8000); });
    }, 400);
  };

  // 存成圖片：白底、淺色的墨水；.md 卡片用淺色重新排一次
  Pad.prototype.png = function () {
    var self = this;
    if (!this.hasInk()) { this.status("還沒有筆跡"); return; }
    var maxY = 0, k = 1.4;
    this.strokes.forEach(function (s) { for (var i = 1; i < s.p.length; i += 3) maxY = Math.max(maxY, s.p[i]); });
    this.objs.forEach(function (o) { maxY = Math.max(maxY, o.y + o.h); });
    var h = Math.min(this.H, Math.ceil(maxY + 60));
    var jobs = this.objs.filter(function (o) { return o.kind === "md"; }).map(function (o) {
      return X.renderCard(o.md, o.name, false, k * o.w / MD_W).then(function (r) { return [o, r]; }, function () { return [o, null]; });
    });
    if (jobs.length) this.status("正在產生圖片…");
    Promise.all(jobs).then(function (done) {
      var cv = document.createElement("canvas");
      cv.width = Math.round(W * k); cv.height = Math.round(h * k);
      var x = cv.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, cv.width, cv.height);
      x.setTransform(k, 0, 0, k, 0, 0);
      self.objs.forEach(function (o) {
        if (o.kind === "img") { var e = imgOf(o.id); if (e.state === "ok") x.drawImage(e.im, o.x, o.y, o.w, o.h); return; }
        var d = done.filter(function (q) { return q[0] === o; })[0];
        if (d && d[1]) x.drawImage(d[1].cv, o.x, o.y, o.w, o.w * d[1].lh / MD_W);
      });
      drawAll(x, self.strokes, palette(true));
      var name = self.key.replace(/[^\w-]+/g, "_") + ".png";
      try {
        cv.toBlob(function (b) { if (b) { download(name, b); if (jobs.length) self.status("已存成圖片"); } }, "image/png");
      } catch (e) { self.status("這個瀏覽器不能把 .md 筆記一起存成圖片"); }
    });
  };

  function syncAll() { openPads.forEach(function (p) { p.syncTools(); }); }
  function markToggle(t, has) {
    t.classList.toggle("has", has);
    t.querySelector("span").textContent = has ? "手寫作答（有筆跡）" : "手寫作答";
  }

  /* ---------- 掛到每一題 ---------- */
  var toggles = {}, padsByKey = {};
  document.querySelectorAll("details.quiz").forEach(function (quiz) {
    if (!quiz.id) return;
    var key = SLUG + ":" + quiz.id;
    var wrap = el("div", "ink");
    var toggle = el("button", "ink-toggle", I("pen") + "<span>手寫作答</span>");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    wrap.appendChild(toggle);
    quiz.parentNode.insertBefore(wrap, quiz);
    toggles[key] = toggle;
    var pad = null;
    toggle.addEventListener("click", function () {
      var first = !pad;
      if (first) { pad = new Pad(wrap, key, toggle); openPads.push(pad); padsByKey[key] = pad; }
      var open = pad.panel.hidden;
      pad.panel.hidden = !open;
      if (open) activePad = pad;
      toggle.setAttribute("aria-expanded", String(open));
      if (open && first) pad.load();
      else if (open) pad.layout();
    });
  });
  /* ---------- 一次性修正：題號曾經錯開時寫的筆跡，搬回正確的題目 ---------- */
  // 計結 2.0「換你試試」新加的 T-0 曾經沒有固定 id（2026-11-10 那一版），T-0～T-3 用了往後挪一格的 id
  // （T-0 是 q-u2-0-1……T-3 是 q-u2-0-4）。那一版的分頁沒有重新整理的話，之後幾天寫的也一樣。
  // q-u2-0-4 只有那一版用過，所以它有筆跡，就表示 q-u2-0-1～4 是那一版寫的：整組往前搬一格。
  // 搬完 q-u2-0-4 會清掉，所以只搬一次，也會同步到雲端；搬過去的那題如果已經有筆跡，原本的在上面、搬來的接在下面。
  var REMAP = {
    arch: { mark: "q-u2-0-4",
      moves: [["q-u2-0-1", "q-u2-0-t0"], ["q-u2-0-2", "q-u2-0-1"], ["q-u2-0-3", "q-u2-0-2"], ["q-u2-0-4", "q-u2-0-3"]] }
  };
  var remapKeys = {};
  if (REMAP[SLUG]) REMAP[SLUG].moves.forEach(function (m) { remapKeys[SLUG + ":" + m[0]] = remapKeys[SLUG + ":" + m[1]] = 1; });
  function inked(v) { return !!(v && ((v.s && v.s.length) || (v.o && v.o.length))); }
  // 兩塊筆跡疊成一塊：top 原本的在上面，add 接在它下面
  function stackPads(top, add) {
    var dy = top.H || DEFAULT_H;
    var moved = add.s.map(function (s) {
      var o = {}, k;
      for (k in s) o[k] = s[k];
      o.p = s.p.slice();
      for (var i = 1; i < o.p.length; i += 3) o.p[i] += dy;
      return o;
    });
    return { v: 1, H: dy + (add.H || DEFAULT_H), s: top.s.concat(moved) };
  }
  // 回傳有改到的 key
  function remap() {
    var R = REMAP[SLUG];
    if (!R) return Promise.resolve([]);
    var ids = Object.keys(remapKeys).map(function (k) { return k.slice(SLUG.length + 1); });
    return Promise.all(ids.map(function (id) { return store.get(SLUG + ":" + id).catch(function () { return null; }); })).then(function (vals) {
      var cur = {}, leaving = {}, filled = {}, jobs = [], changed = [], now = Date.now();
      ids.forEach(function (id, i) { cur[id] = vals[i]; });
      if (!inked(cur[R.mark])) return [];
      var src = R.moves.filter(function (m) { return inked(cur[m[0]]); });
      src.forEach(function (m) { leaving[m[0]] = 1; });
      src.forEach(function (m) {
        var a = cur[m[0]], b = leaving[m[1]] ? null : cur[m[1]];
        var v = inked(b) ? stackPads(b, a) : { v: 1, H: a.H || DEFAULT_H, s: a.s };
        v.t = now;
        filled[m[1]] = 1;
        jobs.push(store.put(SLUG + ":" + m[1], v));
        changed.push(SLUG + ":" + m[1]);
      });
      Object.keys(leaving).forEach(function (id) {
        if (filled[id]) return;
        jobs.push(DB.remove(SLUG + ":" + id, now));
        changed.push(SLUG + ":" + id);
      });
      return Promise.all(jobs).then(function () { return changed; });
    }).catch(function () { return []; });
  }

  // 重新讀這幾題：更新按鈕上的「有筆跡」，已經打開的手寫板重新載入
  function refresh(keys, note) {
    keys.forEach(function (k) {
      if (!toggles[k]) return;
      store.get(k).then(function (v) {
        var has = inked(v);
        markToggle(toggles[k], has);
        var pad = padsByKey[k];
        if (!pad || pad.busy) return;
        if (pad.sel.length) pad.setSel([]);
        pad.strokes = has ? v.s || [] : [];
        pad.objs = has ? v.o || [] : [];
        pad.H = (v && v.H) || DEFAULT_H;
        pad.hist = []; pad.fut = [];
        pad.layout(); pad.syncTools();
        pad.status(note);
      });
    });
  }

  remap().then(function () { return store.keys(); }).then(function (keys) {
    (keys || []).forEach(function (k) { if (toggles[k]) markToggle(toggles[k], true); });
  }).catch(function () {});

  // 雲端同步拉下比較新的筆跡（別台裝置還沒搬過的舊筆跡，拉下來之後也在這裡搬）
  document.addEventListener("cgep:ink-remote", function (e) {
    var keys = e.detail.keys || [];
    // 剛下載的圖片：之前顯示「還沒同步」的重新讀一次
    keys.forEach(function (k) {
      if (k.indexOf(IMG_KEY) !== 0) return;
      var id = k.slice(IMG_KEY.length);
      if (imgs[id] && imgs[id].state !== "ok") { delete imgs[id]; onImg(id); }
    });
    keys = keys.filter(function (k) { return k.indexOf(IMG_KEY) !== 0; });
    refresh(keys, "已載入雲端上比較新的筆跡");
    if (keys.some(function (k) { return remapKeys[k]; })) {
      remap().then(function (moved) { if (moved.length) refresh(moved, "筆跡已搬回正確的題目"); });
    }
  });
  // 同步完成不另外顯示訊息；順便清掉沒用到的圖片
  document.addEventListener("cgep:synced", function () { gcImages(); });
  setTimeout(function () { if (!(window.CGEP_SYNC && CGEP_SYNC.signedIn && CGEP_SYNC.signedIn())) gcImages(); }, 10000);

  // 沒有任何一題用到、而且放了一週以上的圖片，從這台裝置（和雲端）刪掉。
  // 同步完才檢查（別台裝置新加的題目已經下載了），每次開頁面最多一次；還能「復原」回來的也算用到
  var gcDone = false;
  function gcImages() {
    if (gcDone) return;
    gcDone = true;
    store.dump().then(function (all) {
      var used = {}, now = Date.now();
      function mark(o) { if (o && o.kind === "img") used[o.id] = 1; }
      Object.keys(all).forEach(function (k) { var v = all[k]; if (v && v.o) v.o.forEach(mark); });
      openPads.forEach(function (p) {
        p.objs.forEach(mark);
        p.hist.concat(p.fut).forEach(function (h) {
          mark(h.o);
          (h.objs || []).forEach(function (it) { mark(Array.isArray(it) ? it[1] : it.o || it); });
        });
      });
      Object.keys(all).forEach(function (k) {
        if (k.indexOf(IMG_KEY) !== 0 || used[k.slice(IMG_KEY.length)]) return;
        if (now - ((all[k] && all[k].t) || now) > 7 * 864e5) DB.remove(k, now);
      });
    }).catch(function () {});
  }

  // 電腦上按 Ctrl＋V：剪貼簿裡的圖片放到最後碰過的那一塊手寫板（正在輸入文字時不攔）
  document.addEventListener("paste", function (e) {
    var p = activePad, t = e.target;
    if (!p || p.panel.hidden || !e.clipboardData) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var files = [];
    Array.prototype.forEach.call(e.clipboardData.items || [], function (it) {
      if (it.kind === "file" && /^image\//.test(it.type)) { var f = it.getAsFile(); if (f) files.push(f); }
    });
    if (!files.length) return;
    e.preventDefault();
    files.forEach(function (f) { p.insertImage(f); });
  });

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var redrawAll = function () { openPads.forEach(function (p) { p.redraw(); }); };
    if (mq.addEventListener) mq.addEventListener("change", redrawAll);
    else if (mq.addListener) mq.addListener(redrawAll);
  }

  /* ---------- 側欄：備份與還原（換手機、清瀏覽器資料之前用） ---------- */
  var side = document.querySelector("aside.toc");
  if (side) {
    var bak = el("div", "inkbak",
      '<div class="eyebrow">手寫筆跡備份</div>' +
      "<p>筆跡只存在這台裝置的瀏覽器。換手機或清除瀏覽器資料之前，先匯出備份檔，之後在新的裝置匯入。</p>" +
      '<div class="inkbak-btns"><button type="button" data-bak="out">' + I("download") + '<span>匯出全部</span></button><button type="button" data-bak="in">' + I("upload") + "<span>匯入</span></button></div>" +
      '<input type="file" accept="application/json,.json" hidden>' +
      '<p class="inkbak-msg" aria-live="polite"></p>');
    side.appendChild(bak);
    var msg = bak.querySelector(".inkbak-msg"), file = bak.querySelector("input");
    bak.querySelector('[data-bak="out"]').addEventListener("click", function () {
      store.dump().then(function (all) {
        var n = Object.keys(all).length;
        if (!n) { msg.textContent = "還沒有任何筆跡可以匯出。"; return; }
        var d = new Date(), stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
        download("cgep-handwriting-" + stamp + ".json", new Blob([JSON.stringify({ app: "cgep-ink", v: 1, exported: d.toISOString(), pads: all })], { type: "application/json" }));
        msg.textContent = "已匯出 " + n + " 題的筆跡（所有科目）。";
      }).catch(function () { msg.textContent = "這個瀏覽器讀不到筆跡資料。"; });
    });
    bak.querySelector('[data-bak="in"]').addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      file.value = "";
      if (!f) return;
      f.text().then(function (txt) {
        var data = JSON.parse(txt);
        if (!data || data.app !== "cgep-ink" || typeof data.pads !== "object") throw new Error("format");
        var n = Object.keys(data.pads).length;
        if (!window.confirm("匯入 " + n + " 題的筆跡？這台裝置上同一題已經有的筆跡，會被備份檔裡的蓋掉。")) return;
        return store.putMany(data.pads).then(function () {
          msg.textContent = "已匯入 " + n + " 題，重新整理頁面後就會看到。";
          setTimeout(function () { location.reload(); }, 800);
        });
      }).catch(function () { msg.textContent = "這個檔案不是手寫筆跡的備份檔。"; });
    });
  }
})();
