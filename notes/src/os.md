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

**建議讀的順序**：單元 1 行程與排程 → 2 同步 → 3 死結 → 4 記憶體 → 5 儲存與檔案 → 6 保護、安全與其他 → 7 名詞總表。

## 單元 1：行程、執行緒與 CPU 排程 {#u1}

### 1.0 觀念課：食譜和正在做菜的廚師 {#u1-0}

#### 程式和行程差在哪

**程式（program）** 是食譜，靜靜放在磁碟上。**行程（process）** 是正在照著食譜做菜的廚師：他做到第幾步（**program counter**）、手邊有哪些材料（**暫存器、記憶體**），這些「進度」都屬於這個行程。

同一份食譜可以有好幾個廚師同時在做，就像同一個程式可以開好幾個行程。作業系統用 **PCB** 記錄每個行程的進度，換人做的時候先把現在的進度存進 PCB，再把下一個人的進度讀出來，這就是 **context switch**。換人本身不做任何有用的工作，所以是額外開銷。

#### 行程的五種狀態

| 狀態 | 意思 | 怎麼進來 |
|---|---|---|
| new | 剛建立 | 程式被執行 |
| ready | 準備好了，在等 CPU | 被建立、I/O 完成、時間片用完被換下 |
| running | 正在 CPU 上跑 | 被排程器選中（dispatch） |
| waiting | 在等某件事（I/O、子行程結束） | 自己發出 I/O 請求或等待 |
| terminated | 結束 | 執行完畢 |

最常考的兩條路：running → waiting（**發 I/O 請求**）、running → ready（**時間片用完**或被更高優先權的搶走）。

#### 排程：誰先用 CPU

只有一個 CPU、很多行程在 ready queue 等。三個常用的衡量指標：

- **waiting time**：在 ready queue 裡等的總時間
- **turnaround time**：從進來到完成的總時間 ＝ waiting ＋ 執行時間
- **response time**：從進來到第一次被執行

**為什麼短的先做，平均等待時間最短**：P1 要 4、P2 要 1，同時到達。

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

#### thread 和 process

同一個 process 裡的 threads **共用**程式碼、全域資料、開啟的檔案，但各自有自己的 **program counter、暫存器、stack**。像同一個廚房裡的幾個廚師，共用冰箱和爐子，但各自做到不同步驟。

#### 換你試試

**T-1.** P1、P2、P3 同時到達，執行時間 3、6、1，SJF 的平均等待時間？

??? quiz "看答案"
    順序 P3、P1、P2，等待 0、1、4 → P1 1、P2 4、P3 0，平均 $\frac53$。

**T-2.** P1、P2 都要 3，quantum ＝ 2 的 RR，平均等待時間？

??? quiz "看答案"
    P1 0–2、P2 2–4、P1 4–5、P2 5–6。完成 5、6，等待 $5-3=2$、$6-3=3$，平均 2.5。

**T-3.** 一個 running 的行程呼叫 `read()` 讀檔案，會進入哪個狀態？讀完之後呢？

??? quiz "看答案"
    running → waiting；I/O 完成後 → ready（不是直接回 running，要等排程器再選它）。

### 1.1 行程 {#u1-1}

- **記憶體配置**：text（程式碼）、data（全域變數）、**heap**（動態配置）、stack（函式呼叫）。（114 Q8b 填空）
- **PCB 的七個欄位**（112 Q5a）：process state、program counter、CPU registers、CPU-scheduling information、memory-management information、accounting information、I/O status information。
- **degree of multiprogramming**：目前在記憶體中的 process 數量。（115 Q1a）
- **dispatcher**：把 CPU 控制權交給排程器選中的 process 的模組，負責 context switch、切換到 user mode、跳到正確位置。（115 Q1c）
- 每個 thread 有自己的 **program counter**，記錄下一條要執行的指令。（113 Q8a）
- **Pthreads** 是 **POSIX** 標準定義的 thread API。（114 Q8i）

