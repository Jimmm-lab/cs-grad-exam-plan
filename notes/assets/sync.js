/* 帳號與雲端同步（Supabase），首頁和教材頁共用。
 *
 * 1. 一定要登入才能用網站：還沒登入時 <html class="gate">，頁面藏起來，只顯示「使用 Google 登入」。
 *    （<head> 裡有一小段程式先看有沒有登入紀錄，沒有就先加上 gate，頁面不會先閃一下。）
 * 2. 每個人的資料分開：讀書進度、休息日、考古題進度、小考紀錄（localStorage）和手寫筆跡（IndexedDB）
 *    都存在自己帳號底下。這台裝置記得資料是誰的（cgep:owner），換別的帳號登入時，先清掉前一個人的資料，
 *    再從雲端抓新帳號的資料下來。
 * 3. 同步：每一項比較「最後修改時間」，比較新的那邊蓋掉另一邊。
 *    開頁面、登入、回到這個分頁、修改後幾秒、按「立即同步」時各同步一次。
 *
 * 登入：Google 帳號（OAuth，PKCE 流程：Google 登入完回到原本的頁面，網址帶 ?code=，supabase-js 自己換成登入狀態
 *       並把 code 從網址拿掉）。
 * 設定：supabase-config.js 填 url 和 key（publishable key，本來就是公開的，資料靠資料表的 Row Level Security 保護）。
 * 資料表：supabase/schema.sql（ink_pads：手寫；user_state：其他進度）。
 */
