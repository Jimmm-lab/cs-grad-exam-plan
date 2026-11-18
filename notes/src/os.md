# 作業系統：從中山考古題學

「作業系統與資料結構」這科，OS 大約佔一半分數。這份教材把 111–115 年的 OS 題目全部拆進各單元；資料結構的部分在另一份教材。

!!! key "看不懂的時候"
    1. 先讀單元開頭的「觀念課」（每個單元的第 0 節）：用比喻和小例子把每種情況列出來，再推出公式。讀完先做觀念課最後的「換你試試」。
    2. 還是不懂：照[學習方法頁的範本](method.html#ai)問 Gemini 這類 AI 家教，或看[中文開放式課程影片](method.html#videos)。
    3. 懂了以後回來做該單元的小考，確認自己真的會寫。

## 0. 中山 OS 怎麼考 {#u0}

| 題型 | 111 | 112 | 113 | 114 | 115 |
|---|---|---|---|---|---|
| **名詞填空**（10 格 × 2 分 ＝ 20%） | — | — | Q8 | Q8 | Q1 |
| 觀念解釋 | — | Q5–Q9（50%） | Q5, Q7 | Q5–Q7 | Q2–Q4 |
| 計算 | Q5–Q9（50%） | — | Q6 | — | — |

!!! key "一句話重點"
    中山 OS 的題目**幾乎都是恐龍書（Silberschatz《Operating System Concepts》）的原文名詞和段落**。113–115 年每年都有 20% 的名詞填空，觀念題的答案也都是課本上條列的那幾點。準備方式是**背名詞與條列重點**，再練幾個計算模板（排程、EAT、page table、磁碟）。

!!! trap "注意"
    - 題目是英文，填空要填英文名詞。背的時候就背英文。
    - 111 年 OS 計算題出自 Tanenbaum《Modern Operating Systems》的習題，計算模板一樣，不用另外買書。
    - 103、106、110 年的題目跟 111 年是同一種風格，i-node、磁碟聚集、TLB 命中率這幾種計算題一再出現；104、105、107 年是另一種風格，OS 多考觀念題（同步、死結、安全）。

**100–110 年還常考的題型**（108、109 留作模考，不列）：

| 題型 | 年份 | 教材 |
|---|---|---|
| 磁碟排程（SSTF、SCAN、LOOK 等的移動距離） | 101、102、104、107、110 | [5.4](#u5-sched) |
| fork、thread、pipe 的程式印出什麼 | 106、110 | [1.3](#u1-fork) |
| 二維陣列的 page fault、page fault 次數的上下界 | 103、106、110 | [4.4](#u4-pf) |
| 同步、死結的經典題（priority inversion、哲學家、磁帶機、wait-die） | 100、103、104、105、107 | [2.2](#u2-more)、[3.2](#u3-more) |
| 記憶體配置（first／best fit、segmentation、buddy） | 100、104、105 | [4.5](#u4-alloc) |
| 安全的觀念題（MAC、數位簽章、病毒種類、DDoS） | 101、102、105、107 | [6.2](#u6-more) |
| 檔案系統與 I/O（目錄結構、mount、開檔表、polling／DMA） | 104、105、107 | [5.5](#u5-more) |
| 分散式系統與網路（CSMA/CD、token passing、happened-before） | 101、102、104 | [6.3](#u6-dist) |

**建議讀的順序**：單元 1 行程與排程 → 2 同步 → 3 死結 → 4 記憶體 → 5 儲存與檔案 → 6 保護、安全與其他 → 7 名詞總表。

#### 觀念題用英文作答 {#u0-en}

觀念題用中文寫也可以，但**名詞一定要用英文原文**。能用英文寫的話，照下面的方法最快，也最接近課本條列、閱卷給分的方式。

!!! key "英文作答四個原則"
    1. **第一句直接回答**：問 What is X，就寫 "X is ..."；問 How does X work，就寫 "X works as follows:" 再條列。
    2. **條列，不寫長段落**：題目要幾點就寫幾點，用 1. 2. 3. 編號，每點一兩句。
    3. **關鍵名詞照課本**：例如 a program in execution、mutual exclusion、safe sequence。換成別的說法，閱卷老師可能認不出是同一個觀念。
    4. **短句、現在式**：主詞 ＋ 動詞 ＋ 受詞就夠了，不需要複雜的文法。

| 要表達 | 常用句型 |
|---|---|
| 定義 | X is a ... that ... ／ X refers to ... |
| 什麼時候發生 | X occurs when ... ／ X happens if ... |
| 原因 | ..., because ... ／ X is caused by ... |
| 目的 | X is used to ... ／ The goal of X is to ... |
| 步驟 | First, ... Then, ... Finally, ... |
| 比較 | X ..., whereas Y ... ／ Unlike X, Y ... |
| 優缺點 | The advantage is ...; the drawback is ... |
| 舉例 | For example, ... |

單元 1～6 的最後都有「英文作答範例」：考古題和恐龍書的經典觀念題，各附一份英文參考答案。

## 單元 1：行程、執行緒與 CPU 排程 {#u1}

!!! key "一句話重點"
    行程（process）是「正在跑的程式」，作業系統用 PCB 記住它跑到哪裡。CPU 只有一個時，排程演算法決定誰先跑；算等待時間只要畫 Gantt chart，用「完成 − 到達 − 執行時間」。

### 1.0 觀念課：食譜和正在做菜的廚師 {#u1-0}

#### 程式和行程差在哪？

**程式（program）** 是食譜，靜靜放在磁碟上。**行程（process）** 是正在照著食譜做菜的廚師：他做到第幾步（**program counter**）、手邊有哪些材料（**暫存器、記憶體**），這些「進度」都屬於這個行程。

同一份食譜可以有好幾個廚師同時在做，就像同一個程式可以開好幾個行程。作業系統用 **PCB**（process control block）記錄每個行程的進度，換人做的時候先把現在的進度存進 PCB，再把下一個人的進度讀出來，這就是 **context switch**。換人本身不做任何有用的工作，所以是額外開銷。

#### 行程的五種狀態

| 狀態 | 意思 | 怎麼進來 |
|---|---|---|
| new | 剛建立 | 程式被執行 |
| ready | 準備好了，在等 CPU | 被建立、I/O 完成、時間片用完被換下 |
| running | 正在 CPU 上跑 | 被排程器選中（dispatch） |
| waiting | 在等某件事（I/O、子行程結束） | 自己發出 I/O 請求或等待 |
| terminated | 結束 | 執行完畢 |

<figure class="fig">
<svg viewBox="0 0 360 270" role="img" aria-label="行程的五種狀態：new 經 admitted 到 ready；ready 被排程選中到 running；running 時間片用完回 ready；running 發出 I/O 或等事件到 waiting；waiting 等到 I/O 完成回 ready；running 結束到 terminated。">
<rect class="box" x="15" y="19" width="90" height="34" rx="17"/>
<text x="60" y="36" text-anchor="middle" dominant-baseline="central">new</text>
<rect class="box" x="241" y="19" width="110" height="34" rx="17"/>
<text x="296" y="36" text-anchor="middle" dominant-baseline="central">terminated</text>
<rect class="fb" x="20" y="120" width="100" height="36" rx="18"/>
<text x="70" y="138" text-anchor="middle" dominant-baseline="central">ready</text>
<rect class="fa" x="240" y="120" width="100" height="36" rx="18"/>
<text x="290" y="138" text-anchor="middle" dominant-baseline="central">running</text>
<rect class="ft" x="125" y="224" width="110" height="36" rx="18"/>
<text x="180" y="242" text-anchor="middle" dominant-baseline="central">waiting</text>
<line class="arw" x1="60" y1="53" x2="65.2" y2="111.0"/>
<polygon class="ah" points="66.0,120.0 60.2,111.5 70.2,110.6"/>
<text x="72" y="88" text-anchor="start" dominant-baseline="central" class="sm">admitted</text>
<line class="arw" x1="120" y1="128" x2="231.0" y2="128.0"/>
<polygon class="ah" points="240.0,128.0 231.0,133.0 231.0,123.0"/>
<text x="180" y="114" text-anchor="middle" dominant-baseline="central" class="sm">dispatch（被排程選中）</text>
<line class="arw" x1="240" y1="148" x2="129.0" y2="148.0"/>
<polygon class="ah" points="120.0,148.0 129.0,143.0 129.0,153.0"/>
<text x="180" y="164" text-anchor="middle" dominant-baseline="central" class="sm">interrupt（時間片用完）</text>
<line class="arw" x1="292" y1="120" x2="295.5" y2="62.0"/>
<polygon class="ah" points="296.0,53.0 300.5,62.3 290.5,61.7"/>
<text x="300" y="88" text-anchor="start" dominant-baseline="central" class="sm">exit</text>
<line class="arw" x1="282" y1="156" x2="220.4" y2="217.6"/>
<polygon class="ah" points="214.0,224.0 216.8,214.1 223.9,221.2"/>
<text x="258" y="200" text-anchor="start" dominant-baseline="central" class="sm">I/O、等事件</text>
<line class="arw" x1="146" y1="224" x2="84.4" y2="162.4"/>
<polygon class="ah" points="78.0,156.0 87.9,158.8 80.8,165.9"/>
<text x="102" y="200" text-anchor="end" dominant-baseline="central" class="sm">I/O 完成</text>
</svg>
<figcaption>只有 ready 會被排程器選去跑；I/O 完成的行程先回 ready 排隊，不會直接回 running</figcaption>
</figure>

最常考的兩條路：running → waiting（**發 I/O 請求**）、running → ready（**時間片用完**或被更高優先權的搶走）。

#### 排程：誰先用 CPU？

只有一個 CPU、很多行程在 ready queue 等。三個常用的衡量指標：

- **waiting time**：在 ready queue 裡等的總時間
- **turnaround time**：從進來到完成的總時間 ＝ waiting ＋ 執行時間
- **response time**：從進來到第一次被執行

**為什麼短的先做，平均等待時間最短？** P1 要 4、P2 要 1，同時到達：

| 順序 | P1 等 | P2 等 | 平均 |
|---|---|---|---|
| P1 → P2（FCFS） | 0 | 4 | 2 |
| P2 → P1（SJF） | 1 | 0 | 0.5 |

長的排在前面，後面每個人都要多等它那麼久；短的先做，大家多等的時間就少。

**Round Robin**：每人輪流用一小段時間（time quantum）。P1 要 5、P2 要 3，quantum ＝ 2：

| 時間 | 0–2 | 2–4 | 4–6 | 6–7 | 7–8 |
|---|---|---|---|---|---|
| 執行 | P1 | P2 | P1 | P2 | P1 |

P2 在 7 完成、P1 在 8 完成。等待時間 ＝ 完成時間 − 執行時間：P1 $8-5=3$、P2 $7-3=4$，平均 3.5。

**為什麼「等待 ＝ 完成 − 到達 − 執行時間」？** 從到達到完成的這段時間（turnaround）裡，行程不是在跑就是在 ready queue 等（這裡不考慮 I/O），所以扣掉跑的時間，剩下的就是等的時間。

動畫可以切換演算法、改行程（每個寫「名稱 到達時間 burst」，有 priority 就寫在最後）：

<div class="viz" data-viz="sched" data-procs="P1 0 5, P2 0 3" data-algo="rr" data-q="2"></div>

#### thread 和 process 差在哪？

同一個 process 裡的 threads 像同一個廚房裡的幾個廚師：共用冰箱和爐子，但各自做到不同步驟。

| | 不同的 process | 同一個 process 裡的 threads |
|---|---|---|
| 程式碼、全域變數、heap、開啟的檔案 | 各自一份 | **共用** |
| program counter、暫存器、stack | 各自一份 | **各自一份** |
| 建立、切換的成本 | 大（要換整個位址空間） | 小 |
| 一個出錯 | 不影響別的 process | 可能拖垮整個 process |

所以 threads 之間交換資料很方便（直接讀寫同一個變數），但也因此要處理同步（[單元 2](#u2)）。

!!! read "還不懂？看別人怎麼講"
    - **影片與講義**：[清大周志遠・作業系統（YouTube 播放清單）](https://www.youtube.com/playlist?list=PLS0SUwlYe8cxj8FCPRoPHAehIiN9Vo6VZ)，[講義下載頁](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999)的 Ch3 Processes、Ch4 Threads、Ch5 CPU Scheduling。
    - **中文筆記**：[清大 OCW 作業系統筆記](https://hackmd.io/@ZYuC2002/OSnote_OCW)（看周志遠課程整理的）；[作業系統及系統類型](https://saberliou.github.io/PrepareCSEMaster/OperatingSystem/Chapter01.html)（multiprogramming、time-sharing 等名詞，資工所考生整理）。

#### 換你試試

**T-1.** P1、P2、P3 同時到達，執行時間 3、6、1，SJF 的平均等待時間？

??? quiz "看答案"
    SJF 照 burst 由短到長：P3（1）、P1（3）、P2（6）。

    | | P3 | P1 | P2 |
    |---|---|---|---|
    | 時間 | 0–1 | 1–4 | 4–10 |
    | 等待 | 0 | 1 | 4 |

    平均等待 $=\frac{0+1+4}{3}=\frac53\approx$ **1.67**。

**T-2.** P1、P2 都要 3，quantum ＝ 2 的 RR，平均等待時間？

??? quiz "看答案"
    P1 0–2、P2 2–4、P1 4–5、P2 5–6。完成 5、6，等待 $5-3=2$、$6-3=3$，平均 2.5。

**T-3.** 一個 running 的行程呼叫 `read()` 讀檔案，會進入哪個狀態？讀完之後呢？

??? quiz "看答案"
    `read()` 要等磁碟，行程不能繼續跑 → **running → waiting**（CPU 先給別人用）。

    I/O 完成後 → **ready**（不是直接回 running，要排隊等排程器再選它）。

### 1.1 行程 {#u1-1}

考古題考過的行程觀念，這一節一個一個講清楚。每個觀念後面都接一題**觀念題**：先自己想、寫在手寫板上，再打開答案。

| 觀念 | 考過的題目 |
|---|---|
| 記憶體配置（text、data、heap、stack） | 114 Q8b 填空 |
| PCB 的七個欄位 | 112 Q5a |
| degree of multiprogramming | 115 Q1a 填空 |
| dispatcher | 115 Q1c 填空 |
| 每個 thread 自己的 program counter | 113 Q8a 填空 |
| Pthreads、POSIX | 114 Q8i 填空 |
| 交出 CPU 之後放到哪個 queue | 115 Q2a |
| warm cache、processor affinity | 115 Q2b |
| 兩種 IPC 模型 | 114 Q6b |

#### 記憶體配置：一個行程在記憶體裡長什麼樣子？（114 Q8b）

<figure class="fig">
<svg viewBox="0 0 360 270" role="img" aria-label="行程在記憶體裡的配置：由低位址往高位址依序是 text（程式碼）、data（全域變數）、heap（malloc 動態配置，往上長）、中間空的、stack（區域變數和函式呼叫，往下長）。">
<rect class="fk" x="110" y="20" width="160" height="50"/>
<text x="190.0" y="45.0" text-anchor="middle" dominant-baseline="central">stack</text>
<rect class="box" x="110" y="70" width="160" height="70"/>
<text x="190.0" y="105.0" text-anchor="middle" dominant-baseline="central" class="sm">（還沒用到）</text>
<rect class="fc" x="110" y="140" width="160" height="46"/>
<text x="190.0" y="163.0" text-anchor="middle" dominant-baseline="central">heap</text>
<rect class="fb" x="110" y="186" width="160" height="36"/>
<text x="190.0" y="204.0" text-anchor="middle" dominant-baseline="central">data</text>
<rect class="fa" x="110" y="222" width="160" height="36"/>
<text x="190.0" y="240.0" text-anchor="middle" dominant-baseline="central">text</text>
<line class="arw" x1="288" y1="40" x2="288.0" y2="79.0"/>
<polygon class="ah" points="288.0,88.0 283.0,79.0 293.0,79.0"/>
<text x="296" y="64" text-anchor="start" dominant-baseline="central" class="sm">往下長</text>
<line class="arw" x1="288" y1="170" x2="288.0" y2="131.0"/>
<polygon class="ah" points="288.0,122.0 293.0,131.0 283.0,131.0"/>
<text x="296" y="146" text-anchor="start" dominant-baseline="central" class="sm">往上長</text>
<text x="100" y="22" text-anchor="end" dominant-baseline="central" class="sm">高位址</text>
<text x="100" y="256" text-anchor="end" dominant-baseline="central" class="sm">低位址</text>
<text x="100" y="45" text-anchor="end" dominant-baseline="central" class="sm">區域變數、</text>
<text x="100" y="62" text-anchor="end" dominant-baseline="central" class="sm">函式呼叫</text>
<text x="100" y="163" text-anchor="end" dominant-baseline="central" class="sm">malloc／new</text>
<text x="100" y="204" text-anchor="end" dominant-baseline="central" class="sm">全域變數</text>
<text x="100" y="240" text-anchor="end" dominant-baseline="central" class="sm">程式碼</text>
</svg>
<figcaption>heap 往上長、stack 往下長，中間空著，兩邊都有空間可以長大</figcaption>
</figure>

一個行程的記憶體分成四塊。用一段程式對照最清楚：

```c
int total = 0;          /* data */

int main(void) {
    int n = 5;          /* stack */
    int *p = malloc(20);
    /* p 本身在 stack */
    /* 它指到的 20 bytes 在 heap */
    total = add(n, 1);
    /* 呼叫 add：參數進 stack */
    free(p);            /* 還給 heap */
    return 0;
}
/* main、add 的機器碼都在 text */
```

| 區塊 | 放什麼 | 大小會變嗎 | 什麼時候產生、消失 |
|---|---|---|---|
| **text** | 程式碼（編譯好的機器指令） | 不變 | 程式載入時放進來；通常是唯讀的 |
| **data** | 全域變數、`static` 變數 | 不變（編譯時就知道要多大） | 整個程式執行期間都在 |
| **heap** | 執行時用 `malloc`／`new` 要來的記憶體 | 會長大、縮小 | `malloc` 時配置，`free` 時歸還 |
| **stack** | 函式的參數、區域變數、返回位址 | 會長大、縮小 | 呼叫函式時推進一層（activation record），函式返回時彈出 |

- **為什麼 heap 往上長、stack 往下長**：這兩塊在執行前都不知道要多大，從兩端往中間長，中間的空間誰需要誰用。作業系統要保證兩塊不會撞在一起；無窮遞迴讓 stack 一直長，最後就是 **stack overflow**。
- **data 再細分**：恐龍書的圖把 data 分成 initialized data（有給初值的全域變數）和 uninitialized data（沒給初值的，常叫 bss）。
- **114 Q8b 考的是 heap**：填空問「程式執行時動態配置的記憶體」叫什麼，答案是 **heap**。英文定義背這句：the heap is memory that is dynamically allocated during program run time。

<div data-qid="u1-1-mem" markdown="1">

<div markdown="1">

**觀念題 1.** 下面標出的 (a)～(e) 各放在 text、data、heap、stack 哪一塊？(a) hits　(b) square 的機器碼　(c) y　(d) buf 這個指標　(e) malloc 拿到的 64 bytes

```c
static int hits;        /* (a) */
int square(int x) {     /* (b) */
    int y = x * x;      /* (c) */
    return y;
}
int main(void) {
    /* (d) buf  (e) 那 64 bytes */
    char *buf = malloc(64);
    hits = square(3);
    return 0;
}
```

</div>

??? quiz "看答案"
    | | 東西 | 放在 | 理由 |
    |---|---|---|---|
    | (a) | `static int hits` | **data** | 全域（static）變數，整個程式執行期間都在 |
    | (b) | `square` 的機器碼 | **text** | 程式碼 |
    | (c) | `y` | **stack** | 區域變數，square 返回就消失 |
    | (d) | `buf` 這個指標 | **stack** | 它是 main 的區域變數 |
    | (e) | `malloc(64)` 的 64 bytes | **heap** | 執行時動態要來的 |

    最容易錯的是 (d)、(e)：**指標本身**在 stack，**它指到的那塊**在 heap。

</div>

#### PCB：作業系統替每個行程記的一張表（112 Q5a）

**PCB（process control block）** 是作業系統替每個行程準備的一筆資料。行程被換下 CPU 時，「跑到哪裡、手上有什麼」全部存進它的 PCB；輪到它時再從 PCB 拿出來，就能從上次停下的地方繼續。所以 PCB 要記的，就是「**之後要接著跑、要排程、要管理它**」需要的所有東西：

| 欄位（英文要會寫） | 記什麼 | 為什麼需要 |
|---|---|---|
| **process state** | new、ready、running、waiting、terminated | 排程器只挑 ready 的 |
| **program counter** | 下一條要執行的指令位址 | 回來時從這裡接著跑 |
| **CPU registers** | 累加器、index 暫存器、stack pointer、一般暫存器、condition code | 中斷時跟 PC 一起存，回來才算得對 |
| **CPU-scheduling information** | priority、指向排程佇列的指標、其他排程參數 | 排程器靠它決定誰先跑 |
| **memory-management information** | base／limit 暫存器的值、page table 或 segment table | 換回這個行程時，要換成它的位址空間（[單元 4](#u4)） |
| **accounting information** | 用了多少 CPU 時間和實際時間、時間上限、帳號、process ID | 統計、計費、限制用量 |
| **I/O status information** | 分配給它的 I/O 裝置、開啟的檔案 | 結束時要歸還，I/O 完成時要找到在等的人 |

**記法**：前三個是「跑到哪」（state、PC、registers），中間兩個是「怎麼排、住哪裡」（scheduling、memory），最後兩個是「記帳和 I/O」（accounting、I/O status）。

<div class="mcq" data-ans="3" data-qid="u1-1-pcb" markdown="1">

**觀念題 2.** 一個行程打開了 3 個檔案，又被分配了一台印表機。這些資訊記在 PCB 的哪個欄位？

1. CPU registers
2. accounting information
3. I/O status information
4. memory-management information

??? quiz "看解析"
    **C. I/O status information**：記「分配給這個行程的 I/O 裝置、開啟的檔案」。B 記的是用了多少 CPU 時間、時間上限這類統計；D 記的是 base／limit、page table 這類位址空間的資料；A 是暫存器的內容。

</div>

#### context switch：換人時 PCB 怎麼用

CPU 從行程 P0 換到 P1 的過程：

1. 中斷或 system call 發生，CPU 交給 kernel。
2. 把 P0 的狀態（PC、暫存器……）**存進 PCB0**；P0 的 state 改成 ready 或 waiting，放進對應的 queue。
3. 排程器選出 P1。
4. 從 **PCB1 載入** P1 的狀態，P1 從上次停下的地方繼續跑。

這段時間 CPU 沒有在跑任何使用者的程式，所以 context switch 是**純粹的額外開銷（overhead）**。換得越頻繁（例如 Round Robin 的 quantum 很小），浪費的比例越高。

<div data-qid="u1-1-cs" markdown="1">

**觀念題 3.** Round Robin 的 quantum 是 10 ms，每次 context switch 要 1 ms。所有行程都很長，每次都把 quantum 用完。CPU 有多少比例的時間花在 context switch？quantum 改成 2 ms 呢？

??? quiz "看答案"
    每一輪是「跑 10 ms ＋ 換 1 ms」＝ 11 ms，浪費 $\frac1{11}\approx$ **9.1%**。

    quantum 改成 2 ms：每一輪 $2+1=3$ ms，浪費 $\frac13\approx$ **33%**。quantum 越小，context switch 佔的比例越高，這就是「quantum 不能太小」的原因。

</div>

#### degree of multiprogramming：記憶體裡有幾個行程（115 Q1a）

**multiprogramming** 的想法：記憶體裡同時放好幾個行程，一個去等 I/O，CPU 就換另一個跑，CPU 不會閒著。**記憶體裡目前有幾個行程，就叫 degree of multiprogramming**（the number of processes currently in memory is known as the degree of multiprogramming）。不管它們是 running、ready 還是 waiting，只要在記憶體裡就算。

誰在控制這個數字？恐龍書把排程器分成三種：

| 排程器 | 做什麼 | 多久執行一次 | 跟 degree 的關係 |
|---|---|---|---|
| **long-term scheduler**（job scheduler） | 從磁碟上等著的工作裡，挑哪些載入記憶體 | 很久一次（可能隔幾分鐘） | **控制 degree of multiprogramming** |
| **short-term scheduler**（CPU scheduler） | 從 ready queue 挑一個給 CPU 跑 | 很頻繁（常常不到 100 ms 就一次），所以要很快 | 不影響 |
| **medium-term scheduler** | 記憶體太擠時，把一些行程暫時搬到磁碟（swap out），之後再搬回來 | 需要時 | **降低** degree |

- **穩定的時候**：新行程進來的速度 ＝ 行程結束離開的速度，degree 就維持不變。
- **degree 太低**：大家都在等 I/O 時，CPU 沒事做。
- **degree 太高**：每個行程分到的記憶體太少，一直 page fault，CPU 反而都在等換頁，這就是 **thrashing**（[4.3](#u4-3)）。
- long-term scheduler 最好挑 **I/O-bound** 和 **CPU-bound** 混在一起的組合，CPU 和 I/O 裝置才都有事做。

<div class="mcq" data-ans="4" data-qid="u1-1-dom" markdown="1">

**觀念題 4.** 記憶體裡現在有 6 個行程：1 個 running、3 個 ready、2 個 waiting（在等磁碟）。磁碟上還有 4 個工作等著被載入。degree of multiprogramming 是多少？

1. 1
2. 4
3. 10
4. 6

??? quiz "看解析"
    **D. 6**。degree 數的是「**在記憶體裡**」的行程，不管 running、ready 還是 waiting。磁碟上還沒載入的 4 個不算（C 把它們算進去了）；A 只算 running、B 只算 running 和 ready。決定要不要再多載入幾個的，是 long-term scheduler。

</div>

#### dispatcher：把 CPU 真正交出去的模組（115 Q1c）

排程器（scheduler）**決定**下一個給誰；**dispatcher** 負責**動手交接**。恐龍書的定義：the dispatcher is the module that gives control of the CPU to the process selected by the CPU scheduler。它做三件事：

1. **switching context**：存舊行程的狀態、載入新行程的狀態（就是上面的 context switch）。
2. **switching to user mode**：kernel 做完交接，切回 user mode 讓程式跑。
3. **jumping to the proper location**：跳到新行程上次停下的那條指令，接著跑。

每次切換都要用到 dispatcher，所以它要越快越好。**dispatch latency**：dispatcher 停下一個行程、讓另一個開始跑所花的時間。

<div class="mcq" data-ans="2" data-qid="u1-1-disp" markdown="1">

**觀念題 5.** 下面哪一件事**不是** dispatcher 做的？

1. 把舊行程的暫存器存進它的 PCB
2. 從 ready queue 決定下一個要跑誰
3. 切換回 user mode
4. 跳到新行程上次停下的位置

??? quiz "看解析"
    **B**。「決定給誰」是 **short-term scheduler（CPU scheduler）** 的工作；dispatcher 只負責把 CPU 交給已經選好的那一個：context switch（A）、切到 user mode（C）、跳到正確位置（D）。記法：scheduler 選人，dispatcher 交棒。

</div>

#### 每個 thread 都有自己的 program counter（113 Q8a）

**program counter（PC）** 是 CPU 裡的一個暫存器，存「**下一條要執行的指令在哪裡**」。同一個 process 裡的 threads 各自在做不同的事（一個在算、一個在等網路），做到的指令位置不一樣，所以**每個 thread 都要有自己的 PC**，還有自己的暫存器和 stack（各自呼叫不同的函式）。程式碼、全域變數、heap、開啟的檔案則是大家共用（[1.0 的表](#u1-0)）。

<div data-qid="u1-1-pc" markdown="1">

**觀念題 6.** 一個 process 有 4 個 thread（含 main）。這個 process 一共有幾個 program counter？幾個 stack？幾份全域變數？幾個 heap？

??? quiz "看答案"
    **4 個 PC、4 個 stack、1 份全域變數、1 個 heap**。

    每個 thread 各自執行到不同的地方，所以 PC、暫存器、stack 每個 thread 一份；全域變數、heap、程式碼、開啟的檔案屬於整個 process，大家共用一份。113 Q8a 的填空考的就是「每個 thread 自己的那一份」裡的 program counter。

</div>

#### Pthreads 和 POSIX（114 Q8i）

- **POSIX**（Portable Operating System Interface）：IEEE 訂的一套標準，規定 UNIX 類系統要提供哪些函式、怎麼呼叫。照標準寫的程式，換到別的 UNIX 類系統（Linux、macOS）也能編譯。
- **Pthreads**：POSIX 標準（IEEE 1003.1c）裡**建立和同步 thread 的 API**。它是**規格（specification），不是實作**：只規定 `pthread_create`、`pthread_join`、`pthread_exit`、`pthread_mutex_lock` 這些函式要做什麼，各個作業系統自己去實作。
- 其他的 thread 函式庫：Windows 有自己的 Windows threads（`CreateThread`），Java 有 `Thread` 類別。

<div class="mcq" data-ans="3" data-qid="u1-1-pthread" markdown="1">

**觀念題 7.** 關於 Pthreads，下面哪一句正確？

1. 它是 Windows 內建的 thread 函式庫
2. 它是 Linux kernel 裡的一種 kernel thread
3. 它是 POSIX 標準定義的 thread API，是規格而不是實作
4. 它規定只能用 many-to-one 模型

??? quiz "看解析"
    **C**。Pthreads 是 POSIX（IEEE 1003.1c）定義建立、同步 thread 的 **API 規格**，Linux、macOS 等 UNIX 類系統各自實作。A 是 Windows threads；B 錯在它是程式呼叫的 API，不是 kernel 裡的東西；D 錯在規格沒有限定對應模型（Linux 的實作是 one-to-one）。

</div>

#### user thread 和 kernel thread 怎麼對應？

**user thread** 由程式裡的 thread 函式庫管理，kernel 不一定知道它們存在；**kernel thread** 由作業系統直接管理、排程。user thread 最後都要對到 kernel thread，才能真的在 CPU 上跑，對應方式有三種：

| 模型 | 對應方式 | 好處 | 壞處 |
|---|---|---|---|
| many-to-one | 很多個 user thread 對到 1 個 kernel thread | 切換不用進 kernel，快 | 一個 thread 呼叫會卡住的 system call，整個 process 都卡住；不能同時用多顆 CPU |
| one-to-one | 每個 user thread 一個 kernel thread（Linux、Windows） | 真的能平行；一個卡住不影響別人 | 每建一個 thread 就要建 kernel thread，數量受限 |
| many-to-many | 很多個 user thread 對到較少的 kernel thread | 兼顧兩者 | 實作複雜 |

**many-to-one 的兩個壞處都來自「kernel 只看到一個 thread」**：其中一個 user thread 呼叫會卡住的 system call（例如 `read`），kernel 就把這唯一的 kernel thread 卡住，整個 process 的 thread 都不能動；同一時間也只有一個 thread 能在一顆 CPU 上跑，多核心用不到。

<div data-qid="u1-1-model" markdown="1">

**觀念題 8.** 一個程式用 many-to-one 模型開了 4 個 user thread，跑在 4 核心的電腦上。(a) 同一時間最多幾個 thread 在 CPU 上跑？(b) 其中一個 thread 呼叫會卡住的 `read()`，其他 3 個還能跑嗎？(c) 換成 one-to-one 呢？

??? quiz "看答案"
    - **(a) 1 個**：4 個 user thread 都對到同一個 kernel thread，kernel 只能把這一個排到一顆 CPU 上。
    - **(b) 不能**：kernel thread 被 `read()` 卡住，對到它的所有 user thread 一起停。
    - **(c) one-to-one**：每個 user thread 有自己的 kernel thread，(a) 最多 4 個同時跑；(b) 一個卡住，其他 3 個照跑。代價是每建一個 thread 就要建一個 kernel thread。

</div>

!!! example "115 Q2a（6%）：process 在什麼情況下會交出 CPU？之後會放到哪個 queue？"
    對照上面的狀態圖，從 running 出去的三條路：

    1. **發出 I/O 請求** → running 變 waiting，放進 **I/O wait queue**。
    2. **建立子行程並等它結束**（或等其他事件）→ 放進 **wait queue**。
    3. **被中斷強制移走，或 time slice 用完** → 回到 ready，放回 **ready queue**。

<div class="mcq" data-ans="2" data-qid="u1-1-queue" markdown="1">

**觀念題 9.** 下面哪一種情況，行程離開 CPU 之後會直接回到 **ready queue**，而不是進某個 wait queue？

1. 呼叫 `read()` 讀磁碟
2. time slice 用完，被 timer 中斷
3. 呼叫 `wait()` 等子行程結束
4. 等一個 semaphore

??? quiz "看解析"
    **B**。time slice 用完只是「輪到別人」，它本身還能繼續跑，所以回 ready queue 排隊。A、C、D 都在等某件事發生（磁碟讀完、子行程結束、semaphore 被 signal），事情發生之前不能跑，所以進 wait queue；等到了才回 ready queue。

</div>

!!! example "115 Q2b（4%）：從 processor affinity 的角度解釋 warm cache"
    - **warm cache 是什麼**：process 在某個 core 上跑一段時間後，它的資料已經在那個 core 的 cache 裡（cache 是「熱」的）。
    - **換 core 的代價**：移到別的 core，舊 cache 的資料用不到、新 core 的 cache 要一筆一筆 miss 重新載入，成本很高。
    - **processor affinity**：所以排程器盡量讓 process 留在同一個 core 上跑。

<div class="mcq" data-ans="1" data-qid="u1-1-affinity" markdown="1">

**觀念題 10.** 一個行程從 core 0 被搬到 core 1，剛搬過去的那段時間跑得比較慢。主要原因是？

1. core 1 的 cache 裡沒有它的資料，一開始一直 cache miss
2. 搬過去要重新編譯程式
3. core 1 的時脈比較慢
4. 搬過去之後它的 priority 被降低

??? quiz "看解析"
    **A**。在 core 0 跑的時候，它的資料已經在 core 0 的 cache 裡（warm cache）；到了 core 1，cache 是冷的，要一筆一筆 miss、從記憶體重新載入。所以排程器盡量讓行程留在同一個 core，這就是 **processor affinity**：soft affinity 是盡量不搬（不保證），hard affinity 是行程自己指定只能在哪些 core 上跑。

</div>

!!! example "114 Q6b（4%）：兩種 IPC 模型"
    - **shared memory**：建立一塊共享記憶體，process 直接讀寫。快（建好之後不用經過 kernel），但要自己做同步。
    - **message passing**：透過 kernel 的 send／receive 傳訊息。較慢（每次都要 system call），但不用處理衝突，也適合分散式系統（[6.3](#u6-dist)）。

<div class="mcq" data-ans="2" data-qid="u1-1-ipc" markdown="1">

**觀念題 11.** 兩個行程要交換資料。哪一種方式在**建好之後**，每次讀寫都不需要 system call？

1. message passing
2. shared memory
3. pipe
4. socket

??? quiz "看解析"
    **B. shared memory**。只有建立共享區時要呼叫 system call，之後兩個行程直接讀寫同一塊記憶體，kernel 不用插手，所以最快；代價是要自己做同步（[單元 2](#u2)）。message passing、pipe、socket 每次傳資料都要 send／receive 或 write／read，都會進 kernel。

</div>

### 1.2 CPU 排程計算 {#u1-2}

**名詞**：

- **turnaround time**：從提交到完成的時間。（112 Q9d、114 Q8h）
- **waiting time**：在 ready queue 等待的總時間 ＝ turnaround $-$ burst。
- **response time**：從提交到第一次被執行的時間。

**做法**：畫 Gantt chart，算每個 process 的完成時間，等待時間 ＝ 完成時間 $-$ 到達時間 $-$ burst time。

#### 什麼時候要排程？會搶和不會搶

CPU 排程發生在這四個時機：

1. 行程從 running 變成 waiting（例如發出 I/O 請求、呼叫 `wait()` 等子行程）。
2. 行程從 running 變成 ready（例如 timer 中斷，時間片用完）。
3. 行程從 waiting 變成 ready（例如 I/O 完成）。
4. 行程結束。

- **1 和 4**：目前的行程自己不能（或不需要）再跑，一定要選下一個。
- **2 和 3**：目前的行程其實還能繼續跑，要不要換人是一種選擇。

**非搶先（nonpreemptive）**：只在 1、4 排程，行程拿到 CPU 之後一直用到結束，或自己去等 I/O。**搶先（preemptive）**：2、3 也可以把 CPU 拿走，例如更高 priority 的行程 I/O 做完回到 ready，就馬上搶過來。搶先的回應比較快，但兩個行程共用資料時，可能做到一半被換下，會有 race condition（[單元 2](#u2)）。

<div class="mcq" data-ans="3" data-qid="u1-2-when" markdown="1">

**觀念題 12.** 在**非搶先**排程下，下面哪一種情況發生時，排程器一定要選下一個行程？

1. 一個高 priority 的行程 I/O 做完，回到 ready
2. timer 中斷
3. 正在跑的行程發出 I/O 請求
4. 有新的行程被建立

??? quiz "看解析"
    **C**。正在跑的行程去等 I/O（時機 1），CPU 空出來，一定要選人。A（時機 3）和 B（時機 2）在非搶先下都不換人，目前的行程繼續跑；D 的新行程只是進 ready queue 排隊。搶先式才會在 A、B 這種時候把 CPU 拿走。

</div>

#### 五種演算法怎麼選、各有什麼問題？

| 演算法 | 會搶嗎（preemptive） | 每次選誰 | 好處 | 問題 |
|---|---|---|---|---|
| FCFS | 不會 | 最早到的 | 簡單 | **convoy effect**：一個長的卡在前面，後面一群短的都要等 |
| SJF | 不會 | burst 最短的 | 不搶的演算法裡平均等待最短 | 要預先知道 burst；長的可能一直輪不到（starvation） |
| SRTF（會搶的 SJF） | 會 | **剩餘時間**最短的；新來的比較短就搶走 CPU | 所有演算法裡平均等待最短 | context switch 多；starvation |
| Priority | 兩種都有 | priority 最高的（通常數字小） | 照重要性排 | starvation，用 **aging**（等越久 priority 越高）解決 |
| Round Robin | 會 | 輪流，每人最多一個 quantum | response time 好、公平 | quantum 太大就變 FCFS；太小 context switch 太多 |

#### 表裡的三個問題，用例子看

**convoy effect（FCFS）**：P1 要 24、P2 和 P3 各要 3，依序在時間 0 到達。FCFS 的等待是 0、24、27，平均 17；先做短的（P2、P3、P1），等待是 0、3、6，平均 3。一個長的排在前面，後面一串短的全被卡住，像一台慢車後面跟著一長串車。

**starvation 和 aging（Priority）**：只要一直有高 priority 的行程進來，低 priority 的就永遠輪不到，這叫 **starvation**（餓死）。**aging** 的做法是「等越久，priority 越高」：例如 priority 從 0（最高）到 127（最低），每等 1 秒就把數字減 1，最低的 127 最多等 127 秒也會升到 0，一定輪得到。

**SJF 要知道 burst：用過去預測下一次**。真正執行前不知道下一次 CPU burst 多長，常用**指數平均（exponential average）**來預測：

$$\tau_{n+1}=\alpha\,t_n+(1-\alpha)\,\tau_n$$

- $t_n$：第 n 次**實際**的 burst；$\tau_n$：第 n 次的**預測**；$\alpha$ 介於 0 和 1，常用 $\frac12$。
- 意思：新的預測 ＝「剛剛實際的」和「之前預測的」加權平均。$\alpha=1$ 只看最近一次；$\alpha=0$ 永遠不更新。
- 例：$\tau_0=10$、$\alpha=\frac12$，實際的 burst 依序是 $t_0=6$、$t_1=4$、$t_2=6$：
    - $\tau_1=\frac12\times6+\frac12\times10=8$
    - $\tau_2=\frac12\times4+\frac12\times8=6$
    - $\tau_3=\frac12\times6+\frac12\times6=6$

<div data-qid="u1-2-exp" markdown="1">

**觀念題 13.** 用指數平均預測 CPU burst，$\alpha=\frac12$、$\tau_0=8$，實際的 burst 依序是 4、12、6。$\tau_1$、$\tau_2$、$\tau_3$ 各是多少？如果 $\alpha=1$，$\tau_3$ 是多少？

??? quiz "看答案"
    - $\tau_1=\frac12\times4+\frac12\times8=$ **6**
    - $\tau_2=\frac12\times12+\frac12\times6=$ **9**
    - $\tau_3=\frac12\times6+\frac12\times9=$ **7.5**

    $\alpha=1$ 時只看最近一次的實際值：$\tau_3=t_2=$ **6**。

</div>

#### multilevel feedback queue：用例子跑一次

好幾個 queue，越上面 priority 越高、quantum 越小。恐龍書的例子是三層：

| queue | 規則 |
|---|---|
| Q0（最高） | quantum 8 ms |
| Q1 | quantum 16 ms，Q0 空了才跑 |
| Q2（最低） | FCFS，Q0、Q1 都空了才跑 |

- 新行程先進 **Q0**。8 ms 內做完就離開；做不完就**降到 Q1**。
- 在 Q1 拿到 16 ms，還做不完就**降到 Q2**，在那裡照 FCFS 跑完。
- 上面的 queue 有人時，下面的不能跑；跑到一半上面來了新行程，就被搶走。
- 為了不讓下面的餓死，等太久的可以**升級**到上面的 queue（aging）。

**效果**：互動型的行程（常常等 I/O、每次 burst 很短）在 Q0 就做完，一直留在高 priority，回應很快；計算型的（burst 很長）自動沉到下面，用 FCFS 慢慢做。

一個 MLFQ 由五件事決定：幾個 queue、每個 queue 用什麼演算法、什麼時候升級、什麼時候降級、新行程進哪一個 queue。

<div data-qid="u1-2-mlfq" markdown="1">

**觀念題 14.** 在上面三層的 MLFQ 裡，只有一個 burst 30 ms 的行程 A（中間沒有別的行程）。A 在 Q0、Q1、Q2 各跑了幾 ms？另一個 burst 5 ms 的行程 B 呢？

??? quiz "看答案"
    - **A**：Q0 跑滿 8 ms 沒做完 → 降到 Q1，跑滿 16 ms 還沒做完 → 降到 Q2，剩 $30-8-16=6$ ms 在 Q2 用 FCFS 跑完。所以是 **8、16、6**。
    - **B**：5 ms ＜ 8 ms，在 **Q0 就做完**，不會降級。

    這就是 MLFQ 的效果：短的留在上面很快做完，長的往下沉。

</div>

#### Round Robin 的兩個細節

- **quantum 怎麼選**：太大就變成 FCFS（每個人都在一個 quantum 內做完）；太小則 context switch 佔太多時間（[觀念題 3](#q-u1-1-cs)）。恐龍書的經驗法則：大約 80% 的 CPU burst 要比 quantum 短。
- **同一時刻「新來的」和「被切下來的」誰先排**：題目沒說時，常見的約定是**新來的先進 queue**，被切下來的排在它後面（本教材的動畫和練習都用這個約定）。考試時把你的假設寫出來，閱卷就不會誤會。

#### 有到達時間時：搶先和不搶先差在哪？

P1、P2、P3、P4 的到達時間 0、1、2、3，burst 8、4、9、5。

**SRTF（會搶）**：

| 時間 | 發生什麼事 | 執行 |
|---|---|---|
| 0 | 只有 P1 | P1 |
| 1 | P2 到，剩 4 ＜ P1 剩 7 → **搶走** | P2 |
| 2、3 | P3（9）、P4（5）到，都比 P2 剩的長 | P2 |
| 5 | P2 做完；剩 P1 7、P3 9、P4 5，挑 P4 | P4 |
| 10 | P4 做完；P1 7 ＜ P3 9 | P1 |
| 17 | P1 做完 | P3（到 26） |

等待 ＝ 完成 − 到達 − burst：P1 $17-0-8=9$、P2 $5-1-4=0$、P3 $26-2-9=15$、P4 $10-3-5=2$，平均 $\frac{26}4=$ **6.5**。

**SJF（不搶）**：P1 先跑到 8 不能被搶；之後 P2（4）、P4（5）、P3（9）。等待 P1 0、P2 $8-1=7$、P4 $12-3=9$、P3 $17-2=15$，平均 $\frac{31}4=7.75$。會搶的 SRTF 比較短。

<div class="viz" data-viz="sched" data-procs="P1 0 8, P2 1 4, P3 2 9, P4 3 5" data-algo="srtf" data-title="切換成 SJF（不搶）對照"></div>

!!! example "113 Q6a（6%）：五個 process 都在時間 0 到達，burst 10、1、2、1、5，priority 3、1、3、4、2（數字小優先）。求 SJF、non-preemptive priority、RR（q＝1）的平均等待時間"
    **題目條件**：都在時間 0 到達，所以**等待時間 ＝ 開始時間**（不搶先時）；同時符合條件時照編號。

    **SJF（3.2）**：照 burst 由短到長 P2(1)、P4(1)、P3(2)、P5(5)、P1(10)。

    | | P2 | P4 | P3 | P5 | P1 |
    |---|---|---|---|---|---|
    | 開始 | 0 | 1 | 2 | 4 | 9 |

    平均等待 $=\frac{0+1+2+4+9}{5}=\frac{16}{5}=3.2$。

    **Non-preemptive priority（8.2）**：數字小的先 P2(1)、P5(2)、P1(3)、P3(3)、P4(4)。P1、P3 同為 3，照編號 P1 先。

    | | P2 | P5 | P1 | P3 | P4 |
    |---|---|---|---|---|---|
    | 時間 | 0–1 | 1–6 | 6–16 | 16–18 | 18–19 |

    等待（＝開始時間）$0+1+6+16+18=41$，平均 $\frac{41}{5}=8.2$。

    **RR，q＝1（5.4）**：佇列初始順序 P1–P5。RR 的 Gantt chart 最容易算錯，把每一輪寫成一列：
    `P1 P2 P3 P4 P5 | P1 P3 P5 | P1 P5 | P1 P5 | P1 P5 | P1 P1 P1 P1 P1`

    加上時間（每格 1）：

    | 時間 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14–19 |
    |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
    | 執行 | P1 | **P2** | P3 | **P4** | P5 | P1 | **P3** | P5 | P1 | P5 | P1 | P5 | P1 | **P5** | P1 ×5 |

    粗體是該行程最後一次跑，下一格的時間就是它的完成時間：P2＝2、P4＝4、P3＝7、P5＝14、P1＝19。等待 ＝ 完成 − burst：9、1、5、3、9，平均 $\frac{27}{5}=5.4$。

<div class="viz" data-viz="sched" data-procs="P1 0 10 3, P2 0 1 1, P3 0 2 3, P4 0 1 4, P5 0 5 2" data-algo="rr" data-q="1" data-title="113 Q6a：切換成 SJF、Priority 對照上面的答案"></div>

### 1.3 fork、wait、thread、pipe：程式會印出什麼 {#u1-fork}

106、110 年各有一題 10% 的「這支 C 程式印出什麼」，考的是行程（process）和執行緒（thread）的系統呼叫。只要記住四條規則，就能一行一行追出答案。

#### 規則 1：fork 之後變成兩份，各改各的

`fork()` 會複製出一個**子行程**，連記憶體一起整份複製。之後兩個行程都從 fork 的**下一行**繼續跑，變數各有一份，改自己的不會影響對方。

像影印一份作業：之後在影印本上寫字，原本那份不會變。（實作上用 copy-on-write 省時間，見 [4.3](#u4-3)，但結果跟整份複製一樣。）

**怎麼知道自己是誰**：看 fork 的回傳值。

| 回傳值 | 代表 | 程式通常寫 |
|---|---|---|
| ＞ 0（子行程的 pid） | 我是父行程 | `if (pid > 0)` |
| 0 | 我是子行程 | `else if (pid == 0)` |
| −1 | fork 失敗 | `else` |

```c
int x = 1;
if (fork() == 0) {            /* 子行程 */
    x++;                      /* 改的是自己那份 */
    printf("child %d\n", x);
} else {                      /* 父行程 */
    wait(NULL);
    printf("parent %d\n", x); /* 還是 1 */
}
```

印出 `child 2`、`parent 1`。

#### 規則 2：wait 決定誰先印

沒有 wait 時，父子誰先跑不一定，輸出順序就不固定。考題會用 `waitpid(-1, &status, 0)` 讓順序固定：父行程停在這一行，等**任何一個**子行程結束才往下走。

所以**被等的一定先印完**。畫一棵行程樹，從最底下的行程開始往上印。

#### 規則 3：thread 共用記憶體，行程不共用

`pthread_create` 開的 thread 在**同一個行程裡**，跟 main 共用變數。把 `&value` 傳給 thread，thread 改 `*param`，改到的就是 main 的 value。`pthread_join` 是等 thread 做完。

| | fork（行程） | pthread_create（執行緒） |
|---|---|---|
| 記憶體 | 各自一份，改了對方看不到 | 共用，改了對方看得到 |
| 等它結束 | `wait`／`waitpid` | `pthread_join` |

#### 規則 4：pipe、dup、exec 把輸出接到別的行程

這三個函式都在改同一張表：**檔案描述子表**。先把這張表搞懂，後面就只是在表上改格子。

**檔案描述子表（file descriptor table）**：每個行程都有一張表，號碼是 0、1、2、3……，每一格指向一個打開的東西（檔案、螢幕、鍵盤、pipe 的一端）。程式讀寫時只講號碼，不管它實際接到哪裡：

| 號碼 | 一開始接到 | 誰用這一格 |
|---|---|---|
| 0 | 鍵盤（標準輸入 stdin） | `scanf`、`getchar` 讀這一格 |
| 1 | 螢幕（標準輸出 stdout） | `printf`、`puts` 寫這一格 |
| 2 | 螢幕（標準錯誤 stderr） | `fprintf(stderr, ...)` 寫這一格 |

**最重要的規則**：`open`、`pipe`、`dup` 要新號碼時，一律拿**目前最小的空號碼**。例如 0、1、2 都在用時，`open` 拿到 3；先 `close(1)` 再 `open`，就拿到 1。（我實際跑過：兩次 open 拿到 3、4；close(1) 之後再 open 拿到 1。）

<div data-qid="u1-fork-fd" markdown="1">

**觀念題 15.** 一個行程剛開始只有 0、1、2。依序執行 `a = open("x.txt", ...)`、`b = open("y.txt", ...)`、`close(0)`、`c = open("z.txt", ...)`。a、b、c 各是幾號？之後 `scanf` 會從哪裡讀？

??? quiz "看答案"
    - **a ＝ 3**、**b ＝ 4**：0、1、2 都在用，依序拿 3、4。
    - **c ＝ 0**：`close(0)` 之後，0 是最小的空號碼。
    - **scanf 讀 z.txt**：scanf 永遠讀 0 號，0 號現在接到 z.txt，所以它讀的是檔案內容，不是鍵盤。這就是 shell「輸入重新導向」（`< z.txt`）的原理。

</div>

#### pipe：kernel 裡的一條單向管子

`pipe(fd)` 在 kernel 裡開一段緩衝區，並在描述子表裡佔兩格：**`fd[0]` 是讀端、`fd[1]` 是寫端**（記法：0 對應 stdin 讀、1 對應 stdout 寫）。從寫端寫進去的資料，照順序（先進先出）從讀端讀出來。

| 情況 | `read(fd[0], ...)` 會怎樣 |
|---|---|
| 管子裡有資料 | 讀走資料，回傳讀到幾個 byte |
| 管子是空的，但還有人開著寫端 | **等**（block），直到有人寫進來 |
| 管子是空的，而且**所有**寫端都關了 | 回傳 **0**，代表 EOF（不會再有資料了） |

- pipe 是**單向**的：要雙向溝通就開兩條。
- 這種 pipe（ordinary pipe）沒有名字，只有建立它的行程和它 fork 出來的子孫拿得到（描述子表是 fork 複製過去的）。用 `mkfifo` 建的 **named pipe（FIFO）** 有名字、像檔案一樣，沒有親屬關係的行程也能用，行程結束後它還在。

#### fork 之後，為什麼要關掉用不到的那一端

fork 會把描述子表整張複製給子行程，所以 fork 之後**父子兩邊都同時拿著讀端和寫端**。通常一邊只寫、一邊只讀，就把用不到的那一端關掉：

- 寫的一方：`close(fd[0])`
- 讀的一方：`close(fd[1])`

**不關會怎樣**：讀的一方要等到「**所有**寫端都關了」才會讀到 EOF。如果讀的一方自己還開著一個寫端，管子永遠不算「沒人寫了」，它讀完資料之後會一直等下去，程式卡住。（我實際跑過：讀的一方忘了關自己的寫端，read 等了 2 秒還沒回來；關掉之後，讀完 3 個 byte 馬上拿到 0。）

<div data-qid="u1-fork-pipe" markdown="1">

<div markdown="1">

**觀念題 16.** 父行程寫、子行程讀。下面的子行程忘了 `close(fd[1])`，會發生什麼事？

```c
int fd[2];
pipe(fd);
if (fork() == 0) { /* 子行程：讀 */
    char c;
    while (read(fd[0], &c, 1) > 0)
        putchar(c);
    printf("done\n");
} else {           /* 父行程：寫 */
    close(fd[0]);
    write(fd[1], "hi\n", 3);
    close(fd[1]);
    wait(NULL);
}
```

</div>

??? quiz "看答案"
    **子行程印出 `hi` 之後就卡住，永遠印不到 `done`；父行程停在 `wait` 等它，整個程式不會結束。**

    父行程已經關了它的寫端，但子行程自己還開著一個寫端（fork 複製來的），所以「所有寫端都關了」一直不成立，`read` 讀完 `hi\n` 之後不會回傳 0，而是一直等。修正：子行程一開始就 `close(fd[1])`。這支程式我實際跑過，結果就是印出 hi 後停住。

</div>

#### dup：讓另一個號碼也指到同一個地方

`dup(old)` 找**最小的空號碼**，讓它也指向 `old` 指的那個東西，回傳新號碼。常見的三行：

```c
close(1);      /* 1 空出來 */
dup(fd[1]);    /* 拿最小的空號：1 */
close(fd[1]);  /* 舊號碼用不到了 */
```

- `close(1)`：1 空出來，而且是最小的空號碼（0 還在用）。
- `dup(fd[1])`：拿到 1，1 現在也指向 pipe 的寫端。
- `close(fd[1])`：原本那個號碼用不到了就關掉；pipe 的寫端還有 1 這個號碼開著，不會被關掉。

之後 `printf` 寫 1 號，資料就進了 pipe，不會出現在螢幕上。`dup2(fd[1], 1)` 是一次做完前兩行的寫法：先把 1 關掉，再讓 1 指向 `fd[1]` 指的東西。

**110 Q1 子行程的描述子表**（fork 之後，pipe 的讀端是 3、寫端是 4）。子行程依序執行：

1. fork 之後（還沒動）
2. `close(fd[0])`
3. `close(1)`
4. `dup(fd[1])`
5. `close(fd[1])`

| 步驟 | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| 1 | 鍵盤 | 螢幕 | 螢幕 | 讀端 | 寫端 |
| 2 | 鍵盤 | 螢幕 | 螢幕 | － | 寫端 |
| 3 | 鍵盤 | － | 螢幕 | － | 寫端 |
| 4 | 鍵盤 | **寫端** | 螢幕 | － | 寫端 |
| 5 | 鍵盤 | **寫端** | 螢幕 | － | － |

（「讀端」「寫端」是 pipe 的兩端；「－」是空著的號碼。）

`close(1)` 之後空號碼有 1 和 3，最小的是 1，所以 dup 拿到 1。父行程對稱地把 0 號換成 pipe 的讀端，所以它的 `scanf` 讀的是 pipe。

#### exec：換掉程式，但打開的檔案留著

`execl(path, arg0, arg1, ..., NULL)` 把**目前這個行程**換成另一個程式：

| 被換掉 | 留下來 |
|---|---|
| text、data、heap、stack（整個記憶體內容） | **PID**（還是同一個行程） |
| 原本程式裡 exec 之後的那幾行 | **描述子表**（打開的檔案、pipe、被 dup 過的 0、1、2） |

- 所以 exec 成功之後**不會回來**，下一行只有 exec 失敗時才會執行。
- 因為描述子表留著，exec 之前把 1 號接到 pipe，新程式（例如 echo）寫標準輸出時，就寫進了 pipe。shell 執行 `ls | wc -l` 就是這樣做的：fork 兩次，一個把 1 號接到 pipe 寫端再 exec `ls`，另一個把 0 號接到讀端再 exec `wc`。
- 參數：`execl("/bin/echo", "echo", "hello", "world!", (char *)0)`，第一個是程式的路徑，第二個開始是新程式看到的 `argv[0]`、`argv[1]`……，最後用 NULL 結尾。名字裡有 `p` 的（`execlp`）會沿著 PATH 找程式；有 `v` 的（`execv`）把參數放在陣列裡。

<div class="mcq" data-ans="4" data-qid="u1-fork-exec" markdown="1">

**觀念題 17.** 子行程先執行 `dup2(f, 1)`（f 是打開的 out.txt），再 `execl("/bin/echo", "echo", "hi", (char *)0)`。下面哪一句**錯誤**？

1. echo 印的 `hi` 會寫進 out.txt，不會出現在螢幕上
2. echo 跑起來之後，它的 PID 跟呼叫 execl 的子行程一樣
3. 如果 execl 成功，它下一行的 `printf` 不會執行
4. exec 會把描述子表重設回 0、1、2 都接螢幕和鍵盤

??? quiz "看解析"
    **D 錯**。exec 換掉的是記憶體裡的程式（text、data、heap、stack），**描述子表會留著**，所以 1 號還是接到 out.txt，A 才會成立。B：exec 不建立新行程，PID 不變。C：成功的 exec 不會回來。這三點我都用程式實際跑過。

</div>

#### wait、zombie、orphan

- **`wait(&status)`**：等**任何一個**子行程結束，回傳它的 PID，結束碼放在 status。**`waitpid(pid, &status, 0)`**：等指定的那一個；pid 寫 −1 就是「任何一個」，跟 wait 一樣。
- **zombie（殭屍行程）**：子行程已經結束，但父行程**還沒呼叫 wait**。它的記憶體已經釋放，但 PID 和結束碼還留在系統裡，等父行程來拿。父行程一 wait，它就真正消失。
- **orphan（孤兒行程）**：父行程**先結束了**，子行程還在跑。UNIX 會讓 init（PID 1，或 systemd 這類負責收養的行程）當它的新父親，init 會定期呼叫 wait，所以孤兒結束後不會一直留成 zombie。

（我實際跑過：子行程結束、父行程還沒 wait 時，它的狀態是 Z（zombie）；父行程 wait 之後拿到結束碼，它就消失了。父行程先結束時，子行程的父親變成 PID 1。）

<div data-qid="u1-fork-zombie" markdown="1">

**觀念題 18.** 父行程 fork 出子行程之後，自己跑一個 10 分鐘的計算迴圈，完全沒有呼叫 wait；子行程 1 秒就結束了。(a) 這 10 分鐘裡子行程是什麼狀態？(b) 如果父行程一直不 wait、又不停地 fork，會有什麼問題？(c) 如果反過來，父行程 1 秒就結束、子行程跑 10 分鐘呢？

??? quiz "看答案"
    - **(a) zombie**：已經結束，但父行程沒有 wait，PID 和結束碼還留在系統裡等它來拿。
    - **(b) PID 被用光**：每個 zombie 都佔著一個 PID 和行程表的一格，一直累積，最後系統沒辦法再建立新行程。
    - **(c) orphan**：父行程先走了，子行程被 init（PID 1）收養；子行程結束時由 init 來 wait，不會留下 zombie。

</div>

#### 考試的步驟

1. **畫行程樹**：每個 fork 分兩支，標 P0、P1、P2……，寫下每個行程自己的變數值。
2. **標出誰等誰**：有 waitpid 的，子行程先印。
3. **thread 改的是同一份，fork 之後改的是自己那份。**
4. **注意 `--v` 和 `v--`**：`printf("%d", --v)` 先減再印；`printf("%d", v--)` 先印再減。

!!! example "106 Q1（10%）：三層 fork 加上 pthread，印出什麼？"
    ```c
    static void *runner(void *param) {
        (*(int *)param)--;                  /* 把傳進來的變數減 1 */
        pthread_exit(0);
    }
    int main(int argc, char **argv) {
        int value = 101;
        pid_t pid = fork();                 /* 第 17 行 */
        if (pid > 0) {
            int status;
            waitpid(-1, &status, 0);
            printf("A = %d\n", --value);
        }
        else if (pid == 0) {
            pid_t pid = fork();             /* 第 24 行 */
            if (pid > 0) {
                int status;
                waitpid(-1, &status, 0);
                printf("B = %d\n", value--);
            }
            else if (pid == 0) {
                pid_t pid = fork();         /* 第 31 行 */
                pthread_t tid;
                pthread_create(&tid, NULL, runner, &value);
                pthread_join(tid, NULL);
                if (pid > 0) {
                    int status;
                    waitpid(-1, &status, 0);
                    printf("C = %d\n", ++value);
                }
                else {
                    printf("D = %d\n", value++);
                }
            }
            else return 1;
        }
        else return 1;
        return 0;
    }
    ```

    **行程樹（4 個行程）**：P0 在第 17 行 fork 出 P1；P1 在第 24 行 fork 出 P2；P2 在第 31 行 fork 出 P3。每個行程開始時 value 都是 101（fork 的時候複製過去的）。

    | 行程 | 走到哪 | value 怎麼變 | 印出 |
    |---|---|---|---|
    | P3 | 第 31 行拿到 0 → else | thread 減 1 → 100；`value++` 先印 **100** | D = 100 |
    | P2 | 第 31 行拿到 ＞0 | thread 減 1 → 100；等 P3；`++value` → **101** | C = 101 |
    | P1 | 第 24 行拿到 ＞0 | 沒有 thread 改它，還是 101；等 P2；`value--` 先印 **101** | B = 101 |
    | P0 | 第 17 行拿到 ＞0 | 101；等 P1；`--value` → **100** | A = 100 |

    **順序**：P0 等 P1、P1 等 P2、P2 等 P3，所以從最底下的 P3 開始印：

    ```text
    D = 100
    C = 101
    B = 101
    A = 100
    ```

    **三個陷阱**：

    - 第 31 行的 fork 在 `pthread_create` **之前**，所以 P2 和 P3 都會各開一個 thread，各自把**自己的** value 從 101 減成 100。
    - P1 和 P0 從頭到尾沒有 thread 改它們的 value，還是 101。
    - `value--` 印的是減之前的值（B 印 101），`++value` 印的是加之後的值（C 印 101）。

    這支程式用 gcc 實際編譯執行過，輸出跟上面一樣。

!!! example "110 Q1（10%）：pipe、dup、execl，印出什麼？"
    ```c
    int main() {
        int fd[2];
        pipe(fd);
        pid_t pid = fork();
        if (pid > 0) {                      /* 父行程 */
            close(fd[1]);
            close(0);
            dup(fd[0]);
            close(fd[0]);
            int status;
            waitpid(-1, &status, 0);
            char buf[128];
            int n = scanf("%4s", buf);
            printf("%d:%s\n", n, buf);
        }
        else if (pid == 0) {                /* 子行程 */
            close(fd[0]);
            close(1);
            dup(fd[1]);
            close(fd[1]);
            execl("/bin/echo", "echo", "hello", "world!", (void *) 0);
        }
        else return 1;
        return 0;
    }
    ```

    - **子行程（把輸出接進 pipe）**：關掉讀端；`close(1)` 再 `dup(fd[1])`，標準輸出變成 pipe 的寫端；execl 換成 `echo hello world!`，把 `hello world!` 和換行寫進 pipe。這行字**不會出現在螢幕上**。
    - **父行程（從 pipe 讀）**：關掉寫端；`close(0)` 再 `dup(fd[0])`，標準輸入變成 pipe 的讀端；waitpid 等 echo 結束。
    - **`scanf("%4s", buf)`（buf ＝ hell，n ＝ 1）**：`%s` 讀一個不含空白的字串，`%4` 限制最多 4 個字元，所以從 `hello` 只讀到 `hell`。scanf 回傳成功讀到幾個項目，讀到 1 個。
    - **印出（1:hell）**：

    ```text
    1:hell
    ```

    **為什麼只有一行**：echo 的輸出流進 pipe，被父行程讀走了，螢幕上只看得到父行程的 printf。這支程式也實際執行過，輸出就是 `1:hell`。

### 1.4 練習：簡單觀念題 {#u1-concept}

一兩句話就能回答的題目，確認名詞和觀念有沒有記對。題目照主題分組；選擇題按下選項就會對答案，問答題先寫在手寫板或紙上，再打開參考答案。

#### 行程與執行緒

<div class="mcq" data-qid="u1-concept-1" data-ans="2" markdown="1">

**簡單 1.** 一個 running 的行程發出 I/O 請求，它的狀態會變成什麼？

1. ready
2. waiting
3. new
4. terminated

??? quiz "看解析"
    **B. waiting**。它要等 I/O，不能繼續用 CPU。等 I/O 完成會先回 **ready** 排隊（A 是時間片用完或被搶時的去處）。

</div>

<div class="mcq" data-ans="3" data-qid="u1-bank-s1" markdown="1">

**簡單 2.** 下面哪一個狀態轉換**不可能**直接發生？

1. ready → running
2. running → waiting
3. waiting → running
4. running → ready

??? quiz "看解析"
    **C**。waiting 的行程等到 I/O 或事件之後，要先回 **ready** 排隊，被排程器選中才能 running，不會直接跳回 CPU。

</div>

<div class="mcq" data-ans="1" data-qid="u1-bank-s8" markdown="1">

**簡單 3.** 哪一個排程器控制 degree of multiprogramming？

1. long-term scheduler
2. short-term scheduler
3. dispatcher
4. 磁碟排程器

??? quiz "看解析"
    **A**。long-term scheduler 決定讓哪些工作載入記憶體，所以決定記憶體裡有幾個行程。short-term scheduler 只在記憶體裡的 ready 行程之間挑一個給 CPU。

</div>

<div class="mcq" data-qid="u1-concept-4" data-ans="4" markdown="1">

**簡單 4.** 同一個 process 裡的兩個 thread，**共用**下面哪一個？

1. program counter
2. 暫存器
3. stack
4. 全域變數

??? quiz "看解析"
    **D. 全域變數**（還有程式碼、heap、開啟的檔案）。A、B、C 每個 thread 各有一份，因為它們各自做到不同步驟、各自呼叫不同的函式。

</div>

<div class="mcq" data-ans="3" data-qid="u1-bank-s3" markdown="1">

**簡單 5.** 同一個 process 的 threads，下面哪一個是**每個 thread 各有一份**？

1. heap
2. 全域變數
3. stack
4. 開啟的檔案

??? quiz "看解析"
    **C. stack**（還有 program counter、暫存器）。每個 thread 各自呼叫不同的函式，區域變數和返回位址要分開放。A、B、D 屬於整個 process，大家共用。

</div>

#### CPU 排程

<div class="mcq" data-ans="2" data-qid="u1-bank-s2" markdown="1">

**簡單 6.** 從行程送進系統，到它**第一次**拿到 CPU 的時間叫什麼？

1. waiting time
2. response time
3. turnaround time
4. burst time

??? quiz "看解析"
    **B. response time**。turnaround time 是從送進來到**做完**；waiting time 是在 ready queue 等的**總**時間；burst time 是它要用 CPU 多久。

</div>

<div class="mcq" data-qid="u1-concept-2" data-ans="3" markdown="1">

**簡單 7.** 幾個行程都在時間 0 到達，下面哪一種演算法的平均等待時間一定最短？

1. FCFS
2. Round Robin
3. SJF
4. Priority

??? quiz "看解析"
    **C. SJF**。短的先做，後面的人多等的時間最少（觀念課的例子）。都在時間 0 到達時，SRTF 跟 SJF 一樣，因為沒有新來的可以搶。

</div>

<div class="mcq" data-qid="u1-concept-3" data-ans="1" markdown="1">

**簡單 8.** Round Robin 的 time quantum 設得非常大（比每個行程的 burst 都長），會變成哪一種？

1. FCFS
2. SJF
3. SRTF
4. Priority

??? quiz "看解析"
    **A. FCFS**。每個行程都在一個 quantum 內做完，不會被換下來，就是照到達順序一個接一個做。反過來 quantum 太小，大部分時間都花在 context switch。

</div>

<div class="mcq" data-ans="3" data-qid="u1-bank-s4" markdown="1">

**簡單 9.** 下面哪一個排程演算法一定是**搶先式**？

1. FCFS
2. SJF
3. Round Robin
4. 不搶先的 Priority

??? quiz "看解析"
    **C. Round Robin**。quantum 用完，不管做完沒有都要讓出 CPU。FCFS 和 SJF 都是拿到 CPU 就做到完（SJF 會搶的版本叫 SRTF）。

</div>

<div class="mcq" data-qid="u1-concept-5" data-ans="2" markdown="1">

**簡單 10.** priority 排程中，低 priority 的行程一直輪不到（starvation），常用的解法是？

1. 把 quantum 調大
2. aging：等越久，priority 越高
3. 改成 FCFS
4. 增加 CPU 數量

??? quiz "看解析"
    **B. aging**。等得夠久，priority 總會升到最高，一定輪得到。

</div>

#### fork、thread、pipe

<div class="mcq" data-ans="1" data-qid="u1-bank-s5" markdown="1">

**簡單 11.** `pid = fork();` 之後，**子行程**裡的 pid 是多少？

1. 0
2. 子行程自己的 PID
3. 父行程的 PID
4. −1

??? quiz "看解析"
    **A. 0**。父行程拿到的才是子行程的 PID（大於 0）；−1 代表 fork 失敗。子行程要知道自己的 PID 用 `getpid()`，父親的用 `getppid()`。

</div>

<div class="mcq" data-qid="u1-fork-1" data-ans="1" markdown="1">

**簡單 12.** 下面的程式，父行程印出什麼？

```c
int x = 5;
pid_t p = fork();
if (p == 0) x = 10;
else { wait(NULL); printf("%d\n", x); }
```

1. 5
2. 10
3. 不一定，看誰先跑
4. 15

??? quiz "看解析"
    **A. 5**。fork 之後父子各有一份 x。子行程把**自己的** x 改成 10，父行程那份還是 5。wait 只是讓父行程等子行程結束，不會把子行程的變數帶回來。

</div>

<div class="mcq" data-qid="u1-fork-2" data-ans="2" markdown="1">

**簡單 13.** `runner` 會把傳進來的整數加 3。下面印出什麼？

```c
int v = 5;
pthread_create(&t, NULL, runner, &v);
pthread_join(t, NULL);
printf("%d\n", v);
```

1. 5
2. 8
3. 不一定，看誰先跑
4. 3

??? quiz "看解析"
    **B. 8**。thread 跟 main 在同一個行程裡，共用 v。thread 把 v 加 3，pthread_join 等它做完，所以印 8。（如果換成 fork，子行程改的是自己那份，父行程會印 5。）

</div>

<div class="mcq" data-qid="u1-fork-3" data-ans="3" markdown="1">

**簡單 14.** `fork(); fork(); fork();` 連續三行執行完，總共有幾個行程（含原本的）？

1. 3
2. 6
3. 8
4. 4

??? quiz "看解析"
    **C. 8**。每一個 fork，**當時存在的每個行程**都會再複製一份，行程數乘以 2：1 → 2 → 4 → 8，也就是 $2^3$。

</div>

<div class="mcq" data-ans="2" data-qid="u1-bank-s6" markdown="1">

**簡單 15.** `pipe(fd)` 之後，要**讀**資料用哪一個？

1. `fd[1]`
2. `fd[0]`
3. 0 號（標準輸入）
4. 1 號（標準輸出）

??? quiz "看解析"
    **B. `fd[0]`** 是讀端，`fd[1]` 是寫端（記法：0 對應 stdin 讀、1 對應 stdout 寫）。C、D 是標準輸入、輸出，除非用 dup 接過去，不然跟 pipe 沒有關係。

</div>

<div class="mcq" data-qid="u1-fork-4" data-ans="2" markdown="1">

**簡單 16.** 執行 `close(1); dup(fd[1]);` 之後（fd 是 pipe），`printf` 印的東西會去哪裡？

1. 還是螢幕
2. pipe 的寫端，從讀端讀得到
3. pipe 的讀端
4. 消失，因為 1 被關掉了

??? quiz "看解析"
    **B**。dup 用目前最小的空號碼，剛關掉的 1 就是最小的，所以新的 1 指向 pipe 的寫端。printf 寫到 1（標準輸出），資料就進了 pipe，另一個行程從 `fd[0]` 讀得到。

</div>

<div class="mcq" data-qid="u1-fork-5" data-ans="2" markdown="1">

**簡單 17.** 子行程呼叫 `execl("/bin/echo", ...)` 成功之後，execl 下一行的程式碼會怎樣？

1. 等 echo 結束後執行
2. 不會執行，因為這個行程已經整個換成 echo
3. 由父行程執行
4. 只有 echo 失敗時才不執行

??? quiz "看解析"
    **B**。exec 把行程的程式碼換掉，原本的程式碼已經不在了，不會「回來」。反過來說，**只有 exec 失敗時**，下一行才會執行，所以常見寫法是在 exec 後面接錯誤處理。

</div>

<div class="mcq" data-ans="4" data-qid="u1-bank-s7" markdown="1">

**簡單 18.** 子行程已經結束，但父行程還沒呼叫 wait。這個子行程叫什麼？

1. orphan
2. daemon
3. thread
4. zombie

??? quiz "看解析"
    **D. zombie**。它的 PID 和結束碼還留著，等父行程 wait 來拿。A 的 orphan 剛好相反：父行程先結束，子行程還在跑。

</div>

<div data-qid="u1-fork-6" markdown="1">

**簡單 19.** 用自己的話說明：為什麼 fork 出來的子行程改變數，父行程看不到；thread 改變數，main 卻看得到？

??? quiz "看參考答案"
    fork 會**複製**整個行程的記憶體，父子各有一份變數，改的是自己那份。thread 是同一個行程裡的另一條執行路線，**共用**同一份記憶體（全域變數、heap、傳進去的指標指到的變數），所以 thread 改了，main 看得到。

    **自我檢查**：你有沒有寫出「複製」和「共用」這兩個關鍵字？

</div>

### 1.5 練習：基礎題 {#u1-drill}

要動手畫 Gantt chart 或追程式，但每題只用到一個觀念。先自己算，再打開對答案；答案都用程式驗算過。

#### 排程計算

**做法**：先畫 Gantt chart（誰在什麼時候跑），每個行程的等待時間 ＝ 完成 − 到達 − burst，再平均。題目由簡單到複雜：FCFS → SJF、SRTF → Round Robin → Priority。也可以把數字貼進 [1.2 的動畫](#u1-2) 對答案。

<div data-qid="u1-concept-6" markdown="1">

**基礎 1.** P1、P2、P3 在時間 0 依序到達，burst 24、3、3。FCFS 的平均等待時間是多少？如果順序改成 P2、P3、P1 呢？用這個例子說明 convoy effect。

??? quiz "看參考答案"
    - **FCFS（P1、P2、P3）（17）**：等待 0、24、27，平均 $\frac{51}{3}=17$。
    - **改成 P2、P3、P1（3）**：等待 P2 0、P3 3、P1 6，平均 $\frac93=3$。

    **convoy effect**：一個很長的行程排在前面，後面一群短的都被它卡住（像一台慢車後面跟著一長串車）。短的先做，平均等待從 17 降到 3。

</div>

<div data-qid="u1-bank-b1" markdown="1">

<div markdown="1">

**基礎 2.** 用 FCFS 排程，畫 Gantt chart，算平均等待時間和平均 turnaround time。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 4 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |

</div>

??? quiz "看答案"
    **Gantt chart**：P1 0–4、P2 4–7、P3 7–8。

    | | 完成 | turnaround ＝ 完成 − 到達 | waiting ＝ turnaround − burst |
    |---|---|---|---|
    | P1 | 4 | 4 | 0 |
    | P2 | 7 | 6 | 3 |
    | P3 | 8 | 6 | 5 |

    平均等待 $\frac{0+3+5}{3}=\frac83\approx$ **2.67**；平均 turnaround $\frac{4+6+6}{3}=\frac{16}3\approx$ **5.33**。

</div>

<div data-qid="u1-drill-1" markdown="1">

<div markdown="1">

**基礎 3.** 用 FCFS 排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 8 |
| P4 | 3 | 6 |

</div>

??? quiz "看完整解答"
    - **排程順序**：P1（0–5） → P2（5–8） → P3（8–16） → P4（16–22）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：5−0−5＝0、P2：8−1−3＝4、P3：16−2−8＝6、P4：22−3−6＝13。
    - **平均等待時間**：$\frac{0+4+6+13}{4}=$ **5.75**。

    用動畫對答案：把 `P1 0 5, P2 1 3, P3 2 8, P4 3 6` 貼進 [1.2 的動畫](#u1-2)，演算法選 FCFS。

</div>

<div data-qid="u1-drill-2" markdown="1">

<div markdown="1">

**基礎 4.** 用 SJF（不搶）排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 8 |
| P4 | 3 | 6 |

</div>

??? quiz "看完整解答"
    - **排程順序**：P1（0–5） → P2（5–8） → P4（8–14） → P3（14–22）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：5−0−5＝0、P2：8−1−3＝4、P3：22−2−8＝12、P4：14−3−6＝5。
    - **平均等待時間**：$\frac{0+4+12+5}{4}=$ **5.25**。

    用動畫對答案：把 `P1 0 5, P2 1 3, P3 2 8, P4 3 6` 貼進 [1.2 的動畫](#u1-2)，演算法選 SJF（不搶）。

</div>

<div data-qid="u1-concept-7" markdown="1">

**基礎 5.** P1、P2、P3、P4 的到達時間 0、1、2、3，burst 8、4、9、5。分別用 SJF（不搶）和 SRTF（會搶）畫 Gantt chart，算平均等待時間。

??? quiz "看參考答案"
    **SRTF（6.5）**：P1 0–1、P2 1–5（P2 到的時候剩 4 ＜ P1 剩 7，搶走）、P4 5–10、P1 10–17、P3 17–26。等待 P1 9、P2 0、P3 15、P4 2，平均 $\frac{26}{4}=6.5$。

    **SJF（7.75）**：P1 0–8（不能被搶）、P2 8–12、P4 12–17、P3 17–26。等待 P1 0、P2 7、P4 9、P3 15，平均 $\frac{31}{4}=7.75$。

    可以把這組數字貼進 [1.2](#u1-2) 的動畫，切換演算法對照。

</div>

<div data-qid="u1-bank-b2" markdown="1">

<div markdown="1">

**基礎 6.** 用 SRTF（剩餘時間最短的先做，會搶）排程，畫 Gantt chart，算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |

</div>

??? quiz "看答案"
    | 時間 | 發生什麼事 | 執行 |
    |---|---|---|
    | 0 | 只有 P1 | P1 |
    | 1 | P2 到，3 ＜ P1 剩的 4 → 搶走 | P2 |
    | 2 | P3 到，1 ＜ P2 剩的 2 → 搶走 | P3 |
    | 3 | P3 做完；P2 剩 2 ＜ P1 剩 4 | P2（到 5） |
    | 5 | P2 做完 | P1（到 9） |

    等待 ＝ 完成 − 到達 − burst：P1 $9-0-5=4$、P2 $5-1-3=1$、P3 $3-2-1=0$，平均 $\frac53\approx$ **1.67**。

</div>

<div data-qid="u1-drill-3" markdown="1">

<div markdown="1">

**基礎 7.** 用 SRTF（會搶）排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 7 |
| P2 | 2 | 4 |
| P3 | 4 | 1 |
| P4 | 5 | 4 |

</div>

??? quiz "看完整解答"
    - **排程順序**：P1（0–2） → P2（2–4） → P3（4–5） → P2（5–7） → P4（7–11） → P1（11–16）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：16−0−7＝9、P2：7−2−4＝1、P3：5−4−1＝0、P4：11−5−4＝2。
    - **平均等待時間**：$\frac{9+1+0+2}{4}=$ **3**。

    用動畫對答案：把 `P1 0 7, P2 2 4, P3 4 1, P4 5 4` 貼進 [1.2 的動畫](#u1-2)，演算法選 SRTF。

</div>

<div data-qid="u1-bank-b3" markdown="1">

**基礎 8.** P1、P2、P3 都在時間 0 到達，burst 是 5、3、1。用 Round Robin（quantum ＝ 2），算平均等待時間和平均 response time。

??? quiz "看答案"
    **Gantt chart**：P1 0–2、P2 2–4、P3 4–5、P1 5–7、P2 7–8、P1 8–9。

    - 完成：P3 5、P2 8、P1 9。
    - 等待 ＝ 完成 − burst：P1 $9-5=4$、P2 $8-3=5$、P3 $5-1=4$，平均 $\frac{13}3\approx$ **4.33**。
    - response（第一次拿到 CPU）：P1 0、P2 2、P3 4，平均 **2**。

    RR 的平均等待不一定比較短，但每個行程很快就第一次拿到 CPU，所以 response time 好。

</div>

<div data-qid="u1-drill-4" markdown="1">

<div markdown="1">

**基礎 9.** 用 Round Robin（quantum ＝ 2）排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |
| P4 | 3 | 2 |

</div>

??? quiz "看完整解答"
    - **規則**：每次最多跑 2；同一時間有新來的和被切下來的，新來的先排進 queue。
    - **排程順序**：P1（0–2） → P2（2–4） → P3（4–5） → P1（5–7） → P4（7–9） → P2（9–10） → P1（10–11）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：11−0−5＝6、P2：10−1−3＝6、P3：5−2−1＝2、P4：9−3−2＝4。
    - **平均等待時間**：$\frac{6+6+2+4}{4}=$ **4.5**。

    用動畫對答案：把 `P1 0 5, P2 1 3, P3 2 1, P4 3 2` 貼進 [1.2 的動畫](#u1-2)，演算法選 Round Robin、quantum 填 2。

</div>

<div data-qid="u1-drill-6" markdown="1">

<div markdown="1">

**基礎 10.** 用 Round Robin（quantum ＝ 4）排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst |
|---|---|---|
| P1 | 0 | 10 |
| P2 | 0 | 4 |
| P3 | 0 | 6 |

</div>

??? quiz "看完整解答"
    - **規則**：每次最多跑 4；同一時間有新來的和被切下來的，新來的先排進 queue。
    - **排程順序**：P1（0–4） → P2（4–8） → P3（8–12） → P1（12–16） → P3（16–18） → P1（18–20）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：20−0−10＝10、P2：8−0−4＝4、P3：18−0−6＝12。
    - **平均等待時間**：$\frac{10+4+12}{3}=$ **8.67**。

    用動畫對答案：把 `P1 0 10, P2 0 4, P3 0 6` 貼進 [1.2 的動畫](#u1-2)，演算法選 Round Robin、quantum 填 4。

</div>

<div data-qid="u1-drill-5" markdown="1">

<div markdown="1">

**基礎 11.** 用 Priority（數字小的先，不搶）排程下面的行程，畫出順序並算平均等待時間。

| 行程 | 到達 | burst | priority |
|---|---|---|---|
| P1 | 0 | 4 | 3 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 1 | 4 |
| P4 | 3 | 5 | 2 |

</div>

??? quiz "看完整解答"
    - **排程順序**：P1（0–4） → P2（4–7） → P4（7–12） → P3（12–13）。
    - **等待時間 ＝ 完成 − 到達 − burst**：P1：4−0−4＝0、P2：7−1−3＝3、P3：13−2−1＝10、P4：12−3−5＝4。
    - **平均等待時間**：$\frac{0+3+10+4}{4}=$ **4.25**。

    用動畫對答案：把 `P1 0 4 3, P2 1 3 1, P3 2 1 4, P4 3 5 2` 貼進 [1.2 的動畫](#u1-2)，演算法選 Priority（不搶）。

</div>

#### 程式追蹤：fork、thread、pipe

**做法**：畫行程樹、標出誰等誰；thread 改的是同一份變數，fork 之後各改各的（[1.3](#u1-fork)）。

<div data-qid="u1-bank-b4" markdown="1">

<div markdown="1">

**基礎 12.** 下面的程式一共印出幾個 `hi`？畫出行程樹。

```c
pid_t p = fork();
if (p == 0)
    fork();
printf("hi\n");
```

</div>

??? quiz "看答案"
    **3 個**。

    - P0 第一次 fork 出 P1。P0 拿到的 p ＞ 0，不進 if；P1 拿到 0，進 if 再 fork 出 P2。
    - P2 是 P1 在 if 裡 fork 出來的，從 fork 的下一行繼續，也會跑到 printf。
    - P0、P1、P2 各印一次：3 個 hi。（我實際執行過，印出 3 行。）

</div>

<div data-qid="u1-bank-b6" markdown="1">

<div markdown="1">

**基礎 13.** 下面的程式印出什麼？

```c
int g = 0;
void *add(void *p) {
    g += 5;
    return NULL;
}

int main(void) {
    pthread_t t;
    pthread_create(&t, NULL, add, NULL);
    pthread_join(t, NULL);
    if (fork() == 0) {
        g += 1;
        printf("child %d\n", g);
        return 0;
    }
    wait(NULL);
    printf("parent %d\n", g);
    return 0;
}
```

</div>

??? quiz "看答案"
    ```text
    child 6
    parent 5
    ```

    - thread 跟 main 共用 g，join 之後 g ＝ 5。
    - fork 把 g ＝ 5 複製給子行程；子行程把**自己的** g 加成 6。
    - 父行程的 g 還是 5，等子行程結束才印。我實際執行過，輸出一樣。

</div>

<div data-qid="u1-fork-7" markdown="1">

**基礎 14.** 106 Q1 裡，為什麼 B 印 101、C 也印 101？

??? quiz "看參考答案"
    - **B（P1）**：P1 沒有開 thread，value 一直是 101。`value--` 是先印再減，所以印 101。
    - **C（P2）**：P2 開的 thread 把 P2 的 value 減成 100。`++value` 先加再印，所以印 101。

    兩個都是 101，但原因不同：一個是「沒被減、先印」，一個是「被減了、又加回來」。

</div>

<div data-qid="u1-bank-b5" markdown="1">

<div markdown="1">

**基礎 15.** 下面的程式在螢幕上印出什麼？

```c
int fd[2];
char buf[8] = {0};
pipe(fd);
if (fork() == 0) {
    close(fd[1]);
    read(fd[0], buf, 7);
    printf("child got %s\n", buf);
} else {
    close(fd[0]);
    /* 寫 3 個 byte：O、S、\0 */
    write(fd[1], "OS", 3);
    close(fd[1]);
    wait(NULL);
    printf("parent done\n");
}
```

</div>

??? quiz "看答案"
    ```text
    child got OS
    parent done
    ```

    - 子行程關掉寫端，從讀端讀；父行程關掉讀端，寫進 3 個 byte 再關掉寫端。
    - 子行程讀到 `OS`（連同結尾的 `\0`），印出 `child got OS`。
    - 父行程 `wait` 等子行程結束才印 `parent done`，所以順序固定。我實際執行過，輸出一樣。

</div>

### 1.6 練習：考古題變化題 {#u1-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

<div data-qid="u1-exam-1" markdown="1">

**考古變化 1.**（改自 115 Q2a・換情境）process A 正在 CPU 上跑。依序發生：(1) A 呼叫 `read()` 讀磁碟 (2) 磁碟讀完，發出中斷 (3) A 又跑了一陣子，time slice 用完 (4) A 再次被排到、呼叫 `wait()` 等它的子行程 (5) 子行程結束。每一步之後，A 在哪個狀態、哪個 queue？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只問「什麼時候交出 CPU」；這題把一個 process 的一生串起來，連「回來」的路也要會。
    - **(1)**：running → **waiting**，放進那顆磁碟的 **I/O wait queue**。
    - **(2)**：I/O 完成，waiting → **ready**，放回 **ready queue**（不是直接回到 CPU，要等排程器挑它）。
    - **(3)**：被 timer 中斷，running → **ready**，放回 **ready queue**。
    - **(4)**：running → **waiting**，放進等子行程結束的 **wait queue**。
    - **(5)**：子行程結束（OS 通知父行程），A 從 waiting → **ready**，回到 **ready queue**。
    - **規律**：離開 running 只有三條路（等 I/O、等事件、被搶走），等待結束一律先回 ready。

</div>

<div data-qid="u1-exam-2" markdown="1">

**考古變化 2.**（改自 115 Q2b・延伸）多核心的排程器常做 load balancing（把忙的 core 上的 process 搬到閒的 core）。它跟 processor affinity 有什麼衝突？push migration 和 pull migration 是什麼？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只問 affinity 的好處；這題問它跟另一個目標（負載平均）怎麼取捨。
    - **衝突**：load balancing 要搬 process，affinity 希望 process 留在原本的 core（cache 是熱的）。搬過去之後新 core 的 cache 是冷的，要一筆一筆 miss 重新載入，搬一次就要付一次代價。
    - **push migration**：有一個定期檢查的工作，發現某個 core 太忙，就把它的 process **推**到比較閒的 core。
    - **pull migration**：閒下來的 core 主動到忙的 core 的佇列**拉**一個 process 過來跑。
    - **折衷**：負載差很多時才搬（設門檻），或優先搬剛開始跑、cache 還沒熱起來的 process。

</div>

<div data-qid="u1-exam-3" markdown="1">

**考古變化 3.**（改自 114 Q6b・應用）下面三種情況，各比較適合用 shared memory 還是 message passing？說明理由。(a) 同一台電腦上，影像處理的兩個 process 每秒要交換好幾張大圖 (b) 兩台不同的電腦要合作 (c) 兩個 process 只是偶爾傳一個很小的控制訊息

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只問兩種模型是什麼；這題要依情況選，理由要扣住各自的優缺點。
    - **(a) shared memory**：資料量大、交換頻繁，建好共享區之後直接讀寫、不用經過 kernel，最快；同步（例如用 semaphore）要自己做。
    - **(b) message passing**：兩台電腦沒有共用的記憶體，只能透過網路傳訊息。
    - **(c) message passing**：訊息很小、很少，用 send／receive 簡單，不用另外建共享區、也不用處理同步。

</div>

<div data-qid="u1-exam-4" markdown="1">

**考古變化 4.**（改自 113 Q6a・換數字）五個 process 都在時間 0 到達，burst 是 8、4、2、6、3，priority 是 2、4、1、3、5（數字小優先）。求 SJF、non-preemptive priority、RR（q＝2）的平均等待時間。

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了，RR 的 quantum 變成 2：每次最多跑 2 個單位，剩不到 2 就跑完為止。
    - **SJF（6.2）**：照 burst 由短到長 P3(2)、P5(3)、P2(4)、P4(6)、P1(8)，開始時間 0、2、5、9、15。都在時間 0 到達，等待 ＝ 開始時間：$\frac{0+2+5+9+15}{5}=\frac{31}{5}=$ **6.2**。
    - **priority（9.6）**：數字小的先 P3(1)、P1(2)、P4(3)、P2(4)、P5(5)，開始時間 0、2、10、16、20：$\frac{48}{5}=$ **9.6**。
    - **RR，q＝2（11.6）**：每一格 2 個單位，照 P1→P5 輪：
        - `P1 P2 P3 P4 P5 | P1 P2 P4 P5 | P1 P4 | P1`
        - P3 在 6 做完（只要一格）、P2 在 14、P5 在 17（最後一次只跑 1）、P4 在 21、P1 在 23。
        - 等待 ＝ 完成 − burst：P1 15、P2 10、P3 4、P4 15、P5 14，平均 $\frac{58}{5}=$ **11.6**。
    - **觀察**：SJF 的平均等待最小（它就是最佳的非搶先排程）；RR 的平均等待最大，但每個 process 都很快拿到第一次 CPU（回應時間短）。

    我用程式模擬過三種排程，答案一樣。

</div>

<div data-qid="u1-exam-5" markdown="1">

<div markdown="1">

**考古變化 5.**（改自 106 Q1・改程式）下面的程式印出什麼？（thread 在第二次 fork **之前**建立）

```c
static void *runner(void *param) {
    (*(int *)param) += 10;
    pthread_exit(0);
}
int main(void) {
    int value = 5;
    pid_t pid = fork();
    if (pid > 0) {
        wait(NULL);
        printf("A = %d\n", value);
    } else if (pid == 0) {
        pthread_t tid;
        pthread_create(&tid, NULL, runner, &value);
        pthread_join(tid, NULL);
        pid = fork();
        if (pid > 0) {
            wait(NULL);
            printf("B = %d\n", value++);
        } else if (pid == 0) {
            value *= 2;
            printf("C = %d\n", value);
        }
    }
    return 0;
}
```

</div>

??? quiz "看完整解答"
    - **跟原題差在哪**：原題的 thread 在最後一次 fork 之後才建立，兩個行程各自減一次；這題的 thread 在 fork **之前**就改好了 value，fork 會把改過的值複製給子行程。
    - **行程樹**：P0 fork 出 P1；P1 開 thread、再 fork 出 P2。
    - **P1**：thread 跟 P1 共用記憶體，把 P1 的 value 從 5 加成 **15**；join 之後才 fork，所以 P2 拿到的副本也是 15。
    - **P2**：`value *= 2` → 30，印 **C = 30**。
    - **P1**：等 P2 結束後印 `value++`，印的是加之前的 **15**（P2 乘 2 改的是 P2 自己的副本，不影響 P1）。
    - **P0**：沒有任何 thread 或子行程能改到它的 value，還是 **5**。
    - **輸出**（P0 等 P1、P1 等 P2，所以從最底下印起）：
        ```text
        C = 30
        B = 15
        A = 5
        ```

    這支程式用 gcc 實際編譯執行過，輸出跟上面一樣。

</div>

<div data-qid="u1-exam-6" markdown="1">

<div markdown="1">

**考古變化 6.**（改自 110 Q1・改程式）下面的程式在螢幕上印出什麼？（這次是父行程寫進 pipe、子行程讀）

```c
int main(void) {
    int fd[2];
    pipe(fd);
    pid_t pid = fork();
    if (pid == 0) {                  /* 子行程 */
        close(fd[1]);
        close(0);
        dup(fd[0]);
        close(fd[0]);
        char a[16], b[16];
        int n = scanf("%3s %s", a, b);
        printf("%d:%s|%s\n", n, a, b);
    } else if (pid > 0) {            /* 父行程 */
        close(fd[0]);
        close(1);
        dup(fd[1]);
        close(fd[1]);
        printf("operating system\n");
        fflush(stdout);
        close(1);
        wait(NULL);
        fprintf(stderr, "done\n");
    }
    return 0;
}
```

</div>

??? quiz "看完整解答"
    - **跟原題差在哪**：讀寫的方向反過來，而且 scanf 換成兩個欄位，第一個限制 3 個字元。
    - **父行程（寫）**：關掉讀端；`close(1)` 再 `dup(fd[1])`，標準輸出變成 pipe 的寫端。`printf("operating system\n")` 寫進 pipe，**不會出現在螢幕上**；`fflush` 把緩衝區真的送出去。最後用 stderr 印 `done`，stderr 沒有被改，會出現在螢幕上。
    - **子行程（讀）**：標準輸入變成 pipe 的讀端。`scanf("%3s %s")`：
        - `%3s` 最多讀 3 個字元：a ＝ `ope`。
        - 格式裡的空白會跳過「零個或多個」空白字元，這裡剛好一個都沒有，所以 `%s` 從 `rating` 接著讀：b ＝ `rating`。
        - 讀到 2 個項目，n ＝ 2。
    - **輸出**（父行程等子行程結束才印 done）：
        ```text
        2:ope|rating
        done
        ```

    這支程式用 gcc 實際編譯執行過，輸出跟上面一樣。

</div>

### 1.7 練習：猜題 {#u1-bank}

考古題還沒考過、但恐龍書第 3～5 章（行程、執行緒、CPU 排程）的重點，我猜比較可能出現的題型，包含 115 年那種英文名詞填空。

<div data-qid="u1-bank-g1" markdown="1">

<div markdown="1">

**猜題 1.**（英文名詞填空，115 年的格式）

- (a) The ＿＿ scheduler selects processes from the job pool on disk and loads them into memory for execution.
- (b) A process that has terminated, but whose parent has not yet called wait(), is called a ＿＿ process.
- (c) ＿＿ is the time from the submission of a request until the first response is produced.
- (d) In priority scheduling a low-priority process may wait indefinitely. This problem is called ＿＿, and one solution is ＿＿.
- (e) Unlike an ordinary pipe, a ＿＿ pipe does not require a parent–child relationship and continues to exist after the communicating processes have finished.

</div>

??? quiz "看答案"
    - (a) **long-term**（job）scheduler
    - (b) **zombie**
    - (c) **Response time**
    - (d) **starvation**（indefinite blocking）；**aging**
    - (e) **named**（FIFO）

</div>

<div data-qid="u1-bank-g2" markdown="1">

**猜題 2.**（Amdahl's law）一個程式有 25% 只能循序執行，75% 可以平行。用 Amdahl's law 算 2、4、8 核心的加速比上限；核心無限多時，最多快幾倍？

??? quiz "看答案"
    $$\text{speedup}\le\frac{1}{S+\frac{1-S}{N}}$$

    S 是只能循序的比例（0.25），N 是核心數：

    | N | 計算 | 加速比上限 |
    |---|---|---|
    | 2 | $\frac1{0.25+0.375}$ | **1.6** |
    | 4 | $\frac1{0.25+0.1875}$ | **約 2.29** |
    | 8 | $\frac1{0.25+0.09375}$ | **約 2.91** |
    | ∞ | $\frac1{0.25}$ | **4** |

    重點：循序的部分決定上限，核心再多也快不過 $\frac1S$ 倍。

</div>

<div class="mcq" data-ans="2" data-qid="u1-bank-g3" markdown="1">

**猜題 3.** 單核心 CPU 上用 Round Robin 輪流跑兩個 thread，兩個都一直有進度。這叫什麼？

1. 平行（parallelism）
2. 並行（concurrency），但不是平行
3. 兩者都是
4. 兩者都不是

??? quiz "看解析"
    **B**。**concurrency**：好幾個工作都在前進，可以是輪流跑；**parallelism**：好幾個工作在**同一瞬間**一起跑，要有多個核心。單核心只能輪流，所以有 concurrency 沒有 parallelism。

</div>

<div data-qid="u1-bank-g4" markdown="1">

<div markdown="1">

**猜題 4.**（fork 的陷阱）下面印出什麼？

```c
printf("A");
fork();
printf("B\n");
```

</div>

??? quiz "看答案"
    ```text
    AB
    AB
    ```

    **A 印了兩次**。`printf("A")` 沒有換行，`A` 還留在**行程自己記憶體裡的輸出緩衝區**，沒有真的送到螢幕。fork 把整個記憶體（包含這個緩衝區）複製給子行程，兩個行程的緩衝區裡都有 `A`，之後各自接上 `B\n` 再印出。要只印一次 A，在 fork 前呼叫 `fflush(stdout)`。我實際執行過，輸出就是兩行 AB。

</div>

<div data-qid="u1-bank-g5" markdown="1">

<div markdown="1">

**猜題 5.** 假設每次 printf 都立刻印到螢幕。下面一共印出幾個 `x`？最後總共有幾個行程？

```c
for (int i = 0; i < 3; i++) {
    fork();
    printf("x\n");
}
```

</div>

??? quiz "看答案"
    **14 個 x、8 個行程**。

    | i | fork 之後有幾個行程 | 這一輪印幾個 x |
    |---|---|---|
    | 0 | 2 | 2 |
    | 1 | 4 | 4 |
    | 2 | 8 | 8 |

    每一輪所有行程都 fork 一次，行程數乘 2；每個行程都會印，所以是 $2+4+8=14$。（我實際執行過，加上 fflush 讓每次都立刻印出，剛好 14 行。）

</div>

<div data-qid="u1-bank-g6" markdown="1">

**猜題 6.**（message passing）(a) send 和 receive 都是 blocking 時，叫做什麼？(b) 傳訊息的 link 有哪三種緩衝容量？各在什麼時候讓送的一方等？

??? quiz "看答案"
    - **(a) rendezvous**：送的一方等到對方收到，收的一方等到有訊息，兩邊在同一刻「會合」。
    - **(b)**：
        - **zero capacity**：link 裡不能放任何訊息，送的一方**每次都要等**對方收走。
        - **bounded capacity**：最多放 n 個，**滿了**才要等。
        - **unbounded capacity**：可以放無限多個，送的一方**永遠不用等**。

    名詞對照：blocking ＝ synchronous（同步）、nonblocking ＝ asynchronous（非同步）。

</div>

<div data-qid="u1-bank-g7" markdown="1">

**猜題 7.** 一個有 4 個 thread 的 process，其中一個 thread 呼叫 `fork()`。子行程有幾個 thread？如果子行程 fork 完立刻呼叫 `exec()` 呢？

??? quiz "看答案"
    - **看系統**：有些 UNIX 系統提供兩種 fork，一種複製所有 thread，一種只複製呼叫 fork 的那個 thread。POSIX 的 `fork()` 只複製呼叫它的那個 thread，所以子行程只有 **1 個** thread。
    - **馬上 exec 的話**：exec 會把整個行程（包含所有 thread）換成新程式，複製其他 thread 是白做工，所以**只複製呼叫的那個 thread** 最適合。

</div>

<div data-qid="u1-bank-g8" markdown="1">

**猜題 8.**（thread cancellation）取消一個 thread 有哪兩種方式？哪一種比較安全？為什麼？

??? quiz "看答案"
    - **asynchronous cancellation**：一個 thread **立刻**終止目標 thread。
    - **deferred cancellation**：目標 thread **自己定期檢查**要不要結束（在 cancellation point 檢查），有機會先整理好再結束。

    **deferred 比較安全**：asynchronous 可能在目標 thread 改共用資料改到一半、或還拿著資源時把它砍掉，資料不一致、資源也沒有釋放。Pthreads 預設就是 deferred。

</div>

<div data-qid="u1-bank-g9" markdown="1">

**猜題 9.**（Little's formula）一個系統的 ready queue 平均每秒進來 5 個行程，每個行程平均在 queue 裡等 3 秒。queue 裡平均有幾個行程？

??? quiz "看答案"
    **Little's formula**：$n=\lambda\times W$。n 是 queue 裡平均的個數、λ 是平均每秒進來幾個、W 是平均等多久。

    $n=5\times3=$ **15** 個。直覺：每秒進來 5 個、每個待 3 秒，任何時刻 queue 裡大約有最近 3 秒進來的那 15 個。這個式子不管用哪種排程、行程怎麼到達都成立（系統穩定時）。

</div>

### 1.8 英文作答範例 {#u1-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** What is the difference between a program and a process? What does a process contain in memory?

（中文：程式和行程差在哪？行程在記憶體裡有哪些部分？）

</div>

??? quiz "看英文參考答案"
    A **program** is a **passive entity**, such as an executable file stored on disk. A **process** is **a program in execution**, an **active entity**. A program becomes a process when its executable file is loaded into memory.

    A process in memory contains:

    1. **Text section**: the executable code.
    2. **Data section**: global variables.
    3. **Heap**: memory that is dynamically allocated during run time.
    4. **Stack**: temporary data such as function parameters, return addresses and local variables.

    It also includes the current activity, represented by the **program counter** and the contents of the **registers**.

    寫法提示：關鍵句是 a program in execution，再對比 passive／active。四個區段的英文名稱要會寫（[1.0](#u1-0)）。

<div markdown="1">

**E-2.** Describe the actions taken by the kernel to context-switch between processes.

（中文：context switch 時 kernel 做了哪些事？）

</div>

??? quiz "看英文參考答案"
    1. An interrupt or a system call causes the kernel to take control.
    2. The kernel **saves the state** of the running process (program counter, CPU registers and memory-management information) **in its PCB**.
    3. The process is moved to the appropriate queue (the ready queue or a wait queue), and its state is updated.
    4. The CPU scheduler selects the next process.
    5. The kernel **restores the state** of the new process **from its PCB** and resumes it.

    Context-switch time is **overhead**, because the system does no useful work while switching.

    寫法提示：一定要寫到 save 和 restore、PCB、overhead 三個詞（[1.0](#u1-0)）。

<div markdown="1">

**E-3.** Under what circumstances does a process give up the CPU? Which queue is it placed in afterwards?

（中文：115 Q2a：process 什麼時候交出 CPU？之後放到哪個 queue？）

</div>

??? quiz "看英文參考答案"
    1. The process **issues an I/O request**; it is then placed in an **I/O wait queue**.
    2. The process **creates a child process and waits for its termination** (or waits for another event); it is placed in a **wait queue**.
    3. The process is **removed forcibly from the CPU**, because of an **interrupt** or because its **time slice expires**; it is put back in the **ready queue**.

    寫法提示：三種情況各配一個 queue，一個情況寫一點（[1.1](#u1-1)）。

<div markdown="1">

**E-4.** Explain processor affinity. Why is a warm cache important?

（中文：115 Q2b：什麼是 processor affinity？為什麼 warm cache 很重要？）

</div>

??? quiz "看英文參考答案"
    After a process runs on a processor, the data it accessed recently fills that processor's cache; we say the cache is **warm**. If the process **migrates** to another processor, the contents of the first cache must be **invalidated** and the second cache must be **repopulated**, which is expensive.

    Therefore most SMP systems try to **keep a process running on the same processor**. This is called **processor affinity**:

    - **Soft affinity**: the OS tries to keep the process on the same processor but does not guarantee it.
    - **Hard affinity**: the process can specify the set of processors on which it may run.

    寫法提示：因果順序寫清楚：cache 是熱的 → 換處理器要 invalidate、repopulate，代價大 → 所以盡量不換（[1.1](#u1-1)）。

<div markdown="1">

**E-5.** Compare the two fundamental models of interprocess communication.

（中文：114 Q6b：兩種 IPC 模型的比較。）

</div>

??? quiz "看英文參考答案"
    - **Shared memory**: the cooperating processes establish a **region of memory that they share** and exchange information by reading and writing it. It is **faster**, because system calls are needed only to set up the region; after that, no kernel assistance is required. However, the processes themselves must **synchronize** their accesses.
    - **Message passing**: the processes exchange **messages** through the kernel with **send()** and **receive()**. It is **easier to implement**, there are no conflicts to avoid, and it is well suited to **distributed systems**. However, it is **slower**, because every message requires a system call.

    寫法提示：兩種各寫「怎麼做」和「優點、缺點」，用 whereas 或 however 對比（[1.1](#u1-1)）。

<div markdown="1">

**E-6.** What are the benefits of multithreaded programming? What do threads of the same process share?

（中文：多執行緒有什麼好處？同一個 process 的 thread 共用哪些東西？）

</div>

??? quiz "看英文參考答案"
    Four benefits:

    1. **Responsiveness**: the program can keep running even if part of it is blocked or performing a lengthy operation.
    2. **Resource sharing**: threads share the memory and the resources of the process to which they belong.
    3. **Economy**: creating threads and switching between them is much cheaper than for processes.
    4. **Scalability**: threads can run **in parallel** on multiple processing cores.

    Threads of the same process **share** the code section, the data section and OS resources such as open files. Each thread has **its own** thread ID, program counter, register set and stack.

    寫法提示：四個好處的英文名稱是固定的，背 responsiveness、resource sharing、economy、scalability（[1.0](#u1-0)）。

<div markdown="1">

**E-7.** Distinguish between preemptive and nonpreemptive scheduling.

（中文：搶先式和非搶先式排程的差別。）

</div>

??? quiz "看英文參考答案"
    CPU-scheduling decisions take place when a process:

    1. switches from running to waiting (for example, an I/O request);
    2. switches from running to ready (for example, an interrupt);
    3. switches from waiting to ready (for example, I/O completion);
    4. terminates.

    Under **nonpreemptive** (cooperative) scheduling, scheduling happens **only in cases 1 and 4**: once a process gets the CPU, it keeps it until it **terminates or switches to the waiting state**. Under **preemptive** scheduling, the OS can also **take the CPU away** from a running process (cases 2 and 3), for example when a higher-priority process becomes ready. Preemptive scheduling gives better response time, but it can cause **race conditions** when processes share data.

    寫法提示：先列出四個排程時機，再說非搶先只在 1、4 發生，這是課本的寫法（[1.2](#u1-2)）。

### 單元 1 小考 {#u1-quiz}

**1-1.** 三個 process 在時間 0 依序到達，burst 6、3、1，FCFS 和 SJF 的平均等待時間？

??? quiz "看答案"
    **FCFS**（照到達順序 P1、P2、P3）：

    | | P1 | P2 | P3 |
    |---|---|---|---|
    | 時間 | 0–6 | 6–9 | 9–10 |
    | 等待 | 0 | 6 | 9 |

    平均 $\frac{0+6+9}{3}=$ **5**。

    **SJF**（P3、P2、P1）：時間 0–1、1–4、4–10，等待 0、1、4，平均 $\frac{0+1+4}{3}=\frac53\approx$ **1.67**。長的排前面時，後面每個人都要多等它。

**1-2.** PCB 的七個欄位？

??? quiz "看答案"
    process state、program counter、CPU registers、CPU-scheduling info、memory-management info、accounting info、I/O status info。

## 單元 2：同步 {#u2}

!!! key "一句話重點"
    多個 process 同時存取共享資料、結果又跟執行順序有關，就是 **race condition**。解法是讓**臨界區（critical section）**一次只有一個人進去。

### 2.0 觀念課：一行 `counter++` 其實是三步 {#u2-0}

#### race condition 怎麼發生

`counter++` 在機器上是三步：讀到暫存器、加 1、寫回記憶體。counter 一開始是 5，兩個 thread 各做一次 `counter++`，正確答案是 7。但如果交錯成這樣：

| 時間 | Thread 1 | Thread 2 | counter |
|---|---|---|---|
| 1 | 讀到 5 | | 5 |
| 2 | | 讀到 5 | 5 |
| 3 | 加 1 → 6，寫回 | | 6 |
| 4 | | 加 1 → 6，寫回 | 6 |

結果是 6，有一次加法不見了。**結果取決於交錯的順序**，這就是 race condition。

考古題考過這個填空（112 Q9e、114 Q8c）：several processes access and manipulate the same data concurrently, and the outcome depends on the particular order in which the access takes place → **race condition**。（我實際跑過：兩個 thread 各做一百萬次 `counter++`、不加 lock，結果只有 1048268，不是 2000000。）

<div data-qid="u2-0-race" markdown="1">

**觀念題 1.** x 一開始是 0。Thread 1 執行 `x = x + 1`，Thread 2 執行 `x = x * 2`，兩個都是「讀 x、算、寫回」三步，沒有 lock。最後 x 可能是哪些值？哪一個是 race condition 造成的？

??? quiz "看答案"
    可能是 **0、1、2**。

    - 1 先做完、2 再做：$(0+1)\times2=$ **2**。
    - 2 先做完、1 再做：$0\times2+1=$ **1**。
    - 兩個都先讀到 0：Thread 1 算出 1、Thread 2 算出 0，誰**最後寫回**就是誰的：1 或 **0**。

    0 不可能來自任何「一個做完再做另一個」的順序，是 Thread 1 的加法被蓋掉（lost update）。我用程式把所有交錯列出來，最後的值只有 0、1、2 三種。

</div>

#### critical section：一次只能一個人進去

存取共享資料的那段程式碼叫 **critical section**。像只有一把鑰匙的廁所：拿到鑰匙（lock）才能進去，出來再把鑰匙還回去。

好的解法要滿足三個條件：

1. **mutual exclusion**：一次最多一個人在裡面。
2. **progress**：沒人在裡面時，想進去的人不能一直被擋著。
3. **bounded waiting**：排隊的人等待的次數有上限，不會一直被插隊（不會餓死）。

三個條件各在防什麼：

| 條件 | 不滿足時會發生 | 例子 |
|---|---|---|
| mutual exclusion | 兩個人同時在裡面改資料 | 下面「先檢查再設定」的寫法 |
| progress | 裡面沒人，想進去的人卻進不去 | 觀念題 2 的「輪流」寫法 |
| bounded waiting | 某個人一直被別人插隊，永遠輪不到 | 單純用 test_and_set 搶 lock |

**progress 和 bounded waiting 最常搞混**：progress 看的是「**現在**沒人在裡面時，能不能在有限時間內決定讓誰進去」；bounded waiting 看的是「**我**提出要求之後，別人最多能插隊幾次」。

<div data-qid="u2-0-cond" markdown="1">

<div markdown="1">

**觀念題 2.** 兩個 process 共用一個變數 `turn`（一開始是 0），process i 這樣進 critical section（j 是另一個）。三個條件各滿足嗎？

```c
while (turn != i)
    ;          /* 不是我的回合就等 */
/* critical section */
turn = j;      /* 把回合交給對方 */
```

</div>

??? quiz "看答案"
    - **mutual exclusion：滿足**。turn 只能是 0 或 1，只有那一個能通過 while。
    - **progress：不滿足**。兩人一定要**輪流**進去：如果 j 根本不想進去，i 做完一次之後 turn ＝ j，i 想再進去就只能等 j，而 j 永遠不會來。裡面沒人，i 卻進不去。
    - **bounded waiting：滿足**。i 提出要求後，最多等 j 進去一次就輪到 i。

    這個寫法叫 strict alternation。Peterson 的做法就是在它上面加 `flag`，讓「對方不想進去」時可以直接進去，補上 progress。

</div>

#### 為什麼「先檢查 lock，再把它設成佔用」不行？

最直覺的寫法：

```c
while (lock == 1)
    ;          /* wait */
lock = 1;
/* critical section */
lock = 0;
```

「檢查」和「設定」是兩個動作，中間可以被切換：

| 時間 | Thread 1 | Thread 2 | lock |
|---|---|---|---|
| 1 | 檢查：lock 是 0，可以進 | | 0 |
| 2 | | 檢查：lock 還是 0，可以進 | 0 |
| 3 | lock ＝ 1，進去 | | 1 |
| 4 | | lock ＝ 1，也進去 | 1 |

兩個都在 critical section 裡，**違反 mutual exclusion**。問題出在「檢查」和「設定」之間有空檔。

#### Peterson's solution：兩個人互相禮讓

只用一般的讀寫，兩個 process（i 和 j）也能做到。共用兩個變數：`flag[i]` 表示「i 想進去」，`turn` 表示「輪到誰」。

```c
/* process i; the other is j */
flag[i] = true;
turn = j;
while (flag[j] && turn == j)
    ;          /* wait */
/* critical section */
flag[i] = false;
```

**白話**：我舉手說想進去，然後**把機會先讓給對方**（turn ＝ j）。只有在「對方也舉手、而且輪到對方」時我才等。

- **mutual exclusion**：兩個都舉手時，turn 只能是 i 或 j 其中一個（後寫的那個會蓋掉先寫的），所以只有一個人能通過 while。
- **progress**：對方沒舉手（flag[j] 是 false），我馬上就能進去。
- **bounded waiting**：對方出來會把 flag 放下；就算它馬上又想進去，也會先把 turn 讓給我，所以我最多等它一次。

（現代 CPU 會重排記憶體存取，實際上要配合 memory barrier 才保證正確；考試照課本的三個性質論證即可。）

#### 硬體怎麼幫忙：不可分割的指令

所以要把「檢查」和「設定」合成一步，中間不能被插隊。CPU 提供這種**不可分割（atomic）**的指令：執行到一半不會被中斷，多顆 CPU 同時做也會被硬體排成一個一個來。

```c
/* 硬體一次做完：回傳舊值，同時把 *target 設成 true */
bool test_and_set(bool *target) {
    bool rv = *target;
    *target = true;
    return rv;
}

/* 用它做 lock（lock 一開始是 false） */
while (test_and_set(&lock))
    ;          /* 舊值是 true：別人拿著 */
/* critical section */
lock = false;
```

- 讀到舊值 false → 你搶到 lock 了（它同時變成 true）。
- 讀到舊值 true → 別人已經拿走了，繼續等。

另一個常見的指令是 `compare_and_swap(&v, expected, new)`：v 等於 expected 時才改成 new，回傳 v 原本的值（寫法見[考古題變化題 1](#u2-exam)）。這兩種 lock 都滿足 mutual exclusion，但**不保證 bounded waiting**：lock 放開時誰先搶到看運氣，某個 process 可能一直搶輸。

<div class="mcq" data-ans="3" data-qid="u2-0-tas" markdown="1">

**觀念題 3.** lock 一開始是 false。T1 先呼叫 `test_and_set(&lock)`，接著 T2 也呼叫。兩次分別回傳什麼？誰進得去？

1. 都回傳 false，兩個都進去
2. T1 回傳 true、T2 回傳 false，T2 進去
3. T1 回傳 false、T2 回傳 true，T1 進去、T2 等
4. 都回傳 true，兩個都等

??? quiz "看解析"
    **C**。test_and_set 回傳的是**舊值**：T1 看到 false（沒人拿），同時把 lock 設成 true，進去；T2 看到的舊值已經是 true，只好在 while 裡繼續等，直到 T1 把 lock 設回 false。

</div>

#### semaphore：停車場的剩餘車位

semaphore 是一個整數，像停車場門口的「剩餘車位」看板，只能用兩個不可分割的操作改它：

```c
wait(S) {               /* 也叫 P() */
    S->value--;
    if (S->value < 0) { /* 沒車位 */
        add this process to S->list;
        sleep();        /* 排隊睡覺 */
    }
}
signal(S) {             /* 也叫 V() */
    S->value++;
    if (S->value <= 0) { /* 有人在排 */
        remove a process P from S->list;
        wakeup(P);      /* 叫醒一個 */
    }
}
```

- **值是正的**：還剩幾個車位，也就是還可以讓幾個人直接進去。
- **值是負的**：有幾個人在排隊，例如 −2 就是 2 個人在等。
- 初始值 1 的叫 **binary semaphore**，就是一把 lock（一次一台車）；初始值 $n$ 的叫 **counting semaphore**，可以管理 $n$ 份資源。
- 初始值 0 可以用來**排先後**：P2 先 `wait` 會被擋住，等 P1 做完某件事 `signal` 才放行。

<div data-qid="u2-0-sem" markdown="1">

**觀念題 4.** semaphore S 初始值 2。依序發生：P1 `wait(S)`、P2 `wait(S)`、P3 `wait(S)`、P1 `signal(S)`、P4 `wait(S)`。寫出每一步之後 S 的值，最後誰在 critical section 裡、誰在等？

??? quiz "看答案"
    | 動作 | S | 說明 |
    |---|---|---|
    | P1 wait | 1 | 進去 |
    | P2 wait | 0 | 進去 |
    | P3 wait | −1 | 沒位子，P3 排隊 |
    | P1 signal | 0 | P1 離開；值還 ≤ 0，表示有人在排隊，叫醒 P3，P3 進去 |
    | P4 wait | −1 | 沒位子，P4 排隊 |

    最後 **P2、P3 在裡面，P4 在等**，S ＝ −1（負 1 表示 1 個在排隊）。我用程式照上面的定義模擬過，每一步的值都一樣。

</div>

#### 生產者－消費者：三個 semaphore 各管什麼？

<figure class="fig">
<svg viewBox="0 0 360 170" role="img" aria-label="生產者把資料放進 5 格的 buffer，消費者從 buffer 拿走。現在 3 格有資料、2 格是空的，所以 full 是 3、empty 是 2；mutex 是 1，保證同時只有一個人在動 buffer。">
<rect class="fc" x="90" y="60" width="36" height="40"/>
<text x="108.0" y="80.0" text-anchor="middle" dominant-baseline="central" class="sm">資料</text>
<rect class="fc" x="126" y="60" width="36" height="40"/>
<text x="144.0" y="80.0" text-anchor="middle" dominant-baseline="central" class="sm">資料</text>
<rect class="fc" x="162" y="60" width="36" height="40"/>
<text x="180.0" y="80.0" text-anchor="middle" dominant-baseline="central" class="sm">資料</text>
<rect class="box" x="198" y="60" width="36" height="40"/>
<rect class="box" x="234" y="60" width="36" height="40"/>
<text x="180.0" y="46" text-anchor="middle" class="sm">buffer（5 格）</text>
<rect class="fb" x="6" y="62" width="64" height="36" rx="8"/>
<text x="38" y="80" text-anchor="middle" dominant-baseline="central">生產者</text>
<line class="arw" x1="70.0" y1="80.0" x2="79.0" y2="80.0"/>
<polygon class="ah" points="88.0,80.0 79.0,85.0 79.0,75.0"/>
<rect class="fa" x="290" y="62" width="64" height="36" rx="8"/>
<text x="322" y="80" text-anchor="middle" dominant-baseline="central">消費者</text>
<line class="arw" x1="272.0" y1="80.0" x2="279.0" y2="80.0"/>
<polygon class="ah" points="288.0,80.0 279.0,85.0 279.0,75.0"/>
<text x="144" y="128" text-anchor="middle" class="tc">full ＝ 3</text>
<text x="234" y="128" text-anchor="middle" class="sm">empty ＝ 2</text>
<text x="180" y="156" text-anchor="middle" class="sm">mutex ＝ 1：同時只有一個人在動 buffer</text>
</svg>
<figcaption>empty 數空格、full 數有資料的格子，mutex 讓兩邊不會同時改 buffer</figcaption>
</figure>

`empty`（空格數，初始 $n$）、`full`（有資料的格數，初始 0）、`mutex`（保護 buffer，初始 1）：

```c
/* producer */
wait(empty);
wait(mutex);
/*   put item into buffer */
signal(mutex);
signal(full);

/* consumer */
wait(full);
wait(mutex);
/*   take item from buffer */
signal(mutex);
signal(empty);
```

- buffer 滿了（empty ＝ 0）：生產者卡在 `wait(empty)`，等消費者拿走一個、`signal(empty)`。
- buffer 空了（full ＝ 0）：消費者卡在 `wait(full)`。

!!! trap "常考：wait 的順序不能反"
    生產者如果寫成先 `wait(mutex)` 再 `wait(empty)`：buffer 滿的時候，它**拿著 mutex** 卡在 `wait(empty)`；消費者要先拿 mutex 才能拿資料，也卡住，兩邊永遠等下去，就是**死結**（[單元 3](#u3)）。所以要先等「有沒有空間」，再拿 mutex。

<div data-qid="u2-0-pc" markdown="1">

**觀念題 5.** buffer 有 3 格，一開始是空的（empty ＝ 3、full ＝ 0、mutex ＝ 1）。生產者連續放了 3 個，接著想放第 4 個。(a) 第 4 次會卡在哪一行？(b) 消費者拿走一個（做完 `signal(empty)`），生產者被叫醒、放進第 4 個之後，empty、full 各是多少？

??? quiz "看答案"
    - **(a) 卡在 `wait(empty)`**：放完 3 個後 empty ＝ 0、full ＝ 3。第 4 次的 `wait(empty)` 把 empty 減成 −1（1 個在等），生產者睡覺。它還沒碰 mutex，所以消費者可以正常拿東西，不會死結。
    - **(b)**：消費者 `wait(full)` 讓 full 變 2，拿走一個後 `signal(empty)` 讓 empty 從 −1 回到 0、叫醒生產者；生產者放進第 4 個，再 `signal(full)` 讓 full 回到 3。最後 **empty ＝ 0、full ＝ 3**（buffer 又滿了）。

</div>

#### busy waiting 和 blocking 差在哪？

- **busy waiting（spinlock）**：一直跑迴圈檢查，等的時候還佔著 CPU。等很短時（多處理器、critical section 很短）反而好，因為不用 context switch。
- **blocking**：semaphore 的 `wait()` 拿不到時，把自己放進 semaphore 的等待佇列、讓出 CPU；`signal()` 時再被叫醒放回 ready queue。等很久時比較省 CPU。

<div class="mcq" data-ans="2" data-qid="u2-0-busy" markdown="1">

**觀念題 6.** 單核心 CPU 上，T1 拿著一個 spinlock，T2 也想要，開始 busy waiting。接下來會怎樣？

1. T2 很快就拿到 lock，因為 spinlock 不用 context switch
2. T2 會空轉到自己的時間片用完；這段時間 T1 根本沒在跑、放不了 lock，CPU 全浪費了
3. T1 會被 T2 強迫放開 lock
4. 會立刻發生死結

??? quiz "看解析"
    **B**。單核心同一時間只有一個 thread 在跑：T2 空轉時，T1 不在 CPU 上，不可能把 lock 放掉。所以單核心上 busy waiting 是純浪費，應該用會讓出 CPU 的 blocking 寫法；spinlock 只適合多核心、critical section 很短的情況。

</div>

#### readers–writers：讀可以一起，寫要獨佔

很多人讀同一份資料不會出事，但有人在寫的時候，誰都不能讀、也不能有第二個人寫。第一種解法（readers 優先），`rw_mutex`、`mutex` 初始 1，`read_count` 初始 0：

```c
/* writer */
wait(rw_mutex);
/*   寫 */
signal(rw_mutex);

/* reader */
wait(mutex);          /* 保護計數 */
read_count++;
if (read_count == 1)  /* 第一個 */
    wait(rw_mutex);   /* 擋 writer */
signal(mutex);
/*   讀 */
wait(mutex);
read_count--;
if (read_count == 0)  /* 最後一個 */
    signal(rw_mutex); /* 放 writer */
signal(mutex);
```

- reader 們共用一張「通行證」rw_mutex：第一個 reader 拿走，最後一個 reader 歸還，中間進來的 reader 不用再拿，所以可以一起讀。
- `mutex` 只是保護 `read_count` 這個計數，不然兩個 reader 同時 `read_count++` 又是 race condition。
- **缺點**：只要一直有 reader 進來，read_count 就不會變回 0，writer 永遠輪不到（starvation）。第二種解法（writers 優先）反過來：有 writer 在等時，新的 reader 不能進去，換成 reader 可能餓死。

<div data-qid="u2-0-rw" markdown="1">

**觀念題 7.** 用上面的 readers 優先解法。R1、R2 正在讀；writer W 來了；接著 R3 也來了。(a) W 和 R3 誰先進去？(b) 什麼時候 W 才進得去？(c) R3 進去之後 read_count 是多少？

??? quiz "看答案"
    - **(a) R3 先進去**：rw_mutex 已經被第一個 reader R1 拿走，W 卡在 `wait(rw_mutex)`；R3 只要把 read_count 加 1，不用拿 rw_mutex，直接進去讀。
    - **(b)**：要等 R1、R2、R3 **全部**讀完，最後一個離開的 reader 把 read_count 減到 0、`signal(rw_mutex)`，W 才進得去。
    - **(c)** read_count ＝ **3**。只要 reader 一直來，W 就一直等，這就是 writer 的 starvation。

</div>

!!! read "還不懂？看別人怎麼講"
    - **講義**：[周志遠講義下載頁](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999)的 Ch6 Process Synchronization。裡面的 producer／consumer 例子，counter 最後可能是 4、5 或 6（正確應該是 5），跟這節 `counter++` 的交錯是同一件事。
    - **影片**：[周志遠・作業系統播放清單](https://www.youtube.com/playlist?list=PLS0SUwlYe8cxj8FCPRoPHAehIiN9Vo6VZ)的 Process Synchronization 單元。

#### 換你試試

**T-1.** counter ＝ 0，兩個 thread 各做一次 `counter++`，沒有 lock，最後可能是多少？

??? quiz "看答案"
    **2**：一個 thread 做完三步，另一個才開始。

    **1**：兩個都先讀到 0，各自加 1 得 1，再先後寫回 1，其中一次加法被蓋掉（跟觀念課的表一樣）。

**T-2.** semaphore 初始值 3，有 5 個行程依序呼叫 `wait()`，幾個會被擋住？

??? quiz "看答案"
    每次 `wait()` 減 1：$3\to2\to1\to0\to-1\to-2$。前 3 個減完還 $\ge0$，直接進去；第 4、5 個減完是負的，要排隊 → **2 個**被擋住。負多少，就有幾個在排隊。

**T-3.** 為什麼在多處理器上，「關掉中斷」不能保護 critical section？

??? quiz "看答案"
    關中斷只影響自己這顆 CPU，其他 CPU 照樣可以同時執行同一段 critical section。

### 2.1 考古題觀念：一個一個講清楚 {#u2-1}

| 觀念 | 考過的題目 | 講解在哪 |
|---|---|---|
| race condition | 112 Q9e、114 Q8c 填空 | [2.0](#u2-0) 觀念題 1 |
| critical section 的三個條件 | 113 Q8b、115 Q1d 填空；105、107 問答 | [2.0](#u2-0) 觀念題 2 |
| 三種硬體支援 | 114 Q6a | 下面 |
| mutex、semaphore、condition variable | 112 Q5b | 下面 |
| priority inversion | 105、107 | [2.2](#u2-more) |
| Pthreads 的同步工具 | 104 Q8(1) | [2.2](#u2-more) |
| two-phase locking | 104 Q8(3) | [2.2](#u2-more) |

#### 三種硬體支援（114 Q6a）

**hardware instructions**（test_and_set、compare_and_swap）在 [2.0](#u2-0) 講過了。另外兩種：

- **memory barrier 為什麼需要**：現代 CPU 和編譯器為了快，可能把彼此無關的讀寫**換順序**執行。例如 thread 1 寫 `x = 100; flag = true;`，thread 2 等到 `flag` 是 true 才讀 x。如果 thread 1 的兩個寫入被換了順序，thread 2 可能看到 flag 是 true、x 卻還是舊值。在兩個寫入中間放一個 memory barrier，就保證 x 先寫好、而且別的處理器看得到，才寫 flag。
- **atomic variable**：例如 `increment(&count)` 由硬體（通常用 compare_and_swap 重試）保證一次做完，很多 thread 同時加也不會掉數。但它只保護「這一個變數的這一個動作」，好幾個變數要一起改時，還是要用 lock。

!!! example "114 Q6a（6%）：解決 critical-section 問題的三種硬體支援"
    1. **memory barriers（memory fences）**：強制之前的記憶體操作都完成、讓其他處理器看得到，才往下執行。
    2. **hardware instructions**：`test_and_set()`、`compare_and_swap()` 這類**不可分割（atomic）**的指令，可以用來實作 lock。
    3. **atomic variables**：對整數、布林值提供不可分割的更新操作（例如 atomic increment）。

<div class="mcq" data-ans="1" data-qid="u2-1-hw" markdown="1">

**觀念題 8.** memory barrier（memory fence）的作用是什麼？

1. 保證它之前的記憶體讀寫都做完、其他處理器也看得到，才執行它之後的讀寫
2. 讓下一條指令變成不可分割
3. 關掉這顆 CPU 的中斷
4. 把整塊記憶體鎖住，不讓別的處理器存取

??? quiz "看解析"
    **A**。它解決的是「CPU 或編譯器把讀寫換順序」造成的問題（例如上面先寫了 flag 才寫 x）。B 是 test_and_set、compare_and_swap 這類指令做的事；C 只對單核心有用；D 不是 memory barrier。

</div>

#### mutex、semaphore、condition variable（112 Q5b）

- **mutex lock**：只有兩個狀態（可用、被拿走）。`acquire()` 拿、`release()` 放，**誰拿的誰放**。用來保護 critical section。
- **semaphore**：一個整數（[2.0](#u2-0)），`wait()` 減 1、`signal()` 加 1。初始 1 當 lock 用；初始 n 管理 n 份資源；初始 0 用來排先後。跟 mutex 不同，**signal 可以由別的 process 做**。
- **condition variable**：讓 thread 等「某個條件成立」，例如「buffer 不是空的」。它沒有計數，只有一個等待佇列：
    - `x.wait()`：把自己掛在 x 的佇列上睡覺（同時放開保護共享資料的 lock）。
    - `x.signal()`：叫醒 x 佇列上的一個；**佇列是空的時候什麼都不會發生**，signal 不會被「記住」，這是它跟 semaphore 最大的差別。（我實際跑過：沒人在等時先 signal，之後才來等的 thread 等不到，一直到逾時。）
- **monitor**：condition variable 原本的家。monitor 是一種程式結構，把共享資料和操作它的函式包在一起，**同一時間只有一個 process 能在 monitor 裡執行**，所以裡面的程式自動互斥；要等條件時才用 condition variable。

!!! example "112 Q5b（3%）：mutex、semaphore、condition variable 的用途"
    - **mutex lock**：保護 critical section，`acquire()` 進去、`release()` 出來，一次只有一個人持有。
    - **semaphore**：一個整數計數器，`wait()` 減 1（不夠就等）、`signal()` 加 1。binary semaphore 可當 lock 用；counting semaphore 可以管理 $n$ 份資源或用來做先後順序。
    - **condition variable**：在 monitor（或搭配 mutex）中，讓 thread 等待某個**條件**成立（`wait()`），條件改變時由別人 `signal()` 叫醒。

<div class="mcq" data-ans="3" data-qid="u2-1-cv" markdown="1">

**觀念題 9.** 沒有任何 thread 在等的時候，T1 呼叫 condition variable x 的 `x.signal()`，之後 T2 才呼叫 `x.wait()`。T2 會怎樣？如果換成 semaphore（初始 0，先 `signal` 再 `wait`）呢？

1. 兩種都會直接通過
2. 兩種都會卡住
3. condition variable：T2 會卡住（先前的 signal 沒被記住）；semaphore：T2 直接通過（值已經是 1）
4. condition variable：T2 直接通過；semaphore：T2 會卡住

??? quiz "看解析"
    **C**。condition variable 沒有計數，沒人在等時的 signal 等於沒做；semaphore 的 signal 會把值加 1 存起來，之後的 wait 減成 0 就直接通過。所以用 condition variable 一定要搭配一個「條件」判斷要不要等，例如 `while (count == 0) x.wait();`，不能只靠 signal 的次數。

</div>

### 2.2 同步的考古題補充：priority inversion、thread 的同步工具、two-phase locking {#u2-more}

104、105、107 年考過的同步觀念題。

#### priority inversion：低優先權的擋住高優先權的

三個 process，優先權 L ＜ M ＜ H：

1. L 拿到一把 lock R。
2. H 也要 R，只好等 L 放開。
3. M 不需要 R，但優先權比 L 高，把 L 搶走（preempt）。
4. L 跑不了、放不開 R，H 就一直等。**H 實際上被優先權比它低的 M 擋住了。**

1997 年火星探測車 Mars Pathfinder 就因為這個問題一直重開機。

**解法：priority inheritance（優先權繼承）**：L 持有 H 在等的資源時，**暫時繼承 H 的優先權**，M 就搶不走 L；L 放開 R 之後恢復原本的優先權，H 馬上拿到 R。另一種解法是 priority ceiling：拿到某個 lock 的人，優先權直接提高到「所有可能用這個 lock 的人裡最高的」。

!!! example "105 Q1(1)（4%）、107 Q1(5)（2%）：什麼是 priority inversion？什麼時候發生？怎麼解決？"
    高優先權的 process 在等一個被低優先權 process 持有的資源，而低優先權的又被中優先權的搶走 CPU，結果高優先權的被中優先權的擋住。發生的條件：有共享資源（lock）、搶先式的優先權排程、三個以上不同優先權的 process。解法是 priority inheritance：持有資源的低優先權 process 暫時繼承等待者的高優先權，用完資源再恢復。

<div class="mcq" data-ans="3" data-qid="u2-more-pi" markdown="1">

**觀念題 10.** 只有兩個 process：高優先權 H 和低優先權 L。L 拿著 lock，H 在等這把 lock。這是不是課本說的 priority inversion？

1. 是，因為高的在等低的
2. 是，而且一定要用 priority inheritance 解決
3. 還不是：H 等 L 用完 lock 是正常的互斥；要有中優先權的 M 把 L 搶走，H 才會被跟它無關的 M 拖住
4. 不是，因為 H 可以直接搶走 lock

??? quiz "看解析"
    **C**。H 等 L 放開 lock 只是正常的互斥，等的時間就是 L 的 critical section。priority inversion 的關鍵是第三個角色 M：M 不需要那把 lock，卻因為優先權比 L 高而一直佔著 CPU，讓 L 放不了 lock，H 被迫等 M。所以答題一定要寫出三個角色。

</div>

!!! example "105 Q1(3)（3%）、107 Q1(3)（3%）：critical-section 問題的解法要滿足哪三個條件？"
    mutual exclusion、progress、bounded waiting，意思見 [2.0](#u2-0)。

!!! example "104 Q8(1)（6%）：UNIX 裡 thread 存取共享資料的三種同步機制"
    POSIX threads（Pthreads）提供：

    1. **mutex lock**：`pthread_mutex_lock()`、`pthread_mutex_unlock()`，一次只有一個 thread 能進 critical section。
    2. **semaphore**：`sem_wait()`、`sem_post()`，計數器，可以管理 n 份資源或控制先後順序。
    3. **condition variable**：`pthread_cond_wait()`、`pthread_cond_signal()`，搭配 mutex 使用，讓 thread 等某個條件成立（例如 buffer 不空）。

    （也可以提 read-write lock：可以很多人同時讀，但寫的時候只能一個人。）

<div data-qid="u2-more-cond" markdown="1">

**觀念題 11.** `pthread_cond_wait(&cond, &mutex)` 為什麼一定要把 mutex 一起傳進去？呼叫前、等待中、返回後，mutex 各是什麼狀態？

??? quiz "看答案"
    - **呼叫前**：thread 已經拿著 mutex（它剛檢查完共享的條件，例如發現 buffer 是空的）。
    - **等待中**：pthread_cond_wait 會**不可分割地「放開 mutex、開始睡」**，別的 thread 才拿得到 mutex 去改條件（例如放東西進 buffer）。如果睡覺時還拿著 mutex，別人永遠改不了條件，就卡死了。
    - **返回後**：被 signal 叫醒時，它會**先重新拿回 mutex** 才返回，所以接著檢查條件、改共享資料都是安全的。
    - 被叫醒時條件可能又不成立了，所以標準寫法用 while 再檢查一次：`while (count == 0) pthread_cond_wait(&cond, &mutex);`

</div>

#### 交易（transaction）與 two-phase locking

**atomic transaction**：一連串的讀寫要嘛**全部完成**（commit），要嘛**全部取消**（abort、rollback），不會只做一半。例：轉帳時「A 扣錢」和「B 加錢」一定要一起成功。

好幾個交易同時跑時，結果要跟「某種一個接一個做」的結果一樣（serializable）。**two-phase locking（2PL）**：

1. **growing phase**：只能拿 lock，不能放。
2. **shrinking phase**：一旦放了第一把 lock，之後只能放、不能再拿。

遵守 2PL 的排程一定是 **conflict serializable**。缺點：還是可能死結。另一種做法是 [6.1](#u6-1) 的 timestamp-ordering（113 Q7），依 timestamp 決定順序，不用 lock、不會死結，但可能常常 rollback。

!!! example "104 Q8(3)（5%）：two-phase locking 怎麼保證非序列排程的正確性？"
    每個交易分兩個階段：先只拿 lock（growing），開始放 lock 之後就不能再拿（shrinking）。所有交易都這樣做，衝突的操作順序就會依照每個交易「拿到最後一把 lock」的時間（lock point）排好，所以結果等於依 lock point 順序一個一個執行，是 conflict serializable。

<div data-qid="u2-more-2pl" markdown="1">

**觀念題 12.** 交易 T：`lock(A) lock(B) read(A) unlock(A) write(B) unlock(B)`。它遵守 two-phase locking 嗎？growing phase 和 shrinking phase 各是哪幾步？lock point 在哪？

??? quiz "看答案"
    **遵守**：所有的 lock 都在第一個 unlock 之前。

    - **growing phase**：`lock(A)`、`lock(B)`。
    - **shrinking phase**：從 `unlock(A)` 開始，之後只放不拿（`unlock(B)`）。
    - **lock point**：拿到最後一把 lock 的那一刻，也就是 `lock(B)` 之後。所有交易照 lock point 的先後排，就是等價的序列順序。

    中間的 read、write 放在哪一段都可以，規則只限制 lock 和 unlock 的先後。

</div>

### 2.3 練習：簡單觀念題 {#u2-concept}

一兩句話就能回答的題目，確認名詞和觀念有沒有記對。題目照主題分組；選擇題按下選項就會對答案，問答題先寫在手寫板或紙上，再打開參考答案。

#### race condition 和 critical section

<div class="mcq" data-ans="2" data-qid="u2-bank-s1" markdown="1">

**簡單 1.** 下面哪一個最符合 race condition 的定義？

1. 兩個 process 互相等對方手上的資源
2. 多個 process 同時存取共享資料，結果取決於執行的先後順序
3. 低優先權的 process 一直輪不到 CPU
4. 高優先權的 process 被中優先權的擋住

??? quiz "看解析"
    **B**。A 是死結（[單元 3](#u3)），C 是 starvation，D 是 priority inversion。這四個名詞常放在一起考，要分清楚。

</div>

<div class="mcq" data-qid="u2-concept-1" data-ans="2" markdown="1">

**簡單 2.** 用 `while (lock == 1); lock = 1;` 當作進入 critical section 的方法，會出什麼問題？

1. 一定會死結
2. 兩個 thread 可能同時通過檢查，一起進去，違反 mutual exclusion
3. 沒有問題
4. 只會違反 bounded waiting

??? quiz "看解析"
    **B**。「檢查」和「設定」中間可以被切換：兩個 thread 都看到 lock 是 0，然後都把它設成 1、都進去。要用 `test_and_set` 這種不可分割的指令，或 Peterson's solution。

</div>

<div class="mcq" data-ans="4" data-qid="u2-bank-s2" markdown="1">

**簡單 3.** 「一個 process 提出要進 critical section 的要求之後，別人插隊進去的次數有上限」是哪一個條件？

1. mutual exclusion
2. progress
3. 不會死結
4. bounded waiting

??? quiz "看解析"
    **D**。progress 管的是「沒人在裡面時，要能在有限時間內決定誰進去」；bounded waiting 管的是「我在等的時候，別人最多插隊幾次」。

</div>

<div class="mcq" data-qid="u2-concept-4" data-ans="4" markdown="1">

**簡單 4.** Peterson's solution 裡，`turn = j` 這一行的作用是？

1. 宣告自己要進 critical section
2. 讓 j 不能再進來
3. 把 flag[j] 設成 false
4. 把優先權讓給對方：兩個都想進去時，後寫 turn 的那個要等

??? quiz "看解析"
    **D**。A 是 `flag[i] = true` 的作用。兩個人都舉手時，turn 最後的值只會是其中一個，所以只有一個能進去（mutual exclusion）。

</div>

#### lock、硬體與 semaphore

<div class="mcq" data-qid="u2-concept-5" data-ans="2" markdown="1">

**簡單 5.** 什麼情況下 spinlock（busy waiting）比會讓出 CPU 的 semaphore 好？

1. 單處理器、等很久的時候
2. 多處理器、critical section 很短的時候
3. 等 I/O 的時候
4. 永遠比較好

??? quiz "看解析"
    **B**。等的時間比 context switch 還短，空轉一下反而比較快。單處理器上 spin 沒有意義：持有 lock 的人根本沒機會跑。

</div>

<div class="mcq" data-ans="3" data-qid="u2-bank-s3" markdown="1">

**簡單 6.** 初始值是 1、值只會是 0 或 1 的 semaphore 叫什麼？通常拿來做什麼？

1. counting semaphore，管理很多份資源
2. condition variable，等條件成立
3. binary semaphore，當作 mutex lock 保護 critical section
4. spinlock，用 busy waiting 等待

??? quiz "看解析"
    **C**。初始 1：第一個 wait 減成 0 進去，第二個 wait 就要等，一次只放一個人，效果跟 mutex lock 一樣。

</div>

<div class="mcq" data-ans="2" data-qid="u2-bank-s4" markdown="1">

**簡單 7.** 用「會排隊」的寫法實作 semaphore（[2.0](#u2-0)），S 現在的值是 −3，代表什麼？

1. 還有 3 份資源可用
2. 有 3 個 process 在 S 的等待佇列裡
3. 出錯了，semaphore 不會是負的
4. 有 3 個 process 在 critical section 裡

??? quiz "看解析"
    **B**。每個拿不到的 wait 都先減 1 再去排隊，所以負多少就有幾個在等。C 只有在「用 busy waiting、值不會減到負的」那種定義下才對。

</div>

<div class="mcq" data-qid="u2-concept-2" data-ans="1" markdown="1">

**簡單 8.** 要保證 P1 的敘述 S1 一定在 P2 的敘述 S2 之前執行，用一個 semaphore `synch`，初始值和寫法是？

1. 初始 0；P1：`S1; signal(synch);`，P2：`wait(synch); S2;`
2. 初始 1；P1：`S1; signal(synch);`，P2：`wait(synch); S2;`
3. 初始 0；P1：`wait(synch); S1;`，P2：`S2; signal(synch);`
4. 初始 1；P1：`wait(synch); S1;`，P2：`signal(synch); S2;`

??? quiz "看解析"
    **A**。初始 0：P2 先跑到 `wait` 會被擋住，直到 P1 做完 S1、`signal` 之後才能做 S2。B 初始 1 的話，P2 一開始就能直接通過，S2 可能比 S1 早。

</div>

<div class="mcq" data-qid="u2-concept-3" data-ans="3" markdown="1">

**簡單 9.** 生產者寫成「先 `wait(mutex)`，再 `wait(empty)`」，什麼時候會出事？

1. buffer 空的時候
2. 只有一個生產者的時候
3. buffer 滿的時候：生產者拿著 mutex 等空格，消費者拿不到 mutex，兩邊都卡住
4. 不會出事，順序無所謂

??? quiz "看解析"
    **C**。這是死結：生產者握著 mutex 等 empty，消費者要 mutex 才能拿資料、`signal(empty)`。正確順序是先等資源（empty），再拿 mutex。

</div>

<div data-qid="u2-concept-6" markdown="1">

**簡單 10.** 生產者－消費者為什麼需要三個 semaphore？各自的初始值和用途？

??? quiz "看參考答案"
    | semaphore | 初始值 | 用途 |
    |---|---|---|
    | empty | $n$（buffer 大小） | 數空格；生產者放之前 `wait(empty)`，滿了就等 |
    | full | 0 | 數有資料的格子；消費者拿之前 `wait(full)`，空了就等 |
    | mutex | 1 | 保證同時只有一個人在改 buffer（mutual exclusion） |

    empty、full 負責「先後條件」（有空間才放、有資料才拿），mutex 負責「互斥」，兩種工作要分開。

</div>

<div class="mcq" data-ans="1" data-qid="u2-bank-s5" markdown="1">

**簡單 11.** monitor 裡同一時間最多幾個 process 在執行 monitor 的函式？

1. 1 個
2. 2 個
3. 看有幾個 condition variable
4. 沒有限制

??? quiz "看解析"
    **A**。monitor 自動保證互斥：一個 process 在裡面執行時，其他想呼叫 monitor 函式的都要在外面排隊。在 condition variable 上 wait 的 process 是暫停的，不算在執行，它會先讓出 monitor。

</div>

#### priority inversion 和交易

<div class="mcq" data-qid="u2-more-1" data-ans="2" markdown="1">

**簡單 12.** 下面哪一個情況是 priority inversion？

1. 高優先權的 process 一直搶走低優先權的 CPU
2. 高優先權的 process 在等低優先權持有的 lock，低優先權的又被中優先權的搶走
3. 兩個 process 互相等對方的資源
4. 優先權最低的 process 一直排不到 CPU

??? quiz "看解析"
    **B**。A 是正常的優先權排程；C 是死結；D 是 starvation（可以用 aging 解決）。

</div>

<div class="mcq" data-qid="u2-more-2" data-ans="3" markdown="1">

**簡單 13.** priority inheritance 怎麼解決 priority inversion？

1. 把高優先權 process 的優先權降低
2. 不讓中優先權的 process 執行
3. 持有 lock 的低優先權 process 暫時繼承等待者的高優先權
4. 讓 lock 可以被搶走

??? quiz "看解析"
    **C**。L 繼承 H 的優先權後，M 就搶不走 L；L 很快用完 lock 放開，H 馬上拿到。放開後 L 恢復原本的優先權。

</div>

<div class="mcq" data-ans="3" data-qid="u2-bank-s6" markdown="1">

**簡單 14.** 下面哪一個情況**不會**發生 priority inversion？

1. 搶先式優先權排程，高、中、低三個 process，高和低共用一把 lock
2. 即時系統裡，高優先權的工作在等低優先權的放開資源時，中優先權的工作一直在跑
3. 所有 process 的優先權都一樣，用 FCFS 排程
4. 低優先權的 process 拿著 lock 時，被中優先權的搶走 CPU

??? quiz "看解析"
    **C**。沒有優先權高低，就談不上「高的被低的擋住」；FCFS 也不會搶走正在跑的 process。priority inversion 需要：共享資源、搶先式的優先權排程、三個以上不同的優先權。

</div>

<div class="mcq" data-qid="u2-more-3" data-ans="1" markdown="1">

**簡單 15.** 遵守 two-phase locking 的交易，下面哪一個做法是**不允許**的？

1. 放開 lock A 之後，再拿 lock B
2. 先拿 lock A、再拿 lock B，最後一起放
3. 拿 A、拿 B、放 A、放 B
4. 只拿一把 lock

??? quiz "看解析"
    **A**。一旦開始放 lock（進入 shrinking phase），就不能再拿新的。

</div>

### 2.4 練習：基礎題 {#u2-drill}

要動手追執行順序、算 semaphore 的值，但每題只用到一個觀念。先自己寫，再打開對答案；答案都用程式模擬或驗算過。

#### 交錯與 semaphore 追蹤

**做法**：把每個 thread 拆成「讀、算、寫回」或一行一行的 wait／signal，列出時間順序，每一步寫下共享變數和 semaphore 的值（semaphore 的定義見 [2.0](#u2-0)）。

<div data-qid="u2-bank-b1" markdown="1">

**基礎 1.** x 初始 10。T1 執行 `x = x + 3`，T2 執行 `x = x - 1`，兩個都是讀、算、寫回三步，沒有 lock。列出所有可能的最後值，哪些是 race condition 造成的？

??? quiz "看答案"
    可能是 **12、13、9**。

    - 一個做完再做另一個（不管誰先）：$10+3-1=$ **12**，這是正確答案。
    - 兩個都先讀到 10：T1 算出 13、T2 算出 9，誰最後寫回就是誰的：**13**（T2 的減法不見了）或 **9**（T1 的加法不見了）。

    13 和 9 都是 race condition 造成的。我用程式把所有交錯列出來，只有這三種結果。

</div>

<div data-qid="u2-bank-b4" markdown="1">

**基礎 2.** 生產者－消費者，buffer 2 格（empty ＝ 2、full ＝ 0）。依序：生產者放、生產者放、消費者拿、生產者放、生產者放。寫出每一步之後 empty、full 的值，哪一步會卡住？

??? quiz "看答案"
    | 動作 | empty | full | 說明 |
    |---|---|---|---|
    | 生產者放 | 1 | 1 | |
    | 生產者放 | 0 | 2 | buffer 滿了 |
    | 消費者拿 | 1 | 1 | 空出一格 |
    | 生產者放 | 0 | 2 | 又滿了 |
    | 生產者放 | −1 | 2 | 卡在 `wait(empty)`，等消費者再拿走一個 |

    最後一步 empty 變成 −1，表示有 1 個生產者在排隊。我用程式照 [2.0](#u2-0) 的 semaphore 定義模擬過，每一步的值都一樣。

</div>

<div data-qid="u2-bank-b2" markdown="1">

**基礎 3.** P1、P2、P3 各有一行敘述 S1、S2、S3，三個 process 同時開始。用 semaphore 保證執行順序一定是 S1 → S2 → S3。要幾個 semaphore？初始值多少？每個 process 怎麼寫？

??? quiz "看答案"
    **2 個**，a、b 初始都是 **0**：

    ```c
    /* P1 */  S1; signal(a);
    /* P2 */  wait(a); S2; signal(b);
    /* P3 */  wait(b); S3;
    ```

    - 初始 0，所以 P2 一開始就卡在 `wait(a)`，要等 P1 做完 S1、`signal(a)`。
    - P3 卡在 `wait(b)`，要等 P2 做完 S2、`signal(b)`。
    - 每一個「誰要等誰」就用一個初始 0 的 semaphore：等的人 wait，被等的人做完 signal。

</div>

<div data-qid="u2-bank-b3" markdown="1">

<div markdown="1">

**基礎 4.** semaphore S、Q 初始都是 1。找一個執行順序讓 P0、P1 永遠卡住，再說明怎麼改。

```c
/* P0 */          /* P1 */
wait(S);          wait(Q);
wait(Q);          wait(S);
/* ... */         /* ... */
signal(S);        signal(Q);
signal(Q);        signal(S);
```

</div>

??? quiz "看答案"
    - **會卡住的順序**：P0 `wait(S)`（S ＝ 0）→ P1 `wait(Q)`（Q ＝ 0）→ P0 `wait(Q)`：Q 已經被 P1 拿走，P0 等 → P1 `wait(S)`：S 在 P0 手上，P1 也等。兩個都在等對方手上的那一個，誰也不會 signal，這就是**死結**（[單元 3](#u3)）。
    - **怎麼改**：兩邊都照**同樣的順序**拿（都先 S 再 Q）。先拿到 S 的人一定也拿得到 Q，另一個在 `wait(S)` 就被擋住，不會出現「各拿一個、互相等」。

</div>

#### 經典問題與演算法追蹤

<div data-qid="u2-bank-b5" markdown="1">

**基礎 5.** readers 優先的 readers–writers（[2.0](#u2-0)）。R1 在時間 0 開始讀，要讀 4；writer W 在時間 1 來，要寫 2；R2 在時間 2 來，要讀 4。(a) W 什麼時候開始寫？(b) 如果 R3 在時間 5 又來，要讀 4，W 什麼時候開始寫？

??? quiz "看答案"
    - **(a) 時間 6**：R1 讀 0–4。W 在 1 來時 R1 還在讀，W 卡在 `wait(rw_mutex)`。R2 在 2 來，read_count 從 1 變 2，直接進去讀 2–6。R1 在 4 離開時 read_count 還有 1，不會放開 rw_mutex；R2 在 6 離開，read_count 變 0，W 才開始寫 6–8。
    - **(b) 時間 9**：R3 在 5 來時 R2 還在讀，R3 直接進去讀 5–9；read_count 要到 9 才歸零，W 寫 9–11。

    W 比 R2、R3 都早來，卻一直被後來的 reader 插隊，這就是 writer 的 starvation。

</div>

<div data-qid="u2-bank-b6" markdown="1">

**基礎 6.** Peterson's solution（[2.0](#u2-0)）。P0、P1 幾乎同時想進去：P0 先執行 `flag[0] = true; turn = 1;`，接著 P1 執行 `flag[1] = true; turn = 0;`。誰先進 critical section？為什麼？

??? quiz "看答案"
    **P0 先進去**。最後 turn ＝ 0（P1 後寫的）。

    - P0 的 while 條件是 `flag[1] && turn == 1`：turn 是 0，條件不成立，P0 通過。
    - P1 的 while 條件是 `flag[0] && turn == 0`：兩個都成立，P1 等。

    規律：兩個都舉手時，**最後寫 turn 的那一個要等**，因為它把機會讓給了對方。

</div>

<div data-qid="u2-concept-7" markdown="1">

**基礎 7.** 用 Peterson's solution 的程式碼說明：為什麼兩個 process 不可能同時在 critical section 裡？

??? quiz "看參考答案"
    假設 i 和 j 都在 critical section 裡，那它們都通過了 while，而且 flag[i]、flag[j] 都是 true。

    - i 通過 while，表示當時 `turn == i`（因為 flag[j] 是 true）。
    - j 通過 while，表示當時 `turn == j`。

    turn 只有一個值，兩個人最後都寫了 turn（i 寫 j、j 寫 i），**後寫的那個**把 turn 設成對方，自己就會卡在 while。所以不可能兩個都通過，矛盾。∎

</div>

### 2.5 練習：考古題變化題 {#u2-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

<div data-qid="u2-exam-1" markdown="1">

**考古變化 1.**（改自 114 Q6a・延伸）用 `compare_and_swap()` 寫一個 lock。這樣的 lock 滿足 bounded waiting 嗎？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要列出三種硬體支援；這題要真的用其中一種寫出來，再檢查三個條件。
    - **定義**：`compare_and_swap(&v, expected, new)` 不可分割地做：如果 `v == expected` 就把 v 設成 new；不管有沒有設，都回傳 v 原本的值。
    - **寫法**（lock 一開始是 0）：
        ```c
        while (compare_and_swap(&lock, 0, 1) != 0)
            ;              /* 有人拿著，一直重試 */
        /* critical section */
        lock = 0;
        ```
    - **mutual exclusion 成立**：只有看到 lock 是 0、並成功把它改成 1 的那一個能進去，其他人回傳值都是 1。
    - **bounded waiting 不成立**：放開 lock 之後，誰搶到全看運氣，某個 process 可能一直搶輸。要滿足 bounded waiting，要再加一個 `waiting[]` 陣列：離開時依序找下一個在等的人，直接把進入權交給他。

</div>

<div data-qid="u2-exam-2" markdown="1">

**考古變化 2.**（改自 112 Q5b・應用）下面三種情況，各用 mutex、counting semaphore、condition variable 哪一個最自然？(a) 很多 thread 會遞增同一個計數器 (b) 伺服器最多同時服務 5 個連線 (c) 消費者要等到 buffer 裡有東西才繼續

??? quiz "看完整解答"
    - **跟原題差在哪**：原題問三個工具的用途；這題反過來，給情境要選工具。
    - **(a) mutex**：只是保護一小段 critical section，一次一個人。
    - **(b) counting semaphore**：初值 5，每個連線進來 `wait()`、結束 `signal()`，第 6 個會被擋住。
    - **(c) condition variable**（搭配保護 buffer 的 mutex）：buffer 空的時候 `wait()`，生產者放東西後 `signal()` 叫醒它。也可以用一個計數「有幾個項目」的 semaphore。

</div>

<div data-qid="u2-exam-3" markdown="1">

**考古變化 3.**（改自 105 Q1(1)、107 Q1(5)・實際算）搶先式的優先權排程，H ＞ M ＞ L。L 在時間 0 開始，一開始就拿到一個 lock，要在 critical section 裡跑 3 個單位才會放掉（之後就結束）。H 在時間 1 到達，一開始就要那個 lock，拿到後跑 2 個單位。M 在時間 2 到達，不需要 lock，跑 5 個單位。(1) 沒有 priority inheritance 時，H 在什麼時候做完？(2) 有 priority inheritance 時呢？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說明 priority inversion；這題用時間軸把「H 被 M 擋住」算出來。
    - **(1) 沒有 inheritance**（每格 1 個單位）：
        - 0–1 L；1 時 H 到，搶走 CPU，但拿不到 lock，被擋住，L 繼續跑 1–2。
        - 2 時 M 到，M 比 L 優先，**M 一路跑 2–7**。
        - 7–8 L 跑完 critical section、放掉 lock；H 才拿到 lock，跑 8–10。
        - 時間軸 `L L M M M M M L H H`，**H 在 10 做完**。H 的優先權最高，卻等了完全不相干的 M 5 個單位，這就是 priority inversion。
    - **(2) 有 inheritance**：H 在 1 被擋住時，L 暫時繼承 H 的優先權。
        - 2 時 M 到，但 L 現在的優先權比 M 高，L 繼續跑到 3，放掉 lock，優先權恢復。
        - H 拿到 lock，跑 3–5；M 跑 5–10。
        - 時間軸 `L L L H H M M M M M`，**H 在 5 做完**。

    我寫了一個逐格模擬的排程程式，兩種情況的時間軸都跟上面一樣。

</div>

<div data-qid="u2-exam-4" markdown="1">

<div markdown="1">

**考古變化 4.**（改自 105 Q1(3)、107 Q1(3)・判斷）兩個 process（$i$ 和 $j$）用下面的方法進 critical section，`flag` 一開始都是 false。它滿足 mutual exclusion、progress、bounded waiting 哪幾個？

```c
flag[i] = true;
while (flag[j])
    ;               /* 等對方 */
/* critical section */
flag[i] = false;
```

</div>

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只問三個條件的名字；這題給一個「看起來對」的寫法，要用三個條件去檢查它。
    - **mutual exclusion：滿足**。要進去，必須先把自己的 flag 設成 true、而且看到對方是 false。兩個同時在裡面，代表兩人都看到對方是 false，但兩人進去前都已經把自己設成 true 了，矛盾。
    - **progress：不滿足**。兩人幾乎同時執行第一行，都把 flag 設成 true，接著都卡在 while 迴圈，誰也進不去，而且永遠出不來（deadlock）。
    - **bounded waiting**：既然可能兩個人都永遠進不去，也談不上「等有限次就輪到」。
    - **怎麼修**：Peterson 的做法再加一個 `turn` 變數，兩人都想進時讓 turn 決定誰先，就三個條件都滿足。

    我寫了一個小程式把兩個 process 所有可能的交錯都走過一遍：沒有任何狀態兩人同時在 critical section，但有一個狀態兩人都卡住；改成 Peterson 演算法後就不會卡住。

</div>

<div data-qid="u2-exam-5" markdown="1">

**考古變化 5.**（改自 104 Q8(3)・判斷）下面兩個交易的寫法，哪一個符合 two-phase locking？不符合的會出什麼問題？T1：`lock(A) read(A) unlock(A) lock(B) write(B) unlock(B)`；T2：`lock(A) lock(B) read(A) write(B) unlock(A) unlock(B)`

??? quiz "看完整解答"
    - **跟原題差在哪**：原題問 2PL 為什麼正確；這題要判斷具體的交易有沒有遵守。
    - **規則**：先只拿 lock（growing），一旦開始放 lock（shrinking），就不能再拿。
    - **T1 不符合**：`unlock(A)` 之後又 `lock(B)`，在 shrinking 之後還在拿 lock。
    - **T2 符合**：先拿 A、B，用完才開始放。
    - **T1 的問題**：A 放掉之後、B 還沒拿到之前，別的交易可以插進來改 A 和 B，結果可能不等於任何一種「一個一個執行」的順序（不是 conflict serializable）。

</div>

### 2.6 練習：猜題 {#u2-bank}

考古題還沒考過、但恐龍書第 6、7 章（同步工具、經典同步問題）的重點，我猜比較可能出現的題型，包含 115 年那種英文名詞填空。

<div data-qid="u2-bank-g1" markdown="1">

<div markdown="1">

**猜題 1.**（英文名詞填空，115 年的格式）

- (a) A lock that busy-waits while waiting to be acquired is called a ＿＿.
- (b) The segment of code in which a process accesses and updates shared data is called its ＿＿.
- (c) A ＿＿ is a high-level synchronization construct that ensures only one process at a time is active within it.
- (d) With the ＿＿ protocol, a process holding a resource needed by a higher-priority process temporarily inherits that higher priority.
- (e) Instructions such as test_and_set() execute ＿＿, that is, as one uninterruptible unit.

</div>

??? quiz "看答案"
    - (a) **spinlock**
    - (b) **critical section**
    - (c) **monitor**
    - (d) **priority-inheritance**
    - (e) **atomically**

</div>

<div data-qid="u2-bank-g2" markdown="1">

**猜題 2.** semaphore 的 `wait()`、`signal()` 本身也要改 S 的值。它們為什麼必須是不可分割的？作業系統怎麼做到？

??? quiz "看答案"
    - **為什麼**：wait 是「讀 S、減 1、寫回、判斷要不要睡」。兩個 process 同時 wait，如果交錯執行，可能都讀到 1、都減成 0、都以為自己拿到了，semaphore 本身就出現 race condition。
    - **單核心**：執行 wait、signal 那幾行時**暫時關掉中斷**，就不會被切換。
    - **多核心**：關中斷擋不住別顆 CPU，要用 compare_and_swap 或 spinlock 保護 wait、signal 的程式碼。這裡的 busy waiting 只發生在 wait、signal 這幾行，很短，可以接受。

</div>

<div data-qid="u2-bank-g3" markdown="1">

<div markdown="1">

**猜題 3.** 下面的 `increment` 沒有用 lock，多個 thread 同時呼叫也不會掉數，為什麼？

```c
void increment(int *v) {
    int temp;
    do {
        temp = *v;      /* 先讀目前的值 */
    } while (temp !=
             compare_and_swap(v, temp, temp + 1));
}
```

</div>

??? quiz "看答案"
    compare_and_swap 只有在 `*v` **還等於剛剛讀到的 temp** 時，才把它改成 temp ＋ 1，而且這一步不可分割。

    - 沒人插隊：`*v` 還是 temp，改成功，回傳 temp，迴圈結束。
    - 有人插隊、先改了 `*v`：`*v` 不等於 temp，這次**不改**，回傳的是新值，跟 temp 不一樣，迴圈**重讀再試**。

    所以每一次成功的加 1 都是加在「最新的值」上，不會蓋掉別人的結果。atomic variable 的 increment 就是這樣做的。我實際跑過：兩個 thread 各加一百萬次，結果剛好 2000000。

</div>

<div data-qid="u2-bank-g4" markdown="1">

**猜題 4.** monitor 裡，P 呼叫 `x.signal()` 叫醒了在 x 上等的 Q。但 monitor 一次只能有一個在執行，接下來誰先跑？

??? quiz "看答案"
    有兩種做法：

    - **signal and wait**：P 先停下來等，讓 Q 馬上執行（Q 醒來時條件一定還成立）。
    - **signal and continue**：P 繼續跑到離開 monitor 或去等別的條件，Q 之後才執行（Q 醒來時條件可能又被改了）。

    Pthreads、Java 都是 signal and continue，所以等條件的程式要寫 `while (!條件) wait();`，醒來再檢查一次，不能只用 if。

</div>

<div data-qid="u2-bank-g5" markdown="1">

**猜題 5.** 把 readers–writers 改成「writer 優先」：只要有 writer 在等，新來的 reader 就不能進去。這樣誰可能餓死？為什麼兩種版本都有人會餓死？

??? quiz "看答案"
    - **reader 可能餓死**：writer 一直來，reader 就一直被擋在外面。
    - readers 優先時 writer 會餓死，writers 優先時 reader 會餓死：只要給某一邊「插隊權」，另一邊就可能永遠排不到。要兩邊都不餓死，可以讓所有人照到達的順序排隊（例如先通過一個大家共用的排隊 semaphore，再照原本的規則讀寫）。

</div>

<div data-qid="u2-bank-g6" markdown="1">

**猜題 6.** deadlock 和 starvation 差在哪？各舉一個跟 semaphore 有關的例子。

??? quiz "看答案"
    - **deadlock**：一群 process 每個都在等**這群裡的別人**才能觸發的事件，大家一起永遠等下去。例：基礎題裡兩個 semaphore 拿的順序相反（P0 先 S 後 Q、P1 先 Q 後 S）。
    - **starvation（indefinite blocking）**：系統還在運作、別人都有進展，只有某個 process 一直等不到。例：semaphore 的等待佇列如果用 LIFO（後來的先服務），最早來排隊的可能永遠被插隊。
    - 差別：deadlock 是「那一群全部卡住」，starvation 是「只有某些人一直輪不到」。

</div>

<div data-qid="u2-bank-g7" markdown="1">

<div markdown="1">

**猜題 7.** 兩個 thread 都執行下面的函式，最後 count 應該是 2000000，但常常比較少。用 Pthreads 的 mutex 改寫，讓結果一定正確。

```c
long count = 0;
void *worker(void *p) {
    for (int i = 0; i < 1000000; i++)
        count++;
    return NULL;
}
```

</div>

??? quiz "看答案"
    ```c
    long count = 0;
    pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;
    void *worker(void *p) {
        for (int i = 0; i < 1000000; i++) {
            pthread_mutex_lock(&m);
            count++;            /* critical section */
            pthread_mutex_unlock(&m);
        }
        return NULL;
    }
    ```

    `count++` 是讀、加、寫回三步，兩個 thread 交錯就會掉數。用 mutex 把它包起來，一次只有一個 thread 在做 `count++`。我實際跑過：不加 lock 時有一次只得到 1048268（每次跑都不一樣），加上 mutex 之後剛好 2000000。也可以改用 atomic 的加法，或上一題的 compare_and_swap 迴圈。

</div>

<div data-qid="u2-bank-g8" markdown="1">

**猜題 8.** Peterson's solution 在現代多核心 CPU 上可能會失效，為什麼？怎麼補救？

??? quiz "看答案"
    - **原因**：CPU 和編譯器可能把彼此無關的讀寫換順序。進入前的 `flag[i] = true;`、`turn = j;` 跟之後 while 讀的 `flag[j]` 是不同的變數，可能被重排：例如讀 flag[j] 被提前到寫 flag[i] 之前，兩個 process 都看到對方的 flag 還是 false，同時進去。
    - **補救**：在設定 flag、turn 和檢查 while 之間加上 **memory barrier**，強迫寫入先完成、讓另一顆 CPU 看得到（這就是 114 Q6a 第一種硬體支援的用途）；或直接改用硬體指令（test_and_set、compare_and_swap）做 lock。

</div>

### 2.7 英文作答範例 {#u2-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** What is a race condition? Give an example.

（中文：什麼是 race condition？舉一個例子。）

</div>

??? quiz "看英文參考答案"
    A **race condition** occurs when several processes or threads **access and manipulate the same data concurrently**, and the **outcome depends on the particular order** in which the accesses take place.

    For example, two threads both execute `counter++`. Each increment is three machine instructions (load, add, store). If the instructions interleave, both threads may load the same old value, and **one update is lost**.

    To guard against race conditions, only one process at a time may manipulate the shared data, so the processes must be **synchronized**.

    寫法提示：定義裡的 concurrently 和 outcome depends on the order 是給分重點；例子用 counter++ 最好寫（[2.0](#u2-0)）。

<div markdown="1">

**E-2.** What three requirements must a solution to the critical-section problem satisfy?

（中文：critical-section 問題的解法要滿足哪三個條件？）

</div>

??? quiz "看英文參考答案"
    1. **Mutual exclusion**: if a process is executing in its critical section, **no other process** can be executing in its critical section.
    2. **Progress**: if no process is in its critical section and some processes wish to enter, only the processes that are not in their remainder sections can take part in deciding which one enters next, and this selection **cannot be postponed indefinitely**.
    3. **Bounded waiting**: after a process has made a request to enter its critical section, there is a **limit** on the number of times other processes are allowed to enter their critical sections before that request is granted.

    寫法提示：三個名稱一定要寫英文；progress 和 bounded waiting 最常寫反：progress 是「不能一直不決定」，bounded waiting 是「不能一直被插隊」（[2.0](#u2-0)）。

<div markdown="1">

**E-3.** Describe three hardware supports for solving the critical-section problem.

（中文：114 Q6a：解決 critical-section 問題的三種硬體支援。）

</div>

??? quiz "看英文參考答案"
    1. **Memory barriers (memory fences)**: instructions that force all earlier memory operations to complete and become **visible to all other processors** before any later operation is performed.
    2. **Hardware instructions** such as **test_and_set()** and **compare_and_swap()**: they test and modify a memory word **atomically**, as one uninterruptible unit, and can be used to build locks.
    3. **Atomic variables**: they provide **atomic operations** on basic data types such as integers and booleans, for example an atomic increment.

    寫法提示：三個名稱照課本寫，每個補一句「它做什麼」（[2.1](#u2-1)）。

<div markdown="1">

**E-4.** Explain the uses of mutex locks, semaphores and condition variables.

（中文：112 Q5b：mutex、semaphore、condition variable 各用在哪裡？）

</div>

??? quiz "看英文參考答案"
    - **Mutex lock**: protects a critical section. A process must **acquire()** the lock before entering the critical section and **release()** it when it exits, so only one process holds the lock at a time.
    - **Semaphore**: an integer variable that is accessed only through two atomic operations, **wait()** (decrement, and block if no resource is available) and **signal()** (increment). A **binary semaphore** behaves like a mutex lock; a **counting semaphore** controls access to a resource with a finite number of instances, and it can also enforce an **execution order** between processes.
    - **Condition variable**: used inside a **monitor** (or together with a mutex). A thread calls **wait()** to suspend until some **condition** becomes true, and another thread calls **signal()** to resume one waiting thread.

    寫法提示：三個都要寫「操作的名稱」：acquire／release、wait／signal、wait／signal（[2.1](#u2-1)）。

<div markdown="1">

**E-5.** What is busy waiting? When is a spinlock preferable to a lock that blocks?

（中文：什麼是 busy waiting？什麼時候 spinlock 比會睡覺的 lock 好？）

</div>

??? quiz "看英文參考答案"
    **Busy waiting** means that a process trying to enter its critical section **loops continuously** in the entry code, wasting CPU cycles that other processes could use. A lock that busy-waits is called a **spinlock**.

    A spinlock is preferable on **multicore systems** when the lock is **held for a short time**: the waiting process needs **no context switch**, and a context switch could take longer than the wait itself. On a single-processor system, spinning is wasteful, because the lock holder cannot run while another process spins.

    寫法提示：答「什麼時候比較好」要同時寫兩個條件：multicore、held for a short time（[2.0](#u2-0)）。

<div markdown="1">

**E-6.** What is priority inversion? How can it be solved?

（中文：105、107：什麼是 priority inversion？怎麼解決？）

</div>

??? quiz "看英文參考答案"
    **Priority inversion** occurs when a **high-priority process** needs a resource (such as a lock) held by a **low-priority process**, and the low-priority process is **preempted by a medium-priority process**. As a result, a process with a lower priority (the medium one) indirectly makes the high-priority process wait longer.

    It can be solved with the **priority-inheritance protocol**: a process that holds a resource needed by a higher-priority process **temporarily inherits the higher priority** until it releases the resource. Then the medium-priority process cannot preempt it, and its priority **reverts to the original value** after it releases the resource.

    寫法提示：一定要有三個角色（high、medium、low），只寫兩個不算 priority inversion（[2.2](#u2-more)）。

### 單元 2 小考 {#u2-quiz}

**2-1.** critical-section 解法的三個條件分別是什麼意思？

??? quiz "看答案"
    mutual exclusion：一次最多一個在裡面。progress：沒人在裡面時，想進去的人之間要能在有限時間內決定誰進去，不在乎的人不能干擾。bounded waiting：一個 process 提出請求後，其他人插隊進去的次數有上限，不會餓死。

## 單元 3：死結 {#u3}

!!! key "一句話重點"
    死結要**四個條件同時成立**：mutual exclusion、hold and wait、no preemption、circular wait。破壞其中一個就不會死結。

### 3.0 觀念課：兩個人各拿一支筷子 {#u3-0}

#### 最小的死結

P1 拿著資源 R1、在等 R2；P2 拿著 R2、在等 R1。兩人都不放手，永遠等下去。像兩個人吃飯，各拿了一支筷子，都在等對方的那一支。

把四個必要條件對到這個例子：

| 條件 | 在例子裡 |
|---|---|
| mutual exclusion | 一支筷子一次只能一個人用 |
| hold and wait | 手上拿著一支，還在等另一支 |
| no preemption | 不能把別人手上的筷子搶過來 |
| circular wait | P1 等 P2、P2 等 P1，繞成一圈 |

四個都成立才會死結。**破壞任何一個就不會死結**，這就是 deadlock prevention 的思路，例如「一次把兩支筷子都拿到才開始吃」破壞了 hold and wait。

#### 資源分配圖：有 cycle 一定死結嗎？

畫法：process 畫圓、資源畫方框，框裡的點是這種資源有幾份。**P → R**（request edge）表示 P 在等 R；**R → P**（assignment edge）表示 R 的一份已經分給 P。

<figure class="fig">
<svg viewBox="0 0 360 384" role="img" aria-label="兩張資源分配圖。(a) R1、R2 各 1 份：P1 拿著 R1 在等 R2，P2 拿著 R2 在等 R1，形成 cycle，死結。(b) R1、R2 各 2 份：R1 分給 P2、P3，R2 分給 P1、P4；P1 在等 R1，P3 在等 R2，有 cycle P1→R1→P3→R2→P1，但 P2、P4 沒有在等，做完會放出資源，所以沒有死結。">
<text x="6" y="14" text-anchor="start" dominant-baseline="central" class="sm">(a) 每種資源 1 份：有 cycle 就死結</text>
<circle class="fa" cx="70" cy="104" r="19"/>
<text x="70" y="104" text-anchor="middle" dominant-baseline="central" class="mono">P1</text>
<circle class="fa" cx="290" cy="104" r="19"/>
<text x="290" y="104" text-anchor="middle" dominant-baseline="central" class="mono">P2</text>
<rect class="box" x="153" y="49" width="54" height="30" rx="4"/>
<circle style="fill:var(--ink)" cx="180" cy="64" r="4"/>
<text x="180" y="39" text-anchor="middle" dominant-baseline="central" class="sm mono">R1</text>
<rect class="box" x="153" y="131" width="54" height="30" rx="4"/>
<circle style="fill:var(--ink)" cx="180" cy="146" r="4"/>
<text x="180" y="172" text-anchor="middle" dominant-baseline="central" class="sm mono">R2</text>
<line class="arw-a" x1="175.301" y1="65.7087" x2="98.2" y2="93.7"/>
<polygon class="ah-a" points="89.7,96.8 96.5,89.0 99.9,98.4"/>
<line class="arw-a" x1="89.6186" y1="111.491" x2="142.6" y2="131.7"/>
<polygon class="ah-a" points="151.0,134.9 140.8,136.4 144.4,127.0"/>
<line class="arw-a" x1="184.671" y1="144.216" x2="262.0" y2="114.7"/>
<polygon class="ah-a" points="270.4,111.5 263.8,119.4 260.2,110.0"/>
<line class="arw-a" x1="270.264" y1="96.8234" x2="217.5" y2="77.6"/>
<polygon class="ah-a" points="209.0,74.5 219.2,72.9 215.7,82.3"/>
<text x="6" y="200" text-anchor="start" dominant-baseline="central" class="sm">(b) 每種資源 2 份：有 cycle 但沒有死結</text>
<circle class="fa" cx="60" cy="296" r="19"/>
<text x="60" y="296" text-anchor="middle" dominant-baseline="central" class="mono">P1</text>
<circle class="fa" cx="300" cy="296" r="19"/>
<text x="300" y="296" text-anchor="middle" dominant-baseline="central" class="mono">P3</text>
<rect class="box" x="153" y="235" width="54" height="30" rx="4"/>
<circle style="fill:var(--ink)" cx="170" cy="250" r="4"/>
<circle style="fill:var(--ink)" cx="190" cy="250" r="4"/>
<text x="180" y="225" text-anchor="middle" dominant-baseline="central" class="sm mono">R1</text>
<rect class="box" x="153" y="327" width="54" height="30" rx="4"/>
<circle style="fill:var(--ink)" cx="170" cy="342" r="4"/>
<circle style="fill:var(--ink)" cx="190" cy="342" r="4"/>
<text x="180" y="368" text-anchor="middle" dominant-baseline="central" class="sm mono">R2</text>
<circle class="fc" cx="48" cy="234" r="19"/>
<text x="48" y="234" text-anchor="middle" dominant-baseline="central" class="mono">P2</text>
<circle class="fc" cx="312" cy="360" r="19"/>
<text x="312" y="360" text-anchor="middle" dominant-baseline="central" class="mono">P4</text>
<line class="arw-a" x1="79.6087" y1="288.483" x2="142.6" y2="264.3"/>
<polygon class="ah-a" points="151.0,261.1 144.4,269.0 140.8,259.7"/>
<line class="arw-a" x1="194.613" y1="251.929" x2="272.3" y2="284.4"/>
<polygon class="ah-a" points="280.6,287.9 270.4,289.0 274.3,279.8"/>
<line class="arw-a" x1="280.391" y1="303.517" x2="217.4" y2="327.7"/>
<polygon class="ah-a" points="209.0,330.9 215.6,323.0 219.2,332.3"/>
<line class="arw-a" x1="165.387" y1="340.071" x2="87.7" y2="307.6"/>
<polygon class="ah-a" points="79.4,304.1 89.6,303.0 85.7,312.2"/>
<line class="arw" x1="165.042" y1="249.35" x2="77.7" y2="237.9"/>
<polygon class="ah" points="68.8,236.7 78.4,232.9 77.1,242.9"/>
<line class="arw" x1="194.946" y1="342.73" x2="282.3" y2="355.6"/>
<polygon class="ah" points="291.2,356.9 281.6,360.6 283.1,350.7"/>
</svg>
<figcaption>P → R：在等這個資源；R → P：已經分給它；框裡的點是份數</figcaption>
</figure>

- **每種資源只有 1 份**：有 cycle 就是死結。(a) 裡 P1、P2 互等，誰都動不了。
- **有資源不只 1 份**：有 cycle **不一定**死結。(b) 有 cycle P1 → R1 → P3 → R2 → P1，但 P4 沒有在等任何東西，做完會放出一份 R2 給 P3；P3 做完再放出 R1 給 P1。
- **沒有 cycle**：一定沒有死結。

所以 cycle 是死結的**必要條件**；只有在每種資源都只有 1 份時，才是充分條件。

#### 避免死結：銀行家只借「還得回來」的錢

Banker's algorithm 的想法：銀行只在「借出去之後，**仍然存在某個順序**能讓每個客戶都借滿、用完、還錢」時才借。這種狀態叫 **safe state**。

**小例子**：一種資源共 10 份。

| 行程 | 最多需要 | 目前持有 | 還需要 |
|---|---|---|---|
| P1 | 8 | 4 | 4 |
| P2 | 5 | 2 | 3 |

可用 $10-4-2=4$。P2 還需要 3 ≤ 4 → P2 可以做完，還回 2 份 → 可用 6。P1 還需要 4 ≤ 6 → 也能做完。存在順序 P2 → P1，所以是 **safe**。

判斷方法就是：**反覆找一個「還需要 ≤ 目前可用」的行程，讓它做完、把它持有的加回可用**。全部都能做完就是 safe。

#### 多種資源：矩陣版的 Banker's algorithm

資源有 A、B、C 三種，總數 (9, 5, 6)：

| 行程 | Allocation（持有） | Max（最多） | Need ＝ Max − Allocation |
|---|---|---|---|
| P0 | 1 1 0 | 5 3 2 | 4 2 2 |
| P1 | 2 0 1 | 3 2 2 | 1 2 1 |
| P2 | 3 0 2 | 6 0 4 | 3 0 2 |
| P3 | 1 2 1 | 2 2 3 | 1 0 2 |

**Available（2, 2, 2）**：總數減掉所有 Allocation 的和 (7, 3, 4)。

**safety 演算法**：Work 從 Available 開始，每次從 P0 往下找第一個 Need ≤ Work（**三種資源都要 ≤**）的行程，讓它做完、Work 加上它的 Allocation：

| 步驟 | 找到 | 為什麼 | Work 變成 |
|---|---|---|---|
| 1 | P1 | P0 的 A 要 4 ＞ 2 不行；P1 的 (1, 2, 1) ≤ (2, 2, 2) | 4 2 3 |
| 2 | P0 | (4, 2, 2) ≤ (4, 2, 3) | 5 3 3 |
| 3 | P2 | (3, 0, 2) ≤ (5, 3, 3) | 8 3 5 |
| 4 | P3 | (1, 0, 2) ≤ (8, 3, 5) | 9 5 6 |

全部做得完：**safe**，順序 P1、P0、P2、P3（順序不唯一，寫出一個就好）。最後的 Work 一定等於總數，可以拿來驗算。

**有人提出申請（resource-request）**：P3 申請 (1, 0, 1)。

1. **Request ≤ Need 嗎**：(1, 0, 1) ≤ (1, 0, 2)，是。不是的話是錯誤：超過它事先宣告的最大需求。
2. **Request ≤ Available 嗎**：(1, 0, 1) ≤ (2, 2, 2)，是。不是的話只能等。
3. **假裝給它**：Available 變 (1, 2, 1)、P3 的 Allocation 變 (2, 2, 2)、Need 變 (0, 0, 1)。
4. **跑 safety**：P1（(1, 2, 1) ≤ (1, 2, 1)）→ Work (3, 2, 2)；P2 → (6, 2, 4)；P0 → (7, 3, 4)；P3 → (9, 5, 6)。safe，**可以給**。

再換成 P0 申請 (2, 0, 0)：前兩步都通過，假裝給它之後 Available 剩 (0, 2, 2)。四個行程都還要至少 1 份 A，Work 裡的 A 是 0，一個都做不完：**unsafe，不給**，P0 先等。

!!! trap "unsafe 不等於死結"
    unsafe 只是「系統沒辦法保證」：process 不一定真的會要到 Max，之後也可能平安做完。但 Banker's algorithm 保守地不讓系統進入 unsafe state。

#### 偵測和復原：允許死結，發生了再處理

- **偵測**：步驟跟 safety 一樣，只是把 Need 換成**現在的 Request**（正在等的量）。跑完還做不完的那些 process，就是死結的。每種資源只有 1 份時，也可以畫 **wait-for graph**（把資源節點拿掉，P → Q 表示 P 在等 Q），有 cycle 就是死結。
- **復原**：
    - **終止 process**：全部終止（快，但代價大），或一次終止一個、每次重新偵測。
    - **搶資源**：選一個 victim、把它的資源拿走並 rollback；要把「被選過幾次」算進成本，不然同一個 process 可能一直被犧牲（starvation）。

!!! key "死結題要做什麼"
    | 題目問 | 怎麼做 |
    |---|---|
    | 會不會死結（資源分配圖） | 找 cycle；每種資源 1 份時 cycle 就是死結，多份時再看有沒有人能先做完 |
    | 是不是 safe state | 算 Need ＝ Max − Allocation 和 Available；反覆找 Need ≤ Work 的做完，Work 加上它的 Allocation |
    | 某個申請能不能給 | Request ≤ Need → Request ≤ Available → 假裝給 → 跑 safety |
    | 哪些 process 死結了 | 偵測演算法：同 safety，但用現在的 Request；做不完的就是 |
    | 某個做法破壞哪個條件 | 一次申請全部 → hold and wait；照編號申請 → circular wait；搶資源 → no preemption |
    | 保證不死結的 process 數上限 | $n(k-1)+1\le m$（[3.2](#u3-more)） |

    名詞對照：safe state（安全狀態）、resource-allocation graph（資源分配圖）、request／assignment edge（申請邊／分配邊）、wait-for graph（等待圖）、victim（被犧牲的 process）。

!!! read "還不懂？看別人怎麼講"
    - **講義**：[周志遠講義下載頁](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999)的 Ch7 Deadlocks。考試也可能出多種資源的矩陣版 Banker's algorithm，步驟跟這節一樣：反覆找「還需要 ≤ 可用」的行程。
    - **影片**：[周志遠・作業系統播放清單](https://www.youtube.com/playlist?list=PLS0SUwlYe8cxj8FCPRoPHAehIiN9Vo6VZ)的 Deadlocks 單元。

#### 換你試試

**T-1.** 「要求行程一開始就申請所有需要的資源」破壞的是哪個條件？

??? quiz "看答案"
    hold and wait。

**T-2.** 一種資源共 12 份：P0 最多 10、持有 5；P1 最多 4、持有 2；P2 最多 9、持有 2。是 safe 嗎？順序是？

??? quiz "看答案"
    可用 $12-9=3$。P1 還需 2 ≤ 3 → 做完，可用 5；P0 還需 5 ≤ 5 → 做完，可用 10；P2 還需 7 ≤ 10 → 做完。safe，順序 P1、P0、P2。

### 3.1 考古題與重點整理 {#u3-1}

- 四個必要條件。（114 Q8d 填 hold and wait）
- **circular wait 蘊含 hold and wait**：形成循環的每個 process 都正在持有資源又在等別的資源。（115 Q1g）

!!! example "115 Q3a（6%）：處理死結的三種方法"
    1. **預防或避免（prevention／avoidance）**：保證系統永遠不會進入死結狀態。
    2. **偵測與復原（detection and recovery）**：允許死結發生，偵測到之後終止 process 或搶回資源。
    3. **忽略（ignore）**：假裝死結不會發生，Linux、Windows 等大多數 OS 採用這個做法，由開發者自行處理。

!!! example "112 Q8a（4%）：deadlock prevention 怎麼運作"
    確保四個必要條件中**至少一個不可能成立**：

    - mutual exclusion：盡量讓資源可共享（例如唯讀檔案）。
    - hold and wait：要求 process 一開始就申請所有資源，或申請新資源前先釋放手上的。
    - no preemption：申請不到時，強制釋放已持有的資源。
    - circular wait：所有資源類型編號，只能**依遞增順序**申請。

### 3.2 死結的考古題補充：哲學家、磁帶機、wait-die {#u3-more}

100、101、103、104、105、107 年考過的死結題：條件和預防、避免的差別，加上三種固定題型。

#### 四個條件是「必要」不是「充分」

四個條件**同時**成立才可能死結，只有其中一個成立不會死結（101 Q2(b)）。102 Q5(2) 的是非題「四個條件中任何一個成立，死結就一定發生」是**錯**的。

#### 預防（prevention）和避免（avoidance）差在哪

| | deadlock prevention | deadlock avoidance |
|---|---|---|
| 做法 | 用規則讓四個條件**至少一個永遠不成立**（[3.1](#u3-1) 112 Q8a） | 每次要分配資源時**檢查**：分配後還是 safe state 才給（[3.0](#u3-0) 的 Banker's algorithm） |
| 需要的資訊 | 不用 | 每個 process **最多需要多少**資源 |
| 代價 | 限制多，資源用得沒效率 | 每次分配都要計算 |

!!! example "107 Q1(4)（4%）、105 Q1(2)（3%）：deadlock prevention 和 avoidance 有什麼不同？avoidance 怎麼運作？"
    prevention 事先用規則破壞四個必要條件之一，例如資源依編號申請（破壞 circular wait），系統根本不可能死結。avoidance 不限制申請方式，但要事先知道每個 process 最多需要多少資源；每次有人申請，就假裝先給它，看看是否仍然存在一個順序能讓所有 process 都做完（safe state），是才真的給，否則讓它等。

#### n 個 process 搶 m 份資源

!!! example "103 Q1（10%）：電腦有 6 台磁帶機，n 個 process 在搶，每個 process 最多需要 2 台。n 是多少時保證不會死結？"
    **最壞的情況**：每個 process 都先拿到 1 台，再等第 2 台。如果 6 台全部被 6 個 process 各拿 1 台，大家都在等，就死結了。

    - **n ≤ 5（不會死結）**：最多 5 個 process 各拿 1 台，還剩至少 1 台。一定有人拿得到第 2 台，做完後放出 2 台，其他人就接著做得完。
    - **n ≥ 6**：6 個 process 各拿 1 台時就死結。

    **一般公式**：m 份資源、n 個 process、每個最多需要 k 份，不會死結的條件是 $n(k-1)+1\le m$（每個人都只差一份時，還剩一份給某個人）。這題 $n\times1+1\le6$，$n\le5$。

#### 哲學家：筷子放在中間

!!! example "100 Q3（15%）：哲學家用餐問題，筷子放在桌子中間，任何兩支都可以用；每次只要一支。找一個簡單的規則，判斷某個請求能不能給、又不會造成死結"
    **規則**：哲學家要拿**第一支**筷子時，如果桌上**只剩最後一支**、而且**沒有任何人已經拿著兩支**，就不給；其他情況都可以給。

    **為什麼**：死結只會發生在「每個人手上都只有一支、桌上沒筷子」。

    - 申請**第二支**：拿到就有兩支可以吃，吃完會放回兩支，永遠可以給（只要桌上有）。
    - 申請**第一支**，桌上還有兩支以上：給了之後桌上至少還有一支，還能讓某個拿著一支的人湊成兩支。
    - 申請**第一支**，桌上只剩一支：如果有人已經拿著兩支，他吃完會放回來，可以給；如果沒有人拿著兩支，把最後一支給出去，大家都只有一支、桌上沒了，就死結，所以不給。

#### wait-die 與 wound-wait：用 timestamp 避免死結

每個 process 有一個 timestamp（越小越老）。process 要的資源被別人拿著時：

| | 老的要年輕的手上的資源 | 年輕的要老的手上的資源 |
|---|---|---|
| **wait-die**（不搶，nonpreemptive） | 老的**等** | 年輕的**死**（rollback） |
| **wound-wait**（搶，preemptive） | 老的**打傷**年輕的：年輕的 rollback，資源給老的 | 年輕的**等** |

記法：兩種都是「**老的有特權**」，等待永遠只會是單一方向（wait-die 只有老等年輕、wound-wait 只有年輕等老），不會形成循環，所以不會死結。被 rollback 的 process **保留原本的 timestamp** 重來，總有一天會變成最老的，所以不會 starvation。

!!! example "104 Q8(2)（4%）：P1、P2、P3 的 timestamp 是 17、25、30；P2 持有一個資源，P1 和 P3 都在要它。wait-die 和 wound-wait 的結果？"
    P1（17）比 P2（25）老，P3（30）比 P2 年輕。

    - **wait-die**：P1 老 → **P1 等**；P3 年輕 → **P3 rollback**（die）。
    - **wound-wait**：P1 老 → **P2 被 rollback**（wound），資源給 P1；P3 年輕 → **P3 等**。

    107 Q7(9) 的是非題「wait-die 是 preemptive 的死結預防方法」是**錯**的：wait-die 不搶別人的資源，搶的是 wound-wait。

#### 觀念小考

<div class="mcq" data-ans="3" markdown="1">

**C-1.** 10 份資源、n 個 process，每個最多需要 3 份。n 最大是多少時保證不會死結？

1. 3
2. 5
3. 4
4. 10

??? quiz "看解析"
    **C. 4**。條件 $n(k-1)+1\le m$：$2n+1\le10$，$n\le4.5$，所以 $n=4$。驗算：4 個 process 各拿 2 份，用掉 8 份，還剩 2 份，至少一個人能湊到 3 份做完。5 個 process 各拿 2 份就用光 10 份，死結。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-2.** wait-die 中，年輕的 process 要老的手上的資源，會怎樣？

1. 年輕的 rollback，之後用原本的 timestamp 重來
2. 年輕的等
3. 老的被 rollback
4. 兩個都 rollback

??? quiz "看解析"
    **A**。wait-die 只讓老的等年輕的；年輕的遇到老的就「死」（rollback）。保留原本的 timestamp，重來幾次後會變成相對老的，不會一直被 rollback。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-3.** deadlock avoidance 和 prevention 最大的不同是？

1. avoidance 允許死結發生再處理
2. prevention 需要知道每個 process 最多要多少資源
3. 兩個一樣
4. avoidance 每次分配前檢查會不會進入 unsafe state，prevention 是事先破壞某個必要條件

??? quiz "看解析"
    **D**。A 說的是 detection and recovery；B 剛好相反，需要事先知道最大需求的是 avoidance（Banker's algorithm）。

</div>

### 3.3 觀念小考 {#u3-concept}

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。

<div class="mcq" data-ans="1" markdown="1">

**C-1.** 每種資源都只有 1 份時，資源分配圖有 cycle，表示？

1. 一定死結
2. 可能死結，也可能沒有
3. 一定沒有死結
4. 要看有幾個 process

??? quiz "看解析"
    **A**。只有 1 份時，cycle 上每個 process 等的資源都在下一個人手上，又沒有別份可以用，大家都動不了。資源有好幾份時才是 B（像圖 (b)）。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-2.** Banker's algorithm 收到一個 Request，但它比這個 process 的 Need 還大，會怎麼處理？

1. 讓它等，直到資源夠
2. 直接給，再跑 safety
3. 當成錯誤：它超過了自己事先宣告的最大需求
4. 把別人的資源搶過來給它

??? quiz "看解析"
    **C**。Need 是「最多還會再要多少」，超過就表示它違反了事先的宣告。Request ≤ Need、但 ＞ Available 時，才是 A（等）。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-3.** unsafe state 的意思是？

1. 系統已經死結了
2. 系統沒辦法保證避開死結，之後可能死結、也可能沒事
3. 一定會死結
4. 有 process 正在等資源

??? quiz "看解析"
    **B**。safe 一定不會死結；unsafe 只是「可能」，因為 process 不一定真的會要到 Max。Banker's algorithm 保守地不進入 unsafe state。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-4.** 死結偵測演算法和 safety 演算法差在哪？

1. 偵測演算法不需要 Available
2. 偵測演算法只能用在單一資源
3. 兩個完全一樣
4. 偵測用「現在的 Request」，safety 用「Need（最多還要多少）」

??? quiz "看解析"
    **D**。步驟一樣：反覆找能被滿足的 process，讓它做完、放出資源。safety 問「最壞情況下大家都做得完嗎」，所以用 Need；偵測問「現在卡住的是誰」，所以用 Request。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** 用「搶資源」復原死結時，為什麼要把被選為 victim 的次數算進成本？

1. 讓死結更快被偵測到
2. 避免同一個 process 一直被選中、永遠做不完（starvation）
3. 減少 context switch
4. 讓 Banker's algorithm 可以使用

??? quiz "看解析"
    **B**。如果每次都選代價最小的那個，可能永遠是同一個 process 被 rollback。把次數算進去，被選越多次的越不會再被選。

</div>

<div markdown="1">

**W-1.** 三種資源 A、B、C，總數 (6, 4, 7)。(a) 是 safe 嗎？寫出順序。(b) P2 申請 (1, 0, 1)，能不能給？

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 1 0 2 | 3 2 2 |
| P1 | 0 1 1 | 1 2 3 |
| P2 | 2 1 0 | 4 2 1 |
| P3 | 1 1 2 | 2 1 4 |

</div>

??? quiz "看參考答案"
    **Need 和 Available**：Need 是 P0 (2, 2, 0)、P1 (1, 1, 2)、P2 (2, 1, 1)、P3 (1, 0, 2)。Allocation 加起來 (4, 3, 5)，Available ＝ (2, 1, 2)。

    **(a) safe**：

    | 步驟 | 找到 | 為什麼 | Work |
    |---|---|---|---|
    | 1 | P1 | P0 的 B 要 2 ＞ 1 不行；P1 的 (1, 1, 2) ≤ (2, 1, 2) | 2 2 3 |
    | 2 | P0 | (2, 2, 0) ≤ (2, 2, 3) | 3 2 5 |
    | 3 | P2 | (2, 1, 1) ≤ (3, 2, 5) | 5 3 5 |
    | 4 | P3 | (1, 0, 2) ≤ (5, 3, 5) | 6 4 7 |

    順序 P1、P0、P2、P3，最後 Work 等於總數 ✓。

    **(b) 可以給**：(1, 0, 1) ≤ Need (2, 1, 1)，也 ≤ Available (2, 1, 2)。假裝給它：Available 變 (1, 1, 1)、P2 的 Need 變 (1, 1, 0)。safety：P0 的 A 要 2 不行、P1 的 C 要 2 不行；P2 的 (1, 1, 0) ≤ (1, 1, 1) → Work (4, 2, 2)；接著 P0 → (5, 2, 4)、P1 → (5, 3, 5)、P3 → (6, 4, 7)。safe，所以給。我用程式跑過，結果一樣。

<div markdown="1">

**W-2.** 三種資源 A、B、C，總數 (3, 2, 1)，目前全部分配出去。(a) 有沒有死結？(b) 如果 P2 改成在等 1 份 C（Request 變 0 0 1）呢？

| 行程 | Allocation | Request（現在在等） |
|---|---|---|
| P0 | 1 0 1 | 0 1 0 |
| P1 | 1 1 0 | 0 0 1 |
| P2 | 0 1 0 | 0 0 0 |
| P3 | 1 0 0 | 0 0 0 |

</div>

??? quiz "看參考答案"
    **(a) 沒有死結**：Available (0, 0, 0)。P2 不用再等 → 做完，Work (0, 1, 0)；P0 要 1 份 B → 可以，Work (1, 1, 1)；P1 要 1 份 C → 可以，Work (2, 2, 1)；P3 → Work (3, 2, 1)。全部做得完。

    **(b) P0、P1、P2 死結**：Work (0, 0, 0)，只有 P3 不用等 → 做完，Work (1, 0, 0)。剩下 P0 要 B、P1 和 P2 要 C，Work 裡都沒有，誰都做不完。P0 拿著唯一的那份 C，P1、P2 在等它；P0 要的 B 在 P1、P2 手上：互相等，就是死結。

### 3.4 換數字練習 {#u3-drill}

同一種題型換數字多做幾次，直到不用看筆記也算得出來。每題都附完整解答，答案都用程式驗算過；先自己算，再打開對答案。

#### 題型：Banker's algorithm

**做法**：算 Need 和 Available；反覆找 Need ≤ Work 的做完、Work 加上它的 Allocation；申請時先檢查、假裝給、再跑 safety（[3.0](#u3-0)）。

<div markdown="1">

**P-1.** 三種資源 A、B、C，總數 (10, 5, 7)。這個狀態是 safe 嗎？是的話寫出一個順序。

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 0 1 0 | 7 4 3 |
| P1 | 2 0 0 | 3 2 2 |
| P2 | 3 0 2 | 9 0 2 |
| P3 | 2 1 1 | 2 2 2 |

</div>

??? quiz "看完整解答"
    - **Need**：P0 (7, 3, 3)、P1 (1, 2, 2)、P2 (6, 0, 0)、P3 (0, 1, 1)。
    - **Available (3, 3, 4)**：總數 (10, 5, 7) 減掉 Allocation 的和 (7, 2, 3)。
    - **P1 做得完**：Need (1, 2, 2) ≤ Work (3, 3, 4)，做完後 Work 變成 (5, 3, 4)。
    - **P3 做得完**：Need (0, 1, 1) ≤ Work (5, 3, 4)，做完後 Work 變成 (7, 4, 5)。
    - **P0 做得完**：Need (7, 3, 3) ≤ Work (7, 4, 5)，做完後 Work 變成 (7, 5, 5)。
    - **P2 做得完**：Need (6, 0, 0) ≤ Work (7, 5, 5)，做完後 Work 變成 (10, 5, 7)。
    - **答案：safe**，順序 P1、P3、P0、P2（每次從 P0 往下找第一個做得完的）。最後 Work ＝ 總數 ✓

    我用程式跑過 safety 演算法，結果一樣。


<div markdown="1">

**P-2.** 三種資源 A、B、C，總數 (7, 6, 5)。這個狀態是 safe 嗎？是的話寫出一個順序。

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 1 2 0 | 3 4 2 |
| P1 | 2 0 1 | 4 1 3 |
| P2 | 1 1 1 | 2 3 2 |
| P3 | 0 1 2 | 2 3 4 |

</div>

??? quiz "看完整解答"
    - **Need**：P0 (2, 2, 2)、P1 (2, 1, 2)、P2 (1, 2, 1)、P3 (2, 2, 2)。
    - **Available (3, 2, 1)**：總數 (7, 6, 5) 減掉 Allocation 的和 (4, 4, 4)。
    - **P2 做得完**：Need (1, 2, 1) ≤ Work (3, 2, 1)，做完後 Work 變成 (4, 3, 2)。
    - **P0 做得完**：Need (2, 2, 2) ≤ Work (4, 3, 2)，做完後 Work 變成 (5, 5, 2)。
    - **P1 做得完**：Need (2, 1, 2) ≤ Work (5, 5, 2)，做完後 Work 變成 (7, 5, 3)。
    - **P3 做得完**：Need (2, 2, 2) ≤ Work (7, 5, 3)，做完後 Work 變成 (7, 6, 5)。
    - **答案：safe**，順序 P2、P0、P1、P3（每次從 P0 往下找第一個做得完的）。最後 Work ＝ 總數 ✓

    我用程式跑過 safety 演算法，結果一樣。


<div markdown="1">

**P-3.** 三種資源 A、B、C，總數 (6, 5, 6)。這個狀態是 safe 嗎？是的話寫出一個順序。

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 2 1 1 | 5 3 3 |
| P1 | 1 1 0 | 2 2 1 |
| P2 | 0 2 2 | 2 4 4 |
| P3 | 1 0 2 | 3 1 3 |

</div>

??? quiz "看完整解答"
    - **Need**：P0 (3, 2, 2)、P1 (1, 1, 1)、P2 (2, 2, 2)、P3 (2, 1, 1)。
    - **Available (2, 1, 1)**：總數 (6, 5, 6) 減掉 Allocation 的和 (4, 4, 5)。
    - **P1 做得完**：Need (1, 1, 1) ≤ Work (2, 1, 1)，做完後 Work 變成 (3, 2, 1)。
    - **P3 做得完**：Need (2, 1, 1) ≤ Work (3, 2, 1)，做完後 Work 變成 (4, 2, 3)。
    - **P0 做得完**：Need (3, 2, 2) ≤ Work (4, 2, 3)，做完後 Work 變成 (6, 3, 4)。
    - **P2 做得完**：Need (2, 2, 2) ≤ Work (6, 3, 4)，做完後 Work 變成 (6, 5, 6)。
    - **答案：safe**，順序 P1、P3、P0、P2（每次從 P0 往下找第一個做得完的）。最後 Work ＝ 總數 ✓

    我用程式跑過 safety 演算法，結果一樣。


<div markdown="1">

**P-4.** 三種資源 A、B、C，總數 (5, 5, 5)。這個狀態是 safe 嗎？是的話寫出一個順序。

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 2 1 0 | 4 3 2 |
| P1 | 1 2 1 | 2 4 3 |
| P2 | 0 1 2 | 3 3 4 |
| P3 | 1 0 1 | 2 3 2 |

</div>

??? quiz "看完整解答"
    - **Need**：P0 (2, 2, 2)、P1 (1, 2, 2)、P2 (3, 2, 2)、P3 (1, 3, 1)。
    - **Available (1, 1, 1)**：總數 (5, 5, 5) 減掉 Allocation 的和 (4, 4, 4)。
    - **卡住**：Work (1, 1, 1)，剩下的 P0、P1、P2、P3 的 Need 都有某一種資源超過 Work。
    - **答案：unsafe**。

    我用程式跑過 safety 演算法，結果一樣。


<div markdown="1">

**P-5.** 三種資源 A、B、C，總數 (8, 6, 6)。P1 申請 (1, 1, 1)，能不能馬上給？

| 行程 | Allocation | Max |
|---|---|---|
| P0 | 2 1 1 | 5 4 3 |
| P1 | 1 2 0 | 3 3 2 |
| P2 | 2 0 2 | 3 2 4 |
| P3 | 1 1 1 | 2 3 2 |

</div>

??? quiz "看完整解答"
    - **Need**：P0 (3, 3, 2)、P1 (2, 1, 2)、P2 (1, 2, 2)、P3 (1, 2, 1)。
    - **Available (2, 2, 2)**：總數 (8, 6, 6) 減掉 Allocation 的和 (6, 4, 4)。
    - **檢查**：Request (1, 1, 1) ≤ Need (2, 1, 2)，也 ≤ Available (2, 2, 2)。
    - **假裝給它**：Available 變 (1, 1, 1)；P1 的 Allocation 變 (2, 3, 1)、Need 變 (1, 0, 1)。
    - **P1 做得完**：Need (1, 0, 1) ≤ Work (1, 1, 1)，Work 變成 (3, 4, 2)。
    - **P0 做得完**：Need (3, 3, 2) ≤ Work (3, 4, 2)，Work 變成 (5, 5, 3)。
    - **P2 做得完**：Need (1, 2, 2) ≤ Work (5, 5, 3)，Work 變成 (7, 5, 5)。
    - **P3 做得完**：Need (1, 2, 1) ≤ Work (7, 5, 5)，Work 變成 (8, 6, 6)。
    - **答案：safe，可以給**。最後 Work ＝ 總數 ✓

    我用程式跑過 safety 演算法，結果一樣。


### 3.5 英文作答範例 {#u3-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** What are the four necessary conditions for a deadlock?

（中文：死結的四個必要條件。）

</div>

??? quiz "看英文參考答案"
    A deadlock can arise only if **all four** conditions hold **simultaneously**:

    1. **Mutual exclusion**: at least one resource is held in a **nonsharable** mode.
    2. **Hold and wait**: a process is **holding** at least one resource and **waiting** to acquire additional resources held by other processes.
    3. **No preemption**: a resource can be released **only voluntarily** by the process holding it.
    4. **Circular wait**: there is a set $\{P_0,P_1,\dots,P_n\}$ of waiting processes such that $P_0$ waits for a resource held by $P_1$, $P_1$ waits for $P_2$, …, and $P_n$ waits for $P_0$.

    寫法提示：開頭那句 all four … simultaneously 是重點：少一個就不會死結，這就是 prevention 的根據（[3.0](#u3-0)）。

<div markdown="1">

**E-2.** What are the three methods for handling deadlocks?

（中文：115 Q3a：處理死結的三種方法。）

</div>

??? quiz "看英文參考答案"
    1. Use a protocol to **prevent or avoid** deadlocks, ensuring that the system will **never enter a deadlocked state**.
    2. Allow the system to enter a deadlocked state, **detect** it, and **recover**.
    3. **Ignore** the problem and pretend that deadlocks never occur in the system. This approach is used by most operating systems, including **Linux and Windows**; it is then up to kernel and application developers to handle deadlocks.

    寫法提示：第三種常被漏掉；寫出「大多數 OS 用這種」會加分（[3.1](#u3-1)）。

<div markdown="1">

**E-3.** How does deadlock prevention work?

（中文：112 Q8a：deadlock prevention 怎麼運作？）

</div>

??? quiz "看英文參考答案"
    Deadlock prevention ensures that **at least one of the four necessary conditions cannot hold**:

    - **Mutual exclusion**: make resources sharable when possible (for example, read-only files). Some resources are intrinsically nonsharable, so this condition usually cannot be denied.
    - **Hold and wait**: require each process to request and be allocated **all its resources before it begins execution**, or to request resources **only when it holds none**. The drawbacks are low resource utilization and possible starvation.
    - **No preemption**: if a process that is holding resources requests another resource that cannot be allocated immediately, **all the resources it currently holds are preempted** (released).
    - **Circular wait**: impose a **total ordering** of all resource types, and require each process to request resources **in increasing order** of enumeration.

    寫法提示：對四個條件各寫一個破解方法；circular wait 的「資源編號、遞增申請」最常考（[3.1](#u3-1)）。

<div markdown="1">

**E-4.** What is a safe state? Is every unsafe state a deadlock?

（中文：什麼是 safe state？unsafe 一定會死結嗎？）

</div>

??? quiz "看英文參考答案"
    A state is **safe** if the system can allocate resources to each process, up to its maximum, **in some order** and still avoid a deadlock. In other words, there exists a **safe sequence** $\langle P_1,P_2,\dots,P_n\rangle$ such that the remaining needs of each $P_i$ can be satisfied by the currently available resources plus the resources held by all $P_j$ with $j<i$.

    A safe state is not a deadlocked state. An **unsafe state may lead to a deadlock**, but **not every unsafe state is a deadlock**: whether a deadlock actually occurs depends on the future requests of the processes. **Deadlock avoidance** (for example, the **banker's algorithm**) grants a request only if the system remains in a safe state.

    寫法提示：safe sequence 的定義要寫完整（現有的 ＋ 前面的人還回來的）；第二問答 not necessarily（[3.0](#u3-0)）。

<div markdown="1">

**E-5.** How can a system recover from a deadlock?

（中文：偵測到死結之後怎麼復原？）

</div>

??? quiz "看英文參考答案"
    There are two approaches:

    1. **Process termination**: **abort all deadlocked processes**, which is costly because their partial computations are lost; or **abort one process at a time** until the deadlock cycle is eliminated, which has the overhead of running the detection algorithm after each abort.
    2. **Resource preemption**: take resources away from some processes and give them to others. Three issues must be addressed:
        - **Selecting a victim**: choose the process whose preemption costs the least.
        - **Rollback**: return the victim to some safe state and restart it from that state (the simplest way is a total rollback).
        - **Starvation**: make sure the same process is not always chosen as the victim, for example by including the number of rollbacks in the cost factor.

    寫法提示：resource preemption 的三個問題（victim、rollback、starvation）是課本條列，三個都要寫（[3.0](#u3-0)）。

### 3.6 考古題變化題 {#u3-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

**考古變化 1.**（改自 115 Q3a、112 Q8a・應用）下面四種做法，各自破壞了死結四個必要條件中的哪一個？(a) 所有資源編號，只能依遞增的順序申請 (b) process 開始執行前，一次申請所有需要的資源 (c) 申請不到新資源時，先放掉手上所有的資源 (d) 印表機改用 spooling（大家把要印的東西丟到佇列，由一個 daemon 負責印）

??? quiz "看完整解答"
    - **跟原題差在哪**：原題要你列出方法；這題反過來，給方法要對回條件。
    - **(a) circular wait**：大家都照同一個順序申請，等待的關係不可能繞成一圈。
    - **(b) hold and wait**：手上有資源的人不會再等別的資源（一次全拿到，或什麼都不拿）。
    - **(c) no preemption**：等不到就放掉，等於資源可以被「搶回來」。
    - **(d) mutual exclusion**：從 process 的角度，印表機變成可以共用（大家都只是寫進佇列）。


**考古變化 2.**（改自 107 Q1(4)、105 Q1(2)・實際算）用 bankers algorithm。5 個 process、三種資源 A、B、C，Available ＝ (1, 1, 1)。Allocation：P0 (1,0,2)、P1 (0,1,1)、P2 (2,1,0)、P3 (1,1,1)、P4 (0,0,1)；Max：P0 (3,2,3)、P1 (1,3,2)、P2 (4,2,2)、P3 (2,2,2)、P4 (2,1,3)。(1) 現在是 safe state 嗎？(2) P1 申請 (1, 0, 0)，能不能馬上給？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說明 avoidance 怎麼運作；這題用 banker's algorithm 真的算一次。
    - **Need ＝ Max − Allocation**：P0 (2,2,1)、P1 (1,2,1)、P2 (2,1,2)、P3 (1,1,1)、P4 (2,1,2)。
    - **(1) safety 演算法**（每次找 Need ≤ Work 的，做完把它的 Allocation 加回 Work）：
        - Work (1,1,1)：只有 P3 的 (1,1,1) 夠 → Work 變 (2,2,2)
        - P0 (2,2,1) 夠 → (3,2,4)；P1 (1,2,1) 夠 → (3,3,5)；P2 (2,1,2) 夠 → (5,4,5)；P4 → (5,4,6)
        - 找得到順序 **P3, P0, P1, P2, P4**，是 **safe state**。
    - **(2) 先假裝給**：Available 變 (0,1,1)，P1 的 Allocation 變 (1,1,1)、Need 變 (0,2,1)。
        - 再跑一次 safety：Work (0,1,1)，P0 要 (2,2,1)、P1 要 (0,2,1)（B 不夠）、P2 要 (2,1,2)、P3 要 (1,1,1)（A 不夠）、P4 要 (2,1,2)，**一個都做不完**。
        - 會進入 unsafe state，所以**不能馬上給**，P1 要等。
    - **注意**：(1, 0, 0) 沒有超過 P1 的 Need，也沒有超過 Available，「資源夠」不代表可以給，還要檢查給了之後是否 safe。

    我用程式跑過 safety 演算法，兩小題的結論都一樣。


**考古變化 3.**（改自 103 Q1・換數字・反過來問）(a) 電腦有 10 台磁帶機，每個 process 最多需要 3 台。最多幾個 process 同時搶，保證不會死結？(b) 如果固定 4 個 process，每個 process 最多可以需要幾台？

??? quiz "看完整解答"
    - **跟原題差在哪**：(a) 換數字；(b) 反過來，固定 process 數，問每個人最多能要多少。
    - **公式**：m 份資源、n 個 process、每個最多需要 k 份，不會死結的條件是 $n(k-1)+1\le m$（最壞情況每個人都只差一份，還要剩一份給某個人）。
    - **(a)**：$n\times2+1\le10$ → $n\le4.5$，最多 **4 個**。5 個時，每人先拿 2 台用掉 10 台，大家都在等第 3 台，就死結了。
    - **(b)**：$4(k-1)+1\le10$ → $k\le3.25$，最多 **3 台**。如果每人最多要 4 台，可能分配成 3、3、2、2，10 台全用完，每個人都還差至少 1 台，就死結了。

    我用程式把所有可能的分配狀態都檢查過，(a) 4 個不會死結、5 個會；(b) 每人最多 3 台不會死結、4 台會。


**考古變化 4.**（改自 100 Q3・改條件）5 位哲學家，筷子放在桌子中間（任何兩支都可以用），每人吃飯要 2 支、一次拿一支。(a) 桌上放 6 支筷子時，還需要原題那個「不給最後一支」的規則嗎？(b) 一般來說，$p$ 位哲學家至少要幾支筷子，才完全不用規則？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題 5 支筷子要靠規則避免死結；這題多放一支，看看規則還需不需要，並跟 103 Q1 的公式連起來。
    - **(a) 不需要**：死結只會發生在「每個人都拿著一支、桌上沒筷子」。5 個人各拿一支只用掉 5 支，桌上一定還剩 1 支，總有人能湊成 2 支，吃完放回 2 支，大家輪流吃得完。
    - **(b)**：套 103 Q1 的公式，每人最多需要 $k=2$ 份：$p(2-1)+1\le c$，所以 **$c\ge p+1$** 支。

    我用程式把所有拿筷子的狀態檢查過，6 支時不會死結、5 支時會。


**考古變化 5.**（改自 104 Q8(2)・換情境）P1、P2、P3、P4 的 timestamp 是 10、20、30、40（越小越老）。P3 持有資源 R，P1、P2、P4 依序來申請 R。用 wait-die 和 wound-wait 各會發生什麼事？

??? quiz "看完整解答"
    - **跟原題差在哪**：申請的人變多，而且 wound-wait 會換人持有資源，後面的人要跟**新的持有者**比。
    - **wait-die**（老的等，年輕的死）：
        - P1（10）比 P3（30）老 → **P1 等**。
        - P2（20）比 P3 老 → **P2 等**。
        - P4（40）比 P3 年輕 → **P4 rollback**（之後用原本的 timestamp 40 重新開始，越來越老，最後一定輪得到）。
    - **wound-wait**（老的搶，年輕的等）：
        - P1 比 P3 老 → **P3 被 rollback**，R 給 P1。
        - P2（20）申請時，持有者是 P1（10），P2 比較年輕 → **P2 等**。
        - P4（40）比 P1 年輕 → **P4 等**。
    - **重點**：兩種方法都只讓「年輕的被 rollback」，不會有老的等年輕的又被年輕的等回來的循環，所以不會死結。


### 單元 3 小考 {#u3-quiz}

**3-1.** 為什麼「依編號遞增順序申請資源」能防止死結？

??? quiz "看答案"
    假設有循環 $P_0\to P_1\to\cdots\to P_0$，$P_i$ 持有 $R_i$ 在等 $R_{i+1}$，就得到 $R_0<R_1<\cdots<R_0$，矛盾。所以不可能有 circular wait。

## 單元 4：記憶體管理與虛擬記憶體 {#u4}

!!! key "一句話重點"
    邏輯位址要轉成實體位址。**什麼時候轉**（binding）、**怎麼轉**（paging、TLB）、**記憶體不夠時怎麼辦**（demand paging、置換、thrashing）是這個單元的三條主線。

### 4.0 觀念課：記憶體不夠時，誰要讓出來 {#u4-0}

#### paging 的想法

（計結教材 3.0 的「門牌對照表」講的是同一件事，可以先看那一節。）

把程式的位址空間切成一樣大的 **page**，實體記憶體切成一樣大的 **frame**。任何 page 可以放進任何 frame，用 page table 記錄對應。好處是不會有「中間有空隙但塞不下」的外部碎片。

#### page fault 時發生什麼事

1. 程式存取一個 page，查 page table，發現它不在記憶體（valid ＝ 0）。
2. 硬體產生 trap，交給作業系統。
3. 作業系統找到這個 page 在磁碟上的位置，再找一個空的 frame；**沒有空的就挑一個 page 踢出去**（如果它被改過，dirty bit ＝ 1，要先寫回磁碟）。
4. 從磁碟把 page 讀進那個 frame。
5. 更新 page table：填上 frame 號碼，valid 設成 1。
6. 重新執行剛剛那條指令。

<figure class="fig">
<svg viewBox="0 0 360 248" role="img" aria-label="page fault 的六個步驟：1 程式執行 load M，查 page table；2 valid 是 0，產生 trap 給作業系統；3 作業系統找到這個 page 在磁碟上的位置；4 把它讀進一個空的 frame；5 更新 page table，填上 frame 號碼、valid 設成 1；6 重新執行 load M。">
<text x="56" y="28" text-anchor="middle" dominant-baseline="central" class="sm">程式</text>
<rect class="box" x="8" y="40" width="96" height="44" rx="6"/>
<text x="56" y="62" text-anchor="middle" dominant-baseline="central" class="mono">load M</text>
<text x="180" y="28" text-anchor="middle" dominant-baseline="central" class="sm mono">page table</text>
<rect class="box" x="132" y="40" width="64" height="44"/>
<rect class="fa" x="196" y="40" width="32" height="44"/>
<text x="164" y="62" text-anchor="middle" dominant-baseline="central" class="sm mono">frame ?</text>
<text x="212" y="62" text-anchor="middle" dominant-baseline="central" class="mono ta">0</text>
<text x="304" y="28" text-anchor="middle" dominant-baseline="central" class="sm">作業系統</text>
<rect class="fb" x="256" y="40" width="96" height="44" rx="6"/>
<text x="304" y="62" text-anchor="middle" dominant-baseline="central" class="mono tb">trap</text>
<rect class="box" x="256" y="176" width="96" height="48" rx="6"/>
<text x="304" y="192" text-anchor="middle" dominant-baseline="central" class="sm">磁碟</text>
<rect class="fc" x="282" y="202" width="44" height="16" rx="3"/>
<text x="304" y="210" text-anchor="middle" dominant-baseline="central" class="sm mono tc">M</text>
<rect class="box" x="132" y="128" width="96" height="24"/>
<text x="180" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono ">…</text>
<rect class="box" x="132" y="152" width="96" height="24"/>
<text x="180" y="164" text-anchor="middle" dominant-baseline="central" class="sm mono ">…</text>
<rect class="fc" x="132" y="176" width="96" height="24"/>
<text x="180" y="188" text-anchor="middle" dominant-baseline="central" class="sm mono tc">M</text>
<rect class="box" x="132" y="200" width="96" height="24"/>
<text x="180" y="212" text-anchor="middle" dominant-baseline="central" class="sm mono ">…</text>
<text x="124" y="176" text-anchor="end" dominant-baseline="central" class="sm">實體記憶體</text>
<line class="arw" x1="104" y1="62" x2="122.0" y2="62.0"/>
<polygon class="ah" points="131.0,62.0 122.0,67.0 122.0,57.0"/>
<circle class="fa" cx="118" cy="46" r="9"/>
<text x="118" y="46" text-anchor="middle" dominant-baseline="central" class="sm mono ta">1</text>
<line class="arw" x1="228" y1="62" x2="246.0" y2="62.0"/>
<polygon class="ah" points="255.0,62.0 246.0,67.0 246.0,57.0"/>
<circle class="fa" cx="242" cy="46" r="9"/>
<text x="242" y="46" text-anchor="middle" dominant-baseline="central" class="sm mono ta">2</text>
<line class="arw" x1="304" y1="84" x2="304.0" y2="166.0"/>
<polygon class="ah" points="304.0,175.0 299.0,166.0 309.0,166.0"/>
<circle class="fa" cx="318" cy="128" r="9"/>
<text x="318" y="128" text-anchor="middle" dominant-baseline="central" class="sm mono ta">3</text>
<line class="arw-a" x1="256" y1="200" x2="237.2" y2="191.7"/>
<polygon class="ah-a" points="229.0,188.0 239.3,187.1 235.2,196.2"/>
<circle class="fa" cx="242" cy="178" r="9"/>
<text x="242" y="178" text-anchor="middle" dominant-baseline="central" class="sm mono ta">4</text>
<line class="arw" x1="180" y1="128" x2="180.0" y2="94.0"/>
<polygon class="ah" points="180.0,85.0 185.0,94.0 175.0,94.0"/>
<circle class="fa" cx="194" cy="106" r="9"/>
<text x="194" y="106" text-anchor="middle" dominant-baseline="central" class="sm mono ta">5</text>
<path class="arw" d="M150,85 Q100,128 64.3,91.4"/>
<polygon class="ah" points="58.0,85.0 67.9,87.9 60.7,94.9"/>
<circle class="fa" cx="100" cy="120" r="9"/>
<text x="100" y="120" text-anchor="middle" dominant-baseline="central" class="sm mono ta">6</text>
</svg>
<figcaption>圖上的編號就是上面的六個步驟；③ 到 ④ 要讀磁碟，是最花時間的部分</figcaption>
</figure>

只在用到時才載入 page，叫 **demand paging**。

#### 踢誰出去：三種策略

3 個 frame，存取順序 7, 0, 1, 2, 0, 3, 0, 4：

| 策略 | 規則 | page fault 次數 |
|---|---|---|
| FIFO | 踢最早進來的 | 7 |
| LRU | 踢最久沒被用到的 | 6 |
| OPT | 踢「未來最晚才會用到」的（理論最佳，無法實作） | 6 |

FIFO 的過程（F 代表 page fault）：

| 存取 | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 |
|---|---|---|---|---|---|---|---|---|
| frame 內容 | 7 | 7,0 | 7,0,1 | 0,1,2 | 0,1,2 | 1,2,3 | 2,3,0 | 3,0,4 |
| 結果 | F | F | F | F | hit | F | F | F |

LRU 在第 6 次存取（3）時，踢的是 1（0 剛剛才用過），所以之後的 0 會 hit，少一次 fault。

LRU 的過程：

| 存取 | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 |
|---|---|---|---|---|---|---|---|---|
| frame 內容 | 7 | 7,0 | 7,0,1 | 2,0,1 | 2,0,1 | 2,0,3 | 2,0,3 | 4,0,3 |
| 踢掉 | | | | 7（最久沒用） | | 1 | | 2 |
| 結果 | F | F | F | F | hit | F | hit | F |

OPT 的過程（看**未來**誰最晚才用到）：存取 2 時，未來是 0, 3, 0, 4，7 再也不會用到 → 踢 7；存取 3 時，1 和 2 之後都不會用到 → 踢其中一個（例如 1）；存取 4 時隨便踢一個不再用的。一樣是 6 次。這個短字串剛好打平，長一點的字串（下面延伸練習）OPT 會明顯最少。

動畫可以換策略、改 frame 數，也可以把延伸練習的長字串貼進去對答案：

<div class="viz" data-viz="paging" data-refs="7,0,1,2,0,3,0,4" data-frames="3" data-algo="lru"></div>

#### EAT：為什麼 page fault 要極少

$$\begin{aligned}\text{EAT}=\;&(1-p)\times\text{記憶體存取時間}\\&+p\times\text{page fault 處理時間}\end{aligned}$$

記憶體 100 ns、page fault 10 ms（$10^7$ ns），$p=0.001$：
$$0.999\times100+0.001\times10^7\approx10100\text{ ns}$$

每 1000 次才 fault 一次，平均存取時間就變成原本的 **100 倍**。這就是考題要你算「page fault rate 要低於多少」的原因。

**公式就是加權平均**：$p$ 是 page fault 的機率。沒 fault（機率 $1-p$）時只花一次記憶體存取的時間；fault（機率 $p$）時要花處理 page fault 的時間（讀磁碟為主）。兩種情況的時間乘上各自的機率再相加。

#### thrashing

行程太多、每個人分到的 frame 太少，每個行程都在不斷 page fault、等磁碟，CPU 使用率反而掉下來。作業系統看到 CPU 閒著，又加更多行程進來，情況更糟。解法是用 working set 估計每個行程需要多少 frame，不夠時**減少**同時執行的行程數。

<figure class="fig">
<svg viewBox="0 0 360 196" role="img" aria-label="CPU 使用率隨著同時執行的 process 數增加而上升，到某個點之後急速下降，那一段就是 thrashing。">
<line class="ln" x1="40" y1="168" x2="344" y2="168"/>
<line class="ln" x1="40" y1="168" x2="40" y2="18"/>
<polygon class="ah" points="350,168 341,163 341,173"/>
<polygon class="ah" points="40,12 35,21 45,21"/>
<path class="arw-a" d="M42,162 C110,48 190,30 232,40 C262,48 270,120 300,160"/>
<text x="48" y="12" text-anchor="start" dominant-baseline="central" class="sm">CPU 使用率</text>
<text x="344" y="186" text-anchor="end" dominant-baseline="central" class="sm">同時執行的 process 數</text>
<text x="300" y="74" text-anchor="middle" dominant-baseline="central" class="sm mono ta">thrashing</text>
<line class="arw-a" x1="296" y1="84" x2="279.2" y2="103.9"/>
<polygon class="ah-a" points="274.0,110.0 275.7,101.0 282.6,106.8"/>
<line class="dash" x1="232" y1="40" x2="232" y2="168"/>
<text x="132" y="122" text-anchor="middle" dominant-baseline="central" class="sm">還在上升：多一個 process</text>
<text x="132" y="140" text-anchor="middle" dominant-baseline="central" class="sm">就多利用一點 CPU</text>
</svg>
<figcaption>過了虛線那一點，再加 process 只會讓大家搶 frame、一直等磁碟，CPU 使用率急速往下掉</figcaption>
</figure>

!!! key "記憶體題要做什麼"
    | 題目問 | 怎麼做 |
    |---|---|
    | 邏輯位址轉實體位址 | page ＝ 位址 ÷ page 大小、offset ＝ 餘數；查表得 frame；實體 ＝ frame × page 大小 ＋ offset（[4.1](#u4-1)） |
    | page table 幾個 entry、多大 | $2^{\text{虛擬位址位元}-\text{offset 位元}}$ 個，再乘每個 entry 的大小（[4.2](#u4-2)） |
    | FIFO／LRU／OPT／clock 幾次 fault | 畫表一格一格走，寫出每次踢掉誰（[4.3](#u4-3)） |
    | EAT（TLB、page fault） | 加權平均：機率 × 那種情況的時間 |
    | page fault rate 上限 | 把 EAT 的不等式解出 $p$ |
    | thrashing 怎麼處理 | working set 總和 ＞ frame 數，就暫停一些 process |

    名詞對照：demand paging（用到才載入）、page fault（缺頁）、valid bit（有效位元）、dirty bit（修改位元）、reference bit（存取位元）、working set（工作集）。

!!! read "還不懂？看別人怎麼講"
    - **講義**：[周志遠講義下載頁](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999)的 Ch8 Memory Management、Ch9 Virtual Memory。
    - **延伸練習**：恐龍書的經典參考字串 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1（3 個 frame），自己算完對答案：FIFO 15 次、LRU 12 次、OPT 9 次。再試 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 用 FIFO：3 個 frame 是 9 次、4 個 frame 反而 10 次，這就是 **Belady's anomaly**。
    - **中文文章**：iThome 鐵人賽[談 FIFO、LRU、OPT 的文章](https://ithelp.ithome.com.tw/articles/10373783)。

#### 換你試試

**T-1.** 3 個 frame，存取 1, 2, 3, 1, 4, 1。FIFO 和 LRU 各幾次 page fault？

??? quiz "看答案"
    **FIFO**：

    | 存取 | 1 | 2 | 3 | 1 | 4 | 1 |
    |---|---|---|---|---|---|---|
    | frame | 1 | 1,2 | 1,2,3 | 1,2,3 | 4,2,3 | 4,1,3 |
    | 結果 | F | F | F | hit | F（踢最早進來的 1） | F（踢 2） |

    **5 次**。1 雖然剛用過，FIFO 只看進來的順序，照樣把它踢掉。

    **LRU**：前四次一樣；存取 4 時，最久沒用的是 2（1 剛剛才用過）→ 踢 2，變成 1,4,3；最後的 1 **hit**。共 **4 次**。

**T-2.** 為什麼 dirty bit 能讓置換變快？

??? quiz "看答案"
    沒被改過的 page（dirty ＝ 0）磁碟上的副本還是最新的，直接丟掉就好，不用寫回磁碟。

### 4.1 位址繫結與轉換 {#u4-1}

!!! example "112 Q6a（6%）：compile time、load time、execution time 的位址繫結差別"
    - **compile time**：編譯時就知道程式會放在哪，產生**絕對位址**。位置改了就要重新編譯。
    - **load time**：編譯產生**可重定位**的位址，載入時才決定實際位址。載入後就不能再移動。
    - **execution time**：執行時才轉換，process 在執行中可以被搬動。需要硬體（MMU）支援，現代 OS 都用這種。

- **MMU（memory-management unit）**：把邏輯 page 對應到實體 frame 的硬體。（113 Q8d）
- **TLB（translation look-aside buffer）**：page table 的 cache。（113 Q8c）
- **inverted page table** 每個 entry 要存 **address-space identifier（ASID）**，因為整個系統只有一張表。（114 Q8f）
- **reentrant code（pure code）**：不會修改自己的程式碼，可以讓多個 process 共用。（114 Q8e）

!!! example "114 Q7（10%）：TLB 運作的五個步驟"
    1. CPU 產生邏輯位址，取出 page number。
    2. 把 page number 送到 TLB 比對。
    3. TLB hit：直接取得 frame number，組成實體位址存取記憶體。
    4. TLB miss：到記憶體裡的 page table 查 frame number。
    5. 把這組 (page number, frame number) 放進 TLB（滿了就依策略置換一個），再存取記憶體。

!!! example "113 Q5a（6%）：real-time system 的三種位址轉換方法"
    1. **real-addressing mode**：程式直接使用實體位址，不轉換，最快、最可預測。
    2. **relocation register mode**：用一個 relocation register，實體位址 ＝ 暫存器值 ＋ 邏輯位址。
    3. **full virtual memory**：完整的 page table 與 TLB，彈性最大，但轉換時間不確定，對即時系統不利。

#### 一個邏輯位址怎麼轉：數字例子

page 大小 1 KB（1024 bytes），page table：page 0 → frame 5、page 1 → frame 2、page 2 → frame 7、page 3 → frame 1，其他 page 不在記憶體。

**邏輯位址 3085**：

- **page 號碼（3）**：$3085\div1024=3$ 餘 13。
- **offset（13）**：餘數，是 page 裡的第幾個 byte，轉換時不變。
- **查表（frame 1）**：page 3 → frame 1。
- **實體位址（1037）**：$1\times1024+13=1037$。

**邏輯位址 5000**：$5000\div1024=4$ 餘 904，page 4 不在記憶體（valid ＝ 0）→ **page fault**。

page 大小是 2 的次方時，除法就是切位元：1 KB ＝ $2^{10}$，邏輯位址的**低 10 位元**是 offset，上面的位元是 page 號碼。3085 的二進位是 `11 0000001101`：上面的 `11` 是 3，下面 10 位元是 13。

#### page table 太大怎麼辦

111 Q9 的 48-bit 位址、4 KB page，一張表有 $2^{36}$ 個 entry，每個 4 bytes 就要 256 GB，根本放不下。三種解法：

- **多層 page table**：把 page 號碼再切成幾段，外層表指向內層表，沒用到的區域不用建內層表（[計結 3.0](arch.html#u3-0) 有兩層的算例）。代價是 TLB miss 時要多查幾次記憶體。
- **hashed page table**：用 page 號碼做雜湊，同一格掛一串，適合 64-bit 的位址空間。
- **inverted page table**：整個系統只有一張表，**每個 frame 一個 entry**，記錄「這個 frame 放的是哪個 process 的哪一頁」，所以要存 ASID。省記憶體，但查表要搜尋，通常搭配雜湊。

### 4.2 計算模板 {#u4-2}

| 題目 | 公式 |
|---|---|
| page table 有幾個 entry | $2^{\text{虛擬位址位元}-\text{offset 位元}}$ |
| bitmap 大小 | 記憶體 ÷ 配置單位 ＝ 位元數 |
| 有 TLB 的有效存取時間 | $h\times t_{\text{TLB hit}}+(1-h)\times t_{\text{miss}}$ |
| demand paging 的 EAT | $(1-p)\times t_{\text{mem}}+p\times t_{\text{fault}}$ |

**有 TLB 的 EAT 怎麼算**（單層 page table）：每次都先查 TLB。

- **TLB hit**（機率 $h$）：TLB 時間 ＋ 1 次記憶體（拿資料）。
- **TLB miss**（機率 $1-h$）：TLB 時間 ＋ 1 次記憶體（查 page table）＋ 1 次記憶體（拿資料）。

兩種情況乘上機率相加。$k$ 層 page table 時，miss 要多查 $k$ 次記憶體。題目只問「轉換的開銷」（111 Q6）時，就不算拿資料的那一次。

!!! example "111 Q9（10%）：48-bit 虛擬位址、32-bit 實體位址、4 KB page，page table 有幾個 entry"
    $2^{48}/2^{12}=2^{36}$ 個（每個 process 一張單層 page table 時）。

!!! example "111 Q8（10%）：8 GB RAM 以 4 KB 為單位配置，用 bitmap 記錄空閒記憶體要幾 KB"
    單位數 $=2^{33}/2^{12}=2^{21}$，每單位 1 位元 → $2^{21}$ 位元 $=2^{18}$ bytes $=256$ KB。

!!! example "111 Q6（10%）：讀 page table 500 ns、TLB 查詢 50 ns，miss 時才查 page table。平均開銷 ≤ 100 ns 需要多少 hit rate"
    每次都要查 TLB（50 ns），miss 時才多花 500 ns 查 page table，所以平均開銷是 $50+(1-h)\times500$ ns。要它 ≤ 100：

    $$\begin{aligned}50+(1-h)\times500&\le100\\(1-h)\times500&\le50\\1-h&\le0.1\end{aligned}$$

    所以 **$h\ge0.9$**，hit rate 至少 90%。

!!! example "113 Q6b（4%）：記憶體存取 150 ns、page fault 處理 60000 ns，EAT < 175 ns 時 page fault rate 上限"
    $$(1-p)\times150+p\times60000<175$$

    展開：$150-150p+60000p<175$ → $59850p<25$ → $p<\frac{25}{59850}\approx4.18\times10^{-4}$。

    也就是大約每 2400 次存取才能有 1 次 page fault。

### 4.3 置換與 thrashing {#u4-3}

- **dirty bit（modify bit）**：page 內容被改過就設為 1，被置換時才需要寫回磁碟。（115 Q1b）
- **thrashing**：process 花在 paging 的時間比執行還多。（113 Q8e）
- **copy-on-write**（115 Q3b）：`fork()` 後父子行程先**共用**相同的 page，標記為 copy-on-write；任何一方要**寫入**某個 page 時，才複製那一頁。省下複製整個位址空間的時間和記憶體（尤其子行程馬上 `exec()` 時）。

!!! example "112 Q6b（4%）：用 working-set model 解決 thrashing"
    定義 working-set window $\Delta$（最近 $\Delta$ 次存取），process $i$ 在這段時間用到的 page 集合大小是 $WSS_i$。

    總需求 $D=\sum WSS_i$。如果 $D$ 大於可用的 frame 數 $m$，就會 thrashing，OS **暫停（swap out）某個 process**，把它的 frame 分給其他人；$D$ 夠小時再載入新的 process。這樣既能避免 thrashing，又能維持最高的 multiprogramming 程度。

#### LRU 太貴：用 reference bit 近似（second-chance／clock）

真正的 LRU 每次存取都要更新順序，硬體負擔太大。常見的近似做法：每個 frame 一個 **reference bit**，被存取就設成 1。frame 排成一圈，指標像時鐘的指針：

- 指到的 page bit ＝ 1：給它**第二次機會**，bit 清成 0，指標往下走。
- 指到的 page bit ＝ 0：踢掉它，新的 page 放進來（bit 設 1），指標往下走一格。

3 個 frame，存取 1, 2, 3, 4, 2, 5, 2（括號裡是 reference bit）：

| 存取 | frame 0 | frame 1 | frame 2 | 結果 | 說明 |
|---|---|---|---|---|---|
| 1, 2, 3 | 1 (1) | 2 (1) | 3 (1) | F F F | 依序放進空的 frame，指標回到 frame 0 |
| 4 | 4 (1) | 2 (0) | 3 (0) | F | 三個 bit 都是 1，繞一圈全清成 0，回到 frame 0 踢掉 1 |
| 2 | 4 (1) | 2 (1) | 3 (0) | hit | 2 的 bit 設回 1 |
| 5 | 4 (1) | 2 (0) | 5 (1) | F | 指標在 frame 1：2 的 bit 是 1，清掉、放過它；frame 2 的 3 是 0，踢掉 |
| 2 | 4 (1) | 2 (1) | 5 (1) | hit | 2 剛剛被放過，所以 hit |

共 **5 次** fault。FIFO 在存取 5 時會踢掉最早進來的 2，最後的 2 就 fault，共 6 次；這裡 clock 跟 LRU 一樣是 5 次。**所有 bit 都是 1 時，clock 就退化成 FIFO**。

#### 每個 process 分幾個 frame

- **平均分配**：$m$ 個 frame、$n$ 個 process，每個分 $m/n$。
- **按大小比例分配（proportional）**：process $i$ 大小 $s_i$、總和 $S$，分到 $\frac{s_i}{S}\times m$。例：64 個 frame，兩個 process 大小 20 和 140 page：$\frac{20}{160}\times64=8$、$\frac{140}{160}\times64=56$。
- **global replacement**：要踢 page 時，可以從**所有** process 的 frame 挑（整體效率較好，但一個 process 的 fault 次數會受別人影響）。**local replacement**：只能從**自己的** frame 挑。

### 4.4 程式寫法與 page fault：二維陣列、次數的上下界 {#u4-pf}

103、110 年各考一題「初始化二維陣列會發生幾次 page fault」（10%），兩題幾乎一樣，只換了數字和存放方式。103、106 年也各考一題 page fault 次數的上下界（10%）。

#### 陣列在記憶體裡是一長條

記憶體是一維的，二維陣列要排成一長條，有兩種排法：

| 排法 | 順序 | 誰在用 |
|---|---|---|
| row-major（列優先） | 一列接一列：A[0][0], A[0][1], …, A[0][n−1], A[1][0], … | C 語言 |
| column-major（行優先） | 一行接一行：A[0][0], A[1][0], …, A[n−1][0], A[0][1], … | Fortran；題目會指定 |

$n\times n$ 的陣列裡，A[i][j] 是第幾個元素（從 0 數）：row-major 是 $i\times n+j$，column-major 是 $j\times n+i$。

#### 迴圈順序要跟著排法走

像書架上的書一排一排放好：照順序一本一本拿，一排拿完才走到下一排；如果每次都換一排只拿一本，每拿一本都要走一趟。

- **順序一致**（row-major 用「i 在外、j 在內」；column-major 用「j 在外、i 在內」）：連續存取，一頁的元素全部用完才換下一頁 → **page fault 次數 ＝ 陣列佔幾頁**。
- **順序相反**：每次存取都跳到另一頁。內層迴圈一圈會碰到很多頁，frame 卻只有幾個，回到同一頁時它早就被換掉 → **每一次存取都 page fault**。

#### 解題步驟

1. **一頁放幾個元素** ＝ page 大小 ÷ 元素大小；**陣列佔幾頁** ＝ 元素總數 ÷ 一頁放幾個。
2. **程式在 page 0，不會被換掉**：每個指令都要從 page 0 讀，用 LRU 時它永遠是最近用過的。所以三個 frame 裡，陣列只能用 **2 個**。
3. **陣列從頁的開頭開始**：A[0][0] 的位置剛好是 page 大小的倍數（例如 200），所以每一頁剛好裝滿一段，不會有半頁。
4. **判斷迴圈順序**：一致 → 答案 ＝ 陣列頁數；相反 → 看內層迴圈一圈碰到幾頁，比可用的 frame 多，就是每次都 fault，答案 ＝ 元素總數。

!!! example "103 Q2（10%）：double A[200][200]，column-major，A[0][0] 在位置 200，page 200 bytes，3 個 frame（frame 0 放程式），LRU"
    **條件**：double 8 bytes；frame 0 一直放程式（page 0），另外兩個一開始是空的。

    - **一頁放幾個元素（25）**：200 ÷ 8。
    - **陣列佔幾頁（1600）**：$200\times200=40000$ 個元素 ÷ 25。
    - **(a) i 在外、j 在內（40000 次）**：column-major 要 j 在外才是連續的，這題相反。內層 j 每加 1，位置跳 200 個元素 ＝ 8 頁；內層一圈碰到 200 個不同的頁，只有 2 個 frame 可以用，回來時早被換掉 → **每次存取都 fault**，共 40000 次。
    - **(b) j 在外、i 在內（1600 次）**：跟 column-major 一致，連續存取，每頁的 25 個元素用完才換頁 → 每頁 fault 一次，共 1600 次。

    用程式照 LRU 跑過全部 40000 次存取（含每次讀 page 0 的指令），結果是 40000 和 1600。

!!! example "110 Q5（10%）：double a[400][400]，row-major，a[0][0] 在位置 400，page 400 bytes，其他條件同 103 Q2"
    - **一頁放幾個元素（50）**：400 ÷ 8。
    - **陣列佔幾頁（3200）**：$400\times400=160000$ 個元素 ÷ 50。
    - **(a) j 在外、i 在內（160000 次）**：row-major 要 i 在外才連續，這題相反。i 每加 1 跳 400 個元素 ＝ 8 頁，每次都 fault。
    - **(b) i 在外、j 在內（3200 次）**：連續存取，每頁 fault 一次。

    這題換成 row-major，所以答案跟 103 Q2 的 (a)、(b) 反過來：**哪個順序快要看排法，不是固定的**。

#### page fault 次數的上下界

!!! example "103 Q3、106 Q2（各 10%）：m 個 frame（一開始全空），reference string 長度 n、出現 p 個不同的 page。不管用哪一種置換演算法，page fault 次數的下界和上界？"
    - **下界（p）**：一開始記憶體是空的，每個不同的 page 第一次出現時一定不在記憶體裡，所以至少 p 次。
    - **上界（n）**：最壞的情況是每一次存取都 fault，n 次。

    **補充**：如果 $p\le m$，所有 page 都裝得下，不會有任何 page 被換掉，剛好 p 次。上界 n 要在 $p>m$ 時才可能發生，例如只有 1 個 frame、reference string 每次都換一個 page。

#### 觀念小考

<div class="mcq" data-ans="1" markdown="1">

**C-1.** C 語言的 `int a[100][100]`（row-major），要把整個陣列設成 0，哪一種迴圈順序 page fault 最少？

1. `for (i…) for (j…) a[i][j] = 0;`
2. `for (j…) for (i…) a[i][j] = 0;`
3. 兩種一樣
4. 看用哪一種置換演算法

??? quiz "看解析"
    **A**。C 是 row-major，同一列的元素連在一起。i 在外、j 在內，就是一列一列照記憶體的順序存取，一頁用完才換下一頁。B 每次都跳一整列，容易每次都 fault。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-2.** page 4 KB、int 4 bytes、`int a[1024][1024]`（row-major），陣列可以用 2 個 frame。用 `for (j…) for (i…) a[i][j] = 0;`，大約幾次 page fault？

1. 1024
2. 1024 × 1024
3. 2048
4. 512

??? quiz "看解析"
    **B**。一列有 1024 個 int ＝ 4 KB，剛好一頁。j 固定時 i 從 0 跑到 1023，每次換一列，就是換一頁；一圈碰到 1024 頁，只有 2 個 frame，每次都 fault，共 $1024\times1024$ 次。改成 i 在外、j 在內，只要 1024 次（每列一頁）。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-3.** 這類題目中，程式所在的 page 0 為什麼不會被 LRU 換掉？

1. 作業系統規定程式的 page 不能換
2. 每個指令都要從 page 0 讀，它永遠是最近用過的
3. page 0 是唯讀的
4. page 0 在 TLB 裡

??? quiz "看解析"
    **B**。LRU 換掉「最久沒用」的 page。每執行一個指令都要讀 page 0，所以它永遠是「剛剛用過」，輪不到它。結果就是陣列只能用剩下的 frame。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-4.** 3 個 frame（一開始全空），reference string 是 1, 2, 1, 2, 3, 1。不管用哪一種置換演算法，page fault 幾次？

1. 3
2. 6
3. 4
4. 不一定

??? quiz "看解析"
    **A. 3**。只有 3 個不同的 page（p ＝ 3），frame 也有 3 個，全部裝得下，不用換掉任何 page。每個 page 只有第一次出現時 fault，共 3 次，剛好等於下界 p。

</div>

**W-1.** 用自己的話說明：為什麼迴圈順序跟陣列的排法相反時，**每一次**存取都會 page fault？

??? quiz "看參考答案"
    順序相反時，內層迴圈每走一步就跳到另一頁，走一圈會碰到很多不同的頁（103 Q2 是 200 頁）。陣列只有 2 個 frame，等到下一圈回到同一頁時，它早就被後面的頁換掉了，所以每次都要重新載入。

    **自我檢查**：有沒有比較「內層一圈碰到幾頁」和「可用的 frame 數」？前者比較多，才會每次都 fault。

### 4.5 記憶體配置：連續配置、segmentation、buddy system {#u4-alloc}

100、104、105 年考過：first／best／worst fit、內部和外部碎片、segment table 的位址轉換、buddy system、為什麼 stack algorithm 不會有 Belady's anomaly。

#### 連續配置：每個 process 佔一整段

最簡單的做法是每個 process 放在一段**連續**的記憶體，用兩個暫存器檢查和轉換：

- **relocation register**（base）：這段記憶體從哪裡開始。實體位址 ＝ 邏輯位址 ＋ base。
- **limit register**：這段有多長，邏輯位址超過就 trap（存取違規）。

102 Q5(3) 的是非題「relocation register 是 1877、邏輯位址 123，實體位址是 2000」是**對**的。

#### 有一堆空洞時，要放哪一個

process 來來去去，記憶體裡會有很多大小不一的空洞（hole）。新的 process 要放進去：

| 方法 | 選哪一個洞 | 特點 |
|---|---|---|
| **first fit** | 第一個夠大的 | 最快 |
| **best fit** | 夠大的裡面**最小**的 | 剩下的碎片最小，但要找遍全部 |
| **worst fit** | **最大**的 | 剩下的洞比較大、比較可能再利用，但實際效果通常最差 |

**例子**（恐龍書習題）：空洞依序 100K、500K、200K、300K、600K，依序來 212K、417K、112K、426K：

| 要求 | first fit | best fit | worst fit |
|---|---|---|---|
| 212K | 500K（剩 288K） | 300K（剩 88K） | 600K（剩 388K） |
| 417K | 600K（剩 183K） | 500K（剩 83K） | 500K（剩 83K） |
| 112K | 288K（剩 176K） | 200K（剩 88K） | 388K（剩 276K） |
| 426K | **放不下，要等** | 600K（剩 174K） | **放不下，要等** |

這一組 best fit 最好，四個都放得下。用程式模擬過。

#### 兩種碎片

| | 外部碎片（external fragmentation） | 內部碎片（internal fragmentation） |
|---|---|---|
| 是什麼 | 空的記憶體加起來夠，但**不連續**，放不下 | 分配的區塊比要的大，**多出來的那一點**浪費在區塊裡面 |
| 什麼時候出現 | 連續配置、segmentation | paging（最後一頁沒用滿）、buddy system |
| 解法 | compaction（把 process 搬在一起）、改用 paging | 用比較小的分配單位（代價是表變大） |

#### segmentation：照程式的邏輯切段

程式是由好幾段組成的：程式碼、全域變數、stack、heap……每一段（segment）各自連續放，**邏輯位址 ＝（段號 s, 段內位移 d）**：

1. 查 segment table 第 s 列，得到 base 和 limit。
2. 檢查 $d<\text{limit}$，否則 **trap**（定址錯誤）。
3. 實體位址 ＝ base ＋ d。

!!! example "100 Q4（15%）：用下面的 segment table 算實體位址"
    | segment | base | length |
    |---|---|---|
    | 0 | 219 | 700 |
    | 1 | 2315 | 15 |
    | 2 | 100 | 90 |
    | 3 | 1327 | 580 |
    | 4 | 1917 | 100 |

    | 邏輯位址 | 檢查 | 實體位址 |
    |---|---|---|
    | (a) 段 4、位移 50 | 50 ＜ 100 | 1917 ＋ 50 ＝ **1967** |
    | (b) 段 1、位移 20 | 20 ≥ 15 | **trap**（超出這一段） |
    | (c) 段 3、位移 500 | 500 ＜ 580 | 1327 ＋ 500 ＝ **1827** |
    | (d) 段 2、位移 400 | 400 ≥ 90 | **trap** |
    | (e) 段 0、位移 112 | 112 ＜ 700 | 219 ＋ 112 ＝ **331** |

    **注意**：位移等於 length 也要 trap，因為合法的位移是 0 到 length − 1。

#### buddy system：都切成 2 的次方

kernel 自己要記憶體時常用 buddy system：

- 從一大塊（例如 256 KB）開始，要求來了就**對半切**，切到「再切一半就不夠」為止。切出來的兩半互為 **buddy**。
- 例：要 21 KB → 256 切成 128＋128 → 128 切成 64＋64 → 64 切成 32＋32 → 給 **32 KB**（再切成 16 KB 就不夠了）。
- 釋放時，如果它的 buddy 也是空的，就**合併**回大的一塊，一路往上合併。

**優點**：合併很快（buddy 的位址一算就知道）。**缺點**：大小都是 2 的次方，會有內部碎片（要 21 KB 給 32 KB，浪費 11 KB）。

!!! example "105 Q3（15%）：(1) 動態記憶體配置的三種常見做法 (2) MMU 和 TLB 的用途 (3) 證明 stack algorithm 不會有 Belady's anomaly (4) buddy system 怎麼配置 kernel 記憶體"
    **(1)** first fit、best fit、worst fit（上面的表）。

    **(2)** **MMU**（memory-management unit）：執行時把邏輯位址轉成實體位址，並檢查權限（越界就 trap）。**TLB**：page table 的快取，存最近用過的 page → frame 對應，大部分轉換不用再去記憶體查 page table。

    **(3)** **stack algorithm** 的定義：任何時刻，n 個 frame 時記憶體裡的 page 集合，一定是 n＋1 個 frame 時的集合的**子集合**。

    LRU 是 stack algorithm：n 個 frame 時記憶體裡放的是「最近用過的 n 個不同 page」，n＋1 個 frame 時是「最近用過的 n＋1 個」，前者一定包含在後者裡。

    所以 n 個 frame 時會 hit 的存取，n＋1 個 frame 時也一定 hit；frame 變多，page fault 不會變多，不會有 Belady's anomaly。∎ FIFO 不是 stack algorithm，所以可能發生（[4.0](#u4-0) 的例子）。

    **(4)** buddy system：見上面。

!!! example "104 Q7(2)（4%）：外部碎片和內部碎片的差別"
    外部碎片：空的記憶體總量夠，但被切成很多不連續的小洞，放不下新的要求。內部碎片：分配出去的區塊比實際需要的大，多出來的部分在區塊裡面沒用到、別人也不能用。

#### 觀念小考

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 空洞依序是 50K、300K、120K，要放 100K。best fit 會放在哪裡？

1. 50K
2. 120K
3. 300K
4. 放不下

??? quiz "看解析"
    **B. 120K**。夠大的有 300K、120K，best fit 挑裡面最小的 120K（剩 20K）。first fit 會挑第一個夠大的 300K，worst fit 也挑 300K。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** paging 會產生哪一種碎片？

1. 只有外部碎片
2. 兩種都有
3. 都沒有
4. 只有內部碎片

??? quiz "看解析"
    **D**。每個 frame 大小一樣，任何空的 frame 都能用，沒有外部碎片；但最後一頁通常沒用滿，有內部碎片。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** buddy system 中，從 128 KB 開始，要 17 KB，會分到多大？

1. 32 KB
2. 17 KB
3. 64 KB
4. 16 KB

??? quiz "看解析"
    **A. 32 KB**。128 → 64 → 32，再切成 16 KB 就不夠 17 KB，所以給 32 KB，內部碎片 15 KB。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-4.** segment table 第 2 列是 base 1400、length 300。邏輯位址（2, 300）的結果是？

1. 1700
2. 1400
3. trap
4. 300

??? quiz "看解析"
    **C. trap**。合法的位移是 0～299，300 已經超出這一段，MMU 會產生 trap。

</div>

### 4.6 觀念小考 {#u4-concept}

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。

<div class="mcq" data-ans="2" markdown="1">

**C-1.** page 大小 1 KB，邏輯位址 2500 的 page 號碼和 offset 是？

1. page 2、offset 500
2. page 2、offset 452
3. page 3、offset 452
4. page 25、offset 0

??? quiz "看解析"
    **B**。$2500=2\times1024+452$。page 大小是 1024 不是 1000，A 是用 1000 去切的錯誤。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** clock（second-chance）演算法中，指標指到的 page reference bit 是 1，會怎樣？

1. 直接踢掉它
2. 先寫回磁碟再踢掉
3. 停止搜尋，這次不踢
4. 把 bit 清成 0、放過它，指標往下一個

??? quiz "看解析"
    **D**。bit ＝ 1 表示最近被用過，給它第二次機會；繞回來時如果還是 0（這段時間都沒被用），才踢掉。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** 哪一種置換策略會出現 Belady's anomaly（frame 變多，fault 反而變多）？

1. FIFO
2. LRU
3. OPT
4. 三種都不會

??? quiz "看解析"
    **A**。LRU 和 OPT 是 stack algorithm：$n$ 個 frame 裡的 page，一定也在 $n+1$ 個 frame 裡，所以 frame 變多不會更差。FIFO 沒有這個性質，1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 就是例子（[4.0](#u4-0) 的延伸練習）。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-4.** CPU 使用率很低、磁碟一直忙著 paging，作業系統應該？

1. 再加入更多 process，讓 CPU 有事做
2. 把 page 變小
3. 減少同時執行的 process（暫停一些）
4. 關掉 TLB

??? quiz "看解析"
    **C**。這是 thrashing：每個 process 分到的 frame 太少。A 正是讓情況更糟的做法（早期的排程器看到 CPU 閒就加 process）。暫停一些 process，把 frame 讓給其他人，fault 才會降下來。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** 64 個 frame，兩個 process 大小是 20 和 140 page，用按比例分配，第一個 process 分到幾個 frame？

1. 32
2. 8
3. 20
4. 56

??? quiz "看解析"
    **B**。$\frac{20}{20+140}\times64=8$，另一個分到 56（D）。A 是平均分配。

</div>

**W-1.** page 大小 2 KB，page table：page 0 → frame 3、page 1 → frame 7、page 2 不在記憶體、page 3 → frame 2。邏輯位址 1000、4500、7000 各轉成什麼？

??? quiz "看參考答案"
    | 邏輯位址 | page、offset | frame | 實體位址 |
    |---|---|---|---|
    | 1000 | 0、1000 | 3 | $3\times2048+1000=7144$ |
    | 4500 | 2、404 | 不在記憶體 | **page fault** |
    | 7000 | 3、856 | 2 | $2\times2048+856=4952$ |

    page 號碼 ＝ 位址 ÷ 2048 的商，offset ＝ 餘數；例如 $7000=3\times2048+856$。

**W-2.** 3 個 frame，存取 3, 1, 4, 1, 5, 3, 1。clock 演算法（新放進來的 page bit 設 1）有幾次 fault？跟 FIFO、LRU 比較，為什麼 clock 沒有跟 LRU 一樣好？

??? quiz "看參考答案"
    | 存取 | frame 0 | frame 1 | frame 2 | 結果 |
    |---|---|---|---|---|
    | 3, 1, 4 | 3 (1) | 1 (1) | 4 (1) | F F F |
    | 1 | 3 (1) | 1 (1) | 4 (1) | hit（bit 本來就是 1） |
    | 5 | 5 (1) | 1 (0) | 4 (0) | F：全部是 1，繞一圈清掉，踢 frame 0 的 3 |
    | 3 | 5 (1) | 3 (1) | 4 (0) | F：指標在 frame 1，1 的 bit 是 0，踢掉 1 |
    | 1 | 5 (1) | 3 (1) | 1 (1) | F：指標在 frame 2，4 的 bit 是 0，踢掉 4 |

    clock **6 次**，FIFO 也是 6 次；LRU 在存取 3 時會踢 4（1 比 4 晚用過），最後的 1 就 hit，只有 5 次。

    原因：1 在 4 之後被用過，但在存取 5 時兩個的 bit 都被清成 0 了。只有 1 個 bit，clock 分不出誰比較晚用，只能照指標的順序踢。我用程式跑過三種策略，次數都對。

### 4.7 換數字練習 {#u4-drill}

同一種題型換數字多做幾次，直到不用看筆記也算得出來。每題都附完整解答，答案都用程式驗算過；先自己算，再打開對答案。

#### 題型一：page replacement 幾次 fault

**做法**：畫表一格一格走，寫出每次踢掉誰（[4.0](#u4-0)）。

**P-1.** 3 個 frame，存取順序 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5，用 FIFO 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢最早進來的。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 1 | 1 | F |
    | 2 | 1, 2 | F |
    | 3 | 1, 2, 3 | F |
    | 4 | 2, 3, 4 | F（踢 1） |
    | 1 | 3, 4, 1 | F（踢 2） |
    | 2 | 4, 1, 2 | F（踢 3） |
    | 5 | 1, 2, 5 | F（踢 4） |
    | 1 | 1, 2, 5 | hit |
    | 2 | 1, 2, 5 | hit |
    | 3 | 2, 5, 3 | F（踢 1） |
    | 4 | 5, 3, 4 | F（踢 2） |
    | 5 | 5, 3, 4 | hit |

    共 **9 次** page fault。

    用動畫對答案：把 `1,2,3,4,1,2,5,1,2,3,4,5` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 FIFO。


**P-2.** 3 個 frame，存取順序 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5，用 LRU 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢最久沒被用到的（frame 內容由舊到新排）。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 1 | 1 | F |
    | 2 | 1, 2 | F |
    | 3 | 1, 2, 3 | F |
    | 4 | 2, 3, 4 | F（踢 1） |
    | 1 | 3, 4, 1 | F（踢 2） |
    | 2 | 4, 1, 2 | F（踢 3） |
    | 5 | 1, 2, 5 | F（踢 4） |
    | 1 | 2, 5, 1 | hit |
    | 2 | 5, 1, 2 | hit |
    | 3 | 1, 2, 3 | F（踢 5） |
    | 4 | 2, 3, 4 | F（踢 1） |
    | 5 | 3, 4, 5 | F（踢 2） |

    共 **10 次** page fault。

    用動畫對答案：把 `1,2,3,4,1,2,5,1,2,3,4,5` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 LRU。


**P-3.** 3 個 frame，存取順序 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5，用 OPT 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢未來最晚才用到（或再也不用）的。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 1 | 1 | F |
    | 2 | 1, 2 | F |
    | 3 | 1, 2, 3 | F |
    | 4 | 1, 2, 4 | F（踢 3） |
    | 1 | 1, 2, 4 | hit |
    | 2 | 1, 2, 4 | hit |
    | 5 | 1, 2, 5 | F（踢 4） |
    | 1 | 1, 2, 5 | hit |
    | 2 | 1, 2, 5 | hit |
    | 3 | 2, 5, 3 | F（踢 1） |
    | 4 | 5, 3, 4 | F（踢 2） |
    | 5 | 5, 3, 4 | hit |

    共 **7 次** page fault。

    用動畫對答案：把 `1,2,3,4,1,2,5,1,2,3,4,5` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 OPT。


**P-4.** 3 個 frame，存取順序 7, 0, 1, 2, 0, 3, 0, 4, 2, 3，用 FIFO 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢最早進來的。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 7 | 7 | F |
    | 0 | 7, 0 | F |
    | 1 | 7, 0, 1 | F |
    | 2 | 0, 1, 2 | F（踢 7） |
    | 0 | 0, 1, 2 | hit |
    | 3 | 1, 2, 3 | F（踢 0） |
    | 0 | 2, 3, 0 | F（踢 1） |
    | 4 | 3, 0, 4 | F（踢 2） |
    | 2 | 0, 4, 2 | F（踢 3） |
    | 3 | 4, 2, 3 | F（踢 0） |

    共 **9 次** page fault。

    用動畫對答案：把 `7,0,1,2,0,3,0,4,2,3` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 FIFO。


**P-5.** 3 個 frame，存取順序 2, 3, 2, 1, 5, 2, 4, 5, 3, 2，用 LRU 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢最久沒被用到的（frame 內容由舊到新排）。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 2 | 2 | F |
    | 3 | 2, 3 | F |
    | 2 | 3, 2 | hit |
    | 1 | 3, 2, 1 | F |
    | 5 | 2, 1, 5 | F（踢 3） |
    | 2 | 1, 5, 2 | hit |
    | 4 | 5, 2, 4 | F（踢 1） |
    | 5 | 2, 4, 5 | hit |
    | 3 | 4, 5, 3 | F（踢 2） |
    | 2 | 5, 3, 2 | F（踢 4） |

    共 **7 次** page fault。

    用動畫對答案：把 `2,3,2,1,5,2,4,5,3,2` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 LRU。


**P-6.** 3 個 frame，存取順序 2, 3, 2, 1, 5, 2, 4, 5, 3, 2，用 OPT 會有幾次 page fault？

??? quiz "看完整解答"
    規則：踢未來最晚才用到（或再也不用）的。

    | 存取 | frame 內容 | 結果 |
    |---|---|---|
    | 2 | 2 | F |
    | 3 | 2, 3 | F |
    | 2 | 2, 3 | hit |
    | 1 | 2, 3, 1 | F |
    | 5 | 2, 3, 5 | F（踢 1） |
    | 2 | 2, 3, 5 | hit |
    | 4 | 3, 5, 4 | F（踢 2） |
    | 5 | 3, 5, 4 | hit |
    | 3 | 3, 5, 4 | hit |
    | 2 | 5, 4, 2 | F（踢 3） |

    共 **6 次** page fault。

    用動畫對答案：把 `2,3,2,1,5,2,4,5,3,2` 貼進 [4.0 的動畫](#u4-0)，frame 數填 3、策略選 OPT。


#### 題型二：EAT 與 page fault rate

**做法**：EAT ＝ $(1-p)\times$ 記憶體時間 ＋ $p\times$ fault 處理時間；問上限就把不等式解出 $p$。

**P-7.** 記憶體存取 200 ns、處理一次 page fault 8 ms，page fault rate 是 0.001。EAT 是多少？

??? quiz "看完整解答"
    - **列式**：$(1-p)\times200+p\times8\times10^6$。
    - **代入**：$0.999\times200+0.001\times8\times10^6=199.8+8000$。
    - **答案**：約 **8199.8 ns**，是原本的 41 倍。


**P-8.** 記憶體 100 ns、page fault 10 ms。要讓 EAT 比沒有 page fault 時最多慢 10%，page fault rate 最多多少？

??? quiz "看完整解答"
    - **列式**：$(1-p)\times100+p\times10^7<110$。
    - **解**：$p\,(10^7-100)<10$，$p<\frac{10}{9999900}\approx1.0\times10^{-6}$。
    - **答案**：大約**每一百萬次存取最多 1 次** page fault。


**P-9.** 記憶體 100 ns。page fault 時，被換掉的 page 沒改過要 8 ms、改過（要先寫回）要 20 ms，70% 的情況是改過的。page fault rate $10^{-6}$，EAT？

??? quiz "看完整解答"
    - **平均處理時間（16.4 ms）**：$0.3\times8+0.7\times20=2.4+14$。
    - **EAT**：$(1-10^{-6})\times100+10^{-6}\times16.4\times10^6\approx100+16.4$。
    - **答案**：約 **116.4 ns**。如果每次都只要 8 ms（都沒改過），只要約 108 ns：dirty bit 讓沒改過的 page 不用寫回，省的就是這段。


**P-10.** 記憶體 120 ns、page fault 50000 ns。要讓 EAT ＜ 150 ns，page fault rate 最多多少？

??? quiz "看完整解答"
    - **列式**：$(1-p)\times120+50000p<150$。
    - **解**：$49880p<30$，$p<\frac{30}{49880}\approx$ **$6.01\times10^{-4}$**。


**P-11.** 記憶體 100 ns、page fault 5 ms。要讓 EAT 不超過記憶體時間的 2 倍，平均多少次存取最多只能有 1 次 page fault？

??? quiz "看完整解答"
    - **列式**：$(1-p)\times100+p\times5\times10^6\le200$。
    - **解**：$p\,(5\times10^6-100)\le100$，$p\le\frac{100}{4999900}\approx2\times10^{-5}$。
    - **答案**：大約**每 50000 次存取最多 1 次**。


**P-12.** 記憶體 100 ns、page fault 10 ms、page fault rate 0.0001。EAT 是多少？比沒有 page fault 慢幾倍？

??? quiz "看完整解答"
    - **EAT**：$0.9999\times100+0.0001\times10^7=99.99+1000\approx$ **1100 ns**。
    - **慢了約 11 倍**：每一萬次才 fault 一次，平均時間還是被它主宰。


### 4.8 英文作答範例 {#u4-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** Explain address binding at compile time, load time and execution time.

（中文：112 Q6a：compile time、load time、execution time 的位址繫結。）

</div>

??? quiz "看英文參考答案"
    - **Compile time**: if it is known at compile time where the process will reside in memory, **absolute code** can be generated. If the starting location changes later, the code must be **recompiled**.
    - **Load time**: if the location is not known at compile time, the compiler generates **relocatable code**, and the final binding is delayed until load time. If the starting address changes, the program only needs to be **reloaded**.
    - **Execution time**: if the process can be **moved during its execution** from one memory segment to another, binding must be delayed until run time. This requires **special hardware (the MMU)**, and most operating systems use this method.

    寫法提示：每一種都寫「產生什麼碼」和「位置改了要怎樣」：recompile、reload、可以在執行中搬動（[4.1](#u4-1)）。

<div markdown="1">

**E-2.** What is the difference between a logical address and a physical address?

（中文：邏輯位址和實體位址的差別。）

</div>

??? quiz "看英文參考答案"
    An address generated by the **CPU** is a **logical address** (also called a virtual address). An address seen by the **memory unit**, the one loaded into the memory-address register, is a **physical address**.

    With compile-time and load-time binding the two are identical; with **execution-time binding** they differ. The run-time mapping from logical to physical addresses is done by a hardware device called the **memory-management unit (MMU)**, for example by adding the value in a **relocation register** to every logical address. The user program deals only with logical addresses and never sees the real physical addresses.

    寫法提示：誰產生（CPU）、誰看到（memory unit）、誰轉換（MMU）三件事寫清楚（[4.1](#u4-1)）。

<div markdown="1">

**E-3.** Distinguish internal fragmentation from external fragmentation. Which one does paging have?

（中文：內部碎片和外部碎片的差別；paging 有哪一種？）

</div>

??? quiz "看英文參考答案"
    - **External fragmentation**: there is enough **total free memory** to satisfy a request, but it is **not contiguous**; it is broken into many small holes. It occurs with contiguous allocation (first fit, best fit) and with segmentation. It can be reduced by **compaction**, or avoided by allowing noncontiguous allocation such as **paging**.
    - **Internal fragmentation**: the memory allocated to a process is **slightly larger than the requested memory**, and the unused part is **inside the allocated partition**.

    **Paging has no external fragmentation**, because any free frame can be allocated to any process, but it has **internal fragmentation** in the **last page** of a process (on average half a page).

    寫法提示：外部碎片的關鍵詞是 not contiguous，內部碎片是 inside the partition；paging 的答案兩部分都要寫（[4.5](#u4-alloc)）。

<div markdown="1">

**E-4.** Describe how a TLB is used in address translation.

（中文：114 Q7：TLB 怎麼用在位址轉換（步驟）。）

</div>

??? quiz "看英文參考答案"
    1. The CPU generates a logical address, and its **page number** is extracted.
    2. The page number is presented to the **TLB**, which compares it with all its keys **simultaneously**.
    3. **TLB hit**: the frame number is available immediately and is used to access memory.
    4. **TLB miss**: a memory reference to the **page table** is made to obtain the frame number.
    5. The page number and frame number are **added to the TLB**, replacing an existing entry (for example, by LRU) if the TLB is full, so that the next reference to this page will be found quickly.

    Some TLBs store an **address-space identifier (ASID)** in each entry, so entries of several processes can coexist; otherwise the TLB must be **flushed** on every context switch.

    寫法提示：五個步驟照順序寫，hit 和 miss 分開；最後補 ASID 或 flush 會更完整（[4.1](#u4-1)）。

<div markdown="1">

**E-5.** What is thrashing? What causes it, and how does the working-set model prevent it?

（中文：112 Q6b：什麼是 thrashing？原因？working-set model 怎麼處理？）

</div>

??? quiz "看英文參考答案"
    A process is **thrashing** if it is spending **more time paging than executing**.

    **Cause**: if processes do not have enough frames to hold the pages they are actively using (their **locality**), they page-fault continuously. CPU utilization drops, so the OS increases the degree of multiprogramming, which takes even more frames away and makes the problem worse.

    **Working-set model**: choose a working-set window $\Delta$; the **working set** of a process is the set of pages referenced in its most recent $\Delta$ references. Let $D=\sum WSS_i$ be the total demand for frames. If $D$ is **greater than the number of available frames** $m$, the OS **suspends (swaps out) a process** and gives its frames to other processes. This prevents thrashing while keeping the degree of multiprogramming as high as possible.

    寫法提示：原因要寫出惡性循環（CPU 使用率下降 → OS 加更多 process → 更糟）；working set 要寫 D 和 m 的比較（[4.3](#u4-3)）。

<div markdown="1">

**E-6.** Describe the steps for handling a page fault.

（中文：page fault 發生時的處理步驟。）

</div>

??? quiz "看英文參考答案"
    1. The reference to a page marked **invalid** in the page table causes a **trap** to the operating system.
    2. The OS checks an internal table: if the reference was an **invalid memory access**, the process is terminated; if it was valid but the page is **not yet in memory**, the page must be brought in.
    3. Find a **free frame** (if there is none, select a victim frame with a **page-replacement algorithm**).
    4. Schedule a **disk operation** to read the desired page into the frame.
    5. When the read is complete, **update the page table** to indicate that the page is now in memory.
    6. **Restart the instruction** that was interrupted by the trap.

    寫法提示：最後一步 restart the instruction 常被漏掉；沒有空 frame 時才需要置換（[4.0](#u4-0)）。

### 4.9 考古題變化題 {#u4-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

**考古變化 1.**（改自 112 Q6a・判斷）下面三種情況，位址各在什麼時候繫結（compile time、load time、execution time）？(a) 洗衣機的控制程式，永遠放在記憶體的固定位址 (b) 程式每次載入的位置都不一樣，但載入之後就不會再移動 (c) 程式執行到一半會被 swap 出去，回來時可能放在不同的位置

??? quiz "看完整解答"
    - **跟原題差在哪**：原題問三種繫結的差別；這題給情境，要判斷是哪一種。
    - **(a) compile time**：位置事先就知道而且不會變，編譯時直接產生絕對位址。
    - **(b) load time**：編譯出可重定位的程式，載入時決定位址，之後不再動。
    - **(c) execution time**：執行中位置會變，只能在每次存取時才轉換，要有 MMU（硬體）支援。


**考古變化 2.**（改自 114 Q7・量化）TLB 查詢 20 ns、記憶體存取 100 ns、TLB hit rate 80%。(1) 單層 page table 的有效存取時間 (2) 兩層 page table 呢？(3) 兩層時 hit rate 要多少，有效存取時間才會 ≤ 130 ns？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題要你講 TLB 的五個步驟；這題把步驟換成時間算出來（hit 走步驟 3，miss 走步驟 4、5）。
    - **(1)**：hit：TLB ＋ 存取資料 $=120$；miss：TLB ＋ 查 page table ＋ 存取資料 $=220$。$0.8\times120+0.2\times220=$ **140 ns**。
    - **(2)**：miss 時要查兩層 page table，多一次記憶體：$20+100+100+100=320$。$0.8\times120+0.2\times320=$ **160 ns**。
    - **(3)**：$120h+320(1-h)\le130$ → $320-200h\le130$ → $h\ge$ **95%**。

    我用程式重算過每一步，答案一樣。


**考古變化 3.**（改自 111 Q9・換數字・延伸）39 位元虛擬位址、34 位元實體位址、4 KB page、每個 PTE 8 bytes。(1) 單層 page table 有幾個 entry？占多少記憶體？(2) 改成多層，每一層的表剛好一個 page，要幾層？

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了；(2) 多問多層 page table（這正是 RISC-V Sv39 的設計）。
    - **(1)**：offset 12 位元，VPN $39-12=27$ 位元 → **$2^{27}$** 個 entry；$2^{27}\times8\text{ B}=2^{30}\text{ B}=$ **1 GiB**。（實體位址 34 位元決定 PPN 有 22 位元，PTE 用 8 bytes 放得下。）
    - **(2)**：一個 page 放 $\frac{4096}{8}=512=2^9$ 個 PTE，每一層吃 VPN 的 9 位元：$27\div9=$ **3 層**。

    我用程式重算過每一步，答案一樣。


**考古變化 4.**（改自 111 Q8・換數字）32 GB 的記憶體以 4 KB 為單位配置，用 bitmap 記錄哪些單位是空的，bitmap 要多大？改成 8 KB 為單位呢？

??? quiz "看完整解答"
    - **跟原題差在哪**：記憶體和單位都換了，多問「單位變大」的效果。
    - **4 KB**：單位數 $\frac{2^{35}}{2^{12}}=2^{23}$，每單位 1 位元 → $2^{23}$ 位元 $=2^{20}$ bytes ＝ **1 MB**。
    - **8 KB**：單位數減半 → **512 KB**。單位越大 bitmap 越小，但每次配置的浪費（內部碎片）可能越大。

    我用程式重算過每一步，答案一樣。


**考古變化 5.**（改自 111 Q6・換數字）TLB 查詢 20 ns，miss 時才去讀 page table（200 ns）。希望位址轉換的平均開銷 ≤ 30 ns，TLB hit rate 至少要多少？

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了，算法一樣：每次都要查 TLB，miss 時才多花查 page table 的時間。
    - **列式**：$20+(1-h)\times200\le30$ → $(1-h)\times200\le10$ → $1-h\le0.05$。
    - **答案**：$h\ge$ **95%**。

    我用程式重算過每一步，答案一樣。


**考古變化 6.**（改自 113 Q6b・換數字）記憶體存取 100 ns，處理一次 page fault 要 8 ms。希望有效存取時間最多比 100 ns 慢 10%，page fault rate 上限是多少？

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了，而且 page fault 的時間單位是 ms，要先換成 ns。
    - **換單位**：8 ms ＝ 8,000,000 ns。
    - **列式**：$(1-p)\times100+p\times8000000\le110$ → $7999900p\le10$ → $p\le\frac{10}{7999900}\approx1.25\times10^{-6}$。
    - **意思**：大約每 80 萬次存取才能有 1 次 page fault。page fault 非常貴，所以 thrashing 一發生，系統就幾乎停住。

    我用程式重算過每一步，答案一樣。


**考古變化 7.**（改自 103 Q2、110 Q5・換數字）`int A[100][100]`（int 4 bytes），row-major，A[0][0] 在一個 page 的開頭，page 800 bytes；程式另外佔一個 frame，資料只有 2 個 frame，LRU。(a) j 在外層、i 在內層 (b) i 在外層、j 在內層，各會發生幾次 page fault？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題一頁剛好放不滿一列；這題一頁放**兩列**，所以 (a) 不再是每次都 fault，要多想一步。
    - **一頁放幾個元素**：800 ÷ 4 ＝ 200 個 ＝ 兩列（每列 100 個）。陣列共 50 頁，第 $i$ 列在第 $\lfloor i/2\rfloor$ 頁。
    - **(a) j 在外、i 在內**：內層 i 從 0 走到 99，依序碰到第 0、0、1、1、2、2、…、49、49 頁。每頁第一次碰到時 fault、緊接著同一頁的下一列就 hit。一輪內層 50 次 fault，外層 100 輪：$50\times100=$ **5000 次**。
    - **(b) i 在外、j 在內**：照記憶體的順序走，每頁只在第一次碰到時 fault：**50 次**。

    我用程式模擬過 LRU 和這兩種迴圈順序，答案一樣。


**考古變化 8.**（改自 105 Q3(3)、103 Q3・實際算）reference string：1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5。(1) FIFO 用 3 個、4 個 frame 各幾次 page fault？(2) LRU 呢？(3) 對照原題的上下界

??? quiz "看完整解答"
    - **跟原題差在哪**：原題用證明說明 LRU 不會有 Belady's anomaly；這題用一個具體的字串，親眼看到 FIFO 有、LRU 沒有。
    - **(1) FIFO**：3 個 frame **9 次**；4 個 frame **10 次**。frame 變多，fault 反而變多，這就是 **Belady's anomaly**。
    - **(2) LRU**：3 個 frame **10 次**；4 個 frame **8 次**。frame 變多，fault 不會變多（LRU 是 stack algorithm）。
    - **(3) 上下界**：字串長度 $n=12$、不同的 page $p=5$。四個答案都在 5 到 12 之間；3、4 個 frame 都比 5 少，所以不可能剛好 5 次。

    我用程式模擬過 FIFO 和 LRU，答案一樣。


**考古變化 9.**（改自 100 Q4・換數字）segment table：0 號 base 1400、length 1000；1 號 6300、400；2 號 4300、400；3 號 3200、1100；4 號 4700、1000。下面的邏輯位址各對到哪個實體位址？(a) (2, 53) (b) (3, 852) (c) (1, 500) (d) (0, 999) (e) (4, 1000)

??? quiz "看完整解答"
    - **跟原題差在哪**：表和位址換了；多了 offset 剛好等於 length 的邊界情況。
    - **規則**：offset 必須 **小於** length，否則 trap；合法時實體位址 ＝ base ＋ offset。
    - **(a)**：53 ＜ 400 → $4300+53=$ **4353**。
    - **(b)**：852 ＜ 1100 → $3200+852=$ **4052**。
    - **(c)**：500 ≥ 400 → **trap**（越界）。
    - **(d)**：999 ＜ 1000 → $1400+999=$ **2399**。
    - **(e)**：1000 ≥ 1000 → **trap**。length 1000 代表合法的 offset 是 0 到 999。

    我用程式重算過每一步，答案一樣。


**考古變化 10.**（改自 105 Q3(1)・實際算）記憶體的空洞依序是 150K、350K、200K、500K、100K。依序來了 180K、90K、320K、210K 四個要求。first fit、best fit、worst fit 各會怎麼放？哪一種放得下全部？（從空洞的開頭切，剩下的部分還是空洞）

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說出三種方法；這題用一組數字跑一次，看出三種方法的結果真的不一樣。
    - **first fit**（第一個夠大的）：180 → 350（剩 170）；90 → 150（剩 60）；320 → 500（剩 180）；210 → 剩下 60、170、200、180、100，**都不夠**，要等。
    - **best fit**（夠大裡面最小的）：180 → 200（剩 20）；90 → 100（剩 10）；320 → 350（剩 30）；210 → 500（剩 290）。**全部放得下**。
    - **worst fit**（最大的）：180 → 500（剩 320）；90 → 350（剩 260）；320 → 剛剛剩下的 320（剩 0）；210 → 260（剩 50）。**全部放得下**。
    - **結論**：這組資料裡 first fit 輸了。哪一種最好要看要求的大小分布，沒有永遠最好的；一般的模擬結果是 first fit 和 best fit 比 worst fit 好，first fit 又比較快。

    我用程式模擬過三種配置方法，答案一樣。


**考古變化 11.**（改自 105 Q3(4)・實際算）kernel 用 buddy system 管理一塊 512 KB 的記憶體（位址 0 開始）。依序：A 要 60 KB、B 要 30 KB、C 要 100 KB，然後釋放 A、再釋放 B。每一步配到哪一塊？最後剩下哪些空的區塊？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說明 buddy system；這題實際切一次、合併一次。
    - **規則**：大小都是 2 的次方；要 $k$ KB 就找不小於 $k$ 的 2 的次方；不夠小就對半切，兩半互為 buddy；釋放時如果 buddy 也是空的就合併回去。
    - **A 要 60 → 64 KB**：512 切成 256＋256；前面的 256 切成 128＋128；前面的 128 切成 64＋64。A 拿 **0–64**。
    - **B 要 30 → 32 KB**：A 旁邊的 64（64–128）切成 32＋32，B 拿 **64–96**。
    - **C 要 100 → 128 KB**：128–256 那塊剛好，C 拿 **128–256**。
    - **釋放 A**：A 的 buddy 是 64–128，裡面有 B，不能合併；0–64 變成空的。
    - **釋放 B**：B 的 buddy 96–128 是空的 → 合併成 64–128；它的 buddy 0–64（A 剛放掉）也是空的 → 合併成 0–128；再往上的 buddy 128–256 是 C，停。
    - **最後空的**：**0–128**（128 KB）和 **256–512**（256 KB）。C 還佔著 128–256。
    - **代價**：A 只要 60 卻佔 64、C 要 100 卻佔 128，這些浪費是內部碎片。

    我寫了一個 buddy allocator 的模擬程式，每一步的結果都一樣。


### 單元 4 小考 {#u4-quiz}

**4-1.** 32-bit 虛擬位址、8 KB page、PTE 4 B，單層 page table 多大？

??? quiz "看答案"
    - offset：8 KB ＝ $2^{13}$ → 13 位元
    - VPN：$32-13=19$ 位元 → $2^{19}$ 個 entry
    - 大小：$2^{19}\times4\text{ B}=2^{21}\text{ B}=$ **2 MB**（$2^{20}$ B ＝ 1 MB）

**4-2.** TLB hit rate 80%，TLB 20 ns、記憶體 100 ns（單層 page table），有效存取時間？

??? quiz "看答案"
    - **TLB hit**：查 TLB 20 ＋ 拿資料 100 ＝ 120 ns
    - **TLB miss**：查 TLB 20 ＋ 查 page table 100 ＋ 拿資料 100 ＝ 220 ns

    EAT $=0.8\times120+0.2\times220=96+44=$ **140 ns**。

**4-3.** copy-on-write 在什麼情況下最省？

??? quiz "看答案"
    `fork()` 之後子行程馬上呼叫 `exec()` 載入新程式時：父行程的 page 幾乎都不會被寫入，完全不用複製。

## 單元 5：儲存、檔案與 I/O {#u5}

### 5.0 觀念課：硬碟像一台唱片機 {#u5-0}

#### 讀一個區塊要花三段時間

硬碟是好幾片疊在一起旋轉的碟片，讀寫頭裝在一支可以前後移動的手臂上，像唱片機。

| 時間 | 在做什麼 | 比喻 |
|---|---|---|
| seek time | 手臂移到正確的磁軌 | 唱針移到第幾首歌 |
| rotational latency | 等要讀的那一段轉到讀寫頭下面 | 等那首歌的開頭轉過來 |
| transfer time | 真正讀資料 | 播放 |

**平均 rotational latency ＝ 轉半圈的時間**。7200 RPM：一圈 $\frac{60}{7200}$ 秒 ≈ 8.33 ms，半圈約 4.17 ms。

隨機讀取時，seek 和 rotational latency 遠大於 transfer，所以把同一個檔案的區塊**放在一起**（111 Q7 的 clustering）可以省下大量時間。

#### 檔案的區塊怎麼配置：連續、鏈結、索引

一個檔案有好幾個區塊，要記錄它們在磁碟的哪裡。三種方法：

<figure class="fig">
<svg viewBox="0 0 360 290" role="img" aria-label="同一個 4 個區塊的檔案，三種放法。連續配置：放在第 4 到 7 塊，記起點 4、長度 4。鏈結配置：放在第 2、9、5、12 塊，每一塊記下一塊在哪。索引配置：第 6 塊是索引區塊，裡面列出 2、9、5、12。">
<text x="20" y="10" text-anchor="start" dominant-baseline="central" class="sm">連續：記「起點 4、長度 4」</text>
<rect class="box" x="20" y="40" width="20" height="24"/>
<text x="30" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">0</text>
<rect class="box" x="40" y="40" width="20" height="24"/>
<text x="50" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">1</text>
<rect class="box" x="60" y="40" width="20" height="24"/>
<text x="70" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">2</text>
<rect class="box" x="80" y="40" width="20" height="24"/>
<text x="90" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">3</text>
<rect class="fb" x="100" y="40" width="20" height="24"/>
<text x="110" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono tb">4</text>
<rect class="fb" x="120" y="40" width="20" height="24"/>
<text x="130" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono tb">5</text>
<rect class="fb" x="140" y="40" width="20" height="24"/>
<text x="150" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono tb">6</text>
<rect class="fb" x="160" y="40" width="20" height="24"/>
<text x="170" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono tb">7</text>
<rect class="box" x="180" y="40" width="20" height="24"/>
<text x="190" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">8</text>
<rect class="box" x="200" y="40" width="20" height="24"/>
<text x="210" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">9</text>
<rect class="box" x="220" y="40" width="20" height="24"/>
<text x="230" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">10</text>
<rect class="box" x="240" y="40" width="20" height="24"/>
<text x="250" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">11</text>
<rect class="box" x="260" y="40" width="20" height="24"/>
<text x="270" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">12</text>
<rect class="box" x="280" y="40" width="20" height="24"/>
<text x="290" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">13</text>
<rect class="box" x="300" y="40" width="20" height="24"/>
<text x="310" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">14</text>
<rect class="box" x="320" y="40" width="20" height="24"/>
<text x="330" y="52" text-anchor="middle" dominant-baseline="central" class="sm mono">15</text>
<text x="20" y="98" text-anchor="start" dominant-baseline="central" class="sm">鏈結：每一塊記「下一塊」</text>
<rect class="box" x="20" y="128" width="20" height="24"/>
<text x="30" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">0</text>
<rect class="box" x="40" y="128" width="20" height="24"/>
<text x="50" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">1</text>
<rect class="fb" x="60" y="128" width="20" height="24"/>
<text x="70" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono tb">2</text>
<rect class="box" x="80" y="128" width="20" height="24"/>
<text x="90" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">3</text>
<rect class="box" x="100" y="128" width="20" height="24"/>
<text x="110" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">4</text>
<rect class="fb" x="120" y="128" width="20" height="24"/>
<text x="130" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono tb">5</text>
<rect class="box" x="140" y="128" width="20" height="24"/>
<text x="150" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">6</text>
<rect class="box" x="160" y="128" width="20" height="24"/>
<text x="170" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">7</text>
<rect class="box" x="180" y="128" width="20" height="24"/>
<text x="190" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">8</text>
<rect class="fb" x="200" y="128" width="20" height="24"/>
<text x="210" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono tb">9</text>
<rect class="box" x="220" y="128" width="20" height="24"/>
<text x="230" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">10</text>
<rect class="box" x="240" y="128" width="20" height="24"/>
<text x="250" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">11</text>
<rect class="fb" x="260" y="128" width="20" height="24"/>
<text x="270" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono tb">12</text>
<rect class="box" x="280" y="128" width="20" height="24"/>
<text x="290" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">13</text>
<rect class="box" x="300" y="128" width="20" height="24"/>
<text x="310" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">14</text>
<rect class="box" x="320" y="128" width="20" height="24"/>
<text x="330" y="140" text-anchor="middle" dominant-baseline="central" class="sm mono">15</text>
<path class="arw-a" d="M70,127 Q140,106 204.3,125.3"/>
<polygon class="ah-a" points="210.0,127.0 203.2,128.6 205.3,121.9"/>
<path class="arw-a" d="M210,153 Q170,174 135.3,155.8"/>
<polygon class="ah-a" points="130.0,153.0 136.9,152.7 133.7,158.9"/>
<path class="arw-a" d="M130,127 Q200,106 264.3,125.3"/>
<polygon class="ah-a" points="270.0,127.0 263.2,128.6 265.3,121.9"/>
<text x="20" y="186" text-anchor="start" dominant-baseline="central" class="sm">索引：第 6 塊列出 2、9、5、12</text>
<rect class="box" x="20" y="216" width="20" height="24"/>
<text x="30" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">0</text>
<rect class="box" x="40" y="216" width="20" height="24"/>
<text x="50" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">1</text>
<rect class="fb" x="60" y="216" width="20" height="24"/>
<text x="70" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono tb">2</text>
<rect class="box" x="80" y="216" width="20" height="24"/>
<text x="90" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">3</text>
<rect class="box" x="100" y="216" width="20" height="24"/>
<text x="110" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">4</text>
<rect class="fb" x="120" y="216" width="20" height="24"/>
<text x="130" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono tb">5</text>
<rect class="fk" x="140" y="216" width="20" height="24"/>
<text x="150" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">6</text>
<rect class="box" x="160" y="216" width="20" height="24"/>
<text x="170" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">7</text>
<rect class="box" x="180" y="216" width="20" height="24"/>
<text x="190" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">8</text>
<rect class="fb" x="200" y="216" width="20" height="24"/>
<text x="210" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono tb">9</text>
<rect class="box" x="220" y="216" width="20" height="24"/>
<text x="230" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">10</text>
<rect class="box" x="240" y="216" width="20" height="24"/>
<text x="250" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">11</text>
<rect class="fb" x="260" y="216" width="20" height="24"/>
<text x="270" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono tb">12</text>
<rect class="box" x="280" y="216" width="20" height="24"/>
<text x="290" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">13</text>
<rect class="box" x="300" y="216" width="20" height="24"/>
<text x="310" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">14</text>
<rect class="box" x="320" y="216" width="20" height="24"/>
<text x="330" y="228" text-anchor="middle" dominant-baseline="central" class="sm mono">15</text>
<path class="arw" d="M150,241 Q110,258.8 75.5,243.4"/>
<polygon class="ah" points="70.0,241.0 76.9,240.2 74.1,246.6"/>
<path class="arw" d="M150,241 Q180,255.6 204.6,243.6"/>
<polygon class="ah" points="210.0,241.0 206.1,246.8 203.1,240.5"/>
<path class="arw" d="M150,241 Q140,249.2 134.6,244.8"/>
<polygon class="ah" points="130.0,241.0 136.9,242.1 132.4,247.5"/>
<path class="arw" d="M150,241 Q210,265.2 264.4,243.2"/>
<polygon class="ah" points="270.0,241.0 265.7,246.5 263.1,240.0"/>
</svg>
<figcaption>同一個 4 塊的檔案：連續放、一塊接一塊串起來、或用一個索引區塊列出全部</figcaption>
</figure>

| 方法 | 怎麼記 | 優點 | 缺點 |
|---|---|---|---|
| 連續配置（contiguous） | 起點和長度 | 循序、隨機讀都快：第 $i$ 塊就在「起點 ＋ $i$」 | 外部碎片；檔案很難變大 |
| 鏈結配置（linked） | 每一塊存「下一塊在哪」 | 沒有外部碎片，檔案好變大 | 隨機讀要從頭一塊一塊走；一個指標壞掉，後面全斷 |
| 索引配置（indexed） | 一個索引區塊列出所有區塊 | 隨機讀快、沒有外部碎片 | 索引區塊要額外空間；大檔案要多層索引 |

**FAT**（file allocation table）是鏈結配置的變形：把每一塊的「下一塊」集中放在磁碟開頭的一張表，表可以整張讀進記憶體，隨機讀時在記憶體裡查表就好，不用真的去讀每一塊。下面的 i-node 就是索引配置，用多層索引支援大檔案。

#### 檔案的區塊放在哪：i-node

i-node 像一本書的**目錄頁**：前面幾格直接寫「第 1 章在第幾頁」（direct pointer），後面一格寫「其他章節的目錄在第幾頁」（indirect pointer），那一頁整頁都是指標。

**小例子**：區塊 1 KB、指標 4 bytes → 一個區塊可以放 $1024/4=256$ 個指標。

| 種類 | 可以指到幾個資料區塊 | 容量 |
|---|---|---|
| 12 個 direct | 12 | 12 KB |
| single indirect | 256 | 256 KB |
| double indirect | $256^2$ | 64 MB |

小檔案只用 direct pointer，讀取很快；大檔案才用到間接區塊。

#### 最大檔案還有第二個上限：指標寫得下幾個區塊

指標存的是**區塊編號**。$p$ bytes 的指標只有 $8p$ 個 bit，最多寫得出 $2^{8p}$ 種編號，也就是磁碟最多只能有 $2^{8p}$ 個區塊。一個檔案不可能用到比這還多的區塊，所以

最大檔案 ＝ min（i-node 結構算出的資料區塊數，$2^{8p}$）× 區塊大小。

**例子**：區塊 8 KB、指標 4 bytes，i-node 有 12 個 direct 和 single、double、triple indirect 各一個。

- **i-node 結構的上限（約 64 TB）**：一塊放 $8192\div4=2^{11}$ 個指標，資料區塊 $12+2^{11}+2^{22}+2^{33}\approx2^{33}$ 個，乘 8 KB ＝ $2^{46}$ B。
- **指標的上限（32 TB）**：4 bytes ＝ 32 bit，最多 $2^{32}$ 個區塊，乘 8 KB ＝ $2^{45}$ B。
- **答案（約 32 TB）**：兩個取小的。

指標 8 bytes 時，$2^{64}$ 遠大於結構算出的區塊數，這一條就不會卡住（111 Q5 就是這種情況）。

!!! trap "作答時兩個都寫"
    很多解答只算 i-node 結構。最保險的寫法：先算結構的上限，再補一句「指標只有 32 bit，最多 $2^{32}$ 個區塊，所以實際最大是 $2^{32}\times$ 區塊大小」，兩個取小的。練習見 [5.7 的 P-13、P-14](#u5-drill)。

#### RAID：用多顆硬碟換速度或安全

- **RAID 0**（striping）：資料分散在多顆，同時讀寫比較快，但任何一顆壞掉資料就毀了。
- **RAID 1**（mirroring）：每份資料存兩份，壞一顆沒關係，但容量剩一半。
- **RAID 5**（分散的 parity）：多存一份 XOR 校驗。

<figure class="fig">
<svg viewBox="0 0 360 196" role="img" aria-label="RAID 0：A1、A3 在第一顆，A2、A4 在第二顆，分散存放。RAID 1：兩顆存一模一樣的 A1、A2。RAID 5：三顆硬碟，每一列有兩個資料區塊和一個 parity，parity 輪流放在不同顆。">
<rect class="box" x="24" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="28" y="36" width="28" height="18" rx="3"/>
<text x="42" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A1</text>
<rect class="fb" x="28" y="58" width="28" height="18" rx="3"/>
<text x="42" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A3</text>
<rect class="fb" x="28" y="80" width="28" height="18" rx="3"/>
<text x="42" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A5</text>
<rect class="box" x="66" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="70" y="36" width="28" height="18" rx="3"/>
<text x="84" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A2</text>
<rect class="fb" x="70" y="58" width="28" height="18" rx="3"/>
<text x="84" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A4</text>
<rect class="fb" x="70" y="80" width="28" height="18" rx="3"/>
<text x="84" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A6</text>
<text x="63" y="16" text-anchor="middle" dominant-baseline="central" class="sm mono">RAID 0</text>
<text x="63" y="130" text-anchor="middle" dominant-baseline="central" class="sm">分散：快</text>
<text x="63" y="148" text-anchor="middle" dominant-baseline="central" class="sm">壞一顆就全毀</text>
<rect class="box" x="120" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="124" y="36" width="28" height="18" rx="3"/>
<text x="138" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A1</text>
<rect class="fb" x="124" y="58" width="28" height="18" rx="3"/>
<text x="138" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A2</text>
<rect class="fb" x="124" y="80" width="28" height="18" rx="3"/>
<text x="138" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A3</text>
<rect class="box" x="162" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="166" y="36" width="28" height="18" rx="3"/>
<text x="180" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A1</text>
<rect class="fb" x="166" y="58" width="28" height="18" rx="3"/>
<text x="180" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A2</text>
<rect class="fb" x="166" y="80" width="28" height="18" rx="3"/>
<text x="180" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A3</text>
<text x="159" y="16" text-anchor="middle" dominant-baseline="central" class="sm mono">RAID 1</text>
<text x="159" y="130" text-anchor="middle" dominant-baseline="central" class="sm">鏡像：存兩份</text>
<text x="159" y="148" text-anchor="middle" dominant-baseline="central" class="sm">容量剩一半</text>
<rect class="box" x="216" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="220" y="36" width="28" height="18" rx="3"/>
<text x="234" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A1</text>
<rect class="fb" x="220" y="58" width="28" height="18" rx="3"/>
<text x="234" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">B1</text>
<rect class="fk" x="220" y="80" width="28" height="18" rx="3"/>
<text x="234" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono ">Pc</text>
<rect class="box" x="258" y="30" width="36" height="78" rx="10"/>
<rect class="fb" x="262" y="36" width="28" height="18" rx="3"/>
<text x="276" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono tb">A2</text>
<rect class="fk" x="262" y="58" width="28" height="18" rx="3"/>
<text x="276" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono ">Pb</text>
<rect class="fb" x="262" y="80" width="28" height="18" rx="3"/>
<text x="276" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">C1</text>
<rect class="box" x="300" y="30" width="36" height="78" rx="10"/>
<rect class="fk" x="304" y="36" width="28" height="18" rx="3"/>
<text x="318" y="45" text-anchor="middle" dominant-baseline="central" class="sm mono ">Pa</text>
<rect class="fb" x="304" y="58" width="28" height="18" rx="3"/>
<text x="318" y="67" text-anchor="middle" dominant-baseline="central" class="sm mono tb">B2</text>
<rect class="fb" x="304" y="80" width="28" height="18" rx="3"/>
<text x="318" y="89" text-anchor="middle" dominant-baseline="central" class="sm mono tb">C2</text>
<text x="276" y="16" text-anchor="middle" dominant-baseline="central" class="sm mono">RAID 5</text>
<text x="276" y="130" text-anchor="middle" dominant-baseline="central" class="sm">parity 輪流放</text>
<text x="276" y="148" text-anchor="middle" dominant-baseline="central" class="sm">能壞一顆</text>
<rect class="fk" x="110" y="172" width="14" height="14"/>
<text x="130" y="179" text-anchor="start" dominant-baseline="central" class="sm">P：parity（XOR）</text>
</svg>
<figcaption>RAID 5 的 parity 輪流放在不同顆：每次寫入都要更新 parity，集中在一顆會變成瓶頸</figcaption>
</figure>

**XOR 為什麼能救回資料**：資料 1100 和 1010，parity ＝ 1100 XOR 1010 ＝ 0110。第二顆壞了，把剩下的 XOR 起來：1100 XOR 0110 ＝ 1010，就是原本的資料。RAID 6 再多一份不同算法的校驗（P＋Q），可以同時壞兩顆。

!!! key "儲存與檔案題要做什麼"
    | 題目問 | 怎麼做 |
    |---|---|
    | 讀一個區塊多久 | seek ＋ 平均 rotational latency（轉半圈）＋ transfer |
    | i-node 最大檔案 | 一塊放幾個指標 $k$ ＝ 區塊大小 ÷ 指標大小；資料區塊數 ＝ direct 個數 ＋ $k$ ＋ $k^2$ ＋ $k^3$；再和指標寫得下的 $2^{8p}$ 塊取小的 |
    | 三種配置方式比較 | 連續：快但有碎片；鏈結：好長大但隨機讀慢；索引：隨機讀快但要索引區塊 |
    | RAID 能壞幾顆、容量剩多少 | RAID 0 不能壞；RAID 1 剩一半；RAID 5 能壞 1 顆，剩 $\frac{n-1}{n}$；RAID 6 能壞 2 顆 |
    | 磁碟排程總距離 | 照演算法排出順序，相鄰的相減再加總（[5.4](#u5-sched)） |

    名詞對照：seek time（尋軌時間）、rotational latency（旋轉延遲）、transfer time（傳輸時間）、i-node（索引節點）、striping（分散存放）、mirroring（鏡像）、parity（同位）。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記（資工所考生整理）**：[I/O 運作方式、Interrupt 與 DMA](https://saberliou.github.io/PrepareCSEMaster/OperatingSystem/Chapter02.html)：polling、interrupt、DMA 的比較，對應 5.3 的 I/O 名詞。
    - **講義**：[周志遠講義下載頁](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999)的檔案系統與 secondary-storage 章節。
    - **練習（英文）**：恐龍書官網的 [Mass-Storage 習題](https://www.os-book.com/OS10/regular-exercises/PDF-regular-exer-dir/11.pdf)。

#### 換你試試

**T-1.** 10000 RPM 的硬碟，平均 rotational latency？

??? quiz "看答案"
    10000 RPM ＝ 每分鐘 10000 圈，一圈 $\frac{60}{10000}$ 秒 $=0.006$ 秒 ＝ 6 ms。要讀的位置平均在半圈外 → 平均 rotational latency **3 ms**。

**T-2.** 資料 0101 和 0011，parity 是多少？如果 0101 那顆壞了，怎麼救回來？

??? quiz "看答案"
    XOR 是「一樣得 0、不一樣得 1」，一位一位算：

    - parity ＝ `0101` XOR `0011` ＝ **`0110`**
    - 0101 那顆壞了：把剩下的 XOR 起來，`0011` XOR `0110` ＝ **`0101`**，救回來了

    原理：$a\oplus b\oplus b=a$，同一個值 XOR 兩次會抵銷。

**T-3.** 區塊 4 KB、指標 4 bytes，single indirect 可以多指到多少容量？

??? quiz "看答案"
    一個 4 KB 的區塊可以放 $4096\div4=1024$ 個指標，每個指標指到一個 4 KB 的資料區塊：$1024\times4\text{ KB}=4096\text{ KB}=$ **4 MB**。

### 5.1 檔案系統 {#u5-1}

- 檔案是記錄在次要儲存裝置上、**有名字（named）**的相關資訊集合。（115 Q1h）
- 任何包含檔案系統的個體叫做 **volume**。（113 Q8f）

!!! example "114 Q5a（6%）：除了名字之外，檔案的六種屬性"
    identifier（系統內部的唯一編號）、type、location（在裝置上的位置）、size、protection（存取權限）、timestamps and user identification（建立、修改、使用時間與擁有者）。

!!! example "112 Q7（10%）：(a) 三種存取方式 (b) consistency semantics"
    (a) **sequential**：照順序一筆一筆讀寫（read next、write next），像磁帶。**direct**：用相對區塊編號隨意讀寫任一區塊，適合資料庫。**indexed**：另外建一份索引，先查索引找到指標，再直接存取該區塊。

    (b) **consistency semantics** 規定多個使用者同時存取同一個檔案時，一個人的修改**什麼時候對其他人可見**。例如 UNIX semantics（寫入立刻可見）、session semantics（關檔之後，新開的 session 才看得到，AFS 用）、immutable-shared-files semantics（共享檔案不能修改）。

!!! example "111 Q5（10%）：i-node 有 10 個直接區塊、三層間接區塊，指標 8 B、區塊 8 KB"
    每個區塊可放 $8\text{ KB}/8\text{ B}=1024=2^{10}$ 個指標。

    (a) 最小的檔案（非空）需要 **1 個**資料區塊。

    (b) 最大的檔案可以有 $10+2^{10}+2^{20}+2^{30}$ 個**資料區塊**。如果題目要算進索引區塊，再加上 single 1 個、double $1+2^{10}$ 個、triple $1+2^{10}+2^{20}$ 個。作答時寫清楚你算的是哪一種。

### 5.2 磁碟 {#u5-2}

- HDD 隨機存取時間 ＝ **seek time** ＋ **rotational latency**。（114 Q8g）
- 次要儲存裝置主要是 HDD 和 **nonvolatile memory（NVM）** 裝置。（115 Q1e）
- swap space 可以建在 **raw partition**，不放檔案系統。（114 Q8j）
- **RAID 6** 使用 **P + Q redundancy**，可以承受兩顆磁碟同時故障。（113 Q8g）

!!! example "111 Q7（10%）：讀 100 個區塊的檔案，未聚集時平均 seek 5 ms、聚集後 0.5 ms，rotational latency 10 ms、每區塊傳輸 20 μs"
    - 未聚集：$100\times(5+10+0.02)=1502$ ms
    - 聚集：$100\times(0.5+10+0.02)=1052$ ms

!!! example "115 Q4（10%）：sector sparing 的步驟"
    1. OS 嘗試讀取 logical block 87。
    2. controller 計算 ECC，發現這個 sector 壞了。
    3. controller 把這個結果當成 I/O error 回報給 OS。
    4. controller 用一個**備用 sector（spare）**取代壞掉的 sector。
    5. 之後系統每次要讀 logical block 87，controller 都會把請求**轉到備用 sector 的位址**。

### 5.3 I/O {#u5-3}

- **daisy chain**：A 接 B、B 接 C、C 接電腦的串接方式。（114 Q8a）
- kernel 用 **device-driver** 模組把各種裝置的細節包起來。（115 Q1f）
- **vectored I/O（scatter-gather）**：一個 system call 完成多個緩衝區的讀寫，減少 context switch 和系統呼叫開銷。（112 Q9a）
- **maskable vs non-maskable interrupt**（113 Q5b）：maskable 可以在 CPU 執行不能被打斷的程式段時暫時關掉；non-maskable 不能關，保留給無法恢復的記憶體錯誤這類嚴重事件。

!!! example "114 Q5b（4%）：interrupt chaining 怎麼運作"
    中斷向量表的每一格指向一串**中斷處理程式的串列**。中斷發生時，依序呼叫串列中的處理程式，直到找到能處理這個中斷的那一個。這是「每個裝置都有自己的向量格（表太大）」和「全部共用一個處理程式（要一個個問）」之間的折衷。

### 5.4 磁碟排程：讀寫頭怎麼移動 {#u5-sched}

101、102、104、107、110 年都考過（每次 6–10%）：給一串要求的磁柱（cylinder）編號，照某種演算法排出服務順序、算讀寫頭總共移動多遠。規則固定、只要加減法，是最容易拿的分數。

#### 觀念：讀寫頭像電梯

很多要求在等，讀寫頭一次只能停在一個位置。移動越遠，seek time 越長（見 [5.0](#u5-0)），所以目標是**總移動距離越短越好**，又不能讓某些要求等太久。

| 演算法 | 規則 | 比喻 | 缺點 |
|---|---|---|---|
| FCFS | 照到達順序 | 排隊 | 來回亂跑，距離通常最長 |
| SSTF（shortest seek time first） | 每次去**離現在最近**的要求 | 計程車每次先載最近的客人 | 遠的要求可能一直等（starvation） |
| SCAN | 往一個方向一路服務到**盡頭**，再回頭 | 電梯一定開到頂樓才下來 | 剛掃過的那一端要等很久 |
| LOOK | 跟 SCAN 一樣，但到**最遠的要求**就回頭 | 沒人要去頂樓，電梯就不上去 | 同上，但少走冤枉路 |
| C-SCAN（circular SCAN） | 只往一個方向服務，到盡頭後**直接跳回另一端**，回程不服務 | 只往上載客的電梯，到頂樓直接降回一樓 | 移動距離比 SCAN 長，但等待時間比較平均 |
| C-LOOK | C-SCAN 的 LOOK 版：到最遠的要求，就跳回**另一邊最遠的要求** | | |

**為什麼 C-SCAN 比較公平**：SCAN 回頭時，剛掃過的一端要等來回一趟；中間的位置來回各被掃一次。C-SCAN 永遠同一個方向掃，每個位置等的時間差不多。

#### 題目沒講清楚的，要自己寫假設

1. **方向**：「前一個要求在 125、現在在 175」代表正往**編號大的**方向走。只給現在位置時，寫「假設往編號大的方向移動」。
2. **盡頭在哪**：SCAN、C-SCAN 走到磁柱編號的最大值（0–999 就是 999）或 0。
3. **C-SCAN、C-LOOK 跳回去那一段算不算距離**：回程不服務要求，但手臂確實有移動，各本書算法不同。**兩個都寫最保險**，例如「含跳回 1925，不含 925」。

#### 算距離的捷徑

電梯類（SCAN、LOOK）只要算**轉折點**：例如 LOOK 往上走到最大的要求再回頭到最小的要求，距離 ＝（最大 − 起點）＋（最大 − 最小），不用一段一段加。

<div class="viz" data-viz="disk" data-reqs="98,183,37,122,14,124,65,67" data-head="53" data-dir="down" data-max="199" data-algo="sstf" data-title="102 Q7 的資料：切換演算法和方向，比較總距離"></div>

!!! example "110 Q2（10%）：磁柱 0–1000，正在服務 175、上一個是 125；佇列（FIFO）50, 500, 225, 825, 350, 550, 400, 600, 100；五種演算法的總移動距離"
    **方向（往大的）**：從 125 移到 175，所以正往編號大的方向走。

    - **FCFS（2975）**：175 → 50 → 500 → 225 → 825 → 350 → 550 → 400 → 600 → 100，距離 $125+450+275+600+475+200+150+200+500$。
    - **LOOK（1425）**：往上 225, 350, 400, 500, 550, 600, 825，再回頭 100, 50。距離 $(825-175)+(825-50)=650+775$。
    - **C-LOOK（含跳回 1475，不含 700）**：往上服務到 825，跳回最小的 50，再往上到 100。距離 $650+(825-50)+(100-50)=650+775+50$；不算跳回那段是 $650+50$。
    - **SCAN（1775）**：往上服務到 825，繼續走到盡頭 1000，回頭 100, 50。距離 $(1000-175)+(1000-50)=825+950$。
    - **C-SCAN（含跳回 1925，不含 925）**：往上走到 1000，跳回 0，再服務 50, 100。距離 $825+1000+100$；不算跳回是 $825+100$。

<div class="viz" data-viz="disk" data-reqs="50,500,225,825,350,550,400,600,100" data-head="175" data-dir="up" data-max="1000" data-algo="look" data-title="110 Q2：五種演算法都可以切換來對答案"></div>

!!! example "102 Q7（6%）：佇列 98, 183, 37, 122, 14, 124, 65, 67，讀寫頭在 53；SSTF 和 SCAN"
    題目沒給最大編號和方向，照恐龍書這個範例的設定：磁柱 0–199，讀寫頭往 0 的方向移動。

    **SSTF（236）**：

    | 從 | 剩下的要求裡最近的 | 距離 | 累計 | 說明 |
    |---|---|---|---|---|
    | 53 | 65 | 12 | 12 | 65 只差 12，37 差 16 |
    | 65 | 67 | 2 | 14 | |
    | 67 | 37 | 30 | 44 | 37 差 30、98 差 31，差一點就去 98 |
    | 37 | 14 | 23 | 67 | |
    | 14 | 98 | 84 | 151 | 小的那一邊沒有要求了 |
    | 98 | 122 | 24 | 175 | |
    | 122 | 124 | 2 | 177 | |
    | 124 | 183 | 59 | 236 | |

    **SCAN（往 0 的方向，236）**：37, 14，走到盡頭 0，回頭 65, 67, 98, 122, 124, 183。距離 $53+183=236$。

    如果假設往編號大的方向：65, 67, 98, 122, 124, 183，走到盡頭 199，回頭 37, 14，距離 $(199-53)+(199-14)=331$。方向不同答案就不同，所以**一定要寫出假設**。

    **SSTF 不一定最短**：照 37, 14, 65, 67, 98, 122, 124, 183 的順序（往 0 的方向 LOOK）只要 $(53-14)+(183-14)=208$，比 SSTF 的 236 少。SSTF 每一步只看最近的（貪心），整體不一定最好。

!!! example "104 Q6(2)（6%）：磁柱 1–200，讀寫頭在 55；佇列 99, 187, 39, 124, 14, 131, 65, 70；SSTF、SCAN、C-SCAN、C-LOOK"
    題目沒給方向，假設往編號大的方向移動。題目只要求「讀寫頭怎麼移動」，寫出順序就夠，距離是順便驗算。

    - **SSTF**：65, 70, 99, 124, 131, 187, 39, 14（距離 305）。到 131 時，187 差 56、39 差 92，所以先去 187。
    - **SCAN**：65, 70, 99, 124, 131, 187，走到 200，回頭 39, 14（距離 $145+186=331$）。
    - **C-SCAN**：65, 70, 99, 124, 131, 187，走到 200，跳回 1，再 14, 39（含跳回 382，不含 183）。
    - **C-LOOK**：65, 70, 99, 124, 131, 187，跳回 14，再 39（含跳回 330，不含 157）。

!!! example "107 Q3(2)（6%）：最大磁柱 200，讀寫頭在 60；佇列 100, 185, 40, 120, 2, 138, 75, 87；SSTF 和 C-LOOK"
    假設往編號大的方向移動。

    - **SSTF**：75, 87, 100, 120, 138, 185, 40, 2（距離 308）。
    - **C-LOOK**：75, 87, 100, 120, 138, 185，跳回 2，再 40（含跳回 346，不含 163）。

!!! example "101 Q4（10%）：SCAN-EDF（多媒體系統）；要求（名稱, 截止時間, 磁柱）：(A,150,25)、(B,201,112)、(C,399,95)、(D,94,31)、(E,295,185)、(F,78,85)、(G,165,150)、(H,125,101)、(I,300,85)、(J,210,90)；讀寫頭在 49，往 50 移動"
    **SCAN-EDF**：多媒體的要求有截止時間（deadline），所以先照**截止時間**排（EDF，earliest deadline first）；截止時間差不多的分成一批，**同一批裡照 SCAN 的順序**服務，省移動距離。

    這組資料就是恐龍書的範例，課本把截止時間每 100 ms 分一批：

    | 批 | 截止時間 | 要求（磁柱） | 服務順序 | 說明 |
    |---|---|---|---|---|
    | 1 | 0–99 | D(31)、F(85) | F → D | 在 49 往上，先遇到 85，再回頭到 31 |
    | 2 | 100–199 | A(25)、H(101)、G(150) | A → H → G | 在 31 往下，先到 25，再回頭往上 |
    | 3 | 200–299 | J(90)、B(112)、E(185) | E → B → J | 在 150 往上，先到 185，再回頭往下 |
    | 4 | 300–399 | I(85)、C(95) | I → C | 在 90 往下，先到 85，再回頭到 95 |

    **服務順序：F, D, A, H, G, E, B, J, I, C**。

    如果不分批，截止時間又都不一樣，SCAN-EDF 就等於單純的 EDF：F, D, H, A, G, B, J, E, I, C。考試寫出你用的分批方法。

#### 觀念小考

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 哪一種演算法可能讓某些要求等非常久（starvation）？

1. FCFS
2. SSTF
3. SCAN
4. C-SCAN

??? quiz "看解析"
    **B. SSTF**。如果讀寫頭附近一直有新的要求進來，SSTF 會一直先服務附近的，遠處的要求就一直輪不到。FCFS 照順序一定輪得到；SCAN、C-SCAN 一定會掃過每個位置。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-2.** 讀寫頭在 50，往編號大的方向移動，要求是 10、60、90。LOOK 的總移動距離是？

1. 120
2. 130
3. 80
4. 90

??? quiz "看解析"
    **A. 120**。LOOK 先往上服務 60、90，90 是這個方向最遠的要求，就回頭到 10。距離 $(90-50)+(90-10)=40+80=120$。如果是 SCAN 而且盡頭是 99，就要多走到 99 再回頭：$(99-50)+(99-10)=138$。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-3.** LOOK 和 SCAN 差在哪裡？

1. LOOK 不會回頭
2. LOOK 到最遠的要求就回頭，SCAN 要走到磁碟的盡頭
3. LOOK 只往一個方向服務
4. 兩個完全一樣

??? quiz "看解析"
    **B**。兩個都像電梯，來回掃。差別只在回頭的地方：SCAN 一定走到盡頭（0 或最大編號），LOOK 看到那個方向已經沒有要求就回頭。只往一個方向服務的是 C-SCAN／C-LOOK。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-4.** SSTF 的總移動距離一定是所有順序裡最短的嗎？

1. 是，因為每一步都走最近的
2. 是，只要要求不超過 10 個
3. 不一定，每一步最近不代表加起來最短
4. 不一定，只有方向往上時才是最短

??? quiz "看解析"
    **C**。SSTF 是貪心法，只看下一步。102 Q7 的資料：SSTF 走 236，但先往下到 14 再一路往上（LOOK 往 0 的方向）只要 208。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** 為什麼有人寧願用移動距離比較長的 C-SCAN，而不用 SCAN？

1. C-SCAN 比較容易實作
2. C-SCAN 每個位置的等待時間比較平均
3. C-SCAN 不會有 starvation，SCAN 會
4. C-SCAN 的 seek time 比較短

??? quiz "看解析"
    **B**。SCAN 回頭時，剛掃過的那一端要等手臂走到另一端再回來，等最久；中間的位置則來回各被掃一次。C-SCAN 永遠同方向服務，每個位置大約每一輪被掃一次，等待時間比較平均。SCAN 也不會 starvation，所以 C 錯。

</div>

**W-1.** 讀寫頭在 100、往編號小的方向移動，磁柱 0–199，要求是 20、150、80、190。寫出 C-LOOK 的服務順序和距離（跳回那段算或不算都寫）。

??? quiz "看參考答案"
    往小的方向：先服務 80、20；20 是這個方向最遠的要求，跳回**另一邊最遠的**要求 190，再往小的方向服務 150。

    - 順序：**80, 20, 190, 150**
    - 距離：$(100-20)=80$，跳回 $190-20=170$，再 $190-150=40$。含跳回 **290**，不含 **120**。

    **自我檢查**：C-LOOK 跳回去後，方向還是「往小的」，所以從 190 往下服務到 150，不是從 150 往上到 190。

### 5.5 檔案系統與 I/O 的考古題補充：目錄、mount、開檔表、I/O 方式 {#u5-more}

104、105、107 年的「File System and I/O」小題，每題 2–4%，加起來將近 25%：目錄有哪幾種結構、mount point 是什麼、開檔時 UNIX 記住哪些資訊、CPU 怎麼知道 I/O 做完了、memory-mapped I/O。都是恐龍書的名詞，**會講「為什麼要這樣做」**就能拿分。

#### 目錄結構：檔案越來越多，怎麼放？

| 結構 | 長相 | 好處 | 問題 |
|---|---|---|---|
| single-level | 所有檔案放同一個目錄 | 最簡單 | 檔名不能重複，人多、檔案多就亂 |
| two-level | 每個使用者一個目錄 | 不同使用者可以用一樣的檔名 | 不能再分類，使用者之間不好共享 |
| tree-structured | 目錄裡可以再開子目錄 | 可以分類；有 current directory，用絕對、相對路徑 | 一個檔案只屬於一個目錄，不能共享 |
| acyclic-graph | 樹再加上 link，同一個檔案可以出現在好幾個目錄 | 可以共享 | 一個檔案有好幾個名字；刪除時要用 reference count，不然會留下指到不存在檔案的 link（dangling pointer） |
| general graph | link 可以形成迴圈 | 最有彈性 | 走訪可能繞不出來；迴圈裡的檔案可能沒人用卻刪不掉，要 garbage collection |

**multilevel（樹狀）命名的好處**：檔案可以照用途分類；不同目錄裡可以有同名的檔案（路徑不同就不衝突）；用路徑一層一層找，比在一個大目錄裡找快。

#### mount point：把另一個檔案系統接上來

一顆硬碟、一支隨身碟各有自己的檔案系統。**mount** 是把一個檔案系統「接」到目前目錄樹的某個目錄上，那個目錄叫 **mount point**（通常是空目錄）。接上之後，`/mnt/usb/report.txt` 就是隨身碟裡的 `report.txt`，使用者看到的是一棵完整的樹，不用管檔案實際在哪個裝置。

#### 開檔時，OS 記住哪些資訊？

每次讀寫都從頭找目錄太慢，所以 `open()` 時把資訊放進 **open-file table**，之後用 file descriptor 直接查表：

| 資訊 | 用途 | 放在哪 |
|---|---|---|
| file pointer | 目前讀寫到哪裡 | 每個 process 各一份（兩個 process 讀同一個檔，位置不一樣） |
| file-open count | 有幾個 process 開著這個檔 | 系統共用的表；歸 0 時才把這一格清掉 |
| disk location | 檔案在磁碟的位置 | 系統共用的表，不用每次重查 |
| access rights | 這個 process 用什麼模式開（唯讀、可寫） | 每個 process 各一份 |

#### CPU 怎麼知道 I/O 做完了？

| 方法 | 怎麼做 | 適合 | 缺點 |
|---|---|---|---|
| polling（busy waiting） | CPU 一直讀裝置的 status register，看 busy 位元變 0 沒 | 裝置很快、馬上就好 | 裝置慢時 CPU 空轉 |
| interrupt | 裝置好了就拉中斷線通知 CPU，CPU 跳去執行 interrupt handler | 裝置慢、事件不常發生 | 每次中斷都要存狀態、切換，量大時開銷大 |
| DMA（direct memory access） | CPU 告訴 DMA controller 要搬哪一塊、搬到哪，DMA 自己在裝置和記憶體之間搬，**整塊搬完才中斷一次** | 大量資料（磁碟、網路） | 要 DMA 硬體；搬的時候跟 CPU 搶記憶體匯流排（cycle stealing） |

**I/O 裝置的暫存器**：通常有 data-in（給 CPU 讀）、data-out（CPU 寫給裝置）、status（忙不忙、有沒有錯誤）、control（下命令）四種。

**CPU 怎麼碰到這些暫存器**：

- **I/O port**：用特殊的 I/O 指令（例如 x86 的 `in`、`out`）。
- **memory-mapped I/O**：把裝置的暫存器對應到記憶體位址，CPU 用一般的 load／store 讀寫。好處是不用特殊指令、程式好寫，大量資料（例如顯示卡的畫面記憶體）直接寫記憶體就好，比一個 byte 一個 byte 用 I/O 指令送快。

**blocking、nonblocking、asynchronous I/O**：blocking 是等 I/O 做完才回來（process 被暫停）；nonblocking 是馬上回來，有多少資料就給多少；asynchronous 是馬上回來，I/O 在背後做，**做完再通知**。

!!! example "104 Q6(1)（3%）：除了 single-level、two-level，還有哪三種常見的目錄結構？"
    tree-structured、acyclic-graph、general graph（各自的特點見上表）。

!!! example "105 Q2（10%）：(1) 什麼是 mount point (2) multilevel naming 的好處 (3) 磁碟隨機存取時間的兩個部分 (4) CPU 的兩條中斷要求線"
    **(1)** 把一個檔案系統接進目錄樹的那個目錄。接上之後，那個裝置的檔案從這個目錄底下存取（見上面）。

    **(2)** 檔案可以分類放、不同目錄可以有同名檔案、照路徑找比較快（見上面）。

    **(3)** **seek time**（讀寫頭移到正確的磁軌）＋ **rotational latency**（等資料轉到讀寫頭下面）。（[5.0](#u5-0)）

    **(4)** **nonmaskable**：留給不能等的嚴重錯誤（例如無法修正的記憶體錯誤），不能關掉。**maskable**：一般裝置的中斷，CPU 執行不能被打斷的程式段時可以暫時關掉。（[5.3](#u5-3)）

!!! example "107 Q3(1)(3)(4)（9%）：(1) 開檔時 UNIX 記住哪四項資訊 (3) RAID 的 parity 怎麼運作 (4) CPU 知道 I/O 裝置資料好了沒的三種方法"
    **(1)** file pointer、file-open count、disk location、access rights（見上表）。

    **(3)** 把幾顆磁碟同一位置的資料做 XOR，存成 parity。任何一顆壞掉，把剩下的（含 parity）XOR 起來就是壞掉那顆的資料（[5.0](#u5-0) 的例子）。

    **(4)** polling、interrupt、DMA（見上表）。

!!! example "104 Q7(4)（3%）：什麼是 memory-mapped I/O？為什麼需要它？"
    把裝置的控制暫存器（和緩衝區）對應到記憶體位址空間，CPU 用一般的 load／store 指令讀寫裝置。**需要的原因**：不用額外的 I/O 指令，程式和硬體都比較簡單；大量資料（例如畫面）可以直接寫到對應的記憶體，速度快。

#### 觀念小考

<div class="mcq" data-ans="3" markdown="1">

**C-1.** acyclic-graph 目錄讓同一個檔案出現在好幾個目錄。刪除檔案時最需要處理的問題是？

1. 檔名太長
2. 目錄會形成迴圈
3. 其他目錄的 link 會指到已經刪掉的檔案
4. 檔案會被複製好幾份

??? quiz "看解析"
    **C**。dangling pointer。解法是 reference count：記錄有幾個 link 指到這個檔案，歸 0 才真的刪。B 是 general graph 的問題，acyclic 本來就不允許迴圈。D 錯：link 不是複製，只有一份資料。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-2.** 要把磁碟上 1 MB 的資料讀進記憶體，哪一種方式最不佔 CPU？

1. polling
2. DMA
3. 每個 byte 一次 interrupt
4. memory-mapped I/O 加上 polling

??? quiz "看解析"
    **B**。DMA controller 自己搬整塊資料，搬完才中斷 CPU 一次。polling 讓 CPU 一直等；每個 byte 一次中斷，中斷的開銷會比搬資料還大。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-3.** open-file table 裡，哪一項是**每個 process 各自一份**的？

1. disk location
2. file-open count
3. 檔案大小
4. file pointer

??? quiz "看解析"
    **D**。兩個 process 同時讀一個檔案，讀到的位置可以不一樣，所以 file pointer 要各自記。disk location、open count 是這個檔案共用的資訊，放在系統共用的表。

</div>

**W-1.** 什麼情況下 polling 反而比 interrupt 好？

??? quiz "看參考答案"
    **裝置很快、資料馬上就會好**的時候。這時 CPU 只要檢查幾次 status register 就等到了；如果改用 interrupt，要存目前的狀態、跳去 handler、再恢復，這些開銷可能比等幾個 cycle 還久。

    反過來，裝置很慢（例如鍵盤、磁碟）或事件不常發生時，polling 會讓 CPU 大部分時間在空轉，用 interrupt 才能讓 CPU 先去做別的事。

### 5.6 觀念小考 {#u5-concept}

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 5400 RPM 的硬碟，平均 rotational latency 大約是多少？

1. 11.1 ms
2. 5.56 ms
3. 2.78 ms
4. 0.18 ms

??? quiz "看解析"
    **B**。一圈 $\frac{60}{5400}$ 秒 ≈ 11.1 ms，平均要等半圈，約 5.56 ms。A 是轉一整圈的時間。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** 要直接讀一個檔案的第 100 塊，哪一種配置方式最慢？

1. 連續配置
2. 索引配置
3. FAT（表已經讀進記憶體）
4. 鏈結配置（每一塊存下一塊的位置）

??? quiz "看解析"
    **D**。要從第 1 塊開始，一塊一塊讀出「下一塊在哪」，讀了 99 塊才知道第 100 塊在哪。FAT 把這些指標集中在記憶體裡，查表就好；連續配置直接算位置；索引配置查索引區塊。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** 4 顆一樣大的硬碟做 RAID 5，可以用來存資料的容量是幾顆硬碟的量？

1. 3 顆
2. 2 顆
3. 4 顆
4. 1 顆

??? quiz "看解析"
    **A**。每一列有 1 塊 parity，其他 3 塊是資料，容量是 $\frac{n-1}{n}$。B 是 RAID 1（存兩份）的結果。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-4.** 區塊 2 KB、指標 4 bytes，i-node 有 10 個 direct、1 個 single indirect、1 個 double indirect，最大的檔案有幾個資料區塊？

1. $10+512$
2. $10+2\times512$
3. $10+512+512^2$
4. $512^3$

??? quiz "看解析"
    **C**。一個區塊放 $2048\div4=512$ 個指標。single indirect 指到 512 塊；double indirect 指到 512 個索引區塊，每個再指到 512 塊，共 $512^2$。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** RAID 5 為什麼把 parity 輪流放在每一顆，而不是集中在同一顆？

1. 讓總容量變大
2. 每次寫入都要更新 parity，集中在一顆會變成瓶頸
3. 讓讀取不用經過 parity
4. 這樣才能同時壞兩顆

??? quiz "看解析"
    **B**。parity 集中在一顆是 RAID 4，所有寫入都要動到那一顆。D 是 RAID 6（P＋Q 兩份校驗）才做得到。

</div>

**W-1.** 7200 RPM、平均 seek 8 ms、傳輸率 100 MB/s（1 MB 以 $10^6$ bytes、1 KB 以 $10^3$ bytes 計）。讀一個 4 KB 的區塊平均要多久？讀一個連續存放的 4 MB 檔案呢？如果那 1000 個區塊散落在磁碟各處呢？

??? quiz "看參考答案"
    - **平均 rotational latency（4.17 ms）**：一圈 $\frac{60}{7200}$ 秒 ≈ 8.33 ms，半圈約 4.17 ms。
    - **一個 4 KB 區塊（約 12.21 ms）**：$8+4.17+\frac{4000}{100\times10^6}\text{ s}=8+4.17+0.04$。
    - **連續的 4 MB（約 52.17 ms）**：只要一次 seek 和一次等轉，再連續傳 $\frac{4\times10^6}{100\times10^6}$ s ＝ 40 ms：$8+4.17+40$。
    - **散落的 1000 塊（約 12.2 秒）**：每塊都要 seek 和等轉，$1000\times12.21$ ms。

    同樣的資料量，放在一起快了二百多倍：時間幾乎都花在 seek 和等轉，不是傳輸。

**W-2.** 區塊 4 KB、指標 4 bytes，i-node 有 12 個 direct，single、double、triple indirect 各 1 個。(a) 最大檔案大約多大？(b) 要讀一個檔案的第 3,000,000 個 byte（從 0 算），i-node 已經在記憶體裡，要讀幾次磁碟？

??? quiz "看參考答案"
    **(a) 約 4 TB**：一塊放 $4096\div4=1024=2^{10}$ 個指標。資料區塊數 $12+2^{10}+2^{20}+2^{30}$，每塊 4 KB：

    $$\begin{aligned}&48\text{ KB}+4\text{ MB}+4\text{ GB}+4\text{ TB}\\&\approx4\text{ TB}\end{aligned}$$

    **(b) 2 次**：$3000000\div4096=732$ 餘 1728，是第 732 塊（從 0 算）。direct 管第 0–11 塊，single indirect 管第 12–1035 塊，所以在 single indirect 的範圍：先讀那個索引區塊，再讀資料區塊。

### 5.7 換數字練習 {#u5-drill}

同一種題型換數字多做幾次，直到不用看筆記也算得出來。每題都附完整解答，答案都用程式驗算過；先自己算，再打開對答案。

#### 題型一：磁碟排程的移動距離

**做法**：照演算法排出服務順序，相鄰相減加總；C-SCAN、C-LOOK 把含跳回和不含的都寫出來（[5.4](#u5-sched)）。

**P-1.** 磁柱 0～199，讀寫頭在 53、正往編號大的方向移動。要求依序是 98, 183, 37, 122, 14, 124, 65, 67。用 FCFS，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67。
    - **相鄰相減加總**：45 ＋ 85 ＋ 146 ＋ 85 ＋ 108 ＋ 110 ＋ 59 ＋ 2 ＝ **640**。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `98,183,37,122,14,124,65,67`、讀寫頭 53、方向往大、最大 199，演算法選 FCFS。


**P-2.** 磁柱 0～199，讀寫頭在 53、正往編號大的方向移動。要求依序是 98, 183, 37, 122, 14, 124, 65, 67。用 SSTF，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183。
    - **相鄰相減加總**：12 ＋ 2 ＋ 30 ＋ 23 ＋ 84 ＋ 24 ＋ 2 ＋ 59 ＝ **236**。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `98,183,37,122,14,124,65,67`、讀寫頭 53、方向往大、最大 199，演算法選 SSTF。


**P-3.** 磁柱 0～199，讀寫頭在 143、正往編號大的方向移動。要求依序是 86, 147, 91, 177, 94, 150, 102, 175, 130。用 SCAN，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：143 → 147 → 150 → 175 → 177 → 130 → 102 → 94 → 91 → 86。
    - **往大的方向走到盡頭 199 再回頭**：$(199-143)+(199-86)=169$。
    - **答案**：**169**。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `86,147,91,177,94,150,102,175,130`、讀寫頭 143、方向往大、最大 199，演算法選 SCAN。


**P-4.** 磁柱 0～199，讀寫頭在 143、正往編號大的方向移動。要求依序是 86, 147, 91, 177, 94, 150, 102, 175, 130。用 LOOK，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：143 → 147 → 150 → 175 → 177 → 130 → 102 → 94 → 91 → 86。
    - **走到最遠的要求 177 就回頭**：$(177-143)+(177-86)=125$。
    - **答案**：**125**。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `86,147,91,177,94,150,102,175,130`、讀寫頭 143、方向往大、最大 199，演算法選 LOOK。


**P-5.** 磁柱 0～199，讀寫頭在 50、正往編號大的方向移動。要求依序是 45, 21, 67, 90, 4, 55, 89, 52, 61, 87。用 C-SCAN，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：50 → 52 → 55 → 61 → 67 → 87 → 89 → 90 → 4 → 21 → 45。
    - **往大走到 199，跳回 0，再往大服務剩下的**：服務時移動 $(199-50)+(45-0)=194$，跳回去那一段 199。
    - **答案**：不含跳回 **194**，含跳回 **393**（兩個都寫最保險）。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `45,21,67,90,4,55,89,52,61,87`、讀寫頭 50、方向往大、最大 199，演算法選 C-SCAN；跳回那段選「算進」會得到 393、選「不算」會得到 194。


**P-6.** 磁柱 0～199，讀寫頭在 50、正往編號大的方向移動。要求依序是 45, 21, 67, 90, 4, 55, 89, 52, 61, 87。用 C-LOOK，服務順序和總移動距離？

??? quiz "看完整解答"
    - **服務順序**：50 → 52 → 55 → 61 → 67 → 87 → 89 → 90 → 4 → 21 → 45。
    - **往大走到最遠的 90，跳到另一邊最遠的 4，再往大服務**：服務時移動 $(90-50)+(45-4)=81$，跳的那一段 86。
    - **答案**：不含跳回 **81**，含跳回 **167**。

    用動畫對答案：在 [5.4 的動畫](#u5-sched) 要求填 `45,21,67,90,4,55,89,52,61,87`、讀寫頭 50、方向往大、最大 199，演算法選 C-LOOK；跳回那段選「算進」會得到 167、選「不算」會得到 81。


#### 題型二：i-node 最大檔案

**做法**：一塊放 $k$ ＝ 區塊 ÷ 指標 個指標；資料區塊數 ＝ direct ＋ $k$ ＋ $k^2$ ＋ $k^3$。最後檢查指標夠不夠大：$p$ bytes 的指標最多指到 $2^{8p}$ 個區塊，兩個上限取小的（[5.0](#u5-0)）。

**P-7.** 區塊 4096 B、指標 4 B，i-node 有 12 個 direct 和 single、double、triple indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（1024）**：$4096\div4$。
    - **i-node 結構的上限（1074791436 塊）**：12（direct） $+$ 1024（single） $+$ $1024^2$ $+$ $1024^3$。
    - **指標夠不夠大**：4 B ＝ 32 bit，最多能寫 $2^{32}$ 個區塊編號，比 1074791436 多，不受限。
    - **最大檔案**：$1074791436\times4096$ B，約 4 TB。


**P-8.** 區塊 1024 B、指標 4 B，i-node 有 10 個 direct 和 single、double indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（256）**：$1024\div4$。
    - **i-node 結構的上限（65802 塊）**：10（direct） $+$ 256（single） $+$ $256^2$。
    - **指標夠不夠大**：4 B ＝ 32 bit，最多能寫 $2^{32}$ 個區塊編號，比 65802 多，不受限。
    - **最大檔案**：$65802\times1024$ B，約 64.3 MB。


**P-9.** 區塊 8192 B、指標 8 B，i-node 有 12 個 direct 和 single、double、triple indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（1024）**：$8192\div8$。
    - **i-node 結構的上限（1074791436 塊）**：12（direct） $+$ 1024（single） $+$ $1024^2$ $+$ $1024^3$。
    - **指標夠不夠大**：8 B ＝ 64 bit，最多能寫 $2^{64}$ 個區塊編號，比 1074791436 多，不受限。
    - **最大檔案**：$1074791436\times8192$ B，約 8.01 TB。


**P-10.** 區塊 2048 B、指標 4 B，i-node 有 10 個 direct 和 single indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（512）**：$2048\div4$。
    - **i-node 結構的上限（522 塊）**：10（direct） $+$ 512（single）。
    - **指標夠不夠大**：4 B ＝ 32 bit，最多能寫 $2^{32}$ 個區塊編號，比 522 多，不受限。
    - **最大檔案**：$522\times2048$ B，約 1.02 MB。


**P-11.** 區塊 4096 B、指標 8 B，i-node 有 12 個 direct 和 single、double indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（512）**：$4096\div8$。
    - **i-node 結構的上限（262668 塊）**：12（direct） $+$ 512（single） $+$ $512^2$。
    - **指標夠不夠大**：8 B ＝ 64 bit，最多能寫 $2^{64}$ 個區塊編號，比 262668 多，不受限。
    - **最大檔案**：$262668\times4096$ B，約 1 GB。


**P-12.** 區塊 512 B、指標 4 B，i-node 有 10 個 direct 和 single、double、triple indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（128）**：$512\div4$。
    - **i-node 結構的上限（2113674 塊）**：10（direct） $+$ 128（single） $+$ $128^2$ $+$ $128^3$。
    - **指標夠不夠大**：4 B ＝ 32 bit，最多能寫 $2^{32}$ 個區塊編號，比 2113674 多，不受限。
    - **最大檔案**：$2113674\times512$ B，約 1.01 GB。


**P-13.** 區塊 8192 B、指標 4 B，i-node 有 12 個 direct 和 single、double、triple indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（2048）**：$8192\div4$。
    - **i-node 結構的上限（8594130956 塊）**：12（direct） $+$ 2048（single） $+$ $2048^2$ $+$ $2048^3$。
    - **指標夠不夠大（不夠）**：4 B ＝ 32 bit，最多只能寫 $2^{32}=4294967296$ 個區塊編號，整顆磁碟也只有這麼多塊，比結構的上限少。
    - **最大檔案**：兩個上限取小的，最多 $2^{32}$ 個資料區塊，$2^{32}\times8192$ B，約 32 TB。只看結構會算出 64 TB，但指標指不到那麼多區塊；作答時兩個都寫，說明取小的。


**P-14.** 區塊 1024 B、指標 2 B，i-node 有 8 個 direct 和 single、double、triple indirect 各一個。最大的檔案有幾個資料區塊？多大？

??? quiz "看完整解答"
    - **一個區塊放幾個指標（512）**：$1024\div2$。
    - **i-node 結構的上限（134480392 塊）**：8（direct） $+$ 512（single） $+$ $512^2$ $+$ $512^3$。
    - **指標夠不夠大（不夠）**：2 B ＝ 16 bit，最多只能寫 $2^{16}=65536$ 個區塊編號，整顆磁碟也只有這麼多塊，比結構的上限少。
    - **最大檔案**：兩個上限取小的，最多 $2^{16}$ 個資料區塊，$2^{16}\times1024$ B，約 64 MB。只看結構會算出 128 GB，但指標指不到那麼多區塊；作答時兩個都寫，說明取小的。


### 5.8 英文作答範例 {#u5-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** Besides its name, list the attributes of a file.

（中文：114 Q5a：除了名字，檔案還有哪些屬性？）

</div>

??? quiz "看英文參考答案"
    1. **Identifier**: a unique tag, usually a number, that identifies the file within the file system.
    2. **Type**: needed for systems that support different types of files.
    3. **Location**: a pointer to a device and to the location of the file on that device.
    4. **Size**: the current size of the file (and possibly the maximum allowed size).
    5. **Protection**: access-control information that determines who can read, write and execute the file.
    6. **Timestamps and user identification**: the time of creation, last modification and last use, and the owner; useful for protection, security and usage monitoring.

    寫法提示：六個屬性的英文名稱照課本寫，每個補半句說明（[5.1](#u5-1)）。

<div markdown="1">

**E-2.** (a) Describe three file access methods. (b) What are consistency semantics?

（中文：112 Q7：(a) 三種存取方式 (b) consistency semantics。）

</div>

??? quiz "看英文參考答案"
    (a)

    - **Sequential access**: information in the file is processed **in order**, one record after another (read next, write next). It is based on a tape model.
    - **Direct access**: the file is viewed as a numbered sequence of fixed-length blocks, and a program can read or write **any block in any order**. It suits databases.
    - **Indexed access**: an **index** containing pointers to the blocks is built. To find a record, we first search the index and then use the pointer to access the record directly.

    (b) **Consistency semantics** specify **when modifications** of data by one user **become observable** to other users who are accessing the same file simultaneously. Examples:

    - **UNIX semantics**: writes become visible **immediately** to other users who have the file open.
    - **Session semantics** (used by AFS): writes become visible only to sessions that start **after the file is closed**.
    - **Immutable-shared-files semantics**: a shared file **cannot be modified**.

    寫法提示：(b) 的定義句 when modifications become observable 一定要寫，再舉 UNIX、session 兩種（[5.1](#u5-1)）。

<div markdown="1">

**E-3.** What are the components of disk access time? How can it be reduced?

（中文：磁碟存取時間由哪些部分組成？怎麼縮短？）

</div>

??? quiz "看英文參考答案"
    For a hard disk, the **random-access time** consists of:

    1. **Seek time**: the time to move the disk arm to the desired cylinder.
    2. **Rotational latency**: the time for the desired sector to rotate under the disk head.

    Transferring the data then adds the **transfer time**. Seek time, usually the largest part, can be reduced by **disk scheduling** (for example SSTF, SCAN or C-SCAN) and by placing the blocks of a file close together (**clustering**). Rotational latency depends on the rotation speed of the disk.

    寫法提示：兩個主要部分 seek time、rotational latency 一定要寫；縮短方法寫 disk scheduling（[5.0](#u5-0)）。

<div markdown="1">

**E-4.** Compare polling, interrupt-driven I/O and DMA.

（中文：polling、中斷驅動 I/O、DMA 的比較。）

</div>

??? quiz "看英文參考答案"
    - **Polling (busy waiting)**: the host **repeatedly reads the busy bit** in the device controller's status register until the device is ready. It is efficient if the device is fast, but it **wastes CPU cycles** if the host must wait a long time.
    - **Interrupt-driven I/O**: the CPU starts the I/O operation and goes on with other work. When the device finishes, the controller **raises an interrupt**, and the CPU runs the **interrupt handler**.
    - **DMA (direct memory access)**: for large transfers, the CPU writes a command block to a **DMA controller**, which transfers the whole block **directly between the device and main memory** without the CPU. The DMA controller **interrupts the CPU once**, when the entire transfer is complete.

    寫法提示：三種的差別在「CPU 參與多少」：一直問、等通知、整塊交給 DMA 只通知一次（[5.0](#u5-0)）。

<div markdown="1">

**E-5.** How does interrupt chaining work?

（中文：114 Q5b：interrupt chaining 怎麼運作？）

</div>

??? quiz "看英文參考答案"
    In interrupt chaining, each element of the **interrupt vector** points to the **head of a list of interrupt handlers**. When an interrupt is raised, the handlers on the corresponding list are **called one by one** until one is found that can service the request.

    It is a **compromise** between the overhead of a **huge interrupt table** (one entry for every device) and the inefficiency of dispatching every interrupt to a **single interrupt handler**.

    寫法提示：一定要寫出 compromise：兩個極端各是什麼缺點（[5.3](#u5-3)）。

<div markdown="1">

**E-6.** Describe the steps of sector sparing when a bad sector is found.

（中文：115 Q4：sector sparing 的步驟。）

</div>

??? quiz "看英文參考答案"
    1. The OS tries to read **logical block 87**.
    2. The controller calculates the **ECC** and finds that the sector is **bad**.
    3. The controller reports this to the OS as an **I/O error**.
    4. The device controller **replaces the bad sector with a spare sector**.
    5. After that, whenever the system requests logical block 87, the controller **translates the request into the address of the spare sector**.

    寫法提示：重點是最後一步：之後的請求由 controller 自動轉到 spare，OS 不用知道（[5.2](#u5-2)）。

<div markdown="1">

**E-7.** Compare RAID levels 0, 1, 5 and 6.

（中文：RAID 0、1、5、6 的比較。）

</div>

??? quiz "看英文參考答案"
    - **RAID 0**: **block-level striping** without redundancy. It gives high performance, but the failure of any disk loses data.
    - **RAID 1**: **disk mirroring**; every disk has a copy. It survives a disk failure, but only half of the capacity is usable.
    - **RAID 5**: **block-interleaved distributed parity**. Data and parity are **spread across all the disks**, so one disk failure can be tolerated, and no single parity disk becomes a bottleneck.
    - **RAID 6**: stores **extra redundant information (P + Q redundancy)**, so it can tolerate **two disk failures** at the same time.

    寫法提示：每一級寫「怎麼存」和「能壞幾顆」；RAID 5 的 distributed parity 是和 RAID 4 的差別（[5.0](#u5-0)）。

### 5.9 考古題變化題 {#u5-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

**考古變化 1.**（改自 111 Q5・換數字・延伸）i-node 有 12 個直接區塊和 single、double、triple 間接區塊各一個；區塊 4 KB、指標 4 bytes。(a) 最大的檔案有幾個資料區塊？大約多大？(b) 4 bytes 的指標最多能指到多大的磁碟？哪一個限制比較緊？

??? quiz "看完整解答"
    - **跟原題差在哪**：直接區塊、區塊大小、指標大小都換了；(b) 多問指標寬度本身的限制。
    - **每個區塊放幾個指標**：$\frac{4\text{ KB}}{4\text{ B}}=1024=2^{10}$。
    - **(a)**：$12+2^{10}+2^{20}+2^{30}$ 個資料區塊，乘 4 KB 大約是 $2^{30}\times4\text{ KB}=$ **4 TB**（再加 4 GB、4 MB、48 KB 幾乎可以忽略）。
    - **(b)**：4 bytes 的指標能分辨 $2^{32}$ 個區塊，最多指到 $2^{32}\times4\text{ KB}=$ **16 TB** 的磁碟。
    - **哪個比較緊**：i-node 的結構只能撐到約 4 TB，比 16 TB 小，所以單一檔案的上限由**結構**決定。

    我用程式重算過每一步，答案一樣。


**考古變化 2.**（改自 111 Q7・換數字・延伸）讀一個 200 個區塊的檔案。未聚集時每個區塊平均 seek 8 ms；聚集後平均 seek 1 ms；rotational latency 平均 4 ms，每個區塊傳輸 0.05 ms。(1) 兩種各要多久？(2) 如果檔案完全連續，只要 seek 一次、等一次轉動，之後連續讀，要多久？

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了；(2) 多問「完全連續」，看出為什麼要盡量讓檔案放在一起。
    - **(1) 未聚集**：$200\times(8+4+0.05)=$ **2410 ms**；**聚集**：$200\times(1+4+0.05)=$ **1010 ms**。
    - **(2)**：$8+4+200\times0.05=$ **22 ms**。
    - **觀察**：聚集只省了 seek，每個區塊還是要等一次轉動；完全連續時連轉動都只等一次，快了一百倍。磁碟的時間幾乎都花在機械動作上。

    我用程式重算過每一步，答案一樣。


**考古變化 3.**（改自 110 Q2・換數字）磁柱 0–499，讀寫頭正在服務 143、上一個是 125；佇列（FIFO）86, 470, 313, 48, 409, 175, 22, 255。FCFS、SSTF、SCAN、LOOK、C-SCAN、C-LOOK 的總移動距離各是多少？

??? quiz "看完整解答"
    - **跟原題差在哪**：數字換了，多了 SSTF 和 C-SCAN；這組資料裡 SSTF 剛好跟 LOOK 一樣遠，可以順便比較。
    - **方向**：從 125 移到 143，正往編號大的方向走。
    - **FCFS（1844）**：照佇列順序 143 → 86 → 470 → 313 → 48 → 409 → 175 → 22 → 255，距離 $57+384+157+265+361+234+153+233$。
    - **SSTF（775）**：每次選最近的：175, 255, 313, 409, 470, 86, 48, 22。到 470 時只剩下面的，一路往下。
    - **SCAN（833）**：往上 175, 255, 313, 409, 470，走到盡頭 499，回頭 86, 48, 22：$(499-143)+(499-22)=356+477$。
    - **LOOK（775）**：往上到 470 就回頭：$(470-143)+(470-22)=327+448$。
    - **C-SCAN（含跳回 941，不含 442）**：往上到 499，跳回 0，再 22, 48, 86：$356+499+86$；不算跳回那段是 $356+86$。
    - **C-LOOK（含跳回 839，不含 391）**：往上到 470，跳回 22，再 48, 86：$327+448+64$；不算跳回是 $327+64$。
    - **作答時**：C-SCAN、C-LOOK 要寫清楚有沒有把跳回那段算進去。

    我用程式把六種演算法都模擬過，答案一樣。


**考古變化 4.**（改自 102 Q7、104 Q6(2)、107 Q3(2)・改方向）磁柱 0–199，讀寫頭在 100，**正往 0 的方向**移動；佇列 23, 89, 132, 42, 187, 11, 156。寫出 SSTF、SCAN、C-LOOK 的服務順序和總移動距離（C-LOOK 含跳回那段）。

??? quiz "看完整解答"
    - **跟原題差在哪**：這次是往 0 走，SCAN、C-LOOK 都要先處理比 100 小的要求；C-LOOK 跳回去之後是從最大的往下服務。
    - **SSTF（285）**：100 → 89（11）→ 132（43）→ 156（24）→ 187（31）→ 42（145）→ 23（19）→ 11（12）。SSTF 不管方向：到 89 時 132 差 43、42 差 47，所以先往上。
    - **SCAN（287）**：往下 89, 42, 23, 11，走到 0，再回頭 132, 156, 187：$100+187$。
    - **C-LOOK（320）**：往下 89, 42, 23, 11，跳到最大的 187，再往下 156, 132：$(100-11)+(187-11)+(187-132)=89+176+55$。
    - **觀察**：SSTF 在 89 時被「附近」的 132 吸走，結果最後要從 187 一路跑回 11，總距離反而比 SCAN 只少一點點；SSTF 也可能讓遠處的要求一直等（starvation）。

    我用程式把三種演算法都模擬過，答案一樣。


**考古變化 5.**（改自 115 Q4・改方法）磁碟的 logical block 17 壞了，第一個可用的備用 sector 在 sector 202 後面。(a) 用 sector sparing 怎麼處理？(b) 用 sector slipping 怎麼處理？(c) 兩種方法各有什麼缺點？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只問 sparing 的步驟；這題再加上另一種做法 slipping，比較兩者。
    - **(a) sector sparing**：controller 把 block 17 對應到那個備用 sector。之後讀寫 block 17 時，controller 自動把請求轉到備用 sector。
    - **(b) sector slipping**：把 17 到 202 的資料**全部往後挪一格**：202 搬到備用 sector、201 搬到 202、……、18 搬到 19，空出來的 18 號 sector 給 block 17 用。
    - **(c) 缺點**：
        - sparing：備用 sector 通常離原本的位置很遠，讀 block 17 時讀寫頭要多跑一段，可能打亂 OS 的磁碟排程（原本以為是連續的區塊，其實不是）。
        - slipping：要搬動很多 sector，修復時很花時間；好處是之後的區塊還是連續的。


**考古變化 6.**（改自 107 Q3(3)・實際算）RAID 有 4 顆資料磁碟和 1 顆 parity 磁碟。某個位置的資料分別是 D0 ＝ 1011 0010、D1 ＝ 0110 1100、D2 ＝ 1110 0001、D3 ＝ 0001 1111。(a) parity 是多少？(b) D2 壞了，怎麼救回來？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說明 parity 怎麼運作；這題用位元真的算一次。
    - **(a) parity ＝ 四顆 XOR**：
        - D0 ⊕ D1 ＝ 1101 1110
        - ⊕ D2 ＝ 0011 1111
        - ⊕ D3 ＝ **0010 0000**
    - **(b)**：把剩下的資料和 parity 全部 XOR：D0 ⊕ D1 ⊕ D3 ⊕ P ＝ 1101 1110 ⊕ 0001 1111 ⊕ 0010 0000 ＝ **1110 0001**，就是 D2。
    - **為什麼可以**：$x\oplus x=0$，所以 parity 再跟其他三顆 XOR，就只剩下壞掉的那一顆。只能救**一顆**；同時壞兩顆就救不回來（RAID 6 多一組 parity 才能救兩顆）。

    我用程式算過 XOR，答案一樣。


**考古變化 7.**（改自 112 Q7(b)・判斷）下面三種情況，各符合哪一種 consistency semantics（UNIX、session、immutable-shared-files）？(a) A 寫入檔案後，B 馬上讀就看到新內容 (b) A 改了檔案，B 要等 A 關檔、自己再重新開檔才看得到 (c) 檔案一旦建立、命名之後就不能修改

??? quiz "看完整解答"
    - **跟原題差在哪**：原題問 consistency semantics 是什麼；這題給情境要對回三種語意。
    - **(a) UNIX semantics**：寫入立刻對所有開著這個檔案的人可見。
    - **(b) session semantics**：修改在關檔之後才對「之後新開的 session」可見，AFS 用這種。
    - **(c) immutable-shared-files semantics**：檔案不能改，要改就建一個新檔，所以根本不會有一致性的問題。


### 單元 5 小考 {#u5-quiz}

**5-1.** i-node 有 12 個直接區塊和 single、double indirect，區塊 4 KB、指標 4 B，最大檔案幾個資料區塊？

??? quiz "看答案"
    每個區塊放 $4\text{ KB}\div4\text{ B}=1024$ 個指標。

    - 12 個 direct：12 個資料區塊
    - single indirect：一個區塊的指標 → 1024 個
    - double indirect：1024 個指標各指到一個指標區塊，各再指 1024 個 → $1024^2=1048576$ 個

    共 $12+1024+1048576=$ **1049612** 個資料區塊（約 $1049612\times4\text{ KB}\approx4$ GB）。

**5-2.** RAID 5 和 RAID 6 的差別？

??? quiz "看答案"
    RAID 5 用分散的單一 parity，可承受 1 顆故障；RAID 6 多一份 Q（另一種錯誤更正碼），可承受 2 顆同時故障。

## 單元 6：保護、安全與其他 {#u6}

### 6.0 觀念課：保護和安全在防什麼 {#u6-0}

#### 安全的三個目標（CIA）

| 目標 | 被破壞時 | 例子 |
|---|---|---|
| confidentiality（機密性） | 沒有權限的人**讀到**資料 | 成績被別人偷看 |
| integrity（完整性） | 沒有權限的人**改了**資料 | 成績被竄改 |
| availability（可用性） | 合法使用者**用不了**服務 | 選課系統被灌爆 |

#### 最小權限

**principle of least privilege**（最小權限）和 **need-to-know** 是同一類想法：每個行程、每個使用者只拿到**完成目前工作需要**的權限和資源。出事時，損害才會被限制在小範圍。兩者在恐龍書裡的說法有一點差別，是非題考過，見 [6.2](#u6-more)。

#### 存取矩陣：誰能對什麼做什麼

把權限畫成一張表：列是使用者（domain），欄是檔案（object），格子裡是權限。

| | file1 | file2 | printer |
|---|---|---|---|
| Alice | read, write | read | print |
| Bob | read | — | print |

- 照**欄**存（每個檔案記錄誰能用它）→ **access control list（ACL）**
- 照**列**存（每個使用者帶著自己能用什麼）→ **capability list**

<figure class="fig">
<svg viewBox="0 0 360 196" role="img" aria-label="存取矩陣：列是 Alice、Bob、Carol，欄是 file1、file2、printer。把 file1 那一欄存起來，就是 file1 的 ACL；把 Alice 那一列存起來，就是 Alice 的 capability list。">
<text x="137" y="28" text-anchor="middle" dominant-baseline="central" class="sm mono">file1</text>
<text x="219" y="28" text-anchor="middle" dominant-baseline="central" class="sm mono">file2</text>
<text x="301" y="28" text-anchor="middle" dominant-baseline="central" class="sm mono">printer</text>
<text x="88" y="56" text-anchor="end" dominant-baseline="central" class="sm mono">Alice</text>
<rect class="box" x="96" y="40" width="82" height="32"/>
<rect class="box" x="178" y="40" width="82" height="32"/>
<rect class="box" x="260" y="40" width="82" height="32"/>
<text x="88" y="88" text-anchor="end" dominant-baseline="central" class="sm mono">Bob</text>
<rect class="box" x="96" y="72" width="82" height="32"/>
<rect class="box" x="178" y="72" width="82" height="32"/>
<rect class="box" x="260" y="72" width="82" height="32"/>
<text x="88" y="120" text-anchor="end" dominant-baseline="central" class="sm mono">Carol</text>
<rect class="box" x="96" y="104" width="82" height="32"/>
<rect class="box" x="178" y="104" width="82" height="32"/>
<rect class="box" x="260" y="104" width="82" height="32"/>
<rect class="fb" x="96" y="40" width="82" height="96"/>
<rect class="fc" x="96" y="40" width="246" height="32"/>
<text x="137" y="56" text-anchor="middle" dominant-baseline="central" class="sm">read, write</text>
<text x="219" y="56" text-anchor="middle" dominant-baseline="central" class="sm">read</text>
<text x="301" y="56" text-anchor="middle" dominant-baseline="central" class="sm">print</text>
<text x="137" y="88" text-anchor="middle" dominant-baseline="central" class="sm">read</text>
<text x="219" y="88" text-anchor="middle" dominant-baseline="central" class="sm">—</text>
<text x="301" y="88" text-anchor="middle" dominant-baseline="central" class="sm">print</text>
<text x="137" y="120" text-anchor="middle" dominant-baseline="central" class="sm">—</text>
<text x="219" y="120" text-anchor="middle" dominant-baseline="central" class="sm">read, write</text>
<text x="301" y="120" text-anchor="middle" dominant-baseline="central" class="sm">—</text>
<text x="137" y="154" text-anchor="middle" dominant-baseline="central" class="sm tb">一欄 → ACL</text>
<text x="338" y="154" text-anchor="end" dominant-baseline="central" class="sm tc">一列 → capability list</text>
<text x="180" y="180" text-anchor="middle" dominant-baseline="central" class="sm">ACL 跟著檔案；capability 跟著使用者</text>
</svg>
<figcaption>同一張矩陣，直的切下來是 ACL，橫的切下來是 capability list</figcaption>
</figure>

**哪一種比較方便**：要知道「這個檔案誰能用」，或要撤銷某個檔案的所有權限，ACL 一次看完；要知道「這個人能用哪些東西」，capability list 一次看完。實際的系統常常兩個混著用。

#### 惡意程式的名詞

| 名詞 | 特徵 |
|---|---|
| virus | 附在別的程式上，靠程式執行來散播 |
| worm | 自己透過網路複製散播，不用附在別的程式上 |
| trojan horse | 假裝成有用的程式，暗中做壞事 |
| logic bomb | 平常不動，特定條件（日期、事件）成立才發作 |
| stealth virus | 修改系統中可能偵測到它的部分，躲避防毒 |

這一單元的分數幾乎都在**名詞填空**，看懂意思後，把英文名詞做成閃卡背起來。

!!! key "保護與安全題要做什麼"
    | 題目問 | 怎麼答 |
    |---|---|
    | 破壞了 CIA 的哪一項 | 被讀到 → confidentiality；被改 → integrity；用不了 → availability |
    | ACL 和 capability | ACL 是存取矩陣的一欄（跟著物件）；capability 是一列（跟著使用者） |
    | 最小權限、need-to-know | 前者講權限（privilege），後者講資源（object）（[6.2](#u6-more)） |
    | MAC 和數位簽章 | MAC 用共用金鑰，不能防否認；簽章用私鑰簽、公鑰驗，能防否認 |
    | 惡意程式名詞 | virus 要寄生、worm 自己散播、trojan 偽裝、logic bomb 條件成立才發作 |
    | Lamport 時鐘 | 每個事件加 1；收訊息取 max(自己的, 訊息的) ＋ 1（[6.3](#u6-dist)） |

    名詞對照：confidentiality／integrity／availability（機密性／完整性／可用性）、access matrix（存取矩陣）、access control list（存取控制串列）、capability list（能力串列）、nonrepudiation（不可否認性）。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記**：〈[OS 筆記 Chapter 14: Protection](https://hackmd.io/izkd4JwXRwub_ZmhSMTlNw)〉：保護的原則、存取矩陣、ACL 與 capability 的實作、權限撤銷，就是這節表格的完整版。

#### 換你試試

**T-1.** 有人偷改了資料庫裡的成績，破壞的是 CIA 的哪一項？

??? quiz "看答案"
    integrity。

**T-2.** 每個檔案附一份「誰可以讀寫」的名單，這叫什麼？

??? quiz "看答案"
    access control list（ACL）。

### 6.1 考古題與重點整理 {#u6-1}

- **need-to-know principle**：process 任何時候只能存取完成工作**目前需要**的資源。（115 Q1i）
- **role-based access control** 中，**privilege** 是執行某個 system call 或使用其選項的權利。（113 Q8h）
- 違反 **confidentiality** ＝ 未經授權讀取資料。（115 Q1j）
- **AES** 金鑰長度 128、**192**、256 位元，區塊 128 位元。（113 Q8i）
- **stealth virus**：修改系統中可能偵測到它的部分來躲避偵測。（113 Q8j）
- **logic bomb**：藏在程式裡、只有在特定條件（日期、事件）成立時才啟動的惡意程式碼。（112 Q9c）
- **safety-critical system**：失敗會造成人命或重大損失的即時系統，例如醫療、武器、飛航控制。（112 Q9b）

!!! example "112 Q8b–c（6%）：即時系統的三種延遲、分散式檔案系統不用 cache 的理由"
    (b) **event latency**：事件發生到被服務的總時間；其中包含 **interrupt latency**（中斷發生到開始執行 ISR）和 **dispatch latency**（排程器停掉一個 process、啟動另一個的時間）。

    (c) 不用 cache 的理由：(1) **寫入頻繁**時，維持 cache 一致性的成本很高；(2) 資料**很少被重複存取**，cache 沒有幫助；(3) 用戶端是**無磁碟或記憶體很小**的機器；(4) 多人**同時寫入共享檔案**，需要嚴格一致性時，直接遠端存取（remote service）比較簡單。

!!! example "113 Q7（10%）：timestamp-ordering protocol 怎麼檢查"
    **$T_i$ 發出 read(Q)**：

    - 若 $TS(T_i)<\text{W-timestamp}(Q)$：$T_i$ 要讀的值已經被較新的交易覆蓋，**拒絕並 rollback $T_i$**。
    - 否則執行，並設 $\text{R-timestamp}(Q)=\max(\text{R-timestamp}(Q),TS(T_i))$。

    **$T_i$ 發出 write(Q)**：

    - 若 $TS(T_i)<\text{R-timestamp}(Q)$：較新的交易已經讀過舊值，**rollback $T_i$**。
    - 若 $TS(T_i)<\text{W-timestamp}(Q)$：$T_i$ 寫的是過時的值，**rollback $T_i$**。
    - 否則執行，設 $\text{W-timestamp}(Q)=TS(T_i)$。

    這樣保證所有衝突操作都依 timestamp 順序執行，所以排程是 conflict serializable。

### 6.2 安全的考古題補充：認證、數位簽章、攻擊手法 {#u6-more}

101、102、105、107 年考過的保護與安全觀念題。

#### 最小權限和 need-to-know 不完全一樣

兩個是同一類想法，但恐龍書的說法不同，是非題會考這個差別（102 Q5(1)）：

| 原則 | 恐龍書的說法 |
|---|---|
| **principle of least privilege** | 程式、使用者、甚至系統，只給**剛好夠完成工作的權限**（privilege） |
| **need-to-know** | process 在任何時刻只能存取**目前工作需要的資源**（object） |

#### 保護網域（protection domain）怎麼實作

domain 是「一組 <object, 權限> 的集合」，process 在某個 domain 裡執行，就有那些權限。恐龍書列出三種實作方式，以及什麼時候會**切換 domain**：

| domain 對應到 | 什麼時候切換 |
|---|---|
| 每個**使用者** | 換使用者時（登出、另一個人登入） |
| 每個 **process** | 一個 process 送訊息給另一個並等它回應時 |
| 每個**程序**（procedure） | 呼叫另一個程序時 |

UNIX 的 **setuid**：執行檔設了 setuid 位元，任何人執行它時都暫時拿到**檔案擁有者**的身分（例如 `passwd` 要改密碼檔，暫時變成 root），這就是一種切換 domain 的方式。

#### 認證：MAC 和數位簽章

| | MAC（message authentication code） | 數位簽章（digital signature） |
|---|---|---|
| 金鑰 | 雙方**共用同一把**祕密金鑰（對稱式） | 簽的人用**私鑰**，大家用**公鑰**驗證（非對稱式） |
| 傳送方 | 算 $\text{MAC}_k(m)$，跟 m 一起送 | 算 $\text{Sign}_{\text{私鑰}}(H(m))$，跟 m 一起送 |
| 接收方 | 用同一把 k 重算一次，跟收到的比 | 用公鑰驗證簽章跟 $H(m)$ 對得上 |
| 能證明 | 訊息沒被改、是有 k 的人送的 | 訊息沒被改、是**有私鑰的那個人**送的 |
| nonrepudiation（不可否認） | **沒有**：雙方都有 k，收方也能偽造 | **有**：只有簽的人有私鑰，事後不能否認 |

$H(m)$ 是 [資結 4.2](ds.html#u4-theory) 的密碼學雜湊函數，先把訊息壓短再簽。

**公鑰怎麼發**（105 Q4(4)）：公鑰可以公開，問題是怎麼確定這把公鑰真的是對方的（不然中間人可以換成自己的）。做法是**數位憑證**（digital certificate）：可信任的憑證機構（CA）用它的私鑰簽署「這把公鑰屬於某某人」，CA 的公鑰事先內建在瀏覽器或作業系統裡。

#### 攻擊手法的名詞

| 名詞 | 意思 |
|---|---|
| masquerading（偽裝） | 假裝成別人 |
| man-in-the-middle（中間人） | 攻擊者夾在通訊的兩方中間，對兩邊都假裝成另一方，可以讀和改傳的資料 |
| replay attack（重送） | 把截到的合法訊息再送一次（例如重送一筆轉帳） |
| trap door（後門） | 程式設計者故意留的祕密入口 |
| DDoS（distributed denial of service） | 很多台被控制的電腦（殭屍網路 botnet）同時對目標送大量要求，耗光它的資源，正常使用者用不了 |
| polymorphic virus（多型病毒） | 每次感染都改變自己的程式碼（例如換一把金鑰加密自己），**病毒碼（signature）一直變**，比對特徵的防毒軟體認不出來 |
| tunneling virus（穿隧病毒） | 把自己裝到中斷處理程式、驅動程式那一層，**繞過**防毒軟體監看的地方 |

**偵測入侵的兩種方式**（105 Q4(5)）：

- **signature-based**：比對已知攻擊的特徵。誤報少，但**新的攻擊認不出來**。
- **anomaly detection**：先學「正常的樣子」，偏離就警告。能抓到沒見過的攻擊，但**誤報比較多**。

!!! example "101 Q5（10%）：MAC 和數位簽章怎麼運作？"
    **MAC**：雙方事先共用祕密金鑰 k。傳送方用 k 對訊息算出一個短的認證碼 $\text{MAC}_k(m)$，跟訊息一起送；接收方用同一把 k 重算，一樣就表示訊息沒被改、而且是知道 k 的人送的。

    **數位簽章**：傳送方先算訊息的雜湊 $H(m)$，再用自己的**私鑰**簽成簽章，跟訊息一起送；接收方用傳送方的**公鑰**驗證簽章，跟自己算的 $H(m)$ 對得上就通過。因為只有傳送方有私鑰，還能提供 nonrepudiation。

!!! example "105 Q4（15%）：(1) protection domain 的實作與切換時機 (2) language-based protection 的優點 (3) virus 和 worm 的差別 (4) 非對稱加密怎麼發金鑰 (5) signature-based 和 anomaly detection 的差別"
    - **(1)** 使用者、process、程序三種，切換時機見上表。
    - **(2) language-based protection**：在程式語言裡宣告保護需求（例如 Java 的型別安全、存取修飾子），由編譯器和執行環境檢查。優點：保護需求用宣告的方式寫，簡單清楚；不依賴特定作業系統的機制；可以做到很細的粒度（例如單一物件、單一方法）。
    - **(3)** virus 要附在別的程式上、靠那個程式執行來散播；worm 是獨立的程式，自己透過網路複製散播（[6.0](#u6-0) 的表）。
    - **(4)** 公鑰公開發送，用 CA 簽的數位憑證證明公鑰的主人（見上面）。
    - **(5)** 見上面「偵測入侵的兩種方式」。

!!! example "107 Q4（15%）：(1) 最小權限是什麼？Solaris 怎麼實作 (2) language-based protection 為什麼可能不安全 (3) polymorphic、tunneling virus 怎麼躲過防毒 (4) 數位簽章怎麼運作 (5) DDoS 怎麼運作"
    - **(1)** 最小權限：只給剛好夠完成工作的權限。Solaris 10 用 **role-based access control（RBAC）**：把細分的權限（privilege，例如執行某個 system call）指定給**角色**（role），使用者需要時才切換成那個角色、執行特定程式，不用整個變成 root。
    - **(2)** 它的保護靠**編譯器和執行環境**正確檢查。如果編譯器有漏洞、或程式碼不是經過可信任的編譯器產生的（例如直接改 bytecode），檢查就被繞過。硬體（kernel mode、記憶體保護）強制的保護比較難繞過。
    - **(3)** polymorphic：每次感染都改變自己的樣子，特徵碼對不上；tunneling：把自己裝到比防毒軟體更底層的地方（中斷處理、驅動程式），防毒軟體看不到它。
    - **(4)** 數位簽章：見 101 Q5。
    - **(5)** DDoS：攻擊者控制大量電腦（botnet），同時對目標送大量要求，耗盡頻寬、CPU 或連線數，正常使用者無法使用；流量來自四面八方，很難用封鎖單一來源擋掉。

!!! example "102 Q5（14%，每小題 2%，答錯倒扣）：是非題"
    1. 「need-to-know 原則：程式、使用者、甚至系統只給剛好夠的權限……」：**錯**。這段話是 principle of **least privilege** 的定義（見上面的表）。
    2. 「四個條件任一個成立就一定死結」：**錯**，要四個**同時**成立（[3.2](#u3-more)）。
    3. 「relocation register 是 1877、邏輯位址 123，實體位址 2000」：**對**（[4.5](#u4-alloc)）。
    4. 「編譯器裡藏了 trap door，仔細檢查被編譯的程式的原始碼還是找得到」：**錯**。後門在**編譯器**裡，被編譯的程式原始碼完全正常，看它的原始碼找不到（Ken Thompson 的〈Reflections on Trusting Trust〉）。
    5. 「通訊的一方假裝成別人叫 man-in-the-middle」：**錯**，假裝成別人是 **masquerading**；中間人是攻擊者夾在兩方中間。
    6. 「RAID 0+1 兼顧效能（RAID 0）和可靠度（RAID 1），通常比 RAID 5 快」：**對**。
    7. 「location transparency 能在不同時間把同一個檔名對應到不同位置，所以比 location independence 強」：**錯**，說反了。能動態改變對應位置的是 **location independence**，它比 location transparency 強。

#### 觀念小考

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 哪一種方法能提供 nonrepudiation（送的人事後不能否認）？

1. MAC
2. 數位簽章
3. 對稱式加密
4. 雜湊函數

??? quiz "看解析"
    **B**。只有簽的人有私鑰，別人做不出同樣的簽章，所以他不能否認。MAC 的金鑰雙方都有，收方也能自己做出同樣的 MAC，無法證明是誰送的。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** 防毒軟體靠比對特徵碼，哪一種病毒最難被這種方法抓到？

1. boot virus
2. macro virus
3. logic bomb
4. polymorphic virus

??? quiz "看解析"
    **D**。polymorphic virus 每次感染都改變自己的程式碼，沒有固定的特徵碼可以比對。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** 攻擊者把截到的合法登入訊息再送一次，取得權限，這叫什麼？

1. replay attack
2. masquerading
3. DDoS
4. trap door

??? quiz "看解析"
    **A**。訊息本身是合法的，只是被重送。對策是在訊息裡加時間戳記或一次性的亂數（nonce），重送的舊訊息就會被拒絕。

</div>

### 6.3 分散式系統與網路：CSMA/CD、token passing、事件的先後 {#u6-dist}

101 年（區域網路怎麼避免碰撞，10%）、102 年（分散式系統的事件順序，10%）、104 年（分散式檔案系統的名詞，1%）考過。另外 102 年的分散式檔案系統命名在 [6.2](#u6-more)，atomic transaction、two-phase locking 在 [2.2](#u2-more)，分散式檔案系統的 cache 在 [6.1](#u6-1)。

#### 區域網路裡，兩台電腦同時傳資料怎麼辦？

同一條線上的電腦同時送資料，訊號會疊在一起變成雜訊，叫**碰撞**（collision）。兩種做法：

**CSMA/CD**（carrier sense multiple access with collision detection，乙太網路用的）：

1. **先聽**（carrier sense）：線上有人在傳就等，沒人才傳。
2. **邊傳邊聽**（collision detection）：兩台剛好同時開始傳，會偵測到訊號跟自己送的不一樣。
3. **碰撞了就停**：送出 jam 訊號讓大家知道，然後**各自等一段隨機的時間**再重來。連續碰撞 k 次，就從 0 到 $2^k-1$ 個時槽裡隨機挑一個等（binary exponential backoff），越撞等越久，避免一直撞在一起。

**token passing**（token ring）：

1. 一個特殊的訊息 **token** 在環上一台傳一台。
2. **拿到 token 的才可以傳資料**；傳完（或拿太久）就把 token 交給下一台。
3. 同一時間只有一台能傳，**不會碰撞**。token 弄丟了要重新產生（選一台負責）。

| | CSMA/CD | token passing |
|---|---|---|
| 會不會碰撞 | 會，撞了再重傳 | 不會 |
| 人少（負載輕） | 好：想傳就傳，幾乎不用等 | 要等 token 繞過來 |
| 人多（負載重） | 差：碰撞一直發生，有效流量下降 | 好：大家輪流，最多等一圈 |
| 等多久有上限嗎 | 沒有（運氣差會一直撞） | 有，適合要保證延遲的系統 |

#### 分散式系統裡，為什麼很難知道誰先發生？

分散式系統的電腦**沒有共用的時鐘、也沒有共用的記憶體**，只能傳訊息。每台電腦的時鐘快慢不一樣（會漂移），訊息在網路上要花多久也不固定。所以 A 機器記錄 10:00:01、B 機器記錄 10:00:02，**不能保證 A 的事件真的比較早**。

#### happened-before（→）：只用能確定的事排順序

Lamport 定義的 happened-before 關係，A → B 讀作「A 在 B 之前發生」：

1. **同一個 process 裡**：A 比 B 先執行，就 A → B。
2. **傳訊息**：A 是某個 process 送出一個訊息，B 是另一個 process 收到同一個訊息，就 A → B（先送才能收）。
3. **遞移**：A → B 而且 B → C，就 A → C。

A → B 和 B → A **都不成立**的兩個事件叫**同時發生**（concurrent），誰先誰後都無所謂，它們不可能互相影響。

#### Lamport 邏輯時鐘：幫每個事件編號

每個 process 有一個計數器 LC：

- 每發生一個事件，LC 加 1，這個數字就是事件的時間戳記。
- 送訊息時，把自己的時間戳記附在訊息上。
- 收到訊息時，$\text{LC}=\max(\text{LC},\text{訊息的戳記})+1$，保證收的事件一定比送的晚。

**例子**：P1 依序有 a、b（送訊息給 P2）、c；P2 有 d（收到 P1 的訊息）、e（送訊息給 P3）；P3 有 f、g（收到 P2 的訊息）。

| 事件 | process | 時間戳記 | 說明 |
|---|---|---|---|
| a | P1 | 1 | P1 的第一個事件 |
| b | P1 | 2 | 送訊息，戳記 2 附在訊息上 |
| c | P1 | 3 | |
| d | P2 | 3 | 收訊息：$\max(0,2)+1$ |
| e | P2 | 4 | 送訊息，附上 4 |
| f | P3 | 1 | P3 的第一個事件 |
| g | P3 | 5 | 收訊息：$\max(1,4)+1$ |

<figure class="fig">
<svg viewBox="0 0 360 206" role="img" aria-label="三條橫線是 P1、P2、P3 的時間軸，往右是時間。P1 有 a、b、c，b 送訊息給 P2 的 d；P2 有 d、e，e 送訊息給 P3 的 g；P3 有 f、g。時間戳記：a 1、b 2、c 3、d 3、e 4、f 1、g 5。">
<text x="18" y="44" text-anchor="middle" dominant-baseline="central" class="sm mono">P1</text>
<line class="arw" x1="38" y1="44" x2="338.0" y2="44.0"/>
<polygon class="ah" points="346.0,44.0 338.0,48.5 338.0,39.5"/>
<text x="18" y="104" text-anchor="middle" dominant-baseline="central" class="sm mono">P2</text>
<line class="arw" x1="38" y1="104" x2="338.0" y2="104.0"/>
<polygon class="ah" points="346.0,104.0 338.0,108.5 338.0,99.5"/>
<text x="18" y="164" text-anchor="middle" dominant-baseline="central" class="sm mono">P3</text>
<line class="arw" x1="38" y1="164" x2="338.0" y2="164.0"/>
<polygon class="ah" points="346.0,164.0 338.0,168.5 338.0,159.5"/>
<line class="arw-a" x1="134.44" y1="48.036" x2="185.6" y2="94.6"/>
<polygon class="ah-a" points="191.6,100.0 182.6,97.9 188.7,91.3"/>
<line class="arw-a" x1="266.094" y1="108.386" x2="308.4" y2="153.8"/>
<polygon class="ah-a" points="313.9,159.6 305.2,156.8 311.7,150.7"/>
<circle class="ah" cx="70" cy="44" r="5"/>
<text x="70" y="30" text-anchor="middle" dominant-baseline="central" class="sm mono">a : 1</text>
<circle class="ah" cx="130" cy="44" r="5"/>
<text x="130" y="30" text-anchor="middle" dominant-baseline="central" class="sm mono">b : 2</text>
<circle class="ah" cx="250" cy="44" r="5"/>
<text x="250" y="30" text-anchor="middle" dominant-baseline="central" class="sm mono">c : 3</text>
<circle class="ah" cx="196" cy="104" r="5"/>
<text x="196" y="122" text-anchor="middle" dominant-baseline="central" class="sm mono">d : 3</text>
<circle class="ah" cx="262" cy="104" r="5"/>
<text x="262" y="90" text-anchor="middle" dominant-baseline="central" class="sm mono">e : 4</text>
<circle class="ah" cx="92" cy="164" r="5"/>
<text x="92" y="150" text-anchor="middle" dominant-baseline="central" class="sm mono">f : 1</text>
<circle class="ah" cx="318" cy="164" r="5"/>
<text x="318" y="182" text-anchor="middle" dominant-baseline="central" class="sm mono">g : 5</text>
<text x="178" y="198" text-anchor="middle" dominant-baseline="central" class="sm ta">收訊息：max(自己的, 訊息的) ＋ 1</text>
</svg>
<figcaption>畫成時空圖：每條橫線是一個 process，斜的箭頭是訊息；沿著箭頭和橫線走得到的，才有先後關係</figcaption>
</figure>

**保證**：A → B 就一定 LC(A) < LC(B)。反過來不一定：c（3）和 f（1）是同時發生的，數字大小沒有意義。要排出全部事件的順序（total order），戳記一樣時用 process 編號決定。

!!! example "101 Q6（10%）：區域網路裡的電腦可能同時傳資料，造成嚴重的碰撞。說明 CSMA/CD 和 token passing 怎麼運作"
    **CSMA/CD**：傳之前先聽線路，沒人才傳；傳的時候繼續聽，偵測到碰撞就停止、送 jam 訊號，等一段隨機時間（binary exponential backoff）再重傳。

    **token passing**：一個 token 在網路上依序傳遞，只有拿到 token 的電腦可以傳資料，傳完把 token 交給下一台，所以不會碰撞。

    （可以再補上面那張比較表：負載輕時 CSMA/CD 好，負載重或需要保證延遲時 token passing 好。）

!!! example "102 Q8（10%）：(1) 分散式系統為什麼很難決定事件的順序 (2) 用 A、B、C 和 →，寫出 happened-before 的三條規則 (3) 什麼是 atomic transaction"
    **(1)** 沒有共用的時鐘和記憶體；各台電腦的時鐘有誤差，訊息的延遲不固定，不能用各自的時間比先後。

    **(2)**

    - A、B 在同一個 process，A 先執行 → A → B。
    - A 是送出一個訊息、B 是另一個 process 收到這個訊息 → A → B。
    - A → B 且 B → C → A → C。

    **(3)** 一組讀寫要嘛**全部完成**（commit），要嘛**全部取消**（abort，回到開始前的狀態），不會只做一半。例：轉帳的扣款和入帳一定要一起成功。（[2.2](#u2-more)）

!!! example "104 Q6(3)（1%）：分散式檔案系統的 component unit 是什麼？"
    **可以放在同一台機器上、跟其他 unit 互不相關的最小一組檔案**。同一個 component unit 裡的檔案一定放在同一個地方，命名和搬移都以它為單位。

#### 觀念小考

<div class="mcq" data-ans="2" markdown="1">

**C-1.** CSMA/CD 偵測到碰撞之後，為什麼要等一段**隨機**的時間再重傳？

1. 讓線路冷卻
2. 如果兩台等一樣久，重傳時會再撞一次
3. 讓 token 先傳一圈
4. 讓接收端有時間檢查錯誤

??? quiz "看解析"
    **B**。兩台同時撞到、又等一樣久，就會同時重傳、再撞一次。隨機等，兩台錯開的機會很大；連續撞越多次，隨機的範圍越大（$0$ 到 $2^k-1$ 個時槽）。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** P1 送一個訊息給 P2（P1 的事件 s、P2 的事件 r）。P1 在 s 之前有事件 a，P2 在 r 之前有事件 b。下面哪一對是同時發生（concurrent）？

1. a 和 s
2. s 和 r
3. a 和 r
4. a 和 b

??? quiz "看解析"
    **D**。a → s（同一個 process）、s → r（傳訊息）、所以 a → r（遞移）。b 在 r 之前、跟 P1 的事件沒有任何訊息連起來，a 和 b 誰也推不出誰先，是同時發生。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** token passing 比 CSMA/CD 好的地方是？

1. 負載很重時效率高，而且等待時間有上限
2. 負載很輕時延遲比較低
3. token 不會弄丟
4. 不需要任何控制訊息

??? quiz "看解析"
    **A**。大家輪流拿 token，最多等一圈，不會碰撞。B 剛好相反，負載輕時還是要等 token 繞過來；C、D 錯，token 會弄丟、要有重新產生 token 的機制，token 本身就是控制訊息。

</div>

**W-1.** P1 的事件依序是 x、y（送訊息 m 給 P2）；P2 的事件依序是 u、v、w（w 收到 m）。用 Lamport 邏輯時鐘標出每個事件的時間戳記。

??? quiz "看參考答案"
    | 事件 | 時間戳記 | 說明 |
    |---|---|---|
    | x | 1 | P1 第一個事件 |
    | y | 2 | 送 m，附上 2 |
    | u | 1 | P2 第一個事件 |
    | v | 2 | |
    | w | 3 | 收 m：$\max(2,2)+1=3$ |

    w 的戳記 3 比 y 的 2 大，符合「送一定比收早」。u、v 和 x、y 之間沒有訊息連接，是同時發生的。

### 6.4 觀念小考 {#u6-concept}

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 選課系統被大量假請求灌爆，正常的學生都連不上。破壞的是 CIA 的哪一項？

1. confidentiality
2. availability
3. integrity
4. 都沒有

??? quiz "看解析"
    **B**。資料沒被偷看也沒被改，但合法的使用者用不了服務，這是 availability。這種攻擊叫 DoS（denial of service）。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-2.** 把存取矩陣「照欄存」，每個物件記錄誰能用它、能做什麼，這叫什麼？

1. capability list
2. protection domain
3. role
4. access control list

??? quiz "看解析"
    **D**。一欄就是一個物件，記在物件旁邊就是 ACL。照列存（跟著使用者）才是 capability list。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** 想知道「Alice 能存取哪些東西」，哪一種存法最快？

1. capability list
2. ACL
3. 兩種一樣快
4. 兩種都查不到

??? quiz "看解析"
    **A**。Alice 的那一列就是她的 capability list。用 ACL 的話，要把每個物件的名單都翻一遍。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-4.** 數位簽章能做到、MAC 做不到的是？

1. 檢查訊息有沒有被改（integrity）
2. 讓別人看不到訊息內容（confidentiality）
3. 送的人事後不能否認（nonrepudiation）
4. 讓服務不會中斷（availability）

??? quiz "看解析"
    **C**。MAC 的金鑰雙方都有，收的人自己也算得出同一個 MAC，所以無法證明是誰送的。簽章只有持有私鑰的人做得出來。A 兩個都做得到；B 要靠加密，兩個都不是在做這件事。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** Lamport 時鐘：P2 的計數器現在是 3，收到一個戳記是 7 的訊息。收訊息這個事件的戳記是？

1. 4
2. 8
3. 7
4. 10

??? quiz "看解析"
    **B**。$\max(3,7)+1=8$，保證收的事件比送的事件（7）晚。A 是忘了跟訊息的戳記比。

</div>

**W-1.** P1 依序有 a、b（送訊息 m1 給 P2）、c（收到 P2 的 m2）；P2 依序有 d、e（收到 m1）、f（送 m2 給 P1）。寫出每個事件的 Lamport 時間戳記。a 和 d 誰先發生？

??? quiz "看參考答案"
    | 事件 | 戳記 | 說明 |
    |---|---|---|
    | a | 1 | P1 的第一個事件 |
    | b | 2 | 送 m1，附上 2 |
    | d | 1 | P2 的第一個事件 |
    | e | 3 | 收 m1：$\max(1,2)+1$ |
    | f | 4 | 送 m2，附上 4 |
    | c | 5 | 收 m2：$\max(2,4)+1$ |

    **a 和 d 是同時發生的（concurrent）**：從 a 出發，要經過 m1 才到 P2，到的是 e，在 d 之後，所以 a → d 不成立；P2 在 d 之前沒有送任何訊息給 P1，d → a 也不成立。兩個的戳記剛好都是 1，但就算數字不一樣，也不代表誰先誰後。

**W-2.** Alice 對 file1 可以 read、write；Bob 對 file1 只能 read、對 file2 可以 read、write；Alice 對 file2 沒有權限。寫出 file1 的 ACL 和 Bob 的 capability list。如果要撤銷所有人對 file2 的存取，哪一種存法比較方便？

??? quiz "看參考答案"
    - **file1 的 ACL**：Alice：read、write；Bob：read。
    - **Bob 的 capability list**：file1：read；file2：read、write。
    - **撤銷 file2：ACL 比較方便**。所有權限都記在 file2 自己的名單上，清掉這一份就好；用 capability 的話，要找出每個使用者（或已經發出去的 capability）裡有 file2 的那一項，一個一個刪。

### 6.5 英文作答範例 {#u6-en}

考卷是英文，觀念題用英文答最直接。先自己寫（寫中文也可以），再打開參考答案對照，把**粗體的關鍵字**記起來。寫法見 [0. 中山 OS 怎麼考](#u0-en)。

<div markdown="1">

**E-1.** Distinguish between protection and security.

（中文：protection 和 security 的差別。）

</div>

??? quiz "看英文參考答案"
    **Protection** is an **internal** problem: it is the mechanism for **controlling the access** of processes or users to the resources defined by a computer system.

    **Security** deals with **external** threats: it ensures the integrity of the system and its data by defending against **unauthorized access, malicious destruction or alteration**, and the accidental introduction of inconsistency.

    Protection mechanisms work only if users are correctly identified, so security needs both protection and an adequate **authentication** system.

    寫法提示：internal／external 是最短的分法，再各補一句「做什麼」（[6.0](#u6-0)）。

<div markdown="1">

**E-2.** Explain the principle of least privilege and the need-to-know principle.

（中文：102 Q5、115 Q1i：最小權限原則和 need-to-know 原則。）

</div>

??? quiz "看英文參考答案"
    - **Principle of least privilege**: programs, users and even systems are given **just enough privileges to perform their tasks**. If a component fails or is compromised, the damage it can do is limited.
    - **Need-to-know principle**: at any time, a process should be able to access **only those resources that it currently requires** to complete its task.

    The two ideas are similar: least privilege limits the **privileges** that are granted, whereas need-to-know limits **which resources** a process can access, and only for the moment it needs them.

    寫法提示：least privilege 講「權限」，need-to-know 講「目前需要的資源」，是非題會考差別（[6.2](#u6-more)）。

<div markdown="1">

**E-3.** Compare access lists and capability lists as implementations of the access matrix.

（中文：access list 和 capability list 的比較。）

</div>

??? quiz "看英文參考答案"
    The **access matrix** has a row for each **domain** and a column for each **object**; entry access(i, j) is the set of operations that a process in domain $D_i$ may invoke on object $O_j$.

    - **Access list**: each **column** is stored with its **object**, as a list of pairs (domain, rights). It matches what users need (the owner of an object decides who may access it), and **revocation is easy**. However, finding all the rights of a domain is hard.
    - **Capability list**: each **row** is stored with its **domain**, as a list of objects and the operations allowed on them; holding a capability means the access is allowed. Checking a process's access is efficient, but **revocation is difficult**, because capabilities are spread throughout the system.

    寫法提示：一個是存 column（跟著物件），一個是存 row（跟著 domain）；比較時一定要寫 revocation（[6.0](#u6-0)）。

<div markdown="1">

**E-4.** Explain the differences among a Trojan horse, a virus and a worm.

（中文：101、105、107：Trojan horse、virus、worm 的差別。）

</div>

??? quiz "看英文參考答案"
    - **Trojan horse**: a program that **appears to be legitimate** but secretly performs a malicious action when a user runs it; for example, a fake login program that steals passwords.
    - **Virus**: a fragment of code **embedded in a legitimate program**. It is **self-replicating** and spreads by infecting other programs, so it needs a host program.
    - **Worm**: a **standalone** program that **copies itself across a network** without user intervention, using up system and network resources.

    Related terms: a **trap door** is a hole left by a designer to bypass normal security checks; a **logic bomb** is code that starts a security incident only when certain conditions occur.

    寫法提示：分辨重點：Trojan 靠「偽裝」、virus 要「寄生」在程式裡、worm「自己就能」透過網路複製（[6.0](#u6-0)）。

<div markdown="1">

**E-5.** How does a digital signature work, and what does it provide?

（中文：數位簽章怎麼運作？提供哪些保證？）

</div>

??? quiz "看英文參考答案"
    1. The sender computes a **hash (message digest)** of the message.
    2. The sender **encrypts the digest with its private key**; the result is the **signature**, which is sent with the message.
    3. The receiver **decrypts the signature with the sender's public key** and compares the result with the hash it computes from the received message.

    If the two values match, the message is **authentic** (it came from the owner of the private key) and **has not been modified** (integrity). Because only the sender has the private key, the sender **cannot deny** having signed it (**non-repudiation**).

    寫法提示：最常寫錯的是金鑰：簽章用寄件人的 private key，驗證用寄件人的 public key（[6.2](#u6-more)）。

<div markdown="1">

**E-6.** Compare symmetric and asymmetric encryption.

（中文：對稱式和非對稱式加密的比較。）

</div>

??? quiz "看英文參考答案"
    - **Symmetric encryption**: the **same key** is used to encrypt and to decrypt (for example, **AES**). It is **fast**, but the key must be **distributed secretly** to every pair of communicating parties.
    - **Asymmetric (public-key) encryption**: each user has a **public key**, which anyone can use to encrypt messages to that user, and a **private key**, which only the owner uses to decrypt them (for example, **RSA**). Key distribution is easy, but it is **much slower**.

    In practice, asymmetric encryption is used to **exchange a symmetric session key**, and the bulk of the data is then encrypted with the symmetric key.

    寫法提示：比較三件事：幾把鑰匙、速度、金鑰怎麼發；最後一句「兩種一起用」會加分（[6.2](#u6-more)）。

<div markdown="1">

**E-7.** In a real-time system, what is event latency? Name the two types of latency that affect it.

（中文：112 Q8b：即時系統的 event latency 和影響它的兩種延遲。）

</div>

??? quiz "看英文參考答案"
    **Event latency** is the amount of time that elapses from when an **event occurs** to when it is **serviced**. Two types of latency affect it:

    1. **Interrupt latency**: the time from the **arrival of an interrupt** at the CPU to the **start of the interrupt service routine (ISR)**.
    2. **Dispatch latency**: the time required for the scheduling dispatcher to **stop one process and start another**.

    To keep dispatch latency low, real-time operating systems provide **preemptive kernels**.

    寫法提示：兩種延遲的起點和終點都要寫清楚（[6.1](#u6-1)）。

### 6.6 考古題變化題 {#u6-exam}

把考過的題目**換數字、改條件，或反過來問**。每題都標出改自哪一題：建議先回去看原題怎麼解，再做這一題，想想「條件變了，做法哪裡要跟著變」。每題都附完整解答，答案都用程式驗算過。

**考古變化 1.**（改自 113 Q7・實際算）資料 Q 一開始的 R-timestamp 是 15、W-timestamp 是 12。依序發生：T1（TS 10）read(Q)、T2（TS 14）read(Q)、T3（TS 13）write(Q)、T4（TS 20）write(Q)、T5（TS 18）write(Q)。照 timestamp-ordering protocol，每一個是執行還是 rollback？Q 的兩個 timestamp 最後是多少？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要寫出規則；這題照規則一步一步跑，timestamp 會跟著更新。
    - **T1 read**：10 ＜ W-ts 12，要讀的值已經被比它新的交易寫過了 → **rollback**。
    - **T2 read**：14 ≥ 12 → **執行**，R-ts ＝ max(15, 14) ＝ 15。
    - **T3 write**：13 ＜ R-ts 15，比它新的交易已經讀過舊值了 → **rollback**。
    - **T4 write**：20 ≥ 15 而且 20 ≥ 12 → **執行**，W-ts 變成 20。
    - **T5 write**：18 ≥ R-ts 15，但 18 ＜ W-ts 20，它要寫的值已經過時 → **rollback**（如果用 Thomas write rule，這個寫入直接忽略，不用 rollback）。
    - **最後**：R-ts ＝ **15**、W-ts ＝ **20**。

    我用程式照規則跑過一次，答案一樣。


**考古變化 2.**（改自 101 Q5、107 Q4(4)・應用）A 要傳一份合約給 B，希望 (1) 只有 B 看得到內容 (2) B 能確定合約真的是 A 送的、沒有被改過，而且 A 事後不能否認。要怎麼用 A、B 的公鑰和私鑰？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題分開問 MAC 和數位簽章；這題要把「加密」和「簽章」一起用，關鍵是每一步用誰的哪一把鑰匙。
    - **簽章（滿足 (2)）**：A 算合約的雜湊 $H(m)$，用 **A 的私鑰**簽。只有 A 有自己的私鑰，所以別人偽造不了、A 也賴不掉（nonrepudiation）；B 用 **A 的公鑰**驗證。
    - **加密（滿足 (1)）**：把合約和簽章用 **B 的公鑰**加密（實務上是用 B 的公鑰加密一把隨機的對稱金鑰，再用對稱金鑰加密內容）。只有 B 的私鑰解得開。
    - **為什麼不用 MAC**：MAC 的金鑰 A、B 都有，B 也算得出同樣的 MAC，所以做不到「A 不能否認」。


**考古變化 3.**（改自 102 Q8・實際算）三個 process：P1 依序有事件 a、b、c；P2 有 d、e、f；P3 有 g、h、i。b 送訊息給 P2，d 是收到它；e 送訊息給 P3，h 是收到它；i 送訊息給 P1，c 是收到它。(1) 算出每個事件的 Lamport timestamp (2) 下面哪幾對是 concurrent（沒有 happened-before 關係）：(a, g)、(b, h)、(f, i)、(g, c)

??? quiz "看完整解答"
    - **跟原題差在哪**：原題要寫出 happened-before 的三條規則；這題用規則實際推一次，再用 Lamport clock 標時間。
    - **(1) Lamport clock**：同一個 process 每個事件加 1；收到訊息時取「自己的時間」和「訊息帶來的時間」的最大值再加 1。
        - P1：a ＝ 1、b ＝ 2；P2：d ＝ max(0, 2)＋1 ＝ 3、e ＝ 4、f ＝ 5；P3：g ＝ 1、h ＝ max(1, 4)＋1 ＝ 5、i ＝ 6；最後 c ＝ max(2, 6)＋1 ＝ 7。
    - **(2)**：
        - **(a, g) concurrent**：兩個都是各自的第一個事件，沒有訊息把它們連起來。
        - **(b, h) 不是**：b → d → e → h，b 先發生。
        - **(f, i) concurrent**：f 之後 P2 沒再送訊息，i 也沒送到 P2，兩邊找不到路徑。
        - **(g, c) 不是**：g → h → i → c。
    - **小心**：Lamport timestamp 小**不代表**先發生。f ＝ 5 比 i ＝ 6 小，但它們是 concurrent。反過來才對：$x\to y$ 一定有 $L(x)<L(y)$。

    我用程式算了 Lamport clock 和 vector clock，用 vector clock 判斷每一對的關係，結果一樣。


**考古變化 4.**（改自 101 Q6・量化）兩台電腦用 CSMA/CD，同時傳送而碰撞。binary exponential backoff：第 $k$ 次碰撞後，各自從 $0,1,\dots,2^k-1$ 裡隨機挑一個數，等那麼多個時槽再重傳。第 1、2、3 次碰撞後，兩台「又挑到同一個數、再碰撞一次」的機率各是多少？

??? quiz "看完整解答"
    - **跟原題差在哪**：原題只要說明 CSMA/CD 怎麼運作；這題算出 backoff 為什麼能讓碰撞越來越少。
    - **第 $k$ 次碰撞後**：有 $2^k$ 個數可以挑，兩台挑到同一個的機率是 $\frac{1}{2^k}$。
    - **答案**：第 1 次後 **$\frac12$**、第 2 次後 **$\frac14$**、第 3 次後 **$\frac18$**。
    - **意思**：每碰撞一次，等待的範圍加倍，再撞的機率減半；網路越擠，大家自動退得越開。代價是負載重時延遲越來越長，這也是 token passing 適合重負載、需要保證延遲的原因。

    我用程式重算過每一步，答案一樣。


**考古變化 5.**（改自 102 Q5・換敘述）是非（錯的要說明）：(a) 每個使用者都直接以 root 身分登入，比較符合最小權限原則 (b) virus 不需要附在別的程式上就能自己透過網路散播 (c) 非對稱加密裡，用公鑰加密的東西要用私鑰解 (d) DDoS 的流量來自很多台電腦，所以很難用封鎖單一來源擋掉 (e) 只要仔細讀過程式的原始碼，就一定找得到後門

??? quiz "看完整解答"
    - **跟原題差在哪**：同樣是安全性的是非題，換成另外五個常見的觀念。
    - **(a) 錯**：最小權限是只給剛好夠的權限；平常用一般帳號，需要時才暫時提升（例如 sudo、RBAC 的角色）。
    - **(b) 錯**：這是 **worm** 的特性；virus 要附在別的程式上，靠那個程式執行才散播。
    - **(c) 對**：公鑰加密、私鑰解密（保密）；私鑰簽章、公鑰驗證（認證）。
    - **(d) 對**：流量來自 botnet 裡的大量電腦。
    - **(e) 錯**：後門可能藏在**編譯器**裡（Ken Thompson 的例子），被編譯的程式原始碼完全正常。



## 單元 7：名詞填空總表 {#u7}

113–115 年的填空全部在這裡。把**中文意思**遮起來，看英文名詞自己講出意思；再把英文遮起來，看意思回想英文。

| 年份 | 題目重點 | 答案 |
|---|---|---|
| 113 a | 每個 thread 記錄下一條指令位址的暫存器 | program counter |
| 113 b | critical-section 的第三個條件 | bounded waiting |
| 113 c | page table 的 cache | translation look-aside (TLB) |
| 113 d | 把邏輯 page 對應到實體 frame 的單元 | memory-management unit (MMU) |
| 113 e | 花在 paging 比執行還多 | thrashing |
| 113 f | 包含檔案系統的個體 | volume |
| 113 g | RAID 6 的冗餘方式 | P + Q |
| 113 h | RBAC 中執行 system call 的權利 | privilege |
| 113 i | AES 金鑰長度 128、＿、256 | 192 |
| 113 j | 修改系統來躲避偵測的病毒 | stealth |
| 114 a | A 接 B 接 C 接電腦 | daisy (chain) |
| 114 b | process 記憶體：text、data、＿、stack | heap |
| 114 c | 結果取決於存取順序 | race (condition) |
| 114 d | 死結四條件之二 | hold and wait |
| 114 e | 不會修改自己的程式碼 | reentrant (pure) |
| 114 f | inverted page table 每個 entry 要存的識別碼 | address-space identifier |
| 114 g | HDD 隨機存取 ＝ seek ＋ ＿ | rotational latency |
| 114 h | 從提交到完成的時間 | turnaround |
| 114 i | Pthreads 是哪個標準 | POSIX |
| 114 j | swap space 可建在什麼分割區 | raw |
| 115 a | 記憶體中的 process 數 | (degree of) multiprogramming |
| 115 b | modify bit 的別名 | dirty |
| 115 c | 把 CPU 交給選中 process 的模組 | dispatcher |
| 115 d | 必須滿足三條件的問題 | critical-section |
| 115 e | HDD 和 ＿ memory 裝置 | nonvolatile (NVM) |
| 115 f | 包裝裝置細節的模組 | device-driver |
| 115 g | 蘊含 hold and wait 的條件 | circular wait |
| 115 h | 檔案是有＿的相關資訊集合 | named |
| 115 i | 只能存取目前需要的資源 | need-to-know |
| 115 j | 未經授權讀取資料 | confidentiality |

!!! key "怎麼準備明年的填空"
    填空都是從恐龍書內文抽的，而且每年**幾乎不重複**。最有效的方法是把恐龍書每章最後的 **Chapter Summary 和粗體名詞**做成閃卡（Anki 或紙卡），每天 15 分鐘，用間隔複習。

## 綜合小考 {#mix}

**M-1.** 填空：A process that is spending more time paging than executing is said to be ＿＿.

??? quiz "看答案"
    thrashing

**M-2.** 填空：The ＿＿ bit indicates whether a page has been modified.

??? quiz "看答案"
    dirty（modify）

**M-3.** 解釋 starvation 和 aging。

??? quiz "看答案"
    starvation：低優先權的 process 一直等不到 CPU。aging：隨著等待時間增加，逐漸提高它的優先權，最終一定會被執行。

**M-4.** 為什麼 RR 的 time quantum 不能太小也不能太大？

??? quiz "看答案"
    太小：context switch 太頻繁，開銷佔比太高。太大：退化成 FCFS，回應時間變差。經驗法則是 80% 的 CPU burst 要比 quantum 短。

## 資源 {#res}

- **Silberschatz《Operating System Concepts》（恐龍書，第 10 版）**：中山的填空和觀念題幾乎都出自這本。每章最後的 summary 和 practice exercises 一定要做。
- **Tanenbaum《Modern Operating Systems》**：111 年計算題的來源，不用整本讀，練它第 3、4、5 章的計算習題即可。
