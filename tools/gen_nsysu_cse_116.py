# 產生 data/nsysu-cse-116.js：python3 tools/gen_nsysu_cse_116.py data/nsysu-cse-116.js
import json, sys

DM = [  # 離散數學 24 單元: (主題, 讀, 練)
 ("命題邏輯", "真值表、邏輯等價、重言式、推論規則", "化簡邏輯式 10 題；判斷論證是否有效"),
 ("述詞邏輯與證明方法", "量詞與否定、直接證明、反證法、對偶證明", "量詞否定與翻譯 10 題；寫 3 題完整證明"),
 ("數學歸納法", "一般/強歸納法、良序原理、遞迴定義", "歸納法證明 6 題（每題寫完整步驟）"),
 ("集合與函數", "集合運算、冪集、單射/滿射/雙射、反函數、可數性", "函數計數題（幾個 onto）、集合恆等式證明"),
 ("關係 I", "反身/對稱/反對稱/遞移、閉包、Warshall", "判斷關係性質、求遞移閉包"),
 ("關係 II：等價與偏序", "等價類與分割、偏序、Hasse 圖、格", "畫 Hasse 圖、找極大/極小/上確界"),
 ("計數基礎", "加法/乘法原則、排列、組合、二項式定理", "排列組合 15 題（限時 40 分鐘）"),
 ("重複組合與分配問題", "重複組合、整數解個數、球放箱四種情況、第二類 Stirling 數", "分配問題 12 題，先判斷「球/箱是否可分辨」"),
 ("鴿籠原理與排容原理", "鴿籠原理推廣、排容公式", "鴿籠證明 4 題、排容計數 8 題"),
 ("排容進階", "錯排 (derangement)、禁位與 rook polynomial", "錯排公式推導 1 次 + 應用 6 題"),
 ("遞迴關係 I", "建立遞迴式、線性齊次遞迴（特徵方程、重根）", "由題意列遞迴 5 題 + 解遞迴 5 題"),
 ("遞迴關係 II", "非齊次遞迴（特解）、divide-and-conquer 遞迴", "非齊次 6 題；和 Master theorem 交叉比對"),
 ("生成函數 I", "一般生成函數、係數萃取、整數分割", "用生成函數解計數 8 題"),
 ("生成函數 II", "指數生成函數、用生成函數解遞迴", "EGF 4 題、生成函數解遞迴 4 題"),
 ("特殊數列", "Catalan 數、Fibonacci、Stirling 數整理", "Catalan 應用辨識 6 題；整理一頁公式卡"),
 ("圖論基礎", "度數定理、同構、子圖、補圖、二分圖", "判斷同構 4 題、度數序列 4 題"),
 ("連通、尤拉與漢米爾頓", "連通性、尤拉路徑/迴路條件、漢米爾頓充分條件", "判斷尤拉/漢米爾頓 8 題"),
 ("平面圖與著色", "Euler 公式 v−e+f=2、Kuratowski、色數、色多項式", "證明非平面 3 題、色多項式 4 題"),
 ("樹", "樹的性質、生成樹、Cayley 公式、有根樹與走訪", "樹的計數 6 題（和資結樹題一起做）"),
 ("圖演算法（離散視角）", "最短路徑、Kruskal/Prim 正確性", "手跑 Dijkstra、Kruskal 各 2 題"),
 ("匹配與網路流", "Hall 定理、二分匹配、max-flow min-cut", "Hall 定理應用 3 題、最大流 3 題"),
 ("數論", "整除、gcd/歐幾里得、同餘、中國餘數定理、Fermat/Euler 定理", "模運算計算 10 題"),
 ("代數結構與布林代數", "群、子群、陪集、Lagrange 定理、布林代數", "判斷是否為群 4 題、Lagrange 應用 3 題"),
 ("離散總回顧", "把錯題本裡離散的錯題依主題排序，找出最弱的 3 個主題", "最弱 3 主題各再做 5 題"),
]