!!! example "115 Q2a（6%）：process 在什麼情況下會交出 CPU？之後會放到哪個 queue？"
    1. 發出 I/O 請求 → 放進 **I/O wait queue**
    2. 建立子行程並等待它結束 → 放進 **wait queue**
    3. 被中斷強制移走，或 time slice 用完 → 放回 **ready queue**

!!! example "115 Q2b（4%）：從 processor affinity 的角度解釋 warm cache"
    process 在某個 core 上跑一段時間後，它的資料已經在那個 core 的 cache 裡（cache 是「熱」的）。如果把它移到別的 core，舊 cache 要作廢、新 cache 要重新載入，成本很高。所以排程器盡量讓 process 留在同一個 core，這就是 **processor affinity**。

!!! example "114 Q6b（4%）：兩種 IPC 模型"
    - **shared memory**：建立一塊共享記憶體，process 直接讀寫，快，但要自己做同步。
    - **message passing**：透過 kernel 的 send／receive 傳訊息，較慢（每次都要 system call），但不用處理衝突，也適合分散式系統。

### 1.2 CPU 排程計算 {#u1-2}

**名詞**：

- **turnaround time**：從提交到完成的時間。（112 Q9d、114 Q8h）
- **waiting time**：在 ready queue 等待的總時間 ＝ turnaround $-$ burst。
- **response time**：從提交到第一次被執行的時間。

**做法**：畫 Gantt chart，算每個 process 的完成時間，等待時間 ＝ 完成時間 $-$ 到達時間 $-$ burst time。

!!! example "113 Q6a（6%）：五個 process 都在時間 0 到達，burst 10、1、2、1、5，priority 3、1、3、4、2（數字小優先）"
    **SJF**：P2(1)、P4(1)、P3(2)、P5(5)、P1(10)

    | | P2 | P4 | P3 | P5 | P1 |
    |---|---|---|---|---|---|
    | 開始 | 0 | 1 | 2 | 4 | 9 |

    平均等待 $=\frac{0+1+2+4+9}{5}=3.2$。

    **Non-preemptive priority**：P2(1)、P5(2)、P1(3)、P3(3)、P4(4)，開始時間 0、1、6、16、18，平均 $\frac{41}{5}=8.2$。

    **RR（q＝1，佇列初始順序 P1–P5）**：完成時間 P1＝19、P2＝2、P3＝7、P4＝4、P5＝14。等待 ＝ 完成 $-$ burst：$9,1,5,3,9$，平均 $\frac{27}{5}=5.4$。

    RR 的 Gantt chart 最容易算錯，畫的時候把每一輪寫成一列：
    `P1 P2 P3 P4 P5 | P1 P3 P5 | P1 P5 | P1 P5 | P1 P5 | P1 P1 P1 P1 P1`

### 單元 1 小考 {#u1-quiz}

**1-1.** 三個 process 在時間 0 依序到達，burst 6、3、1，FCFS 和 SJF 的平均等待時間？

??? quiz "看答案"
    FCFS：$\frac{0+6+9}{3}=5$。SJF（1、3、6）：$\frac{0+1+4}{3}=\frac53\approx1.67$。

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

#### critical section：一次只能一個人進去

存取共享資料的那段程式碼叫 **critical section**。像只有一把鑰匙的廁所：拿到鑰匙（lock）才能進去，出來再把鑰匙還回去。

好的解法要滿足三個條件：

1. **mutual exclusion**：一次最多一個人在裡面。
2. **progress**：沒人在裡面時，想進去的人不能一直被擋著。
3. **bounded waiting**：排隊的人等待的次數有上限，不會一直被插隊（不會餓死）。

#### 硬體怎麼幫忙：不可分割的指令

自己寫「先檢查 lock 是不是空的，再把它設成佔用」不行，因為兩個 thread 可能**同時檢查到空的**，又出現上面那種交錯。

`test_and_set` 這類指令把「讀舊值、設成 true」**合成一個不可分割的動作**：

- 讀到舊值 false → 你搶到 lock 了（它同時變成 true）。
- 讀到舊值 true → 別人已經拿走了，繼續等。

#### semaphore：停車場的剩餘車位

semaphore 是一個整數，像停車場門口的「剩餘車位」看板：

