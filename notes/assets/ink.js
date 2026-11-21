/* 手寫作答板：每一題「看答案」上方加一塊可以用觸控筆（S Pen）寫字的方格紙。
 *
 * - 筆跡以向量存（每一筆的點座標＋壓力），座標以「紙寬 1000」為基準，
 *   手機轉橫、換電腦看時等比例縮放，不會糊掉。
 * - 版面：工具列兩排，第一排是工具（筆、螢光筆、橡皮擦、選取｜插入、更多），第二排是現在這支筆的
 *   快速選色、粗細（打開筆的設定），和復原、重做。「插入」「更多」「筆的設定」是工具列下面展開的面板，一次只開一個。
 *   「更多」裡面是存成圖片、清除，和觸控筆模式、筆停住的開關。紙的下面一排是縮放和加長、縮短。
 * - 提示訊息在畫面下方短暫出現（不佔紙的位置）；操作說明同一種最多出現 TIP_MAX 次，錯誤每次都會出現。
 *   看得到結果的動作（加長、縮短、複製、存成圖片）不跳訊息；不能做的時候按鈕直接變灰（縮短、存成圖片、清除）。
 * - 紙在畫面上最多一個視窗高（capH），更長的紙在裡面捲動：畫布只有看得到的那一塊大，捲動是改 oy；
 *   觸控筆模式一指拖（會慣性滑行、捲到底接著捲頁面）、兩指拖、滾輪。右邊細條表示捲到哪裡。
 * - 紙可以縮放：兩指捏合／拖曳、紙下面的放大縮小鈕、電腦上 Ctrl＋滾輪。
 * - .md 卡片分段畫（每段 TILE_PX 像素高），只畫看得到的段，很長的筆記也不會縮小或切掉（最長 MAX_H）。
 * - 存在這台裝置瀏覽器的 IndexedDB（notes/assets/inkdb.js），key 是「頁面:題目 id」。
 *   側欄可以把全部筆跡匯出成一個 JSON 檔，換裝置時再匯入；登入 Supabase 後會自動同步（sync.js）。
 * - 觸控筆模式：只有筆會寫字，一指拖曳是捲動頁面（第一次偵測到觸控筆時自動開啟）。
 * - 四種筆：鋼筆（預設，壓力越大越粗）、原子筆（粗細穩定）、鉛筆（淡一點、有筆觸）、螢光筆（半透明，畫在字的下面）。
 *   鋼筆、原子筆、鉛筆共用工具列的「筆」按鈕（在筆的設定裡換種類），螢光筆自己一顆；選中的筆再點一次打開設定。
 *   每種筆各自記住粗細和顏色（設定裡有推薦色系和自訂顏色）。
 * - 「加長」一次多一段紙；「縮短」一次收回一段，但不會切到筆跡、也不會比原本短；兩個都可以「復原」。
 * - 「選取」：用筆圈起來（或直接點一筆）選取，選到的筆跡描藍色細邊。選取框拖裡面移動、拉四個角等比例縮放
 *   （對角不動）、拉上面的圓點旋轉（接近 90° 的倍數自動對齊；.md 卡片不轉）；也可以複製、刪除；都可以「復原」。
 *   只選一張圖時可以「裁剪」：調整留下的範圍，按「完成」才套用。
 * - 筆停住：畫完筆尖停住半秒（HOLD_MS，「更多」裡可以關掉），直線會拉直；圓、橢圓、三角形、矩形、多邊形換成標準的圖形（inkx.js 辨識）。
 *   拉直線還沒放開前可以繼續拖動調整方向和長度，接近水平、垂直、45° 時自動對齊。寫字、小的圈圈不會被換掉。
 * - 插入：圖片（相簿、檔案、貼上、拖進來）和 .md 筆記（排版成卡片）。放在筆跡下面，可以直接在上面寫字；
 *   用「選取」移動、縮放、複製、刪除，橡皮擦不會擦到它們。
 *
 * 一筆的資料：{ p: [x, y, 壓力, ...], c: 顏色, sw: 粗細, t: 筆的種類, pen: 是否觸控筆, k: 縮放倒數 }
 *   c 是數字 0–3 時是會跟著深色模式變的黑紅藍綠（舊資料都是這種），字串則是固定的色碼。
 *   舊資料用 w（0–2，細中粗）代替 sw、沒有 t（＝鋼筆），照樣能畫。
 * 一題的資料：{ v, H: 紙長, s: 筆畫, o: 插入的東西, t }；插入的東西是 { kind: "img", id, x, y, w, h, rot?, crop? } 或
 *   { kind: "md", md: 原文, name: 檔名, x, y, w, h }。圖片本身另外存一筆「img:id」（{ v, img: dataURL, w, h, t }），
 *   同一張圖只存一份，跟筆跡一樣同步。rot＝繞中心轉的角度（弧度）；crop＝顯示原圖的哪一塊 {x, y, w, h}（0–1）。
 */
