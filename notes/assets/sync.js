/* 帳號與雲端同步（Supabase），首頁和教材頁共用。
 *
 * 1. 一定要登入才能用網站：還沒登入時 <html class="gate">，頁面藏起來，只顯示登入卡片。
 *    （<head> 裡有一小段程式先看有沒有登入紀錄，沒有就先加上 gate，頁面不會先閃一下。）
 *    登入的每一步（前往 Google、確認帳號、載入進度）都有動畫，完成後卡片淡出。
 * 2. 每個人的資料分開：讀書進度、開始日期、休息日、考古題進度、小考紀錄、頭像（localStorage）和手寫筆跡（IndexedDB）
 *    都存在自己帳號底下。這台裝置記得資料是誰的（cgep:owner），換別的帳號登入時，先清掉前一個人的資料，
 *    再從雲端抓新帳號的資料下來。
 * 3. 同步只在有變更時才做：
 *    - 這台裝置改了東西（打勾、手寫、換頭像…）→ 幾秒後上傳；離開頁面前還沒傳的也會先傳。
 *    - 打開頁面時安靜地檢查一次雲端有沒有比較新的（別台裝置改的），有才下載，畫面上不會一直跳「同步中」。
 *    - 兩台裝置都改了同一項（例如兩邊都打了勾）：打勾、小考紀錄這種清單會合併，不會互相蓋掉。
 *    - 「立即同步」按鈕可以手動同步。
 * 4. 頭像：avatars.js 的動物頭像或 Google 大頭貼，在帳號選單裡選。
 *
 * 登入：Google 帳號（OAuth，PKCE 流程：Google 登入完回到原本的頁面，網址帶 ?code=，supabase-js 自己換成登入狀態
 *       並把 code 從網址拿掉）。
 * 設定：supabase-config.js 填 url 和 key（publishable key，本來就是公開的，資料靠資料表的 Row Level Security 保護）。
 * 資料表：supabase/schema.sql（ink_pads：手寫；user_state：其他進度；delete_my_account()：使用者自己刪除帳號）。
 * 隱私權政策：網站根目錄的 privacy.html（不用登入就能看）。
 */