- `wait()`：要進場，車位減 1；減完小於 0 就在門口排隊。
- `signal()`：離場，車位加 1；有人在排隊就叫醒一個。

初始值 1 的 semaphore 就是一把 lock（一次一台車）；初始值 $n$ 就能管理 $n$ 份資源。

**生產者－消費者**用三個 semaphore：`empty`（空格數，初始 $n$）、`full`（有資料的格數，初始 0）、`mutex`（保護 buffer，初始 1）。生產者先 `wait(empty)` 再放資料再 `signal(full)`，消費者反過來。

#### 換你試試

**T-1.** counter ＝ 0，兩個 thread 各做一次 `counter++`，沒有 lock，最後可能是多少？

??? quiz "看答案"
    1 或 2。

**T-2.** semaphore 初始值 3，有 5 個行程依序呼叫 `wait()`，幾個會被擋住？

??? quiz "看答案"
    2 個（值變成 −2，負多少就有幾個在排隊）。

**T-3.** 為什麼在多處理器上，「關掉中斷」不能保護 critical section？

??? quiz "看答案"
    關中斷只影響自己這顆 CPU，其他 CPU 照樣可以同時執行同一段 critical section。

### 2.1 考古題與重點整理 {#u2-1}

- **race condition**：多個 process 並行存取同一份資料，結果取決於存取的順序。（112 Q9e、114 Q8c）
- critical-section 問題的解法必須滿足三個條件：**mutual exclusion**、**progress**、**bounded waiting**。（113 Q8b、115 Q1d）

!!! example "114 Q6a（6%）：解決 critical-section 問題的三種硬體支援"
    1. **memory barriers（memory fences）**：強制之前的記憶體操作都完成、讓其他處理器看得到，才往下執行。
    2. **hardware instructions**：`test_and_set()`、`compare_and_swap()` 這類**不可分割（atomic）**的指令，可以用來實作 lock。
    3. **atomic variables**：對整數、布林值提供不可分割的更新操作（例如 atomic increment）。

!!! example "112 Q5b（3%）：mutex、semaphore、condition variable 的用途"
    - **mutex lock**：保護 critical section，`acquire()` 進去、`release()` 出來，一次只有一個人持有。
    - **semaphore**：一個整數計數器，`wait()` 減 1（不夠就等）、`signal()` 加 1。binary semaphore 可當 lock 用；counting semaphore 可以管理 $n$ 份資源或用來做先後順序。
    - **condition variable**：在 monitor（或搭配 mutex）中，讓 thread 等待某個**條件**成立（`wait()`），條件改變時由別人 `signal()` 叫醒。

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

#### 避免死結：銀行家只借「還得回來」的錢

Banker's algorithm 的想法：銀行只在「借出去之後，**仍然存在某個順序**能讓每個客戶都借滿、用完、還錢」時才借。這種狀態叫 **safe state**。

**小例子**：一種資源共 10 份。

| 行程 | 最多需要 | 目前持有 | 還需要 |
|---|---|---|---|
| P1 | 8 | 4 | 4 |
| P2 | 5 | 2 | 3 |

可用 $10-4-2=4$。P2 還需要 3 ≤ 4 → P2 可以做完，還回 2 份 → 可用 6。P1 還需要 4 ≤ 6 → 也能做完。存在順序 P2 → P1，所以是 **safe**。

判斷方法就是：**反覆找一個「還需要 ≤ 目前可用」的行程，讓它做完、把它持有的加回可用**。全部都能做完就是 safe。

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

1. 程式存取一個 page，page table 標示它不在記憶體（valid ＝ 0）。
2. 硬體產生 trap，交給作業系統。
3. 作業系統找一個空的 frame；**沒有空的就挑一個 page 踢出去**（如果它被改過，dirty bit ＝ 1，要先寫回磁碟）。
4. 從磁碟把需要的 page 讀進來，更新 page table。
5. 重新執行剛剛那條指令。

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

#### EAT：為什麼 page fault 要極少

$$\text{EAT}=(1-p)\times\text{記憶體存取時間}+p\times\text{page fault 處理時間}$$

