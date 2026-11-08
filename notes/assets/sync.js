/* 手寫筆跡的雲端同步（Supabase）。
 *
 * 設定：notes/assets/supabase-config.js 填 url 和 key（anon／publishable key，本來就是公開的，
 *       資料靠資料表的 Row Level Security 保護）；沒填的話可以在目錄最下面的「雲端同步」貼上。
 * 資料表：supabase/schema.sql。
 * 同步方式：每一題比較「最後修改時間」，比較新的那邊蓋掉另一邊；清除的題目也會同步。
 *   開頁面、登入、回到這個分頁、手寫存檔後幾秒、按「立即同步」時各同步一次。
 */
(function () {
  "use strict";
  var DB = window.CGEP_INKDB;
  var side = document.querySelector("aside.toc");
  if (!DB || !side) return;

  var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js";
  var CFG_KEY = "cgep:sb:cfg";
  var I = window.CGEP_ICON || function () { return ""; };
  var sb = null, user = null, busy = false, again = false, timer = 0, lastOk = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // 從 Supabase 複製網址時常常會帶到 /rest/v1/，只留 https://xxxx.supabase.co
  function baseUrl(u) { return String(u || "").trim().replace(/\/(rest|auth|storage|realtime)\/v1.*$/i, "").replace(/\/+$/, ""); }
  function cfg() {
    var c = window.CGEP_SUPABASE || {};
    if (c.url && c.key) return { url: baseUrl(c.url), key: String(c.key).trim(), fixed: true };
    try { var v = JSON.parse(localStorage.getItem(CFG_KEY) || "null"); if (v && v.url && v.key) return { url: baseUrl(v.url), key: v.key }; } catch (e) {}
    return null;
  }

  window.CGEP_SYNC = {
    signedIn: function () { return !!user; },
    now: function () { return syncNow(); }
  };

  /* ---------- 介面 ---------- */
  var box = document.createElement("div");
  box.className = "inkbak sync";
  side.appendChild(box);
  var msgText = "";
  function say(t) { msgText = t; var m = box.querySelector(".sync-msg"); if (m) m.textContent = t; }
  function hhmm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

  function render() {
    var c = cfg();
    var h = '<div class="eyebrow">雲端同步（Supabase）</div>';
    if (!c) {
      h += "<p>還沒設定。到 Supabase 專案的 Project Settings → API Keys，把 Project URL 和 publishable（或 anon）key 貼在下面。只要設定一次，這台裝置會記住。</p>" +
        '<form class="sync-form" data-f="cfg">' +
        '<input name="url" type="url" placeholder="https://xxxx.supabase.co" autocomplete="off" required>' +
        '<input name="key" type="text" placeholder="publishable 或 anon key" autocomplete="off" required>' +
        '<button type="submit">儲存設定</button></form>';
    } else if (!sb) {
      h += "<p>連線中…</p>";
    } else if (!user) {
      h += "<p>登入後，手寫筆跡會自動同步到雲端，手機和電腦都能看到。第一次用請先按「註冊」。</p>" +
        '<form class="sync-form" data-f="login">' +
        '<input name="email" type="email" placeholder="Email" autocomplete="username" required>' +
        '<input name="pw" type="password" placeholder="密碼（至少 6 個字元）" autocomplete="current-password" minlength="6" required>' +
        '<div class="inkbak-btns"><button type="submit" data-act="in">登入</button><button type="submit" data-act="up">註冊</button></div></form>' +
        (c.fixed ? "" : '<p><button type="button" class="linkish" data-act="forget">清除 Supabase 設定</button></p>');
    } else {
      h += "<p>已登入 <b>" + esc(user.email || "") + "</b></p>" +
        '<div class="inkbak-btns"><button type="button" data-act="sync">' + I("upload") + '<span>立即同步</span></button><button type="button" data-act="out"><span>登出</span></button></div>';
    }
    h += '<p class="sync-msg inkbak-msg" aria-live="polite">' + esc(msgText) + "</p>";
    box.innerHTML = h;
  }

  box.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, kind = f.dataset.f;
    if (kind === "cfg") {
      var url = baseUrl(f.url.value), key = f.key.value.trim();
      if (!/^https:\/\/[^/]+$/.test(url)) { say("Project URL 的格式應該像 https://xxxx.supabase.co"); return; }
      try { localStorage.setItem(CFG_KEY, JSON.stringify({ url: url, key: key })); } catch (err) {}
      say(""); start();
      return;
    }
    if (kind === "login" && sb) {
      var which = (e.submitter && e.submitter.dataset.act) || "in";
      var email = f.email.value.trim(), pw = f.pw.value;
      say(which === "up" ? "註冊中…" : "登入中…");
      var job = which === "up"
        ? sb.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } })
        : sb.auth.signInWithPassword({ email: email, password: pw });
      job.then(function (r) {
        if (r.error) { say(errText(r.error)); return; }
        if (which === "up" && !r.data.session) say("註冊好了。請到信箱點確認信，再回來按「登入」。");
      });
    }
  });
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b || b.type === "submit") return;
    if (b.dataset.act === "sync") syncNow();
    if (b.dataset.act === "out" && sb) sb.auth.signOut().then(function () { say("已登出。這台裝置上的筆跡還在。"); });
    if (b.dataset.act === "forget") { try { localStorage.removeItem(CFG_KEY); } catch (err) {} sb = null; user = null; say(""); render(); }
  });
  function errText(err) {
    var m = (err && err.message) || String(err);
    if (/Invalid login credentials/i.test(m)) return "Email 或密碼不對。還沒註冊的話先按「註冊」。";
    if (/Email not confirmed/i.test(m)) return "還沒點信箱裡的確認信。點完再登入。";
    if (/already registered|already been registered/i.test(m)) return "這個 Email 已經註冊過了，直接按「登入」。";
    if (/Password should be/i.test(m)) return "密碼至少要 6 個字元。";
    if (/rate limit/i.test(m)) return "太頻繁了，等一下再試（Supabase 寄信有次數限制）。";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "連不到 Supabase：檢查網路，或 Project URL 有沒有貼錯。";
    if (/Invalid API key|No API key/i.test(m)) return "API key 不對，請重新確認 publishable／anon key。";
    if (/relation .* does not exist|Could not find the table/i.test(m)) return "雲端還沒有 ink_pads 資料表：請先在 Supabase 的 SQL Editor 執行 supabase/schema.sql。";
    if (/permission denied/i.test(m)) return "雲端資料表沒有開權限：請在 Supabase 的 SQL Editor 重新執行一次 supabase/schema.sql。";
    return "失敗：" + m;
  }

  /* ---------- 同步 ---------- */
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(syncNow, ms); }
  function chunks(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

  function syncNow() {
    if (!sb || !user) return Promise.resolve();
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; again = false;
    say("同步中…");
    var pulled = [], pushed = [];
    var remote = {}, local = {};
    return sb.from("ink_pads").select("key,t,deleted").then(function (r) {
      if (r.error) throw r.error;
      r.data.forEach(function (row) { remote[row.key] = row; });
      return DB.meta();
    }).then(function (m) {
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
            var rows = r.data.map(function (x) { return { key: x.key, t: Number(x.t), deleted: x.deleted, data: x.data }; });
            pulled = pulled.concat(rows.map(function (x) { return x.key; }));
            return rows.length ? DB.applyRemote(rows) : null;
          });
        });
      }, Promise.resolve()).then(function () {
        // 這台裝置比較新的：傳上去
        return chunks(push, 8).reduce(function (p, part) {
          return p.then(function () {
            return Promise.all(part.map(function (k) {
              if (local[k].del) return { user_id: user.id, key: k, t: local[k].t, deleted: true, data: null };
              return DB.get(k).then(function (v) {
                return v ? { user_id: user.id, key: k, t: local[k].t, deleted: false, data: v } : { user_id: user.id, key: k, t: local[k].t, deleted: true, data: null };
              });
            })).then(function (rows) {
              return sb.from("ink_pads").upsert(rows, { onConflict: "user_id,key" }).then(function (r) {
                if (r.error) throw r.error;
                pushed = pushed.concat(part);
              });
            });
          });
        }, Promise.resolve());
      });
    }).then(function () {
      lastOk = Date.now();
      say("已同步（" + hhmm(lastOk) + "）" + (pulled.length ? "，從雲端下載 " + pulled.length + " 題" : "") + (pushed.length ? "，上傳 " + pushed.length + " 題" : ""));
      document.dispatchEvent(new CustomEvent("cgep:synced", { detail: { pulled: pulled, pushed: pushed } }));
    }).catch(function (err) {
      say("同步失敗：" + errText(err).replace(/^失敗：/, "") + "（筆跡還在這台裝置，等一下會再試）");
      schedule(60000);
    }).then(function () {
      busy = false;
      if (again) schedule(500);
    });
  }

  document.addEventListener("cgep:ink-local", function () { if (user) schedule(2500); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && user && Date.now() - lastOk > 15000) syncNow(); });
  window.addEventListener("online", function () { if (user) syncNow(); });

  /* ---------- 連線 ---------- */
  function start() {
    var c = cfg();
    render();
    if (!c) return;
    loadLib().then(function () {
      sb = window.supabase.createClient(c.url, c.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "cgep-sb-auth" }
      });
      sb.auth.onAuthStateChange(function (ev, session) {
        var was = user && user.id;
        user = session ? session.user : null;
        render();
        if (user && user.id !== was) syncNow();
      });
      return sb.auth.getSession().then(function (r) {
        user = r.data && r.data.session ? r.data.session.user : null;
        render();
        if (user && !busy && !lastOk) syncNow();
      });
    }).catch(function () {
      say("載入 Supabase 程式庫失敗，檢查網路後重新整理頁面。");
      render();
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