CA = [  # 計算機結構 24 單元
 ("效能評估", "CPU time = IC×CPI×CC、MIPS 的陷阱、Amdahl 定律、功耗", "CPI/Amdahl 計算 12 題"),
 ("指令集架構", "MIPS/RISC-V 指令格式 (R/I/J)、定址模式", "指令編碼/解碼 10 題"),
 ("程序呼叫與組合語言", "stack frame、暫存器慣例、C 轉組合語言", "手寫 2 個 C 函式的組語（含遞迴）"),
 ("整數運算", "二補數、overflow 判斷、加法器與 CLA", "overflow 判斷 8 題、CLA 延遲計算 3 題"),
 ("乘法與除法", "乘法器演進、Booth 演算法、除法器", "Booth 手算 4 題"),
 ("浮點數", "IEEE 754 表示、特殊值、浮點加法、捨入 (guard/round/sticky)", "十進位↔IEEE 754 轉換 8 題"),
 ("單週期資料路徑", "datapath 元件、控制訊號、各指令走過的路徑", "填控制訊號表；算各指令延遲"),
 ("多週期與控制單元", "多週期設計、有限狀態控制、微程式", "比較單/多週期效能 4 題"),
 ("Pipeline 基礎", "五級 pipeline、speedup 計算、pipeline 暫存器", "畫 pipeline 時序圖 4 題"),
 ("Data hazard", "forwarding 條件、load-use stall、hazard detection unit", "找 hazard + 算 stall 數 8 題"),
 ("Control hazard", "branch 延遲、1-bit/2-bit 預測器、delayed branch、BTB", "預測器狀態追蹤 4 題、CPI 計算 4 題"),
 ("Exception 與 Pipeline 綜合", "例外處理、精確中斷、pipeline 綜合大題", "中山考古題 pipeline 大題全部做一遍"),
 ("Cache I：直接映射", "locality、位址切割 tag/index/offset、hit/miss 追蹤", "位址切割 6 題、hit/miss 追蹤 4 題"),
 ("Cache II：集合關聯", "set-associative、替換策略 (LRU)、write-through/back、write allocate", "不同關聯度比較 6 題"),
 ("Cache III：效能", "AMAT、多層 cache、3C miss、CPI 含記憶體停頓", "AMAT/CPI 計算 10 題"),
 ("虛擬記憶體與 TLB", "page table、TLB、TLB+cache+page fault 綜合", "位址轉換綜合題 6 題（也和 OS 對照）"),
 ("ILP I：靜態排程", "loop unrolling、靜態排程、VLIW", "手做 loop unrolling + 排程 3 題"),
 ("ILP II：動態排程", "scoreboarding、Tomasulo（RS、CDB）", "Tomasulo 表格逐週期追蹤 2 題"),
 ("ILP III：推測執行", "ROB、speculation、superscalar、多發射", "ROB 追蹤 2 題、比較表整理"),
 ("Cache 最佳化", "H&P 第 2 章：減少 miss rate/penalty/hit time 的各種方法", "整理最佳化方法表（方法、影響項目）"),
 ("多處理器與一致性", "snooping MSI/MESI、directory、記憶體一致性、同步", "MSI/MESI 狀態轉移追蹤 4 題"),
 ("I/O 與儲存", "bus、DMA、interrupt vs polling、RAID 0–6", "I/O 效能計算 4 題、RAID 比較"),
 ("平行與向量處理", "Flynn 分類、SIMD/向量、GPU、多執行緒 (SMT)", "觀念題 10 題"),
 ("記憶體技術與總回顧", "DRAM、interleaving；整理計結公式卡", "最弱 3 主題各再做 5 題"),
]

