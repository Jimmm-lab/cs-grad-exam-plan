/* 教材頁的導覽：
 * 1. 一次只顯示一個單元（build_notes.py 把每個 ## 標題包成 <section class="unit">）。
 *    網址的 #錨點決定顯示哪個單元，行程表和錯題清單的連結都照常能跳。
 *    沒有錨點時，回到上次看的單元。
 * 2. 手機上按右下角的「目錄」，目錄從頁首下方由上往下展開；打開時只有目錄能捲動，後面的頁面鎖住。
 * 3. 右下角「回到最上面」「到最下面」按鈕，已經在最上面／最下面時自動消失。
 */
(function () {
  "use strict";
  var I = window.CGEP_ICON || function () { return ""; };
  var body = document.body;
  var slug = body.getAttribute("data-slug") || "";
  var aside = document.querySelector("aside.toc");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- 右下角按鈕 ---------- */
  var fab = document.createElement("div");
  fab.className = "fab";
  fab.innerHTML =
    '<button type="button" class="fab-toc" aria-label="打開目錄" aria-expanded="false">' + I("toc") + "</button>" +
    '<button type="button" data-go="top" aria-label="回到最上面" title="回到最上面">' + I("top") + "</button>" +
    '<button type="button" data-go="bottom" aria-label="到最下面" title="到最下面">' + I("bottom") + "</button>";
  body.appendChild(fab);
  fab.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.classList.contains("fab-toc")) { setDrawer(!body.classList.contains("toc-open")); return; }
    var y = b.dataset.go === "top" ? 0 : document.documentElement.scrollHeight - window.innerHeight;
    // 距離很遠時直接跳過去，平滑捲動會捲很久
    var far = Math.abs(y - window.scrollY) > window.innerHeight * 3;
    window.scrollTo({ top: y, behavior: reduce || far ? "instant" : "smooth" });
  });

  // 手寫板打開時，按鈕如果剛好蓋在紙上，就先藏起來，免得筆寫到按鈕
  var fabTick = 0;
  function fabCheck() {
    fabTick = 0;
    var de = document.documentElement, y = window.scrollY, max = de.scrollHeight - window.innerHeight;
    fab.querySelector('[data-go="top"]').classList.toggle("is-off", y < 24);
    fab.querySelector('[data-go="bottom"]').classList.toggle("is-off", y > max - 24);
    var fr = fab.getBoundingClientRect(), hide = false;
    document.querySelectorAll(".ink-panel:not([hidden]) .ink-canvas").forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.bottom > fr.top && r.top < fr.bottom && r.right > fr.left && r.left < fr.right) hide = true;
    });
    fab.classList.toggle("fab-off", hide);
  }
  function fabSoon() { if (!fabTick) fabTick = requestAnimationFrame(fabCheck); }
  window.addEventListener("scroll", fabSoon, { passive: true });
  window.addEventListener("resize", fabSoon);
  document.addEventListener("click", function () { setTimeout(fabSoon, 50); }, true);
  if (window.ResizeObserver) new ResizeObserver(fabSoon).observe(document.body);
  fabSoon();

  /* ---------- 手機的目錄：從頁首下方由上往下展開 ---------- */
  var backdrop = document.createElement("div");
  backdrop.className = "toc-backdrop";
  body.appendChild(backdrop);
  if (aside) {
    var head = document.createElement("div");
    head.className = "toc-head";
    head.innerHTML = '<span class="eyebrow">目錄</span><button type="button" class="toc-close" aria-label="關閉目錄">' + I("close") + "</button>";
    aside.insertBefore(head, aside.firstChild);
    head.querySelector(".toc-close").addEventListener("click", function () { setDrawer(false); });
    aside.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
  }
  backdrop.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  var header = document.querySelector("header.top");
  function setDrawer(open) {
    if (open && header) document.documentElement.style.setProperty("--hdr", Math.round(header.getBoundingClientRect().bottom) + "px");
    body.classList.toggle("toc-open", open);
    document.documentElement.classList.toggle("toc-lock", open);
    fab.querySelector(".fab-toc").setAttribute("aria-expanded", String(open));
    if (open && aside) {
      // 只捲目錄本身，讓現在的單元出現在目錄中間；後面的頁面不動
      var cur = aside.querySelector("a.cur");
      aside.scrollTop = cur ? Math.max(0, cur.offsetTop - aside.clientHeight / 3) : 0;
    }
  }

  /* ---------- 數學式排版、手機上的表格 ---------- */
  var phone = window.matchMedia ? window.matchMedia("(max-width: 700px)") : { matches: false };
  // MathJax 只排版正在看的那一段（第一次顯示時才排），手機開頁面比較快，也才量得到正確的寬度讓長公式換行
  function typeset(el) {
    var mj = window.MathJax;
    if (!el || !(mj && mj.typesetPromise && mj.startup && mj.startup.document)) return Promise.resolve(false);
    if (el.dataset.mj) return Promise.resolve(true);
    el.dataset.mj = "1";
    return mj.typesetPromise([el]).then(function () { return true; }, function () { return true; });
  }
  function prepare(el) { return typeset(el).then(function (ok) { if (ok) fitTables(el); return ok; }); }

  // 手機上放不下的表格：列數少、欄位多的轉成直的；其他的每一列變成一張卡片
  function fitTables(root) {
    if (!phone.matches || !root) return;
    root.querySelectorAll("table").forEach(function (tb) {
      if (tb.dataset.fit || !tb.offsetParent || tb.closest(".vz")) return;
      if (tb.scrollWidth <= tb.clientWidth + 2) return;
      var rows = Array.prototype.slice.call(tb.rows);
      var cols = Math.max.apply(null, rows.map(function (r) { return r.cells.length; }));
      var merged = tb.querySelector("[rowspan],[colspan]");
      // 格子裡的字都很短（例如時間軸、frame 內容）才轉直的；字多的表轉直了還是太寬，改用卡片
      var longest = 0;
      Array.prototype.forEach.call(tb.tBodies, function (b) { Array.prototype.forEach.call(b.rows, function (r) { Array.prototype.forEach.call(r.cells, function (c, i) { if (i) longest = Math.max(longest, c.textContent.trim().length); }); }); });
      if (!merged && rows.length <= 4 && cols >= 5 && longest <= 8) {
        transpose(tb, rows, cols);
        tb.dataset.fit = "t";
        if (tb.scrollWidth <= tb.clientWidth + 2) return;
      }
      if (!tb.dataset.fit) { stack(tb); tb.dataset.fit = "s"; }
    });
  }
  function transpose(tb, rows, cols) {
    var m = rows.map(function (r) { return Array.prototype.slice.call(r.cells); });
    var body2 = document.createElement("tbody");
    for (var c = 0; c < cols; c++) {
      var tr = document.createElement("tr");
      for (var r = 0; r < m.length; r++) tr.appendChild(m[r][c] || document.createElement("td"));
      body2.appendChild(tr);
    }
    Array.prototype.slice.call(tb.children).forEach(function (x) { if (/^(THEAD|TBODY|TFOOT)$/.test(x.tagName)) x.remove(); });
    tb.appendChild(body2);
    tb.classList.add("tbl-t");
  }
  function stack(tb) {
    var heads = tb.tHead && tb.tHead.rows[0] ? Array.prototype.map.call(tb.tHead.rows[0].cells, function (c) { return c.textContent.trim(); }) : [];
    Array.prototype.forEach.call(tb.tBodies, function (b) {
      Array.prototype.forEach.call(b.rows, function (r) {
        Array.prototype.forEach.call(r.cells, function (c, i) {
          // 內容包一層，排版時文字和公式才會待在同一格
          var w = document.createElement("span");
          w.className = "cv";
          while (c.firstChild) w.appendChild(c.firstChild);
          c.appendChild(w);
          if (heads[i]) c.setAttribute("data-label", heads[i]);
        });
      });
    });
    tb.classList.add("tbl-stack");
  }

  // 跳到某個小節或題目後，排版會改變高度；使用者還沒自己捲動的話，再對準一次
  var nav = null, lastUser = 0;
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function () { lastUser = Date.now(); }, { passive: true, capture: true });
  });
  function realign() {
    if (!nav || lastUser > nav.at || (nav.sec && current !== nav.sec)) return;
    var st = nav.sec ? scrollTarget(nav.sec, nav.t) : nav.t;
    if (st) st.scrollIntoView({ block: "start" }); else if (nav.sec) window.scrollTo(0, 0);
  }

  var secs = Array.prototype.slice.call(document.querySelectorAll("section.unit"));
  var current = null;
  if (body.getAttribute("data-split") !== "1" || secs.length < 2) {
    // 不分單元的頁面（學習方法）：整頁一起排版
    var art = document.querySelector("article");
    document.addEventListener("cgep:mathjax", function () { prepare(art).then(realign); });
    setTimeout(function () { if (!art.dataset.mj) fitTables(art); }, 8000);
    if (location.hash) {
      var t0 = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t0) nav = { sec: null, t: t0, at: Date.now() };
    }
    window.addEventListener("load", function () { setTimeout(realign, 0); });
    return;
  }

  /* ---------- 一次只顯示一個單元 ---------- */
  var KEY = "cgep:unit:" + slug;
  var tocLinks = aside ? Array.prototype.slice.call(aside.querySelectorAll(".toc a")) : [];
  var title = function (s) { var h = s.querySelector("h2"); return h ? h.textContent.trim() : ""; };

  // 每個單元最後加「上一單元／下一單元」
  secs.forEach(function (s, i) {
    var prev = secs[i - 1], next = secs[i + 1];
    var pg = document.createElement("nav");
    pg.className = "pager";
    pg.setAttribute("aria-label", "換單元");
    pg.innerHTML =
      (prev ? '<a class="pg-prev" href="#' + esc(prev.dataset.unit) + '">' + I("prev") + "<span><small>上一單元</small>" + esc(title(prev)) + "</span></a>" : "<span></span>") +
      (next ? '<a class="pg-next" href="#' + esc(next.dataset.unit) + '"><span><small>下一單元</small>' + esc(title(next)) + "</span>" + I("next") + "</a>" : "<span></span>");
    s.appendChild(pg);
  });

  function show(sec, target, scroll) {
    if (sec !== current) {
      secs.forEach(function (s) { s.hidden = s !== sec; });
      current = sec;
      save(KEY, sec.dataset.unit);
      // 目錄：標出現在的單元，底下列出這個單元的小節
      var old = aside && aside.querySelector(".toc-sub");
      if (old) old.remove();
      tocLinks.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + sec.dataset.unit;
        a.classList.toggle("cur", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        if (on) {
          var subs = sec.querySelectorAll("h3[id]");
          if (subs.length) {
            var ul = document.createElement("ul");
            ul.className = "toc-sub";
            ul.innerHTML = Array.prototype.map.call(subs, function (h) { return '<li><a href="#' + esc(h.id) + '">' + esc(h.textContent.trim()) + "</a></li>"; }).join("");
            a.parentNode.appendChild(ul);
          }
        }
      });
      setTimeout(fabSoon, 50);
    }
    if (scroll) {
      nav = { sec: sec, t: target, at: Date.now() };
      var t = scrollTarget(sec, target);
      if (t) t.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
    }
    prepare(sec).then(function (ok) { if (ok) { realign(); fabSoon(); } });
  }
  // 連到單元本身（或它的大標題）時捲到最上面，連到單元裡的小節或題目時捲到那裡
  function scrollTarget(sec, target) {
    if (!target || target === sec || target === sec.querySelector("h2")) return null;
    return target;
  }
  function route(first) {
    var id = "";
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = location.hash.slice(1); }
    var t = id ? document.getElementById(id) : null;
    var sec = t && t.closest ? t.closest("section.unit") : null;
    if (!sec) {
      var saved = load(KEY);
      sec = secs.filter(function (s) { return s.dataset.unit === saved; })[0] || secs[0];
      show(sec, null, !first);
      return;
    }
    show(sec, t, true);
  }
  // 瀏覽器在載入完成後會自己再捲到錨點一次；MathJax 載入後才排版第一個單元
  window.addEventListener("load", function () { setTimeout(realign, 0); });
  document.addEventListener("cgep:mathjax", function () { if (current) prepare(current).then(realign); });
  setTimeout(function () { if (current && !current.dataset.mj) fitTables(current); }, 8000);
  phone.addEventListener && phone.addEventListener("change", function () { if (current) fitTables(current); });
  window.addEventListener("hashchange", function () { route(false); });
  // 點到跟現在一樣的 #錨點時，瀏覽器不會觸發 hashchange，自己處理
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); route(false); }
  });
  route(true);
})();