記憶體 100 ns、page fault 10 ms（$10^7$ ns），$p=0.001$：
$$0.999\times100+0.001\times10^7\approx10100\text{ ns}$$

每 1000 次才 fault 一次，平均存取時間就變成原本的 **100 倍**。這就是考題要你算「page fault rate 要低於多少」的原因。

#### thrashing

行程太多、每個人分到的 frame 太少，每個行程都在不斷 page fault、等磁碟，CPU 使用率反而掉下來。作業系統看到 CPU 閒著，又加更多行程進來，情況更糟。解法是用 working set 估計每個行程需要多少 frame，不夠時**減少**同時執行的行程數。

#### 換你試試

**T-1.** 3 個 frame，存取 1, 2, 3, 1, 4, 1。FIFO 和 LRU 各幾次 page fault？

??? quiz "看答案"
    FIFO 5 次（4 進來時踢掉 1，最後的 1 又 fault）；LRU 4 次（4 進來時踢掉最久沒用的 2，最後的 1 hit）。

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

### 4.2 計算模板 {#u4-2}

| 題目 | 公式 |
|---|---|
| page table 有幾個 entry | $2^{\text{虛擬位址位元}-\text{offset 位元}}$ |
| bitmap 大小 | 記憶體 ÷ 配置單位 ＝ 位元數 |
| 有 TLB 的有效存取時間 | $h\times t_{\text{TLB hit}}+(1-h)\times t_{\text{miss}}$ |
| demand paging 的 EAT | $(1-p)\times t_{\text{mem}}+p\times t_{\text{fault}}$ |

!!! example "111 Q9（10%）：48-bit 虛擬位址、32-bit 實體位址、4 KB page，page table 有幾個 entry"
    $2^{48}/2^{12}=2^{36}$ 個（每個 process 一張單層 page table 時）。

!!! example "111 Q8（10%）：8 GB RAM 以 4 KB 為單位配置，用 bitmap 記錄空閒記憶體要幾 KB"
    單位數 $=2^{33}/2^{12}=2^{21}$，每單位 1 位元 → $2^{21}$ 位元 $=2^{18}$ bytes $=256$ KB。

!!! example "111 Q6（10%）：讀 page table 500 ns、TLB 查詢 50 ns，miss 時才查 page table。平均開銷 ≤ 100 ns 需要多少 hit rate"
    開銷 $=50+(1-h)\times500\le100$ → $1-h\le0.1$ → **$h\ge0.9$**。

!!! example "113 Q6b（4%）：記憶體存取 150 ns、page fault 處理 60000 ns，EAT < 175 ns 時 page fault rate 上限"
    $(1-p)\times150+p\times60000<175$ → $59850p<25$ → $p<\frac{25}{59850}\approx4.18\times10^{-4}$。

    也就是大約每 2400 次存取才能有 1 次 page fault。

### 4.3 置換與 thrashing {#u4-3}

- **dirty bit（modify bit）**：page 內容被改過就設為 1，被置換時才需要寫回磁碟。（115 Q1b）
- **thrashing**：process 花在 paging 的時間比執行還多。（113 Q8e）
- **copy-on-write**（115 Q3b）：`fork()` 後父子行程先**共用**相同的 page，標記為 copy-on-write；任何一方要**寫入**某個 page 時，才複製那一頁。省下複製整個位址空間的時間和記憶體（尤其子行程馬上 `exec()` 時）。

!!! example "112 Q6b（4%）：用 working-set model 解決 thrashing"
    定義 working-set window $\Delta$（最近 $\Delta$ 次存取），process $i$ 在這段時間用到的 page 集合大小是 $WSS_i$。

    總需求 $D=\sum WSS_i$。如果 $D$ 大於可用的 frame 數 $m$，就會 thrashing，OS **暫停（swap out）某個 process**，把它的 frame 分給其他人；$D$ 夠小時再載入新的 process。這樣既能避免 thrashing，又能維持最高的 multiprogramming 程度。

### 單元 4 小考 {#u4-quiz}

