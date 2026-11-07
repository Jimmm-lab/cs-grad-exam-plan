# 資工所備考計畫

用考古題驅動的資工所備考行程表，目前收錄：

- **中山資工碩士班甲組（116 學年度）**：筆試 2027/02/03（預定），考科為計算機結構、作業系統與資料結構、離散數學，三科等權。

## 網頁功能

- **今日**：D-day 倒數、今天要讀什麼練什麼（每個區塊都連到教材單元）、進度是否落後、重要日期。
- **教材**：從 111–115 年考古題逐題拆出來的四份教材（離散數學、計算機結構、作業系統、資料結構）加一份學習方法。每個單元先有觀念課（附「還不懂？看別人怎麼講」的外部教材連結），再接公式整理（附推導）、考古題詳解和小考（附完整計算過程）。
  - **手寫作答板**：每一題答案上方都可以展開一張方格紙，用觸控筆（S Pen）寫作答過程。支援壓力、觸控筆模式（手指捲動）、兩指縮放紙張、橡皮擦、復原、加長、存成圖片。筆跡存在瀏覽器的 IndexedDB，目錄最下面可以匯出／匯入全部筆跡的備份檔。程式在 `notes/assets/ink.js`。
  - **一次只顯示一個單元**：每個 `##` 標題是一個單元，網址的 `#錨點` 決定顯示哪個單元（行程表的連結照常能用），單元最後有上一單元／下一單元。手機上目錄收在側邊抽屜，右下角有目錄、回到最上面、到最下面的按鈕。程式在 `notes/assets/nav.js`。
  - **圖示**：不用 emoji，全部是 `notes/assets/icons.js` 裡畫的 SVG；內文的 ✓ ✗ ★ 在 build 時自動換成 SVG。
  - **動畫**：手動模擬類的題目（排序、heap、樹、雜湊、圖、stack、遞迴、cache、CPU 排程、page 置換）有可以一步一步播放、也可以改數字的動畫。程式在 `notes/assets/viz.js`。
- **每日行程**：從 2026/11/06 到考試前一天的完整行程，每週休兩天（預設週三、週日，可在頁面上改）。
- **考古題進度**：逐年逐科的劃記表（未做 → 做完 → 已訂正 → 二刷完）。
- **上榜策略**、**教材與來源**。

打勾和劃記存在瀏覽器的 localStorage，只在你自己的瀏覽器裡。

## 用 GitHub Pages 開啟

Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main`、資料夾 `/ (root)`，存檔後網址會是 `https://<你的帳號>.github.io/<repo 名稱>/`。

也可以直接用瀏覽器打開 `index.html`。

## 教材

教材的原始檔是 `notes/src/*.md`（Markdown），用下面的指令轉成 `notes/*.html`：

```bash
pip install markdown pymdown-extensions
python3 tools/build_notes.py
```

Markdown 寫法：

- 數學：`$...$`、`$$...$$`（用 MathJax 顯示）
- 例題框 `!!! example "標題"`、重點框 `!!! key "標題"`、陷阱框 `!!! trap "標題"`，內容縮排 4 格
- 小考答案 `??? quiz "看答案"`，內容縮排 4 格；網頁上會出現「答對了／答錯了」按鈕，答錯的題目列在左側
- 標題錨點：`## 單元 1：計數 {#u1}`，行程表用這個錨點連到教材
- 動畫：單獨一行寫 `<div class="viz" data-viz="heap" data-nums="3,1,6,5,2,4"></div>`，`data-viz` 是動畫種類（insertion、heap、radix、bst、avl、traverse、rebuild、hash、graph、stack、calltree、cache、paging、sched），其他 `data-*` 是預設的輸入，欄位名稱見 `notes/assets/viz.js` 裡各動畫的 `fields`
- 小考的手寫板由 `notes/assets/ink.js` 自動加在每個 `??? quiz` 上面，不用另外寫

所有詳解的數字都用程式驗算過；C 程式題都實際編譯執行過。

## 新增其他考試／年度

每個考試是 `data/` 底下的一個 JS 檔：

1. 複製 `data/nsysu-cse-116.js`，改成例如 `data/nsysu-cse-117.js` 或 `data/ccu-cs-116.js`。
2. 修改裡面的 `id`（要唯一）、`label`、`start`、`examDate`、`subjects`、`days`（每天的內容）、`milestones`、`papers.years` 等欄位。
3. 在 `index.html` 底部 `<script src="data/nsysu-cse-116.js"></script>` 下面加一行指向新檔案。

有兩個以上考試時，頁首會出現下拉選單切換。

`days` 只需要依序列出「讀書天」的內容，休息日由網頁依每週休息日自動插入；`pinned` 是固定日期的行程（例如考前兩天）。標記 `"optional": true` 的天數在讀書天不夠時會被自動省略。

`tools/gen_nsysu_cse_116.py` 是產生中山 116 資料檔用的腳本（`python3 tools/gen_nsysu_cse_116.py data/nsysu-cse-116.js`），改內容時可以直接改 JS，也可以改腳本後重新產生。每個區塊的 `link` 欄位指向教材的單元。

## 注意

日期與考科整理自中山大學教務處的「116 學年度招生考試預定日程一覽表」與資工系網站，都是**預定**，請以 2026/11 公告的正式簡章為準。
