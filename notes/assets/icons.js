/* 教材網頁共用的圖示（24×24 線條圖示，跟著文字顏色走）。
 * 用法：CGEP_ICON("play") 回傳一段 <svg>。不用 emoji，手機上才會長得一樣。 */
window.CGEP_ICON = (function () {
  "use strict";
  var F = ' fill="currentColor" stroke="none"';
  var P = {
    play: '<path d="M8 6.2v11.6a1 1 0 0 0 1.5.86l9.2-5.8a1 1 0 0 0 0-1.72L9.5 5.34A1 1 0 0 0 8 6.2z"' + F + "/>",
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.3"' + F + '/><rect x="13.5" y="5" width="4" height="14" rx="1.3"' + F + "/>",
    prev: '<path d="M14.5 6l-6 6 6 6"/>',
    next: '<path d="M9.5 6l6 6-6 6"/>',
    first: '<path d="M6.5 6v12"/><path d="M16.5 6l-6 6 6 6"/>',
    undo: '<path d="M9 14L4.5 9.5 9 5"/><path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3"/>',
    redo: '<path d="M15 14l4.5-4.5L15 5"/><path d="M19.5 9.5H9a4.5 4.5 0 0 0 0 9h3"/>',
    pen: '<path d="M4.5 19.5l1-4.2L15.8 5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.7 18.5z"/><path d="M14 6.8l3.2 3.2"/>',
    eraser: '<path d="M9 19.5l-4.2-4.2a1.8 1.8 0 0 1 0-2.5l8-8a1.8 1.8 0 0 1 2.5 0l4.4 4.4a1.8 1.8 0 0 1 0 2.5L12 19.5z"/><path d="M8.5 9.5l6 6"/><path d="M12 19.5h8"/>',
    zoomIn: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M10.5 8v5M8 10.5h5"/>',
    zoomOut: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8 10.5h5"/>',
    extend: '<path d="M5 4.5h14"/><path d="M12 8.5v11"/><path d="M8 15.5l4 4 4-4"/>',
    trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.8h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10 11v5M14 11v5"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="15.5" cy="9.5" r="1.5"/><path d="M3.5 16.5l5-5 4 4 2.5-2.5 5.5 5.5"/>',
    top: '<path d="M5 4.5h14"/><path d="M12 20V9"/><path d="M7 13.5l5-5 5 5"/>',
    bottom: '<path d="M5 19.5h14"/><path d="M12 4v11"/><path d="M7 10.5l5 5 5-5"/>',
    toc: '<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><circle cx="5" cy="6.5" r="1.2"' + F + '/><circle cx="5" cy="12" r="1.2"' + F + '/><circle cx="5" cy="17.5" r="1.2"' + F + "/>",
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cross: '<path d="M7 7l10 10M17 7L7 17"/>',
    star: '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8z"' + F + "/>",
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    download: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
    upload: '<path d="M12 15.5V4.5"/><path d="M7.5 9L12 4.5 16.5 9"/><path d="M5 19.5h14"/>',
    login: '<path d="M13.5 4.5h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4"/><path d="M4.5 12h10"/><path d="M11 8.5l3.5 3.5-3.5 3.5"/>'
  };
  return function (name, cls) {
    return '<svg class="ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || "") + "</svg>";
  };
})();