**4-1.** 32-bit 虛擬位址、8 KB page、PTE 4 B，單層 page table 多大？

??? quiz "看答案"
    $2^{32-13}\times4=2^{21}$ B ＝ 2 MB。

**4-2.** TLB hit rate 80%，TLB 20 ns、記憶體 100 ns（單層 page table），有效存取時間？

??? quiz "看答案"
    hit：$20+100=120$；miss：$20+100+100=220$。EAT $=0.8\times120+0.2\times220=140$ ns。

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

#### 檔案的區塊放在哪：i-node

i-node 像一本書的**目錄頁**：前面幾格直接寫「第 1 章在第幾頁」（direct pointer），後面一格寫「其他章節的目錄在第幾頁」（indirect pointer），那一頁整頁都是指標。

**小例子**：區塊 1 KB、指標 4 bytes → 一個區塊可以放 $1024/4=256$ 個指標。

| 種類 | 可以指到幾個資料區塊 | 容量 |
|---|---|---|
| 12 個 direct | 12 | 12 KB |
| single indirect | 256 | 256 KB |
| double indirect | $256^2$ | 64 MB |

小檔案只用 direct pointer，讀取很快；大檔案才用到間接區塊。

#### RAID：用多顆硬碟換速度或安全

- **RAID 0**（striping）：資料分散在多顆，同時讀寫比較快，但任何一顆壞掉資料就毀了。
- **RAID 1**（mirroring）：每份資料存兩份，壞一顆沒關係，但容量剩一半。
- **RAID 5**（分散的 parity）：多存一份 XOR 校驗。

**XOR 為什麼能救回資料**：資料 1100 和 1010，parity ＝ 1100 XOR 1010 ＝ 0110。第二顆壞了，把剩下的 XOR 起來：1100 XOR 0110 ＝ 1010，就是原本的資料。RAID 6 再多一份不同算法的校驗（P＋Q），可以同時壞兩顆。

#### 換你試試

**T-1.** 10000 RPM 的硬碟，平均 rotational latency？

??? quiz "看答案"
    一圈 $\frac{60}{10000}$ 秒 ＝ 6 ms，半圈 3 ms。

**T-2.** 資料 0101 和 0011，parity 是多少？如果 0101 那顆壞了，怎麼救回來？

??? quiz "看答案"
    parity ＝ 0110。0011 XOR 0110 ＝ 0101。

**T-3.** 區塊 4 KB、指標 4 bytes，single indirect 可以多指到多少容量？

??? quiz "看答案"
    一個區塊放 1024 個指標，$1024\times4\text{ KB}=4$ MB。

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

### 單元 5 小考 {#u5-quiz}

**5-1.** i-node 有 12 個直接區塊和 single、double indirect，區塊 4 KB、指標 4 B，最大檔案幾個資料區塊？

??? quiz "看答案"
    每區塊 1024 個指標：$12+1024+1024^2=1049612$ 個。

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

**need-to-know** 和 principle of least privilege 是同一個想法：每個行程、每個使用者只拿到**完成目前工作需要**的權限。出事時，損害才會被限制在小範圍。

#### 存取矩陣：誰能對什麼做什麼

把權限畫成一張表：列是使用者（domain），欄是檔案（object），格子裡是權限。

| | file1 | file2 | printer |
|---|---|---|---|
| Alice | read, write | read | print |
| Bob | read | — | print |

- 照**欄**存（每個檔案記錄誰能用它）→ **access control list（ACL）**
- 照**列**存（每個使用者帶著自己能用什麼）→ **capability list**

#### 惡意程式的名詞

| 名詞 | 特徵 |
|---|---|
| virus | 附在別的程式上，靠程式執行來散播 |
| worm | 自己透過網路複製散播，不用附在別的程式上 |
| trojan horse | 假裝成有用的程式，暗中做壞事 |
| logic bomb | 平常不動，特定條件（日期、事件）成立才發作 |
| stealth virus | 修改系統中可能偵測到它的部分，躲避防毒 |

這一單元的分數幾乎都在**名詞填空**，看懂意思後，把英文名詞做成閃卡背起來。

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