OSDS = [  # 作業系統與資料結構 24 單元: (科, 主題, 讀, 練)
 ("資結", "漸進符號與遞迴式", "Big-O/Θ/Ω、Master theorem、遞迴樹", "解遞迴式 8 題"),
 ("資結", "陣列、堆疊、佇列", "中序轉後序、後序求值、環狀佇列", "轉換與求值 6 題"),
 ("資結", "鏈結串列", "單/雙/環狀串列、反轉、合併", "手寫串列反轉、合併程式"),
 ("資結", "樹與二元樹", "二元樹性質、走訪、由走訪結果重建樹、樹的計數", "重建樹 4 題、性質題 6 題"),
 ("OS", "OS 概論與結構", "system call、dual mode、interrupt、OS 結構", "觀念題 10 題"),
 ("OS", "Process 與 IPC", "process state、PCB、context switch、fork()、IPC", "fork() 輸出題 4 題"),
 ("OS", "Thread", "user/kernel thread、多執行緒模型、thread library", "觀念題 8 題"),
 ("OS", "CPU 排程", "FCFS/SJF/SRTF/Priority/RR/MLFQ", "畫 Gantt chart 算平均等待時間 6 題"),
 ("資結", "BST 與 Heap", "BST 插入刪除、heap 建立 (O(n))、priority queue", "手操作插入/刪除 8 題"),
 ("資結", "AVL Tree", "四種旋轉、插入與刪除", "AVL 連續插入 4 題"),
 ("資結", "紅黑樹與 2-3-4 樹", "紅黑樹性質、插入、與 2-3-4 樹對應", "紅黑樹插入 4 題"),
 ("資結", "B-tree 與 B+ tree", "插入分裂、刪除合併、階數與高度", "B-tree 插入/刪除 4 題"),
 ("OS", "同步 I", "critical section 三條件、Peterson、test-and-set", "判斷解法是否正確 4 題"),
 ("OS", "同步 II：Semaphore", "生產者消費者、讀寫者、哲學家用餐", "手寫 3 個經典問題的 semaphore 解"),
 ("OS", "同步 III：Monitor", "monitor、condition variable、綜合題", "中山考古題同步題全部做一遍"),
 ("OS", "Deadlock", "四必要條件、RAG、Banker's 演算法、偵測與恢復", "Banker's 計算 4 題"),
 ("資結", "排序 I", "insertion/selection/bubble/shell/quick/merge/heap", "手跑每種排序各 1 次；整理複雜度表"),
 ("資結", "排序 II", "比較排序下界、counting/radix/bucket、stable 與 in-place", "排序性質判斷 10 題"),
 ("資結", "雜湊", "雜湊函數、chaining、open addressing、load factor", "雜湊插入追蹤 4 題"),
 ("OS", "記憶體管理", "contiguous allocation、paging、segmentation、多層 page table", "位址轉換 6 題、page table 大小計算 4 題"),
 ("OS", "虛擬記憶體", "demand paging、FIFO/LRU/OPT/Clock、Belady、thrashing、working set", "page replacement 追蹤 6 題、EAT 計算 3 題"),
 ("資結", "圖 I", "表示法、BFS/DFS、topological sort、articulation point", "手跑 DFS 並標 discovery/finish time 3 題"),
 ("資結", "圖 II", "MST、Dijkstra、Bellman-Ford、Floyd-Warshall、union-find", "手跑各演算法 1 題"),
 ("OS", "檔案系統與磁碟", "allocation methods、directory、disk scheduling、RAID", "磁碟排程計算 4 題"),
]

def blk(subj, time, title, read, practice):
    return {"subject": subj, "time": time, "title": title, "read": read, "practice": practice}

days = []
def add(phase, title, blocks, note="", optional=False, tag=""):
    d = {"phase": phase, "title": title, "blocks": blocks}
    if note: d["note"] = note
    if optional: d["optional"] = True
    if tag: d["tag"] = tag
    days.append(d)

# Phase 0
add("diagnose", "診斷考：用一年考古題摸底", [
  blk("dm", "上午", "離散數學 110 年（計時）", "不看書，照正式考試時間作答", "寫不出來的題目也要寫下想法，標記 ? "),
  blk("ca", "下午", "計算機結構 110 年（計時）", "不看書，照正式考試時間作答", "標記完全不會 / 會但算錯 / 會"),
  blk("osds", "晚上", "作業系統與資料結構 110 年（計時）", "不看書，照正式考試時間作答", "標記完全不會 / 會但算錯 / 會"),
], note="分數不重要，目的是知道題型、難度和自己差多少。11/11 左右簡章公告，記得確認考科有沒有改。", tag="考古題")
add("diagnose", "訂正 + 做考古題頻率表", [
  blk("dm", "上午", "訂正三科 110 年", "每題對照詳解，寫下錯誤原因（觀念 / 計算 / 沒讀過）", "建立錯題本（紙本或 Notion 都可以）"),
  blk("ca", "下午", "掃描 100–115 年考古題（不作答）", "每份只看題目，把每題對應到章節", "做「主題 × 年份」頻率表，標出常考主題"),
  blk("osds", "晚上", "準備教材", "選定每科一本主教材 + 一本題庫/講義（見「資源」頁）", "依頻率表把常考主題標 ★"),
], tag="規劃")

