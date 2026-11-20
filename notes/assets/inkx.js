/* 手寫板的附加功能，給 ink.js 用：
 * - fitShape、shapePoints：筆停住時認出畫的是直線、圓、橢圓、三角形、矩形還是多邊形，換成標準的圖形
 * - mdToHtml：把 .md 筆記轉成 HTML（標題、清單、表格、程式碼、引用、數學式）；原文裡的 HTML 一律當成文字顯示
 * - renderCard：把 .md 排版成一張卡片圖（數學式用網頁上的 MathJax 排），手寫板把它畫在紙上
 * - prepImage：插入的圖片縮到最長邊 1600 px、壓成 JPEG 或 PNG，再用內容算出 id（同一張圖只存一份）
 */
window.CGEP_INKX = (function () {
  "use strict";
  var hyp = Math.hypot;
  var DEG = Math.PI / 180;

  /* ====================== 圖形辨識 ====================== */
  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = 0;
    if (L > 0) t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    return hyp(ax + t * dx - px, ay + t * dy - py);
  }
  // 沿著路徑等距取 N 個點（closed：最後一點接回第一點也算一段）
  function resample(xs, ys, N, closed) {
    var n = xs.length, m = closed ? n : n - 1, segs = [], L = 0, i;
    for (i = 0; i < m; i++) { var j = (i + 1) % n, d = hyp(xs[j] - xs[i], ys[j] - ys[i]); segs.push(d); L += d; }
    var rx = [], ry = [], k = 0, acc = 0;
    for (var q = 0; q < N; q++) {
      var target = q * L / N;
      while (k < m - 1 && acc + segs[k] < target) { acc += segs[k]; k++; }
      var f = segs[k] > 0 ? Math.max(0, Math.min(1, (target - acc) / segs[k])) : 0, k2 = (k + 1) % n;
      rx.push(xs[k] + (xs[k2] - xs[k]) * f); ry.push(ys[k] + (ys[k2] - ys[k]) * f);
    }
    return { x: rx, y: ry, L: L };
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  // 橢圓：主軸方向用共變異數算，長短半軸用兩個方向上的範圍；誤差是每一點「離橢圓多遠」的相對值
  function fitEllipse(R) {
    var n = R.x.length, cx = mean(R.x), cy = mean(R.y), sxx = 0, syy = 0, sxy = 0, i;
    for (i = 0; i < n; i++) { var dx = R.x[i] - cx, dy = R.y[i] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(th), s = Math.sin(th);
    var us = [], vs = [];
    for (i = 0; i < n; i++) { var ex = R.x[i] - cx, ey = R.y[i] - cy; us.push(ex * c + ey * s); vs.push(-ex * s + ey * c); }
    var u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us), v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs);
    var a = (u1 - u0) / 2, b = (v1 - v0) / 2, cu = (u1 + u0) / 2, cv = (v1 + v0) / 2;
    if (a < 1e-6 || b < 1e-6) return { err: Infinity };
    var err = 0;
    for (i = 0; i < n; i++) { var uu = (us[i] - cu) / a, vv = (vs[i] - cv) / b; err += Math.abs(Math.sqrt(uu * uu + vv * vv) - 1); }
    return { cx: cx + cu * c - cv * s, cy: cy + cu * s + cv * c, a: a, b: b, rot: th, err: err / n };
  }
  // Douglas–Peucker：只留下離「頭尾連線」夠遠的轉折點
  function rdpChain(R, chain, eps, keep) {
    var a = chain[0], b = chain[chain.length - 1], best = -1, bi = -1;
    for (var t = 1; t < chain.length - 1; t++) {
      var d = distSeg(R.x[chain[t]], R.y[chain[t]], R.x[a], R.y[a], R.x[b], R.y[b]);
      if (d > best) { best = d; bi = t; }
    }
    if (best > eps) { rdpChain(R, chain.slice(0, bi + 1), eps, keep); keep.push(chain[bi]); rdpChain(R, chain.slice(bi), eps, keep); }
  }
  function turn(A, B, C) {
    var ux = B[0] - A[0], uy = B[1] - A[1], vx = C[0] - B[0], vy = C[1] - B[1];
    return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  }
  function fitLine(R, idx) {
    var xs = idx.map(function (j) { return R.x[j]; }), ys = idx.map(function (j) { return R.y[j]; });
    var cx = mean(xs), cy = mean(ys), sxx = 0, syy = 0, sxy = 0;
    for (var i = 0; i < xs.length; i++) { var dx = xs[i] - cx, dy = ys[i] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    return { x: cx, y: cy, dx: Math.cos(th), dy: Math.sin(th) };
  }
  function intersect(A, B) {
    var den = A.dx * B.dy - A.dy * B.dx;
    if (Math.abs(den) < 0.05) return null;            // 幾乎平行
    var t = ((B.x - A.x) * B.dy - (B.y - A.y) * B.dx) / den;
    return [A.x + t * A.dx, A.y + t * A.dy];
  }
  // 多邊形：在封閉的路徑上找轉角，每條邊各自擬合成直線，相鄰兩條的交點就是新的頂點
  function fitPolygon(R, cx, cy) {
    var n = R.x.length, i, i0 = 0, i1 = 0, d0 = -1, d1 = -1;
    for (i = 0; i < n; i++) { var d = hyp(R.x[i] - cx, R.y[i] - cy); if (d > d0) { d0 = d; i0 = i; } }
    for (i = 0; i < n; i++) { var dd = hyp(R.x[i] - R.x[i0], R.y[i] - R.y[i0]); if (dd > d1) { d1 = dd; i1 = i; } }
    var c1 = [], c2 = [];
    for (i = i0; ; i = (i + 1) % n) { c1.push(i); if (i === i1) break; }
    for (i = i1; ; i = (i + 1) % n) { c2.push(i); if (i === i0) break; }
    var keep = [i0];
    rdpChain(R, c1, 0.04 * R.L, keep); keep.push(i1); rdpChain(R, c2, 0.04 * R.L, keep);
    var V = keep.map(function (j) { return [R.x[j], R.y[j], j]; });
    // 轉不到 28° 的不算轉角；離前一個轉角太近的也拿掉
    for (var again = true; again && V.length > 3;) {
      again = false;
      for (i = 0; i < V.length; i++) {
        var A = V[(i + V.length - 1) % V.length], B = V[i], C = V[(i + 1) % V.length];
        if (Math.abs(turn(A, B, C)) < 28 * DEG || hyp(B[0] - A[0], B[1] - A[1]) < 0.06 * R.L) { V.splice(i, 1); again = true; break; }
      }
    }
    var nv = V.length;
    if (nv < 3 || nv > 6) return { n: nv, err: Infinity };
    var lines = [];
    for (i = 0; i < nv; i++) {
      var s0 = V[i][2], s1 = V[(i + 1) % nv][2], idx = [];
      for (var j = s0; j !== s1; j = (j + 1) % n) idx.push(j);
      idx.push(s1);
      var cut = Math.floor(idx.length * 0.15), mid = idx.slice(cut, idx.length - cut);
      lines.push(fitLine(R, mid.length >= 2 ? mid : idx));
    }
    var P = [];
    for (i = 0; i < nv; i++) {
      var X = intersect(lines[(i + nv - 1) % nv], lines[i]);
      if (!X || hyp(X[0] - V[i][0], X[1] - V[i][1]) > 0.15 * R.L) X = [V[i][0], V[i][1]];
      P.push(X);
    }
    var err = 0, rad = 0;
    for (i = 0; i < n; i++) {
      var best = Infinity;
      for (var e = 0; e < nv; e++) { var Q = P[e], Q2 = P[(e + 1) % nv]; best = Math.min(best, distSeg(R.x[i], R.y[i], Q[0], Q[1], Q2[0], Q2[1])); }
      err += best; rad += hyp(R.x[i] - cx, R.y[i] - cy);
    }
    return { n: nv, pts: P, err: rad > 0 ? err / rad : Infinity };
  }
  function cornerAngle(P, i) {
    var n = P.length, A = P[(i + n - 1) % n], B = P[i], C = P[(i + 1) % n];
    var ux = A[0] - B[0], uy = A[1] - B[1], vx = C[0] - B[0], vy = C[1] - B[1];
    return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (hyp(ux, uy) * hyp(vx, vy) || 1))));
  }
  function rotate(P, cx, cy, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return P.map(function (q) { var x = q[0] - cx, y = q[1] - cy; return [cx + x * c - y * s, cy + x * s + y * c]; });
  }
  // 四個角都接近直角就是矩形（邊長差不多就是正方形）；其他多邊形把接近水平、垂直的邊拉正
  function regularize(poly) {
    var P = poly.pts, n = P.length, i;
    if (n === 4) {
      var right = true;
      for (i = 0; i < 4; i++) if (Math.abs(cornerAngle(P, i) - 90 * DEG) > 16 * DEG) right = false;
      if (right) {
        var bestL = -1, ang = 0;
        for (i = 0; i < 4; i++) {
          var Q = P[(i + 1) % 4], L = hyp(Q[0] - P[i][0], Q[1] - P[i][1]);
          if (L > bestL) { bestL = L; ang = Math.atan2(Q[1] - P[i][1], Q[0] - P[i][0]); }
        }
        ang = ang - Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);   // 化成 -45°～45°
        if (Math.abs(ang) < 8 * DEG) ang = 0;
        var cx = mean(P.map(function (q) { return q[0]; })), cy = mean(P.map(function (q) { return q[1]; }));
        var U = rotate(P, cx, cy, -ang);
        var x0 = Math.min.apply(null, U.map(function (q) { return q[0]; })), x1 = Math.max.apply(null, U.map(function (q) { return q[0]; }));
        var y0 = Math.min.apply(null, U.map(function (q) { return q[1]; })), y1 = Math.max.apply(null, U.map(function (q) { return q[1]; }));
        var w = x1 - x0, h = y1 - y0, sq = Math.abs(w - h) <= 0.1 * Math.max(w, h);
        if (sq) { var m = (w + h) / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2; x0 = mx - m / 2; x1 = mx + m / 2; y0 = my - m / 2; y1 = my + m / 2; }
        return { kind: "poly", name: sq ? "square" : "rectangle", pts: rotate([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], cx, cy, ang) };
      }
    }
    P = P.map(function (q) { return q.slice(); });
    for (i = 0; i < n; i++) {
      var A = P[i], B = P[(i + 1) % n], a = Math.atan2(B[1] - A[1], B[0] - A[0]) / DEG, r = ((a % 180) + 180) % 180;
      if (r < 5 || r > 175) { var yy = (A[1] + B[1]) / 2; A[1] = B[1] = yy; }
      else if (Math.abs(r - 90) < 5) { var xx = (A[0] + B[0]) / 2; A[0] = B[0] = xx; }
    }
    return { kind: "poly", name: n === 3 ? "triangle" : n === 4 ? "quad" : n === 5 ? "pentagon" : "hexagon", pts: P };
  }

  /* fitShape(p, m, k)：p 是筆畫的點 [x, y, 壓力, ...]，只看前 m 個點；k 是紙上 1 單位在螢幕上幾個像素。
   * 回傳 null（不是圖形）、{ kind: "line" }、{ kind: "ellipse", name: "circle"|"ellipse", cx, cy, a, b, rot }
   * 或 { kind: "poly", name, pts: [[x, y], ...] } */
  function fitShape(p, m, k) {
    var xs = [], ys = [], i;
    for (i = 0; i < m; i++) { xs.push(p[3 * i]); ys.push(p[3 * i + 1]); }
    var n = xs.length;
    if (n < 2) return null;
    var len = 0;
    for (i = 1; i < n; i++) len += hyp(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    var C = hyp(xs[n - 1] - xs[0], ys[n - 1] - ys[0]);
    // 直線：路徑沒有比頭尾連線長多少，每一點也都離那條線不遠
    if (C * k >= 16) {
      var dev = 0;
      for (i = 0; i < n; i++) dev = Math.max(dev, distSeg(xs[i], ys[i], xs[0], ys[0], xs[n - 1], ys[n - 1]));
      if (len <= C * 1.2 && dev <= C * 0.15 + 4 / k) return { kind: "line" };
    }
    // 封閉的圖形要夠大（寫字的 o、口 不會被換掉）
    var w = Math.max.apply(null, xs) - Math.min.apply(null, xs), h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    var big = Math.max(w, h), small = Math.min(w, h);
    if (n < 8 || big * k < 44 || small * k < 14 || len * k < 120) return null;
    // 終點要回到起點附近；畫過頭的那一段剪掉
    var tol = Math.max(0.22 * big, 14 / k), cut = -1, best = Infinity;
    for (i = Math.floor(n * 0.55); i < n; i++) { var d = hyp(xs[i] - xs[0], ys[i] - ys[0]); if (d < best) { best = d; cut = i; } }
    if (best > tol) return null;
    xs = xs.slice(0, cut + 1); ys = ys.slice(0, cut + 1);
    var R = resample(xs, ys, 72, true);
    if (R.L * k < 120) return null;
    // 只繞一圈、沒有交叉（像 8 字、繞兩圈的螺旋都不算）：沿路轉過的角度加起來要接近 360°
    var tot = 0, nR = R.x.length;
    for (i = 0; i < nR; i++) tot += turn([R.x[(i + nR - 1) % nR], R.y[(i + nR - 1) % nR]], [R.x[i], R.y[i]], [R.x[(i + 1) % nR], R.y[(i + 1) % nR]]);
    if (Math.abs(Math.abs(tot) - 2 * Math.PI) > 0.6 * Math.PI) return null;
    var el = fitEllipse(R), pg = el.err < Infinity ? fitPolygon(R, mean(R.x), mean(R.y)) : { err: Infinity };
    var shape = null;
    if (el.err < 0.075) shape = "ellipse";
    else if (pg.n >= 3 && pg.n <= 6 && pg.err < 0.06) shape = "poly";
    else if (el.err < 0.1) shape = "ellipse";
    if (shape === "poly") return regularize(pg);
    if (shape !== "ellipse") return null;
    var a = el.a, b = el.b, rot = el.rot;
    if (b > a) { var t = a; a = b; b = t; rot += Math.PI / 2; }
    if (b / a >= 0.85) return { kind: "ellipse", name: "circle", cx: el.cx, cy: el.cy, a: (a + b) / 2, b: (a + b) / 2, rot: 0 };
    rot = rot - Math.round(rot / Math.PI) * Math.PI;                       // -90°～90°
    if (Math.abs(rot) < 10 * DEG) rot = 0;
    else if (Math.abs(Math.abs(rot) - 90 * DEG) < 10 * DEG) rot = 90 * DEG;
    return { kind: "ellipse", name: "ellipse", cx: el.cx, cy: el.cy, a: a, b: b, rot: rot };
  }
  // 圖形換成一串點（約每 step 單位一點，封閉圖形最後回到起點）；轉角一定是其中一點，角才會尖
  function shapePoints(f, step) {
    var out = [], i;
    if (f.kind === "ellipse") {
      var a = f.a, b = f.b, per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      var N = Math.max(24, Math.min(240, Math.round(per / step))), c = Math.cos(f.rot), s = Math.sin(f.rot);
      for (i = 0; i <= N; i++) {
        var t = 2 * Math.PI * i / N, x = a * Math.cos(t), y = b * Math.sin(t);
        out.push(f.cx + x * c - y * s, f.cy + x * s + y * c);
      }
      return out;
    }
    var P = f.pts, n = P.length;
    for (i = 0; i < n; i++) {
      var A = P[i], B = P[(i + 1) % n], L = hyp(B[0] - A[0], B[1] - A[1]), k = Math.max(1, Math.round(L / step));
      for (var j = 0; j < k; j++) out.push(A[0] + (B[0] - A[0]) * j / k, A[1] + (B[1] - A[1]) * j / k);
    }
    out.push(P[0][0], P[0][1]);
    return out;
  }
  var SHAPE_NAME = { circle: "圓形", ellipse: "橢圓", triangle: "三角形", rectangle: "長方形", square: "正方形", quad: "四邊形", pentagon: "五邊形", hexagon: "六邊形" };

  /* ====================== .md 轉 HTML ====================== */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function mathSpan(tex, display) {
    return display ? '<div class="arithmatex">\\[' + esc(tex) + "\\]</div>" : '<span class="arithmatex">\\(' + esc(tex) + "\\)</span>";
  }
  // 行內：程式碼、數學式先收起來（裡面的 * _ 不能被當成粗體），其他文字跳脫後再處理粗體、斜體、連結
  function inline(s) {
    var kept = [];
    function keep(html) { kept.push(html); return "\u0001" + (kept.length - 1) + "\u0002"; }
    s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, function (m, t, c) { return keep("<code>" + esc(c.replace(/^ (.*) $/, "$1")) + "</code>"); });
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, function (m, c) { return keep(mathSpan(c, false)); });
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, function (m, c) { return keep(mathSpan(c, false)); });
    s = s.replace(/(^|[^\\$])\$(?=\S)([^$\n]*?\S)\$(?!\d)/g, function (m, pre, c) { return pre + keep(mathSpan(c, false)); });
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|~$>])/g, function (m, c) { return keep(esc(c)); });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\([^)\s]*(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, alt) { return '<span class="md-img">［圖片' + (alt ? "：" + alt : "") + "］</span>"; });
    s = s.replace(/\[([^\]]+)\]\([^)\s]*(?:\s+&quot;[^&]*&quot;)?\)/g, '<span class="md-a">$1</span>');
    s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>").replace(/__(?=\S)([\s\S]*?\S)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*(?=[^\s*])([^*]*?[^\s*])\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^\w])_(?=[^\s_])([^_]*?[^\s_])_(?![\w])/g, "$1<em>$2</em>");
    s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");
    s = s.replace(/==(?=\S)([\s\S]*?\S)==/g, "<mark>$1</mark>");
    for (var g = 0; g < 3 && /\u0001\d+\u0002/.test(s); g++) s = s.replace(/\u0001(\d+)\u0002/g, function (m, i) { return kept[+i]; });
    return s;
  }
  function indentOf(l) { return /^ */.exec(l)[0].length; }
  var LIST = /^( *)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
  var FENCE = /^ *(`{3,}|~{3,})/;
  function splitRow(row) {
    row = row.trim();
    if (row[0] === "|") row = row.slice(1);
    if (row[row.length - 1] === "|" && row[row.length - 2] !== "\\") row = row.slice(0, -1);
    var cells = [], cur = "", code = false;
    for (var i = 0; i < row.length; i++) {
      var ch = row[i];
      if (ch === "\\" && row[i + 1] === "|") { cur += "|"; i++; continue; }
      if (ch === "`") code = !code;
      if (ch === "|" && !code) { cells.push(cur.trim()); cur = ""; } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }
  function isBlockStart(l) {
    return /^ {0,3}#{1,6}\s/.test(l) || FENCE.test(l) || /^ {0,3}>/.test(l) || LIST.test(l) || /^ *(\$\$|\\\[)/.test(l) ||
      /^ {0,3}([-*_])( *\1){2,} *$/.test(l);
  }
  function blocks(lines) {
    var out = [], i = 0, m;
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*$/.test(l)) { i++; continue; }
      if ((m = FENCE.exec(l))) {
        var fence = m[1], body = [];
        for (i++; i < lines.length && !(new RegExp("^ *" + fence[0] + "{" + fence.length + ",} *$")).test(lines[i]); i++) body.push(lines[i]);
        i++;
        out.push("<pre><code>" + esc(body.join("\n")) + "</code></pre>");
        continue;
      }
      if (/^ *(\$\$|\\\[)/.test(l)) {
        // 獨立一行的公式；結尾 $$ 後面同一行還有字的話，那些字照常排成下一段（不能丟掉）
        var open = /^ *\$\$/.test(l) ? "$$" : "\\[", close = open === "$$" ? "$$" : "\\]";
        var rest = l.trim().slice(2), tex = [], after = "", at = rest.indexOf(close);
        if (at >= 0) { tex.push(rest.slice(0, at)); after = rest.slice(at + 2); }
        else {
          tex.push(rest);
          for (i++; i < lines.length && lines[i].indexOf(close) < 0; i++) tex.push(lines[i]);
          if (i < lines.length) { at = lines[i].indexOf(close); tex.push(lines[i].slice(0, at)); after = lines[i].slice(at + 2); }
        }
        out.push(mathSpan(tex.join("\n").trim(), true));
        if (after.trim()) lines[i] = after.trim();
        else i++;
        continue;
      }
      if ((m = /^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/.exec(l))) { var hn = m[1].length; out.push("<h" + hn + ">" + inline(m[2]) + "</h" + hn + ">"); i++; continue; }
      if (/^ {0,3}([-*_])( *\1){2,} *$/.test(l)) { out.push("<hr>"); i++; continue; }
      if (l.indexOf("|") >= 0 && i + 1 < lines.length && /^ *\|? *:?-{1,}:? *(\| *:?-{1,}:? *)*\|? *$/.test(lines[i + 1]) && lines[i + 1].indexOf("-") >= 0) {
        var head = splitRow(l), al = splitRow(lines[i + 1]).map(function (c) { return /^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : ""; });
        var th = head.map(function (c, j) { return "<th" + (al[j] ? ' style="text-align:' + al[j] + '"' : "") + ">" + inline(c) + "</th>"; }).join("");
        var rows = [];
        for (i += 2; i < lines.length && lines[i].indexOf("|") >= 0 && !/^\s*$/.test(lines[i]); i++) {
          var cs = splitRow(lines[i]);
          rows.push("<tr>" + head.map(function (x, j) { return "<td" + (al[j] ? ' style="text-align:' + al[j] + '"' : "") + ">" + inline(cs[j] || "") + "</td>"; }).join("") + "</tr>");
        }
        out.push("<table><thead><tr>" + th + "</tr></thead><tbody>" + rows.join("") + "</tbody></table>");
        continue;
      }
      if (/^ {0,3}>/.test(l)) {
        var q = [];
        for (; i < lines.length && /^ {0,3}>/.test(lines[i]); i++) q.push(lines[i].replace(/^ {0,3}> ?/, ""));
        out.push("<blockquote>" + blocks(q) + "</blockquote>");
        continue;
      }
      if ((m = LIST.exec(l))) { i = list(lines, i, out); continue; }
      var para = [];
      for (; i < lines.length && !/^\s*$/.test(lines[i]) && (!para.length || !isBlockStart(lines[i])); i++) para.push(lines[i].trim());
      out.push("<p>" + para.map(inline).join("<br>") + "</p>");
    }
    return out.join("");
  }
  // 清單：同一層的項目縮排一樣；縮排比較多的行屬於上一個項目（內容或下一層清單）
  function list(lines, i, out) {
    var m = LIST.exec(lines[i]), base = m[1].length, ordered = /\d/.test(m[2]), start = ordered ? parseInt(m[2], 10) : 1;
    var items = [];
    while (i < lines.length && (m = LIST.exec(lines[i])) && m[1].length === base && /\d/.test(m[2]) === ordered) {
      var body = [m[3]], inner = base + m[2].length + 1;
      for (i++; i < lines.length; i++) {
        var L = lines[i];
        if (/^\s*$/.test(L)) {
          var j = i + 1;
          while (j < lines.length && /^\s*$/.test(lines[j])) j++;
          if (j < lines.length && indentOf(lines[j]) > base) { body.push(""); continue; }
          break;
        }
        if (indentOf(L) > base) { body.push(L.slice(Math.min(indentOf(L), inner))); continue; }
        if (!isBlockStart(L) && body[body.length - 1] !== "") { body.push(L.trim()); continue; }   // 沒有縮排的續行
        break;
      }
      items.push(body);
    }
    var tag = ordered ? "ol" : "ul";
    out.push("<" + tag + (ordered && start !== 1 ? ' start="' + start + '"' : "") + ">" + items.map(function (body) {
      var first = body[0], cb = /^\[([ xX])\]\s+/.exec(first);
      if (cb) first = first.slice(cb[0].length);
      var html = blocks([first].concat(body.slice(1)));
      html = html.replace(/^<p>([\s\S]*?)<\/p>/, "$1");                                         // 第一段不要多一層段落的空白
      return "<li" + (cb ? ' class="md-task"' : "") + ">" + (cb ? '<span class="md-cb' + (cb[1] !== " " ? " on" : "") + '"></span>' : "") + html + "</li>";
    }).join("") + "</" + tag + ">");
    return i;
  }
  function mdToHtml(src) {
    var lines = String(src).replace(/^﻿/, "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
    // 開頭的 YAML 設定（--- 包起來、裡面都是「名稱: 值」）不顯示。
    // 只是拿 --- 當分隔線的話（裡面有一般文字），照常顯示，不能把第一節吃掉
    if (/^---\s*$/.test(lines[0])) {
      for (var e = 1; e < lines.length && e < 80; e++) {
        if (/^(---|\.\.\.)\s*$/.test(lines[e])) {
          var meta = lines.slice(1, e), keys = meta.filter(function (x) { return /^[\wÀ-￿-]+\s*:/.test(x); });
          var yaml = keys.length && meta.every(function (x) { return /^\s*$/.test(x) || /^\s*#/.test(x) || /^[\wÀ-￿-]+\s*:/.test(x) || /^\s+\S/.test(x) || /^\s*-\s/.test(x); });
          if (yaml) lines = lines.slice(e + 1);
          break;
        }
      }
    }
    return blocks(lines);
  }

  /* ====================== .md 卡片：排版後畫成一張圖 ====================== */
  var MD_W = 940, MD_FONT = 34;
  var FONT = "system-ui,-apple-system,'Segoe UI',Roboto,'PingFang TC','Microsoft JhengHei','Noto Sans CJK TC',sans-serif";
  var MONO = "ui-monospace,'SFMono-Regular',Menlo,Consolas,'Noto Sans Mono','Liberation Mono',monospace";
  function cardCss(dark) {
    var c = dark ? { bg: "#1c2330", fg: "#e7eaf0", mute: "#9aa4b5", line: "#3a4558", soft: "#262f3f", acc: "#ff8f95", mark: "rgba(255,212,59,.35)" }
                 : { bg: "#fffdf7", fg: "#1a2130", mute: "#5f6878", line: "#dcd4bf", soft: "#f2eee2", acc: "#c42f3d", mark: "rgba(255,212,59,.55)" };
    return ".mdc{box-sizing:border-box;width:" + MD_W + "px;margin:0;padding:34px 42px 30px;background:" + c.bg + ";color:" + c.fg + ";border:3px solid " + c.line +
      ";border-radius:20px;font:" + MD_FONT + "px/1.62 " + FONT + ";overflow-wrap:anywhere;word-break:normal;text-align:left}" +
      ".mdc *{box-sizing:border-box}" +
      ".mdc .mdc-name{margin:-8px 0 16px;padding-bottom:8px;border-bottom:2px solid " + c.line + ";font-size:22px;line-height:1.4;color:" + c.mute + "}" +
      ".mdc h1,.mdc h2,.mdc h3,.mdc h4,.mdc h5,.mdc h6{margin:.9em 0 .4em;line-height:1.3;font-weight:700}" +
      ".mdc h1{font-size:1.55em}.mdc h2{font-size:1.35em}.mdc h3{font-size:1.18em}.mdc h4,.mdc h5,.mdc h6{font-size:1.05em}" +
      ".mdc>:first-child,.mdc .mdc-name+*{margin-top:0}" +
      ".mdc p{margin:0 0 .6em}.mdc ul,.mdc ol{margin:0 0 .6em;padding-left:1.35em}.mdc li{margin:.12em 0}.mdc li>ul,.mdc li>ol{margin:.1em 0 .2em}" +
      ".mdc li.md-task{list-style:none;margin-left:-1.1em}" +
      ".mdc .md-cb{display:inline-block;width:.8em;height:.8em;margin:0 .35em -.05em 0;border:3px solid " + c.mute + ";border-radius:5px}" +
      ".mdc .md-cb.on{background:" + c.mute + "}" +
      ".mdc blockquote{margin:0 0 .6em;padding:.15em 0 .15em .8em;border-left:7px solid " + c.line + ";color:" + c.mute + "}" +
      ".mdc code{font:.86em/1.4 " + MONO + ";background:" + c.soft + ";padding:.06em .3em;border-radius:6px}" +
      ".mdc pre{margin:0 0 .7em;padding:16px 20px;background:" + c.soft + ";border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere}" +
      ".mdc pre code{background:none;padding:0;font-size:.84em;line-height:1.5}" +
      ".mdc table{border-collapse:collapse;margin:0 0 .7em;font-size:.92em}" +
      ".mdc th,.mdc td{border:2px solid " + c.line + ";padding:.25em .6em;vertical-align:top}.mdc th{background:" + c.soft + ";font-weight:700}" +
      ".mdc hr{border:0;border-top:3px solid " + c.line + ";margin:.9em 0}" +
      ".mdc strong{font-weight:700}.mdc del{opacity:.7}.mdc mark{background:" + c.mark + ";color:inherit;padding:0 .1em}" +
      ".mdc .md-a{color:" + c.acc + ";text-decoration:underline;text-underline-offset:.15em}.mdc .md-img{color:" + c.mute + "}" +
      ".mdc mjx-container{color:inherit}.mdc mjx-container svg{overflow:visible}" +
      '.mdc mjx-container[display="true"]{display:block;text-align:center;margin:.5em 0;max-width:100%}' +
      '.mdc mjx-container[display="true"] svg{max-width:100%}';
  }
  function mathJaxReady() {
    var MJ = window.MathJax;
    if (MJ && MJ.typesetPromise && MJ.startup && MJ.startup.promise) return MJ.startup.promise;
    return Promise.reject(new Error("MathJax 還沒載入"));
  }
  // 量高度用的獨立小頁面：網站自己的樣式（例如程式碼區塊比較小的字）不會套進去，
  // 跟卡片畫成圖時的環境一樣，量出來的高度才不會比圖短（以前就是這樣把卡片下面切掉的）
  var isoReady = null;
  function isoDoc() {
    if (isoReady) return isoReady;
    var fr = document.createElement("iframe");
    fr.setAttribute("aria-hidden", "true");
    fr.tabIndex = -1;
    fr.style.cssText = "position:absolute;left:-30000px;top:0;width:" + (MD_W + 60) + "px;height:200px;border:0;visibility:hidden;pointer-events:none";
    isoReady = new Promise(function (res, rej) {
      fr.onload = function () { res(fr.contentDocument); };
      fr.onerror = rej;
    });
    fr.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
      "<style>html,body{margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none}</style></head><body></body></html>";
    document.body.appendChild(fr);
    return isoReady;
  }
  // MathJax 自己的樣式（換行、顯示公式的排法）也放進卡片，圖裡的公式才會跟網頁上排得一樣
  function mathCss() {
    return ["MJX-SVG-styles", "MJX-lb-styles", "MJX-hb-styles", "MJX-ab-styles"].map(function (id) {
      var s = document.getElementById(id);
      return s ? s.textContent : "";
    }).join("\n");
  }
  // 排版：數學式先在網頁裡排好（MathJax 在這裡），整張卡片複製一份（連同用到的公式字形），
  // 在獨立小頁面量高度，再轉成 XHTML 字串。之後要畫哪一段都用這份（drawCard）
  function layoutCard(md, name, dark) {
    var box = document.createElement("div");
    box.className = "mdc";
    box.innerHTML = '<style>' + cardCss(dark) + "</style>" + (name ? '<div class="mdc-name">' + esc(name) + "</div>" : "") + mdToHtml(md);
    box.style.cssText = "position:absolute;left:-30000px;top:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(box);
    var hasMath = !!box.querySelector(".arithmatex");
    var job = hasMath ? mathJaxReady().then(function () { return window.MathJax.typesetPromise([box]); }) : Promise.resolve();
    return job.then(function () {
      var copy = box.cloneNode(true);
      copy.removeAttribute("style");
      var ids = {}, defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      copy.querySelectorAll("use").forEach(function (u) {
        var href = u.getAttribute("href") || u.getAttribute("xlink:href") || "";
        if (href[0] === "#" && !ids[href]) { ids[href] = 1; var g = document.getElementById(href.slice(1)); if (g) defs.appendChild(g.cloneNode(true)); }
      });
      if (defs.childNodes.length) {
        var holder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        holder.setAttribute("width", "0"); holder.setAttribute("height", "0");
        holder.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
        holder.appendChild(defs);
        copy.insertBefore(holder, copy.firstChild);
      }
      if (hasMath) { var st = copy.querySelector("style"); st.textContent = mathCss() + "\n" + st.textContent; }
      return isoDoc().then(function (d) {
        var el = d.importNode(copy, true);
        d.body.appendChild(el);
        var lh = Math.ceil(el.getBoundingClientRect().height) + 2;
        el.remove();
        var xhtml = new XMLSerializer().serializeToString(copy);
        return { lh: lh, enc: encodeURIComponent(xhtml) };
      });
    }).then(function (r) { box.remove(); return r; }, function (e) { box.remove(); throw e; });
  }
  // 畫出卡片的一段：卡片座標 y0 開始、高 h（單位跟 MD_W 一樣），每單位 f 個像素。
  // 整份照常排版，再用 transform 把內容往上推到這一段，外框只有這一段高。
  // （不用 SVG viewBox 往下移：卡片裡有數學式時，Chrome 會把位置算歪幾十個像素，段與段接不起來）
  // 暖身：Chrome 閒置一下（幾十毫秒）之後畫的第一批圖，字型還沒備好，會用別的字型排（換行不同），
  // 段與段就接不起來；剛畫完一張接著畫就正常。所以閒置後要畫之前，先畫一張很小的圖丟掉，馬上再畫真的
  var lastDone = 0, drawing = 0, warming = null;
  function drawCard(lay, f, y0, h) {
    function go() {
      drawing++;
      return rawDraw(lay, f, y0, h).then(function (cv) { drawing--; lastDone = Date.now(); return cv; },
        function (e) { drawing--; lastDone = Date.now(); throw e; });
    }
    if (warming) return warming.then(go);
    if (!drawing && Date.now() - lastDone > 15) {
      warming = rawDraw(lay, 0.05, 0, Math.min(lay.lh, 2000)).then(function () {}, function () {})
        .then(function () { warming = null; lastDone = Date.now(); });
      return warming.then(go);
    }
    return go();
  }
  function rawDraw(lay, f, y0, h) {
    var W2 = Math.max(1, Math.round(MD_W * f)), H2 = Math.max(1, Math.round(h * f));
    var head = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W2 + '" height="' + H2 + '" viewBox="0 0 ' + MD_W + " " + h + '">' +
      '<foreignObject x="0" y="0" width="' + MD_W + '" height="' + h + '"><div xmlns="http://www.w3.org/1999/xhtml" style="transform:translateY(-' + y0 + 'px)">';
    var img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(head) + lay.enc + encodeURIComponent("</div></foreignObject></svg>");
    return img.decode().then(function () {
      var cv = document.createElement("canvas");
      cv.width = W2; cv.height = H2;
      cv.getContext("2d").drawImage(img, 0, 0, W2, H2);
      return cv;
    });
  }
  // 整張卡片畫成一張圖（存成圖片、測試用）
  function renderCard(md, name, dark, f) {
    return layoutCard(md, name, dark).then(function (lay) {
      return drawCard(lay, f, 0, lay.lh).then(function (cv) { return { cv: cv, lh: lay.lh }; });
    });
  }
  // 還沒排版前，用字數粗估卡片的高度（插入時先佔好位置）
  function guessCardH(md) {
    var lines = String(md).split("\n"), h = 110;
    lines.forEach(function (l) { h += Math.max(1, Math.ceil(l.length / 26)) * MD_FONT * 1.62; });
    return Math.round(h);
  }

  /* ====================== 圖片 ====================== */
  var IMG_MAX = 1600;
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return (b + 256).toString(16).slice(1); }).join(""); }
  function hashOf(str) {
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (b) { return hex(b).slice(0, 24); });
    } catch (e) {}
    var h1 = 0x811c9dc5, h2 = 0x1505;
    for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (Math.imul(h2, 33) + c) >>> 0; }
    return Promise.resolve(("0000000" + h1.toString(16)).slice(-8) + ("0000000" + h2.toString(16)).slice(-8));
  }
  function prepImage(blob) {
    var url = URL.createObjectURL(blob), im = new Image();
    im.src = url;
    return im.decode().then(function () {
      var w = im.naturalWidth, h = im.naturalHeight;
      if (!w || !h) throw new Error("empty image");
      var s = Math.min(1, IMG_MAX / Math.max(w, h)), cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
      var cv = document.createElement("canvas");
      cv.width = cw; cv.height = ch;
      var x = cv.getContext("2d");
      x.drawImage(im, 0, 0, cw, ch);
      var jpegIn = /jpe?g/i.test(blob.type), alpha = false;
      if (!jpegIn) {
        var d = x.getImageData(0, 0, cw, ch).data, stride = Math.max(4, Math.floor(d.length / 4 / 40000) * 4);
        for (var i = 3; i < d.length; i += stride) if (d[i] < 250) { alpha = true; break; }
      }
      var png = jpegIn ? "" : cv.toDataURL("image/png");
      var cj = document.createElement("canvas");
      cj.width = cw; cj.height = ch;
      var y = cj.getContext("2d");
      y.fillStyle = "#ffffff"; y.fillRect(0, 0, cw, ch); y.drawImage(cv, 0, 0);
      var jpg = cj.toDataURL("image/jpeg", 0.86);
      var out = (alpha && png.length < 3e6) ? png : (png && png.length <= jpg.length * 1.25 ? png : jpg);
      return hashOf(out).then(function (id) { return { url: out, w: cw, h: ch, id: id }; });
    }).then(function (r) { URL.revokeObjectURL(url); return r; }, function (e) { URL.revokeObjectURL(url); throw e; });
  }

  return { fitShape: fitShape, shapePoints: shapePoints, SHAPE_NAME: SHAPE_NAME, mdToHtml: mdToHtml, renderCard: renderCard,
    layoutCard: layoutCard, drawCard: drawCard, guessCardH: guessCardH, MD_W: MD_W, prepImage: prepImage };
})();
