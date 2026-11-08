/* 快速平滑捲動（首頁和教材頁共用）。
 * 到最上面／最下面不管多遠，都在 0.35–0.65 秒內滑過去：不會瞬間跳過去，也不會慢慢捲很久。
 * 用法：CGEP_GLIDE(0) 或 CGEP_GLIDE(function () { return 目標位置; })（目標會變的時候，例如頁面還在長高）。
 * 滑動中使用者自己碰螢幕、滾輪或按鍵，就停下來交給使用者。 */
window.CGEP_GLIDE = (function () {
  "use strict";
  var raf = 0, off = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EVS = ["wheel", "touchstart", "keydown", "mousedown"];
  function jump(y) { window.scrollTo({ top: y, behavior: "instant" }); }
  function cancel() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (off) { off(); off = null; }
  }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  return function (target) {
    cancel();
    var get = typeof target === "function" ? target : function () { return target; };
    var y0 = window.scrollY, dist = Math.abs(get() - y0), vh = window.innerHeight || 800;
    if (reduce || dist < 2) { jump(get()); return; }
    var dur = Math.min(650, 260 + 90 * Math.log(1 + dist / vh) / Math.LN2);
    var t0 = 0;
    var stop = function () { cancel(); };
    EVS.forEach(function (ev) { window.addEventListener(ev, stop, { passive: true, capture: true }); });
    off = function () { EVS.forEach(function (ev) { window.removeEventListener(ev, stop, { passive: true, capture: true }); }); };
    raf = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      jump(y0 + (get() - y0) * ease(p));
      if (p < 1) raf = requestAnimationFrame(step); else { raf = 0; if (off) { off(); off = null; } }
    });
  };
})();