# Phase 1: 24 topic days + 6 review days
ti = 0
for week in range(6):
    for k in range(4):
        dm, ca, od = DM[ti], CA[ti], OSDS[ti]
        add("foundation", f"{dm[0]}｜{ca[0]}｜{od[1]}", [
          blk("dm", "上午", dm[0], dm[1], dm[2] + "；再做中山考古題中此主題的題目"),
          blk("ca", "下午", ca[0], ca[1], ca[2] + "；再做中山考古題中此主題的題目"),
          blk("osds", "晚上", f"{od[0]}：{od[1]}", od[2], od[3]),
        ])
        ti += 1
    add("foundation", f"第 {week+1} 輪複習日", [
      blk("dm", "上午", "離散：本輪錯題重做", "只看題目，重做這 4 天的錯題", "他校同主題考古題 10 題（中正、中興、成大）"),
      blk("ca", "下午", "計結：計算題重算", "這 4 天的計算題蓋住答案重算", "寫一頁公式卡"),
      blk("osds", "晚上", "OS / 資結：一頁總整理", "把這 4 天的內容寫成一頁重點", "寫不出來的地方回去補"),
    ], note="複習日不學新東西，目標是把這輪的錯題清掉。", tag="複習")

# Phase 2
years = [112, 111, 109, None, 108, 107, 106, None, 105, 104, 103, None, 102, 101, 100, "other"]
boost_n = 0
for y in years:
    if y is None:
        boost_n += 1
        add("papers", f"弱點補強日 {boost_n}", [
          blk("dm", "上午", "離散：頻率表 ★ 主題補強", "回看前面幾年錯最多的離散主題", "他校同主題考古題 12 題"),
          blk("ca", "下午", "計結：cache / pipeline 計算特訓", "這兩類是計算大題主力", "他校計算題 8 題，計時"),
          blk("osds", "晚上", "OS / 資結：錯題重做", "重做本階段 OS 與資結錯題", "手跑一次樹操作與 page replacement"),
        ], tag="補強")
    elif y == "other":
        add("papers", "他校考古題日", [
          blk("dm", "上午", "他校離散數學一份（計時）", "選題型接近的學校（如中正、中興）", "訂正並記入錯題本"),
          blk("ca", "下午", "他校計組/計結一份（計時）", "同上", "訂正並記入錯題本"),
          blk("osds", "晚上", "他校 OS + 資結一份（計時）", "同上", "訂正並記入錯題本"),
        ], optional=True, tag="考古題")
    else:
        add("papers", f"中山 {y} 年考古題", [
          blk("dm", "上午", f"離散數學 {y} 年", "計時作答，然後立刻訂正", "錯題寫原因，回課本補觀念"),
          blk("ca", "下午", f"計算機結構 {y} 年", "計時作答，然後立刻訂正", "計算題錯誤要重算到對"),
          blk("osds", "晚上", f"作業系統與資料結構 {y} 年", "計時作答，然後立刻訂正", "錯題寫原因，回課本補觀念"),
        ], note="如果網站上沒有這一年，改做他校同科考古題。", tag="考古題")
add("papers", "錯題本一刷（上）", [
  blk("dm", "上午", "離散錯題全部重做", "只看題目重做", "還是錯的標 ★★"),
  blk("ca", "下午", "計結錯題全部重做", "只看題目重做", "還是錯的標 ★★"),
  blk("osds", "晚上", "OS / 資結錯題全部重做", "只看題目重做", "還是錯的標 ★★"),
], tag="複習")
add("papers", "錯題本一刷（下）+ 公式總表", [
  blk("dm", "上午", "離散公式/定理總表", "計數、遞迴、生成函數、圖論定理各一頁", "★★ 題目再做一次"),
  blk("ca", "下午", "計結公式總表", "CPI、Amdahl、AMAT、pipeline、cache 位址切割", "★★ 題目再做一次"),
  blk("osds", "晚上", "OS / 資結比較表", "排程、page replacement、排序、各種樹的複雜度", "★★ 題目再做一次"),
], tag="複習")

# Phase 3
def mock(y, n):
    add("sprint", f"全真模考 #{n}：中山 {y} 年", [
      blk("dm", "依考試時程", f"離散數學 {y} 年", "照簡章的考試節次與時間作答，不看書不查資料", "只對答案算分，不訂正"),
      blk("ca", "依考試時程", f"計算機結構 {y} 年", "同上", "記錄每科分數"),
      blk("osds", "依考試時程", f"作業系統與資料結構 {y} 年", "同上", "記錄每科分數"),
    ], note="模考日就是考試日的預演，連午餐和休息時間都照考試那天安排。", tag="模考")
