/* 教材頁的導覽：
 * 1. 一次只顯示一個單元（build_notes.py 把每個 ## 標題包成 <section class="unit">）。
 *    網址的 #錨點決定顯示哪個單元，行程表和錯題清單的連結都照常能跳。
 *    沒有錨點時，回到上次看的單元。
 * 2. 手機上按右下角的「目錄」，目錄從頁首下方由上往下展開；打開時只有目錄能捲動，後面的頁面鎖住。
 * 3. 右下角「回到最上面」「到最下面」按鈕，已經在最上面／最下面時收起來（下面的按鈕往下補位，不留空格），
 *    按了會在半秒左右快速滑過去（glide.js）。
 * 4. 目錄裡每個單元右邊有箭頭，可以展開這個單元的小節；現在看的單元自動展開。
 */
(function () {
  "use strict";
  var I = window.CGEP_ICON || function () { return ""; };
  var body = document.body;
  var slug = body.getAttribute("data-slug") || "";
  var aside = document.querySelector("aside.toc");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- 右下角按鈕 ---------- */
  var fab = document.createElement("div");
  fab.className = "fab";
  fab.innerHTML =
    // 「目錄」放最下面（最常按、離拇指最近，位置固定不動）；上、下兩個在它上面，收起來時往下補位
    '<button type="button" data-go="top" aria-label="回到最上面" title="回到最上面">' + I("top") + "</button>" +
    '<button type="button" data-go="bottom" aria-label="到最下面" title="到最下面">' + I("bottom") + "</button>" +
    '<button type="button" class="fab-toc" aria-label="打開目錄" aria-expanded="false">' + I("toc") + "</button>";
  body.appendChild(fab);
  fab.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.classList.contains("fab-toc")) { setDrawer(!body.classList.contains("toc-open")); return; }
    if (!b.dataset.go) return;
    var toTop = b.dataset.go === "top";
    var glide = window.CGEP_GLIDE || function (y) { window.scrollTo(0, typeof y === "function" ? y() : y); };
    glide(toTop ? 0 : function () { return document.documentElement.scrollHeight - window.innerHeight; });
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

  /* ---------- 目錄：每個單元底下的小節，按右邊的箭頭展開 ---------- */
  var tocItems = [];
  if (aside) {
    Array.prototype.forEach.call(aside.querySelectorAll(".toc > ul > li"), function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var id = (a.getAttribute("href") || "").slice(1);
      try { id = decodeURIComponent(id); } catch (e) {}
      var h = id ? document.getElementById(id) : null;
      var sec = h && h.closest ? h.closest("section.unit") : null;
      var subs = [];
      if (sec) subs = sec.querySelectorAll("h3[id]");
      else if (h && h.tagName === "H2") {
        // 沒有分單元的頁面（學習方法）：收集這個 ## 底下、到下一個 ## 之前的 ### 小節
        for (var n = h.nextElementSibling; n && n.tagName !== "H2"; n = n.nextElementSibling) if (n.tagName === "H3" && n.id) subs.push(n);
      }
      tocItems.push({ li: li, a: a, sec: sec });
      if (!subs.length) return;
      li.classList.add("has-sub");
      var tg = document.createElement("button");
      tg.type = "button";
      tg.className = "toc-tg";
      tg.setAttribute("aria-expanded", "false");
      tg.setAttribute("aria-controls", "tsub-" + id);
      tg.setAttribute("aria-label", "展開「" + a.textContent.trim() + "」的小節");
      tg.innerHTML = I("chevron");
      var wrap = document.createElement("div");
      wrap.className = "toc-subw";
      wrap.id = "tsub-" + id;
      wrap.innerHTML = '<div class="toc-subi"><ul class="toc-sub">' + Array.prototype.map.call(subs, function (x) {
        return '<li><a href="#' + esc(x.id) + '">' + esc(x.textContent.trim()) + "</a></li>";
      }).join("") + "</ul></div>";
      li.appendChild(tg);
      li.appendChild(wrap);
      tg.addEventListener("click", function () { setSub(li, !li.classList.contains("open")); });
    });
  }
  // 點「現在這個單元」的名稱：展開／收起它的小節（不重新跳轉，手機的目錄也不會關掉）。點別的單元才換單元。
  if (aside) aside.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".toc > ul > li > a");
    if (!a) return;
    var it = tocItems.filter(function (x) { return x.a === a; })[0];
    if (!it || !it.sec || it.sec !== current || !it.li.classList.contains("has-sub")) return;
    e.preventDefault();
    e.stopPropagation();
    setSub(it.li, !it.li.classList.contains("open"));
  }, true);
  function setSub(li, open) {
    li.classList.toggle("open", open);
    var tg = li.querySelector(".toc-tg");
    if (tg) {
      tg.setAttribute("aria-expanded", String(open));
      tg.setAttribute("aria-label", (open ? "收起" : "展開") + "「" + li.querySelector("a").textContent.trim() + "」的小節");
    }
  }
  function setDrawer(open) {
    if (open && header) document.documentElement.style.setProperty("--hdr", Math.round(header.getBoundingClientRect().bottom) + "px");
    body.classList.toggle("toc-open", open);
    document.documentElement.classList.toggle("toc-lock", open);
    fab.querySelector(".fab-toc").setAttribute("aria-expanded", String(open));
    if (open && aside) {
      // 只捲目錄本身，讓現在讀到的小節（沒有的話就是單元）出現在目錄中間；後面的頁面不動
      var cur = aside.querySelector("a.cur-sub") || aside.querySelector("a.cur");
      aside.scrollTop = cur ? Math.max(0, cur.offsetTop - aside.clientHeight / 3) : 0;
    }
  }

  /* ---------- 目錄：標出現在讀到哪一個小節（粗體＋左邊一條紅線），捲動時跟著換 ---------- */
  var subLinks = {}, curSub = null, curTop = null, spyTick = 0;
  tocItems.forEach(function (it) {
    Array.prototype.forEach.call(it.li.querySelectorAll(".toc-sub a"), function (a) { subLinks[a.getAttribute("href").slice(1)] = a; });
  });
  // 標題的上緣捲到頁首下面一點點，就算讀到這一節；捲到最底時，畫面上半部最後一個標題就是現在這節
  function lastPassed(list, line, atEnd) {
    var pick = null;
    for (var i = 0; i < list.length; i++) {
      var top = list[i].getBoundingClientRect().top;
      if (top <= line || (atEnd && top < window.innerHeight * 0.6)) pick = list[i];
      else if (!atEnd) break;
    }
    return pick;
  }
  function keepVisible(a) {
    if (!aside || aside.scrollHeight <= aside.clientHeight + 2) return;
    var ar = aside.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (r.top < ar.top + 48 || r.bottom > ar.bottom - 48) aside.scrollTop += r.top - ar.top - aside.clientHeight / 3;
  }
  function spy() {
    spyTick = 0;
    var root = current || document.querySelector("article");
    if (!root || root.hidden) return;
    var line = (header ? header.getBoundingClientRect().bottom : 0) + 28;
    var atEnd = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 4;
    // 沒有分單元的頁面（學習方法）：也要標出現在在哪一個大段
    if (!current) {
      var h2 = lastPassed(root.querySelectorAll("h2[id]"), line, atEnd);
      tocItems.forEach(function (it) {
        var on = !!h2 && it.a.getAttribute("href") === "#" + h2.id;
        if (it.a.classList.contains("cur") !== on) {
          it.a.classList.toggle("cur", on);
          if (on) it.a.setAttribute("aria-current", "true"); else it.a.removeAttribute("aria-current");
        }
      });
      if (h2 !== curTop) { curTop = h2; var top = h2 && tocItems.filter(function (it) { return it.a.getAttribute("href") === "#" + h2.id; })[0]; if (top) keepVisible(top.a); }
    }
    var h3 = lastPassed(root.querySelectorAll("h3[id]"), line, atEnd);
    // 小節要在現在這個大段裡面才算（學習方法頁捲到下一個大段的開頭時，不要還標著上一段的小節）
    if (h3 && !current && curTop && (curTop.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_PRECEDING)) h3 = null;
    var a = h3 ? subLinks[h3.id] || null : null;
    if (a === curSub) return;
    if (curSub) { curSub.classList.remove("cur-sub"); curSub.removeAttribute("aria-current"); }
    curSub = a;
    if (a) { a.classList.add("cur-sub"); a.setAttribute("aria-current", "location"); keepVisible(a); }
  }
  function spySoon() { if (!spyTick) spyTick = requestAnimationFrame(spy); }
  window.addEventListener("scroll", spySoon, { passive: true });
  window.addEventListener("resize", spySoon);
  if (window.ResizeObserver) new ResizeObserver(spySoon).observe(document.body);

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
  // 收起來的解答（details）裡的表，打開後才量得到寬度；單元還沒排版好就等排版完再一起處理
  document.addEventListener("toggle", function (e) {
    var d = e.target;
    if (!d.open || !d.closest) return;
    var host = d.closest("section.unit") || d.closest("article");
    if (host && host.dataset.mj) fitTables(d);
  }, true);

  // 手機上放不下的表格：列數少、欄位多的轉成直的；其他的每一列變成一張卡片
  // 放得下、但有一格被擠到一行只剩三四個字的表（欄位多、字也多的比較表），也改成卡片
  function fitTables(root) {
    if (!phone.matches || !root) return;
    root.querySelectorAll("table").forEach(function (tb) {
      if (tb.dataset.fit || !tb.offsetParent || tb.closest(".vz")) return;
      var over = tb.scrollWidth > tb.clientWidth + 2;
      if (!over && !cramped(tb)) return;
      var rows = Array.prototype.slice.call(tb.rows);
      var cols = Math.max.apply(null, rows.map(function (r) { return r.cells.length; }));
      var merged = tb.querySelector("[rowspan],[colspan]");
      // 格子裡的字都很短（例如時間軸、frame 內容）才轉直的；字多的表轉直了還是太寬，改用卡片
      var longest = 0;
      Array.prototype.forEach.call(tb.tBodies, function (b) { Array.prototype.forEach.call(b.rows, function (r) { Array.prototype.forEach.call(r.cells, function (c, i) { if (i) longest = Math.max(longest, c.textContent.trim().length); }); }); });
      if (over && !merged && rows.length <= 4 && cols >= 5 && longest <= 8) {
        transpose(tb, rows, cols);
        tb.dataset.fit = "t";
        if (tb.scrollWidth <= tb.clientWidth + 2) return;
      }
      if (!tb.dataset.fit) { stack(tb); tb.dataset.fit = "s"; }
    });
  }
  // 數一格的文字排成幾行（公式不算）：4 行以上、平均每行 4 個字以下，或 3 行以上、每行 2 個字以下，就算太擠。
  // 欄位很多的數字表（例如 DP 表）改成卡片反而更難看，不處理
  function cramped(tb) {
    var cols = Math.max.apply(null, Array.prototype.map.call(tb.rows, function (r) { return r.cells.length; }));
    if (cols > 6) return false;
    var cells = tb.querySelectorAll("tbody td, tbody th");
    for (var i = 0; i < cells.length; i++) {
      var tops = [], len = 0, w = document.createTreeWalker(cells[i], NodeFilter.SHOW_TEXT, null);
      for (var t = w.nextNode(); t; t = w.nextNode()) {
        var s = t.data.replace(/\s+/g, "");
        if (!s || (t.parentNode.closest && t.parentNode.closest("mjx-container"))) continue;
        len += s.length;
        var r = document.createRange();
        r.selectNodeContents(t);
        Array.prototype.forEach.call(r.getClientRects(), function (x) { if (x.width > 0 && x.height > 4) tops.push(x.top); });
      }
      tops.sort(function (a, b) { return a - b; });
      var lines = tops.length ? 1 : 0;
      for (var k = 1; k < tops.length; k++) if (tops[k] - tops[k - 1] > 8) lines++;
      if ((lines >= 4 && len <= lines * 4) || (lines >= 3 && len <= lines * 2)) return true;
    }
    return false;
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
    var heads = tb.tHead && tb.tHead.rows[0] ? Array.prototype.slice.call(tb.tHead.rows[0].cells) : [];
    var hasMath = function (c) { return !!c.querySelector("mjx-container, img, svg"); };
    Array.prototype.forEach.call(tb.tBodies, function (b) {
      Array.prototype.forEach.call(b.rows, function (r) {
        Array.prototype.forEach.call(r.cells, function (c, i) {
          // 空的格子在卡片裡只會剩一個欄位名稱，不顯示
          if (!c.textContent.trim() && !hasMath(c)) { c.classList.add("nil"); return; }
          // 內容包一層，排版時文字和公式才會待在同一格
          var w = document.createElement("span");
          w.className = "cv";
          while (c.firstChild) w.appendChild(c.firstChild);
          // 欄位名稱整個複製過來（裡面的公式也要，例如 n-way 的 n）
          var h = heads[i];
          if (h && (h.textContent.trim() || hasMath(h))) {
            var lb = document.createElement("span");
            lb.className = "lb";
            Array.prototype.forEach.call(h.childNodes, function (n) { lb.appendChild(n.cloneNode(true)); });
            c.appendChild(lb);
            c.classList.add("has-lb");
          }
          c.appendChild(w);
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

  // 目錄：標出現在的單元，展開它的小節，其他單元收起來。換單元時直接切換、不跑動畫
  // （新單元的數學式排版會讓畫面卡一下，動畫在那時候跑會一頓一頓的）
  function markToc(sec) {
    if (aside) aside.classList.add("toc-instant");
    tocItems.forEach(function (it) {
      var on = it.sec === sec;
      it.a.classList.toggle("cur", on);
      if (on) it.a.setAttribute("aria-current", "true"); else it.a.removeAttribute("aria-current");
      if (it.li.classList.contains("has-sub")) setSub(it.li, on);
    });
    if (aside) setTimeout(function () { aside.classList.remove("toc-instant"); }, 60);
  }
  var pending = null;
  // 換單元：目錄先更新、先畫到螢幕上（點下去馬上有反應），下一個畫面才換內容、排版數學式
  function show(sec, target, scroll, now) {
    if (sec !== current && !now) {
      markToc(sec);
      var go = !pending;
      pending = [sec, target, scroll];
      if (go) requestAnimationFrame(function () { setTimeout(function () { var a = pending; pending = null; show(a[0], a[1], a[2], true); }, 0); });
      return;
    }
    if (sec !== current) {
      markToc(sec);
      secs.forEach(function (s) { s.hidden = s !== sec; });
      current = sec;
      save(KEY, sec.dataset.unit);
      setTimeout(fabSoon, 50);
      setTimeout(spySoon, 80);
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
      show(sec, null, !first, first);
      return;
    }
    show(sec, t, true, first);
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
