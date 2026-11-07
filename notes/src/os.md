# 作業系統：從中山考古題學

「作業系統與資料結構」這科，OS 大約佔一半分數。這份教材把 111–115 年的 OS 題目全部拆進各單元；資料結構的部分在另一份教材。

!!! key "看不懂的時候"
    1. 先讀單元開頭的「觀念課」：用小例子把每種情況列出來，再推出公式。目前有觀念課的是離散單元 1、計結單元 2。
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
