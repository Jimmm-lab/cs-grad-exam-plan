/* 手寫筆跡的本機資料庫（IndexedDB：cgep-ink），手寫板和雲端同步共用。
 *
 * - pads：key「頁面:題目 id」→ { v, H, s（筆畫）, t（最後修改時間，毫秒） }
 * - meta：key → { t, del }。每一題最後修改的時間，清除的題目留下 del: true（同步時才知道要刪雲端那份）。
 *   同步只要比對 meta，不用把每一題的筆畫都讀出來。
 */
window.CGEP_INKDB = (function () {
  "use strict";
  var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error("no indexedDB")); return; }
      var r;
      try { r = indexedDB.open("cgep-ink", 2); } catch (e) { rej(e); return; }
      r.onupgradeneeded = function (ev) {
        var db = r.result, tx = r.transaction;
        if (!db.objectStoreNames.contains("pads")) db.createObjectStore("pads");
        if (!db.objectStoreNames.contains("meta")) {
          var meta = db.createObjectStore("meta");
          // 從第 1 版升級：已經存在的筆跡補上 meta
          if (ev.oldVersion >= 1) {
            var cur = tx.objectStore("pads").openCursor();
            cur.onsuccess = function () {
              var c = cur.result;
              if (!c) return;
              meta.put({ t: (c.value && c.value.t) || 0, del: false }, c.key);
              c.continue();
            };
          }
        }
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error("blocked")); };
    });
    return dbp;
  }
  function run(stores, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(stores, mode), out;
        var req = fn(t);
        if (req) req.onsuccess = function () { out = req.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  function all(storeName) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var out = {}, t = db.transaction(storeName, "readonly"), req = t.objectStore(storeName).openCursor();
        req.onsuccess = function () { var c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function notify(keys, remote) {
    document.dispatchEvent(new CustomEvent(remote ? "cgep:ink-remote" : "cgep:ink-local", { detail: { keys: keys } }));
  }
  return {
    get: function (k) { return run("pads", "readonly", function (t) { return t.objectStore("pads").get(k); }); },
    keys: function () { return run("pads", "readonly", function (t) { var s = t.objectStore("pads"); return s.getAllKeys ? s.getAllKeys() : null; }); },
    meta: function () { return all("meta"); },
    pads: function () { return all("pads"); },
    // 手寫板存檔：value.t 是修改時間
    put: function (k, value) {
      return run(["pads", "meta"], "readwrite", function (t) {
        t.objectStore("pads").put(value, k);
        t.objectStore("meta").put({ t: value.t, del: false }, k);
      }).then(function () { notify([k], false); });
    },
    // 清除整題：筆跡刪掉，留下刪除時間
    remove: function (k, time) {
      return run(["pads", "meta"], "readwrite", function (t) {
        t.objectStore("pads").delete(k);
        t.objectStore("meta").put({ t: time, del: true }, k);
      }).then(function () { notify([k], false); });
    },
    // 匯入備份檔
    putMany: function (obj) {
      var keys = Object.keys(obj);
      return run(["pads", "meta"], "readwrite", function (t) {
        keys.forEach(function (k) {
          var v = obj[k];
          if (!v || !v.s) return;
          if (!v.t) v.t = Date.now();
          t.objectStore("pads").put(v, k);
          t.objectStore("meta").put({ t: v.t, del: false }, k);
        });
      }).then(function () { notify(keys, false); });
    },
    // 換成別的帳號登入：把這台裝置上前一個人的筆跡全部清掉
    clearAll: function () {
      var keys = [];
      return all("meta").then(function (m) {
        keys = Object.keys(m);
        return run(["pads", "meta"], "readwrite", function (t) { t.objectStore("pads").clear(); t.objectStore("meta").clear(); });
      }).then(function () { if (keys.length) notify(keys, true); });
    },
    // 雲端比較新：直接寫進來（value 是 null 表示雲端那邊已經清除）
    applyRemote: function (rows) {
      return run(["pads", "meta"], "readwrite", function (t) {
        rows.forEach(function (r) {
          if (r.deleted || !r.data) {
            t.objectStore("pads").delete(r.key);
            t.objectStore("meta").put({ t: r.t, del: true }, r.key);
          } else {
            r.data.t = r.t;
            t.objectStore("pads").put(r.data, r.key);
            t.objectStore("meta").put({ t: r.t, del: false }, r.key);
          }
        });
      }).then(function () { notify(rows.map(function (r) { return r.key; }), true); });
    }
  };
})();