def review(n):
    add("sprint", f"模考 #{n} 檢討", [
      blk("dm", "上午", "離散：逐題檢討", "每個錯題找出原因", "同主題補 5 題"),
      blk("ca", "下午", "計結：逐題檢討", "每個錯題找出原因", "同主題補 5 題"),
      blk("osds", "晚上", "OS / 資結：逐題檢討", "每個錯題找出原因", "同主題補 5 題"),
    ], tag="檢討")
mock(113, 1); review(1)
mock(114, 2); review(2)
add("sprint", "他校模考", [
  blk("dm", "上午", "他校離散一份（計時）", "選沒做過的一份", "訂正"),
  blk("ca", "下午", "他校計組/計結一份（計時）", "選沒做過的一份", "訂正"),
  blk("osds", "晚上", "他校 OS + 資結一份（計時）", "選沒做過的一份", "訂正"),
], optional=True, tag="模考")
add("sprint", "高頻題型速刷", [
  blk("dm", "上午", "離散：計數 + 遞迴 30 題", "每題限時 5 分鐘", "錯的記入錯題本"),
  blk("ca", "下午", "計結：cache + pipeline 30 題", "每題限時 6 分鐘", "錯的記入錯題本"),
  blk("osds", "晚上", "OS / 資結：手跑演算法", "排程、page replacement、Banker's、樹操作各 2 題", "錯的記入錯題本"),
], tag="衝刺")
mock(115, 3); review(3)
add("sprint", "錯題本二刷", [
  blk("dm", "上午", "離散 ★★ 題目", "只做標 ★★ 的", "仍然錯的抄到「考前小卡」"),
  blk("ca", "下午", "計結 ★★ 題目", "只做標 ★★ 的", "仍然錯的抄到「考前小卡」"),
  blk("osds", "晚上", "OS / 資結 ★★ 題目", "只做標 ★★ 的", "仍然錯的抄到「考前小卡」"),
], tag="複習")
add("sprint", "公式與定理背誦", [
  blk("dm", "上午", "離散公式總表默寫", "默寫後對照，漏掉的重背", "證明題寫作格式再看一次"),
  blk("ca", "下午", "計結公式總表默寫", "默寫後對照，漏掉的重背", "Tomasulo、MESI 表格再走一次"),
  blk("osds", "晚上", "OS / 資結比較表默寫", "默寫後對照，漏掉的重背", "樹的旋轉/分裂手畫一次"),
], tag="衝刺")
add("sprint", "限時小模考", [
  blk("dm", "上午", "離散 10 題限時", "從各年考古題挑沒做過或錯過的", "檢討"),
  blk("ca", "下午", "計結 10 題限時", "同上", "檢討"),
  blk("osds", "晚上", "OS / 資結 10 題限時", "同上", "檢討"),
], optional=True, tag="模考")
add("sprint", "總整理 + 準備考試用品", [
  blk("dm", "上午", "考前小卡：離散", "整理成 1–2 頁", "考前兩天只看這些"),
  blk("ca", "下午", "考前小卡：計結", "整理成 1–2 頁", "確認計算機規定（看簡章）"),
  blk("osds", "晚上", "考前小卡：OS / 資結", "整理成 1–2 頁", "準備准考證、身分證、文具"),
], tag="衝刺")

pinned = [
 {"date": "2027-02-01", "phase": "final", "title": "考前兩天：只複習不做新題", "tag": "考前", "blocks": [
   blk("dm", "上午", "看離散考前小卡", "不做新題", "保持作答手感：挑 3 題簡單題"),
   blk("ca", "下午", "看計結考前小卡", "不做新題", "挑 3 題 cache/pipeline 練手"),
   blk("osds", "晚上", "看 OS / 資結考前小卡", "不做新題", "早點睡"),
 ]},
 {"date": "2027-02-02", "phase": "final", "title": "考前一天：確認考場、早睡", "tag": "考前", "blocks": [
   blk("dm", "上午", "翻一遍三科小卡", "", ""),
   blk("ca", "下午", "確認試場、交通、准考證", "看試場分配公告，必要時先去看考場", ""),
   blk("osds", "晚上", "整理考試用品後休息", "准考證、身分證、文具、手錶", "最晚 23:00 睡"),
 ]},
]

