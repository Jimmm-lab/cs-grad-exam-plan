/* 手寫作答板：每一題「看答案」上方加一塊可以用觸控筆（S Pen）寫字的方格紙。
 *
 * - 筆跡以向量存（每一筆的點座標＋壓力），座標以「紙寬 1000」為基準，
 *   手機轉橫、換電腦看時等比例縮放，不會糊掉。
 * - 紙可以縮放：兩指捏合／拖曳、工具列的放大縮小鈕、電腦上 Ctrl＋滾輪。
 * - 存在這台裝置瀏覽器的 IndexedDB（notes/assets/inkdb.js），key 是「頁面:題目 id」。
 *   側欄可以把全部筆跡匯出成一個 JSON 檔，換裝置時再匯入；登入 Supabase 後會自動同步（sync.js）。
 * - 觸控筆模式：只有筆會寫字，一指拖曳是捲動頁面（第一次偵測到觸控筆時自動開啟）。
 * - 四種筆：鋼筆（預設，壓力越大越粗）、原子筆（粗細穩定）、鉛筆（淡一點、有筆觸）、螢光筆（半透明，畫在字的下面）。
 *   每種筆各自記住粗細和顏色（工具列的「● 數字」按鈕打開設定，有推薦色系和自訂顏色）。
 * - 「加長」一次多一段紙；「縮短」一次收回一段，但不會切到筆跡、也不會比原本短；兩個都可以「復原」。
 *
 * 一筆的資料：{ p: [x, y, 壓力, ...], c: 顏色, sw: 粗細, t: 筆的種類, pen: 是否觸控筆, k: 縮放倒數 }
 *   c 是數字 0–3 時是會跟著深色模式變的黑紅藍綠（舊資料都是這種），字串則是固定的色碼。
 *   舊資料用 w（0–2，細中粗）代替 sw、沒有 t（＝鋼筆），照樣能畫。
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
  var lastPen = 0;
  function notePen() {
    lastPen = Date.now();
    if (pref.penOnly === undefined) {
      pref.penOnly = true; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); p.status("偵測到觸控筆：已切換成觸控筆模式，一指拖曳會捲動頁面"); });
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

  /* ---------- 一塊手寫板 ---------- */
  function Pad(wrap, key, toggle) {
    this.key = key; this.toggle = toggle;
    this.strokes = []; this.hist = []; this.fut = [];
    this.H = DEFAULT_H; this.tool = "pen"; this.scale = 1; this.ratio = 1; this.ctx = null;
    this.z = 1; this.ox = 0; this.oy = 0; this.raf = 0;
    this.saveTimer = 0; this.persist = true;

    var pens = PEN_ORDER.map(function (tp) {
      return '<button type="button" class="ink-tool" data-tool="pen" data-pen="' + tp + '">' + I(PENS[tp].icon) + "<span>" + PENS[tp].name + "</span></button>";
    }).join("") + '<button type="button" class="ink-tool" data-tool="eraser">' + I("eraser") + "<span>橡皮擦</span></button>";
    var panel = this.panel = el("div", "ink-panel");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ink-tools" role="toolbar" aria-label="手寫工具">' +
        '<div class="ink-grp">' + pens + "</div>" +
        '<div class="ink-grp ink-colors"></div>' +
        '<div class="ink-grp"><button type="button" data-act="undo" aria-label="復原" title="復原">' + I("undo") + '</button><button type="button" data-act="redo" aria-label="重做" title="重做">' + I("redo") + "</button></div>" +
        '<div class="ink-grp"><button type="button" data-act="zout" aria-label="縮小紙張" title="縮小">' + I("zoomOut") + '</button><button type="button" data-act="zreset" class="ink-zl" aria-label="恢復 100%" title="恢復 100%">100%</button><button type="button" data-act="zin" aria-label="放大紙張" title="放大">' + I("zoomIn") + "</button></div>" +
        '<div class="ink-grp"><button type="button" data-act="more" title="紙張加長一段">' + I("extend") + '<span>加長</span></button><button type="button" data-act="less" title="收回一段（不會切到筆跡）">' + I("shrink") + '<span>縮短</span></button></div>' +
        '<div class="ink-grp"><button type="button" data-act="clear">' + I("trash") + '<span>清除</span></button><button type="button" data-act="png">' + I("image") + "<span>存成圖片</span></button></div>" +
      "</div>" +
      '<div class="ink-cfg" hidden></div>' +
      '<div class="ink-sheet"><canvas class="ink-canvas" aria-label="手寫區"></canvas></div>' +
      '<div class="ink-foot">' +
        '<label class="ink-pen"><input type="checkbox"> 觸控筆模式（只有筆會寫，一指拖曳是捲動）</label>' +
        '<span class="ink-hint">兩指捏合可以縮放、移動紙張；電腦用 Ctrl＋滾輪</span>' +
        '<span class="ink-status" aria-live="polite"></span>' +
      "</div>";
    wrap.appendChild(panel);
    this.sheet = panel.querySelector(".ink-sheet");
    this.canvas = panel.querySelector("canvas");
    this.penBox = panel.querySelector(".ink-pen input");
    this.statusEl = panel.querySelector(".ink-status");
    this.zLabel = panel.querySelector(".ink-zl");
    this.swBox = panel.querySelector(".ink-colors");
    this.cfgBox = panel.querySelector(".ink-cfg");
    this.bindTools();
    this.bindPointer();
    this.syncTools();
    this.syncPenOnly();

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
      if (v && v.s) { self.strokes = v.s; self.H = v.H || DEFAULT_H; }
      self.status("筆跡會自動存在這台裝置");
    }).catch(function () {
      self.persist = false;
      self.status("這個瀏覽器不能存筆跡（可能是無痕模式），關掉頁面就會消失");
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
    drawAll(ctx, this.strokes, palette(false));
  };

  Pad.prototype.status = function (t) { this.statusEl.textContent = t; };

  Pad.prototype.syncTools = function () {
    var self = this, tp = penType(), cfg = penCfg(tp), pen = this.tool === "pen";
    this.panel.querySelectorAll("[data-tool]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.tool === "eraser" ? !pen : pen && b.dataset.pen === tp));
    });
    // 快速選色：一般的筆是黑紅藍綠，螢光筆是四個螢光色；最後一顆「● 數字」打開粗細和顏色的設定
    var quick = tp === "hl" ? QUICK.hl : QUICK.pen;
    var dot = Math.max(6, Math.min(18, cfg.sw * (tp === "hl" ? 0.5 : 1.4)));
    this.swBox.innerHTML = quick.map(function (c) {
      return '<button type="button" class="ink-sw" data-color="' + c + '" aria-label="' + colorName(c) + '" title="' + colorName(c) + '" aria-pressed="' + (pen && sameColor(cfg.c, c)) + '"><span style="background:' + swatchCss(c) + '"></span></button>';
    }).join("") +
      '<button type="button" class="ink-cur" data-act="cfg" aria-expanded="' + !this.cfgBox.hidden + '" aria-label="' + PENS[tp].name + "的粗細和顏色" + '" title="粗細和顏色">' +
      '<i style="width:' + dot + "px;height:" + dot + "px;background:" + swatchCss(cfg.c) + (tp === "hl" ? ";opacity:.6" : "") + '"></i><b>' + cfg.sw + "</b></button>";
    this.panel.querySelector('[data-act="undo"]').disabled = !this.hist.length;
    this.panel.querySelector('[data-act="redo"]').disabled = !this.fut.length;
    this.panel.querySelector('[data-act="more"]').disabled = this.H >= MAX_H;
    this.panel.querySelector('[data-act="less"]').disabled = this.H <= DEFAULT_H;
    this.canvas.style.cursor = this.tool === "eraser" ? "cell" : "crosshair";
    if (!this.cfgBox.hidden) this.syncCfg();
  };
  // 粗細和顏色的設定（套用在現在選的那種筆）
  Pad.prototype.openCfg = function (open) {
    this.cfgBox.hidden = !open;
    if (open) this.renderCfg();
    this.syncTools();
  };
  Pad.prototype.renderCfg = function () {
    var tp = penType(), P = PENS[tp], cfg = penCfg(tp);
    this.cfgFor = tp;
    this.cfgBox.innerHTML =
      '<div class="ink-cfg-head"><b>' + P.name + "</b><span>粗細和顏色</span>" +
      '<button type="button" class="ink-cfg-x" data-cfg="close" aria-label="關閉設定">' + I("close") + "</button></div>" +
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

  Pad.prototype.bindTools = function () {
    var self = this;
    this.panel.querySelector(".ink-tools").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.dataset.act;
      if (b.dataset.pen) { pref.pen = b.dataset.pen; self.tool = "pen"; savePref(); syncAll(); }
      else if (b.dataset.tool) self.tool = b.dataset.tool;
      else if (b.dataset.color != null) { setPenCfg({ c: parseColor(b.dataset.color) }); self.tool = "pen"; syncAll(); }
      else if (a === "cfg") { self.tool = "pen"; self.openCfg(self.cfgBox.hidden); return; }
      else if (a === "undo") self.undo();
      else if (a === "redo") self.redo();
      else if (a === "zin") self.zoomBy(1.5);
      else if (a === "zout") self.zoomBy(1 / 1.5);
      else if (a === "zreset") { self.z = 1; self.ox = self.oy = 0; self.requestDraw(); self.syncZoom(); }
      else if (a === "more") self.extend();
      else if (a === "less") self.shrink();
      else if (a === "clear") self.clear();
      else if (a === "png") self.png();
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
      if (b.dataset.pc != null) { setPenCfg({ c: parseColor(b.dataset.pc) }); syncAll(); }
      else if (b.dataset.cfg === "reset") { if (pref.tools) delete pref.tools[penType()]; savePref(); syncAll(); }
      else if (b.dataset.cfg === "close") self.openCfg(false);
    });
    this.penBox.addEventListener("change", function () {
      pref.penOnly = self.penBox.checked; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); });
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

    c.addEventListener("pointerdown", function (e) {
      if (!self.ctx) return;
      var isPen = e.pointerType === "pen";
      if (isPen) notePen();
      if (e.pointerType === "touch") {
        // 觸控筆模式：剛用過筆（手掌靠在螢幕上）或接觸面積很大的觸碰直接忽略，不捲動也不縮放
        if (pref.penOnly === true && (Date.now() - lastPen < 600 || (e.width > 40 && e.height > 40))) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) {
          // 第二根手指：改成縮放／移動紙張。第一根手指如果已經開始畫，那一筆取消
          if (act && act.mode === "draw" && !act.s.pen) {
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
      // 螢光筆是半透明的整條路徑，邊畫邊整張重畫（才會畫在字的下面、接縫不會變深）
      if (act.mode === "draw" && act.s.t === "hl") self.requestDraw();
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
        if (a.s.t === "hl") self.requestDraw();
        else if (a.s.p.length === 3) drawStroke(self.ctx, a.s, a.pal);
        else { setColor(self.ctx, a.s, a.pal); tail(self.ctx, a.s); self.ctx.globalAlpha = 1; }
        self.push({ t: "add", s: a.s });
      } else if (a.mode === "erase" && a.removed.length) {
        self.push({ t: "del", items: a.removed });
      }
    }
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("contextmenu", function (e) { e.preventDefault(); });
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
    if (h.t === "add") this.strokes.splice(this.strokes.lastIndexOf(h.s), 1);
    else if (h.t === "del") for (var i = h.items.length - 1; i >= 0; i--) this.strokes.splice(h.items[i][0], 0, h.items[i][1]);
    else if (h.t === "clear") this.strokes = h.items.slice();
    else if (h.t === "h") this.setH(h.from);
    this.fut.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.redo = function () {
    var h = this.fut.pop();
    if (!h) return;
    if (h.t === "add") this.strokes.push(h.s);
    else if (h.t === "del") for (var i = 0; i < h.items.length; i++) this.strokes.splice(h.items[i][0], 1);
    else if (h.t === "clear") this.strokes = [];
    else if (h.t === "h") this.setH(h.to);
    this.hist.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.clear = function () {
    if (!this.strokes.length) return;
    if (!window.confirm("清除這一題的所有筆跡？（清除後還可以按「復原」救回來）")) return;
    this.hist.push({ t: "clear", items: this.strokes.slice() });
    this.fut = []; this.strokes = []; this.redraw(); this.changed();
  };
  /* 紙張長度：加長一次多 600；縮短一次收回 600，但停在最後一筆的下面、不會比原本的 900 短。都可以復原 */
  Pad.prototype.setH = function (h) { this.H = h; this.clampView(); this.layout(); };
  Pad.prototype.minH = function () {
    var maxY = 0;
    this.strokes.forEach(function (s) {
      var r = baseW(s) / 2;
      for (var i = 1; i < s.p.length; i += 3) if (s.p[i] + r > maxY) maxY = s.p[i] + r;
    });
    return Math.max(DEFAULT_H, Math.ceil((maxY + 40) / GRID) * GRID);
  };
  Pad.prototype.extend = function () {
    if (this.H >= MAX_H) { this.status("已經是最長了"); return; }
    var from = this.H, to = Math.min(MAX_H, from + STEP_H);
    this.setH(to);
    this.push({ t: "h", from: from, to: to });
    this.status("紙張加長了一段；用不到的話按「縮短」收回");
  };
  Pad.prototype.shrink = function () {
    var from = this.H, to = Math.max(from - STEP_H, this.minH());
    if (to >= from) {
      this.status(from <= DEFAULT_H ? "已經是原本的長度了" : "下面還有筆跡，先把最下面的字擦掉才能再縮短");
      return;
    }
    this.setH(to);
    this.push({ t: "h", from: from, to: to });
    this.status(to > from - STEP_H ? "縮短到最後一筆的下面（再往上會切到筆跡）" : to <= DEFAULT_H ? "回到原本的長度了" : "收回了一段");
  };

  Pad.prototype.changed = function () {
    var self = this;
    this.syncTools();
    markToggle(this.toggle, this.strokes.length > 0);
    if (!this.persist) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(function () {
      var job = self.strokes.length
        ? store.put(self.key, { v: 1, H: self.H, s: self.strokes, t: Date.now() })
        : store.del(self.key);
      job.then(function () { self.status(window.CGEP_SYNC && CGEP_SYNC.signedIn() ? "已存在這台裝置，稍後同步到雲端" : "已存在這台裝置"); askPersist(); })
         .catch(function () { self.status("儲存失敗：瀏覽器的儲存空間可能滿了"); });
    }, 400);
  };

  Pad.prototype.png = function () {
    if (!this.strokes.length) { this.status("還沒有筆跡"); return; }
    var maxY = 0;
    this.strokes.forEach(function (s) { for (var i = 1; i < s.p.length; i += 3) maxY = Math.max(maxY, s.p[i]); });
    var h = Math.min(this.H, Math.ceil(maxY + 60)), k = 1.4;
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * k); cv.height = Math.round(h * k);
    var x = cv.getContext("2d");
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, cv.width, cv.height);
    x.setTransform(k, 0, 0, k, 0, 0);
    drawAll(x, this.strokes, palette(true));
    var name = this.key.replace(/[^\w-]+/g, "_") + ".png";
    cv.toBlob(function (b) { if (b) download(name, b); }, "image/png");
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
      toggle.setAttribute("aria-expanded", String(open));
      if (open && first) pad.load();
      else if (open) pad.layout();
    });
  });
  store.keys().then(function (keys) {
    (keys || []).forEach(function (k) { if (toggles[k]) markToggle(toggles[k], true); });
  }).catch(function () {});

  // 雲端同步拉下比較新的筆跡：更新按鈕上的「有筆跡」，已經打開的手寫板重新載入
  document.addEventListener("cgep:ink-remote", function (e) {
    (e.detail.keys || []).forEach(function (k) {
      if (!toggles[k]) return;
      store.get(k).then(function (v) {
        var has = !!(v && v.s && v.s.length);
        markToggle(toggles[k], has);
        var pad = padsByKey[k];
        if (!pad || pad.busy) return;
        pad.strokes = has ? v.s : [];
        pad.H = (v && v.H) || DEFAULT_H;
        pad.hist = []; pad.fut = [];
        pad.layout(); pad.syncTools();
        pad.status("已載入雲端上比較新的筆跡");
      });
    });
  });
  document.addEventListener("cgep:synced", function (e) {
    (e.detail.pushed || []).forEach(function (k) { if (padsByKey[k]) padsByKey[k].status("已同步到雲端"); });
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
