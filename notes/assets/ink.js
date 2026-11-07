/* 手寫作答板：每一題「看答案」上方加一塊可以用觸控筆（S Pen）寫字的畫布。
 *
 * - 筆跡以向量存（每一筆的點座標＋壓力），座標以「寬度 1000」為基準，
 *   手機轉橫、換電腦看時等比例縮放，不會糊掉。
 * - 存在這台裝置瀏覽器的 IndexedDB（資料庫 cgep-ink、表 pads），key 是「頁面:題目 id」。
 * - 觸控筆模式：只有筆會寫字，手指拖曳是捲動頁面（第一次偵測到觸控筆時自動開啟）。
 * - S Pen 側鍵（瀏覽器回報成 barrel / eraser button 時）按住可以直接擦。
 */
(function () {
  "use strict";
  if (!document.querySelector("details.quiz")) return;

  var SLUG = document.body.getAttribute("data-slug") || location.pathname;
  var W = 1000;                       // 邏輯寬度
  var DEFAULT_H = 900, STEP_H = 600, MAX_H = 6000;
  var SIZES = [3.5, 6, 10];           // 細、中、粗（邏輯單位）
  var SIZE_NAMES = ["細", "中", "粗"];
  var COLOR_VARS = ["--pen-ink", "--pen-red", "--pen-blue", "--pen-green"];
  var COLOR_NAMES = ["黑", "紅", "藍", "綠"];
  var LIGHT = ["#1a2130", "#d0343f", "#2d5fd3", "#2f7d3b"];   // 存成圖片時用白底配色
  var PREF_KEY = "cgep:ink:pref";
  var PEN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  /* ---------- 儲存 ---------- */
  var dbp = null;
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error("no indexedDB")); return; }
      var r;
      try { r = indexedDB.open("cgep-ink", 1); } catch (e) { rej(e); return; }
      r.onupgradeneeded = function () { r.result.createObjectStore("pads"); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error("blocked")); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction("pads", mode), out;
        var req = fn(t.objectStore("pads"));
        if (req) req.onsuccess = function () { out = req.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  var store = {
    get: function (k) { return tx("readonly", function (s) { return s.get(k); }); },
    put: function (k, v) { return tx("readwrite", function (s) { return s.put(v, k); }); },
    del: function (k) { return tx("readwrite", function (s) { return s.delete(k); }); },
    keys: function () { return tx("readonly", function (s) { return s.getAllKeys ? s.getAllKeys() : null; }); }
  };

  function loadPref() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}") || {}; } catch (e) { return {}; } }
  var pref = loadPref();
  function savePref() { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) {} }

  /* ---------- 觸控筆偵測 ---------- */
  var openPads = [];
  var lastPen = 0;
  function notePen() {
    lastPen = Date.now();
    if (pref.penOnly === undefined) {
      pref.penOnly = true; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); p.status("偵測到觸控筆：已切換成觸控筆模式，手指拖曳會捲動頁面"); });
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
  function widthAt(s, pr) { return SIZES[s.w] * (s.pen ? 0.35 + (pr / 100) * 1.3 : 1); }
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
  function setColor(ctx, s, pal) {
    ctx.strokeStyle = ctx.fillStyle = pal[s.c] || pal[0];
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  }
  function drawStroke(ctx, s, pal) {
    setColor(ctx, s, pal);
    var n = s.p.length / 3;
    if (n === 1) {
      ctx.beginPath(); ctx.arc(s.p[0], s.p[1], widthAt(s, s.p[2]) / 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    for (var k = 1; k < n; k++) seg(ctx, s, k);
    tail(ctx, s);
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

  /* ---------- 一塊手寫板 ---------- */
  function Pad(wrap, key, toggle) {
    this.key = key; this.toggle = toggle;
    this.strokes = []; this.hist = []; this.fut = [];
    this.H = DEFAULT_H; this.tool = "pen"; this.scale = 1; this.ctx = null;
    this.saveTimer = 0; this.persist = true;

    var colors = COLOR_NAMES.map(function (n, i) {
      return '<button type="button" class="ink-sw" data-color="' + i + '" aria-label="' + n + '色" title="' + n + '"><span style="background:var(' + COLOR_VARS[i] + ')"></span></button>';
    }).join("");
    var sizes = SIZE_NAMES.map(function (n, i) {
      return '<button type="button" data-size="' + i + '" aria-label="' + n + '筆">' + n + "</button>";
    }).join("");
    var panel = this.panel = el("div", "ink-panel");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ink-tools" role="toolbar" aria-label="手寫工具">' +
        '<div class="ink-grp"><button type="button" data-tool="pen">筆</button><button type="button" data-tool="eraser">橡皮擦</button></div>' +
        '<div class="ink-grp">' + colors + "</div>" +
        '<div class="ink-grp">' + sizes + "</div>" +
        '<div class="ink-grp"><button type="button" data-act="undo">↶ 復原</button><button type="button" data-act="redo" aria-label="重做">↷</button></div>' +
        '<div class="ink-grp"><button type="button" data-act="more">加長</button><button type="button" data-act="clear">清除</button><button type="button" data-act="png">存成圖片</button></div>' +
      "</div>" +
      '<div class="ink-sheet"><canvas class="ink-canvas" aria-label="手寫區"></canvas></div>' +
      '<div class="ink-foot">' +
        '<label class="ink-pen"><input type="checkbox"> 觸控筆模式（只有筆會寫，手指拖曳是捲動）</label>' +
        '<span class="ink-status" aria-live="polite"></span>' +
      "</div>";
    wrap.appendChild(panel);
    this.sheet = panel.querySelector(".ink-sheet");
    this.canvas = panel.querySelector("canvas");
    this.penBox = panel.querySelector(".ink-pen input");
    this.statusEl = panel.querySelector(".ink-status");
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
    var c = this.canvas;
    c.style.height = cssH + "px";
    c.width = Math.round(cssW * r);
    c.height = Math.round(cssH * r);
    this.ctx = c.getContext("2d");
    this.ctx.setTransform(r * this.scale, 0, 0, r * this.scale, 0, 0);
    this.redraw();
  };

  Pad.prototype.redraw = function () {
    var ctx = this.ctx;
    if (!ctx) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    var pal = palette(false);
    for (var i = 0; i < this.strokes.length; i++) drawStroke(ctx, this.strokes[i], pal);
  };

  Pad.prototype.status = function (t) { this.statusEl.textContent = t; };

  Pad.prototype.syncTools = function () {
    var self = this, color = pref.color || 0, size = pref.size == null ? 1 : pref.size;
    this.panel.querySelectorAll("[data-tool]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tool === self.tool)); });
    this.panel.querySelectorAll("[data-color]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.color === color)); });
    this.panel.querySelectorAll("[data-size]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.size === size)); });
    this.panel.querySelector('[data-act="undo"]').disabled = !this.hist.length;
    this.panel.querySelector('[data-act="redo"]').disabled = !this.fut.length;
    this.canvas.style.cursor = this.tool === "eraser" ? "cell" : "crosshair";
  };
  Pad.prototype.syncPenOnly = function () { this.penBox.checked = pref.penOnly === true; };

  Pad.prototype.bindTools = function () {
    var self = this;
    this.panel.querySelector(".ink-tools").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.tool) self.tool = b.dataset.tool;
      else if (b.dataset.color) { pref.color = +b.dataset.color; self.tool = "pen"; savePref(); syncAll(); }
      else if (b.dataset.size) { pref.size = +b.dataset.size; self.tool = "pen"; savePref(); syncAll(); }
      else if (b.dataset.act === "undo") self.undo();
      else if (b.dataset.act === "redo") self.redo();
      else if (b.dataset.act === "more") self.extend();
      else if (b.dataset.act === "clear") self.clear();
      else if (b.dataset.act === "png") self.png();
      self.syncTools();
    });
    this.penBox.addEventListener("change", function () {
      pref.penOnly = self.penBox.checked; savePref();
      openPads.forEach(function (p) { p.syncPenOnly(); });
    });
  };

  Pad.prototype.bindPointer = function () {
    var self = this, c = this.canvas, act = null;
    function pos(e) {
      var r = c.getBoundingClientRect();
      return [Math.round((e.clientX - r.left) / self.scale * 10) / 10, Math.round((e.clientY - r.top) / self.scale * 10) / 10];
    }
    function pres(e) { return e.pointerType === "pen" ? Math.round((e.pressure || 0.5) * 100) : 50; }

    c.addEventListener("pointerdown", function (e) {
      if (act || !self.ctx) return;
      var isPen = e.pointerType === "pen";
      if (isPen) notePen();
      if (e.pointerType === "touch" && pref.penOnly === true) {
        // 觸控筆模式：手指只用來捲動；剛用過筆（手掌靠在螢幕上）或接觸面積很大時直接忽略
        if (Date.now() - lastPen < 600 || (e.width > 40 && e.height > 40)) return;
        act = { id: e.pointerId, mode: "scroll", y: e.clientY };
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch (err) {}
      var q = pos(e);
      var sideButton = (e.buttons & 32) || (isPen && (e.buttons & 2));
      if (self.tool === "eraser" || sideButton) {
        act = { id: e.pointerId, mode: "erase", removed: [] };
        self.eraseAt(q[0], q[1], act);
        return;
      }
      var s = { c: pref.color || 0, w: pref.size == null ? 1 : pref.size, pen: isPen, p: [q[0], q[1], pres(e)] };
      self.strokes.push(s);
      act = { id: e.pointerId, mode: "draw", s: s, pal: palette(false) };
    });

    c.addEventListener("pointermove", function (e) {
      if (!act || e.pointerId !== act.id) return;
      if (act.mode === "scroll") { window.scrollBy(0, act.y - e.clientY); act.y = e.clientY; return; }
      e.preventDefault();
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!list.length) list = [e];
      for (var i = 0; i < list.length; i++) {
        var q = pos(list[i]);
        if (act.mode === "erase") { self.eraseAt(q[0], q[1], act); continue; }
        var p = act.s.p, n = p.length;
        if (Math.hypot(q[0] - p[n - 3], q[1] - p[n - 2]) < 0.8) continue;
        p.push(q[0], q[1], pres(list[i]));
        setColor(self.ctx, act.s, act.pal);
        seg(self.ctx, act.s, p.length / 3 - 1);
      }
    });

    function end(e) {
      if (!act || e.pointerId !== act.id) return;
      var a = act;
      act = null;
      if (a.mode === "draw") {
        if (a.s.p.length === 3) drawStroke(self.ctx, a.s, a.pal);
        else { setColor(self.ctx, a.s, a.pal); tail(self.ctx, a.s); }
        self.push({ t: "add", s: a.s });
      } else if (a.mode === "erase" && a.removed.length) {
        self.push({ t: "del", items: a.removed });
      }
    }
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  };

  Pad.prototype.eraseAt = function (x, y, a) {
    var hit = false;
    for (var i = this.strokes.length - 1; i >= 0; i--) {
      var s = this.strokes[i];
      if (near(s, x, y, 14 + SIZES[s.w])) { a.removed.push([i, s]); this.strokes.splice(i, 1); hit = true; }
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
    this.fut.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.redo = function () {
    var h = this.fut.pop();
    if (!h) return;
    if (h.t === "add") this.strokes.push(h.s);
    else if (h.t === "del") for (var i = 0; i < h.items.length; i++) this.strokes.splice(h.items[i][0], 1);
    else if (h.t === "clear") this.strokes = [];
    this.hist.push(h); this.redraw(); this.changed();
  };
  Pad.prototype.clear = function () {
    if (!this.strokes.length) return;
    if (!window.confirm("清除這一題的所有筆跡？（清除後還可以按「復原」救回來）")) return;
    this.hist.push({ t: "clear", items: this.strokes.slice() });
    this.fut = []; this.strokes = []; this.redraw(); this.changed();
  };
  Pad.prototype.extend = function () {
    if (this.H >= MAX_H) { this.status("已經是最長了"); return; }
    this.H = Math.min(MAX_H, this.H + STEP_H);
    this.layout(); this.changed();
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
      job.then(function () { self.status("已存在這台裝置"); })
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
    var pal = palette(true);
    this.strokes.forEach(function (s) { drawStroke(x, s, pal); });
    var name = this.key.replace(/[^\w-]+/g, "_") + ".png";
    cv.toBlob(function (b) {
      if (!b) return;
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }, "image/png");
  };

  function syncAll() { openPads.forEach(function (p) { p.syncTools(); }); }
  function markToggle(t, has) {
    t.classList.toggle("has", has);
    t.querySelector("span").textContent = has ? "手寫作答（有筆跡）" : "手寫作答";
  }

  /* ---------- 掛到每一題 ---------- */
  var toggles = {};
  document.querySelectorAll("details.quiz").forEach(function (quiz) {
    if (!quiz.id) return;
    var key = SLUG + ":" + quiz.id;
    var wrap = el("div", "ink");
    var toggle = el("button", "ink-toggle", PEN_SVG + "<span>手寫作答</span>");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    wrap.appendChild(toggle);
    quiz.parentNode.insertBefore(wrap, quiz);
    toggles[key] = toggle;
    var pad = null;
    toggle.addEventListener("click", function () {
      var first = !pad;
      if (first) { pad = new Pad(wrap, key, toggle); openPads.push(pad); }
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

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var redrawAll = function () { openPads.forEach(function (p) { p.redraw(); }); };
    if (mq.addEventListener) mq.addEventListener("change", redrawAll);
    else if (mq.addListener) mq.addListener(redrawAll);
  }
})();