subjects = [
 {"key": "dm", "name": "離散數學", "short": "離散", "weak": True},
 {"key": "ca", "name": "計算機結構", "short": "計結", "weak": True},
 {"key": "osds", "name": "作業系統與資料結構", "short": "OS／資結", "weak": False},
]

assert len(days) == 62, len(days)
for i, d in enumerate(days):
    d["id"] = f"d{i+1:02d}"
for p in pinned:
    p["id"] = "p" + p["date"].replace("-", "")

data = {
 "id": "nsysu-cse-116",
 "label": "中山資工碩・甲組（116 學年度）",
 "school": "國立中山大學",
 "dept": "資訊工程學系碩士班 甲組（資訊組）",
 "year": 116,
 "start": "2026-11-06",
 "examDate": "2027-02-03",
 "defaultRest": [3, 0],
 "subjects": subjects,
 "weights": "三科成績直接相加、各科等權。同分時依序比較「作業系統與資料結構」、「離散數學」。",
 "phases": [
  {"id": "diagnose", "name": "診斷", "desc": "用一年考古題摸底，做出常考主題頻率表"},
  {"id": "foundation", "name": "打底", "desc": "每天三科：上午離散、下午計結、晚上 OS/資結；每 5 天一次複習日"},
  {"id": "papers", "name": "考古題", "desc": "中山歷屆考古題逐年做 + 弱點補強"},
  {"id": "sprint", "name": "衝刺", "desc": "最新三年留做全真模考，檢討、二刷錯題、背公式"},
  {"id": "final", "name": "考前", "desc": "只複習不做新題，調整作息"},
 ],
 "milestones": [
  {"date": "2026-11-11", "label": "116 碩士班考試入學簡章預定公告：確認考科與考試時程"},
  {"date": "2026-12-01", "label": "報名開始（預定 12/1–12/16），建議前幾天就報完"},
  {"date": "2026-12-16", "label": "報名截止（預定）"},
  {"date": "2027-01-20", "label": "約這段時間公告試場與准考證下載（以簡章為準）"},
  {"date": "2027-02-03", "label": "筆試（預定）"},
  {"date": "2027-03-05", "label": "放榜（預定，以簡章為準）"},
 ],
 "days": days,
 "pinned": pinned,
 "papers": {
  "years": list(range(115, 99, -1)),
  "roles": {"110": "診斷", "113": "模考 #1", "114": "模考 #2", "115": "模考 #3"},
  "note": "113–115 年先不要碰，留到衝刺期當全真模考。",
 },
 "strategy": [
  {"title": "你的兩個弱科就是總分的 2/3", "body": "中山資工甲組考計算機結構、作業系統與資料結構、離散數學三科，成績直接相加。離散和計結占了三分之二，所以不能放棄任何一科。計畫把精神最好的上午和下午留給這兩科，OS/資結放在晚上維持手感。", "src": [0]},
  {"title": "從考古題倒推要讀什麼", "body": "第一天就用一年考古題摸底，第二天把 100–115 年的題目全部掃過一遍，做「主題 × 年份」頻率表。時間不夠時，只讀考過的章節，常考主題標 ★ 優先讀。", "src": [2, 3, 4]},
  {"title": "最新三年留做模考", "body": "113、114、115 年最接近現在的出題風格，先不要碰，留到一月當全真模考。照簡章的考試時間作答，連吃飯和休息時間都照考試那天安排。", "src": []},
  {"title": "離散先打計數、遞迴、圖論", "body": "很多學校（包括中山、清大）不考線代，離散的份量就相對重。排列組合、排容、遞迴關係、生成函數、圖論是計算題的主力；證明題要寫完整步驟，練習時就要用考試的寫法。", "src": [2, 3, 4]},
  {"title": "計結要會「算」，也要讀計算機結構", "body": "考科名稱是「計算機結構」，所以除了計組（效能、pipeline、cache、虛擬記憶體）之外，H&P 的 ILP、Tomasulo、cache 最佳化、cache coherence 也要準備。CPI、Amdahl、AMAT、cache 位址切割、pipeline 時序圖這類計算題要練到不看公式也會算。", "src": [2, 3, 4]},
  {"title": "OS 和資結抓高頻主題", "body": "資結的樹（AVL、紅黑樹、B-tree、heap）和時間複雜度推導很常考；OS 的 process、同步、死結、虛擬記憶體與 page fault 是重點。同分時先比「作業系統與資料結構」，這科不能掉。", "src": [0, 2, 3, 4]},
  {"title": "錯題本 + 每 5 天複習一次", "body": "每天睡前 15 分鐘翻錯題本。每 5 個讀書天安排一天複習日，只重做錯題不學新東西。一月再把錯題本刷兩次，最後濃縮成考前小卡。", "src": []},
  {"title": "多報幾間當保險", "body": "中山資工甲組近年錄取率很低（113 學年度報名 1386 人、招 28 人，約 2%；實際到考人數通常比報名少）。同時報考考科相近的學校（例如中正、中興、中央），注意考試日期不要撞期。", "src": [1]},
  {"title": "照時數調整份量", "body": "這份計畫假設每天讀 8 小時左右（上午 3、下午 3、晚上 2.5）。如果白天要上課或上班，就把每天的三個區塊拆成兩天做，並優先保留離散和計結的部分。", "src": []},
 ],
 "resources": [
  {"subject": "dm", "items": ["Grimaldi《Discrete and Combinatorial Mathematics》（計數、遞迴、生成函數講得最完整）", "Rosen《Discrete Mathematics and Its Applications》（邏輯、證明、圖論）", "一本研究所題庫書或補習班講義，用來大量練題"]},
  {"subject": "ca", "items": ["Patterson & Hennessy《Computer Organization and Design》（計組主教材：效能、ISA、算術、datapath、pipeline、記憶體階層）", "Hennessy & Patterson《Computer Architecture: A Quantitative Approach》第 2、3、5 章（cache 最佳化、ILP、多處理器）", "一本研究所計組/計結題庫，計算題要大量練"]},
  {"subject": "osds", "items": ["Silberschatz《Operating System Concepts》（恐龍書）", "Horowitz《Fundamentals of Data Structures in C》", "CLRS《Introduction to Algorithms》查資結和圖演算法的細節"]},
 ],
 "sources": [
  {"label": "中山資工系：資訊工程碩士班（考科與計分方式）", "url": "https://cse.nsysu.edu.tw/p/412-1205-19722.php?Lang=zh-tw"},
  {"label": "聯合報：中山大學碩士班招考錄取率（113 學年度）", "url": "https://udn.com/news/story/6925/7761404"},
  {"label": "114 資工所跨考心得（HackMD）", "url": "https://hackmd.io/@andychiang4105/Bka4l0Yjyg"},
  {"label": "114 資工所考試應屆四大上岸心得（HackMD）", "url": "https://hackmd.io/@Lunacmcs/ryO47hciJg"},
  {"label": "大碩：資工所考科怎麼準備", "url": "https://daso-master.blogspot.com/2023/08/blog-post.html"},
  {"label": "中山 116 學年度招生考試預定日程一覽表（PDF）", "url": "https://oaa.nsysu.edu.tw/static/file/3/1003/attach/28/pta_246397_7587552_11872.pdf"},
  {"label": "中山 110 學年度碩士班考試入學簡章（計分方式）", "url": "https://exam-acad.nsysu.edu.tw/exam_netlist/pdf_file/aca_master/110ele_brief_41.pdf"},
 ],
 "links": [
  {"label": "中山資工系・資訊工程碩士班", "url": "https://cse.nsysu.edu.tw/p/412-1205-19722.php?Lang=zh-tw"},
  {"label": "中山教務處：116 學年度各項招生考試預定日程表", "url": "https://oaa.nsysu.edu.tw/p/404-1003-380074.php?Lang=zh-tw"},
  {"label": "中山招生考試系統（簡章、報名）", "url": "https://exam-acad.nsysu.edu.tw/"},
 ],
}

out = "/* 中山資工碩 116 學年度備考計畫資料。新增其他考試：複製這個檔案改內容，並在 index.html 加一行 <script src=\"data/xxx.js\"></script> */\n"
out += "window.EXAMS = window.EXAMS || [];\nwindow.EXAMS.push(" + json.dumps(data, ensure_ascii=False, indent=1) + ");\n"
open(sys.argv[1], "w").write(out)
print("days", len(days))
