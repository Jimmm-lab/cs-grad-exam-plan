/* 教材頁的導覽：
 * 1. 一次只顯示一個單元（build_notes.py 把每個 ## 標題包成 <section class="unit">）。
 *    網址的 #錨點決定顯示哪個單元，行程表和錯題清單的連結都照常能跳。
 *    沒有錨點時，回到上次看的單元。
 * 2. 手機上目錄收在側邊抽屜，右下角的「目錄」按鈕隨時打開。
 * 3. 右下角「回到最上面」「到最下面」按鈕。
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

  /* ---------- 手機的目錄抽屜 ---------- */
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
  function setDrawer(open) {
    body.classList.toggle("toc-open", open);
    fab.querySelector(".fab-toc").setAttribute("aria-expanded", String(open));
    if (open && aside) {
      var cur = aside.querySelector("a.cur");
      if (cur) cur.scrollIntoView({ block: "center" });
    }
  }

  /* ---------- 一次只顯示一個單元 ---------- */
  var secs = Array.prototype.slice.call(document.querySelectorAll("section.unit"));
  if (body.getAttribute("data-split") !== "1" || secs.length < 2) return;
  var KEY = "cgep:unit:" + slug;
  var tocLinks = aside ? Array.prototype.slice.call(aside.querySelectorAll(".toc a")) : [];
  var title = function (s) { var h = s.querySelector("h2"); return h ? h.textContent.trim() : ""; };

  // 每個單元最後加「上一單元／下一單元」
  secs.forEach(function (s, i) {
    var prev = secs[i - 1], next = secs[i + 1];
    var nav = document.createElement("nav");
    nav.className = "pager";
    nav.setAttribute("aria-label", "換單元");
    nav.innerHTML =
      (prev ? '<a class="pg-prev" href="#' + esc(prev.dataset.unit) + '">' + I("prev") + "<span><small>上一單元</small>" + esc(title(prev)) + "</span></a>" : "<span></span>") +
      (next ? '<a class="pg-next" href="#' + esc(next.dataset.unit) + '"><span><small>下一單元</small>' + esc(title(next)) + "</span>" + I("next") + "</a>" : "<span></span>");
    s.appendChild(nav);
  });

  var current = null;
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
    if (!scroll) return;
    var t = scrollTarget(sec, target);
    if (t) t.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
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
    if (first) pending = { sec: sec, t: t };
  }
  // 第一次開頁面時：瀏覽器在載入完成後會自己再捲到錨點一次，數學式排版完高度也會變，
  // 所以在這兩個時間點各再對準一次（使用者已經自己捲動就不動）
  var pending = null, touched = false;
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true });
  });
  function realign() {
    if (!pending || touched || current !== pending.sec) return;
    var st = scrollTarget(pending.sec, pending.t);
    if (st) st.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
  }
  window.addEventListener("load", function () { setTimeout(realign, 0); });
  document.addEventListener("cgep:mathjax", realign);
  window.addEventListener("hashchange", function () { route(false); });
  // 點到跟現在一樣的 #錨點時，瀏覽器不會觸發 hashchange，自己處理
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); route(false); }
  });
  route(true);
})();
