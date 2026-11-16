/* 資料結構動畫：在 Markdown 裡寫
 *   <div class="viz" data-viz="heap" data-nums="14,4,19,2,18,7,17,9,16,13"></div>
 * 就會出現一個可以一步一步播放、也可以改輸入資料的動畫。
 * data-* 屬性會蓋掉該動畫欄位的預設值（欄位名稱見下面每個 defs.xxx.fields）。
 *
 * 畫面是 SVG，每個方塊／節點都有固定的 key，換下一步時同一個 key 的元素會「移動」過去，
 * 所以交換、旋轉、放進桶子都看得到東西在動。
 * 加 data-static 就只畫一張圖（沒有輸入欄和播放鍵），例如 data-viz="graph" data-algo="show"。
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
      // data-static：只是一張圖，不要輸入欄和播放鍵
      const still = host.dataset.static != null;
      if (still) host.classList.add("vz-static");
      const fields = def.fields.map(f => {
        const v = host.dataset[f.name] != null ? host.dataset[f.name] : f.def;
        f.cur = v;
        if (f.type === "select") {
          return `<label>${esc(f.label)}<select name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}"${o[0] === v ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select></label>`;
        }
        return `<label>${esc(f.label)}<input name="${f.name}" value="${esc(v)}" autocomplete="off" spellcheck="false" inputmode="${f.mode || "text"}"></label>`;
      }).join("");
      host.innerHTML =
        `<div class="vz-head"><span class="vz-tag">${still ? "圖" : "動畫"}</span>${esc(host.dataset.title || def.title)}</div>` +
        `<form class="vz-form">${fields}<div class="vz-formbtn"><button type="submit">用這些數字重播</button><button type="button" data-a="reset">還原</button></div></form>` +
        `<div class="vz-stage"><svg class="vz-svg" xmlns="${NS}" role="img" aria-label="${esc(def.title)}"><g class="vz-back"></g><g class="vz-front"></g></svg></div>` +
        `<div class="vz-legend" hidden></div>` +
        `<div class="vz-ctrl">` +
          `<button type="button" data-a="first" aria-label="回到第一步" title="回到第一步">${I("first")}</button>` +
          `<button type="button" data-a="prev">${I("prev")}<span>上一步</span></button>` +
          `<button type="button" data-a="play" class="vz-play" aria-pressed="false">${I("play")}<span>自動播放</span></button>` +
          `<button type="button" data-a="next" class="vz-next"><span>下一步</span>${I("next")}</button>` +
          `<span class="vz-count"></span>` +
          `<input type="range" class="vz-range" min="0" max="0" value="0" aria-label="跳到第幾步">` +
        `</div>` +
        `<div class="vz-cap" aria-live="polite"></div>` +
        `<details class="vz-code" hidden><summary>虛擬碼（正在做的那一行會標亮）</summary><ol class="vz-lines"></ol></details>` +
        `<div class="vz-info"></div>`;
      this.form = host.querySelector("form");
      this.svg = host.querySelector("svg");
      this.back = host.querySelector(".vz-back");
      this.front = host.querySelector(".vz-front");
      this.cap = host.querySelector(".vz-cap");
      this.legend = host.querySelector(".vz-legend");
      this.code = host.querySelector(".vz-code");
      this.lines = host.querySelector(".vz-lines");
      // 收合狀態大家共用：收起一個，之後打開的頁面也是收起來的
      let open = true;
      try { open = localStorage.getItem("cgep:vzcode") !== "0"; } catch (e) { /* 沒有 localStorage 也照常顯示 */ }
      this.code.open = open;
      this.code.addEventListener("toggle", () => { try { localStorage.setItem("cgep:vzcode", this.code.open ? "1" : "0"); } catch (e) { /* ignore */ } });
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
      this.svg.style.minWidth = Math.round(w * 0.57) + "px";
      this.svg.style.maxWidth = Math.round(w * 1.15) + "px";
      this.range.max = frames.length - 1;
      // 圖例：每個動畫只列它用到的顏色，以及在這個動畫裡代表什麼
      const lg = typeof this.def.legend === "function" ? this.def.legend(this.values()) : this.def.legend;
      this.legend.innerHTML = (lg || []).map(([kind, c, t]) => kind === "t"
        ? `<span class="vz-key t-${c}"><b>7</b>${esc(t)}</span>`
        : `<span class="vz-key ${kind}-${c}"><i></i>${esc(t)}</span>`).join("");
      this.legend.hidden = !(lg && lg.length) || this.host.classList.contains("vz-static");
      // 虛擬碼：// 後面是註解
      const code = typeof this.def.code === "function" ? this.def.code(this.values()) : this.def.code;
      this.lines.innerHTML = (code || []).map(l => {
        const k = l.indexOf("//");
        return `<li><span>${k < 0 ? esc(l) : esc(l.slice(0, k)) + `<span class="c">${esc(l.slice(k))}</span>`}</span></li>`;
      }).join("");
      this.code.hidden = !(code && code.length) || this.host.classList.contains("vz-static");
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
      const on = new Set([].concat(fr.line == null ? [] : fr.line));
      this.lines.querySelectorAll("li").forEach((li, k) => {
        li.classList.toggle("on", on.has(k));
        if (on.has(k)) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
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
    code: [
      "for i = 1 to n-1",
      "  key = a[i]  // 拿起來",
      "  j = i",
      "  while j > 0 and a[j-1] > key",
      "    swap a[j-1], a[j]",
      "    j = j - 1"
    ],
    fields: [{ name: "nums", label: "數列", def: "3,9,6,5,8,2" }],
    gen(v) {
      const a = nums(v.nums, "數列", { max: 12 }).map((x, id) => ({ id, x }));
      let inv = 0;
      for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i].x > a[j].x) inv++;
      const F = [], done = new Set([a[0].id]);
      let swaps = 0, ln = null;
      const snap = (marks, cap) => {
        const items = [];
        a.forEach((o, i) => {
          items.push(box("b" + o.id, i * STEP, 0, o.x, marks[o.id] || (done.has(o.id) ? "done" : "")));
          items.push(text("i" + i, i * STEP + BW / 2, BH + 16, `[${i}]`, "vz-sub"));
        });
        F.push({ items, cap, info: `swap 次數：<b>${swaps}</b>　（原數列的逆序對共 ${inv} 個）`, line: ln });
      };
      snap({}, `一開始只有 a[0]＝${a[0].x} 算「已排好」（綠色）。接下來從 a[1] 開始，一個一個拿起來插進綠色那段。`);
      for (let i = 1; i < a.length; i++) {
        const key = a[i];
        ln = [0, 1];
        snap({ [key.id]: "cur" }, `拿起 a[${i}]＝<b>${key.x}</b>（藍色），往左和已排好的數比。`);
        let j = i;
        while (j > 0) {
          const L = a[j - 1];
          if (L.x > key.x) {
            a[j - 1] = key; a[j] = L; swaps++; j--;
            ln = [4, 5];
            snap({ [key.id]: "cur", [L.id]: "cmp" }, `${L.x} &gt; ${key.x} → 交換，${key.x} 往前一格（這是第 ${swaps} 次 swap）。`);
          } else {
            done.add(key.id);
            ln = 3;
            snap({ [key.id]: "cur", [L.id]: "cmp" }, `${L.x} ≤ ${key.x} → 停，${key.x} 插好了。`);
            break;
          }
        }
        if (j === 0) { done.add(key.id); ln = 3; snap({ [key.id]: "cur" }, `${key.x} 已經換到最前面，插好了。`); }
      }
      ln = null;
      snap({}, `排好了。swap 一共 <b>${swaps}</b> 次，剛好等於原數列的逆序對數 ${inv}：每次相鄰交換剛好消掉一個逆序對。`);
      return F;
    }
  };

  /* ---------- heap ---------- */
  // 虛擬碼依「建 heap 的方法」和「要不要做 heap sort」組合；at 記下每一行的位置給動畫標亮
  function heapCode(v) {
    const L = [], at = {};
    const put = (name, s) => { if (name) at[name] = L.length; L.push(s); };
    if (v.build === "insert") {
      put("insFor", "for k = 0 to n-1  // 逐一插入");
      put("insPut", "  i = k  // 先放在最後面");
      put("insWhile", "  while i > 0 and a[i] > a[parent]");
      put("insSwap", "    swap a[i], a[parent]");
      put("insUp", "    i = parent  // 往上一層");
    } else {
      put(null, "// 從最後一個非葉節點往前");
      put("buFor", "for i = n/2-1 downto 0");
      put("buCall", "  siftDown(i, n)");
    }
    if (v.sort === "sort") {
      put(null, "// heap sort");
      put("sortFor", "for end = n-1 downto 1");
      put("sortSwap", "  swap a[0], a[end]  // 最大的到最後");
      put("sortCall", "  siftDown(0, end)");
    }
    if (v.build !== "insert" || v.sort === "sort") {
      put("sdHead", "siftDown(i, n):");
      put("sdWhile", "  while i has a child (2i+1 < n)");
      put("sdLarger", "    c = the larger child of i");
      put("sdStop", "    if a[c] <= a[i]: return");
      put("sdSwap", "    swap a[i], a[c]");
      put("sdMove", "    i = c");
    }
    return { lines: L, at };
  }
  defs.heap = {
    title: "max heap：建 heap 與 heap sort",
    code: v => heapCode(v).lines,
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
      const F = [], C = heapCode(v).at;
      let size = n, built = n, ln = null;
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
        F.push({ items, cap, info: `陣列：${a.map((o, i) => (i < size ? o.x : `<span class="vz-ok">${o.x}</span>`)).join(", ")}`, line: ln });
      };
      const sw = (i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; };
      const siftDown = (i, lim) => {
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          if (l >= lim) { ln = C.sdWhile; snap({ [a[i].id]: "cur" }, `${a[i].x}（index ${i}）沒有子節點了 → 停。`); return; }
          const big = r < lim && a[r].x > a[l].x ? r : l;
          const kids = r < lim ? `${a[l].x}、${a[r].x}` : `${a[l].x}`;
          const m = { [a[i].id]: "cur", [a[l].id]: "cmp" };
          if (r < lim) m[a[r].id] = "cmp";
          if (a[big].x > a[i].x) {
            ln = [C.sdLarger, C.sdSwap];
            snap(m, `${a[i].x}（index ${i}）的子節點是 ${kids}，比較大的是 <b>${a[big].x}</b>，比 ${a[i].x} 大 → 交換。`);
            sw(i, big);
            ln = C.sdMove;
            snap({ [a[big].id]: "cur", [a[i].id]: "cmp" }, `交換完，${a[big].x} 到了 index ${big}，繼續往下檢查。`);
            i = big;
          } else {
            ln = [C.sdLarger, C.sdStop];
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
          ln = [C.insFor, C.insPut];
          snap({ [a[k].id]: "cur" }, `插入 <b>${a[k].x}</b>：先放在最後面（index ${k}）。`);
          let i = k;
          while (i > 0) {
            const p = (i - 1) >> 1;
            if (a[i].x > a[p].x) {
              ln = [C.insWhile, C.insSwap];
              snap({ [a[i].id]: "cur", [a[p].id]: "cmp" }, `${a[i].x} 比父節點 ${a[p].x} 大 → 交換。`);
              sw(i, p); i = p;
              ln = C.insUp;
              snap({ [a[i].id]: "cur" }, `${a[i].x} 往上到 index ${i}。`);
            } else {
              ln = C.insWhile;
              snap({ [a[i].id]: "cur", [a[p].id]: "cmp" }, `${a[i].x} ≤ 父節點 ${a[p].x} → 停。`);
              break;
            }
          }
        }
      } else {
        const last = (n >> 1) - 1;
        snap({}, `先把數列照順序放進完全二元樹（index 0 是根，i 的子節點是 2i+1、2i+2）。這時還不是 heap。最後一個非葉節點是 index ⌊n/2⌋−1 ＝ ${last}，從它開始往前，每個做 sift-down。`);
        for (let i = last; i >= 0; i--) {
          ln = [C.buFor, C.buCall];
          snap({ [a[i].id]: "cur" }, `處理 index ${i}（${a[i].x}）：往下和比較大的子節點比。`);
          siftDown(i, n);
        }
      }
      ln = null;
      snap({}, `max heap 建好了：${a.map(o => o.x).join(", ")}。每個節點都比它的子節點大，最大的 ${a[0].x} 在根。`);
      if (v.sort === "sort") {
        for (let end = n - 1; end >= 1; end--) {
          ln = [C.sortFor, C.sortSwap];
          snap({ [a[0].id]: "cur", [a[end].id]: "cmp" }, `把根（目前最大的 ${a[0].x}）和 heap 的最後一個 ${a[end].x} 交換。`);
          sw(0, end); size = end;
          ln = C.sortCall;
          snap({ [a[0].id]: "cur" }, `${a[end].x} 放到陣列尾端，之後不再動（綠色）。heap 剩 ${end} 個，對新的根 ${a[0].x} 做 sift-down。`);
          siftDown(0, end);
        }
        size = 0;
        ln = null;
        snap({}, `heap sort 完成：${a.map(o => o.x).join(", ")}。`);
      }
      return F;
    }
  };

  /* ---------- LSD radix sort ---------- */
  defs.radix = {
    title: "LSD radix sort：從個位數開始分桶",
    code: [
      "for d = 0 to D-1  // 個位、十位…",
      "  bucket[0..9] = empty",
      "  for each x in a (left to right)",
      "    b = digit d of x",
      "    append x to bucket[b]",
      "  a = bucket[0] + ... + bucket[9]"
    ],
    fields: [{ name: "nums", label: "數列（非負整數）", def: "642,374,73,29,284,252" }],
    gen(v) {
      let a = nums(v.nums, "數列", { int: true, max: 12 }).map((x, id) => ({ id, x }));
      const D = String(Math.max(...a.map(o => o.x))).length;
      const CW = 51, W = 46, RH = 46, NPR = 6, BPR = 5;
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
      let ln = null;
      const bt = Math.ceil(a.length / NPR) * RH + 34, BH2 = maxStack * RH + 6 + 34;
      const bx = b => (b % BPR) * CW, by = b => bt + Math.floor(b / BPR) * BH2;
      const snap = (where, d, cap) => {
        const items = [];
        for (let b = 0; b < 10; b++) items.push(zone("z" + b, bx(b) - 2, by(b), W + 4, maxStack * RH + 6, "bucket", `${b} 號`));
        a.forEach(o => {
          const w = where.get(o.id);
          items.push(box("v" + o.id, w[0], w[1], o.x, w[2] || "", { w: W, html: d >= 0 ? html(o.x, d) : esc(o.x) }));
        });
        F.push({ items, cap, line: ln });
      };
      const rowPos = list => new Map(list.map((o, i) => [o.id, [(i % NPR) * CW, Math.floor(i / NPR) * RH]]));
      snap(rowPos(a), -1, `最大的數有 ${D} 位，所以要做 ${D} 輪。每一輪只看一個位數（橘色），從個位數開始。`);
      for (let d = 0; d < D; d++) {
        const where = rowPos(a);
        ln = [0, 1];
        snap(where, d, `第 ${d + 1} 輪：看<b>${name[d]}</b>。從左到右，一個一個依這一位放進 0–9 號桶。` + (String(Math.max(...a.map(o => o.x))).length > 1 && d > 0 ? "位數不夠的前面補 0（灰色）。" : ""));
        const bk = Array.from({ length: 10 }, () => []);
        for (const o of a) {
          const b = digit(o.x, d);
          bk[b].push(o);
          where.set(o.id, [bx(b), by(b) + 4 + (bk[b].length - 1) * RH, "cur"]);
          ln = [2, 3, 4];
          snap(where, d, `${o.x} 的${name[d]}是 <b>${b}</b> → 放進 ${b} 號桶${bk[b].length > 1 ? `（排在桶裡第 ${bk[b].length} 個，前面的不動）` : ""}。`);
          where.get(o.id)[2] = "";
        }
        a = bk.flat();
        ln = 5;
        snap(rowPos(a), d, `依 0 號桶 → 9 號桶的順序收回，同一個桶子裡照放進去的順序（這就是「穩定」）：<b>${a.map(o => o.x).join(", ")}</b>`);
      }
      ln = null;
      snap(rowPos(a), -1, `${D} 輪做完就排好了：${a.map(o => o.x).join(", ")}。`);
      return F;
    }
  };

  /* ---------- BST ---------- */
  defs.bst = {
    title: "BST：插入與刪除",
    code: v => [
      "insert(k):",
      "  p = NIL; x = root",
      "  while x != NIL",
      "    p = x",
      "    if k < x.key: x = x.left",
      "    else: x = x.right",
      "  put k under p (root if p = NIL)",
      "delete(k):",
      "  z = search(k)",
      "  if z has no child: remove z",
      "  else if z has one child c:",
      "    c takes z's place",
      "  else:",
      v.rep === "pred" ? "    s = max(z.left)  // predecessor" : "    s = min(z.right)  // successor",
      v.rep === "pred" ? "    s.left takes s's place" : "    s.right takes s's place",
      "    s takes z's place"
    ],
    fields: [
      { name: "keys", label: "依序插入", def: "3,6,4,5,2,7,1" },
      { name: "del", label: "再依序刪除（可空白）", def: "3" },
      { name: "rep", label: "有兩個子節點時用", def: "succ", type: "select", options: [["succ", "inorder successor（右子樹最小）"], ["pred", "inorder predecessor（左子樹最大）"]] }
    ],
    gen(v) {
      const keys = nums(v.keys, "插入的數", { max: 15, unique: true });
      const dels = v.del ? nums(v.del, "刪除的數") : [];
      const T = { root: null }, F = [];
      let ln = null;
      const snap = (marks, cap) => F.push({ items: treeItems(T.root, marks), cap, info: T.root ? `inorder：${inorder(T.root).join(" ")}` : "", line: ln });
      snap({}, `從空的樹開始。規則：比節點小往左、比節點大往右。`);
      for (const k of keys) {
        if (!T.root) { T.root = { k }; ln = 6; snap({ [k]: "cur" }, `插入 ${k}：樹是空的，${k} 當根。`); continue; }
        let c = T.root;
        const steps = [], m = {}, turns = new Set();
        for (;;) {
          const left = k < c.k;
          turns.add(left ? 4 : 5);
          steps.push(`${k} ${left ? "&lt;" : "&gt;"} ${c.k} 往${left ? "左" : "右"}`);
          m[c.k] = "cmp";
          const nx = left ? c.l : c.r;
          if (!nx) {
            if (left) c.l = { k }; else c.r = { k };
            m[k] = "cur";
            ln = [2, ...[...turns].sort(), 6];
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
        ln = 8;
        if (!c) { snap(m, `要刪除 ${d}：樹裡沒有 ${d}。`); continue; }
        m[d] = "bad";
        snap(m, `刪除 <b>${d}</b>：${path.length ? `從根往下 ${path.join("→")}，` : ""}找到 ${d}（紅色）。`);
        if (!c.l && !c.r) {
          ln = 9;
          snap({ [d]: "bad" }, `${d} 沒有子節點（葉節點）→ 直接刪掉。`);
          replace(T, p, c, null);
          snap({}, `刪掉 ${d} 了。`);
        } else if (!c.l || !c.r) {
          const ch = c.l || c.r;
          ln = [10, 11];
          snap({ [d]: "bad", [ch.k]: "cur" }, `${d} 只有一個子節點 ${ch.k} → 讓 ${ch.k}（連同它的子樹）接到 ${d} 原本的位置。`);
          replace(T, p, c, ch);
          ln = 11;
          snap({ [ch.k]: "cur" }, `完成。`);
        } else {
          const succ = v.rep !== "pred";
          let s = succ ? c.r : c.l, sp = c;
          const mm = { [d]: "bad", [s.k]: "cmp" }, walk = [s.k];
          while (succ ? s.l : s.r) { sp = s; s = succ ? s.l : s.r; mm[s.k] = "cmp"; walk.push(s.k); }
          mm[s.k] = "cur";
          ln = [12, 13];
          snap(mm, `${d} 有兩個子節點 → 找${succ ? " inorder successor：先往右一步，再一直往左" : " inorder predecessor：先往左一步，再一直往右"}（${walk.join("→")}），得到 <b>${s.k}</b>（${succ ? "右子樹最小" : "左子樹最大"}）。`);
          const rest = succ ? s.r : s.l;
          ln = [14, 15];
          snap({ [d]: "bad", [s.k]: "cur" }, `用 ${s.k} 取代 ${d}。${s.k} 原本${rest ? `的${succ ? "右" : "左"}子節點 ${rest.k} 接到 ${s.k} 原本的位置` : "沒有子節點，直接搬走"}。`);
          if (sp === c) { if (succ) c.r = rest; else c.l = rest; }
          else if (succ) sp.l = rest; else sp.r = rest;
          s.l = c.l; s.r = c.r;
          replace(T, p, c, s);
          ln = 15;
          snap({ [s.k]: "cur" }, `刪除完成，${s.k} 在 ${d} 原本的位置。`);
        }
      }
      ln = null;
      if (T.root) snap({}, `最後的樹。inorder 走訪 ${inorder(T.root).join(" ")} 一定由小到大，可以用來檢查自己畫的對不對。`);
      return F;
    }
  };

  /* ---------- AVL ---------- */
  defs.avl = {
    title: "AVL tree：插入、找不平衡的點、旋轉",
    code: [
      "insert(k):",
      "  BST-insert k as a leaf",
      "  for z = parent(k) up to root",
      "    if |bf(z)| >= 2:  // 不平衡",
      "      LL: rotateRight(z)",
      "      RR: rotateLeft(z)",
      "      LR: rotateLeft(z.left)",
      "          rotateRight(z)",
      "      RL: rotateRight(z.right)",
      "          rotateLeft(z)",
      "      return  // 轉一次就平衡了"
    ],
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
      let ln = null;
      const snap = (marks, cap) => F.push({ items: treeItems(T.root, marks, notes()), cap, info: "節點右上的小數字是平衡因子 bf ＝ 左子樹高 − 右子樹高，|bf| ≥ 2 就不平衡。", line: ln });
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
            ln = [2, 3];
            snap({ [z.k]: "bad", [y.k]: "cmp", [x.k]: "cmp" },
              `從新節點往上找，第一個不平衡的是 <b>${z.k}</b>：左子樹高 ${height(z.l)}、右子樹高 ${height(z.r)}，差 ${Math.abs(b)}。` +
              `新節點在 ${z.k} 的${cs[0] === "L" ? "左" : "右"}子樹（${y.k}）的${cs[1] === "L" ? "左" : "右"}邊 → <b>${cs}</b> 情況。`);
          }
          if (cs === "LL") {
            rotR(z);
            ln = 4;
            if (show) snap({ [y.k]: "cur" }, `LL：對 ${z.k} <b>右旋</b>。${y.k} 升上來當這棵子樹的根，${z.k} 變成 ${y.k} 的右子節點` + (z.l ? `，${y.k} 原本的右子樹（${z.l.k}）改接到 ${z.k} 的左邊。` : "。"));
          } else if (cs === "RR") {
            rotL(z);
            ln = 5;
            if (show) snap({ [y.k]: "cur" }, `RR：對 ${z.k} <b>左旋</b>。${y.k} 升上來當這棵子樹的根，${z.k} 變成 ${y.k} 的左子節點` + (z.r ? `，${y.k} 原本的左子樹（${z.r.k}）改接到 ${z.k} 的右邊。` : "。"));
          } else if (cs === "LR") {
            rotL(y);
            ln = 6;
            if (show) snap({ [x.k]: "cur", [z.k]: "bad" }, `LR 第一步：先對 ${y.k} <b>左旋</b>，${x.k} 升上來，變成 LL 的形狀。`);
            rotR(z);
            ln = 7;
            if (show) snap({ [x.k]: "cur" }, `LR 第二步：再對 ${z.k} <b>右旋</b>，${x.k} 變成這棵子樹的根。`);
          } else {
            rotR(y);
            ln = 8;
            if (show) snap({ [x.k]: "cur", [z.k]: "bad" }, `RL 第一步：先對 ${y.k} <b>右旋</b>，${x.k} 升上來，變成 RR 的形狀。`);
            rotL(z);
            ln = 9;
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
        ln = 1;
        snap(m, path.length > 1 ? `插入 <b>${k}</b>：照 BST 的規則走 ${path.map(n => n.k).join("→")}，接在 ${path[path.length - 2].k} 的${path[path.length - 2].l && path[path.length - 2].l.k === k ? "左" : "右"}邊。` : `插入 ${k}：當根。`);
        if (fix(path, true)) { ln = 10; snap({}, `轉完了，每個節點的 |bf| 都 ≤ 1。inorder 還是 ${inorder(T.root).join(" ")}：旋轉不會破壞左小右大。`); }
        else { ln = 2; snap({ [k]: "cur" }, `檢查路徑上每個節點，|bf| 都 ≤ 1，平衡，不用轉。`); }
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
    code: v => ({
      pre: ["preorder(x):", "  if x == NIL: return", "  visit(x)  // 輸出", "  preorder(x.left)", "  preorder(x.right)"],
      in: ["inorder(x):", "  if x == NIL: return", "  inorder(x.left)", "  visit(x)  // 輸出", "  inorder(x.right)"],
      post: ["postorder(x):", "  if x == NIL: return", "  postorder(x.left)", "  postorder(x.right)", "  visit(x)  // 輸出"],
      level: ["Q = [root]", "while Q is not empty", "  x = dequeue(Q)", "  visit(x)  // 輸出", "  enqueue x.left, x.right"]
    }[v.order]),
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
        out.forEach((k, i) => items.push(box("o" + k, (i % 8) * STEP, oy + Math.floor(i / 8) * 46, by.get(k).label, "done")));
        items.push(text("ol", 0, oy - 13, "輸出", "vz-sub", "start"));
        F.push({ items: items.concat(extra), cap, info: `輸出：${out.map(k => by.get(k).label).join(" ") || "（還沒有）"}`, line: ln });
      };
      let ln = null;
      const L = n => by.get(n.k).label;
      const visit = n => { out.push(n.k); done.add(n.k); };
      const kids = n => [n.l && `左子樹（${L(n.l)}）`, n.r && `右子樹（${L(n.r)}）`].filter(Boolean).join("、") || "沒有子樹";
      const path = [];
      const pm = cur => { const m = {}; path.forEach(k => { m[k] = "path"; }); m[cur.k] = "cur"; return m; };
      snap({}, { pre: "preorder：每到一個節點，先輸出它，再走左子樹、右子樹。", in: "inorder：每到一個節點，先走完左子樹，再輸出它，最後走右子樹。", post: "postorder：每到一個節點，先走完左、右子樹，最後才輸出它。", level: "level order：用 queue，從根開始一層一層、由左到右輸出。" }[v.order]);
      if (v.order === "level") {
        const q = [root];
        const qy = oy + 34 + Math.ceil(by.size / 8) * 46;
        const qItems = () => q.map((n, i) => box("o" + n.k, (i % 8) * STEP, qy + Math.floor(i / 8) * 46, L(n), "cmp"));
        ln = 0;
        snap({ [root.k]: "cmp" }, `把根 ${L(root)} 放進 queue。`, qItems().concat([text("ql", 0, qy - 13, "queue（左邊是前面）", "vz-sub", "start")]));
        while (q.length) {
          const n = q.shift();
          visit(n);
          const added = [n.l, n.r].filter(Boolean);
          q.push(...added);
          ln = [2, 3, 4];
          snap({ [n.k]: "cur" }, `從 queue 前面拿出 ${L(n)} 輸出${added.length ? `，把它的子節點 ${added.map(L).join("、")} 放到 queue 後面` : "，它沒有子節點"}。`, qItems().concat([text("ql", 0, qy - 13, "queue（左邊是前面）", "vz-sub", "start")]));
        }
      } else {
        (function rec(n) {
          if (!n) return;
          const none = !n.l && !n.r;
          if (v.order === "pre") { visit(n); ln = 2; snap(pm(n), `到 ${L(n)}：<b>先輸出 ${L(n)}</b>，` + (none ? "它沒有子樹。" : `再走${kids(n)}。`)); }
          else (ln = 2), snap(pm(n), `到 ${L(n)}：${v.order === "in" ? (n.l ? `先走左子樹（${L(n.l)}），${L(n)} 等一下才輸出。` : `沒有左子樹。`) : none ? `${L(n)} 沒有子樹。` : `先走${kids(n)}，${L(n)} 最後才輸出。`}`);
          path.push(n.k);
          rec(n.l);
          if (v.order === "in") { path.pop(); visit(n); ln = 3; snap(pm(n), `${n.l ? `${L(n)} 的左子樹走完了，` : ""}<b>輸出 ${L(n)}</b>${n.r ? `，再走右子樹（${L(n.r)}）` : ""}。`); path.push(n.k); }
          rec(n.r);
          path.pop();
          if (v.order === "post") { visit(n); ln = 4; snap(pm(n), `${L(n)} 的子樹都走完了 → <b>輸出 ${L(n)}</b>。`); }
        })(root);
      }
      ln = null;
      snap({}, `完成：<b>${out.map(k => by.get(k).label).join(" ")}</b>`);
      return F;
    }
  };

  /* ---------- 由走訪重建二元樹 ---------- */
  defs.rebuild = {
    title: "由 inorder ＋ postorder（或 preorder）重建二元樹",
    code: v => {
      const o = v.kind === "pre" ? "pre" : "post";
      return [
        `build(in, ${o}):`,
        "  if in is empty: return NIL",
        o === "pre" ? "  r = first of pre  // 根" : "  r = last of post  // 根",
        "  split in at r: L | r | R",
        `  split ${o} by sizes: ${o}L, ${o}R`,
        `  r.left  = build(L, ${o}L)`,
        `  r.right = build(R, ${o}R)`,
        "  return r"
      ];
    },
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
        F.push({ items, cap, line: st.line == null ? null : st.line });
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
        const seg = (a, b) => ino.slice(a, b + 1).join("");
        const half = (lbl, str) => (str ? `${lbl} ${str}` : `${lbl}邊是空的`);
        snap({ a: side(iL, iR, k), b: oSide, n: r, line: [2, 3, 4] },
          `${label}：${ON} 的這一段 ${oth.slice(oL, oR + 1).join("")}，${post ? "最後" : "第一"}一個是 <b>${r}</b> → 根。` +
          `inorder 以 ${r} 切開：` + (nl ? `左子樹 <span class="vz-l">${seg(iL, k - 1)}</span>（${nl} 個）` : "沒有左子樹") + "、" + (nr ? `右子樹 <span class="vz-r">${seg(k + 1, iR)}</span>（${nr} 個）` : "沒有右子樹") + "。" +
          (nl || nr ? `${ON} 也照個數切：${half("左", oth.slice(lo2, lo2 + nl).join(""))}、${half("右", oth.slice(lo2 + nl, lo2 + nl + nr).join(""))}。` : `${r} 是葉子。`));
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
  function hashCode(v) {
    const L = [], at = {};
    const put = (n, t) => { if (n) at[n] = L.length; L.push(t); };
    put("head", "insert(k):");
    put("h", "  h = k mod M");
    if (v.method === "double") put("h2", "  h2 = R - (k mod R)");
    put("for", "  for i = 0 to M:");
    put("p", v.method === "linear" ? "    p = (h + i) mod M" : v.method === "quad" ? "    p = (h + i*i) mod M" : "    p = (h + i*h2) mod M");
    put("if", "    if T[p] is empty:");
    put("put", "      T[p] = k; return");
    put("coll", "    else: collision, try next i");
    put("fail", "  k does not fit  // 放不進去");
    return { lines: L, at };
  }
  defs.hash = {
    title: "雜湊：open addressing 的探測過程",
    code: v => hashCode(v).lines,
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
      const table = new Array(M).fill(null), F = [], failed = [];
      const gcd = (x, y) => (y ? gcd(y, x % y) : x);
      const ty = 92, HW = 44, HS = 48;
      const pos = new Map(), C = hashCode(v).at;
      let cnt = 0, ln = null;
      const snap = (marks, cap) => {
        const items = [];
        for (let i = 0; i < M; i++) {
          items.push(box("s" + i, i * HS, ty, "", marks["s" + i] || "slot", { w: HW }));
          items.push(text("i" + i, i * HS + HW / 2, ty + BH + 16, `[${i}]`, "vz-sub"));
        }
        pos.forEach((p, id) => items.push(box("k" + id, p[0], p[1], keys[id], marks["k" + id] || (p[1] === ty ? "done" : "cur"), { w: HW })));
        F.push({ items, cap, info: `已放 ${cnt} 個，load factor α ＝ ${cnt}/${M}${cnt ? ` ≈ ${(cnt / M).toFixed(2)}` : ""}`, line: ln });
      };
      const name = { linear: "linear probing", quad: "quadratic probing", double: "double hashing" }[v.method];
      snap({}, `表有 M＝${M} 格。用 ${name}：先算 h(k)＝k mod ${M}，那格被佔了就照公式算下一格。`);
      keys.forEach((k, id) => {
        const h = k % M, h2 = R - (k % R);
        const at = i => (v.method === "linear" ? (h + i) % M : v.method === "quad" ? (h + i * i) % M : (h + i * h2) % M);
        const formula = i => (v.method === "linear" ? `(${h} + ${i}) mod ${M} = ${at(i)}` : v.method === "quad" ? `(${h} + ${i}²) mod ${M} = ${at(i)}` : `(${h} + ${i}×${h2}) mod ${M} = ${at(i)}`);
        let i = 0, p = at(0);
        pos.set(id, [p * HS, 8]);
        const g2 = gcd(h2 % M, M) || M;
        ln = v.method === "double" ? [C.h, C.h2, C.p] : [C.h, C.p];
        snap({ ["s" + p]: "cmp" }, `插入 <b>${k}</b>：h(${k}) ＝ ${k} mod ${M} ＝ <b>${h}</b>` + (v.method === "double" ? `，h2(${k}) ＝ ${R} − (${k} mod ${R}) ＝ ${R} − ${k % R} ＝ <b>${h2}</b>（碰撞時每次跳 ${h2} 格）` : "") + "。" + (v.method === "double" && g2 > 1 ? `注意：h2 ＝ ${h2} 和 M ＝ ${M} 不互質，探測只會走到 ${M / g2} 個格子，可能明明有空格卻放不進去。` : ""));
        const limit = M;
        while (table[p] !== null && i < limit) {
          ln = [C.if, C.coll];
          snap({ ["s" + p]: "bad", ["k" + table[p]]: "bad" }, `第 ${i} 次探測：位置 ${p} 已經有 ${keys[table[p]]} → 碰撞，往下一個位置。`);
          i++;
          p = at(i);
          pos.set(id, [p * HS, 8]);
          ln = [C.for, C.p];
          snap({ ["s" + p]: "cmp" }, `第 ${i} 次探測：${formula(i)}。`);
        }
        if (table[p] !== null) {
          pos.delete(id);
          failed.push(k);
          ln = C.fail;
          snap({}, `探測了 ${limit} 次都沒找到空位，${k} 放不進去${v.method === "quad" ? "（quadratic probing 不一定會走遍每一格）" : ""}。`);
          return;
        }
        table[p] = id; cnt++;
        pos.set(id, [p * HS, ty]);
        ln = [C.if, C.put];
        snap({ ["k" + id]: "cur" }, `位置 ${p} 是空的 → ${k} 放進 [${p}]。`);
      });
      ln = null;
      snap({}, `結果：${table.map((t, i) => (t === null ? null : `[${i}]=${keys[t]}`)).filter(Boolean).join("、")}，其他是空的。` + (failed.length ? `放不進去的：<b>${failed.join("、")}</b>。` : ""));
      return F;
    }
  };

  /* ---------- 圖：Prim / Kruskal / Dijkstra / BFS / DFS / 二分圖 ---------- */
  const GRAPH_CODE = {
    bfs: ["mark s; Q = [s]", "while Q is not empty", "  x = dequeue(Q); visit(x)", "  for each neighbor y of x (A..Z)", "    if y is not marked:", "      mark y; enqueue(y)"],
    dfs: ["dfs(x):", "  mark x; visit(x)", "  for each neighbor y of x (A..Z)", "    if y is not visited:", "      dfs(y)  // 走過去", "  return  // 退回上一個點"],
    bip: ["color(s) = X; Q = [s]", "while Q is not empty", "  x = dequeue(Q)", "  for each neighbor y of x", "    if y has no color:", "      color(y) = opposite of x", "      enqueue(y)", "    else if color(y) == color(x):", "      return \"not bipartite\"", "return \"bipartite\""],
    prim: ["T = {s}", "while T lacks some vertex", "  C = edges with one end in T", "  if C is empty: disconnected", "  e = the cheapest edge in C", "  add e and its other end to T"],
    kruskal: ["sort edges by weight", "for each edge (u, v) in order", "  if find(u) != find(v):", "    add (u, v); union(u, v)", "  else: skip it  // 會成環", "  stop at V-1 edges"],
    dijkstra: ["d[s] = 0; others = ∞", "while some vertex is not done", "  u = not-done vertex, min d[u]", "  mark u done", "  for each edge (u, w)", "    if d[u] + w(u,w) < d[w]:", "      d[w] = d[u] + w(u,w)", "      prev[w] = u"]
  };
  defs.graph = {
    title: "圖：Prim／Kruskal／Dijkstra／BFS／DFS",
    code: v => GRAPH_CODE[v.algo] || [],
    fields: [
      { name: "edges", label: "邊（無向，像 A-B 4 這樣寫；BFS、DFS、二分圖可以不寫權重）", def: "A-B 4, A-C 1, B-C 2, B-D 5, C-D 8" },
      { name: "algo", label: "演算法", def: "prim", type: "select", options: [["prim", "Prim：最小生成樹，從一點長出去"], ["kruskal", "Kruskal：最小生成樹，邊由小到大挑"], ["dijkstra", "Dijkstra：從起點出發的最短路徑"], ["bfs", "BFS：一層一層往外走（queue）"], ["dfs", "DFS：一路走到底再退回來（stack）"], ["bip", "二分圖檢查：塗兩種顏色"], ["show", "只畫圖"]] },
      { name: "start", label: "起點（Kruskal 不用）", def: "A" }
    ],
    gen(v, ds) {
      const E = [];
      const re = /([A-Za-z0-9]+)\s*[-–—]\s*([A-Za-z0-9]+)(?:[ \t]*[:=]?[ \t]*(-?\d+(?:\.\d+)?))?/g;
      let mt;
      while ((mt = re.exec(v.edges))) {
        const u = mt[1], w2 = mt[2];
        if (u === w2) throw new Error(`${u}-${w2} 是自己連自己，這裡不畫迴圈（loop）`);
        if (E.some(e => (e.u === u && e.v === w2) || (e.u === w2 && e.v === u))) continue;
        E.push({ u, v: w2, w: mt[3] == null ? null : Number(mt[3]), id: E.length });
      }
      if (!E.length) throw new Error("沒有讀到邊，請用「A-B 4」或「A-B」這種格式");
      if (E.length > 30) throw new Error("邊太多了（最多 30 條）");
      const weighted = E.some(e => e.w != null);
      const needW = v.algo === "prim" || v.algo === "kruskal" || v.algo === "dijkstra";
      if (needW && E.some(e => e.w == null)) throw new Error("這個演算法每條邊都要有權重，例如 A-B 4");
      const V = [];
      E.forEach(e => { [e.u, e.v].forEach(x => { if (!V.includes(x)) V.push(x); }); });
      if (V.length > 14) throw new Error("點太多了（最多 14 個）");
      if (ds.order) {
        const o = toks(ds.order).filter(x => V.includes(x));
        V.sort((a, b) => (o.indexOf(a) + 1 || 99) - (o.indexOf(b) + 1 || 99));
      }
      const s = v.start || V[0];
      if (v.algo !== "kruskal" && v.algo !== "show" && !V.includes(s)) throw new Error(`起點 ${s} 不在圖裡`);
      if (v.algo === "dijkstra" && E.some(e => e.w < 0)) throw new Error("Dijkstra 不能有負的邊");
      const P = new Map();
      if (ds.pos) {
        const pr = /([A-Za-z0-9]+)\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g;
        let pm;
        while ((pm = pr.exec(ds.pos))) P.set(pm[1], [Number(pm[2]) * 90, Number(pm[3]) * 90]);
      }
      if (V.every(x => P.has(x)) && V.length > 1) {
        const xs = V.map(x => P.get(x)[0]), wide = Math.max(...xs) - Math.min(...xs);
        let md = Infinity;
        V.forEach((a, i) => V.slice(i + 1).forEach(b => { const [x1, y1] = P.get(a), [x2, y2] = P.get(b); md = Math.min(md, Math.hypot(x1 - x2, y1 - y2)); }));
        const f = Math.min(1, Math.max(300 / wide, 58 / md));
        if (f < 1) V.forEach(x => { const [a, b] = P.get(x); P.set(x, [a * f, b * f]); });
      }
      if (V.some(x => !P.has(x))) {
        P.clear();
        const R = Math.max(100, Math.round(36 / Math.sin(Math.PI / V.length)));
        V.forEach((x, i) => { const t = -Math.PI / 2 + (2 * Math.PI * i) / V.length; P.set(x, [R + R * Math.cos(t), R + R * Math.sin(t)]); });
      }
      const nm = e => `${e.u}${e.v}`;
      const cmpS = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
      const nbr = x => E.filter(e => e.u === x || e.v === x).map(e => ({ y: e.u === x ? e.v : e.u, e })).sort((a, b) => cmpS(a.y, b.y));
      const F = [];
      const snap = (st, cap, info) => {
        const items = [];
        E.forEach(e => {
          const [x1, y1] = P.get(e.u), [x2, y2] = P.get(e.v);
          items.push(edge("e" + e.id, x1, y1, x2, y2, st.e[e.id] || ""));
          if (!weighted || e.w == null) return;
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1) || 1;
          const ox = (-(y2 - y1) / L) * 12, oy = ((x2 - x1) / L) * 12;
          items.push(text("w" + e.id, mx + ox, my + oy, String(e.w), "vz-w" + (st.e[e.id] ? " " + st.e[e.id] : "")));
        });
        V.forEach(x => items.push(node("n" + x, P.get(x)[0], P.get(x)[1], x, st.n[x] || "", st.note ? st.note[x] : "")));
        F.push({ items, cap, info, line: ln });
      };
      let ln = null;
      if (v.algo === "show") {
        snap({ e: {}, n: {} }, ds.cap || "", "");
      } else if (v.algo === "bfs") {
        const seen = new Set([s]), q = [s], order = [], st = { e: {}, n: { [s]: "cmp" }, note: {} };
        const info = () => `queue（左邊先出）：<span class="vz-chips">${q.map(x => `<span class="vz-chip">${x}</span>`).join("") || "（空）"}</span>　拜訪順序：${order.join(", ") || "—"}`;
        ln = 0;
        snap(st, `從 <b>${s}</b> 開始：${s} 標成「發現了」（橘色）並放進 queue。BFS 每次從 queue <b>前面</b>拿出一個點，把它還沒發現的鄰居<b>照字母順序</b>放到 queue 後面。`, info());
        while (q.length) {
          const x = q.shift();
          order.push(x);
          st.n[x] = "done"; st.note[x] = String(order.length);
          const add = [];
          const nb = nbr(x);
          nb.forEach(({ y, e }) => { if (!seen.has(y)) { seen.add(y); q.push(y); add.push(y); st.e[e.id] = "on"; st.n[y] = "cmp"; } });
          ln = add.length ? [2, 3, 4, 5] : [2, 3];
          snap({ e: st.e, n: { ...st.n, [x]: "cur" }, note: st.note },
            `拿出 <b>${x}</b>，它是第 ${order.length} 個拜訪的點。鄰居照字母順序：${nb.map(o => o.y).join("、") || "（沒有）"}。` + (add.length ? `還沒發現的 <b>${add.join("、")}</b> 依序放進 queue。` : "鄰居都發現過了，queue 不加東西。"), info());
        }
        const miss = V.filter(x => !seen.has(x));
        ln = null;
        snap(st, `queue 空了，完成。BFS 順序：<b>${order.join(", ")}</b>（節點旁的數字）。粗線是 BFS 樹：每個點被誰發現。` + (miss.length ? `${miss.join("、")} 從 ${s} 走不到，不在這次的結果裡。` : ""), info());
      } else if (v.algo === "dfs") {
        const seen = new Set([s]), order = [s], stk = [s], st = { e: {}, n: { [s]: "done" }, note: { [s]: "1" } };
        const info = () => `遞迴的路徑（stack，右邊是 top）：${stk.join(" → ") || "（空）"}　拜訪順序：${order.join(", ")}`;
        ln = 1;
        snap({ e: st.e, n: { ...st.n, [s]: "cur" }, note: st.note }, `從 <b>${s}</b> 開始（第 1 個拜訪）。DFS 每到一個點，就走向它<b>字母最小、還沒拜訪</b>的鄰居；沒有可以走的才退回上一個點。`, info());
        while (stk.length) {
          const x = stk[stk.length - 1], nb = nbr(x), nx = nb.find(o => !seen.has(o.y));
          if (nx) {
            seen.add(nx.y); order.push(nx.y); stk.push(nx.y);
            st.e[nx.e.id] = "on"; st.n[nx.y] = "done"; st.note[nx.y] = String(order.length);
            ln = [2, 3, 4];
            snap({ e: st.e, n: { ...st.n, [nx.y]: "cur" }, note: st.note },
              `在 ${x}：鄰居照字母順序是 ${nb.map(o => (seen.has(o.y) && o.y !== nx.y ? `<s>${o.y}</s>` : o.y)).join("、")}，還沒拜訪的第一個是 <b>${nx.y}</b> → 走過去（第 ${order.length} 個拜訪）。`, info());
          } else {
            stk.pop();
            const back = stk[stk.length - 1];
            ln = 5;
            snap({ e: st.e, n: back ? { ...st.n, [back]: "cur" } : st.n, note: st.note },
              `在 ${x}：鄰居 ${nb.map(o => o.y).join("、")} 都拜訪過了 → ` + (back ? `退回 <b>${back}</b>，看它還有沒有別的路。` : `退回起點之後也沒有路了，結束。`), info());
          }
        }
        const miss = V.filter(x => !seen.has(x));
        ln = null;
        snap(st, `完成。DFS 順序：<b>${order.join(", ")}</b>。粗線是 DFS 樹。` + (miss.length ? `${miss.join("、")} 從 ${s} 走不到。` : ""), info());
      } else if (v.algo === "bip") {
        const col = new Map(), par = new Map(), st = { e: {}, n: {}, note: {} };
        const side = c => (c ? "Y" : "X"), cls = c => (c ? "side2" : "done");
        const sets = () => `X ＝ {${V.filter(x => col.get(x) === 0).join(", ")}}　Y ＝ {${V.filter(x => col.get(x) === 1).join(", ")}}`;
        ln = 0;
        snap(st, `二分圖檢查：從 <b>${s}</b> 開始塗 X（綠），它的鄰居一定要塗另一邊 Y（青），一層一層往外塗。只要有一條邊兩端同色，就不是二分圖。`, "");
        let bad = null;
        outer: for (const r of [s, ...V.filter(x => x !== s)]) {
          if (col.has(r)) continue;
          col.set(r, 0); st.n[r] = cls(0); st.note[r] = "X";
          ln = 0;
          if (r !== s) snap({ ...st }, `${r} 跟前面的點不連通，另外從 ${r} 開始塗 X。`, sets());
          const q = [r];
          while (q.length) {
            const x = q.shift(), add = [];
            for (const { y, e } of nbr(x)) {
              if (!col.has(y)) { col.set(y, 1 - col.get(x)); par.set(y, { p: x, e }); st.n[y] = cls(col.get(y)); st.note[y] = side(col.get(y)); st.e[e.id] = "on"; q.push(y); add.push(y); }
              else if (col.get(y) === col.get(x)) { bad = { x, y, e }; break; }
            }
            if (bad) break outer;
            ln = add.length ? [2, 5, 6] : [2, 3];
            snap({ e: st.e, n: { ...st.n }, note: st.note }, `看 <b>${x}</b>（${side(col.get(x))}）：` + (add.length ? `還沒塗的鄰居 ${add.join("、")} 塗成 ${side(1 - col.get(x))}。` : `鄰居都塗過了，而且都跟 ${x} 不同色。`), sets());
          }
        }
        if (bad) {
          const up = x => { const p = [x]; while (par.has(p[p.length - 1])) p.push(par.get(p[p.length - 1]).p); return p; };
          const a = up(bad.x), b = up(bad.y), lca = a.find(z => b.includes(z));
          const pa = a.slice(0, a.indexOf(lca) + 1), pb = b.slice(0, b.indexOf(lca));
          const cyc = [...pa, ...pb.reverse()];
          const ce = { ...st.e };
          for (let i = 0; i + 1 < pa.length; i++) ce[par.get(pa[i]).e.id] = "bad";
          b.slice(0, b.indexOf(lca)).forEach(z => { ce[par.get(z).e.id] = "bad"; });
          ce[bad.e.id] = "bad";
          ln = [7, 8];
          snap({ e: ce, n: { ...st.n, [bad.x]: "bad", [bad.y]: "bad" }, note: st.note },
            `<b>${bad.x}</b> 和 <b>${bad.y}</b> 都是 ${side(col.get(bad.x))}，但它們之間有邊 → <b>不是二分圖</b>。紅色虛線是一個奇數長度的環：${cyc.join(" → ")} → ${cyc[0]}，共 ${cyc.length} 條邊。`, sets());
        } else {
          ln = 9;
          snap(st, `每一條邊的兩端顏色都不同 → <b>是二分圖</b>。`, sets());
        }
      } else if (v.algo === "prim") {
        const T = new Set([s]), st = { e: {}, n: { [s]: "done" } }, rows = [];
        let total = 0;
        const tbl = () => rows.length ? `<table class="vz-tbl"><tr><th>步</th><th>邊</th><th>權重</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>總權重 ${total}` : "";
        ln = 0;
        snap(st, `從 ${s} 開始，樹裡只有 ${s}（綠色）。每一步加「一端在樹內、一端在樹外」的邊裡最便宜的那條。`, "");
        let cut = false;
        while (T.size < V.length) {
          const cand = E.filter(e => T.has(e.u) !== T.has(e.v));
          if (!cand.length) { cut = true; break; }
          const best = cand.reduce((a, b) => (b.w < a.w ? b : a));
          const ties = cand.filter(e => e.w === best.w);
          const st2 = { e: { ...st.e }, n: { ...st.n } };
          cand.forEach(e => { st2.e[e.id] = "cand"; });
          ln = [2, 4];
          snap(st2, `樹內：{${[...T].join(", ")}}。跨出去的邊（虛線）：${cand.map(e => `${nm(e)} ${e.w}`).join("、")}。最小的是 <b>${nm(best)} ${best.w}</b>。` + (ties.length > 1 ? `（${ties.map(nm).join("、")} 一樣小，挑哪條都可以，總權重相同；這裡挑先列出的。）` : ""), tbl());
          const nx = T.has(best.u) ? best.v : best.u;
          T.add(nx); total += best.w; rows.push([nm(best), best.w]);
          st.e[best.id] = "on"; st.n[nx] = "done";
          E.forEach(e => { if (T.has(e.u) && T.has(e.v) && st.e[e.id] !== "on") st.e[e.id] = "skip"; });
          ln = 5;
          snap({ e: st.e, n: { ...st.n, [nx]: "cur" } }, `加入 ${nm(best)}（${best.w}），${nx} 進到樹裡。兩端都在樹內的其他邊（淡掉的）以後都不能用，會成環。`, tbl());
        }
        if (cut) {
          const miss = V.filter(x => !T.has(x));
          ln = [2, 3];
          snap(st, `做不下去了：樹內 {${[...T].join(", ")}} 和 ${miss.join("、")} 之間沒有任何邊。<b>這張圖不連通，沒有生成樹</b>；從 ${s} 只長得出它所在的那一塊` + (rows.length ? `（加入的邊依序是 ${rows.map(r => r[1]).join(", ")}，權重 ${total}）。` : "。"), tbl());
        } else { ln = 1; snap(st, `完成：加入的邊依序是 ${rows.map(r => r[1]).join(", ")}，總權重 <b>${total}</b>。`, tbl()); }
      } else if (v.algo === "kruskal") {
        const sorted = E.slice().sort((a, b) => a.w - b.w || a.id - b.id);
        const par = new Map(V.map(x => [x, x]));
        const find = x => (par.get(x) === x ? x : find(par.get(x)));
        const st = { e: {}, n: {} }, state = {};
        let taken = 0, total = 0;
        const chips = () => `<div class="vz-chips">${sorted.map(e => `<span class="vz-chip ${state[e.id] || ""}">${nm(e)} ${e.w}</span>`).join("")}</div>`;
        ln = 0;
        snap(st, `Kruskal：先把所有邊照權重由小到大排好（下面那排），依序考慮，<b>會成環的跳過</b>。`, chips());
        for (const e of sorted) {
          if (taken === V.length - 1) break;
          const a = find(e.u), b = find(e.v);
          if (a !== b) {
            par.set(a, b); taken++; total += e.w;
            st.e[e.id] = "on"; st.n[e.u] = st.n[e.v] = "done"; state[e.id] = "on";
            ln = [2, 3];
            snap(st, `${nm(e)} ${e.w}：${e.u}、${e.v} 還沒連通 → <b>加入</b>（第 ${taken} 條）。`, chips());
          } else {
            st.e[e.id] = "skip"; state[e.id] = "skip";
            ln = [2, 4];
            snap({ e: { ...st.e, [e.id]: "bad" }, n: st.n }, `${nm(e)} ${e.w}：${e.u}、${e.v} 已經用加過的邊連通了，再加會成環 → <b>跳過</b>。`, chips());
          }
        }
        const order = sorted.filter(e => state[e.id] === "on").map(e => e.w).join(", ");
        ln = taken === V.length - 1 ? 5 : 1;
        if (taken === V.length - 1) snap(st, `已經有 V−1 ＝ ${V.length - 1} 條邊，完成。加入順序 ${order}，總權重 <b>${total}</b>。`, chips());
        else snap(st, `邊都看完了，只選到 ${taken} 條，少於 V−1 ＝ ${V.length - 1} 條：<b>這張圖不連通，沒有生成樹</b>。選到的是每一塊各自的最小生成樹（最小生成森林），加入順序 ${order || "（沒有）"}，權重 ${total}。`, chips());
      } else {
        const dist = new Map(V.map(x => [x, Infinity])), prev = new Map(), prevE = new Map(), fixed = new Set();
        dist.set(s, 0);
        const fmt = d => (d === Infinity ? "∞" : String(d));
        const note = () => Object.fromEntries(V.map(x => [x, fmt(dist.get(x))]));
        const tbl = () => `<table class="vz-tbl"><tr><th>點</th>${V.map(x => `<th>${x}</th>`).join("")}</tr><tr><td>距離</td>${V.map(x => `<td>${fixed.has(x) ? `<b>${fmt(dist.get(x))}</b>` : fmt(dist.get(x))}</td>`).join("")}</tr><tr><td>前一點</td>${V.map(x => `<td>${prev.get(x) || "—"}</td>`).join("")}</tr></table>`;
        const st = { e: {}, n: {} };
        ln = 0;
        snap({ ...st, note: note() }, `起點 ${s} 的距離是 0，其他點先當成 ∞（節點旁的數字是目前知道的最短距離）。`, tbl());
        for (;;) {
          let u = null;
          V.forEach(x => { if (!fixed.has(x) && dist.get(x) < Infinity && (u === null || dist.get(x) < dist.get(u))) u = x; });
          if (u === null) break;
          fixed.add(u); st.n[u] = "done";
          if (prevE.has(u)) st.e[prevE.get(u)] = "on";
          ln = [2, 3];
          snap({ e: st.e, n: { ...st.n, [u]: "cur" }, note: note() }, `還沒確定的點裡，<b>${u}</b> 的距離最小（${dist.get(u)}）→ 確定 ${u}（綠色），之後不會再變。用它更新鄰居。`, tbl());
          E.filter(e => e.u === u || e.v === u).forEach(e => {
            const w = e.u === u ? e.v : e.u;
            if (fixed.has(w)) return;
            const nd = dist.get(u) + e.w, old = dist.get(w);
            const better = nd < old;
            if (better) { dist.set(w, nd); prev.set(w, u); prevE.set(w, e.id); }
            ln = better ? [4, 5, 6, 7] : [4, 5];
            snap({ e: { ...st.e, [e.id]: "cand" }, n: { ...st.n, [u]: "cur", [w]: "cmp" }, note: note() },
              `經過 ${u} 到 ${w}：${dist.get(u)} + ${e.w} = ${nd}，${better ? `比原本的 ${fmt(old)} 小 → <b>更新成 ${nd}</b>，前一點記 ${u}。` : `沒有比原本的 ${fmt(old)} 小 → 不變。`}`, tbl());
          });
        }
        const pathTo = x => { const p = [x]; while (prev.has(p[0])) p.unshift(prev.get(p[0])); return p.join("→"); };
        ln = null;
        snap({ ...st, note: note() }, `完成。粗線是最短路徑樹。${V.filter(x => x !== s).map(x => `${x}：${fmt(dist.get(x))}${dist.get(x) < Infinity ? `（${pathTo(x)}）` : ""}`).join("；")}。`, tbl());
      }
      return F;
    }
  };

  /* ---------- stack 輸出順序 ---------- */
  defs.stack = {
    title: "stack：這個輸出順序做得到嗎？",
    code: [
      "for each c in the wanted output",
      "  if c is on top: pop, output c",
      "  else if c is not pushed yet:",
      "    push inputs until c is pushed",
      "    pop, output c",
      "  else: impossible  // c 被壓住",
      "possible"
    ],
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
        F.push({ items, cap, info: `操作：${ops.join("、") || "（還沒有）"}`, line: ln });
      };
      let ln = null;
      snap({}, `照 ${inp.join("")} 的順序 push，中間隨時可以 pop。要輸出 ${want.join("")}：每次看下一個要輸出的字母在哪裡。`);
      for (const c of want) {
        if (stk[stk.length - 1] === c) {
          stk.pop(); out.push(c); ops.push(`pop ${c}`);
          ln = [0, 1];
          snap({ [c]: "cur" }, `要輸出 ${c}：${c} 就在 top → <b>pop ${c}</b>。`);
          continue;
        }
        if (rest.includes(c)) {
          while (rest[0] !== c) {
            const x = rest.shift(); stk.push(x); ops.push(`push ${x}`);
            ln = [2, 3];
            snap({ [x]: "cmp" }, `要輸出 ${c}：${c} 還沒 push，先 <b>push ${x}</b>。`);
          }
          rest.shift(); stk.push(c); ops.push(`push ${c}`);
          ln = 3;
          snap({ [c]: "cur" }, `<b>push ${c}</b>，現在 ${c} 在 top。`);
          stk.pop(); out.push(c); ops.push(`pop ${c}`);
          ln = 4;
          snap({ [c]: "cur" }, `<b>pop ${c}</b>，輸出 ${c}。`);
          continue;
        }
        const above = stk.slice(stk.indexOf(c) + 1).reverse();
        const m = { [c]: "bad" };
        above.forEach(x => { m[x] = "cur"; });
        ln = 5;
        snap(m, `要輸出 <b>${c}</b>，但 ${c} 已經在 stack 裡，上面還壓著 ${above.join("、")}。stack 只能拿最上面的 → <b>${want.join("")} 不可能</b>。`);
        return F;
      }
      ln = 6;
      snap({}, `全部輸出完，<b>${want.join("")} 做得到</b>。`);
      return F;
    }
  };

  /* ---------- 遞迴呼叫樹 ---------- */
  defs.calltree = {
    title: "遞迴呼叫樹：費氏數列 f(n) ＝ f(n−1) ＋ f(n−2)",
    code: v => (v.memo === "memo"
      ? ["f(n):", "  if memo[n] exists: return memo[n]", "  if n <= 1: r = 1", "  else: r = f(n-1) + f(n-2)", "  memo[n] = r", "  return r"]
      : ["f(n):", "  if n <= 1: return 1", "  a = f(n-1)", "  b = f(n-2)", "  return a + b"]),
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
        F.push({ items, cap, info: `目前呼叫了 <b>${calls}</b> 次`, line: ln });
      };
      let ln = null;
      (function link(c) { c.kids.forEach(k => { k.parent = c; link(k); }); })(root);
      for (const [type, c] of ev) {
        if (type === "in") {
          calls++;
          const dup = seenN.has(c.n);
          seenN.set(c.n, (seenN.get(c.n) || 0) + 1);
          shown.set(c.id, { c, dup, ret: false });
          if (c.hit) { shown.get(c.id).ret = true; ln = 1; snap(c.id, `呼叫 f(${c.n})：表裡已經有 f(${c.n}) ＝ ${c.val} → <b>直接查表回傳</b>，不再往下呼叫。`); continue; }
          if (c.n <= 1) { shown.get(c.id).ret = true; ln = memo ? [2, 4, 5] : 1; snap(c.id, `呼叫 f(${c.n})：n ≤ 1，直接回傳 1。${dup && !memo ? `（f(${c.n}) 之前已經算過了，這是重複的計算，橘色）` : ""}`); continue; }
          ln = memo ? 3 : 2;
          snap(c.id, `呼叫 f(${c.n})：要先算 f(${c.n - 1}) 和 f(${c.n - 2})。${dup && !memo ? `<b>f(${c.n}) 之前已經算過一次了</b>，又要整棵重算（橘色）。` : ""}`);
        } else if (c.kids.length) {
          shown.get(c.id).ret = true;
          ln = memo ? [3, 4, 5] : 4;
          snap(c.id, `f(${c.n}) ＝ f(${c.n - 1}) ＋ f(${c.n - 2}) ＝ ${c.kids[0].val} ＋ ${c.kids[1].val} ＝ <b>${c.val}</b>，回傳給上一層。${memo ? `記進表裡：f(${c.n}) ＝ ${c.val}。` : ""}`);
        }
      }
      const cnt = [...seenN.entries()].sort((a, b) => b[0] - a[0]).map(([k, c]) => `f(${k}) ${c} 次`).join("、");
      ln = null;
      snap(-1, memo
        ? `f(${N}) ＝ ${root.val}。有記錄時只呼叫了 <b>${calls}</b> 次：每個 f(k) 只真正算一次，第二次遇到直接查表（綠色虛線）。`
        : `f(${N}) ＝ ${root.val}，一共呼叫 <b>${calls}</b> 次（${cnt}）。同一個 f(k) 被重算很多次，這就是要用 DP 記下來的原因。`);
      return F;
    }
  };

  /* ---------- cache 模擬 ---------- */
  defs.cache = {
    title: "cache 模擬：位址切割、hit／miss、替換",
    code: v => [
      "for each address a",
      "  blk = a div B",
      "  set = blk mod S; tag = blk div S",
      "  if tag is in the set:",
      v.policy === "fifo" ? "    hit" : "    hit  // LRU：記成剛用過",
      "  else:  // miss",
      "    if the set is full:",
      v.policy === "fifo" ? "      evict the oldest way" : "      evict the least recently used",
      "    put tag into the set"
    ],
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
        F.push({ items, cap, info: `<div class="vz-chips">${chips || "（還沒有存取）"}</div>hit ${hits} 次、miss ${hist.length - hits} 次（cache 格子裡寫的是 tag）`, line: ln });
      };
      let ln = null;
      snap(null, {}, `${u} address，block ${B} 個 ${u} → offset ${ob} 位元；${S} 個 set → index ${ib} 位元；其他 ${tb} 位元是 tag。` + (S === 1 ? "（fully associative）" : W === 1 ? "（direct-mapped）" : `（${W}-way set-associative）`));
      for (const a of addrs) {
        const blk = Math.floor(a / B), idx = blk % S, tag = Math.floor(blk / S);
        const how = (B > 1 ? `block 位址 ＝ ⌊${a}/${B}⌋ ＝ ${blk}，` : `block 位址 ＝ ${blk}，`) +
          (S > 1 ? `index ＝ ${blk} mod ${S} ＝ <b>${idx}</b>，tag ＝ ⌊${blk}/${S}⌋ ＝ <b>${tag}</b>` : `只有 1 個 set，tag ＝ block 位址 ＝ <b>${tag}</b>`);
        const m0 = {};
        for (let w = 0; w < W; w++) m0[`${idx}-${w}`] = "cmp";
        ln = [1, 2, 3];
        snap(a, m0, `存取 <b>${a}</b>：${how}。到 set ${idx} 找 tag ${tag}。`);
        clock++;
        const row = sets[idx];
        const hw = row.findIndex(e => e && e.tag === tag);
        if (hw >= 0) {
          hits++; hist.push([a, true]);
          if (v.policy !== "fifo") row[hw].used = clock;
          ln = [3, 4];
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
          ln = [5, 8];
          snap(a, { [`${idx}-${w}`]: "cur" }, `set ${idx} 沒有 tag ${tag} → <b>miss</b>（${kind}）。從記憶體搬 block ${blk} 進來，放進空的${W > 1 ? ` way ${w}` : "格子"}。`);
        } else {
          const key = v.policy === "fifo" ? "put" : "used";
          w = 0;
          for (let k = 1; k < W; k++) if (row[k][key] < row[w][key]) w = k;
          const old = row[w];
          const emptyElse = !kind.startsWith("第一次") && sets.some((r, s) => s !== idx && r.filter(Boolean).length < W);
          row[w] = { tag, blk, used: clock, put: clock };
          ln = [6, 7, 8];
          snap(a, { [`${idx}-${w}`]: "bad" }, `set ${idx} 沒有 tag ${tag} → <b>miss</b>（${kind}）。set ${idx} 已經滿了，` +
            (W > 1 ? `${v.policy === "fifo" ? "最早放進來" : "最久沒用"}的是 way ${w} 的 tag ${old.tag}` : `只好把原本的 tag ${old.tag}`) +
            `（block ${old.blk}）踢掉，換成 tag ${tag}。` + (emptyElse ? "其他 set 明明還有空位，這叫 <b>conflict miss</b>。" : ""));
        }
      }
      ln = null;
      snap(null, {}, `做完了：hit ${hits} 次、miss ${addrs.length - hits} 次，hit rate ${hits}/${addrs.length}。可以把 set 數或每個 set 的格數改掉，看 miss 怎麼變。`);
      return F;
    }
  };

  /* ---------- 分頁置換 ---------- */
  defs.paging = {
    title: "page 置換：FIFO／LRU／OPT",
    code: v => [
      "for each reference p",
      "  if p is in a frame:",
      v.algo === "lru" ? "    hit  // 更新它的上次用" : "    hit",
      "  else:  // page fault",
      "    if some frame is empty:",
      "      load p into it",
      "    else:",
      { fifo: "      victim = loaded earliest", lru: "      victim = used longest ago", opt: "      victim = next used farthest" }[v.algo] || "      choose a victim",
      "      replace victim with p"
    ],
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
        F.push({ items, cap, info: `page fault：<b>${faults}</b> 次` + (t >= 0 ? `（已處理 ${Math.min(t + 1, refs.length)}／${refs.length} 個）` : ""), line: ln });
      };
      let ln = null;
      snap(-1, {}, `${K} 個 frame 一開始都是空的。${name}：${{ fifo: "frame 滿了就踢掉最早進來的那一頁。", lru: "frame 滿了就踢掉最久沒被用到的那一頁。", opt: "frame 滿了就踢掉「未來最晚才會用到（或再也不用）」的那一頁。這是理論最佳，實際上做不到，因為不知道未來。" }[algo]}`);
      refs.forEach((p, t) => {
        const hit = fr.findIndex(e => e && e.p === p);
        if (hit >= 0) {
          res[t] = false;
          if (algo === "lru") fr[hit].last = t;
          ln = [1, 2];
          snap(t, { ["f" + hit]: "done" }, `存取 ${p}：已經在 frame 裡 → <b>hit</b>，不用載入。` + (algo === "lru" ? "（LRU：更新它的「上次用」）" : ""));
          return;
        }
        res[t] = true; faults++;
        const empty = fr.findIndex(e => !e);
        if (empty >= 0) {
          fr[empty] = { p, in: t, last: t };
          ln = [3, 4, 5];
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
        ln = [3, 6, 7];
        snap(t, { ["f" + vi]: "bad" }, `存取 ${p}：不在記憶體 → <b>page fault</b>。frame 都滿了，${why} → 踢掉 ${old}。`);
        fr[vi] = { p, in: t, last: t };
        ln = 8;
        snap(t, { ["f" + vi]: "cur" }, `把 ${p} 載入剛空出來的 frame。`);
      });
      ln = null;
      snap(refs.length, {}, `${name} 一共 <b>${faults}</b> 次 page fault。換一種策略或改 frame 數比較看看（FIFO 用 1,2,3,4,1,2,5,1,2,3,4,5 試 3 和 4 個 frame，會看到 Belady's anomaly）。`);
      return F;
    }
  };

  /* ---------- CPU 排程 ---------- */
  defs.sched = {
    title: "CPU 排程：畫 Gantt chart",
    code: v => {
      if (v.algo === "rr") return [
        "Q = processes that arrive at 0",
        "while some process is unfinished",
        "  if Q is empty: wait for arrival",
        "  p = dequeue(Q)",
        "  run p for min(q, p.remaining)",
        "  enqueue processes that arrived",
        "  if p is unfinished: enqueue(p)"
      ];
      const pick = { fcfs: "the earliest arrival", sjf: "the shortest burst", srtf: "the shortest remaining", pri: "the smallest priority", ppri: "the smallest priority" }[v.algo] || "the best one";
      const pre = v.algo === "srtf" || v.algo === "ppri";
      return [
        "t = 0",
        "while some process is unfinished",
        "  R = arrived, unfinished at t",
        "  if R is empty: wait for arrival",
        `  p = ${pick} in R`,
        pre ? "  run p until done or next arrival" : "  run p to completion  // 不搶"
      ];
    },
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
      if (new Set(P.map(p => p.n)).size !== P.length) throw new Error("行程的名字不能重複");
      const total = Math.max(...P.map(p => p.at)) + P.reduce((s, p) => s + p.bt, 0);
      if (total > 60) throw new Error("總時間太長了（最多 60）");
      const q = Number(v.q), algo = v.algo;
      if (algo === "rr" && (!Number.isInteger(q) || q < 1)) throw new Error("quantum 要是正整數");
      const segs = [], F = [], shots = [];
      let t = 0, ln = null;
      const fmtQ = list => (list.length ? list.map(p => p.n).join("、") : "（空）");
      // 先把每一步的狀態記下來，跑完知道總長度後再畫：每 12 個時間單位換一列，手機上 1 個單位也放得下名字
      const snap = (ready, mark, cap) => shots.push({ segs: segs.map(x => ({ ...x })), ready: ready.map(p => ({ n: p.n, rem: p.rem })), mark, cap, line: ln });
      const draw = () => {
        const end = segs.length ? segs[segs.length - 1].b : 1, PER = 12;
        const U = end <= PER ? Math.max(26, Math.min(40, Math.floor(312 / end))) : 26;
        const rows = Math.max(1, Math.ceil(end / PER)), gy = 22, RH = 68, qy = gy + rows * RH + 26;
        shots.forEach(sh => {
          const items = [text("hg", 0, gy - 18, "Gantt chart" + (rows > 1 ? `（每列 ${PER} 個時間單位）` : ""), "vz-sub", "start")];
          sh.segs.forEach((sg, k) => {
            const name = sg.p ? sg.p.n : "閒置";
            for (let x = sg.a; x < sg.b;) {
              const r = end <= PER ? 0 : Math.floor(x / PER), stop = end <= PER ? sg.b : Math.min(sg.b, (r + 1) * PER);
              const x0 = (x - r * PER) * U, w = (stop - x) * U, y = gy + r * RH;
              const tight = w < textW(name) + 6;
              items.push(box(`g${k}-${r}`, x0, y, name, (k === sh.segs.length - 1 && sh.mark ? "cur" : sg.p ? "" : "slot") + (tight ? " tight" : ""), { w: Math.max(1, w), h: 36 }));
              items.push(text(`t${r}-${x - r * PER}`, x0, y + 50, String(x), "vz-sub"));
              items.push(text(`t${r}-${stop - r * PER}`, x0 + w, y + 50, String(stop), "vz-sub"));
              x = stop;
            }
          });
          items.push(text("hq", 0, qy - 14, algo === "rr" ? "ready queue（左邊是前面）" : "ready queue", "vz-sub", "start"));
          sh.ready.forEach((p, k) => items.push(box("q" + p.n, k * STEP, qy, p.n, "cmp", { sub: `剩 ${p.rem}` })));
          F.push({ items, cap: sh.cap, line: sh.line });
        });
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
      ln = 0;
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
            ln = 2;
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
          ln = [3, 4].concat(nw.length ? [5] : [], p.rem ? [6] : []);
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
            ln = 3;
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
          ln = [4, 5];
          snap(P.filter(x => x.rem && x.at <= t && x !== p).sort(cmp), true,
            `時間 ${from}–${t}：${why}<b>${p.n}</b>。` + (p.rem ? `${t} 時有新行程到達，重新比較（${p.n} 還剩 ${p.rem}）。` : `${p.n} 做完了（完成時間 ${t}）。`));
        }
      }
      const rows = P.map(p => ({ n: p.n, done: p.done, ta: p.done - p.at, w: p.done - p.at - p.bt, rs: p.first - p.at }));
      const avg = k => (rows.reduce((s, r) => s + r[k], 0) / rows.length);
      const f2 = x => (Number.isInteger(x) ? String(x) : x.toFixed(2));
      const tbl = `<table class="vz-tbl"><tr><th>行程</th><th>完成</th><th>turnaround</th><th>waiting</th><th>response</th></tr>${rows.map(r => `<tr><td>${r.n}</td><td>${r.done}</td><td>${r.ta}</td><td>${r.w}</td><td>${r.rs}</td></tr>`).join("")}<tr><td>平均</td><td></td><td>${f2(avg("ta"))}</td><td><b>${f2(avg("w"))}</b></td><td>${f2(avg("rs"))}</td></tr></table>turnaround ＝ 完成 − 到達；waiting ＝ turnaround − burst；response ＝ 第一次執行 − 到達`;
      ln = null;
      snap([], false, `全部做完。平均 waiting time ＝ <b>${f2(avg("w"))}</b>，平均 turnaround ＝ ${f2(avg("ta"))}。`);
      draw();
      F[F.length - 1].info = tbl;
      return F;
    }
  };

  /* ---------- 磁碟排程 ---------- */
  function diskCode(v) {
    const L = [], at = {};
    const put = (n, t) => { if (n) at[n] = L.length; L.push(t); };
    put("start", "pos = head");
    if (v.algo === "fcfs") {
      put("loop", "for each request r (arrival order)");
      put("move", "  move to r; pos = r");
    } else if (v.algo === "sstf") {
      put("loop", "while requests remain");
      put("pick", "  r = the one closest to pos");
      put("move", "  move to r; pos = r");
    } else {
      put("serve", "serve requests ahead, nearest first");
      put("ifRemain", "if requests remain behind:");
      if (v.algo === "scan" || v.algo === "cscan") put("toEnd", "  go to the end (0 or max)");
      if (v.algo === "look") put(null, "  // 不用走到盡頭");
      if (v.algo === "cscan") put("jump", "  jump to the other end");
      if (v.algo === "clook") put("jump", "  jump to the farthest one");
      put("serveB", v.algo === "scan" || v.algo === "look" ? "  turn around, serve them" : "  serve them in the same direction");
    }
    return { lines: L, at };
  }
  defs.disk = {
    title: "磁碟排程：讀寫頭怎麼移動",
    code: v => diskCode(v).lines,
    fields: [
      { name: "reqs", label: "要求的磁柱（照到達順序）", def: "98,183,37,122,14,124,65,67" },
      { name: "head", label: "讀寫頭現在在哪一柱", def: "53", mode: "numeric" },
      { name: "dir", label: "現在往哪個方向", def: "down", type: "select", options: [["up", "往編號大的方向"], ["down", "往編號小的方向"]] },
      { name: "max", label: "最大的磁柱編號（最小是 0）", def: "199", mode: "numeric" },
      { name: "algo", label: "演算法", def: "sstf", type: "select", options: [["fcfs", "FCFS：照到達順序"], ["sstf", "SSTF：每次挑最近的"], ["scan", "SCAN：電梯，走到盡頭才回頭"], ["look", "LOOK：電梯，到最遠的要求就回頭"], ["cscan", "C-SCAN：單向服務，到盡頭跳回另一端"], ["clook", "C-LOOK：單向服務，到最遠的要求就跳回"]] },
      { name: "ret", label: "C-SCAN／C-LOOK 跳回去那段", def: "count", type: "select", options: [["count", "算進移動距離"], ["skip", "不算"]] }
    ],
    gen(v) {
      const R = nums(v.reqs, "要求", { int: true, max: 16 });
      const head = Number(v.head), max = Number(v.max);
      if (!Number.isInteger(head) || head < 0) throw new Error("讀寫頭位置要是非負整數");
      if (!Number.isInteger(max) || max <= 0) throw new Error("最大磁柱編號要是正整數");
      if (head > max || R.some(r => r > max)) throw new Error(`磁柱編號不能超過最大值 ${max}`);
      const up = v.dir === "up", algo = v.algo, cnt = v.ret !== "skip";
      const dirTxt = d => (d ? "編號大的" : "編號小的");
      const mv = [];
      if (algo === "fcfs") R.forEach(c => mv.push({ c, req: true, why: "照到達順序，下一個是" }));
      else if (algo === "sstf") {
        const left = R.slice();
        let pos = head;
        while (left.length) {
          let bi = 0;
          left.forEach((r, i) => {
            const d = Math.abs(r - pos), bd = Math.abs(left[bi] - pos);
            if (d < bd || (d === bd && (up ? r > left[bi] : r < left[bi]))) bi = i;
          });
          const c = left.splice(bi, 1)[0];
          mv.push({ c, req: true, why: `剩下的要求（${[c, ...left].sort((a, b) => a - b).join(", ")}）裡離 ${pos} 最近的是` });
          pos = c;
        }
      } else {
        const a = R.filter(r => (up ? r >= head : r <= head)).sort((x, y) => (up ? x - y : y - x));
        const b = R.filter(r => (up ? r < head : r > head));
        a.forEach(c => mv.push({ c, req: true, why: `往${dirTxt(up)}方向，下一個是` }));
        if (b.length) {
          if (algo === "scan" || algo === "look") {
            b.sort((x, y) => (up ? y - x : x - y));
            if (algo === "scan") mv.push({ c: up ? max : 0, end: true, why: `這個方向沒有要求了，SCAN 還是走到盡頭` });
            b.forEach((c, i) => mv.push({ c, req: true, why: i ? `往${dirTxt(!up)}方向，下一個是` : `回頭往${dirTxt(!up)}方向，第一個是` }));
          } else {
            b.sort((x, y) => (up ? x - y : y - x));
            if (algo === "cscan") {
              mv.push({ c: up ? max : 0, end: true, why: `這個方向沒有要求了，C-SCAN 走到盡頭` });
              mv.push({ c: up ? 0 : max, end: true, jump: true, why: `直接跳回另一端（中間不服務）` });
              b.forEach(c => mv.push({ c, req: true, why: `一樣往${dirTxt(up)}方向，下一個是` }));
            } else {
              b.forEach((c, i) => mv.push({ c, req: true, jump: i === 0, why: i ? `一樣往${dirTxt(up)}方向，下一個是` : `最遠的要求服務完，直接跳到另一邊最${up ? "小" : "大"}的要求（中間不服務）` }));
            }
          }
        }
      }
      const W = 480, X = c => (c / max) * W, DY = 32, Y0 = 34;
      const base = [edge("axis", 0, 0, W, 0)];
      base.push(text("t0", 0, 18, "0", "vz-sub"), text("tm", W, 18, String(max), "vz-sub"));
      const rows = [];
      [...new Set(R)].sort((a, b) => a - b).forEach(c => {
        let r = 0;
        while (rows[r] != null && X(c) - rows[r] < 30) r++;
        rows[r] = X(c);
        base.push(edge("k" + c, X(c), -5, X(c), 5));
        base.push(text("l" + c, X(c), -16 - r * 16, String(c), "vz-sub"));
      });
      const pts = [{ c: head }];
      let sum = 0;
      const F = [], tbl = [];
      const table = () => `<table class="vz-tbl"><tr><th>步</th><th>移到</th><th>距離</th><th>累計</th></tr>${tbl.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table>`;
      const snap = (cap, curI, line = null) => {
        const items = base.slice();
        pts.forEach((p, i) => {
          const x = X(p.c), y = Y0 + i * DY;
          if (i) {
            const q = pts[i - 1];
            items.push(edge("s" + i, X(q.c), Y0 + (i - 1) * DY, x, y, p.jump ? (cnt ? "cand" : "skip") : i === curI ? "on" : ""));
          }
          items.push({ t: "node", k: "p" + i, x, y, r: 7, label: "", cls: i === curI ? "cur" : p.end ? "dim" : i ? "done" : "cmp", note: "" });
          items.push(text("pl" + i, x + (x > W - 50 ? -12 : 12), y, String(p.c), i === curI ? "vz-hl" : "vz-sub", x > W - 50 ? "end" : "start"));
        });
        F.push({ items, cap, info: tbl.length ? table() + `總移動距離 ${sum}` : "", line });
      };
      const name = { fcfs: "FCFS", sstf: "SSTF", scan: "SCAN", look: "LOOK", cscan: "C-SCAN", clook: "C-LOOK" }[algo];
      // 每一步對應的虛擬碼：前方的要求、走到盡頭、跳回去、回頭服務後面的
      const DL = diskCode(v).at, ahead = new Set(R.filter(r => (up ? r >= head : r <= head)));
      let firstB = true;
      mv.forEach(m => {
        if (algo === "fcfs") m.ln = [DL.loop, DL.move];
        else if (algo === "sstf") m.ln = [DL.pick, DL.move];
        else if (m.end && !m.jump) m.ln = [DL.ifRemain, DL.toEnd];
        else if (m.jump && !m.req) m.ln = DL.jump;
        else if (m.jump) { m.ln = [DL.ifRemain, DL.jump]; firstB = false; }
        else if (ahead.has(m.c) && firstB) m.ln = DL.serve;
        else { m.ln = firstB && algo === "look" ? [DL.ifRemain, DL.serveB] : DL.serveB; firstB = false; }
      });
      snap(`${name}：讀寫頭在 <b>${head}</b>，往${dirTxt(up)}方向移動（FCFS、SSTF 不管方向）。縱軸往下是時間，每往下一格就移動一次。`, 0, DL.start);
      mv.forEach(m => {
        const from = pts[pts.length - 1].c, d = Math.abs(m.c - from);
        const add = m.jump && !cnt ? 0 : d;
        sum += add;
        pts.push(m);
        tbl.push([m.c + (m.req ? "" : "（不是要求）"), m.jump && !cnt ? `${d}（不算）` : String(d), sum]);
        snap(`${m.why} <b>${m.c}</b>：從 ${from} 移到 ${m.c}，距離 ${d}${m.jump ? (cnt ? "（跳回這段照樣算進距離）" : "（這段跳回不算距離）") : ""}，累計 <b>${sum}</b>。`, pts.length - 1, m.ln);
      });
      snap(`完成。服務順序：<b>${mv.filter(m => m.req).map(m => m.c).join(", ")}</b>；總移動距離 <b>${sum}</b>。`, -1);
      return F;
    }
  };

  /* ---------- 運算式：stack 求值、中序轉後序 ---------- */
  defs.expr = {
    title: "運算式：用 stack 求值、中序轉後序",
    code: v => (v.mode === "in2post" ? [
      "for each token t (left to right)",
      "  if t is an operand: output t",
      "  else if t is \"(\": push t",
      "  else if t is \")\":",
      "    pop to output until \"(\"",
      "    discard the \"(\"",
      "  else:  // t is an operator",
      "    while prec(top) >= prec(t):",
      "      // 遇到 ( 就停；^ 用 >",
      "      pop top to output",
      "    push t",
      "pop all the rest to output"
    ] : [
      v.mode === "pre" ? "for each token t (right to left)" : "for each token t (left to right)",
      "  if t is an operand: push t",
      "  else:  // t is an operator",
      v.mode === "pre" ? "    a = pop()  // 左運算元" : "    b = pop()  // 右運算元",
      v.mode === "pre" ? "    b = pop()  // 右運算元" : "    a = pop()  // 左運算元",
      "    push(a t b)",
      "answer = pop()"
    ]),
    fields: [
      { name: "expr", label: "運算式（數字之間要空白；中序式可以不隔）", def: "8 3 2 + - 4 9 3 / + * 3 * 7 +" },
      { name: "mode", label: "要做什麼", def: "post", type: "select", options: [["post", "後序式求值（由左往右讀）"], ["pre", "前序式求值（由右往左讀）"], ["in2post", "中序式轉後序式（運算子 stack）"]] }
    ],
    gen(v) {
      const T = String(v.expr).match(/\d+(?:\.\d+)?|[A-Za-z][A-Za-z0-9]*|[-+*/×÷−%^()]/g) || [];
      if (!T.length) throw new Error("沒有讀到運算式");
      if (T.length > 25) throw new Error("最多 25 個符號，畫面才放得下");
      const norm = t => ({ "−": "-", "×": "*", "÷": "/" }[t] || t);
      const show = t => ({ "*": "×", "/": "÷", "-": "−" }[t] || t);
      const PREC = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
      const isOp = t => PREC[norm(t)] != null;
      const mode = v.mode;
      const bw = s => Math.max(BW, Math.min(240, textW(s) + 18));
      // 一列最多 9 個符號，手機上字才不會太小；stack 橫著放（右邊是 top）
      const PER = 9, rowsOf = n => Math.max(1, Math.ceil(n / PER));
      const at = (j, y0) => [(j % PER) * 44, y0 + Math.floor(j / PER) * 46];
      const inH = rowsOf(T.length) * 46;
      const hstack = (items, list, y, label, cls, mark) => {
        let x = 0;
        const w = list.reduce((a, o) => a + bw(o.s) + 6, 0);
        items.push(zone("zs", -6, y - 4, Math.max(BW, w) + 8, BH + 8, "", label));
        list.forEach(o => { items.push(box(o.k, x, y, o.s, mark[o.k] || cls, { w: bw(o.s) })); x += bw(o.s) + 6; });
      };
      const F = [];
      let ln = null;
      if (mode === "in2post") {
        let want = "operand";
        T.forEach((t, j) => {
          const op = isOp(t), nm = show(t);
          if (t === "(") { if (want !== "operand") throw new Error(`「${T[j - 1]}」和「(」中間少了運算子`); return; }
          if (t === ")") { if (want !== "op") throw new Error(`「)」前面少了運算元`); return; }
          if (op) {
            if (want !== "op") throw new Error(j === 0 || T[j - 1] === "(" ? `「${nm}」前面沒有運算元。這裡不支援負號，請寫成 (0 ${nm} A)` : `「${show(T[j - 1])}」和「${nm}」之間少了運算元`);
            want = "operand"; return;
          }
          if (want !== "operand") throw new Error(`「${T[j - 1]}」和「${t}」中間少了運算子`);
          want = "op";
        });
        if (want !== "op") throw new Error("運算式最後少了運算元");
        const ops = [], out = [];
        const nOut = T.filter(t => t !== "(" && t !== ")").length;
        const yOut = inH + 34, yOps = yOut + rowsOf(nOut) * 46 + 40;
        const snap = (i, cap, mark = {}) => {
          const items = [text("h1", 0, -18, "中序式", "vz-sub", "start")];
          T.forEach((t, j) => { const [x, y] = at(j, 0); items.push(box("t" + j, x, y, show(t), j === i ? "cur" : j < i ? "dim" : "", { w: 40 })); });
          items.push(text("h2", 0, yOut - 16, "輸出（後序式）", "vz-sub", "start"));
          out.forEach((o, j) => { const [x, y] = at(j, yOut); items.push(box(o.k, x, y, show(o.t), mark[o.k] || "done", { w: 40 })); });
          hstack(items, ops.map(o => ({ k: o.k, s: show(o.t) })), yOps, "運算子 stack（右邊是 top）", "cmp", mark);
          F.push({ items, cap, info: `輸出：${out.map(o => show(o.t)).join(" ") || "（還沒有）"}`, line: ln });
        };
        snap(-1, "由左往右讀。<b>運算元直接輸出</b>；運算子先放進 stack，等確定後面沒有更優先的運算子才輸出。");
        let depth = 0;
        T.forEach((t, i) => {
          const k = "x" + i;
          if (!isOp(t) && t !== "(" && t !== ")") {
            out.push({ t, k });
            ln = 1;
            snap(i, `讀到 <b>${t}</b>：運算元直接輸出。`, { [k]: "cur" });
          } else if (t === "(") {
            depth++;
            ops.push({ t, k });
            ln = 2;
            snap(i, "讀到 <b>(</b>：直接 push。它像一道牆，右括號出現前，牆下面的運算子都不會被 pop。", { [k]: "cur" });
          } else if (t === ")") {
            if (!depth) throw new Error("右括號比左括號多");
            depth--;
            const popped = [];
            while (ops.length && ops[ops.length - 1].t !== "(") { const o = ops.pop(); out.push(o); popped.push(show(o.t)); }
            ops.pop();
            ln = [3, 4, 5];
            snap(i, `讀到 <b>)</b>：一直 pop 到左括號為止${popped.length ? `，${popped.join("、")} 依序輸出` : ""}；兩個括號都丟掉，不輸出。`, Object.fromEntries(out.slice(out.length - popped.length).map(o => [o.k, "cur"])));
          } else {
            const p = PREC[norm(t)], popped = [];
            const why = [];
            while (ops.length) {
              const top = ops[ops.length - 1];
              if (top.t === "(") break;
              const q = PREC[norm(top.t)];
              if (q > p || (q === p && norm(t) !== "^")) { ops.pop(); out.push(top); popped.push(show(top.t)); why.push(`${show(top.t)} 的優先順序${q > p ? "比" : "和"} ${show(t)} ${q > p ? "高" : "一樣（由左往右算，先出現的先算）"} → pop 輸出`); }
              else { why.push(`top 是 ${show(top.t)}，優先順序比 ${show(t)} 低 → 停`); break; }
            }
            ops.push({ t, k });
            ln = popped.length ? [6, 7, 9, 10] : [6, 7, 10];
            snap(i, `讀到 <b>${show(t)}</b>：` + (why.length ? why.join("；") + "。" : "stack 是空的（或 top 是左括號）。") + `然後 push ${show(t)}。`, { [k]: "cur" });
          }
        });
        if (depth) throw new Error("左括號比右括號多");
        const rest = [];
        while (ops.length) { const o = ops.pop(); out.push(o); rest.push(show(o.t)); }
        ln = 11;
        snap(T.length, (rest.length ? `讀完了，stack 裡剩下的運算子從 top（右邊）開始依序 pop 輸出：${rest.join("、")}。` : "讀完了。") + `後序式：<b>${out.map(o => show(o.t)).join(" ")}</b>`);
        return F;
      }
      // 求值：後序由左往右、前序由右往左
      const order = mode === "pre" ? T.map((t, i) => i).reverse() : T.map((t, i) => i);
      if (T.some(t => t === "(" || t === ")")) throw new Error("前序式、後序式不會有括號");
      const st = [];
      let id = 0;
      const numeric = T.every(t => isOp(t) || /^\d/.test(t));
      const fmt = x => (Number.isInteger(x) ? String(x) : String(Math.round(x * 1000) / 1000));
      const snap = (i, cap, mark = {}) => {
        const items = [text("h1", 0, -18, mode === "pre" ? "前序式（從右往左讀）" : "後序式（從左往右讀）", "vz-sub", "start")];
        T.forEach((t, j) => {
          const done = mode === "pre" ? j > i : j < i;
          const [x, y] = at(j, 0);
          items.push(box("t" + j, x, y, show(t), j === i ? "cur" : done ? "dim" : "", { w: 40 }));
        });
        hstack(items, st, inH + 40, "stack（右邊是 top）", "cmp", mark);
        F.push({ items, cap, info: st.length ? `stack 裡每一格對應的中序式（從左到右）：${st.map(o => o.in).join("　｜　")}` : "", line: ln });
      };
      snap(-1, mode === "pre" ? "前序式<b>由右往左</b>讀：運算元 push；遇到運算子就 pop 兩個，<b>先 pop 出來的是左運算元</b>，算完 push 回去。" : "後序式<b>由左往右</b>讀：運算元 push；遇到運算子就 pop 兩個，<b>先 pop 出來的是右運算元</b>，算完 push 回去。");
      for (const i of order) {
        const t = T[i];
        if (!isOp(t)) {
          const k = "v" + id++;
          st.push({ k, s: t, val: numeric ? Number(t) : null, in: t });
          ln = 1;
          snap(i, `讀到 <b>${t}</b>：運算元，push。`, { [k]: "cur" });
          continue;
        }
        if (st.length < 2) throw new Error(`讀到 ${show(t)} 時 stack 裡不到兩個數，這不是合法的${mode === "pre" ? "前" : "後"}序式`);
        const x = st.pop(), y = st.pop();
        const [L, R] = mode === "pre" ? [x, y] : [y, x];
        const op = norm(t);
        let val = null;
        if (numeric) {
          if ((op === "/" || op === "%") && R.val === 0) throw new Error("除以 0");
          val = op === "+" ? L.val + R.val : op === "-" ? L.val - R.val : op === "*" ? L.val * R.val : op === "/" ? L.val / R.val : op === "%" ? L.val % R.val : Math.pow(L.val, R.val);
        }
        const wrap = o => (o.in.length > 1 && /[-+*/×÷−%^]/.test(o.in) ? `(${o.in})` : o.in);
        const inf = `${wrap(L)} ${show(t)} ${wrap(R)}`;
        const k = "v" + id++;
        const s = numeric ? fmt(val) : inf;
        st.push({ k, s, val, in: inf });
        ln = [3, 4, 5];
        snap(i, `讀到 <b>${show(t)}</b>：pop 出 ${x.s}${mode === "pre" ? "（左）" : "（右）"}、${y.s}${mode === "pre" ? "（右）" : "（左）"}，` + (numeric ? `算 ${L.s} ${show(t)} ${R.s} ＝ <b>${s}</b>，push。` : `組成 ${inf}，push。`), { [k]: "cur" });
      }
      if (st.length !== 1) throw new Error(`讀完後 stack 裡有 ${st.length} 個東西（應該剩 1 個），這不是合法的${mode === "pre" ? "前" : "後"}序式`);
      ln = 6;
      snap(mode === "pre" ? -1 : T.length, `讀完了，stack 裡剩下的就是答案${numeric ? `：<b>${st[0].s}</b>` : ""}。對應的中序式：${st[0].in}`);
      return F;
    }
  };

  /* ---------- Huffman 編碼 ---------- */
  defs.huffman = {
    title: "Huffman：每次合併頻率最小的兩個",
    code: [
      "Q = every symbol as a 1-node tree",
      "while Q has 2 or more trees",
      "  x = extract-min(Q)",
      "  y = extract-min(Q)",
      "  z = new node, freq = x + y",
      "  z.left, z.right = x, y  // 依規則",
      "  insert z into Q",
      "code: left edge 0, right edge 1"
    ],
    fields: [
      { name: "freq", label: "符號與頻率（像 A 8, B 15 這樣寫）", def: "A 8, B 15, C 1, D 6, E 15, F 3, G 7" },
      { name: "left", label: "合併時誰放左邊（左邊編 0）", def: "lex", type: "select", options: [["lex", "標籤字母順序小的放左邊"], ["freq", "頻率小的放左邊（一樣大比標籤）"]] }
    ],
    gen(v) {
      const S = [];
      const re = /([A-Za-z0-9]+)\s*[:：=]?\s*(\d+(?:\.\d+)?)/g;
      let mt;
      while ((mt = re.exec(v.freq))) {
        if (S.some(x => x.label === mt[1])) throw new Error(`${mt[1]} 重複了`);
        S.push({ k: "s" + mt[1], label: mt[1], f: Number(mt[2]), l: null, r: null });
      }
      if (S.length < 2) throw new Error("至少要 2 個符號，像「A 8, B 15」");
      if (S.length > 12) throw new Error("最多 12 個符號，畫面才放得下");
      const cmp = (a, b) => a.f - b.f || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
      let forest = S.slice().sort(cmp), nid = 0;
      const F = [];
      const snap = (cap, marks = {}, info = "") => {
        const items = [];
        let ox = 0;
        forest.forEach(root => {
          // 葉子的符號寫在圓圈下面、每棵樹的根寫合併後的標籤；照實際寬度排開，不會疊在一起
          const pos = layout(root, 28, 62);
          const lab = n => (!n.l ? n.label : n === root ? n.label : "");
          let x0 = Infinity, x1 = -Infinity;
          pos.forEach(([x], n) => { const hw = Math.max(19, textW(lab(n)) / 2); x0 = Math.min(x0, x - hw); x1 = Math.max(x1, x + hw); });
          pos.forEach(([x, y], n) => {
            const X = ox + x - x0;
            for (const [c, bit] of [[n.l, "0"], [n.r, "1"]]) {
              if (!c) continue;
              const [cx, cy] = pos.get(c), CX = ox + cx - x0;
              items.push(edge("e" + c.k, X, y, CX, cy));
              items.push(text("b" + c.k, (X + CX) / 2 + (bit === "0" ? -9 : 9), (y + cy) / 2 - 4, bit, "vz-sub"));
            }
            items.push(node("n" + n.k, X, y, String(n.f), (marks[n.k] || (n.l ? "" : "done")) + (String(n.f).length > 3 ? " wide" : ""), ""));
            if (!n.l) items.push(text("lb" + n.k, X, y + 32, n.label, "vz-sub"));
            else if (n === root) items.push(text("lr" + n.k, X, y - 30, n.label, "vz-sub"));
          });
          ox += x1 - x0 + 12;
        });
        F.push({ items, cap, info, line: ln });
      };
      let ln = 0;
      snap(`每個符號先自己是一棵樹（圓圈裡是頻率，下面是符號）。照頻率由小到大排好；每一步拿出<b>最小的兩棵</b>合併成新的一棵，新的根是兩個頻率的和。`);
      while (forest.length > 1) {
        const [a, b] = forest;
        ln = [1, 2, 3];
        snap(`最小的兩棵：<b>${a.label}（${a.f}）</b>和 <b>${b.label}（${b.f}）</b>` + (forest.length > 2 && forest[2].f === b.f ? `（${b.label} 和 ${forest[2].label} 頻率一樣，照規則挑標籤字母小的 ${b.label}）` : "") + "。", { [a.k]: "cmp", [b.k]: "cmp" });
        let L = a, R = b;
        if (v.left === "lex" ? b.label < a.label : cmp(b, a) < 0) { L = b; R = a; }
        const n = { k: "i" + nid++, label: L.label + R.label, f: a.f + b.f, l: L, r: R };
        forest = [n, ...forest.slice(2)].sort(cmp);
        ln = [4, 5, 6];
        snap(`合併成 <b>${n.label}（${n.f}）</b>：${L.label} 放左邊（編 0）、${R.label} 放右邊（編 1）` + (v.left === "lex" ? "，因為標籤字母順序小的放左邊。" : "，頻率小的放左邊。") + `還剩 ${forest.length} 棵。`, { [n.k]: "cur" });
      }
      const codes = [];
      (function walk(n, c) {
        if (!n.l) { codes.push([n.label, n.f, c || "0"]); return; }
        walk(n.l, c + "0"); walk(n.r, c + "1");
      })(forest[0], "");
      codes.sort((x, y) => (x[0] < y[0] ? -1 : 1));
      const total = codes.reduce((s, c) => s + c[1] * c[2].length, 0);
      const sumF = codes.reduce((s, c) => s + c[1], 0), fixedLen = Math.max(1, Math.ceil(Math.log2(codes.length)));
      const tbl = `<table class="vz-tbl"><tr><th>符號</th><th>頻率</th><th>編碼</th><th>長度</th><th>頻率×長度</th></tr>${codes.map(c => `<tr><td>${c[0]}</td><td>${c[1]}</td><td>${c[2]}</td><td>${c[2].length}</td><td>${c[1] * c[2].length}</td></tr>`).join("")}</table>總位元數 ${total}；固定長度要 ${fixedLen} 位元 × ${sumF} ＝ ${fixedLen * sumF}`;
      ln = 7;
      snap(`完成。從根往下走，往左寫 0、往右寫 1，走到葉子就是那個符號的編碼。頻率越大的符號越靠近根，編碼越短。總位元數 ＝ Σ 頻率 × 編碼長度 ＝ <b>${total}</b>。`, {}, tbl);
      return F;
    }
  };


  /* ---------- 圖例 ---------- */
  defs.insertion.legend = [["n", "cur", "正在插入的數"], ["n", "cmp", "拿來比較的數"], ["n", "done", "已經排好的部分"]];
  defs.heap.legend = v => (v.build === "insert"
    ? [["n", "cur", "剛插入、往上調整的數"], ["n", "cmp", "拿來比較的父節點"], ["n", "dim", "還沒插入的數"]]
    : [["n", "cur", "正在往下調整（sift-down）的數"], ["n", "cmp", "拿來比較的子節點"]]).concat(v.sort === "sort" ? [["n", "done", "已經排好、移出 heap"]] : []);
  defs.radix.legend = [["t", "hl", "這一輪看的位數"], ["t", "dimtxt", "位數不夠補的 0"], ["n", "cur", "剛放進桶子的數"]];
  defs.bst.legend = [["n", "cmp", "一路比較經過的節點"], ["n", "cur", "新插入或移上來的節點"], ["n", "bad", "要刪除的節點"]];
  defs.avl.legend = [["n", "bad", "第一個不平衡的節點"], ["n", "cmp", "比較經過的、參與旋轉的節點"], ["n", "cur", "新插入或升上來的節點"]];
  defs.traverse.legend = v => (v.order === "level"
    ? [["n", "cur", "正在輸出的節點"], ["n", "cmp", "在 queue 裡等的節點"], ["n", "done", "已經輸出"]]
    : [["n", "cur", "現在所在的節點"], ["n", "path", "還沒走完、等著回來的節點"], ["n", "done", "已經輸出"]]);
  defs.rebuild.legend = [["n", "cur", "這一段的根"], ["n", "lpart", "左子樹的範圍"], ["n", "rpart", "右子樹的範圍"]];
  defs.hash.legend = [["n", "cmp", "正在探測的格子"], ["n", "bad", "碰撞：這格已經有 key"], ["n", "cur", "正在放的 key"], ["n", "done", "已經放好的 key"]];
  defs.graph.legend = v => ({
    prim: [["n", "done", "已在樹裡的點"], ["n", "cur", "剛加入的點"], ["e", "cand", "跨出去的候選邊"], ["e", "on", "選進樹的邊"], ["e", "skip", "兩端都在樹裡，不能用"]],
    kruskal: [["e", "on", "選進樹的邊"], ["e", "bad", "會成環，跳過"], ["e", "skip", "已經跳過的邊"]],
    dijkstra: [["n", "cur", "這一步確定的點"], ["n", "cmp", "正在更新距離的鄰居"], ["n", "done", "距離已確定"], ["e", "cand", "正在檢查的邊"], ["e", "on", "最短路徑樹的邊"]],
    bfs: [["n", "cmp", "發現了、在 queue 裡"], ["n", "cur", "正在處理"], ["n", "done", "處理完了"], ["e", "on", "BFS 樹的邊"]],
    dfs: [["n", "cur", "現在所在的點"], ["n", "done", "拜訪過"], ["e", "on", "DFS 樹的邊"]],
    bip: [["n", "done", "X 這一邊"], ["n", "side2", "Y 這一邊"], ["n", "bad", "兩端同色的衝突"], ["e", "bad", "奇數長度的環"]]
  }[v.algo] || []);
  defs.stack.legend = [["n", "cmp", "在 stack 裡"], ["n", "cur", "這一步 push、pop 的，或壓在上面擋路的"], ["n", "done", "已經輸出"], ["n", "bad", "卡住：要的被壓在下面"]];
  defs.calltree.legend = v => (v.memo === "memo"
    ? [["n", "cur", "正在算的呼叫"], ["n", "done", "已經回傳（值寫在下面）"], ["n", "memo", "查表直接拿到答案"]]
    : [["n", "cur", "正在算的呼叫"], ["n", "done", "已經回傳（值寫在下面）"], ["n", "dup", "重複算的呼叫"]]);
  defs.cache.legend = [["n", "cmp", "要比對的 set"], ["n", "done", "hit 的那一格"], ["n", "cur", "miss 後放進空格"], ["n", "bad", "miss 後被換掉的格子"]];
  defs.paging.legend = [["n", "cur", "這次存取"], ["n", "bad", "page fault／被踢掉的 frame"], ["n", "done", "hit"], ["n", "dim", "還沒存取到"]];
  defs.sched.legend = [["n", "cur", "剛排上的那一段"], ["n", "cmp", "ready queue 裡等的行程"], ["n", "slot", "CPU 閒置"]];
  defs.disk.legend = v => [["n", "cmp", "讀寫頭的起點"], ["n", "cur", "讀寫頭現在的位置"], ["n", "done", "已經服務的要求"]].concat(
    v.algo === "scan" || v.algo === "cscan" ? [["n", "dim", "走到盡頭（不是要求）"]] : [],
    v.algo === "cscan" || v.algo === "clook" ? [[ "e", v.ret === "skip" ? "skip" : "cand", v.ret === "skip" ? "跳回去（不算距離）" : "跳回去（算進距離）"]] : []);
  defs.expr.legend = v => (v.mode === "in2post"
    ? [["n", "cur", "正在讀的符號"], ["n", "dim", "已經讀過"], ["n", "cmp", "運算子 stack"], ["n", "done", "已經輸出"]]
    : [["n", "cur", "正在讀的符號"], ["n", "dim", "已經讀過"], ["n", "cmp", "stack 裡的東西"]]);
  defs.huffman.legend = [["n", "cmp", "這一步最小的兩棵"], ["n", "cur", "剛合併出來的根"], ["n", "done", "葉子（原本的符號）"]];

  hosts.forEach(h => {
    const def = defs[h.dataset.viz];
    if (!def) { h.textContent = `（找不到動畫：${h.dataset.viz}）`; return; }
    // 每個動畫有自己的欄位設定（cur 會被改），所以複製一份
    new Player(h, { ...def, fields: def.fields.map(f => ({ ...f })) });
  });
})();