(function () {
  "use strict";
  var DB = window.CGEP_INKDB || null;
  var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js";
  var CFG_KEY = "cgep:sb:cfg", RETURN_KEY = "cgep:sb:return", OWNER_KEY = "cgep:owner", META_KEY = "cgep:state-meta";
  // 要跟著帳號走的進度：每個考試的 done／rest／papers，每個教材頁的小考紀錄
  var STATE_RE = /^cgep:(quiz:[\w-]+|[\w-]+:(done|rest|papers))$/;
  var I = window.CGEP_ICON || function () { return ""; };
  var root = document.documentElement;
  var fromOAuth = /[?&]code=/.test(location.search);
  var sb = null, user = null, busy = false, again = false, timer = 0, lastOk = 0, running = null, chain = Promise.resolve();

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function lsKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; }
  function readMeta() { try { return JSON.parse(lsGet(META_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeMeta(m) { lsSet(META_KEY, JSON.stringify(m)); }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  // 從 Supabase 複製網址時常常會帶到 /rest/v1/，只留 https://xxxx.supabase.co
  function baseUrl(u) { return String(u || "").trim().replace(/\/(rest|auth|storage|realtime)\/v1.*$/i, "").replace(/\/+$/, ""); }
  function cfg() {
    var c = window.CGEP_SUPABASE || {};
    if (c.url && c.key) return { url: baseUrl(c.url), key: String(c.key).trim(), fixed: true };
    try { var v = JSON.parse(lsGet(CFG_KEY) || "null"); if (v && v.url && v.key) return { url: baseUrl(v.url), key: v.key }; } catch (e) {}
    return null;
  }

  // 頁面存進度時呼叫：記下修改時間，幾秒後同步
  window.CGEP_STATE = {
    touch: function (k) {
      if (!STATE_RE.test(k)) return;
      var m = readMeta(); m[k] = Date.now(); writeMeta(m);
      if (user) schedule(1500);
    }
  };
  window.CGEP_SYNC = {
    signedIn: function () { return !!user; },
    now: function () { return syncNow(); }
  };

  /* ---------- 畫面：登入卡片、目錄裡的同步區、首頁的帳號按鈕 ---------- */
  var gate = document.createElement("div");
  gate.className = "gate-screen";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "gate-title");
  document.body.appendChild(gate);

  var side = document.querySelector("aside.toc"), box = null;
  if (side) { box = document.createElement("div"); box.className = "inkbak sync"; side.appendChild(box); }
  var acct = document.getElementById("acct");

  var msgText = takeUrlError();
  function say(t) { msgText = t; document.querySelectorAll(".sync-msg").forEach(function (m) { m.textContent = t; }); }
  function hhmm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function msg(extra) { return '<p class="sync-msg' + (extra ? " " + extra : "") + '" aria-live="polite">' + esc(msgText) + "</p>"; }

  function renderGate() {
    var c = cfg(), h = '<div class="gate-card"><div class="gate-mark">' + I("pen") + '</div><h1 id="gate-title">資工所備考</h1>' +
      "<p>登入後才能使用。讀書進度、小考紀錄和手寫筆跡都存在你自己的帳號，跟其他人分開；換手機或電腦，登入同一個帳號就能接著讀。</p>";
    if (!c) {
      h += '<form class="sync-form" data-f="cfg">' +
        '<input name="url" type="url" placeholder="Supabase Project URL" autocomplete="off" required>' +
        '<input name="key" type="text" placeholder="publishable key" autocomplete="off" required>' +
        '<button type="submit" class="gate-btn">儲存設定</button></form>';
    } else if (!sb || (fromOAuth && !user)) {
      h += '<p class="gate-wait">' + (fromOAuth ? "登入中…" : "連線中…") + "</p>";
    } else {
      h += '<button type="button" class="gate-btn" data-act="google">' + I("login") + "<span>使用 Google 登入</span></button>" +
        '<p class="gate-note">只有受邀的 Google 帳號能登入。</p>';
    }
    gate.innerHTML = h + msg("gate-msg") + "</div>";
  }
  function renderBox() {
    if (!box) return;
    var h = '<div class="eyebrow">帳號與雲端同步</div>';
    if (user) {
      h += "<p>已登入 <b>" + esc(user.email || "") + "</b></p>" +
        '<div class="inkbak-btns"><button type="button" data-act="sync">' + I("sync") + '<span>立即同步</span></button><button type="button" data-act="out">' + I("logout") + "<span>登出</span></button></div>";
    }
    box.innerHTML = h + msg("inkbak-msg");
  }
  function renderAcct() {
    if (!acct) return;
    if (!user) { acct.innerHTML = ""; acct.classList.remove("open"); return; }
    var open = acct.classList.contains("open");
    acct.innerHTML = '<button type="button" class="acct-btn" data-act="menu" aria-haspopup="true" aria-expanded="' + open + '" aria-label="帳號">' + I("user") + "</button>" +
      '<div class="acct-pop"><p class="who">已登入</p><p class="email">' + esc(user.email || "") + "</p>" +
      '<div class="row"><button type="button" data-act="sync">' + I("sync") + '<span>立即同步</span></button><button type="button" data-act="out">' + I("logout") + "<span>登出</span></button></div>" + msg() + "</div>";
  }
  function renderAll() { renderGate(); renderBox(); renderAcct(); }

  function onClick(e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var act = b.dataset.act;
    if (act === "google" && sb) google();
    if (act === "sync") syncNow();
    if (act === "out" && sb) signOut();
    if (act === "menu") { var on = !acct.classList.contains("open"); acct.classList.toggle("open", on); b.setAttribute("aria-expanded", String(on)); }
  }
  [gate, box, acct].forEach(function (el) { if (el) el.addEventListener("click", onClick); });
  document.addEventListener("click", function (e) { if (acct && acct.classList.contains("open") && !acct.contains(e.target)) acct.classList.remove("open"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && acct) acct.classList.remove("open"); });
  gate.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.dataset.f !== "cfg") return;
    var url = baseUrl(f.url.value), key = f.key.value.trim();
    if (!/^https:\/\/[^/]+$/.test(url)) { say("Project URL 的格式應該像 https://xxxx.supabase.co"); return; }
    lsSet(CFG_KEY, JSON.stringify({ url: url, key: key }));
    say(""); start();
  });

  /* ---------- 登入、登出 ---------- */
  // 前往 Google 登入。登入完會回到這一頁（不帶 #），所以先記住現在看到哪裡，回來再跳回去
  function google() {
    try { sessionStorage.setItem(RETURN_KEY, location.hash); } catch (e) {}
    say("前往 Google 登入…");
    sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } }
    }).then(function (r) { if (r && r.error) say(errText(r.error)); });
  }
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
    setTimeout(goBack, 0);
    return errText({ message: desc, code: code });
  }
  // 登出前先同步；同步不了（沒網路）就先問一聲，因為下一個登入的人會清掉這台裝置上的資料
  function signOut() {
    say("登出前先同步…");
    syncNow().then(function (ok) {
      if (!ok && !window.confirm("有些資料還沒同步到雲端（可能沒網路）。現在登出的話，之後換別的帳號在這台裝置登入時，這些資料會被清掉。確定要登出？")) { say(""); return; }
      return sb.auth.signOut({ scope: "local" }).then(function () { say("已登出。"); });
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
    lsKeys().forEach(function (k) { if (STATE_RE.test(k) || k === META_KEY || /^cgep:unit:/.test(k)) lsDel(k); });
    emit("cgep:state-remote", { keys: [], wiped: true });
    return DB ? DB.clearAll().catch(function () {}) : Promise.resolve();
  }

  function setUser(u) {
    chain = chain.then(function () {
      var was = user && user.id;
      if (!u) {
        user = null; lastOk = 0;
        root.classList.add("gate");
        renderAll();
        return;
      }
      if (u.id === was) { user = u; renderAll(); return; }
      return claim(u.id).then(function () {
        user = u; lastOk = 0;
        if (fromOAuth) { fromOAuth = false; say(""); goBack(); }
        root.classList.remove("gate");
        renderAll();
        setTimeout(syncNow, 0);
      });
    }).catch(function () {});
    return chain;
  }

  function errText(err) {
    var m = (err && err.message) || String(err), code = (err && err.code) || "";
    if (/signup_disabled|Signups not allowed/i.test(code + " " + m)) return "這個 Google 帳號不能登入：網站目前不開放新帳號。";
    if (/access_denied/i.test(code) || /access.denied|cancel/i.test(m)) return "Google 登入沒有完成（取消了，或這個帳號不在受邀名單裡）。";
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
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(syncNow, ms); }
  function chunks(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }
  function same(uid) { return user && user.id === uid; }

  // 進度（localStorage）：資料量很小，一次全部抓下來比較
  function syncState(uid, res) {
    return sb.from("user_state").select("key,t,data").then(function (r) {
      if (r.error) throw r.error;
      if (!same(uid)) return;
      var meta = readMeta(), remote = {}, keys = {}, pulled = [], push = [];
      r.data.forEach(function (row) { remote[row.key] = row; keys[row.key] = 1; });
      lsKeys().forEach(function (k) { if (STATE_RE.test(k)) keys[k] = 1; });
      Object.keys(keys).forEach(function (k) {
        var rr = remote[k], lt = meta[k] || 0, raw = lsGet(k);
        if (rr && Number(rr.t) > lt) {
          lsSet(k, JSON.stringify(rr.data)); meta[k] = Number(rr.t); pulled.push(k);
        } else if (raw !== null && (!rr || lt > Number(rr.t))) {
          var v; try { v = JSON.parse(raw); } catch (e) { return; }
          if (!lt) meta[k] = lt = Date.now();
          push.push({ user_id: uid, key: k, t: lt, data: v });
        }
      });
      writeMeta(meta);
      res.state += pulled.length + push.length;
      if (pulled.length) emit("cgep:state-remote", { keys: pulled });
      if (!push.length) return;
      return sb.from("user_state").upsert(push, { onConflict: "user_id,key" }).then(function (r2) { if (r2.error) throw r2.error; });
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

  // 回傳 true：全部同步好了；false：有失敗（資料還在這台裝置，等一下會再試）
  function syncNow() {
    if (!sb || !user) return Promise.resolve(false);
    if (busy) { again = true; return running; }
    busy = true; again = false;
    say("同步中…");
    var uid = user.id, res = { state: 0, inkPulled: [], inkPushed: [] }, errs = [];
    running = syncState(uid, res).catch(function (e) { errs.push(e); })
      .then(function () { return DB ? syncInk(uid, res).catch(function (e) { errs.push(e); }) : null; })
      .then(function () {
        if (errs.length) {
          say("同步失敗：" + errText(errs[0]).replace(/^失敗：/, "") + "（資料還在這台裝置，等一下會再試）");
          schedule(60000);
          return false;
        }
        lastOk = Date.now();
        var n = res.inkPulled.length + res.inkPushed.length;
        say("已同步（" + hhmm(lastOk) + "）" + (n ? "，手寫 " + n + " 題" : ""));
        emit("cgep:synced", { pulled: res.inkPulled, pushed: res.inkPushed });
        return true;
      })
      .then(function (ok) { busy = false; if (again) schedule(500); return ok; });
    return running;
  }

  document.addEventListener("cgep:ink-local", function () { if (user) schedule(2500); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && user && Date.now() - lastOk > 15000) syncNow(); });
  window.addEventListener("online", function () { if (user) syncNow(); });

  /* ---------- 連線 ---------- */
  function start() {
    var c = cfg();
    renderAll();
    if (!c) { root.classList.add("gate"); return; }
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
        return setUser(s ? s.user : null);
      });
    }).catch(function () {
      // 程式庫載不到（沒網路）：之前登入過就照常用（資料都在這台裝置），沒登入過才擋
      if (!lsGet("cgep-sb-auth")) root.classList.add("gate");
      say(lsGet("cgep-sb-auth") ? "現在連不到雲端，進度先存在這台裝置，有網路時會自動同步。" : "需要網路才能登入，連上網路後重新整理頁面。");
      fromOAuth = false;
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
