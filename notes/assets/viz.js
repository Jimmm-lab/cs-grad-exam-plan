/* 資料結構動畫：在 Markdown 裡寫
 *   <div class="viz" data-viz="heap" data-nums="14,4,19,2,18,7,17,9,16,13"></div>
 * 就會出現一個可以一步一步播放、也可以改輸入資料的動畫。
 * data-* 屬性會蓋掉該動畫欄位的預設值（欄位名稱見下面每個 defs.xxx.fields）。
 *
 * 畫面是 SVG，每個方塊／節點都有固定的 key，換下一步時同一個 key 的元素會「移動」過去，
 * 所以交換、旋轉、放進桶子都看得到東西在動。
 */
(() => {
  "use strict";
  const hosts = document.querySelectorAll(".viz[data-viz]");
  if (!hosts.length) return;

  const NS = "http://www.w3.org/2000/svg";
  const I = window.CGEP_ICON || (() => "");
  const CAN_D = !!(window.CSS && CSS.supports && CSS.supports("d", 'path("M0 0")'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toks = s => String(s).split(/[\s,，、;；]+/).filter(Boolean);
  function nums(s, name, opt = {}) {
    const a = toks(s).map(Number);
    if (!a.length) throw new Error(`${name}是空的`);
    if (a.some(x => !Number.isFinite(x))) throw new Error(`${name}只能填數字，用逗號隔開`);
    if (opt.int && a.some(x => !Number.isInteger(x) || x < 0)) throw new Error(`${name}要填非負整數`);
    if (opt.max && a.length > opt.max) throw new Error(`${name}最多 ${opt.max} 個，畫面才放得下`);
    if (opt.unique && new Set(a).size !== a.length) throw new Error(`${name}不能有重複的數`);
    return a;
  }
  // 「ABCD」或「A,B,C,D」都可以
  const letters = s => (/[\s,，、]/.test(s.trim()) ? toks(s) : Array.from(s.trim()));
  const sum = a => a.reduce((x, y) => x + y, 0);

  /* ---------- 畫面元素 ---------- */
  const BW = 46, BH = 40, GAP = 6, STEP = BW + GAP;
  const box = (k, x, y, label, cls = "", o = {}) => ({ t: "box", k, x, y, w: o.w || BW, h: o.h || BH, label, cls, html: o.html, sub: o.sub });
  const node = (k, x, y, label, cls = "", note = "") => ({ t: "node", k, x, y, r: 19, label, cls, note });
  const edge = (k, x1, y1, x2, y2, cls = "") => ({ t: "edge", k, x1, y1, x2, y2, cls });
  const text = (k, x, y, s, cls = "", anchor = "middle", html) => ({ t: "text", k, x, y, s, cls, anchor, html });
  const zone = (k, x, y, w, h, cls = "", label = "") => ({ t: "zone", k, x, y, w, h, cls, label });

  function inner(it) {
    switch (it.t) {
      case "box":
        return `<rect width="${it.w}" height="${it.h}" rx="6"/><text x="${it.w / 2}" y="${it.h / 2}" dy=".35em" text-anchor="middle">${it.html || esc(it.label)}</text>` +
          (it.sub != null && it.sub !== "" ? `<text class="vz-sub" x="${it.w / 2}" y="${it.h + 16}" text-anchor="middle">${esc(it.sub)}</text>` : "");
      case "node":
        return `<circle r="${it.r}"/><text dy=".35em" text-anchor="middle">${esc(it.label)}</text>` +
          (it.note !== "" && it.note != null ? `<text class="vz-note" x="${it.r + 3}" y="${-it.r + 6}">${esc(it.note)}</text>` : "");
      case "text":
        return `<text text-anchor="${it.anchor}" dy=".35em">${it.html || esc(it.s)}</text>`;
      case "zone":
        return `<rect width="${it.w}" height="${it.h}" rx="8"/>` + (it.label ? `<text class="vz-sub" x="4" y="-8">${esc(it.label)}</text>` : "");
    }
    return "";
  }
  const textW = s => Array.from(String(s)).reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 15 : 9.2), 0);
  function bounds(it) {
    switch (it.t) {
      case "box": return [it.x, it.y, it.x + it.w, it.y + it.h + (it.sub != null && it.sub !== "" ? 22 : 0)];
      case "node": return [it.x - it.r - 2, it.y - it.r - (it.note ? 10 : 2), it.x + it.r + (it.note ? 10 + textW(it.note) : 2), it.y + it.r + 2];
      case "edge": return [Math.min(it.x1, it.x2), Math.min(it.y1, it.y2), Math.max(it.x1, it.x2), Math.max(it.y1, it.y2)];
      case "text": {
        const w = textW(it.s);
        const x0 = it.anchor === "start" ? it.x : it.anchor === "end" ? it.x - w : it.x - w / 2;
        return [x0, it.y - 11, x0 + w, it.y + 11];
      }
      case "zone": return [it.x, it.y - (it.label ? 22 : 0), it.x + Math.max(it.w, it.label ? textW(it.label) + 8 : 0), it.y + it.h];
    }
    return [0, 0, 0, 0];
  }

  /* ---------- 播放器 ---------- */
  class Player {
    constructor(host, def) {
      this.host = host; this.def = def; this.map = new Map(); this.i = 0; this.timer = 0; this.frames = [];
      host.classList.add("vz");
      const fields = def.fields.map(f => {
        const v = host.dataset[f.name] != null ? host.dataset[f.name] : f.def;
        f.cur = v;
        if (f.type === "select") {
          return `<label>${esc(f.label)}<select name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}"${o[0] === v ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select></label>`;
        }
        return `<label>${esc(f.label)}<input name="${f.name}" value="${esc(v)}" autocomplete="off" spellcheck="false" inputmode="${f.mode || "text"}"></label>`;
      }).join("");
      host.innerHTML =
        `<div class="vz-head"><span class="vz-tag">動畫</span>${esc(host.dataset.title || def.title)}</div>` +
        `<form class="vz-form">${fields}<div class="vz-formbtn"><button type="submit">用這些數字重播</button><button type="button" data-a="reset">還原</button></div></form>` +
        `<div class="vz-stage"><svg class="vz-svg" xmlns="${NS}" role="img" aria-label="${esc(def.title)}"><g class="vz-back"></g><g class="vz-front"></g></svg></div>` +
        `<div class="vz-cap" aria-live="polite"></div>` +
        `<div class="vz-info"></div>` +
        `<div class="vz-ctrl">` +
          `<button type="button" data-a="first" aria-label="回到第一步" title="回到第一步">${I("first")}</button>` +
          `<button type="button" data-a="prev">${I("prev")}<span>上一步</span></button>` +
          `<button type="button" data-a="play" class="vz-play" aria-pressed="false">${I("play")}<span>自動播放</span></button>` +
          `<button type="button" data-a="next" class="vz-next"><span>下一步</span>${I("next")}</button>` +
          `<span class="vz-count"></span>` +
          `<input type="range" class="vz-range" min="0" max="0" value="0" aria-label="跳到第幾步">` +
        `</div>`;
      this.form = host.querySelector("form");
      this.svg = host.querySelector("svg");
      this.back = host.querySelector(".vz-back");
      this.front = host.querySelector(".vz-front");
      this.cap = host.querySelector(".vz-cap");
      this.info = host.querySelector(".vz-info");
      this.count = host.querySelector(".vz-count");
      this.range = host.querySelector(".vz-range");
      this.form.addEventListener("submit", e => { e.preventDefault(); this.run(); });
      host.querySelector('[data-a="reset"]').addEventListener("click", () => {
        def.fields.forEach(f => { this.form.elements[f.name].value = f.cur; });
        this.run();
      });
      host.querySelector(".vz-ctrl").addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b) return;
        const a = b.dataset.a;
        if (a === "play") { this.timer ? this.stop() : this.play(); return; }
        this.stop();
        if (a === "first") this.go(0);
        if (a === "prev") this.go(this.i - 1);
        if (a === "next") this.go(this.i + 1);
      });
      this.range.addEventListener("input", () => { this.stop(); this.go(+this.range.value); });
      this.run();
    }
    values() {
      const v = {};
      this.def.fields.forEach(f => { v[f.name] = String(this.form.elements[f.name].value).trim(); });
      return v;
    }
    run() {
      this.stop();
      let frames;
      try { frames = this.def.gen(this.values(), this.host.dataset); }
      catch (e) { this.fail(e.message || String(e)); return; }
      if (!frames.length) { this.fail("沒有可以播放的步驟"); return; }
      this.frames = frames;
      this.map.forEach(g => g.remove());
      this.map.clear();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      frames.forEach(fr => fr.items.forEach(it => {
        const b = bounds(it);
        x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
      }));
      const pad = 14, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
      this.svg.setAttribute("viewBox", `${x0 - pad} ${y0 - pad} ${w} ${h}`);
      this.svg.style.minWidth = Math.round(w * 0.62) + "px";
      this.svg.style.maxWidth = Math.round(w * 1.15) + "px";
      this.range.max = frames.length - 1;
      this.host.classList.remove("vz-error");
      this.go(0);
    }
    fail(msg) {
      this.frames = [];
      this.map.forEach(g => g.remove());
      this.map.clear();
      this.host.classList.add("vz-error");
      this.cap.innerHTML = `<b>輸入有問題：</b>${esc(msg)}`;
      this.info.innerHTML = "";
      this.count.textContent = "";
    }
    go(i) {
      if (!this.frames.length) return;
      i = Math.max(0, Math.min(this.frames.length - 1, i));
      this.i = i;
      const fr = this.frames[i];
      this.apply(fr.items);
      this.cap.innerHTML = fr.cap || "";
      this.info.innerHTML = fr.info || "";
      this.info.hidden = !fr.info;
      this.count.textContent = `第 ${i + 1} / ${this.frames.length} 步`;
      this.range.value = i;
      this.host.querySelector('[data-a="prev"]').disabled = i === 0;
      this.host.querySelector('[data-a="first"]').disabled = i === 0;
      this.host.querySelector('[data-a="next"]').disabled = i === this.frames.length - 1;
    }
    play() {
      if (this.i >= this.frames.length - 1) this.go(0);
      const b = this.host.querySelector(".vz-play");
      b.innerHTML = I("pause") + "<span>暫停</span>";
      b.setAttribute("aria-pressed", "true");
      this.timer = setInterval(() => {
        if (this.i >= this.frames.length - 1) { this.stop(); return; }
        this.go(this.i + 1);
      }, 1400);
    }
    stop() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = 0;
      const b = this.host.querySelector(".vz-play");
      b.innerHTML = I("play") + "<span>自動播放</span>";
      b.setAttribute("aria-pressed", "false");
    }
    apply(items) {
      const seen = new Set();
      for (const it of items) {
        seen.add(it.k);
        let g = this.map.get(it.k);
        const fresh = !g;
        if (fresh) {
          g = document.createElementNS(NS, "g");
          (it.t === "edge" || it.t === "zone" ? this.back : this.front).appendChild(g);
          this.map.set(it.k, g);
        }
        g.setAttribute("class", `vz-${it.t}${it.cls ? " " + it.cls : ""}${fresh ? " vz-enter" : ""}`);
        if (it.t === "edge") {
          let p = g.firstChild;
          if (!p) { p = document.createElementNS(NS, "path"); g.appendChild(p); }
          const d = `M${it.x1} ${it.y1}L${it.x2} ${it.y2}`;
          p.setAttribute("d", d);
          if (CAN_D) p.style.d = `path("${d}")`;
        } else {
          g.style.transform = `translate(${it.x}px,${it.y}px)`;
          const h = inner(it);
          if (g._h !== h) { g.innerHTML = h; g._h = h; }
        }
        if (fresh) requestAnimationFrame(() => requestAnimationFrame(() => g.classList.remove("vz-enter")));
      }
      for (const [k, g] of this.map) {
        if (seen.has(k)) continue;
        this.map.delete(k);
        g.classList.add("vz-leave");
        setTimeout(() => g.remove(), 350);
      }
    }
  }

  /* ---------- 共用：二元樹 ---------- */
  // x 用 inorder 的順序、y 用深度：BST 畫出來左小右大一目了然
  function layout(root, dx = 46, dy = 66) {
    const pos = new Map();
    let i = 0;
    (function walk(n, d) {
      if (!n) return;
      walk(n.l, d + 1);
      pos.set(n, [i++ * dx, d * dy]);
      walk(n.r, d + 1);
    })(root, 0);
    return pos;
  }
  function treeItems(root, marks = {}, notes = {}, oy = 0) {
    const pos = layout(root), items = [];
    pos.forEach(([x, y], n) => {
      for (const c of [n.l, n.r]) {
        if (!c) continue;
        const [x2, y2] = pos.get(c);
        items.push(edge("e" + c.k, x, y + oy, x2, y2 + oy, marks["e" + c.k] || ""));
      }
      items.push(node("n" + n.k, x, y + oy, n.label != null ? n.label : n.k, marks[n.k] || "", notes[n.k] != null ? notes[n.k] : ""));
    });
    return items;
  }
  const inorder = (n, out = []) => { if (n) { inorder(n.l, out); out.push(n.k); inorder(n.r, out); } return out; };
  const height = n => (n ? 1 + Math.max(height(n.l), height(n.r)) : 0);
  function parentOf(root, t) {
    let p = null, c = root;
    while (c && c !== t) { p = c; c = t.k < c.k ? c.l : c.r; }
    return p;
  }
  function replace(ctx, p, oldN, newN) {
    if (!p) ctx.root = newN;
    else if (p.l === oldN) p.l = newN;
    else p.r = newN;
  }

  const defs = {};

  /* ---------- insertion sort ---------- */
  defs.insertion = {
    title: "insertion sort：一張一張插進已排好的部分",
    fields: [{ name: "nums", label: "數列", def: "3,9,6,5,8,2" }],
    gen(v) {
      const a = nums(v.nums, "數列", { max: 12 }).map((x, id) => ({ id, x }));
      let inv = 0;
      for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i].x > a[j].x) inv++;
      const F = [], done = new Set([a[0].id]);
      let swaps = 0;
      const snap = (marks, cap) => {
        const items = [];
        a.forEach((o, i) => {
          items.push(box("b" + o.id, i * STEP, 0, o.x, marks[o.id] || (done.has(o.id) ? "done" : "")));
          items.push(text("i" + i, i * STEP + BW / 2, BH + 16, `[${i}]`, "vz-sub"));
        });
        F.push({ items, cap, info: `swap 次數：<b>${swaps}</b>　（原數列的逆序對共 ${inv} 個）` });
      };
      snap({}, `一開始只有 a[0]＝${a[0].x} 算「已排好」（綠色）。接下來從 a[1] 開始，一個一個拿起來插進綠色那段。`);
      for (let i = 1; i < a.length; i++) {
        const key = a[i];
        snap({ [key.id]: "cur" }, `拿起 a[${i}]＝<b>${key.x}</b>（藍色），往左和已排好的數比。`);
        let j = i;
        while (j > 0) {
          const L = a[j - 1];
          if (L.x > key.x) {
            a[j - 1] = key; a[j] = L; swaps++; j--;
            snap({ [key.id]: "cur", [L.id]: "cmp" }, `${L.x} &gt; ${key.x} → 交換，${key.x} 往前一格（這是第 ${swaps} 次 swap）。`);
          } else {
            done.add(key.id);
            snap({ [key.id]: "cur", [L.id]: "cmp" }, `${L.x} ≤ ${key.x} → 停，${key.x} 插好了。`);
            break;
          }
        }
        if (j === 0) { done.add(key.id); snap({ [key.id]: "cur" }, `${key.x} 已經換到最前面，插好了。`); }
      }
      snap({}, `排好了。swap 一共 <b>${swaps}</b> 次，剛好等於原數列的逆序對數 ${inv}：每次相鄰交換剛好消掉一個逆序對。`);
      return F;
    }
  };

  /* ---------- heap ---------- */
  defs.heap = {
    title: "max heap：建 heap 與 heap sort",
    fields: [
      { name: "nums", label: "數列（陣列 index 0 開始）", def: "3,1,6,5,2,4" },
      { name: "build", label: "建 heap 的方法", def: "bottom", type: "select", options: [["bottom", "bottom-up：從最後一個非葉節點往前 sift-down"], ["insert", "一個一個插入：放最後再 sift-up"]] },
      { name: "sort", label: "做到哪裡", def: "build", type: "select", options: [["build", "只建 heap"], ["sort", "建好後繼續做 heap sort"]] }
    ],
    gen(v) {
      const a = nums(v.nums, "數列", { max: 15 }).map((x, id) => ({ id, x }));
      const n = a.length, levels = Math.floor(Math.log2(n)) + 1;
      const TW = Math.max(2 ** (levels - 1) * 50, 120);
      const AW = 40, AS = 44;
      const arrW = n * AS - 4, tx = Math.max(0, (arrW - TW) / 2), ax = Math.max(0, (TW - arrW) / 2);
      const lvl = i => Math.floor(Math.log2(i + 1));
      const X = i => tx + ((i + 1 - 2 ** lvl(i) + 0.5) / 2 ** lvl(i)) * TW;
      const Y = i => lvl(i) * 64 + 20;
      const arrY = levels * 64 + 26;
      const F = [];
      let size = n, built = n;
      const snap = (marks, cap) => {
        const items = [];
        for (let i = 1; i < Math.min(size, built); i++) {
          const p = (i - 1) >> 1;
          items.push(edge("e" + i, X(p), Y(p), X(i), Y(i)));
        }
        for (let i = 0; i < Math.min(size, built); i++) items.push(node("n" + a[i].id, X(i), Y(i), a[i].x, marks[a[i].id] || ""));
        a.forEach((o, i) => {
          const cls = marks[o.id] || (i >= size ? "done" : i >= built ? "dim" : "");
          items.push(box("a" + o.id, ax + i * AS, arrY, o.x, cls, { w: AW }));
          items.push(text("i" + i, ax + i * AS + AW / 2, arrY + BH + 16, `[${i}]`, "vz-sub"));
        });
        items.push(text("lt", ax, arrY - 13, "陣列（index 0 開始）", "vz-sub", "start"));
        F.push({ items, cap, info: `陣列：${a.map((o, i) => (i < size ? o.x : `<span class="vz-ok">${o.x}</span>`)).join(", ")}` });
      };
      const sw = (i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; };
      const siftDown = (i, lim) => {
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          if (l >= lim) { snap({ [a[i].id]: "cur" }, `${a[i].x}（index ${i}）沒有子節點了 → 停。`); return; }
          const big = r < lim && a[r].x > a[l].x ? r : l;
          const kids = r < lim ? `${a[l].x}、${a[r].x}` : `${a[l].x}`;
          const m = { [a[i].id]: "cur", [a[l].id]: "cmp" };
          if (r < lim) m[a[r].id] = "cmp";
          if (a[big].x > a[i].x) {
            snap(m, `${a[i].x}（index ${i}）的子節點是 ${kids}，比較大的是 <b>${a[big].x}</b>，比 ${a[i].x} 大 → 交換。`);
            sw(i, big);
            snap({ [a[big].id]: "cur", [a[i].id]: "cmp" }, `交換完，${a[big].x} 到了 index ${big}，繼續往下檢查。`);
            i = big;
          } else {
            snap(m, `${a[i].x}（index ${i}）的子節點是 ${kids}，比較大的 ${a[big].x} 沒有比 ${a[i].x} 大 → 停。`);
            return;
          }
        }
      };
      if (v.build === "insert") {
        built = 0;
        snap({}, `一個一個插入：每個數先放在 heap 的最後面，再往上和父節點比（sift-up），比父節點大就交換。`);
        for (let k = 0; k < n; k++) {
          built = k + 1;
          snap({ [a[k].id]: "cur" }, `插入 <b>${a[k].x}</b>：先放在最後面（index ${k}）。`);
          let i = k;
          while (i > 0) {
            const p = (i - 1) >> 1;
            if (a[i].x > a[p].x) {
              snap({ [a[i].id]: "cur", [a[p].id]: "cmp" }, `${a[i].x} 比父節點 ${a[p].x} 大 → 交換。`);
              sw(i, p); i = p;
              snap({ [a[i].id]: "cur" }, `${a[i].x} 往上到 index ${i}。`);
            } else {
              snap({ [a[i].id]: "cur", [a[p].id]: "cmp" }, `${a[i].x} ≤ 父節點 ${a[p].x} → 停。`);
              break;
            }
          }
        }
      } else {
        const last = (n >> 1) - 1;
        snap({}, `先把數列照順序放進完全二元樹（index 0 是根，i 的子節點是 2i+1、2i+2）。這時還不是 heap。最後一個非葉節點是 index ⌊n/2⌋−1 ＝ ${last}，從它開始往前，每個做 sift-down。`);
        for (let i = last; i >= 0; i--) {
          snap({ [a[i].id]: "cur" }, `處理 index ${i}（${a[i].x}）：往下和比較大的子節點比。`);
          siftDown(i, n);
        }
      }
      snap({}, `max heap 建好了：${a.map(o => o.x).join(", ")}。每個節點都比它的子節點大，最大的 ${a[0].x} 在根。`);
      if (v.sort === "sort") {
        for (let end = n - 1; end >= 1; end--) {
          snap({ [a[0].id]: "cur", [a[end].id]: "cmp" }, `把根（目前最大的 ${a[0].x}）和 heap 的最後一個 ${a[end].x} 交換。`);
          sw(0, end); size = end;
          snap({ [a[0].id]: "cur" }, `${a[end].x} 放到陣列尾端，之後不再動（綠色）。heap 剩 ${end} 個，對新的根 ${a[0].x} 做 sift-down。`);
          siftDown(0, end);
        }
        size = 0;
        snap({}, `heap sort 完成：${a.map(o => o.x).join(", ")}。`);
      }
      return F;
    }
  };

  /* ---------- LSD radix sort ---------- */
  defs.radix = {
    title: "LSD radix sort：從個位數開始分桶",
    fields: [{ name: "nums", label: "數列（非負整數）", def: "642,374,73,29,284,252" }],
    gen(v) {
      let a = nums(v.nums, "數列", { int: true, max: 12 }).map((x, id) => ({ id, x }));
      const D = String(Math.max(...a.map(o => o.x))).length;
      const CW = 51, W = 46, bt = 112, RH = 46;
      const name = ["個位數", "十位數", "百位數", "千位數", "萬位數", "十萬位數"];
      const digit = (x, d) => Math.floor(x / 10 ** d) % 10;
      const html = (x, d) => {
        const s = String(x), p = s.padStart(D, "0"), lead = D - s.length;
        return Array.from(p).map((c, i) => {
          const cls = i === D - 1 - d ? "vz-hl" : i < lead ? "vz-dimtxt" : "";
          return cls ? `<tspan class="${cls}">${c}</tspan>` : c;
        }).join("");
      };
      let maxStack = 1;
      for (let d = 0; d < D; d++) {
        const c = new Array(10).fill(0);
        a.forEach(o => c[digit(o.x, d)]++);
        maxStack = Math.max(maxStack, ...c);
      }
      const F = [];
      const snap = (where, d, cap) => {
        const items = [];
        for (let b = 0; b < 10; b++) items.push(zone("z" + b, b * CW - 2, bt, W + 4, maxStack * RH + 6, "bucket", `${b} 號`));
        a.forEach(o => {
          const w = where.get(o.id);
          items.push(box("v" + o.id, w[0], w[1], o.x, w[2] || "", { w: W, html: d >= 0 ? html(o.x, d) : esc(o.x) }));
        });
        F.push({ items, cap });
      };
      const rowPos = list => new Map(list.map((o, i) => [o.id, [i * CW, 0]]));
      snap(rowPos(a), -1, `最大的數有 ${D} 位，所以要做 ${D} 輪。每一輪只看一個位數（橘色），從個位數開始。`);
      for (let d = 0; d < D; d++) {
        const where = rowPos(a);
        snap(where, d, `第 ${d + 1} 輪：看<b>${name[d]}</b>。從左到右，一個一個依這一位放進 0–9 號桶。` + (String(Math.max(...a.map(o => o.x))).length > 1 && d > 0 ? "位數不夠的前面補 0（灰色）。" : ""));
        const bk = Array.from({ length: 10 }, () => []);
        for (const o of a) {
          const b = digit(o.x, d);
          bk[b].push(o);
          where.set(o.id, [b * CW, bt + 4 + (bk[b].length - 1) * RH, "cur"]);
          snap(where, d, `${o.x} 的${name[d]}是 <b>${b}</b> → 放進 ${b} 號桶${bk[b].length > 1 ? `（排在桶裡第 ${bk[b].length} 個，前面的不動）` : ""}。`);
          where.get(o.id)[2] = "";
        }
        a = bk.flat();
        snap(rowPos(a), d, `依 0 號桶 → 9 號桶的順序收回，同一個桶子裡照放進去的順序（這就是「穩定」）：<b>${a.map(o => o.x).join(", ")}</b>`);
      }
      snap(rowPos(a), -1, `${D} 輪做完就排好了：${a.map(o => o.x).join(", ")}。`);
      return F;
    }
  };

  /* ---------- BST ---------- */
  defs.bst = {
    title: "BST：插入與刪除",
    fields: [
      { name: "keys", label: "依序插入", def: "3,6,4,5,2,7,1" },
      { name: "del", label: "再依序刪除（可空白）", def: "3" },
      { name: "rep", label: "有兩個子節點時用", def: "succ", type: "select", options: [["succ", "inorder successor（右子樹最小）"], ["pred", "inorder predecessor（左子樹最大）"]] }
    ],
    gen(v) {
      const keys = nums(v.keys, "插入的數", { max: 15, unique: true });
      const dels = v.del ? nums(v.del, "刪除的數") : [];
      const T = { root: null }, F = [];
      const snap = (marks, cap) => F.push({ items: treeItems(T.root, marks), cap, info: T.root ? `inorder：${inorder(T.root).join(" ")}` : "" });
      snap({}, `從空的樹開始。規則：比節點小往左、比節點大往右。`);
      for (const k of keys) {
        if (!T.root) { T.root = { k }; snap({ [k]: "cur" }, `插入 ${k}：樹是空的，${k} 當根。`); continue; }
        let c = T.root;
        const steps = [], m = {};
        for (;;) {
          const left = k < c.k;
          steps.push(`${k} ${left ? "&lt;" : "&gt;"} ${c.k} 往${left ? "左" : "右"}`);
          m[c.k] = "cmp";
          const nx = left ? c.l : c.r;
          if (!nx) {
            if (left) c.l = { k }; else c.r = { k };
            m[k] = "cur";
            snap(m, `插入 <b>${k}</b>：${steps.join("，")} → 放在 ${c.k} 的${left ? "左" : "右"}邊。`);
            break;
          }
          c = nx;
        }
      }
      for (const d of dels) {
        let c = T.root, p = null;
        const m = {}, path = [];
        while (c && c.k !== d) { m[c.k] = "cmp"; path.push(c.k); p = c; c = d < c.k ? c.l : c.r; }
        if (!c) { snap(m, `要刪除 ${d}：樹裡沒有 ${d}。`); continue; }
        m[d] = "bad";
        snap(m, `刪除 <b>${d}</b>：${path.length ? `從根往下 ${path.join("→")}，` : ""}找到 ${d}（紅色）。`);
        if (!c.l && !c.r) {
          snap({ [d]: "bad" }, `${d} 沒有子節點（葉節點）→ 直接刪掉。`);
          replace(T, p, c, null);
          snap({}, `刪掉 ${d} 了。`);
        } else if (!c.l || !c.r) {
          const ch = c.l || c.r;
          snap({ [d]: "bad", [ch.k]: "cur" }, `${d} 只有一個子節點 ${ch.k} → 讓 ${ch.k}（連同它的子樹）接到 ${d} 原本的位置。`);
          replace(T, p, c, ch);
          snap({ [ch.k]: "cur" }, `完成。`);
        } else {
          const succ = v.rep !== "pred";
          let s = succ ? c.r : c.l, sp = c;
          const mm = { [d]: "bad", [s.k]: "cmp" }, walk = [s.k];
          while (succ ? s.l : s.r) { sp = s; s = succ ? s.l : s.r; mm[s.k] = "cmp"; walk.push(s.k); }
          mm[s.k] = "cur";
          snap(mm, `${d} 有兩個子節點 → 找${succ ? " inorder successor：先往右一步，再一直往左" : " inorder predecessor：先往左一步，再一直往右"}（${walk.join("→")}），得到 <b>${s.k}</b>（${succ ? "右子樹最小" : "左子樹最大"}）。`);
          const rest = succ ? s.r : s.l;
          snap({ [d]: "bad", [s.k]: "cur" }, `用 ${s.k} 取代 ${d}。${s.k} 原本${rest ? `的${succ ? "右" : "左"}子節點 ${rest.k} 接到 ${s.k} 原本的位置` : "沒有子節點，直接搬走"}。`);
          if (sp === c) { if (succ) c.r = rest; else c.l = rest; }
          else if (succ) sp.l = rest; else sp.r = rest;
          s.l = c.l; s.r = c.r;
          replace(T, p, c, s);
          snap({ [s.k]: "cur" }, `刪除完成，${s.k} 在 ${d} 原本的位置。`);
        }
      }
      if (T.root) snap({}, `最後的樹。inorder 走訪 ${inorder(T.root).join(" ")} 一定由小到大，可以用來檢查自己畫的對不對。`);
      return F;
    }
  };

  /* ---------- AVL ---------- */
  defs.avl = {
    title: "AVL tree：插入、找不平衡的點、旋轉",
    fields: [
      { name: "base", label: "先建好的樹（依序插入，不播放過程，可空白）", def: "" },
      { name: "keys", label: "要一步一步插入的數", def: "3,2,1" }
    ],
    gen(v) {
      const base = v.base ? nums(v.base, "先建好的樹", { max: 15, unique: true }) : [];
      const keys = nums(v.keys, "要插入的數", { max: 12 });
      if (new Set(base.concat(keys)).size !== base.length + keys.length) throw new Error("數字不能重複");
      const T = { root: null }, F = [];
      const bf = n => height(n.l) - height(n.r);
      const notes = () => {
        const o = {};
        (function w(n) { if (!n) return; o[n.k] = (bf(n) > 0 ? "+" : "") + bf(n); w(n.l); w(n.r); })(T.root);
        return o;
      };
      const snap = (marks, cap) => F.push({ items: treeItems(T.root, marks, notes()), cap, info: "節點右上的小數字是平衡因子 bf ＝ 左子樹高 − 右子樹高，|bf| ≥ 2 就不平衡。" });
      const rotR = z => { const y = z.l; replace(T, parentOf(T.root, z), z, y); z.l = y.r; y.r = z; return y; };
      const rotL = z => { const y = z.r; replace(T, parentOf(T.root, z), z, y); z.r = y.l; y.l = z; return y; };
      const plain = k => {
        if (!T.root) { T.root = { k }; return [T.root]; }
        let c = T.root;
        const path = [];
        for (;;) {
          path.push(c);
          const side = k < c.k ? "l" : "r";
          if (!c[side]) { c[side] = { k }; path.push(c[side]); return path; }
          c = c[side];
        }
      };
      const fix = (path, show) => {
        for (let i = path.length - 2; i >= 0; i--) {
          const z = path[i], b = bf(z);
          if (Math.abs(b) < 2) continue;
          const y = path[i + 1], x = path[i + 2];
          const cs = (y === z.l ? "L" : "R") + (x === y.l ? "L" : "R");
          if (show) {
            snap({ [z.k]: "bad", [y.k]: "cmp", [x.k]: "cmp" },
              `從新節點往上找，第一個不平衡的是 <b>${z.k}</b>：左子樹高 ${height(z.l)}、右子樹高 ${height(z.r)}，差 ${Math.abs(b)}。` +
              `新節點在 ${z.k} 的${cs[0] === "L" ? "左" : "右"}子樹（${y.k}）的${cs[1] === "L" ? "左" : "右"}邊 → <b>${cs}</b> 情況。`);
          }
          if (cs === "LL") {
            rotR(z);
            if (show) snap({ [y.k]: "cur" }, `LL：對 ${z.k} <b>右旋</b>。${y.k} 升上來當這棵子樹的根，${z.k} 變成 ${y.k} 的右子節點` + (z.l ? `，${y.k} 原本的右子樹（${z.l.k}）改接到 ${z.k} 的左邊。` : "。"));
          } else if (cs === "RR") {
            rotL(z);
            if (show) snap({ [y.k]: "cur" }, `RR：對 ${z.k} <b>左旋</b>。${y.k} 升上來當這棵子樹的根，${z.k} 變成 ${y.k} 的左子節點` + (z.r ? `，${y.k} 原本的左子樹（${z.r.k}）改接到 ${z.k} 的右邊。` : "。"));
          } else if (cs === "LR") {
            rotL(y);
            if (show) snap({ [x.k]: "cur", [z.k]: "bad" }, `LR 第一步：先對 ${y.k} <b>左旋</b>，${x.k} 升上來，變成 LL 的形狀。`);
            rotR(z);
            if (show) snap({ [x.k]: "cur" }, `LR 第二步：再對 ${z.k} <b>右旋</b>，${x.k} 變成這棵子樹的根。`);
          } else {
            rotR(y);
            if (show) snap({ [x.k]: "cur", [z.k]: "bad" }, `RL 第一步：先對 ${y.k} <b>右旋</b>，${x.k} 升上來，變成 RR 的形狀。`);
            rotL(z);
            if (show) snap({ [x.k]: "cur" }, `RL 第二步：再對 ${z.k} <b>左旋</b>，${x.k} 變成這棵子樹的根。`);
          }
          return true;
        }
        return false;
      };
      base.forEach(k => fix(plain(k), false));
      snap({}, base.length ? `先建好的 AVL tree（節點旁是平衡因子）。` : `從空的 AVL tree 開始。`);
      for (const k of keys) {
        const path = plain(k);
        const m = {};
        path.forEach(n => { m[n.k] = "cmp"; });
        m[k] = "cur";
        snap(m, path.length > 1 ? `插入 <b>${k}</b>：照 BST 的規則走 ${path.map(n => n.k).join("→")}，接在 ${path[path.length - 2].k} 的${path[path.length - 2].l && path[path.length - 2].l.k === k ? "左" : "右"}邊。` : `插入 ${k}：當根。`);
        if (fix(path, true)) snap({}, `轉完了，每個節點的 |bf| 都 ≤ 1。inorder 還是 ${inorder(T.root).join(" ")}：旋轉不會破壞左小右大。`);
        else snap({ [k]: "cur" }, `檢查路徑上每個節點，|bf| 都 ≤ 1，平衡，不用轉。`);
      }
      return F;
    }
  };

  /* ---------- 二元樹走訪 ---------- */
  function fromLevel(list) {
    if (!list.length || list[0] === "#") return null;
    const nodes = list.map((s, i) => (s === "#" ? null : { k: "t" + i, label: s }));
    let qi = 0, ci = 1;
    const q = [nodes[0]];
    while (qi < q.length && ci < nodes.length) {
      const p = q[qi++];
      for (const side of ["l", "r"]) {
        if (ci >= nodes.length) break;
        const c = nodes[ci++];
        if (c) { p[side] = c; q.push(c); }
      }
    }
    return nodes[0];
  }
  defs.traverse = {
    title: "二元樹走訪：根放在哪裡",
    fields: [
      { name: "tree", label: "樹（一層一層從左到右寫，# 表示空的位置）", def: "A,B,C,D,E" },
      { name: "order", label: "走訪", def: "pre", type: "select", options: [["pre", "preorder：根、左、右"], ["in", "inorder：左、根、右"], ["post", "postorder：左、右、根"], ["level", "level order：一層一層"]] }
    ],
    gen(v) {
      const list = toks(v.tree);
      if (list.length > 31) throw new Error("節點太多了");
      const root = fromLevel(list);
      if (!root) throw new Error("樹是空的");
      const F = [], out = [], done = new Set();
      const by = new Map();
      (function w(n) { if (!n) return; by.set(n.k, n); w(n.l); w(n.r); })(root);
      const oy = height(root) * 66 + 14;
      const snap = (marks, cap, extra = []) => {
        const m = {};
        done.forEach(k => { m[k] = "done"; });
        Object.assign(m, marks);
        const items = treeItems(root, m);
        out.forEach((k, i) => items.push(box("o" + k, i * STEP, oy, by.get(k).label, "done")));
        items.push(text("ol", 0, oy - 13, "輸出", "vz-sub", "start"));
        F.push({ items: items.concat(extra), cap, info: `輸出：${out.map(k => by.get(k).label).join(" ") || "（還沒有）"}` });
      };
      const L = n => by.get(n.k).label;
      const visit = n => { out.push(n.k); done.add(n.k); };
      const kids = n => [n.l && `左子樹（${L(n.l)}）`, n.r && `右子樹（${L(n.r)}）`].filter(Boolean).join("、") || "沒有子樹";
      const path = [];
      const pm = cur => { const m = {}; path.forEach(k => { m[k] = "path"; }); m[cur.k] = "cur"; return m; };
      snap({}, { pre: "preorder：每到一個節點，先輸出它，再走左子樹、右子樹。", in: "inorder：每到一個節點，先走完左子樹，再輸出它，最後走右子樹。", post: "postorder：每到一個節點，先走完左、右子樹，最後才輸出它。", level: "level order：用 queue，從根開始一層一層、由左到右輸出。" }[v.order]);
      if (v.order === "level") {
        const q = [root];
        const qItems = () => q.map((n, i) => box("o" + n.k, i * STEP, oy + 80, L(n), "cmp"));
        const qy = oy + 80;
        snap({ [root.k]: "cmp" }, `把根 ${L(root)} 放進 queue。`, qItems().concat([text("ql", 0, qy - 13, "queue（左邊是前面）", "vz-sub", "start")]));
        while (q.length) {
          const n = q.shift();
          visit(n);
          const added = [n.l, n.r].filter(Boolean);
          q.push(...added);
          snap({ [n.k]: "cur" }, `從 queue 前面拿出 ${L(n)} 輸出${added.length ? `，把它的子節點 ${added.map(L).join("、")} 放到 queue 後面` : "，它沒有子節點"}。`, qItems().concat([text("ql", 0, qy - 13, "queue（左邊是前面）", "vz-sub", "start")]));
        }
      } else {
        (function rec(n) {
          if (!n) return;
          if (v.order === "pre") { visit(n); snap(pm(n), `到 ${L(n)}：<b>先輸出 ${L(n)}</b>，再走${kids(n)}。`); }
          else snap(pm(n), `到 ${L(n)}：${v.order === "in" ? (n.l ? `先走左子樹（${L(n.l)}），${L(n)} 等一下才輸出。` : `沒有左子樹。`) : `先走${kids(n)}，${L(n)} 最後才輸出。`}`);
          path.push(n.k);
          rec(n.l);
          if (v.order === "in") { path.pop(); visit(n); snap(pm(n), `${n.l ? `${L(n)} 的左子樹走完了，` : ""}<b>輸出 ${L(n)}</b>${n.r ? `，再走右子樹（${L(n.r)}）` : ""}。`); path.push(n.k); }
          rec(n.r);
          path.pop();
          if (v.order === "post") { visit(n); snap(pm(n), `${L(n)} 的子樹都走完了 → <b>輸出 ${L(n)}</b>。`); }
        })(root);
      }
      snap({}, `完成：<b>${out.map(k => by.get(k).label).join(" ")}</b>`);
      return F;
    }
  };

  /* ---------- 由走訪重建二元樹 ---------- */
  defs.rebuild = {
    title: "由 inorder ＋ postorder（或 preorder）重建二元樹",
    fields: [
      { name: "inorder", label: "inorder", def: "ABCDEFGHIJ" },
      { name: "other", label: "另一個走訪", def: "ABDCGIHJFE" },
      { name: "kind", label: "另一個是", def: "post", type: "select", options: [["post", "postorder（最後一個是根）"], ["pre", "preorder（第一個是根）"]] }
    ],
    gen(v) {
      const ino = letters(v.inorder), oth = letters(v.other), post = v.kind !== "pre";
      if (ino.length > 15) throw new Error("最多 15 個節點");
      if (new Set(ino).size !== ino.length) throw new Error("inorder 不能有重複的名字");
      if (ino.length !== oth.length || [...ino].sort().join() !== [...oth].sort().join()) throw new Error("兩個走訪的節點對不起來");
      const idx = new Map(ino.map((s, i) => [s, i]));
      const ON = post ? "postorder" : "preorder", y2 = 76, ty = 172;
      const F = [], placed = new Map();
      let root = null;
      const snap = (st, cap) => {
        const items = [text("l1", 0, -13, "inorder", "vz-sub", "start"), text("l2", 0, y2 - 13, ON, "vz-sub", "start")];
        ino.forEach((s, i) => items.push(box("a" + s, i * STEP, 0, s, st.a ? st.a(i) : "")));
        oth.forEach((s, i) => items.push(box("b" + s, i * STEP, y2, s, st.b ? st.b(i) : "")));
        placed.forEach((d, s) => {
          const x = idx.get(s) * STEP + BW / 2, y = ty + d.depth * 62;
          if (d.parent != null) {
            const p = placed.get(d.parent);
            items.push(edge("e" + s, idx.get(d.parent) * STEP + BW / 2, ty + p.depth * 62, x, y));
          }
          items.push(node("n" + s, x, y, s, st.n === s ? "cur" : ""));
        });
        F.push({ items, cap });
      };
      snap({}, `${post ? "postorder 的<b>最後一個</b>" : "preorder 的<b>第一個</b>"}一定是根；在 inorder 裡找到根，<b>左邊全是左子樹、右邊全是右子樹</b>。對每棵子樹重複這件事。樹的節點會畫在它的 inorder 字母正下方。`);
      const side = (lo, hi, k) => i => (i === k ? "cur" : i >= lo && i < k ? "lpart" : i > k && i <= hi ? "rpart" : "");
      (function rec(iL, iR, oL, oR, parent, depth, label) {
        if (iL > iR) return;
        const r = post ? oth[oR] : oth[oL];
        const k = idx.get(r);
        if (k == null || k < iL || k > iR) throw new Error("這兩個走訪不可能來自同一棵樹");
        const nl = k - iL, nr = iR - k;
        const lo2 = post ? oL : oL + 1, k2 = post ? oR : oL;
        const oSide = i => (i === k2 ? "cur" : i >= lo2 && i < lo2 + nl ? "lpart" : i >= lo2 + nl && i < lo2 + nl + nr ? "rpart" : "");
        placed.set(r, { depth, parent });
        if (!root) root = r;
        const seg = (a, b) => ino.slice(a, b + 1).join("") || "（空）";
        snap({ a: side(iL, iR, k), b: oSide, n: r },
          `${label}：${ON} 的這一段 ${oth.slice(oL, oR + 1).join("")}，${post ? "最後" : "第一"}一個是 <b>${r}</b> → 根。` +
          `inorder 以 ${r} 切開：左子樹 <span class="vz-l">${seg(iL, k - 1)}</span>（${nl} 個）、右子樹 <span class="vz-r">${seg(k + 1, iR)}</span>（${nr} 個）。` +
          `${ON} 也照個數切：左 ${oth.slice(lo2, lo2 + nl).join("") || "（空）"}、右 ${oth.slice(lo2 + nl, lo2 + nl + nr).join("") || "（空）"}。`);
        rec(iL, k - 1, lo2, lo2 + nl - 1, r, depth + 1, `${r} 的左子樹`);
        rec(k + 1, iR, lo2 + nl, lo2 + nl + nr - 1, r, depth + 1, `${r} 的右子樹`);
      })(0, ino.length - 1, 0, oth.length - 1, null, 0, "整棵樹");
      const kids = new Map();
      placed.forEach((d, s) => {
        if (d.parent == null) return;
        const e = kids.get(d.parent) || {};
        if (idx.get(s) < idx.get(d.parent)) e.l = s; else e.r = s;
        kids.set(d.parent, e);
      });
      const walk = (s, ord, out = []) => {
        if (s == null) return out;
        const e = kids.get(s) || {};
        if (ord === "pre") out.push(s);
        walk(e.l, ord, out);
        walk(e.r, ord, out);
        if (ord === "post") out.push(s);
        return out;
      };
      const want = post ? "pre" : "post";
      snap({}, `樹建好了。${want === "pre" ? "preorder（根左右）" : "postorder（左右根）"}是 <b>${walk(root, want).join(" ")}</b>。`);
      return F;
    }
  };

  /* ---------- 雜湊 ---------- */
  defs.hash = {
    title: "雜湊：open addressing 的探測過程",
    fields: [
      { name: "keys", label: "依序插入的 key", def: "7,12,2" },
      { name: "m", label: "表大小 M", def: "5", mode: "numeric" },
      { name: "method", label: "碰撞時", def: "linear", type: "select", options: [["linear", "linear probing：(h(k)+i) mod M"], ["quad", "quadratic probing：(h(k)+i²) mod M"], ["double", "double hashing：(h1(k)+i·h2(k)) mod M"]] },
      { name: "r", label: "double hashing 的 h2(k)＝R − (k mod R)，R＝", def: "7", mode: "numeric" }
    ],
    gen(v) {
      const keys = nums(v.keys, "key", { int: true, max: 16 });
      const M = Number(v.m), R = Number(v.r);
      if (!Number.isInteger(M) || M < 2 || M > 19) throw new Error("M 要是 2 到 19 的整數");
      if (v.method === "double" && (!Number.isInteger(R) || R < 1)) throw new Error("R 要是正整數");
      const table = new Array(M).fill(null), F = [];
      const ty = 92, HW = 44, HS = 48;
      const pos = new Map();
      let cnt = 0;
      const snap = (marks, cap) => {
        const items = [];
        for (let i = 0; i < M; i++) {
          items.push(box("s" + i, i * HS, ty, "", marks["s" + i] || "slot", { w: HW }));
          items.push(text("i" + i, i * HS + HW / 2, ty + BH + 16, `[${i}]`, "vz-sub"));
        }
        pos.forEach((p, id) => items.push(box("k" + id, p[0], p[1], keys[id], marks["k" + id] || (p[1] === ty ? "done" : "cur"), { w: HW })));
        F.push({ items, cap, info: `已放 ${cnt} 個，load factor α ＝ ${cnt}/${M}${cnt ? ` ≈ ${(cnt / M).toFixed(2)}` : ""}` });
      };
      const name = { linear: "linear probing", quad: "quadratic probing", double: "double hashing" }[v.method];
      snap({}, `表有 M＝${M} 格。用 ${name}：先算 h(k)＝k mod ${M}，那格被佔了就照公式算下一格。`);
      keys.forEach((k, id) => {
        const h = k % M, h2 = R - (k % R);
        const at = i => (v.method === "linear" ? (h + i) % M : v.method === "quad" ? (h + i * i) % M : (h + i * h2) % M);
        const formula = i => (v.method === "linear" ? `(${h} + ${i}) mod ${M} = ${at(i)}` : v.method === "quad" ? `(${h} + ${i}²) mod ${M} = ${at(i)}` : `(${h} + ${i}×${h2}) mod ${M} = ${at(i)}`);
        let i = 0, p = at(0);
        pos.set(id, [p * HS, 8]);
        snap({ ["s" + p]: "cmp" }, `插入 <b>${k}</b>：h(${k}) ＝ ${k} mod ${M} ＝ <b>${h}</b>` + (v.method === "double" ? `，h2(${k}) ＝ ${R} − (${k} mod ${R}) ＝ ${R} − ${k % R} ＝ <b>${h2}</b>（碰撞時每次跳 ${h2} 格）` : "") + "。");
        const limit = M;
        while (table[p] !== null && i < limit) {
          snap({ ["s" + p]: "bad", ["k" + table[p]]: "bad" }, `第 ${i} 次探測：位置 ${p} 已經有 ${keys[table[p]]} → 碰撞，往下一個位置。`);
          i++;
          p = at(i);
          pos.set(id, [p * HS, 8]);
          snap({ ["s" + p]: "cmp" }, `第 ${i} 次探測：${formula(i)}。`);
        }
        if (table[p] !== null) {
          pos.delete(id);
          snap({}, `探測了 ${limit} 次都沒找到空位，${k} 放不進去${v.method === "quad" ? "（quadratic probing 不一定會走遍每一格）" : ""}。`);
          return;
        }
        table[p] = id; cnt++;
        pos.set(id, [p * HS, ty]);
        snap({ ["k" + id]: "cur" }, `位置 ${p} 是空的 → ${k} 放進 [${p}]。`);
      });
      snap({}, `結果：${table.map((t, i) => (t === null ? null : `[${i}]=${keys[t]}`)).filter(Boolean).join("、")}，其他是空的。`);
      return F;
    }
  };

  /* ---------- 圖：Prim / Kruskal / Dijkstra ---------- */
  defs.graph = {
    title: "圖：Prim／Kruskal／Dijkstra",
    fields: [
      { name: "edges", label: "邊（無向，像 A-B 4 這樣寫，用逗號隔開）", def: "A-B 4, A-C 1, B-C 2, B-D 5, C-D 8" },
      { name: "algo", label: "演算法", def: "prim", type: "select", options: [["prim", "Prim：最小生成樹，從一點長出去"], ["kruskal", "Kruskal：最小生成樹，邊由小到大挑"], ["dijkstra", "Dijkstra：從起點出發的最短路徑"]] },
      { name: "start", label: "起點（Prim、Dijkstra 用）", def: "A" }
    ],
    gen(v, ds) {
      const E = [];
      const re = /([A-Za-z0-9]+)\s*[-–—]\s*([A-Za-z0-9]+)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/g;
      let mt;
      while ((mt = re.exec(v.edges))) E.push({ u: mt[1], v: mt[2], w: Number(mt[3]), id: E.length });
      if (!E.length) throw new Error("沒有讀到邊，請用「A-B 4」這種格式");
      if (E.length > 24) throw new Error("邊太多了（最多 24 條）");
      const V = [];
      E.forEach(e => { [e.u, e.v].forEach(x => { if (!V.includes(x)) V.push(x); }); });
      if (V.length > 12) throw new Error("點太多了（最多 12 個）");
      if (ds.order) {
        const o = toks(ds.order).filter(x => V.includes(x));
        V.sort((a, b) => (o.indexOf(a) + 1 || 99) - (o.indexOf(b) + 1 || 99));
      }
      const s = v.start || V[0];
      if (v.algo !== "kruskal" && !V.includes(s)) throw new Error(`起點 ${s} 不在圖裡`);
      if (v.algo === "dijkstra" && E.some(e => e.w < 0)) throw new Error("Dijkstra 不能有負的邊");
      const R = 60 + V.length * 16, P = new Map();
      V.forEach((x, i) => { const t = -Math.PI / 2 + (2 * Math.PI * i) / V.length; P.set(x, [R + R * Math.cos(t), R + R * Math.sin(t)]); });
      const nm = e => `${e.u}${e.v}`;
      const F = [];
      const snap = (st, cap, info) => {
        const items = [];
        E.forEach(e => {
          const [x1, y1] = P.get(e.u), [x2, y2] = P.get(e.v);
          items.push(edge("e" + e.id, x1, y1, x2, y2, st.e[e.id] || ""));
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1) || 1;
          const ox = (-(y2 - y1) / L) * 12, oy = ((x2 - x1) / L) * 12;
          items.push(text("w" + e.id, mx + ox, my + oy, String(e.w), "vz-w" + (st.e[e.id] ? " " + st.e[e.id] : "")));
        });
        V.forEach(x => items.push(node("n" + x, P.get(x)[0], P.get(x)[1], x, st.n[x] || "", st.note ? st.note[x] : "")));
        F.push({ items, cap, info });
      };
      if (v.algo === "prim") {
        const T = new Set([s]), st = { e: {}, n: { [s]: "done" } }, rows = [];
        let total = 0;
        const tbl = () => rows.length ? `<table class="vz-tbl"><tr><th>步</th><th>邊</th><th>權重</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>總權重 ${total}` : "";
        snap(st, `從 ${s} 開始，樹裡只有 ${s}（綠色）。每一步加「一端在樹內、一端在樹外」的邊裡最便宜的那條。`, "");
        while (T.size < V.length) {
          const cand = E.filter(e => T.has(e.u) !== T.has(e.v));
          if (!cand.length) { snap(st, `剩下的點連不到，這張圖不連通。`, tbl()); break; }
          const best = cand.reduce((a, b) => (b.w < a.w ? b : a));
          const st2 = { e: { ...st.e }, n: { ...st.n } };
          cand.forEach(e => { st2.e[e.id] = "cand"; });
          snap(st2, `樹內：{${[...T].join(", ")}}。跨出去的邊（虛線）：${cand.map(e => `${nm(e)} ${e.w}`).join("、")}。最小的是 <b>${nm(best)} ${best.w}</b>。`, tbl());
          const nx = T.has(best.u) ? best.v : best.u;
          T.add(nx); total += best.w; rows.push([nm(best), best.w]);
          st.e[best.id] = "on"; st.n[nx] = "done";
          E.forEach(e => { if (T.has(e.u) && T.has(e.v) && st.e[e.id] !== "on") st.e[e.id] = "skip"; });
          snap({ e: st.e, n: { ...st.n, [nx]: "cur" } }, `加入 ${nm(best)}（${best.w}），${nx} 進到樹裡。兩端都在樹內的其他邊（淡掉的）以後都不能用，會成環。`, tbl());
        }
        snap(st, `完成：加入的邊依序是 ${rows.map(r => r[1]).join(", ")}，總權重 <b>${total}</b>。`, tbl());
      } else if (v.algo === "kruskal") {
        const sorted = E.slice().sort((a, b) => a.w - b.w || a.id - b.id);
        const par = new Map(V.map(x => [x, x]));
        const find = x => (par.get(x) === x ? x : find(par.get(x)));
        const st = { e: {}, n: {} }, state = {};
        let taken = 0, total = 0;
        const chips = () => `<div class="vz-chips">${sorted.map(e => `<span class="vz-chip ${state[e.id] || ""}">${nm(e)} ${e.w}</span>`).join("")}</div>`;
        snap(st, `Kruskal：先把所有邊照權重由小到大排好（下面那排），依序考慮，<b>會成環的跳過</b>。`, chips());
        for (const e of sorted) {
          if (taken === V.length - 1) break;
          const a = find(e.u), b = find(e.v);
          if (a !== b) {
            par.set(a, b); taken++; total += e.w;
            st.e[e.id] = "on"; st.n[e.u] = st.n[e.v] = "done"; state[e.id] = "on";
            snap(st, `${nm(e)} ${e.w}：${e.u}、${e.v} 還沒連通 → <b>加入</b>（第 ${taken} 條）。`, chips());
          } else {
            st.e[e.id] = "skip"; state[e.id] = "skip";
            snap({ e: { ...st.e, [e.id]: "bad" }, n: st.n }, `${nm(e)} ${e.w}：${e.u}、${e.v} 已經用加過的邊連通了，再加會成環 → <b>跳過</b>。`, chips());
          }
        }
        snap(st, `已經有 V−1 ＝ ${V.length - 1} 條邊，完成。加入順序 ${sorted.filter(e => state[e.id] === "on").map(e => e.w).join(", ")}，總權重 <b>${total}</b>。`, chips());
      } else {
        const dist = new Map(V.map(x => [x, Infinity])), prev = new Map(), prevE = new Map(), fixed = new Set();
        dist.set(s, 0);
        const fmt = d => (d === Infinity ? "∞" : String(d));
        const note = () => Object.fromEntries(V.map(x => [x, fmt(dist.get(x))]));
        const tbl = () => `<table class="vz-tbl"><tr><th>點</th>${V.map(x => `<th>${x}</th>`).join("")}</tr><tr><td>距離</td>${V.map(x => `<td>${fixed.has(x) ? `<b>${fmt(dist.get(x))}</b>` : fmt(dist.get(x))}</td>`).join("")}</tr><tr><td>前一點</td>${V.map(x => `<td>${prev.get(x) || "—"}</td>`).join("")}</tr></table>`;
        const st = { e: {}, n: {} };
        snap({ ...st, note: note() }, `起點 ${s} 的距離是 0，其他點先當成 ∞（節點旁的數字是目前知道的最短距離）。`, tbl());
        for (;;) {
          let u = null;
          V.forEach(x => { if (!fixed.has(x) && dist.get(x) < Infinity && (u === null || dist.get(x) < dist.get(u))) u = x; });
          if (u === null) break;
          fixed.add(u); st.n[u] = "done";
          if (prevE.has(u)) st.e[prevE.get(u)] = "on";
          snap({ e: st.e, n: { ...st.n, [u]: "cur" }, note: note() }, `還沒確定的點裡，<b>${u}</b> 的距離最小（${dist.get(u)}）→ 確定 ${u}（綠色），之後不會再變。用它更新鄰居。`, tbl());
          E.filter(e => e.u === u || e.v === u).forEach(e => {
            const w = e.u === u ? e.v : e.u;
            if (fixed.has(w)) return;
            const nd = dist.get(u) + e.w, old = dist.get(w);
            const better = nd < old;
            if (better) { dist.set(w, nd); prev.set(w, u); prevE.set(w, e.id); }
            snap({ e: { ...st.e, [e.id]: "cand" }, n: { ...st.n, [u]: "cur", [w]: "cmp" }, note: note() },
              `經過 ${u} 到 ${w}：${dist.get(u)} + ${e.w} = ${nd}，${better ? `比原本的 ${fmt(old)} 小 → <b>更新成 ${nd}</b>，前一點記 ${u}。` : `沒有比原本的 ${fmt(old)} 小 → 不變。`}`, tbl());
          });
        }
        const pathTo = x => { const p = [x]; while (prev.has(p[0])) p.unshift(prev.get(p[0])); return p.join("→"); };
        snap({ ...st, note: note() }, `完成。粗線是最短路徑樹。${V.filter(x => x !== s).map(x => `${x}：${fmt(dist.get(x))}${dist.get(x) < Infinity ? `（${pathTo(x)}）` : ""}`).join("；")}。`, tbl());
      }
      return F;
    }
  };

  /* ---------- stack 輸出順序 ---------- */
  defs.stack = {
    title: "stack：這個輸出順序做得到嗎？",
    fields: [
      { name: "input", label: "push 的順序", def: "ABCD" },
      { name: "output", label: "想要的輸出順序", def: "CBDA" }
    ],
    gen(v) {
      const inp = letters(v.input), want = letters(v.output);
      if (inp.length > 8) throw new Error("最多 8 個");
      if (new Set(inp).size !== inp.length) throw new Error("push 的順序不能有重複");
      if (inp.length !== want.length || [...inp].sort().join() !== [...want].sort().join()) throw new Error("輸出要是 push 那些東西的一種排列");
      const n = inp.length, sy = 96, base = sy + (n - 1) * 46, ox = BW + 40;
      const rest = inp.slice(), stk = [], out = [], ops = [];
      const F = [];
      const snap = (marks, cap) => {
        const items = [
          text("t1", 0, -14, "還沒 push", "vz-sub", "start"),
          zone("zs", -6, sy - 6, BW + 12, n * 46 + 6, "bucket", "stack（上面是 top）"),
          text("t3", ox, base - 22, "輸出", "vz-sub", "start")
        ];
        rest.forEach((s, i) => items.push(box("x" + s, i * STEP, 0, s, marks[s] || "")));
        stk.forEach((s, i) => items.push(box("x" + s, 0, base - i * 46, s, marks[s] || "cmp")));
        out.forEach((s, i) => items.push(box("x" + s, ox + i * STEP, base, s, marks[s] || "done")));
        F.push({ items, cap, info: `操作：${ops.join("、") || "（還沒有）"}` });
      };
      snap({}, `照 ${inp.join("")} 的順序 push，中間隨時可以 pop。要輸出 ${want.join("")}：每次看下一個要輸出的字母在哪裡。`);
      for (const c of want) {
        if (stk[stk.length - 1] === c) {
          stk.pop(); out.push(c); ops.push(`pop ${c}`);
          snap({ [c]: "cur" }, `要輸出 ${c}：${c} 就在 top → <b>pop ${c}</b>。`);
          continue;
        }
        if (rest.includes(c)) {
          while (rest[0] !== c) {
            const x = rest.shift(); stk.push(x); ops.push(`push ${x}`);
            snap({ [x]: "cmp" }, `要輸出 ${c}：${c} 還沒 push，先 <b>push ${x}</b>。`);
          }
          rest.shift(); stk.push(c); ops.push(`push ${c}`);
          snap({ [c]: "cur" }, `<b>push ${c}</b>，現在 ${c} 在 top。`);
          stk.pop(); out.push(c); ops.push(`pop ${c}`);
          snap({ [c]: "cur" }, `<b>pop ${c}</b>，輸出 ${c}。`);
          continue;
        }
        const above = stk.slice(stk.indexOf(c) + 1).reverse();
        const m = { [c]: "bad" };
        above.forEach(x => { m[x] = "cur"; });
        snap(m, `要輸出 <b>${c}</b>，但 ${c} 已經在 stack 裡，上面還壓著 ${above.join("、")}。stack 只能拿最上面的 → <b>${want.join("")} 不可能</b>。`);
        return F;
      }
      snap({}, `全部輸出完，<b>${want.join("")} 做得到</b>。`);
      return F;
    }
  };

  /* ---------- 遞迴呼叫樹 ---------- */
  defs.calltree = {
    title: "遞迴呼叫樹：費氏數列 f(n) ＝ f(n−1) ＋ f(n−2)",
    fields: [
      { name: "n", label: "n（1 到 6）", def: "5", mode: "numeric" },
      { name: "memo", label: "寫法", def: "plain", type: "select", options: [["plain", "直接遞迴"], ["memo", "算過就記在表裡（DP／memoization）"]] }
    ],
    gen(v) {
      const N = Number(v.n);
      if (!Number.isInteger(N) || N < 1 || N > 6) throw new Error("n 要是 1 到 6 的整數");
      const memo = v.memo === "memo", table = new Map();
      let id = 0;
      const ev = [];
      const build = (n, depth) => {
        const c = { id: id++, n, depth, kids: [], val: 0, hit: false };
        ev.push(["in", c]);
        if (memo && table.has(n)) { c.hit = true; c.val = table.get(n); ev.push(["out", c]); return c; }
        if (n <= 1) c.val = 1;
        else {
          c.kids.push(build(n - 1, depth + 1));
          c.kids.push(build(n - 2, depth + 1));
          c.val = c.kids[0].val + c.kids[1].val;
        }
        if (memo) table.set(n, c.val);
        ev.push(["out", c]);
        return c;
      };
      const root = build(N, 0);
      let leaf = 0;
      const X = new Map();
      (function place(c) {
        if (!c.kids.length) { X.set(c.id, leaf++ * 54); return; }
        c.kids.forEach(place);
        X.set(c.id, (X.get(c.kids[0].id) + X.get(c.kids[c.kids.length - 1].id)) / 2);
      })(root);
      const F = [], shown = new Map(), seenN = new Map();
      let calls = 0;
      const snap = (cur, cap) => {
        const items = [];
        shown.forEach((st, cid) => {
          const c = st.c;
          const x = X.get(cid), y = c.depth * 74;
          if (c.parent) items.push(edge("e" + cid, X.get(c.parent.id) + BW / 2, c.parent.depth * 74 + BH, x + BW / 2, y));
          const cls = cid === cur ? "cur" : c.hit ? "memo" : st.dup ? "dup" : st.ret ? "done" : "";
          items.push(box("c" + cid, x, y, `f(${c.n})`, cls, { sub: st.ret ? `= ${c.val}` : "" }));
        });
        F.push({ items, cap, info: `目前呼叫了 <b>${calls}</b> 次` });
      };
      (function link(c) { c.kids.forEach(k => { k.parent = c; link(k); }); })(root);
      for (const [type, c] of ev) {
        if (type === "in") {
          calls++;
          const dup = seenN.has(c.n);
          seenN.set(c.n, (seenN.get(c.n) || 0) + 1);
          shown.set(c.id, { c, dup, ret: false });
          if (c.hit) { shown.get(c.id).ret = true; snap(c.id, `呼叫 f(${c.n})：表裡已經有 f(${c.n}) ＝ ${c.val} → <b>直接查表回傳</b>，不再往下呼叫。`); continue; }
          if (c.n <= 1) { shown.get(c.id).ret = true; snap(c.id, `呼叫 f(${c.n})：n ≤ 1，直接回傳 1。${dup && !memo ? `（f(${c.n}) 之前已經算過了，這是重複的計算，橘色）` : ""}`); continue; }
          snap(c.id, `呼叫 f(${c.n})：要先算 f(${c.n - 1}) 和 f(${c.n - 2})。${dup && !memo ? `<b>f(${c.n}) 之前已經算過一次了</b>，又要整棵重算（橘色）。` : ""}`);
        } else if (c.kids.length) {
          shown.get(c.id).ret = true;
          snap(c.id, `f(${c.n}) ＝ f(${c.n - 1}) ＋ f(${c.n - 2}) ＝ ${c.kids[0].val} ＋ ${c.kids[1].val} ＝ <b>${c.val}</b>，回傳給上一層。${memo ? `記進表裡：f(${c.n}) ＝ ${c.val}。` : ""}`);
        }
      }
      const cnt = [...seenN.entries()].sort((a, b) => b[0] - a[0]).map(([k, c]) => `f(${k}) ${c} 次`).join("、");
      snap(-1, memo
        ? `f(${N}) ＝ ${root.val}。有記錄時只呼叫了 <b>${calls}</b> 次：每個 f(k) 只真正算一次，第二次遇到直接查表（綠色虛線）。`
        : `f(${N}) ＝ ${root.val}，一共呼叫 <b>${calls}</b> 次（${cnt}）。同一個 f(k) 被重算很多次，這就是要用 DP 記下來的原因。`);
      return F;
    }
  };

  /* ---------- cache 模擬 ---------- */
  defs.cache = {
    title: "cache 模擬：位址切割、hit／miss、替換",
    fields: [
      { name: "addrs", label: "依序存取的位址", def: "45,109,45" },
      { name: "unit", label: "位址單位", def: "byte", type: "select", options: [["byte", "byte address"], ["word", "word address"]] },
      { name: "block", label: "block 大小（幾個 byte 或 word）", def: "4", mode: "numeric" },
      { name: "sets", label: "set 數（fully associative 填 1）", def: "4", mode: "numeric" },
      { name: "ways", label: "每個 set 幾格（direct-mapped 填 1）", def: "1", mode: "numeric" },
      { name: "policy", label: "set 滿了踢誰", def: "lru", type: "select", options: [["lru", "LRU：最久沒用的"], ["fifo", "FIFO：最早放進來的"]] }
    ],
    gen(v) {
      const addrs = nums(v.addrs, "位址", { int: true, max: 24 });
      const B = Number(v.block), S = Number(v.sets), W = Number(v.ways);
      const p2 = x => Number.isInteger(x) && x >= 1 && (x & (x - 1)) === 0;
      if (!p2(B) || !p2(S) || !p2(W)) throw new Error("block 大小、set 數、每個 set 的格數都要是 2 的次方（1、2、4、8…）");
      if (S > 16 || W > 8 || S * W > 32) throw new Error("cache 太大畫不下：set 數最多 16、每個 set 最多 8 格、總共最多 32 格");
      const ob = Math.log2(B), ib = Math.log2(S), u = v.unit === "word" ? "word" : "byte";
      const nb = Math.max(ob + ib + 2, Math.ceil(Math.log2(Math.max(...addrs) + 1)));
      const tb = nb - ob - ib;
      const sets = Array.from({ length: S }, () => []);
      const seen = new Set(), hist = [];
      let clock = 0, hits = 0;
      const CW = 62, CX = 64, ty = 104, RH = 46;
      const F = [];
      const parts = a => {
        const s = a.toString(2).padStart(nb, "0");
        return { t: s.slice(0, tb), i: s.slice(tb, tb + ib), o: s.slice(tb + ib) };
      };
      const snap = (cur, marks, cap) => {
        const items = [];
        if (cur != null) {
          const p = parts(cur);
          let x = 0;
          items.push(text("aa", 0, -16, `位址 ${cur} 的二進位`, "vz-sub", "start"));
          [["tag", p.t, "cmp"], ["index", p.i, "cur"], ["offset", p.o, ""]].forEach(([nm, bits, cls]) => {
            if (!bits.length) return;
            const w = Math.max(70, bits.length * 10 + 18);
            items.push(box("ad-" + nm, x, 0, bits, cls, { w, sub: nm }));
            x += w + 6;
          });
          if (!ib) items.push(text("ad-noi", x + 4, BH / 2, "沒有 index（只有 1 個 set）", "vz-sub", "start"));
        }
        for (let w = 0; w < W; w++) items.push(text("hw" + w, CX + w * (CW + 6) + CW / 2, ty - 14, W > 1 ? `way ${w}` : "tag", "vz-sub"));
        for (let s = 0; s < S; s++) {
          items.push(text("hs" + s, 0, ty + s * RH + BH / 2, `set ${s}`, "vz-sub", "start"));
          for (let w = 0; w < W; w++) {
            const e = sets[s][w];
            items.push(box(`c${s}-${w}`, CX + w * (CW + 6), ty + s * RH, e ? String(e.tag) : "", marks[`${s}-${w}`] || (e ? "" : "slot"), { w: CW }));
          }
        }
        const chips = hist.map(h => `<span class="vz-chip ${h[1] ? "hit" : "on"}">${h[0]} ${h[1] ? "H" : "M"}</span>`).join("");
        F.push({ items, cap, info: `<div class="vz-chips">${chips || "（還沒有存取）"}</div>hit ${hits} 次、miss ${hist.length - hits} 次（cache 格子裡寫的是 tag）` });
      };
      snap(null, {}, `${u} address，block ${B} 個 ${u} → offset ${ob} 位元；${S} 個 set → index ${ib} 位元；其他 ${tb} 位元是 tag。` + (S === 1 ? "（fully associative）" : W === 1 ? "（direct-mapped）" : `（${W}-way set-associative）`));
      for (const a of addrs) {
        const blk = Math.floor(a / B), idx = blk % S, tag = Math.floor(blk / S);
        const how = (B > 1 ? `block 位址 ＝ ⌊${a}/${B}⌋ ＝ ${blk}，` : `block 位址 ＝ ${blk}，`) +
          (S > 1 ? `index ＝ ${blk} mod ${S} ＝ <b>${idx}</b>，tag ＝ ⌊${blk}/${S}⌋ ＝ <b>${tag}</b>` : `只有 1 個 set，tag ＝ block 位址 ＝ <b>${tag}</b>`);
        const m0 = {};
        for (let w = 0; w < W; w++) m0[`${idx}-${w}`] = "cmp";
        snap(a, m0, `存取 <b>${a}</b>：${how}。到 set ${idx} 找 tag ${tag}。`);
        clock++;
        const row = sets[idx];
        const hw = row.findIndex(e => e && e.tag === tag);
        if (hw >= 0) {
          hits++; hist.push([a, true]);
          if (v.policy !== "fifo") row[hw].used = clock;
          snap(a, { [`${idx}-${hw}`]: "done" }, `set ${idx} 裡有 tag ${tag} → <b>hit</b>。` + (v.policy !== "fifo" && W > 1 ? "（LRU：它變成最近用過的）" : ""));
          seen.add(blk);
          continue;
        }
        hist.push([a, false]);
        const kind = !seen.has(blk) ? "第一次用到這個 block，是 compulsory miss" : "這個 block 之前用過但被踢掉了";
        seen.add(blk);
        let w = -1;
        for (let k = 0; k < W; k++) if (!row[k]) { w = k; break; }
        if (w >= 0) {
          row[w] = { tag, blk, used: clock, put: clock };
          snap(a, { [`${idx}-${w}`]: "cur" }, `set ${idx} 沒有 tag ${tag} → <b>miss</b>（${kind}）。從記憶體搬 block ${blk} 進來，放進空的${W > 1 ? ` way ${w}` : "格子"}。`);
        } else {
          const key = v.policy === "fifo" ? "put" : "used";
          w = 0;
          for (let k = 1; k < W; k++) if (row[k][key] < row[w][key]) w = k;
          const old = row[w];
          const emptyElse = !kind.startsWith("第一次") && sets.some((r, s) => s !== idx && r.filter(Boolean).length < W);
          row[w] = { tag, blk, used: clock, put: clock };
          snap(a, { [`${idx}-${w}`]: "bad" }, `set ${idx} 沒有 tag ${tag} → <b>miss</b>（${kind}）。set ${idx} 已經滿了，` +
            (W > 1 ? `${v.policy === "fifo" ? "最早放進來" : "最久沒用"}的是 way ${w} 的 tag ${old.tag}` : `只好把原本的 tag ${old.tag}`) +
            `（block ${old.blk}）踢掉，換成 tag ${tag}。` + (emptyElse ? "其他 set 明明還有空位，這叫 <b>conflict miss</b>。" : ""));
        }
      }
      snap(null, {}, `做完了：hit ${hits} 次、miss ${addrs.length - hits} 次，hit rate ${hits}/${addrs.length}。可以把 set 數或每個 set 的格數改掉，看 miss 怎麼變。`);
      return F;
    }
  };

  /* ---------- 分頁置換 ---------- */
  defs.paging = {
    title: "page 置換：FIFO／LRU／OPT",
    fields: [
      { name: "refs", label: "page 存取順序", def: "7,0,1,2,0,3,0,4" },
      { name: "frames", label: "frame 數", def: "3", mode: "numeric" },
      { name: "algo", label: "置換策略", def: "fifo", type: "select", options: [["fifo", "FIFO：踢最早進來的"], ["lru", "LRU：踢最久沒用到的"], ["opt", "OPT：踢未來最晚才用到的"]] }
    ],
    gen(v) {
      const refs = nums(v.refs, "存取順序", { int: true, max: 30 });
      const K = Number(v.frames);
      if (!Number.isInteger(K) || K < 1 || K > 6) throw new Error("frame 數要是 1 到 6");
      const algo = v.algo, name = { fifo: "FIFO", lru: "LRU", opt: "OPT" }[algo];
      const fr = new Array(K).fill(null);
      const res = [];
      let faults = 0;
      const FW = 76, RW = 30, RS = 34, PER = 11, ry = 112;
      const note = (slot, t) => {
        const e = fr[slot];
        if (!e) return "";
        if (algo === "fifo") return `#${e.in + 1} 進來`;
        if (algo === "lru") return `上次用 #${e.last + 1}`;
        const nx = refs.indexOf(e.p, t + 1);
        return nx < 0 ? "不再用" : `下次用 #${nx + 1}`;
      };
      const F = [];
      const snap = (t, marks, cap) => {
        const items = [text("hf", 0, -16, `記憶體裡的 ${K} 個 frame`, "vz-sub", "start")];
        for (let s = 0; s < K; s++) {
          const e = fr[s];
          items.push(box("f" + s, s * (FW + 8), 0, e ? String(e.p) : "", marks["f" + s] || (e ? "" : "slot"), { w: FW, sub: note(s, t) }));
        }
        items.push(text("hr", 0, ry - 30, "存取順序（上面是第幾個，下面 F ＝ page fault）", "vz-sub", "start"));
        refs.forEach((p, i) => {
          const x = (i % PER) * RS, y = ry + Math.floor(i / PER) * 74;
          items.push(text("ri" + i, x + RW / 2, y - 9, "#" + (i + 1), "vz-sub"));
          items.push(box("r" + i, x, y, String(p), i === t ? "cur" : i < t ? (res[i] ? "bad" : "done") : "dim", { w: RW, h: 30, sub: i <= t && res[i] != null ? (res[i] ? "F" : "hit") : "" }));
        });
        F.push({ items, cap, info: `page fault：<b>${faults}</b> 次` + (t >= 0 ? `（已處理 ${Math.min(t + 1, refs.length)}／${refs.length} 個）` : "") });
      };
      snap(-1, {}, `${K} 個 frame 一開始都是空的。${name}：${{ fifo: "frame 滿了就踢掉最早進來的那一頁。", lru: "frame 滿了就踢掉最久沒被用到的那一頁。", opt: "frame 滿了就踢掉「未來最晚才會用到（或再也不用）」的那一頁。這是理論最佳，實際上做不到，因為不知道未來。" }[algo]}`);
      refs.forEach((p, t) => {
        const hit = fr.findIndex(e => e && e.p === p);
        if (hit >= 0) {
          res[t] = false;
          if (algo === "lru") fr[hit].last = t;
          snap(t, { ["f" + hit]: "done" }, `存取 ${p}：已經在 frame 裡 → <b>hit</b>，不用載入。` + (algo === "lru" ? "（LRU：更新它的「上次用」）" : ""));
          return;
        }
        res[t] = true; faults++;
        const empty = fr.findIndex(e => !e);
        if (empty >= 0) {
          fr[empty] = { p, in: t, last: t };
          snap(t, { ["f" + empty]: "cur" }, `存取 ${p}：不在記憶體 → <b>page fault</b>，還有空的 frame，直接放進去。`);
          return;
        }
        let vi = 0;
        const score = s => {
          const e = fr[s];
          if (algo === "fifo") return -e.in;
          if (algo === "lru") return -e.last;
          const nx = refs.indexOf(e.p, t + 1);
          return nx < 0 ? Infinity : nx;
        };
        for (let s = 1; s < K; s++) if (score(s) > score(vi)) vi = s;
        const old = fr[vi].p;
        const why = { fifo: `最早進來的是 ${old}`, lru: `最久沒被用到的是 ${old}`, opt: refs.indexOf(old, t + 1) < 0 ? `${old} 之後再也不會用到` : `${old} 是所有 frame 裡最晚才會再用到的（第 ${refs.indexOf(old, t + 1) + 1} 個）` }[algo];
        snap(t, { ["f" + vi]: "bad" }, `存取 ${p}：不在記憶體 → <b>page fault</b>。frame 都滿了，${why} → 踢掉 ${old}。`);
        fr[vi] = { p, in: t, last: t };
        snap(t, { ["f" + vi]: "cur" }, `把 ${p} 載入剛空出來的 frame。`);
      });
      snap(refs.length, {}, `${name} 一共 <b>${faults}</b> 次 page fault。換一種策略或改 frame 數比較看看（FIFO 用 1,2,3,4,1,2,5,1,2,3,4,5 試 3 和 4 個 frame，會看到 Belady's anomaly）。`);
      return F;
    }
  };

  /* ---------- CPU 排程 ---------- */
  defs.sched = {
    title: "CPU 排程：畫 Gantt chart",
    fields: [
      { name: "procs", label: "行程（名稱 到達時間 burst [priority]，用逗號隔開）", def: "P1 0 10 3, P2 0 1 1, P3 0 2 3, P4 0 1 4, P5 0 5 2" },
      { name: "algo", label: "演算法", def: "rr", type: "select", options: [["fcfs", "FCFS：先來先做"], ["sjf", "SJF：burst 最短的先做（不搶）"], ["srtf", "SRTF：剩餘時間最短的先做（會搶）"], ["pri", "Priority：數字小的先做（不搶）"], ["ppri", "Priority：數字小的先做（會搶）"], ["rr", "Round Robin"]] },
      { name: "q", label: "RR 的 time quantum", def: "1", mode: "numeric" }
    ],
    gen(v) {
      const P = v.procs.split(/[,，;；\n]+/).map(s => s.trim()).filter(Boolean).map((s, i) => {
        const a = s.split(/\s+/);
        const o = { n: a[0], at: Number(a[1]), bt: Number(a[2]), pr: a[3] != null ? Number(a[3]) : 0, i };
        if (a.length < 3 || ![o.at, o.bt, o.pr].every(Number.isFinite) || o.bt <= 0 || o.at < 0) throw new Error(`看不懂「${s}」，請寫成「P1 0 10」或「P1 0 10 3」`);
        o.rem = o.bt;
        return o;
      });
      if (!P.length || P.length > 8) throw new Error("行程要 1 到 8 個");
      const total = Math.max(...P.map(p => p.at)) + P.reduce((s, p) => s + p.bt, 0);
      if (total > 60) throw new Error("總時間太長了（最多 60）");
      const q = Number(v.q), algo = v.algo;
      if (algo === "rr" && (!Number.isInteger(q) || q < 1)) throw new Error("quantum 要是正整數");
      const U = Math.max(14, Math.min(30, Math.floor(400 / total)));
      const segs = [], F = [];
      let t = 0;
      const gy = 22, qy = 112;
      const fmtQ = list => (list.length ? list.map(p => p.n).join("、") : "（空）");
      const snap = (ready, mark, cap) => {
        const items = [text("hg", 0, gy - 18, "Gantt chart", "vz-sub", "start")];
        const ticks = new Set([0]);
        segs.forEach((s, k) => {
          items.push(box("g" + k, s.a * U, gy, s.p ? s.p.n : "閒置", k === segs.length - 1 && mark ? "cur" : s.p ? "" : "slot", { w: Math.max(1, (s.b - s.a) * U), h: 36 }));
          ticks.add(s.b);
        });
        ticks.forEach(x => items.push(text("t" + x, x * U, gy + 50, String(x), "vz-sub")));
        items.push(text("hq", 0, qy - 14, algo === "rr" ? "ready queue（左邊是前面）" : "ready queue", "vz-sub", "start"));
        ready.forEach((p, k) => items.push(box("q" + p.n, k * STEP, qy, p.n, "cmp", { sub: `剩 ${p.rem}` })));
        F.push({ items, cap });
      };
      const arrived = (from, to) => P.filter(p => p.at > from && p.at <= to);
      const key = { fcfs: p => [p.at, p.i], sjf: p => [p.bt, p.at, p.i], srtf: p => [p.rem, p.at, p.i], pri: p => [p.pr, p.at, p.i], ppri: p => [p.pr, p.at, p.i] }[algo];
      const cmp = (a, b) => { const x = key(a), y = key(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
      const rule = { fcfs: "最早到的", sjf: "burst 最短的", srtf: "剩餘時間最短的", pri: "priority 數字最小的", ppri: "priority 數字最小的" }[algo];
      const run = (p, a, b) => {
        const last = segs[segs.length - 1];
        if (last && last.p === p && last.b === a) last.b = b; else segs.push({ p, a, b });
        p.rem -= b - a;
        if (p.first == null) p.first = a;
        if (!p.rem) p.done = b;
      };
      snap([], false, `${P.length} 個行程。${algo === "rr" ? `Round Robin，每次最多跑 ${q} 個時間單位，沒跑完就排到 queue 最後面。` : `每次從已經到達的行程裡挑${rule}。`}`);
      if (algo === "rr") {
        const qu = [];
        P.filter(p => p.at <= 0).sort((a, b) => a.at - b.at || a.i - b.i).forEach(p => qu.push(p));
        while (P.some(p => p.rem)) {
          if (!qu.length) {
            const nx = Math.min(...P.filter(p => p.rem && p.at > t).map(p => p.at));
            segs.push({ p: null, a: t, b: nx });
            arrived(t, nx).sort((a, b) => a.at - b.at || a.i - b.i).forEach(p => qu.push(p));
            t = nx;
            snap(qu, false, `CPU 閒置到 ${t}，${fmtQ(qu)} 到達。`);
            continue;
          }
          const p = qu.shift();
          const d = Math.min(q, p.rem), from = t;
          run(p, t, t + d);
          t += d;
          const nw = arrived(from, t).sort((a, b) => a.at - b.at || a.i - b.i);
          nw.forEach(x => qu.push(x));
          if (p.rem) qu.push(p);
          snap(qu, true, `時間 ${from}–${t}：從 queue 前面拿出 <b>${p.n}</b> 跑 ${d}。` + (nw.length ? `這段時間 ${nw.map(x => x.n).join("、")} 到達，排到後面。` : "") + (p.rem ? `${p.n} 還剩 ${p.rem}，排回 queue 最後面。` : `${p.n} 做完了（完成時間 ${t}）。`));
        }
      } else {
        const pre = algo === "srtf" || algo === "ppri";
        while (P.some(p => p.rem)) {
          const ready = P.filter(p => p.rem && p.at <= t).sort(cmp);
          if (!ready.length) {
            const nx = Math.min(...P.filter(p => p.rem).map(p => p.at));
            segs.push({ p: null, a: t, b: nx });
            t = nx;
            snap(P.filter(p => p.rem && p.at <= t).sort(cmp), false, `沒有行程可以跑，CPU 閒置到 ${t}。`);
            continue;
          }
          const p = ready[0];
          let end = t + p.rem;
          if (pre) {
            const nxt = P.filter(x => x.rem && x.at > t).map(x => x.at);
            if (nxt.length) end = Math.min(end, Math.min(...nxt));
          }
          const from = t, others = ready.slice(1);
          run(p, t, end);
          t = end;
          const why = others.length ? `ready 裡有 ${ready.map(x => `${x.n}（${algo === "srtf" ? "剩 " + (x === p ? x.rem + (end - from) : x.rem) : algo === "sjf" ? "burst " + x.bt : algo === "fcfs" ? "到達 " + x.at : "priority " + x.pr}）`).join("、")}，挑${rule} → ` : "";
          snap(P.filter(x => x.rem && x.at <= t && x !== p).sort(cmp), true,
            `時間 ${from}–${t}：${why}<b>${p.n}</b>。` + (p.rem ? `${t} 時有新行程到達，重新比較（${p.n} 還剩 ${p.rem}）。` : `${p.n} 做完了（完成時間 ${t}）。`));
        }
      }
      const rows = P.map(p => ({ n: p.n, done: p.done, ta: p.done - p.at, w: p.done - p.at - p.bt, rs: p.first - p.at }));
      const avg = k => (rows.reduce((s, r) => s + r[k], 0) / rows.length);
      const f2 = x => (Number.isInteger(x) ? String(x) : x.toFixed(2));
      const tbl = `<table class="vz-tbl"><tr><th>行程</th><th>完成</th><th>turnaround</th><th>waiting</th><th>response</th></tr>${rows.map(r => `<tr><td>${r.n}</td><td>${r.done}</td><td>${r.ta}</td><td>${r.w}</td><td>${r.rs}</td></tr>`).join("")}<tr><td>平均</td><td></td><td>${f2(avg("ta"))}</td><td><b>${f2(avg("w"))}</b></td><td>${f2(avg("rs"))}</td></tr></table>turnaround ＝ 完成 − 到達；waiting ＝ turnaround − burst；response ＝ 第一次執行 − 到達`;
      snap([], false, `全部做完。平均 waiting time ＝ <b>${f2(avg("w"))}</b>，平均 turnaround ＝ ${f2(avg("ta"))}。`);
      F[F.length - 1].info = tbl;
      return F;
    }
  };

  hosts.forEach(h => {
    const def = defs[h.dataset.viz];
    if (!def) { h.textContent = `（找不到動畫：${h.dataset.viz}）`; return; }
    // 每個動畫有自己的欄位設定（cur 會被改），所以複製一份
    new Player(h, { ...def, fields: def.fields.map(f => ({ ...f })) });
  });
})();
