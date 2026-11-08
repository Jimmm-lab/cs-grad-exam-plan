/* 頭像：自己畫的動物頭像（SVG，不用 emoji），在帳號選單裡選。首頁和教材頁共用。
 * CGEP_AVATARS.svg(id, cls) 回傳一段 <svg>；list 是全部的選項；defaultFor(使用者 id) 是還沒選時的預設頭像。 */
window.CGEP_AVATARS = (function () {
  "use strict";
  var INK = "#2b2b33";
  function eyes(y, dx) {
    dx = dx || 7.5;
    var l = 32 - dx, r = 32 + dx;
    return '<circle cx="' + l + '" cy="' + y + '" r="2.8" fill="' + INK + '"/><circle cx="' + r + '" cy="' + y + '" r="2.8" fill="' + INK + '"/>' +
      '<circle cx="' + (l + 0.9) + '" cy="' + (y - 0.9) + '" r="0.9" fill="#fff"/><circle cx="' + (r + 0.9) + '" cy="' + (y - 0.9) + '" r="0.9" fill="#fff"/>';
  }
  function blush(y, dx) {
    dx = dx || 13;
    return '<ellipse cx="' + (32 - dx) + '" cy="' + y + '" rx="3.4" ry="2.1" fill="#ff8fa3" opacity=".55"/><ellipse cx="' + (32 + dx) + '" cy="' + y + '" rx="3.4" ry="2.1" fill="#ff8fa3" opacity=".55"/>';
  }
  function mouth(y, c) {
    return '<path d="M32 ' + y + 'c-1 1.5-3 1.5-3.8.3M32 ' + y + 'c1 1.5 3 1.5 3.8.3" stroke="' + (c || INK) + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
  }
  var A = [
    { id: "cat", name: "貓咪", bg: "#FFE7C7", body:
      '<path d="M13 31 16 9l14 11z" fill="#F29E4C"/><path d="M51 31 48 9 34 20z" fill="#F29E4C"/>' +
      '<path d="M17.5 24 18.8 14 25.5 19.5z" fill="#FFC3A0"/><path d="M46.5 24 45.2 14 38.5 19.5z" fill="#FFC3A0"/>' +
      '<ellipse cx="32" cy="36" rx="20" ry="17" fill="#F29E4C"/>' +
      '<path d="M32 20v5.5M27 21l1 4.5M37 21l-1 4.5" stroke="#D9772B" stroke-width="2.2" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="42.5" rx="8" ry="5.5" fill="#FFF1E0"/>' + eyes(34) +
      '<path d="M30 39.6h4l-2 2.3z" fill="#E86A7A"/>' + mouth(41.9, "#7a4a2a") +
      '<path d="M11 38.5l8.5.8M11 43.5l8.5-1.2M53 38.5l-8.5.8M53 43.5l-8.5-1.2" stroke="#B5651D" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>' + blush(41, 14) },
    { id: "dog", name: "狗狗", bg: "#E1EDF9", body:
      '<ellipse cx="14.5" cy="34" rx="7" ry="13" fill="#8A5A3B" transform="rotate(15 14.5 34)"/><ellipse cx="49.5" cy="34" rx="7" ry="13" fill="#8A5A3B" transform="rotate(-15 49.5 34)"/>' +
      '<ellipse cx="32" cy="35" rx="17" ry="18" fill="#D9A877"/>' +
      '<ellipse cx="32" cy="43" rx="10" ry="7.5" fill="#FFF6EA"/>' + eyes(32, 7) +
      '<ellipse cx="32" cy="39" rx="4" ry="2.8" fill="#3a2a22"/>' + mouth(41.8, "#3a2a22") +
      '<path d="M30.4 44.2c0 3.2 3.2 3.2 3.2 0z" fill="#F07A8A"/>' + blush(40, 12) },
    { id: "bear", name: "熊熊", bg: "#F3E9DC", body:
      '<circle cx="16.5" cy="19" r="7.5" fill="#A0704C"/><circle cx="47.5" cy="19" r="7.5" fill="#A0704C"/>' +
      '<circle cx="16.5" cy="19" r="3.8" fill="#E7C29E"/><circle cx="47.5" cy="19" r="3.8" fill="#E7C29E"/>' +
      '<circle cx="32" cy="36" r="20" fill="#A0704C"/>' +
      '<ellipse cx="32" cy="43" rx="9" ry="7" fill="#E7C29E"/>' + eyes(33) +
      '<ellipse cx="32" cy="40" rx="3.6" ry="2.6" fill="#3a2a22"/>' + mouth(42.4, "#3a2a22") + blush(41, 14) },
    { id: "rabbit", name: "兔兔", bg: "#FDE6EE", body:
      '<ellipse cx="24" cy="15" rx="5.5" ry="13" fill="#fff" stroke="#F2C4D2" stroke-width="1.5"/><ellipse cx="40" cy="15" rx="5.5" ry="13" fill="#fff" stroke="#F2C4D2" stroke-width="1.5"/>' +
      '<ellipse cx="24" cy="15.5" rx="2.6" ry="9.5" fill="#FFC2D4"/><ellipse cx="40" cy="15.5" rx="2.6" ry="9.5" fill="#FFC2D4"/>' +
      '<ellipse cx="32" cy="39" rx="18" ry="16" fill="#fff" stroke="#F2C4D2" stroke-width="1.5"/>' + eyes(37, 7) +
      '<ellipse cx="32" cy="42" rx="2.4" ry="1.7" fill="#F48FB1"/>' + mouth(43.6) + blush(43, 12) },
    { id: "panda", name: "熊貓", bg: "#E2F2E2", body:
      '<circle cx="16" cy="20" r="7.5" fill="' + INK + '"/><circle cx="48" cy="20" r="7.5" fill="' + INK + '"/>' +
      '<circle cx="32" cy="36" r="20" fill="#fff" stroke="#DADDE3" stroke-width="1.2"/>' +
      '<ellipse cx="24" cy="34" rx="5.5" ry="7" fill="' + INK + '" transform="rotate(-25 24 34)"/><ellipse cx="40" cy="34" rx="5.5" ry="7" fill="' + INK + '" transform="rotate(25 40 34)"/>' +
      '<circle cx="24.6" cy="33.2" r="2.1" fill="#fff"/><circle cx="39.4" cy="33.2" r="2.1" fill="#fff"/>' +
      '<ellipse cx="32" cy="41" rx="3" ry="2.2" fill="' + INK + '"/>' + mouth(43.2) + blush(42, 14) },
    { id: "fox", name: "狐狸", bg: "#FFEAD6", body:
      '<path d="M12 30 15 9l15 12z" fill="#F07B2A"/><path d="M52 30 49 9 34 21z" fill="#F07B2A"/>' +
      '<path d="M16.5 23 17.8 14.5 24.5 19.5z" fill="#FFD9BD"/><path d="M47.5 23 46.2 14.5 39.5 19.5z" fill="#FFD9BD"/>' +
      '<path d="M12 30c0-9 9-14 20-14s20 5 20 14c0 9-9 18-20 22-11-4-20-13-20-22z" fill="#F07B2A"/>' +
      '<path d="M12.5 32.5c3.5 0 9.5 2 12.5 6.5l7 13c-10-3-19-10-19.5-19.5z" fill="#FFF4EA"/><path d="M51.5 32.5c-3.5 0-9.5 2-12.5 6.5l-7 13c10-3 19-10 19.5-19.5z" fill="#FFF4EA"/>' +
      eyes(32) + '<ellipse cx="32" cy="46.5" rx="2.8" ry="2" fill="' + INK + '"/>' },
    { id: "owl", name: "貓頭鷹", bg: "#E4E8F7", body:
      '<path d="M15.5 25 17.5 11l9 9z" fill="#8C6A54"/><path d="M48.5 25 46.5 11l-9 9z" fill="#8C6A54"/>' +
      '<ellipse cx="32" cy="37" rx="19" ry="18" fill="#8C6A54"/>' +
      '<circle cx="24" cy="34" r="8" fill="#EAD9C6"/><circle cx="40" cy="34" r="8" fill="#EAD9C6"/>' +
      '<circle cx="24" cy="34" r="4.3" fill="' + INK + '"/><circle cx="40" cy="34" r="4.3" fill="' + INK + '"/>' +
      '<circle cx="25.4" cy="32.6" r="1.4" fill="#fff"/><circle cx="41.4" cy="32.6" r="1.4" fill="#fff"/>' +
      '<path d="M29.5 40h5L32 45z" fill="#F2A33A"/>' +
      '<path d="M25 49.5q2 2 4 0M35 49.5q2 2 4 0" stroke="#6E5240" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
    { id: "penguin", name: "企鵝", bg: "#DCEEFA", body:
      '<circle cx="32" cy="36" r="20" fill="#2F3A4A"/>' +
      '<path d="M32 26.5c-4-4.2-12.5-3-13.5 4-1 6.5 2.5 13 13.5 16.5 11-3.5 14.5-10 13.5-16.5-1-7-9.5-8.2-13.5-4z" fill="#fff"/>' +
      eyes(34, 6) + '<path d="M28.5 39.2h7L32 43.6z" fill="#F7A531"/>' + blush(40.5, 10.5) },
    { id: "frog", name: "青蛙", bg: "#E2F3D6", body:
      '<circle cx="21" cy="24" r="8" fill="#6DBB5A"/><circle cx="43" cy="24" r="8" fill="#6DBB5A"/>' +
      '<ellipse cx="32" cy="38" rx="21" ry="15" fill="#6DBB5A"/>' +
      '<circle cx="21" cy="24" r="5" fill="#fff"/><circle cx="43" cy="24" r="5" fill="#fff"/>' +
      '<circle cx="21.5" cy="25" r="2.6" fill="' + INK + '"/><circle cx="42.5" cy="25" r="2.6" fill="' + INK + '"/>' +
      '<path d="M22 40q10 7.5 20 0" stroke="#2F6B28" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="29" cy="33.5" r=".9" fill="#2F6B28"/><circle cx="35" cy="33.5" r=".9" fill="#2F6B28"/>' + blush(41, 16) },
    { id: "chick", name: "小雞", bg: "#FFF4C7", body:
      '<path d="M30 19c-1.5-4 .5-6.5 3-6.5-1 2 0 4 1 6.2M33.5 19c1-3 4-4.5 5.5-3.3-2 .9-2.4 2.2-3.2 3.3" stroke="#F2B90C" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="32" cy="37" r="19" fill="#FFD34E"/>' + eyes(34, 7) +
      '<path d="M28.5 39.3h7L32 43.8z" fill="#F28C28"/>' + blush(41, 12.5) +
      '<path d="M13.5 41q-2.5 4 1.5 7M50.5 41q2.5 4-1.5 7" stroke="#F2B90C" stroke-width="2" fill="none" stroke-linecap="round"/>' },
    { id: "koala", name: "無尾熊", bg: "#E5EBEF", body:
      '<circle cx="14" cy="27" r="10" fill="#9AA5AE"/><circle cx="50" cy="27" r="10" fill="#9AA5AE"/>' +
      '<circle cx="14" cy="27" r="5.5" fill="#E3E8EC"/><circle cx="50" cy="27" r="5.5" fill="#E3E8EC"/>' +
      '<ellipse cx="32" cy="36" rx="18" ry="17" fill="#AEB8C0"/>' + eyes(32.5, 8) +
      '<ellipse cx="32" cy="39.5" rx="5" ry="6.5" fill="#3B4046"/>' + blush(43, 12.5) },
    { id: "tiger", name: "老虎", bg: "#FFEFD4", body:
      '<circle cx="16.5" cy="20" r="6.5" fill="#F59A23"/><circle cx="47.5" cy="20" r="6.5" fill="#F59A23"/>' +
      '<circle cx="16.5" cy="20" r="3" fill="#FFF4E0"/><circle cx="47.5" cy="20" r="3" fill="#FFF4E0"/>' +
      '<ellipse cx="32" cy="36" rx="20" ry="18" fill="#F59A23"/>' +
      '<path d="M32 19.5v5M27 20.5l1.2 4M37 20.5l-1.2 4M13 34h5M13.5 39.5l5-1.2M51 34h-5M50.5 39.5l-5-1.2" stroke="#3a2a22" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="43" rx="9" ry="6" fill="#FFF4E0"/>' + eyes(33) +
      '<path d="M29.6 39.3h4.8L32 42z" fill="#E86A7A"/>' + mouth(42.1, "#3a2a22") }
  ];
  var byId = {};
  A.forEach(function (a) { byId[a.id] = a; });
  function svg(id, cls) {
    var a = byId[id] || A[0];
    return '<svg class="av' + (cls ? " " + cls : "") + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="32" fill="' + a.bg + '"/>' + a.body + "</svg>";
  }
  // 還沒選頭像時：依使用者 id 固定給一個（每個人預設的不一樣）
  function defaultFor(uid) {
    var h = 0, s = String(uid || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return A[h % A.length].id;
  }
  return {
    list: A.map(function (a) { return { id: a.id, name: a.name }; }),
    has: function (id) { return !!byId[id]; },
    svg: svg,
    defaultFor: defaultFor
  };
})();