(function () {
  "use strict";
  var DB = window.CGEP_INKDB || null;
  var AV = window.CGEP_AVATARS || null;
  var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js";
  var CFG_KEY = "cgep:sb:cfg", RETURN_KEY = "cgep:sb:return", OWNER_KEY = "cgep:owner";
  var META_KEY = "cgep:state-meta", BASE_KEY = "cgep:state-base", PROFILE_KEY = "cgep:profile";
  // 要跟著帳號走的進度：每個考試的 done／rest／papers／start，每個教材頁的小考紀錄，頭像
  var STATE_RE = /^cgep:(quiz:[\w-]+|profile|[\w-]+:(done|rest|papers|start))$/;
  var I = window.CGEP_ICON || function () { return ""; };
  var root = document.documentElement;
  var fromOAuth = /[?&]code=/.test(location.search);
  // privacy.html 在網站根目錄；用這支程式自己的網址推回去，首頁和教材頁都對
  var me = document.currentScript && document.currentScript.src;
  var PRIVACY = me ? new URL("../../privacy.html", me).href : "privacy.html";
  var sb = null, user = null, busy = false, again = false, timer = 0, lastOk = 0, running = null, chain = Promise.resolve();
  var deleting = false, dirty = false;
  // 登入卡片的階段：connect 連線中、ready 可以登入、go 前往 Google、auth 確認帳號、load 載入進度、done 完成
  var stage = fromOAuth ? "auth" : "connect";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function lsKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; }
  function readMap(k) { try { return JSON.parse(lsGet(k) || "{}") || {}; } catch (e) { return {}; } }
  function writeMap(k, m) { lsSet(k, JSON.stringify(m)); }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  // 從 Supabase 複製網址時常常會帶到 /rest/v1/，只留 https://xxxx.supabase.co
  function baseUrl(u) { return String(u || "").trim().replace(/\/(rest|auth|storage|realtime)\/v1.*$/i, "").replace(/\/+$/, ""); }
  function cfg() {
    var c = window.CGEP_SUPABASE || {};
    if (c.url && c.key) return { url: baseUrl(c.url), key: String(c.key).trim(), fixed: true };
    try { var v = JSON.parse(lsGet(CFG_KEY) || "null"); if (v && v.url && v.key) return { url: baseUrl(v.url), key: v.key }; } catch (e) {}
    return null;
  }

  // 頁面存進度時呼叫：記下修改時間，幾秒後上傳
  window.CGEP_STATE = {
    touch: function (k) {
      if (!STATE_RE.test(k)) return;
      var m = readMap(META_KEY); m[k] = Date.now(); writeMap(META_KEY, m);
      dirty = true;
      if (user) schedule(1500);
    }
  };
  window.CGEP_SYNC = {
    signedIn: function () { return !!user; },
    now: function () { return syncNow(); }
  };

  /* ---------- 頭像 ---------- */
  function profile() { return readMap(PROFILE_KEY); }
  function meta() { return (user && user.user_metadata) || {}; }
  function photoUrl() { var m = meta(); return /^https:\/\//.test(m.avatar_url || m.picture || "") ? (m.avatar_url || m.picture) : ""; }
  function displayName() { var m = meta(); return m.full_name || m.name || ""; }
  function avatarId() {
    var p = profile();
    if (p.avatar === "google" && photoUrl()) return "google";
    if (AV && p.avatar && AV.has(p.avatar)) return p.avatar;
    return AV ? AV.defaultFor(user ? user.id : "") : "";
  }
  function avatarHtml(id) {
    id = id || avatarId();
    if (id === "google") return '<img class="av" src="' + esc(photoUrl()) + '" alt="" referrerpolicy="no-referrer">';
    return AV && id ? AV.svg(id) : I("user");
  }
  function setAvatar(id) {
    var p = profile(); p.avatar = id;
    writeMap(PROFILE_KEY, p);
    window.CGEP_STATE.touch(PROFILE_KEY);
    renderBox(); renderAcct();
  }
  var sheet = null;
  function openPicker() {
    closePicker(true);
    var cur = avatarId();
    var opts = (photoUrl() ? [{ id: "google", name: "Google 大頭貼" }] : []).concat(AV ? AV.list : []);
    sheet = document.createElement("div");
    sheet.className = "av-sheet";
    sheet.innerHTML = '<div class="av-panel" role="dialog" aria-modal="true" aria-labelledby="av-title">' +
      '<div class="av-head"><b id="av-title">選擇頭像</b><button type="button" class="av-x" data-act="av-close" aria-label="關閉">' + I("close") + "</button></div>" +
      '<div class="av-grid">' + opts.map(function (o) {
        return '<button type="button" class="av-opt' + (o.id === cur ? " on" : "") + '" data-av="' + esc(o.id) + '" aria-pressed="' + (o.id === cur) + '">' + avatarHtml(o.id) + "<span>" + esc(o.name) + "</span></button>";
      }).join("") + "</div></div>";
    document.body.appendChild(sheet);
    sheet.addEventListener("click", function (e) {
      var o = e.target.closest("[data-av]");
      if (o) { setAvatar(o.dataset.av); closePicker(); return; }
      if (e.target === sheet || e.target.closest("[data-act=av-close]")) closePicker();
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (sheet) sheet.classList.add("open"); }); });
    var on = sheet.querySelector(".av-opt.on") || sheet.querySelector(".av-opt");
    if (on) setTimeout(function () { on.focus(); }, 60);
  }
  function closePicker(now) {
    if (!sheet) return;
    var s = sheet; sheet = null;
    if (now) { s.remove(); return; }
    s.classList.remove("open");
    setTimeout(function () { s.remove(); }, 260);
  }

  /* ---------- 畫面：登入卡片、目錄裡的帳號區、首頁的帳號按鈕 ---------- */
  var gate = document.createElement("div");
  gate.className = "gate-screen";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "gate-title");
  document.body.appendChild(gate);

  var side = document.querySelector("aside.toc"), box = null;
  if (side) { box = document.createElement("div"); box.className = "inkbak sync"; side.appendChild(box); }
  var acct = document.getElementById("acct");

  // 兩種訊息：sync-msg 是同步狀態（帳號選單、目錄）；gate-msg 只放登入卡片上的訊息（登入失敗、已登出…）
  var msgText = "", gateText = takeUrlError();
  // 登入卡片要顯示的狀態：剛登出（out）、剛刪除帳號（deleted）；按登入或登入成功後清掉
  var notice = null;
  function say(t) { msgText = t; document.querySelectorAll(".sync-msg").forEach(function (m) { m.textContent = t; }); }
  function gsay(t) { gateText = t; var m = gate.querySelector(".gate-msg"); if (m) m.textContent = t; }
  function hhmm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function msg(extra) { return '<p class="sync-msg' + (extra ? " " + extra : "") + '" aria-live="polite">' + esc(msgText) + "</p>"; }

  function steps(at) {
    var names = ["確認 Google 帳號", "載入你的進度和筆跡", "準備頁面"];
    return '<ol class="gate-steps">' + names.map(function (n, i) {
      var st = i < at ? "done" : i === at ? "active" : "todo";
      return '<li class="' + st + '"><span class="gs-dot">' + (st === "done" ? I("check") : st === "active" ? '<span class="spin"></span>' : "") + "</span><span>" + n + "</span></li>";
    }).join("") + "</ol>";
  }
  // 網站重點（登入前看的介紹，一行一個，盡量短）
  var FEATS = [
    ["calendar", "依開始日期排好每天的進度"],
    ["book", "111–115 年考古題逐題詳解"],
    ["pen", "每一題都能用觸控筆作答"]
  ];
  function feats() {
    return '<ul class="gate-feats">' + FEATS.map(function (f) { return "<li>" + I(f[0]) + "<span>" + f[1] + "</span></li>"; }).join("") + "</ul>";
  }
  // Google 官方的四色「G」（照 Google 的登入按鈕品牌規範，不能自己畫、不能改成單色）
  var GLOGO = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  function renderGate() {
    var c = cfg(), signing = stage === "auth" || stage === "load" || stage === "done";
    var head = '<div class="gate-brand"><span class="gm-tile">' + I("pen") + '</span><h1 id="gate-title">資工所備考</h1><p class="gate-sub">考古題整理成的讀書計畫與教材</p></div>';
    // 剛登出／刪除帳號：換成結果畫面（大圖示＋一句說明），下面一樣可以再登入
    if (notice && !signing && stage !== "go") {
      head = '<div class="gate-brand"><span class="gate-result ' + notice.kind + '">' + I(notice.kind === "deleted" ? "trash" : "check") + "</span>" +
        '<h1 id="gate-title">' + (notice.kind === "deleted" ? "帳號已刪除" : "已登出") + "</h1>" +
        '<p class="gate-sub">' + (notice.kind === "deleted" ? "雲端和這台裝置上的資料都已經清除。" + esc(notice.note || "") : "進度和筆跡都存在雲端，下次登入就會回來。") + "</p></div>";
    } else if (!signing) {
      head += feats();
    }
    var h = '<div class="gate-card' + (signing ? " signing" : "") + (notice ? " result" : "") + '">' + head;
    if (signing) {
      h += steps(stage === "auth" ? 0 : stage === "load" ? 1 : 3);
    } else if (!c) {
      h += '<form class="sync-form" data-f="cfg">' +
        '<input name="url" type="url" placeholder="Supabase Project URL" autocomplete="off" required>' +
        '<input name="key" type="text" placeholder="publishable key" autocomplete="off" required>' +
        '<button type="submit" class="gsi-btn">儲存設定</button></form>';
    } else if (stage === "connect") {
      h += '<div class="gsi-btn ghost" aria-hidden="true"><span class="spin"></span><span>準備登入…</span></div>';
    } else if (stage === "go") {
      h += '<button type="button" class="gsi-btn going" disabled><span class="spin"></span><span>正在前往 Google…</span></button>';
    } else {
      h += '<button type="button" class="gsi-btn" data-act="google">' + GLOGO + "<span>使用 Google 帳戶登入</span></button>";
    }
    gate.innerHTML = h + '<p class="gate-msg" aria-live="polite">' + esc(gateText) + '</p><p class="gate-legal"><a href="' + PRIVACY + '">隱私權政策</a></p></div>';
  }
  function who() {
    var name = displayName();
    return '<div class="who-row"><button type="button" class="who-av" data-act="avatar" aria-label="更換頭像">' + avatarHtml() + '<span class="who-edit">' + I("pen") + "</span></button>" +
      '<div class="who-txt">' + (name ? "<b>" + esc(name) + "</b>" : "") + '<span class="email">' + esc(user.email || "") + "</span>" +
      '<button type="button" class="linkish" data-act="avatar">更換頭像</button></div></div>';
  }
  function renderBox() {
    if (!box) return;
    var h = '<div class="eyebrow">帳號與雲端同步</div>';
    if (user) {
      h += who() + '<div class="inkbak-btns"><button type="button" data-act="sync">' + I("sync") + '<span>立即同步</span></button><button type="button" data-act="out">' + I("logout") + "<span>登出</span></button></div>";
    }
    box.innerHTML = h + msg("inkbak-msg") + (user ? legal() : "");
  }
  function renderAcct() {
    if (!acct) return;
    if (!user) { acct.innerHTML = ""; acct.classList.remove("open"); return; }
    var open = acct.classList.contains("open");
    acct.innerHTML = '<button type="button" class="acct-btn" data-act="menu" aria-haspopup="true" aria-expanded="' + open + '" aria-label="帳號">' + avatarHtml() + "</button>" +
      '<div class="acct-pop">' + who() +
      '<div class="row"><button type="button" data-act="sync">' + I("sync") + '<span>立即同步</span></button><button type="button" data-act="out">' + I("logout") + "<span>登出</span></button></div>" + msg() + legal() + "</div>";
  }
  function legal() {
    return '<p class="acct-legal"><a href="' + PRIVACY + '">隱私權政策</a><button type="button" class="acct-del" data-act="delete">刪除帳號</button></p>';
  }
  function renderAll() { renderGate(); renderBox(); renderAcct(); }
  function setStage(s) { stage = s; renderGate(); }

  function onClick(e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var act = b.dataset.act;
    if (act === "google" && sb) google();
    if (act === "sync") syncNow();
    if (act === "out" && sb) signOut();
    if (act === "delete" && sb && user) deleteAccount();
    if (act === "avatar" && user) { if (acct) acct.classList.remove("open"); openPicker(); }
    if (act === "menu") { var on = !acct.classList.contains("open"); acct.classList.toggle("open", on); b.setAttribute("aria-expanded", String(on)); }
  }
  [gate, box, acct].forEach(function (el) { if (el) el.addEventListener("click", onClick); });
  document.addEventListener("click", function (e) { if (acct && acct.classList.contains("open") && !acct.contains(e.target)) acct.classList.remove("open"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (sheet) closePicker(); else if (acct) acct.classList.remove("open"); } });
  gate.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.dataset.f !== "cfg") return;
    var url = baseUrl(f.url.value), key = f.key.value.trim();
    if (!/^https:\/\/[^/]+$/.test(url)) { gsay("Project URL 的格式應該像 https://xxxx.supabase.co"); return; }
    lsSet(CFG_KEY, JSON.stringify({ url: url, key: key }));
    gsay(""); start();
  });
  // 別台裝置換了頭像，或換帳號清掉資料
  document.addEventListener("cgep:state-remote", function (e) {
    if (e.detail.wiped || (e.detail.keys || []).indexOf(PROFILE_KEY) >= 0) { renderBox(); renderAcct(); }
  });

  /* ---------- 登入、登出 ---------- */
  // 前往 Google 登入。登入完會回到這一頁（不帶 #），所以先記住現在看到哪裡，回來再跳回去
  function google() {
    try { sessionStorage.setItem(RETURN_KEY, location.hash); } catch (e) {}
    gsay("");
    notice = null;
    setStage("go");
    sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } }
    }).then(function (r) { if (r && r.error) { gsay(errText(r.error)); setStage("ready"); } });
    // 使用者按了上一頁又回來時（頁面從快取還原），按鈕恢復可以按
    setTimeout(function () { if (stage === "go") setStage("ready"); }, 15000);
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted && stage === "go") setStage("ready"); });
  function goBack() {
    var h = null;
    try { h = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
    if (h && h !== location.hash) location.hash = h;
  }
  // Google 或 Supabase 登入失敗時，錯誤會放在網址（?error=… 或 #error=…）：讀出來顯示，再從網址拿掉
  function takeUrlError() {
    var q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ""));
    var desc = q.get("error_description") || h.get("error_description") || q.get("error") || h.get("error");
    if (!desc) return "";
    var code = q.get("error_code") || h.get("error_code") || q.get("error") || h.get("error") || "";
    ["error", "error_code", "error_description"].forEach(function (k) { q.delete(k); });
    var qs = q.toString(), hash = h.get("error") || h.get("error_description") ? "" : location.hash;
    try { history.replaceState(history.state, "", location.pathname + (qs ? "?" + qs : "") + hash); } catch (e) {}
    fromOAuth = false;
    stage = "connect";
    setTimeout(goBack, 0);
    return errText({ message: desc, code: code });
  }
  // 登出前先同步；同步不了（沒網路）就先問一聲，因為下一個登入的人會清掉這台裝置上的資料
  function signOut() {
    say("登出前先同步…");
    syncNow().then(function (ok) {
      if (!ok && !window.confirm("有些資料還沒同步到雲端（可能沒網路）。現在登出的話，之後換別的帳號在這台裝置登入時，這些資料會被清掉。確定要登出？")) { say(""); return; }
      notice = { kind: "out" };
      return sb.auth.signOut({ scope: "local" }).then(function () { say(""); gsay(""); renderGate(); }, function () { notice = null; });
    });
  }
  // 刪除帳號：雲端的帳號、進度、筆跡全部刪掉（delete_my_account() 刪 auth.users，資料表跟著 cascade 刪除），
  // 再清掉這台裝置上的資料、登出
  function deleteAccount() {
    var email = user.email || "這個帳號";
    if (!window.confirm("刪除帳號 " + email + "？\n\n雲端上的讀書進度、小考紀錄和所有手寫筆跡都會永久刪除，這台裝置上的資料也會清掉，無法復原。")) return;
    deleting = true; clearTimeout(timer);
    var uid = user.id;
    say("刪除中…");
    sb.rpc("delete_my_account").then(function (r) {
      if (!r.error) return "";
      // 刪除帳號的函式還沒建立（或沒權限）：至少把自己的資料刪掉（資料表權限允許刪自己的資料）
      return Promise.all([
        sb.from("ink_pads").delete().eq("user_id", uid),
        sb.from("user_state").delete().eq("user_id", uid)
      ]).then(function (rs) {
        var bad = rs.filter(function (x) { return x.error; })[0];
        if (bad) throw bad.error;
        return "（雲端的進度和筆跡已刪除；帳號紀錄要請網站管理者在 Supabase 刪除）";
      });
    }).then(function (note) {
      return wipeLocal().then(function () {
        lsDel(OWNER_KEY);
        notice = { kind: "deleted", note: note };
        return sb.auth.signOut({ scope: "local" }).catch(function () {});
      }).then(function () { deleting = false; dirty = false; say(""); gsay(""); renderGate(); });
    }).catch(function (err) {
      deleting = false;
      say("刪除失敗：" + errText(err).replace(/^失敗：/, "") + "（什麼都還沒刪，可以再試一次）");
    });
  }

  // 這台裝置上的資料屬於誰：沒有主人就給現在登入的人（登入前寫的會上傳到他的帳號），換人就先清掉
  function claim(uid) {
    var owner = lsGet(OWNER_KEY);
    if (owner === uid) return Promise.resolve();
    var p = owner ? wipeLocal() : Promise.resolve();
    return p.then(function () { lsSet(OWNER_KEY, uid); });
  }
  function wipeLocal() {
    lsKeys().forEach(function (k) { if (STATE_RE.test(k) || k === META_KEY || k === BASE_KEY || /^cgep:unit:/.test(k)) lsDel(k); });
    dirty = false;
    emit("cgep:state-remote", { keys: [], wiped: true });
    return DB ? DB.clearAll().catch(function () {}) : Promise.resolve();
  }
  // 登入卡片淡出，頁面出現
  function leave() {
    if (!root.classList.contains("gate")) return;
    root.classList.add("gate-leaving");
    root.classList.remove("gate");
    setTimeout(function () { root.classList.remove("gate-leaving"); }, 450);
  }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function setUser(u) {
    chain = chain.then(function () {
      var was = user && user.id;
      if (!u) {
        user = null; lastOk = 0;
        root.classList.add("gate");
        stage = "ready";
        renderAll();
        return;
      }
      if (u.id === was) { user = u; renderBox(); renderAcct(); return; }
      var gated = root.classList.contains("gate");
      notice = null;
      if (gated) setStage("load");
      return claim(u.id).then(function () {
        user = u; lastOk = 0;
        renderBox(); renderAcct();
        // 剛登入：先把雲端的進度抓下來再顯示頁面（最多等 6 秒，沒網路也不會卡住）
        var first = syncNow({ quiet: true });
        if (!gated) return;
        return Promise.race([first, wait(6000)]).then(function () {
          if (fromOAuth) { fromOAuth = false; goBack(); }
          setStage("done");
          return wait(450);
        }).then(leave);
      });
    }).catch(function () {});
    return chain;
  }

  function errText(err) {
    var m = (err && err.message) || String(err), code = (err && err.code) || "";
    if (/signup_disabled|Signups not allowed/i.test(code + " " + m)) return "這個 Google 帳號不能登入：網站目前不開放新帳號。";
    if (/access_denied/i.test(code) || /access.denied|cancel/i.test(m)) return "Google 登入沒有完成（可能按了取消），再按一次「使用 Google 登入」。";
    if (/provider is not enabled|Unsupported provider/i.test(m)) return "Supabase 還沒開啟 Google 登入：Authentication → Sign In / Providers → Google。";
    if (/code verifier|flow state|invalid.*grant|bad_code_verifier/i.test(code + " " + m)) return "登入逾時或在別的分頁完成了，請再按一次「使用 Google 登入」。";
    if (/rate limit|too many/i.test(m)) return "嘗試太多次了，等幾分鐘再試。";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "連不到 Supabase，檢查一下網路。";
    if (/Invalid API key|No API key/i.test(m)) return "API key 不對，請重新確認 publishable key。";
    if (/relation .* does not exist|Could not find the table/i.test(m)) return "雲端的資料表還沒建好：請在 Supabase 的 SQL Editor 重新執行一次 supabase/schema.sql。";
    if (/permission denied/i.test(m)) return "雲端資料表沒有開權限：請在 Supabase 的 SQL Editor 重新執行一次 supabase/schema.sql。";
    return "失敗：" + m;
  }

  /* ---------- 同步 ---------- */
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { syncNow(); }, ms); }
  function chunks(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }
  function same(uid) { return user && user.id === uid; }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

  // 進度（localStorage）：資料量很小，一次全部抓下來比較。
  // base[k]：上次和雲端一致時的版本時間。兩邊都在那之後改過 → 合併（清單取聯集，這台裝置的值優先）。
  function syncState(uid, res) {
    return sb.from("user_state").select("key,t,data").then(function (r) {
      if (r.error) throw r.error;
      if (!same(uid)) return;
      var meta = readMap(META_KEY), base = readMap(BASE_KEY), remote = {}, keys = {}, pulled = [], push = [], after = {};
      r.data.forEach(function (row) { remote[row.key] = row; keys[row.key] = 1; });
      lsKeys().forEach(function (k) { if (STATE_RE.test(k)) keys[k] = 1; });
      Object.keys(keys).forEach(function (k) {
        var rr = remote[k], rt = rr ? Number(rr.t) : 0, lt = meta[k] || 0, bt = base[k] || 0, raw = lsGet(k), lv;
        if (raw !== null) { try { lv = JSON.parse(raw); } catch (e) { raw = null; } }
        if (rr && raw !== null && lt > bt && rt > bt && lt !== rt) {
          var mv = isObj(lv) && isObj(rr.data) ? Object.assign({}, rr.data, lv) : (lt >= rt ? lv : rr.data);
          var t = Math.max(lt, rt) + 1;
          lsSet(k, JSON.stringify(mv)); meta[k] = t; pulled.push(k);
          push.push({ user_id: uid, key: k, t: t, data: mv }); after[k] = t;
        } else if (rr && rt > lt) {
          lsSet(k, JSON.stringify(rr.data)); meta[k] = rt; base[k] = rt; pulled.push(k);
        } else if (raw !== null && (!rr || lt > rt)) {
          if (!lt) meta[k] = lt = Date.now();
          push.push({ user_id: uid, key: k, t: lt, data: lv }); after[k] = lt;
        } else if (rr) base[k] = rt;
      });
      writeMap(META_KEY, meta); writeMap(BASE_KEY, base);
      res.down += pulled.length;
      if (pulled.length) emit("cgep:state-remote", { keys: pulled });
      if (!push.length) return;
      return sb.from("user_state").upsert(push, { onConflict: "user_id,key" }).then(function (r2) {
        if (r2.error) throw r2.error;
        // 傳上去成功才記為「和雲端一致」，失敗的話下次還會再傳
        var b2 = readMap(BASE_KEY);
        Object.keys(after).forEach(function (k) { b2[k] = after[k]; });
        writeMap(BASE_KEY, b2);
        res.up += push.length;
      });
    });
  }

  // 手寫（IndexedDB）：先只比時間，需要的那幾題才下載或上傳筆畫
  function syncInk(uid, res) {
    var remote = {}, local = {};
    return sb.from("ink_pads").select("key,t,deleted").then(function (r) {
      if (r.error) throw r.error;
      r.data.forEach(function (row) { remote[row.key] = row; });
      return DB.meta();
    }).then(function (m) {
      if (!same(uid)) return;
      local = m;
      var keys = {}, pull = [], push = [];
      Object.keys(remote).concat(Object.keys(local)).forEach(function (k) { keys[k] = 1; });
      Object.keys(keys).forEach(function (k) {
        var rr = remote[k], ll = local[k];
        if (rr && (!ll || Number(rr.t) > ll.t)) pull.push(k);
        else if (ll && (!rr || ll.t > Number(rr.t))) push.push(k);
      });
      // 雲端比較新的：抓下來寫進這台裝置
      return chunks(pull, 25).reduce(function (p, part) {
        return p.then(function () {
          var list = "(" + part.map(function (k) { return '"' + k.replace(/"/g, '\\"') + '"'; }).join(",") + ")";
          return sb.from("ink_pads").select("key,t,deleted,data").filter("key", "in", list).then(function (r) {
            if (r.error) throw r.error;
            if (!same(uid)) return;
            var rows = r.data.map(function (x) { return { key: x.key, t: Number(x.t), deleted: x.deleted, data: x.data }; });
            res.inkPulled = res.inkPulled.concat(rows.map(function (x) { return x.key; }));
            return rows.length ? DB.applyRemote(rows) : null;
          });
        });
      }, Promise.resolve()).then(function () {
        // 這台裝置比較新的：傳上去
        return chunks(push, 8).reduce(function (p, part) {
          return p.then(function () {
            return Promise.all(part.map(function (k) {
              if (local[k].del) return { user_id: uid, key: k, t: local[k].t, deleted: true, data: null };
              return DB.get(k).then(function (v) {
                return v ? { user_id: uid, key: k, t: local[k].t, deleted: false, data: v } : { user_id: uid, key: k, t: local[k].t, deleted: true, data: null };
              });
            })).then(function (rows) {
              return sb.from("ink_pads").upsert(rows, { onConflict: "user_id,key" }).then(function (r) {
                if (r.error) throw r.error;
                res.inkPushed = res.inkPushed.concat(part);
              });
            });
          });
        }, Promise.resolve());
      });
    });
  }

  // 回傳 true：全部同步好了；false：有失敗（資料還在這台裝置）。quiet：只是檢查，沒東西要傳就不顯示「同步中」
  function syncNow(opt) {
    opt = opt || {};
    if (!sb || !user || deleting) return Promise.resolve(false);
    if (busy) { again = true; return running; }
    busy = true; again = false;
    var wasDirty = dirty;
    dirty = false;
    clearTimeout(timer);
    if (!opt.quiet) say("同步中…");
    var uid = user.id, res = { up: 0, down: 0, inkPulled: [], inkPushed: [] }, errs = [];
    running = syncState(uid, res).catch(function (e) { errs.push(e); })
      .then(function () { return DB ? syncInk(uid, res).catch(function (e) { errs.push(e); }) : null; })
      .then(function () {
        if (errs.length) {
          dirty = dirty || wasDirty;
          say("同步失敗：" + errText(errs[0]).replace(/^失敗：/, "") + "（資料還在這台裝置" + (dirty ? "，等一下會再試" : "") + "）");
          if (dirty) schedule(60000);
          return false;
        }
        lastOk = Date.now();
        var up = res.up + res.inkPushed.length, down = res.down + res.inkPulled.length;
        if (up || down) say("已同步（" + hhmm(lastOk) + "）" + (up ? "，上傳 " + up + " 項" : "") + (down ? "，從雲端更新 " + down + " 項" : ""));
        else say(opt.quiet ? "雲端和這台裝置的資料一致" : "已同步（" + hhmm(lastOk) + "），沒有需要更新的資料");
        emit("cgep:synced", { pulled: res.inkPulled, pushed: res.inkPushed });
        return true;
      })
      .then(function (ok) { busy = false; if (again) { again = false; schedule(500); } return ok; });
    return running;
  }

  // 有變更才同步：手寫存檔、進度修改（CGEP_STATE.touch）時排一次；離開頁面時還沒傳的先傳；網路恢復時補傳
  document.addEventListener("cgep:ink-local", function () { dirty = true; if (user) schedule(2500); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && dirty && user) syncNow({ quiet: true }); });
  window.addEventListener("online", function () { if (user && dirty) syncNow(); });

  /* ---------- 連線 ---------- */
  function start() {
    var c = cfg();
    if (!c) { stage = "cfg"; root.classList.add("gate"); renderAll(); return; }
    renderAll();
    loadLib().then(function () {
      sb = window.supabase.createClient(c.url, c.key, {
        auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "cgep-sb-auth" }
      });
      sb.auth.onAuthStateChange(function (ev, session) {
        // 不要在這個 callback 裡直接呼叫其他 Supabase 函式（會卡住），丟到下一輪
        setTimeout(function () { setUser(session ? session.user : null); }, 0);
      });
      return sb.auth.getSession().then(function (r) {
        var s = r.data && r.data.session;
        if (!s && fromOAuth) fromOAuth = false; // 換 code 失敗（錯誤已經顯示）
        if (!s) stage = "ready";
        return setUser(s ? s.user : null);
      });
    }).catch(function () {
      // 程式庫載不到（沒網路）：之前登入過就照常用（資料都在這台裝置），沒登入過才擋
      if (!lsGet("cgep-sb-auth")) root.classList.add("gate");
      say("現在連不到雲端，進度先存在這台裝置，有網路時會自動同步。");
      gsay("需要網路才能登入，連上網路後重新整理頁面。");
      fromOAuth = false;
      stage = "ready";
      renderAll();
    });
  }
  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = LIB; s.async = true;
      s.onload = function () { window.supabase && window.supabase.createClient ? res() : rej(new Error("lib")); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  start();
})();