(function () {
  "use strict";
  if (!document.querySelector("details.quiz")) return;

  var I = window.CGEP_ICON || function () { return ""; };
  var SLUG = document.body.getAttribute("data-slug") || location.pathname;
  var W = 1000;                       // 紙的邏輯寬度
  var DEFAULT_H = 900, STEP_H = 600, MAX_H = 60000;   // 紙在畫面上最多一個視窗高，更長的在裡面捲動
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
  /* .md 卡片：先排版（X.layoutCard：量好高度、轉成 XHTML，最多留 4 份），再一段一段畫成小圖
     （每段 TILE_PX 像素高，X.drawCard）。只畫紙上看得到的那幾段，很長的筆記也不用一次產生超大的圖；
     放大時換成更清楚的一級。小圖總共最多 TILE_BUDGET 像素，最久沒用的先丟 */
  var TILE_PX = 1024, TILE_BUDGET = 16e6;
  var lays = {}, layKeys = [], tiles = [], tileJobs = {}, tileQueue = [], tileBusy = 0;
  function cardKey(o, dark) { return (dark ? "d" : "l") + "\u0001" + (o.name || "") + "\u0001" + o.md; }
  // 清晰度：每個卡片單位幾個像素，取 2 的次方（0.25–4），縮放時才不會一直重畫
  function cardF(x) { return Math.min(4, Math.max(0.25, Math.pow(2, Math.ceil(Math.log(Math.max(0.25, x)) / Math.LN2)))); }
  function layOf(o, dark) {
    var key = cardKey(o, dark), e = lays[key];
    if (e) { e.t = Date.now(); return e; }
    e = lays[key] = { t: Date.now(), lay: null, fail: false };
    layKeys.push(key);
    while (layKeys.length > 4) {
      layKeys.sort(function (a, b) { return lays[a].t - lays[b].t; });
      delete lays[layKeys.shift()];
    }
    X.layoutCard(o.md, o.name, dark).then(function (lay) {
      e.lay = lay;
      openPads.forEach(function (p) { p.cardReady(key, lay.lh); });
    }, function () {
      e.fail = true;
      openPads.forEach(function (p) { p.requestDraw(); });
    });
    return e;
  }
  X.debugTiles = function (i) { return tiles.filter(function (t) { return i == null || t.i === i; }).map(function (t) { return i == null ? [t.f, t.i, t.cv.width, t.cv.height] : t.cv; }); };   // 測試用
  function tileFind(key, f, i) {
    for (var k = 0; k < tiles.length; k++) { var t = tiles[k]; if (t.key === key && t.f === f && t.i === i) return t; }
    return null;
  }
  // 要畫的段排隊（最新要的先畫，最多同時兩張）；捲很快時，太舊的排隊直接丟掉
  function tileWant(key, lay, f, i) {
    var id = key + "\u0001" + f + "\u0001" + i;
    if (tileJobs[id]) return;
    tileJobs[id] = 1;
    tileQueue.push({ id: id, key: key, lay: lay, f: f, i: i });
    while (tileQueue.length > 10) delete tileJobs[tileQueue.shift().id];
    tilePump();
  }
  function tilePump() {
    while (tileBusy < 2 && tileQueue.length) {
      var j = tileQueue.pop();
      tileBusy++;
      (function (j) {
        var th = TILE_PX / j.f, y0 = j.i * th, h = Math.min(th, j.lay.lh - y0);
        X.drawCard(j.lay, j.f, y0, h).then(function (cv) {
          tiles.push({ key: j.key, f: j.f, i: j.i, cv: cv, px: cv.width * cv.height, t: Date.now() });
          trimTiles();
        }, function () {}).then(function () {
          delete tileJobs[j.id];
          tileBusy--;
          tilePump();
          openPads.forEach(function (p) { p.requestDraw(); });
        });
      })(j);
    }
  }
  function trimTiles() {
    var sum = 0;
    tiles.forEach(function (t) { sum += t.px; });
    if (sum <= TILE_BUDGET) return;
    tiles.sort(function (a, b) { return b.t - a.t; });
    var keep = [], used = 0;
    tiles.forEach(function (t) { if (used + t.px <= TILE_BUDGET || keep.length < 3) { keep.push(t); used += t.px; } });
    tiles = keep;
  }
  // 畫一張 .md 卡片看得到的部分；f＝每個紙單位幾個螢幕像素，vis＝要畫的紙上範圍（沒給就整張）
  function drawMd(ctx, o, f, light, vis) {
    var dark = !light && darkNow, e = layOf(o, dark), key = cardKey(o, dark);
    if (!e.lay) { placeholder(ctx, o, e.fail ? "這份 .md 排版失敗" : "正在排版 " + (o.name || ".md") + "…", light); return; }
    var lay = e.lay, u = o.w / MD_W, hh = lay.lh * u;
    var y0 = vis ? Math.max(o.y, vis.y0) : o.y, y1 = vis ? Math.min(o.y + hh, vis.y1) : o.y + hh;
    if (y1 <= y0) return;
    var ff = cardF(f * u), th = TILE_PX / ff, now = Date.now();
    var a = Math.max(0, Math.floor((y0 - o.y) / u / th)), b = Math.floor(((y1 - o.y) / u - 1e-6) / th);
    for (var i = a; i <= b; i++) {
      var c0 = i * th, c1 = Math.min(lay.lh, c0 + th), t = tileFind(key, ff, i);
      if (t) { t.t = now; ctx.drawImage(t.cv, o.x, o.y + c0 * u, o.w, (c1 - c0) * u); continue; }
      tileWant(key, lay, ff, i);
      // 這一段還沒畫好：先用別的清晰度畫好的頂著，都沒有就先塗卡片的底色
      ctx.save();
      ctx.beginPath(); ctx.rect(o.x, o.y + c0 * u, o.w, (c1 - c0) * u); ctx.clip();
      var alt = tiles.filter(function (q) { var q0 = q.i * TILE_PX / q.f; return q.key === key && q.f !== ff && q0 < c1 && q0 + TILE_PX / q.f > c0; });
      if (alt.length) {
        alt.sort(function (p, q) { return p.f - q.f; }).forEach(function (q) {
          var q0 = q.i * TILE_PX / q.f, q1 = Math.min(lay.lh, q0 + TILE_PX / q.f);
          ctx.drawImage(q.cv, o.x, o.y + q0 * u, o.w, (q1 - q0) * u);
        });
      } else {
        // 先塗卡片的底色（圓角跟卡片一樣，第一段、最後一段還沒畫好時角才不會是方的）
        ctx.fillStyle = dark ? "#1c2330" : "#fffdf7";
        rrect(ctx, o.x, o.y, o.w, hh, 20 * u);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
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
  // 插入的東西畫在筆跡下面（螢光筆也畫在它們上面，才能劃重點）；vis＝看得到的紙上範圍，外面的不畫
  function drawObjs(ctx, objs, f, light, vis) {
    objs.forEach(function (o) {
      if (o.kind === "img") {
        var bx = objBox(o);
        if (vis && (bx.y0 > vis.y1 || bx.y1 < vis.y0)) return;
        var e = imgOf(o.id);
        if (e.state === "ok") drawImg(ctx, o, e.im);
        else inObj(ctx, o, function (x, y) { placeholder(ctx, { x: x, y: y, w: o.w, h: o.h }, e.state === "load" ? "圖片載入中…" : "這張圖片還沒同步到這台裝置", light); });
      } else if (o.kind === "md") {
        drawMd(ctx, o, f, light, vis);
      }
    });
  }
  // 選取用的顏色（跟著網站的主題色，深色模式自動變亮）
  function selColor() { return getComputedStyle(document.documentElement).getPropertyValue("--ex").trim() || "#4450b5"; }
  // 選到的插入物：外面一圈細框（跟著物件轉）
  function drawObjSel(ctx, objs, color, u, alpha) {
    if (!objs.length) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = 2 * u;
    objs.forEach(function (o) { inObj(ctx, o, function (x, y) { ctx.strokeRect(x - 2 * u, y - 2 * u, o.w + 4 * u, o.h + 4 * u); }); });
    ctx.restore();
  }
  // 圈選：九個取樣點（四角、四邊中點、中心）有五個以上在圈裡就算圈到
  function objHits(objs, L) {
    return objs.filter(function (o) {
      var k = 0;
      for (var i = 0; i <= 2; i++) for (var j = 0; j <= 2; j++) {
        var q = objPt(o, -o.w / 2 + o.w * i / 2, -o.h / 2 + o.h * j / 2);
        if (inPoly(q[0], q[1], L)) k++;
      }
      return k >= 5;
    });
  }
  function objAt(objs, x, y) {
    for (var i = objs.length - 1; i >= 0; i--) {
      var o = objs[i], l = objLocal(o, x, y);
      if (Math.abs(l[0]) <= o.w / 2 && Math.abs(l[1]) <= o.h / 2) return o;
    }
    return null;
  }
  /* 插入的東西可以旋轉（o.rot，弧度，繞中心轉）；圖片可以裁剪（o.crop＝顯示原圖的哪一塊，0–1）。
     「物件座標」：原點在物件中心、跟著物件轉的座標 */
  function objPt(o, lx, ly) {              // 物件座標 → 紙上座標
    var a = o.rot || 0, c = Math.cos(a), s = Math.sin(a);
    return [o.x + o.w / 2 + lx * c - ly * s, o.y + o.h / 2 + lx * s + ly * c];
  }
  function objLocal(o, x, y) {             // 紙上座標 → 物件座標
    var a = -(o.rot || 0), c = Math.cos(a), s = Math.sin(a), dx = x - o.x - o.w / 2, dy = y - o.y - o.h / 2;
    return [dx * c - dy * s, dx * s + dy * c];
  }
  function objBox(o) {                     // 轉過之後佔的範圍（不轉的外框）
    if (!o.rot) return { x0: o.x, y0: o.y, x1: o.x + o.w, y1: o.y + o.h };
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) {
      var q = objPt(o, k[0] * o.w / 2, k[1] * o.h / 2);
      b.x0 = Math.min(b.x0, q[0]); b.x1 = Math.max(b.x1, q[0]); b.y0 = Math.min(b.y0, q[1]); b.y1 = Math.max(b.y1, q[1]);
    });
    return b;
  }
  function rectOf(o) { return { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0 }; }
  function setRect(o, r) {
    o.x = r.x; o.y = r.y; o.w = r.w; o.h = r.h;
    if (r.rot) o.rot = r.rot; else delete o.rot;
  }
  // 在物件自己的座標裡畫（有旋轉就先轉）；fn 拿到的是左上角
  function inObj(ctx, o, fn) {
    if (!o.rot) { fn(o.x, o.y); return; }
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(o.rot);
    fn(-o.w / 2, -o.h / 2);
    ctx.restore();
  }
  function drawImg(ctx, o, im) {
    var c = o.crop, nw = im.naturalWidth || im.width, nh = im.naturalHeight || im.height;
    inObj(ctx, o, function (x, y) {
      if (c) ctx.drawImage(im, c.x * nw, c.y * nh, c.w * nw, c.h * nh, x, y, o.w, o.h);
      else ctx.drawImage(im, x, y, o.w, o.h);
    });
  }

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
  // 選到的筆跡：先用藍色畫一條比筆畫寬一點點的線，筆畫再畫在上面，看起來就是描了一圈細邊。
  // 同樣粗細的筆畫合成一條路徑一次畫
  function drawOutline(ctx, strokes, color, u, alpha) {
    var groups = {}, keys = [];
    strokes.forEach(function (s) {
      var w = Math.round((baseW(s) + 4.5 * u) * 4) / 4;
      if (!groups[w]) { groups[w] = []; keys.push(w); }
      groups[w].push(s);
    });
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
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
      '<div class="ink-pop ink-ins" hidden>' + popHead("插入") +
        '<div class="ink-btns">' +
          big('data-ins="img"', "image", "圖片", "從相簿或檔案選") +
          big('data-ins="paste"', "paste", "貼上圖片", "剛剛複製的圖片") +
          big('data-ins="md"', "file", ".md 筆記", "排版好放在紙上") +
        "</div>" +
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

      // 畫布只有看得到的那一塊大；紙比較長時用 oy 在裡面捲動，右邊的細條是捲到哪裡
      '<div class="ink-sheet"><canvas class="ink-canvas" aria-label="手寫區"></canvas><div class="ink-thumb" hidden></div>' +
        // 選取後浮在選取範圍旁邊的操作列（不放在紙的上方，免得紙被往下推、筆點歪）
        '<div class="ink-selbar" role="toolbar" aria-label="選取的筆跡" hidden><span class="ink-selinfo"></span>' +
          '<button type="button" data-sel="crop" hidden>' + I("crop") + "<span>裁剪</span></button>" +
          '<button type="button" data-sel="dup">' + I("copy") + "<span>複製</span></button>" +
          '<button type="button" data-sel="del">' + I("trash") + "<span>刪除</span></button>" +
          '<button type="button" data-sel="none" aria-label="取消選取">' + I("close") + "</button>" +
          '<button type="button" data-sel="cropall" hidden><span>全部</span></button>' +
          '<button type="button" data-sel="cropno" hidden><span>取消</span></button>' +
          '<button type="button" data-sel="cropok" class="ink-sel-ok" hidden>' + I("check") + "<span>完成</span></button></div>" +
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
    this.thumb = panel.querySelector(".ink-thumb");
    panel.inkPad = this;                 // 測試和除錯用
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

  /* 畫布只有「看得到的那一塊」大：寬是紙寬，高是 min(整張紙, capH())。
     紙比較長時在裡面捲動（改 oy），頁面不會被撐長，工具列和紙下面那排也一直在畫面上 */
  Pad.prototype.layout = function () {
    var cssW = this.sheet.clientWidth;
    if (!cssW) return;
    this.scale = cssW / W;
    var cssH = this.viewH = Math.max(1, Math.min(Math.round(this.H * this.scale), this.capH()));
    var r = Math.min(window.devicePixelRatio || 1, 3);
    while (cssW * cssH * r * r > 12e6 && r > 1) r -= 0.25;
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
  // 紙的可視高度上限：畫面高度扣掉網站標題列、工具列、紙下面那排，三個加起來剛好一個畫面。
  // 手機網址列收合時畫面高度會變，所以只在寬度變了（轉橫、換裝置）才重算，免得紙一直跳
  Pad.prototype.capH = function () {
    if (!this.cap || this.capW !== window.innerWidth) {
      this.capW = window.innerWidth;
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr")) || 56;
      var tools = this.panel.querySelector(".ink-tools").offsetHeight || 107, foot = this.panel.querySelector(".ink-foot").offsetHeight || 47;
      this.cap = Math.max(240, Math.round(window.innerHeight - hdr - tools - foot - 24));
    }
    return this.cap;
  };

  /* 檢視範圍：畫布顯示紙上 (ox, oy) 開始、寬 W/z、高 viewH/(scale·z) 的範圍（縮放和捲動都是改這個） */
  Pad.prototype.clampView = function () {
    this.z = clamp(this.z, 1, ZMAX);
    var s = this.scale * this.z, vh = this.viewH || this.H * this.scale;
    this.ox = clamp(this.ox, 0, W - W / this.z);
    this.oy = clamp(this.oy, 0, Math.max(0, this.H - vh / s));
  };
  Pad.prototype.visRange = function () {
    var s = this.scale * this.z;
    return { y0: this.oy, y1: this.oy + (this.viewH || 0) / s };
  };
  // 捲動紙張 dy 個螢幕像素（往下為正）；chain＝紙捲到底了，剩下的交給頁面捲
  Pad.prototype.scrollPaper = function (dy, chain) {
    var s = this.scale * this.z, before = this.oy;
    this.oy += dy / s;
    this.clampView();
    var used = (this.oy - before) * s;
    if (this.oy !== before) { this.requestDraw(); this.syncThumb(true); }
    if (chain && Math.abs(dy - used) > 0.5) window.scrollBy(0, dy - used);
    return used;
  };
  // 手指放開後繼續滑一段（越來越慢）；v 是每毫秒幾個像素
  Pad.prototype.fling = function (v) {
    var self = this, last = 0;
    cancelAnimationFrame(this.flingRaf);
    if (!(Math.abs(v) > 0.08)) return;
    v = clamp(v, -6, 6);
    function step(t) {
      var dt = last ? Math.min(32, t - last) : 16;
      last = t;
      self.scrollPaper(v * dt, true);
      v *= Math.pow(0.996, dt);
      if (Math.abs(v) > 0.03) self.flingRaf = requestAnimationFrame(step);
    }
    this.flingRaf = requestAnimationFrame(step);
  };
  // 右邊的細條：紙比較長時才出現，捲動時比較明顯
  Pad.prototype.syncThumb = function (active) {
    var t = this.thumb, s = this.scale * this.z, total = this.H * s, vh = this.viewH || 0;
    if (!vh || total <= vh + 1) { t.hidden = true; return; }
    t.hidden = false;
    var h = Math.max(32, vh * vh / total), top = this.oy * s / (total - vh) * (vh - h);
    t.style.height = Math.round(h) + "px";
    t.style.transform = "translateY(" + Math.round(top) + "px)";
    if (active) {
      t.classList.add("on");
      clearTimeout(this.thumbT);
      this.thumbT = setTimeout(function () { t.classList.remove("on"); }, 900);
    }
  };
  // 讓紙上的 y 出現在看得到的地方（紙裡面捲過去；整塊紙不在畫面上的話，頁面也捲過去）
  Pad.prototype.reveal = function (y) {
    var s = this.scale * this.z, vis = this.viewH / s;
    if (y < this.oy || y > this.oy + vis * 0.75) { this.oy = y - vis * 0.1; this.clampView(); this.requestDraw(); }
    var r = this.canvas.getBoundingClientRect(), top = r.top + (y - this.oy) * s;
    if (top > window.innerHeight - 120 || top < 60) window.scrollBy({ top: top - 120, behavior: "smooth" });
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
    // 方格線畫在紙上，縮放時跟著放大（只畫看得到的範圍）
    var vr = this.visRange(), x1 = this.ox + W / this.z, y1 = vr.y1, x, y;
    ctx.beginPath();
    for (x = Math.ceil(this.ox / GRID) * GRID; x <= x1; x += GRID) { ctx.moveTo(x, this.oy); ctx.lineTo(x, y1); }
    for (y = Math.ceil(this.oy / GRID) * GRID; y <= y1; y += GRID) { ctx.moveTo(this.ox, y); ctx.lineTo(x1, y); }
    ctx.lineWidth = 1 / (this.scale * this.z);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--grid").trim() || "#e9ecf2";
    ctx.stroke();
    var pal = palette(false), sel = this.sel, xf = this.xf, u = 1 / (this.scale * this.z), f = this.ratio * this.scale * this.z;
    // 正在圈：預覽會圈到的筆畫和插入的東西（淡一點）；圈好了：標出選到的。
    // 選到的筆跡描一圈細細的藍邊（不用粗的光暈，字才看得清楚），插入的東西畫細框
    var hot = this.lasso ? this.lassoPreview() : sel, color = hot.length || sel.length ? selColor() : "";
    var hotS = hot.filter(function (x) { return !isObj(x); }), hotO = hot.filter(isObj), edge = this.lasso ? 0.55 : 1;
    // .md 卡片只畫看得到的那幾段（上下多畫半個畫面，捲動時比較快出現）
    var pre = (vr.y1 - vr.y0) / 2, vis = { y0: vr.y0 - pre, y1: vr.y1 + pre };
    var crO = this.cropping ? this.cropping.o : null;
    if (sel.length && xf) {
      var move = function () { ctx.translate(xf.tx, xf.ty); ctx.rotate(xf.th); ctx.scale(xf.s, xf.s); ctx.translate(-xf.px, -xf.py); };
      // 拖曳中的東西：把看得到的範圍換回變換前的座標（四個角的外框）
      var ys = [[0, vis.y0], [W, vis.y0], [0, vis.y1], [W, vis.y1]].map(function (q) { return xfInv(xf, q[0], q[1])[1]; });
      var visT = { y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
      drawObjs(ctx, this.objs.filter(function (o) { return sel.indexOf(o) < 0; }), f, false, vis);
      ctx.save(); move(); drawObjs(ctx, hotO, f * xf.s, false, visT); drawObjSel(ctx, hotO, color, u / xf.s); ctx.restore();
      drawAll(ctx, this.strokes.filter(function (st) { return sel.indexOf(st) < 0; }), pal);
      ctx.save(); move(); drawOutline(ctx, hotS, color, u / xf.s, 1); drawAll(ctx, hotS, pal); ctx.restore();
    } else {
      drawObjs(ctx, crO ? this.objs.filter(function (o) { return o !== crO; }) : this.objs, f, false, vis);
      if (crO) this.drawCrop(ctx, color);
      else drawObjSel(ctx, hotO, color, u, edge);
      if (hotS.length) drawOutline(ctx, hotS, color, u, edge);
      drawAll(ctx, this.strokes, pal);
    }
    this.drawOverlay(ctx);
    if (this.sel.length) this.placeSelBar();
    this.syncThumb();
  };

  /* ---------- 選取：圈選、移動、縮放（四個角）、旋轉、複製、刪除、裁剪圖片 ---------- */
  // 選取框 frame：中心 (cx, cy)、寬高 (w, h)、角度 a。剛選好時是包住選取範圍的方框；只選一個插入的東西時
  // 跟著它的角度。轉過、縮放過之後框也跟著轉（不會變回不轉的大框）。
  // 拖曳中的變換 xf：p' = T + s·R(th)·(p − P)，P＝(px, py)、T＝(tx, ty)
  var CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];   // 左上起順時針
  var ROT_D = 34;                                         // 旋轉圓點離框上緣幾個螢幕像素
  function xfPt(xf, x, y) {
    if (!xf) return [x, y];
    var c = Math.cos(xf.th), s = Math.sin(xf.th), dx = x - xf.px, dy = y - xf.py;
    return [xf.tx + xf.s * (dx * c - dy * s), xf.ty + xf.s * (dx * s + dy * c)];
  }
  function xfInv(xf, x, y) {
    var c = Math.cos(-xf.th), s = Math.sin(-xf.th), dx = (x - xf.tx) / xf.s, dy = (y - xf.ty) / xf.s;
    return [xf.px + dx * c - dy * s, xf.py + dx * s + dy * c];
  }
  function frameAfter(fr, xf) {
    if (!xf || !fr) return fr;
    var c = xfPt(xf, fr.cx, fr.cy);
    return { cx: c[0], cy: c[1], w: fr.w * xf.s, h: fr.h * xf.s, a: fr.a + xf.th };
  }
  function framePt(fr, lx, ly) {
    var c = Math.cos(fr.a), s = Math.sin(fr.a);
    return [fr.cx + lx * c - ly * s, fr.cy + lx * s + ly * c];
  }
  function frameLocal(fr, x, y) {
    var c = Math.cos(-fr.a), s = Math.sin(-fr.a), dx = x - fr.cx, dy = y - fr.cy;
    return [dx * c - dy * s, dx * s + dy * c];
  }
  function frameBox(fr) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    CORNERS.forEach(function (k) {
      var q = framePt(fr, k[0] * fr.w / 2, k[1] * fr.h / 2);
      b.x0 = Math.min(b.x0, q[0]); b.x1 = Math.max(b.x1, q[0]); b.y0 = Math.min(b.y0, q[1]); b.y1 = Math.max(b.y1, q[1]);
    });
    return b;
  }
  function normAngle(a) { a = a % (2 * Math.PI); if (a > Math.PI) a -= 2 * Math.PI; if (a <= -Math.PI) a += 2 * Math.PI; return a; }
  Pad.prototype.makeFrame = function () {
    var sel = this.sel, pad = 6 / (this.scale * this.z);
    if (!sel.length) return null;
    if (sel.length === 1 && isObj(sel[0])) {
      var o = sel[0];
      return { cx: o.x + o.w / 2, cy: o.y + o.h / 2, w: o.w + 2 * pad, h: o.h + 2 * pad, a: o.rot || 0 };
    }
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    sel.forEach(function (st) {
      if (isObj(st)) {
        var b = objBox(st);
        x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
        return;
      }
      var r = baseW(st) / 2;
      for (var i = 0; i < st.p.length; i += 3) {
        x0 = Math.min(x0, st.p[i] - r); x1 = Math.max(x1, st.p[i] + r);
        y0 = Math.min(y0, st.p[i + 1] - r); y1 = Math.max(y1, st.p[i + 1] + r);
      }
    });
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad, a: 0 };
  };
  // 選取範圍的外框（不轉）；moved＝true 時算上正在拖曳的變換
  Pad.prototype.selBox = function (moved) {
    var fr = this.frame || this.makeFrame();
    return frameBox(moved ? frameAfter(fr, this.xf) : fr);
  };
  // .md 筆記卡片不旋轉（選到的東西裡有卡片時，不顯示旋轉的圓點）
  Pad.prototype.canRotate = function () { return !this.sel.some(function (x) { return isObj(x) && x.kind === "md"; }); };
  // 旋轉圓點的位置：平常在框的上面；上面超出看得到的範圍（例如選到紙最上面的字）就改放在框的下面。
  // 回傳 [圓點, 框邊上連接的那一點]
  Pad.prototype.rotHandle = function (fr) {
    var u = 1 / (this.scale * this.z), vr = this.visRange(), d = ROT_D * u;
    var top = framePt(fr, 0, -fr.h / 2 - d);
    if (top[1] >= vr.y0 + 14 * u && top[1] <= vr.y1 - 14 * u) return [top, framePt(fr, 0, -fr.h / 2)];
    var bot = framePt(fr, 0, fr.h / 2 + d);
    if (bot[1] >= vr.y0 + 14 * u && bot[1] <= vr.y1 - 14 * u) return [bot, framePt(fr, 0, fr.h / 2)];
    return [top, framePt(fr, 0, -fr.h / 2)];
  };
  // 點到選取框的哪裡：旋轉圓點、四個角（縮放）、框裡面（移動）
  Pad.prototype.hitFrame = function (q) {
    var fr = this.frame;
    if (!fr) return null;
    var u = 1 / (this.scale * this.z), tol = 22 * u, k;
    if (this.canRotate()) {
      var r = this.rotHandle(fr)[0];
      if (Math.hypot(q[0] - r[0], q[1] - r[1]) <= tol) return { mode: "rotate", h0: r };
    }
    for (k = 0; k < 4; k++) {
      var c = framePt(fr, CORNERS[k][0] * fr.w / 2, CORNERS[k][1] * fr.h / 2);
      if (Math.hypot(q[0] - c[0], q[1] - c[1]) <= tol) return { mode: "scale", k: k };
    }
    var l = frameLocal(fr, q[0], q[1]);
    if (Math.abs(l[0]) <= fr.w / 2 && Math.abs(l[1]) <= fr.h / 2) return { mode: "move" };
    return null;
  };
  // 拖曳中：算出變換（移動、拉角縮放、繞中心旋轉），再整個推回紙裡面
  Pad.prototype.dragXf = function (act, q) {
    var fr = act.fr, u = 1 / (this.scale * this.z), xf;
    if (act.mode === "move") {
      xf = { px: 0, py: 0, tx: q[0] - act.start[0], ty: q[1] - act.start[1], s: 1, th: 0 };
    } else if (act.mode === "scale") {
      // 拉一個角：對面那個角固定不動，等比例放大縮小
      var o = CORNERS[(act.k + 2) % 4], k = CORNERS[act.k];
      var A = framePt(fr, o[0] * fr.w / 2, o[1] * fr.h / 2), C = framePt(fr, k[0] * fr.w / 2, k[1] * fr.h / 2);
      var vx = C[0] - A[0], vy = C[1] - A[1];
      var sc = ((q[0] - A[0]) * vx + (q[1] - A[1]) * vy) / Math.max(1e-6, vx * vx + vy * vy);
      xf = { px: A[0], py: A[1], tx: A[0], ty: A[1], s: clamp(sc, Math.max(0.05, 24 * u / Math.max(1, Math.min(fr.w, fr.h))), 8), th: 0 };
    } else {
      // 旋轉：拉框上面（或下面）的圓點繞中心轉；接近 0°、90°、180°、270° 時自動對齊
      var h0 = act.h0;
      var th = Math.atan2(q[1] - fr.cy, q[0] - fr.cx) - Math.atan2(h0[1] - fr.cy, h0[0] - fr.cx);
      var tot = fr.a + th, q90 = Math.round(tot / (Math.PI / 2)) * (Math.PI / 2);
      if (Math.abs(tot - q90) < 4 * Math.PI / 180) th = q90 - fr.a;
      xf = { px: fr.cx, py: fr.cy, tx: fr.cx, ty: fr.cy, s: 1, th: th };
    }
    // 不能跑出紙外：整個框推回紙裡面（比紙還大就置中）
    var b = frameBox(frameAfter(fr, xf)), dx = 0, dy = 0;
    if (b.x1 - b.x0 > W) dx = W / 2 - (b.x0 + b.x1) / 2; else if (b.x0 < 0) dx = -b.x0; else if (b.x1 > W) dx = W - b.x1;
    if (b.y1 - b.y0 > this.H) dy = this.H / 2 - (b.y0 + b.y1) / 2; else if (b.y0 < 0) dy = -b.y0; else if (b.y1 > this.H) dy = this.H - b.y1;
    xf.tx += dx; xf.ty += dy;
    return xf;
  };
  Pad.prototype.drawOverlay = function (ctx) {
    if (!this.lasso && !this.sel.length) return;
    var u = 1 / (this.scale * this.z), cs = getComputedStyle(document.documentElement);
    var color = selColor(), card = cs.getPropertyValue("--card").trim() || "#fff";
    ctx.save();
    ctx.globalAlpha = 1; ctx.lineWidth = 1.6 * u; ctx.strokeStyle = color; ctx.setLineDash([6 * u, 5 * u]);
    var L = this.lasso;
    if (L && L.length >= 4) {
      ctx.beginPath(); ctx.moveTo(L[0], L[1]);
      for (var i = 2; i < L.length; i += 2) ctx.lineTo(L[i], L[i + 1]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (this.sel.length && this.frame && !this.cropping) {
      var fr = frameAfter(this.frame, this.xf), c = CORNERS.map(function (k) { return framePt(fr, k[0] * fr.w / 2, k[1] * fr.h / 2); });
      ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (i = 1; i < 4; i++) ctx.lineTo(c[i][0], c[i][1]); ctx.closePath(); ctx.stroke();
      var dot = function (x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = card; ctx.fill(); ctx.lineWidth = 2.2 * u; ctx.stroke(); };
      if (this.canRotate()) {
        // 旋轉圓點：一條短線接到框邊，圓裡面畫一個轉圈的箭頭（拖曳中跟著框一起轉）
        var rh = this.xf && this.rotAt ? [xfPt(this.xf, this.rotAt[0][0], this.rotAt[0][1]), xfPt(this.xf, this.rotAt[1][0], this.rotAt[1][1])] : this.rotHandle(fr);
        if (!this.xf) this.rotAt = rh;
        var top = rh[1], hp = rh[0];
        ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(hp[0], hp[1]); ctx.stroke();
        dot(hp[0], hp[1], 10 * u);
        ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(hp[0], hp[1], 4.6 * u, fr.a - 0.3 * Math.PI, fr.a + 1.2 * Math.PI); ctx.stroke();
        var ea = fr.a - 0.3 * Math.PI, ex = hp[0] + 4.6 * u * Math.cos(ea), ey = hp[1] + 4.6 * u * Math.sin(ea);
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 3.2 * u * Math.cos(ea - 0.9), ey - 3.2 * u * Math.sin(ea - 0.9));
        ctx.moveTo(ex, ey); ctx.lineTo(ex + 3.2 * u * Math.cos(ea + 0.6 + Math.PI / 2), ey + 3.2 * u * Math.sin(ea + 0.6 + Math.PI / 2)); ctx.stroke();
        if (this.xf && this.xfMode === "rotate") {
          // 轉的時候在圓點旁邊顯示角度
          var deg = Math.round(((fr.a * 180 / Math.PI) % 360 + 360) % 360);
          ctx.font = "600 " + (13 * u) + "px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
          var tw = ctx.measureText(deg + "°").width;
          ctx.fillStyle = color; ctx.globalAlpha = 0.92;
          ctx.fillRect(hp[0] + 16 * u, hp[1] - 11 * u, tw + 12 * u, 22 * u);
          ctx.globalAlpha = 1; ctx.fillStyle = card; ctx.fillText(deg + "°", hp[0] + 22 * u, hp[1]);
        }
      }
      c.forEach(function (q) { dot(q[0], q[1], 8 * u); });
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
    this.sel = list; this.xf = null; this.cropping = null;
    this.frame = this.makeFrame();
    this.syncSelBar();
    this.requestDraw();
  };
  // 操作列：平常是「複製、刪除」（只選一張圖時多一個「裁剪」）；裁剪中換成「全部、取消、完成」
  Pad.prototype.syncSelBar = function () {
    var bar = this.selBar, n = this.sel.length, crop = !!this.cropping;
    var oneImg = n === 1 && isObj(this.sel[0]) && this.sel[0].kind === "img";
    bar.hidden = !n;
    if (!n) return;
    bar.querySelector(".ink-selinfo").textContent = crop ? "裁剪圖片" : selText(this.sel);
    bar.querySelectorAll("[data-sel]").forEach(function (b) {
      var k = b.dataset.sel, inCrop = /^crop./.test(k);
      b.hidden = k === "crop" ? !oneImg || crop : inCrop ? !crop : crop;
    });
    this.placeSelBar();
  };
  // 操作列放在選取範圍下面；下面放不下就放上面；拖曳時先藏起來
  Pad.prototype.placeSelBar = function () {
    var bar = this.selBar;
    if (!this.sel.length) return;
    bar.classList.toggle("dragging", !!this.xf);
    var b = this.cropping ? this.cropBox() : this.selBox(true), k = this.scale * this.z;
    if (!this.cropping && this.frame && this.canRotate()) {
      // 旋轉圓點也算進去，操作列才不會蓋住它
      var rh = this.rotHandle(frameAfter(this.frame, this.xf))[0], r = 16 / k;
      b = { x0: Math.min(b.x0, rh[0] - r), y0: Math.min(b.y0, rh[1] - r), x1: Math.max(b.x1, rh[0] + r), y1: Math.max(b.y1, rh[1] + r) };
    }
    var bw = bar.offsetWidth, bh = bar.offsetHeight, sw = this.sheet.clientWidth, sh = this.canvas.clientHeight;
    // 選取的東西捲出看得到的範圍時，操作列先藏起來
    bar.classList.toggle("away", (b.y1 - this.oy) * k < 0 || (b.y0 - this.oy) * k > sh);
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
        if (this.hits.length !== this.hitShown && tipLeft("lasso2")) {
          this.hitShown = this.hits.length;
          this.status(this.hits.length ? "圈到 " + selText(this.hits) + "（描藍邊的），放開就選取" : "把要選的東西圈起來：一筆有一半以上在圈裡就算圈到");
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
    if (found.length) this.hint("lasso2", "選到 " + selText(found) + "（描藍邊的就是）：拖框裡面移動，拉四個角縮放，拉上面的圓點旋轉");
    else if (!tiny) this.status("沒有圈到東西：一筆要有一半以上在圈裡才算");
    else if (!this.lassoHad) this.hint("tap", "這裡沒有東西：用筆把要選的東西圈起來，或直接點一下那一筆、那張圖");
    else this.status("");
    this.lassoHad = false;
  };
  // 放開時把移動、縮放、旋轉真的寫進筆畫和插入的東西（可以復原）；選取框也跟著變
  Pad.prototype.commitXf = function () {
    var xf = this.xf, fr = this.frame;
    this.xf = null; this.xfMode = null;
    if (!xf || !fr) { this.requestDraw(); return; }
    var f1 = frameAfter(fr, xf);
    var moved = CORNERS.some(function (k) {
      var a = framePt(fr, k[0] * fr.w / 2, k[1] * fr.h / 2), b = framePt(f1, k[0] * f1.w / 2, k[1] * f1.h / 2);
      return Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.5;
    });
    if (!moved) { this.requestDraw(); return; }
    function r10(v) { return Math.round(v * 10) / 10; }
    var items = this.sel.filter(function (x) { return !isObj(x); }).map(function (st) {
      var it = { s: st, p0: st.p.slice(), sw0: st.sw };
      for (var i = 0; i < st.p.length; i += 3) {
        var q = xfPt(xf, st.p[i], st.p[i + 1]);
        st.p[i] = r10(q[0]); st.p[i + 1] = r10(q[1]);
      }
      if (xf.s !== 1) st.sw = Math.round((st.sw != null ? st.sw : SIZES[st.w] || SIZES[1]) * xf.s * 100) / 100;
      it.p1 = st.p.slice(); it.sw1 = st.sw;
      return it;
    });
    var objs = this.sel.filter(isObj).map(function (o) {
      var r0 = rectOf(o), c = xfPt(xf, o.x + o.w / 2, o.y + o.h / 2), w = o.w * xf.s, h = o.h * xf.s;
      var rot = normAngle((o.rot || 0) + xf.th);
      setRect(o, { x: r10(c[0] - w / 2), y: r10(c[1] - h / 2), w: r10(w), h: r10(h), rot: Math.abs(rot) < 1e-4 ? 0 : Math.round(rot * 1e4) / 1e4 });
      return { o: o, r0: r0, r1: rectOf(o) };
    });
    this.frame = f1;
    this.push({ t: "xf", items: items, objs: objs });
    this.redraw();
  };

  /* ---------- 裁剪圖片 ---------- */
  // 只選一張圖時，操作列有「裁剪」：整張原圖淡淡地顯示，亮的那一塊是留下來的範圍；
  // 拉四個角、四邊調整，拖中間移動；「完成」才真的改（可以復原），「全部」回到整張圖
  function imgSnap(o) { return { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0, crop: o.crop ? { x: o.crop.x, y: o.crop.y, w: o.crop.w, h: o.crop.h } : null }; }
  function imgApply(o, v) { setRect(o, v); if (v.crop) o.crop = { x: v.crop.x, y: v.crop.y, w: v.crop.w, h: v.crop.h }; else delete o.crop; }
  Pad.prototype.startCrop = function () {
    var o = this.sel[0];
    if (this.sel.length !== 1 || !isObj(o) || o.kind !== "img") return;
    var c = o.crop || { x: 0, y: 0, w: 1, h: 1 };
    this.cropping = { o: o, c0: { x: c.x, y: c.y, w: c.w, h: c.h }, cr: { x: c.x, y: c.y, w: c.w, h: c.h } };
    this.xf = null;
    this.syncSelBar();
    this.requestDraw();
  };
  // 裁剪時的座標（圖片自己的座標）：整張原圖 (fx0, fy0) 起、寬 Wf 高 Hf；留下的範圍 x0–x1、y0–y1
  Pad.prototype.cropGeom = function () {
    var C = this.cropping, o = C.o, c0 = C.c0, cr = C.cr, Wf = o.w / c0.w, Hf = o.h / c0.h;
    var fx0 = -o.w / 2 - c0.x * Wf, fy0 = -o.h / 2 - c0.y * Hf;
    return { o: o, Wf: Wf, Hf: Hf, fx0: fx0, fy0: fy0,
      x0: fx0 + cr.x * Wf, y0: fy0 + cr.y * Hf, x1: fx0 + (cr.x + cr.w) * Wf, y1: fy0 + (cr.y + cr.h) * Hf };
  };
  // 整張原圖在紙上佔的範圍（放操作列用）
  Pad.prototype.cropBox = function () {
    var g = this.cropGeom(), b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    [[g.fx0, g.fy0], [g.fx0 + g.Wf, g.fy0], [g.fx0 + g.Wf, g.fy0 + g.Hf], [g.fx0, g.fy0 + g.Hf]].forEach(function (l) {
      var q = objPt(g.o, l[0], l[1]);
      b.x0 = Math.min(b.x0, q[0]); b.x1 = Math.max(b.x1, q[0]); b.y0 = Math.min(b.y0, q[1]); b.y1 = Math.max(b.y1, q[1]);
    });
    return b;
  };
  // 點到裁剪框的哪裡：0–3 四個角（左上起順時針）、4–7 四邊（上右下左）、8 框裡面；-1＝外面
  Pad.prototype.cropHit = function (q) {
    var g = this.cropGeom(), l = objLocal(g.o, q[0], q[1]), tol = 22 / (this.scale * this.z);
    var mx = (g.x0 + g.x1) / 2, my = (g.y0 + g.y1) / 2;
    var pts = [[g.x0, g.y0], [g.x1, g.y0], [g.x1, g.y1], [g.x0, g.y1], [mx, g.y0], [g.x1, my], [mx, g.y1], [g.x0, my]];
    for (var i = 0; i < pts.length; i++) if (Math.hypot(l[0] - pts[i][0], l[1] - pts[i][1]) <= tol) return i;
    if (l[0] >= g.x0 && l[0] <= g.x1 && l[1] >= g.y0 && l[1] <= g.y1) return 8;
    return -1;
  };
  Pad.prototype.cropNorm = function (q) {
    var g = this.cropGeom(), l = objLocal(g.o, q[0], q[1]);
    return [(l[0] - g.fx0) / g.Wf, (l[1] - g.fy0) / g.Hf];
  };
  Pad.prototype.cropDrag = function (act, q) {
    var g = this.cropGeom(), n = this.cropNorm(q), s0 = act.cr0, k = act.k;
    var mw = Math.min(1, Math.max(0.03, 24 / g.Wf)), mh = Math.min(1, Math.max(0.03, 24 / g.Hf));
    var x0 = s0.x, y0 = s0.y, x1 = s0.x + s0.w, y1 = s0.y + s0.h;
    if (k === 8) {
      var dx = clamp(n[0] - act.n0[0], -x0, 1 - x1), dy = clamp(n[1] - act.n0[1], -y0, 1 - y1);
      x0 += dx; x1 += dx; y0 += dy; y1 += dy;
    } else {
      if (k === 0 || k === 3 || k === 7) x0 = clamp(n[0], 0, x1 - mw);
      if (k === 1 || k === 2 || k === 5) x1 = clamp(n[0], x0 + mw, 1);
      if (k === 0 || k === 1 || k === 4) y0 = clamp(n[1], 0, y1 - mh);
      if (k === 2 || k === 3 || k === 6) y1 = clamp(n[1], y0 + mh, 1);
    }
    this.cropping.cr = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  Pad.prototype.endCrop = function (apply) {
    var C = this.cropping;
    if (!C) return;
    if (apply) {
      var g = this.cropGeom(), o = C.o, cr = C.cr;
      var same = Math.abs(cr.x - C.c0.x) < 1e-4 && Math.abs(cr.y - C.c0.y) < 1e-4 && Math.abs(cr.w - C.c0.w) < 1e-4 && Math.abs(cr.h - C.c0.h) < 1e-4;
      if (!same) {
        var r5 = function (v) { return Math.round(v * 1e5) / 1e5; }, r10 = function (v) { return Math.round(v * 10) / 10; };
        var full = cr.x < 1e-4 && cr.y < 1e-4 && cr.w > 1 - 1e-4 && cr.h > 1 - 1e-4;
        var c = objPt(o, (g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2), w = g.x1 - g.x0, h = g.y1 - g.y0;
        var before = imgSnap(o), H0 = this.H;
        imgApply(o, { x: r10(c[0] - w / 2), y: r10(c[1] - h / 2), w: r10(w), h: r10(h), rot: o.rot || 0,
          crop: full ? null : { x: r5(cr.x), y: r5(cr.y), w: r5(cr.w), h: r5(cr.h) } });
        var need = Math.min(MAX_H, Math.ceil((objBox(o).y1 + 40) / GRID) * GRID);
        if (need > this.H) this.setH(need);
        this.push({ t: "crop", o: o, a: before, b: imgSnap(o), h0: H0, h1: this.H });
      }
    }
    this.cropping = null;
    this.frame = this.makeFrame();
    this.syncSelBar();
    this.requestDraw();
  };
  // 裁剪中的畫法：整張原圖淡淡的，留下的範圍正常亮度，框的四角和四邊有可以拉的把手
  Pad.prototype.drawCrop = function (ctx, color) {
    var g = this.cropGeom(), o = g.o, e = imgOf(o.id), u = 1 / (this.scale * this.z);
    var w = g.x1 - g.x0, h = g.y1 - g.y0;
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(o.rot || 0);
    if (e.state === "ok") {
      ctx.globalAlpha = 0.28; ctx.drawImage(e.im, g.fx0, g.fy0, g.Wf, g.Hf);
      ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(g.x0, g.y0, w, h); ctx.clip();
      ctx.drawImage(e.im, g.fx0, g.fy0, g.Wf, g.Hf); ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * u; ctx.strokeRect(g.x0, g.y0, w, h);
    // 三等分線，比較好對齊
    ctx.globalAlpha = 0.45; ctx.lineWidth = 1 * u; ctx.beginPath();
    for (var i = 1; i < 3; i++) { ctx.moveTo(g.x0 + w * i / 3, g.y0); ctx.lineTo(g.x0 + w * i / 3, g.y1); ctx.moveTo(g.x0, g.y0 + h * i / 3); ctx.lineTo(g.x1, g.y0 + h * i / 3); }
    ctx.stroke();
    // 四個角是 L 形、四邊中間是短槓
    ctx.globalAlpha = 1; ctx.lineWidth = 4.5 * u; ctx.lineCap = "round"; ctx.beginPath();
    var L = Math.min(18 * u, w / 3, h / 3), E = Math.min(12 * u, w / 4, h / 4);
    [[g.x0, g.y0, 1, 1], [g.x1, g.y0, -1, 1], [g.x1, g.y1, -1, -1], [g.x0, g.y1, 1, -1]].forEach(function (c) {
      ctx.moveTo(c[0] + c[2] * L, c[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0], c[1] + c[3] * L);
    });
    var mx = (g.x0 + g.x1) / 2, my = (g.y0 + g.y1) / 2;
    ctx.moveTo(mx - E, g.y0); ctx.lineTo(mx + E, g.y0); ctx.moveTo(mx - E, g.y1); ctx.lineTo(mx + E, g.y1);
    ctx.moveTo(g.x0, my - E); ctx.lineTo(g.x0, my + E); ctx.moveTo(g.x1, my - E); ctx.lineTo(g.x1, my + E);
    ctx.stroke();
    ctx.restore();
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
        var b = objBox(o);
        if (x < b.x1 && x + w > b.x0 && y < b.y1 && y + h > b.y0) { y = Math.round(b.y1 + 20); moved = true; }
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
    var h = { t: "addO", o: o, from: H0, to: this.H };
    this.push(h);
    // .md 的高度是先估的（通常估太高）：排版好之後，cardReady 把多加長的紙收回來
    if (o.kind === "md" && this.H > H0) this.insGuess = { o: o, h: h, from: H0 };
    this.tool = "select";
    this.openPop(null);
    this.setSel([o]);
    this.syncTools();
    this.hint(tip, note, short);
    this.reveal(o.y);                    // 放在看不到的地方時，紙（和頁面）捲過去
  };
  // .md 排好之後才知道真正的高度：更新卡片的高度，超出紙的話把紙加長。
  // 紙最長 MAX_H（大約 25 個手機畫面）；連這樣都放不下才把整張卡片縮小放進去，絕不切掉
  Pad.prototype.cardReady = function (key, lh) {
    var self = this, grew = false, shrunk = false;
    this.objs.forEach(function (o) {
      if (o.kind !== "md" || (cardKey(o, false) !== key && cardKey(o, true) !== key)) return;
      var h = Math.round(o.w * lh / MD_W * 10) / 10;
      if (o.y + h > MAX_H - 10) {
        if (h > MAX_H - 30) o.y = 20;
        else o.y = Math.min(o.y, MAX_H - 10 - h);
        if (o.y + h > MAX_H - 10) {
          var s = (MAX_H - 10 - o.y) / h;
          o.w = Math.round(o.w * s); o.x = Math.round((W - o.w) / 2); h = Math.round(h * s * 10) / 10; shrunk = true;
        }
      }
      if (Math.abs(h - o.h) > 0.5) { o.h = h; grew = true; }
    });
    if (shrunk) this.status("這份筆記太長，放不下整張紙，已經把卡片縮小；建議拆成幾個 .md 檔", 7000);
    var need = 0;
    this.objs.forEach(function (o) { need = Math.max(need, o.y + o.h + 40); });
    need = Math.min(MAX_H, Math.ceil(need / GRID) * GRID);
    var g = this.insGuess;
    if (need > this.H) { this.setH(need); grew = true; }
    else if (g && this.objs.indexOf(g.o) >= 0 && (cardKey(g.o, false) === key || cardKey(g.o, true) === key)) {
      // 插入時估的高度太高、紙加長太多：收回到剛好放得下（不比插入前短，也不切到筆跡）
      var fit = Math.max(need, g.from, this.minH());
      if (fit < this.H) { this.setH(fit); g.h.to = fit; grew = true; }
    }
    if (g && (cardKey(g.o, false) === key || cardKey(g.o, true) === key)) this.insGuess = null;
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
        "insImg2", "已插入圖片：拖框裡面移動，拉四個角縮放，拉上面的圓點旋轉；下面的操作列可以裁剪");
    }).catch(function () { self.status("這張圖片讀不出來，或這個瀏覽器不能存圖片（例如無痕模式）"); });
  };
  Pad.prototype.insertMd = function (file) {
    var self = this;
    if (file.size > 300000) { this.status("這個檔案太大（超過 300 KB），請分成幾個小一點的 .md"); return Promise.resolve(); }
    return file.text().then(function (txt) {
      if (/\u0000/.test(txt)) throw new Error("binary");
      var name = file.name || "筆記.md", h = Math.min(MAX_H - 60, X.guessCardH(txt));
      self.addObj({ kind: "md", md: txt, name: name, x: Math.round((W - MD_W) / 2), y: Math.round(self.visibleTop() + 20), w: MD_W, h: h },
        "insMd", "已插入 " + name + "：可以直接在上面寫字、劃重點；用「選取」點一下就能移動、縮放、刪除");
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
    this.panel.querySelector('[data-act="shrink"]').disabled = this.shrinkTo() >= this.H;
    // 還沒有任何東西時，「存成圖片」和「清除」也不能按
    this.panel.querySelector('[data-act="png"]').disabled = !this.hasInk();
    this.panel.querySelector('[data-act="clear"]').disabled = !this.hasInk();
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
      popHead(tp === "hl" ? "螢光筆" : "筆") + types +
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
      else if (a === "zreset") {
        // 回到 100%，畫面中間那一點留在原處（長紙不會跳回最上面）
        var zr = self.canvas.getBoundingClientRect();
        self.zoomAt(1, zr.left + zr.width / 2, zr.top + zr.height / 2);
      }
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
      var k = b.dataset.sel;
      if (k === "dup") self.dupSel();
      else if (k === "del") self.delSel();
      else if (k === "none") { self.setSel([]); self.status(""); }
      else if (k === "crop") self.startCrop();
      else if (k === "cropall" && self.cropping) { self.cropping.cr = { x: 0, y: 0, w: 1, h: 1 }; self.requestDraw(); self.placeSelBar(); }
      else if (k === "cropno") self.endCrop(false);
      else if (k === "cropok") self.endCrop(true);
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
      cancelAnimationFrame(self.flingRaf);   // 碰到紙就停下還在滑的捲動
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
          // 觸控筆模式：一根手指只用來捲動（先捲紙，紙捲到底再捲頁面）
          act = { id: e.pointerId, mode: "scroll", y: e.clientY, v: [[e.timeStamp, e.clientY]] };
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
        if (self.cropping) {
          // 裁剪中：拉框的角、邊或移動框；點框外面不做事（按「完成」或「取消」結束）
          var ck = self.cropHit(q);
          act = ck >= 0 ? { id: e.pointerId, mode: "crop", k: ck, n0: self.cropNorm(q), cr0: self.cropping.cr } : { id: e.pointerId, mode: "none" };
          return;
        }
        var hit = self.sel.length ? self.hitFrame(q) : null;
        if (hit) {
          act = { id: e.pointerId, mode: hit.mode, k: hit.k, h0: hit.h0, start: q, fr: self.frame };
          self.xfMode = hit.mode;
          self.rotAt = self.rotHandle(self.frame);   // 拖曳中旋轉圓點跟著框走
          self.xf = { px: 0, py: 0, tx: 0, ty: 0, s: 1, th: 0 };
          return;
        }
        self.lassoHad = self.sel.length > 0;   // 原本有選東西的話，點空白只是取消選取
        self.setSel([]);
        self.lasso = [q[0], q[1]];
        self.hits = null; self.hitLen = 0; self.hitAt = 0; self.hitShown = -1;
        act = { id: e.pointerId, mode: "lasso" };
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
      if (act.mode === "scroll") {
        var dy = act.y - e.clientY;
        act.y = e.clientY;
        act.v.push([e.timeStamp, e.clientY]);
        while (act.v.length > 2 && e.timeStamp - act.v[0][0] > 100) act.v.shift();
        self.scrollPaper(dy, true);
        return;
      }
      e.preventDefault();
      if (act.mode === "none") return;
      if (act.mode === "lasso" || act.mode === "move" || act.mode === "scale" || act.mode === "rotate" || act.mode === "crop") {
        var q0 = pos(e);
        if (act.mode === "lasso") {
          var Ln = self.lasso, m = Ln.length;
          if (Math.hypot(q0[0] - Ln[m - 2], q0[1] - Ln[m - 1]) > 2 / self.z) Ln.push(q0[0], q0[1]);
        } else if (act.mode === "crop") {
          self.cropDrag(act, q0);
          self.placeSelBar();
        } else {
          self.xf = self.dragXf(act, q0);
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
      } else if (a.mode === "move" || a.mode === "scale" || a.mode === "rotate") {
        self.commitXf();
      } else if (a.mode === "scroll" && e.type === "pointerup" && a.v.length > 1) {
        // 放開時手指還在動：繼續滑一段
        var v0 = a.v[0], v1 = a.v[a.v.length - 1], dt = v1[0] - v0[0];
        if (dt > 0 && e.timeStamp - v1[0] < 60) self.fling((v0[1] - v1[1]) / dt);
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
      cancelAnimationFrame(self.flingRaf);
      if (e.ctrlKey) {
        e.preventDefault();
        self.zoomAt(self.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
        return;
      }
      // 滾輪先捲紙（放大時也可以左右移）；紙捲到底了，就讓頁面照常捲
      var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? self.viewH : 1;
      var s = self.scale * self.z, ox = self.ox, oy = self.oy;
      if (self.z > 1.001) self.ox += e.deltaX * unit / s;
      self.oy += e.deltaY * unit / s;
      self.clampView();
      if (ox !== self.ox || oy !== self.oy) { e.preventDefault(); self.requestDraw(); self.syncThumb(true); }
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
    else if (h.t === "crop") { imgApply(h.o, h.a); if (h.h0 !== h.h1) this.setH(h.h0); }
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
    else if (h.t === "crop") { imgApply(h.o, h.b); if (h.h0 !== h.h1) this.setH(h.h1); }
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
    this.objs.forEach(function (o) { maxY = Math.max(maxY, objBox(o).y1); });
    return Math.max(DEFAULT_H, Math.ceil((maxY + 40) / GRID) * GRID);
  };
  // 加長、縮短：紙的長度看得到，所以不另外跳訊息；不能加長或縮短時按鈕直接變成不能按（syncTools）
  Pad.prototype.extend = function () {
    if (this.H >= MAX_H) return;
    var from = this.H, to = Math.min(MAX_H, from + STEP_H);
    this.setH(to);
    this.oy = this.H;                    // 捲到最下面，看得到新加的那一段
    this.clampView();
    this.requestDraw();
    this.push({ t: "h", from: from, to: to });
  };
  // 縮短到哪裡：收回一段，但停在最後一筆（或插入的東西）下面、不比原本短；跟現在一樣長就是不能縮短
  Pad.prototype.shrinkTo = function () { return Math.max(this.H - STEP_H, this.minH()); };
  Pad.prototype.shrink = function () {
    var from = this.H, to = this.shrinkTo();
    if (to >= from) return;
    this.setH(to);
    this.push({ t: "h", from: from, to: to });
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
    if (!this.hasInk()) return;
    var maxY = 0;
    this.strokes.forEach(function (s) { for (var i = 1; i < s.p.length; i += 3) maxY = Math.max(maxY, s.p[i]); });
    this.objs.forEach(function (o) { maxY = Math.max(maxY, objBox(o).y1); });
    var h = Math.min(this.H, Math.ceil(maxY + 60));
    // 一般 1.4 倍；很長的紙縮小一點，圖片才不會大到手機存不了（最高 30000 像素、2400 萬像素）
    var k = Math.min(1.4, 30000 / h, Math.sqrt(24e6 / (W * h)));
    // .md 卡片用淺色重新排版，一段一段畫好再拼起來
    var jobs = this.objs.filter(function (o) { return o.kind === "md"; }).map(function (o) {
      var f = k * o.w / MD_W;
      return X.layoutCard(o.md, o.name, false).then(function (lay) {
        var th = TILE_PX / f, parts = [], chain = Promise.resolve();
        for (var y0 = 0; y0 < lay.lh; y0 += th) {
          (function (y0) {
            chain = chain.then(function () {
              return X.drawCard(lay, f, y0, Math.min(th, lay.lh - y0)).then(function (cv) { parts.push({ y0: y0, cv: cv }); });
            });
          })(y0);
        }
        return chain.then(function () { return [o, lay, parts]; });
      }).catch(function () { return [o, null, []]; });
    });
    if (jobs.length) this.status("正在產生圖片…");
    Promise.all(jobs).then(function (done) {
      var cv = document.createElement("canvas");
      cv.width = Math.round(W * k); cv.height = Math.round(h * k);
      var x = cv.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, cv.width, cv.height);
      x.setTransform(k, 0, 0, k, 0, 0);
      self.objs.forEach(function (o) {
        if (o.kind === "img") { var e = imgOf(o.id); if (e.state === "ok") drawImg(x, o, e.im); return; }
        var d = done.filter(function (q) { return q[0] === o; })[0];
        if (!d || !d[1]) return;
        var u = o.w / MD_W;
        d[2].forEach(function (pt) { x.drawImage(pt.cv, o.x, o.y + pt.y0 * u, o.w, pt.cv.height / (k * o.w / MD_W) * u); });
      });
      drawAll(x, self.strokes, palette(true));
      var name = self.key.replace(/[^\w-]+/g, "_") + ".png";
      try {
        cv.toBlob(function (b) { if (b) { download(name, b); if (jobs.length) self.status(""); } }, "image/png");
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
