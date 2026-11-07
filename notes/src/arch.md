# 計算機結構：從中山考古題學

這份教材從中山資工碩甲組 111–115 年的「計算機結構」考古題整理而來，五年共 **30 大題**全部拆進各單元。中山這科的題目有兩個明顯來源：

- **Patterson & Hennessy《Computer Organization and Design》（COD）課本習題**：113 年幾乎整份都是，數字都很像。
- **Onur Mutlu（ETH Zürich／CMU）計算機結構課的考題**：112、114 年的 DRAM refresh、多執行緒切換、dual-path execution、VLIW 對比 superscalar 對比 array processor 都是他課上的經典題型。

!!! key "一句話重點"
    計結考的是**會不會算**加上**能不能講出取捨**。每一題的背後只有幾條公式：CPU time、Amdahl、AMAT、位址切割、pipeline 的 stall／penalty。把公式和「為什麼」都講清楚，就能拿到大部分分數。

!!! key "看不懂的時候"
    1. 先讀單元開頭的「觀念課」：用小例子把每種情況列出來，再推出公式。目前有觀念課的是離散單元 1、計結單元 2。
    2. 還是不懂：照[學習方法頁的範本](method.html#ai)問 Gemini 這類 AI 家教，或看[中文開放式課程影片](method.html#videos)。
    3. 懂了以後回來做該單元的小考，確認自己真的會寫。

## 0. 中山計結怎麼考 {#u0}

| 主題 | 111 | 112 | 113 | 114 | 115 | 重要度 |
|---|---|---|---|---|---|---|
| 效能：CPI、CPU time、Amdahl | P4 | Q1 | Q1 | — | Q1, Q2 | ★★★ |
| Cache：位址切割、總位元數、hit/miss、AMAT | P1, P3, P4 | Q1, Q6 | Q5, Q6 | — | Q6 | ★★★ |
| 虛擬記憶體、TLB、page table | P1, P2, P3 | — | Q7 | Q2 | — | ★★★ |
| Pipeline、hazard、forwarding | P5 | — | Q3 | Q4 | Q5 | ★★★ |
| 分支預測與 misprediction penalty | — | Q1 | Q4 | Q3 | Q5 | ★★★ |
| 多執行緒（fine-grained、switch-on-stall） | — | Q3 | — | Q5 | — | ★★ |
| DRAM refresh、資料重用 | — | Q2, Q4 | — | Q1 | — | ★★ |
| 平行、GPU、VLIW／superscalar／array、記憶體一致性 | — | Q5 | Q1, Q2 | Q6 | Q1 | ★★ |
| ISA 與算術（RISC、PC-relative、二補數、浮點） | P5 | — | — | — | Q3, Q4 | ★ |

**建議讀的順序**：單元 1 效能 → 2 cache → 3 虛擬記憶體 → 4 pipeline → 5 分支 → 6 多執行緒 → 7 DRAM → 8 平行 → 9 ISA 與算術。前五個單元是每年必考的核心。

!!! trap "作答習慣"
    - 中山計結題目常寫「不清楚的地方請先寫出假設」。PTE 幾 byte、branch 在哪一級決定、register file 能不能同一 cycle 先寫後讀，**這些假設寫清楚，答案不一樣也能拿分**。
    - 不能用計算機。單位換算（ns／ps、KiB／MiB、$2^{10}\approx10^3$）一定要熟。

## 單元 1：效能 {#u1}

!!! key "一句話重點"
    執行時間 ＝ 指令數 × 每指令週期數 × 每週期時間。所有效能題都是在改這三個數字的其中一個。

### 1.1 CPU time 與加權 CPI {#u1-1}

$$\text{CPU time}=\text{IC}\times\text{CPI}\times T_{\text{clock}}=\frac{\text{IC}\times\text{CPI}}{f}$$

$$\text{CPI}_{\text{avg}}=\sum_i(\text{指令類別 } i \text{ 的比例})\times\text{CPI}_i$$

!!! example "115 Q1.2（7 分）：$2\times10^9$ 條指令，50% CPI 1、30% CPI 5、20% CPI 2，2 GHz；記憶體指令 CPI 從 5 降到 2"
    $\text{CPI}=0.5\times1+0.3\times5+0.2\times2=2.4$，時間 $=\frac{2\times10^9\times2.4}{2\times10^9}=2.4$ 秒。

    改善後 $\text{CPI}=0.5+0.6+0.4=1.5$，時間 1.5 秒，speedup $=\frac{2.4}{1.5}=1.6$。

!!! example "115 Q2.1（10 分）：35% CPI 1、45% CPI 3、20% CPI 2，週期 0.4 ns，$10^9$ 條指令"
    $\text{CPI}=0.35+1.35+0.4=2.1$，時間 $=10^9\times2.1\times0.4\text{ ns}=0.84$ 秒。

### 1.2 Amdahl 定律 {#u1-2}

只有比例 $f$ 的部分加速 $s$ 倍：

$$\text{Speedup}=\frac{1}{(1-f)+\dfrac{f}{s}}\qquad\text{上限}=\frac{1}{1-f}$$

**make the common case fast**（115 Q1.3）就是 Amdahl 的白話版：佔比大的部分加速才有用；把佔 1% 的情況加速 100 倍，整體幾乎不變，如果因此拖慢了常見情況，整體反而變慢。

!!! example "115 Q2.2（10 分）：浮點指令佔 30% 時間，加速 5 倍，整體最多快幾倍"
    $\frac{1}{0.7+0.3/5}=\frac{1}{0.76}\approx1.32$。

!!! example "111 P4.2（10%）：程式 40% 可平行，要幾個核心才能效能加倍"
    $\frac{1}{0.6+0.4/n}=2$ → $0.6+\frac{0.4}{n}=0.5$ → $\frac{0.4}{n}=-0.1$，**無解**。

    上限是 $\frac{1}{0.6}\approx1.67$ 倍，**再多核心都不可能加倍**。這題考的就是你敢不敢寫「不可能」，並用 Amdahl 的上限說明。

!!! example "113 Q1（8%）：80% 可平行，(1) 8 核 speedup (2) 每次核心數加倍，通訊開銷增加原時間的 0.5%"
    (1) $\frac{1}{0.2+0.8/8}=\frac{1}{0.3}\approx3.33$。

    (2) 1→2→4→8 加倍了 3 次，開銷 $3\times0.5\%=1.5\%$：$\frac{1}{0.2+0.1+0.015}=\frac1{0.315}\approx3.17$。

### 1.3 時脈為什麼不能一直加 {#u1-3}

115 Q1.1（7 分）要你講兩個限制：

1. **功耗牆（power wall）**：動態功耗 $\propto C V^2 f$。時脈上去，功耗和散熱一起上去，晶片撐不住。→ 改用**多核、平行**，用更多較慢的核心換效能。
2. **記憶體牆（memory wall）**：DRAM 延遲沒有跟著 CPU 變快，時脈再高也只是多等幾個週期。→ 發展**記憶體階層**（多層 cache）來隱藏延遲。
3. （可再補）**pipeline 越切越細的極限**：每級都有 pipeline 暫存器的固定延遲，切到最後收益變小，而 branch misprediction penalty 越來越大。→ 需要更好的**分支預測**與推測執行。

### 單元 1 小考 {#u1-quiz}

**1-1.** 40% ALU（CPI 1）、30% load（CPI 4）、20% store（CPI 3）、10% branch（CPI 2），1 GHz，$10^9$ 條指令，CPU time？

??? quiz "看答案"
    $\text{CPI}=0.4+1.2+0.6+0.2=2.4$，時間 $=10^9\times2.4\times1\text{ ns}=2.4$ 秒。

**1-2.** 佔 80% 時間的部分要加速幾倍，整體才會快 2 倍？

??? quiz "看答案"
    $0.2+\frac{0.8}{s}=0.5$ → $s=\frac{8}{3}\approx2.67$ 倍。

**1-3.** 90% 可平行，10 個核心的 speedup？

??? quiz "看答案"
    $\frac{1}{0.1+0.09}=\frac1{0.19}\approx5.26$。

## 單元 2：Cache {#u2}

!!! key "一句話重點"
    位址切成 **tag | index | offset** 三段。offset 由 block 大小決定，index 由「有幾個 set」決定，剩下的都是 tag。會切位址，cache 題就會一半。

### 2.0 觀念課：cache 到底在做什麼 {#u2-0}

#### 一個比喻

主記憶體像**圖書館**：很大，但每次去都要走很久（約 100 個 cycle）。cache 像你的**書桌**：很小，但伸手就拿得到（約 1 個 cycle）。

CPU 要一筆資料時，先看書桌：

- 書桌上有 → **hit**，馬上拿到。
- 書桌上沒有 → **miss**，跑一趟圖書館拿回來，順便放在書桌上，下次就有了。

#### 為什麼一次搬一整塊（block）

你去圖書館拿一本書時，很可能等一下也會用到**旁邊那幾本**（程式讀陣列時，讀完 `a[0]` 接著就讀 `a[1]`）。所以乾脆一次把一整排搬回來，這一整排就叫 **block**。這叫利用**空間區域性**。

剛用過的書很可能等一下又要用（迴圈一直用同一個變數），所以放在書桌上不急著收，這叫**時間區域性**。cache 就是靠這兩種區域性才有用。

#### 最關鍵的問題：某個 block 在 cache 裡要放哪一格？

| 規則 | 比喻 | 名稱 |
|---|---|---|
| 每個 block 只能放固定的一格 | 對號入座 | direct-mapped（1-way） |
| 每個 block 只能放某一區，但區裡哪格都可以 | 分區自由座 | $n$-way set-associative |
| 每個 block 哪一格都可以放 | 全部自由座 | fully associative |

「區」就叫 **set**。direct-mapped 是每個 set 只有 1 格；fully associative 是整個 cache 只有 1 個 set。

#### 位址怎麼決定放哪裡：一個 8 位元的小例子

假設：位址 8 位元、block 4 bytes、cache 有 4 個 set、direct-mapped。

**第一步：offset**。一個 block 有 4 個 byte，要分出「這是 block 裡的第幾個 byte」需要 2 位元（00、01、10、11）。所以**最右邊 2 位元是 offset**。

**第二步：index**。有 4 個 set，要 2 位元決定「放第幾格」。所以**再往左 2 位元是 index**。

**第三步：tag**。剩下的 4 位元。很多不同的 block 都會被分到同一格，tag 用來記「現在這格放的是哪一個 block」。

例子：位址 45 ＝ `0010 1101`

| tag | index | offset |
|---|---|---|
| `0010` | `11` | `01` |

讀法：去 3 號格（index `11`），看那格存的 tag 是不是 `0010`。是 → hit，取那個 block 的第 1 個 byte（offset `01`）；不是或那格是空的 → miss。

再看位址 109 ＝ `0110 1101`：index 也是 `11`，但 tag 是 `0110`。所以 45 和 109 **搶同一格**。

依序讀 45、109、45：

1. 45：3 號格是空的 → miss，放入 tag `0010`
2. 109：3 號格是 `0010` 不是 `0110` → miss，把 45 的 block 踢掉，換成 `0110`
3. 45：3 號格是 `0110` → 又 miss

其他三格明明都空著，卻一直 miss，這叫 **conflict miss**。改成 2-way（每個 set 有 2 格），45 和 109 就能同時放在同一個 set 裡，第三次就 hit 了。

!!! key "為什麼 offset 在最右邊、index 在中間"
    相鄰的 byte（例如 44、45、46、47）只差最右邊兩位，所以在**同一個 block**。相鄰的 block（例如 44 和 48）只差 index，所以會放到**不同格**，不會互相搶位置。這樣排，讀陣列時就不會一直 conflict。

#### 三種 miss（3C）

| 種類 | 原因 | 怎麼減少 |
|---|---|---|
| compulsory | 第一次用到，cache 裡本來就沒有 | 加大 block（一次多搬一點） |
| capacity | cache 整個太小，裝不下正在用的資料 | 加大 cache |
| conflict | cache 還有空位，卻因為搶同一個 set 被踢掉 | 提高 associativity |

#### AMAT 的直覺

平均拿一筆資料要等多久？每次都一定要先看書桌（hit time），如果沒找到，還要再加上跑圖書館的時間（miss penalty），而沒找到的機率是 miss rate：

$$\text{AMAT}=\text{hit time}+\text{miss rate}\times\text{miss penalty}$$

hit time 1、miss rate 5%、miss penalty 100：平均 $1+0.05\times100=6$ cycles。miss rate 只有 5%，平均時間卻是 hit 的 6 倍，所以降低 miss rate 這麼重要。

#### 換你試試

**T-1.** 8 位元位址、block 2 bytes、8 個 set、direct-mapped。offset、index、tag 各幾位元？位址 90 的 tag、index、offset 是多少？

??? quiz "看答案"
    offset 1、index 3、tag 4。90 ＝ `0101 1010` → tag `0101`、index `101`（5 號格）、offset `0`。

**T-2.** 同一個 cache，依序讀 90、91、26。哪幾次 hit？

??? quiz "看答案"
    91 ＝ `0101 1011`，和 90 同 tag、同 index，只差 offset → 同一個 block，**hit**。26 ＝ `0001 1010` → index `101` 一樣、tag `0001` 不同 → miss，把 90 那塊踢掉。結果 M、H、M。

**T-3.** 為什麼 fully associative 沒有 index？

??? quiz "看答案"
    整個 cache 只有 1 個 set，不用選「放哪一區」，所以 index 是 0 位元，除了 offset 以外全部都是 tag。代價是查詢時要跟每一格的 tag 比較。


### 2.1 公式整理：位址切割三步驟 {#u2-1}

1. **offset 位元** $=\log_2(\text{block 大小，byte})$
2. **set 數** $=\dfrac{\text{cache 容量}}{\text{block 大小}\times\text{associativity}}$，**index 位元** $=\log_2(\text{set 數})$
3. **tag 位元** $=\text{位址位元}-\text{index}-\text{offset}$

fully associative 沒有 index（只有 1 個 set）；direct-mapped 是 1-way。

### 2.2 Cache 總位元數 {#u2-2}

每個 block 需要：**data + tag + valid**，write-back 再加 **dirty**，set-associative 用 LRU 再加 **LRU 位元**（2-way 每個 set 1 個位元）。

$$\text{總位元數}=\text{block 數}\times(\text{data}+\text{tag}+\text{valid}+\text{dirty})+\text{LRU 位元}$$

!!! example "111 P3（25%）：32-bit 位址、16 KB data、write-back、LRU"
    16 KB ＝ 4K words。每個 block 加 valid 和 dirty 各 1 位元。

    | 設計 | block 數 | offset | index | tag | 每個 block 位元 | 總位元數 |
    |---|---|---|---|---|---|---|
    | (1) DM、1-word block | 4096 | 2 | 12 | 18 | 32+18+2=52 | $4096\times52=212992$ |
    | (2) DM、4-word block | 1024 | 4 | 10 | 18 | 128+18+2=148 | $1024\times148=151552$ |
    | (3) 2-way、4-word block | 1024（512 sets） | 4 | 9 | 19 | 128+19+2=149 | $1024\times149+512=153088$ |

    (3) 最後的 512 是每個 set 1 個 LRU 位元。direct-mapped 不需要 LRU。

    (4) TLB 10 entries、4 KB page：fully associative，每個 entry 存 VPN（tag）20 位元 ＋ PPN 20 位元（假設實體位址也是 32 位元）＋ valid、dirty、ref 位元，約 $10\times43=430$ 位元。

    (5) page table：$2^{32}/2^{12}=2^{20}$ 個 entry，每個存 PPN 20 位元＋狀態位元，約 $2^{20}\times4\text{ B}=4\text{ MB}$（假設 PTE 4 bytes）。

!!! example "113 Q5.2（6%）：32 KiB data、8-word block、32-bit 位址的 direct-mapped cache 總位元數"
    block 32 B → offset 5；block 數 $2^{15}/2^5=1024$ → index 10；tag $=32-10-5=17$。

    $1024\times(256+17+1)=1024\times274=280576$ 位元（write-through，沒有 dirty）。

### 2.3 Hit／miss 追蹤 {#u2-3}

!!! example "113 Q5.1（9%）：word address 序列、direct-mapped、2-word block、8 個 block"
    **block 位址** $=\lfloor\text{word address}/2\rfloor$，**index** $=\text{block 位址}\bmod8$，**tag** $=\lfloor\text{block 位址}/8\rfloor$。

    | word address | 二進位 | tag | index | H/M |
    |---|---|---|---|---|
    | 3 | 0000 0011 | 0 | 1 | M |
    | 180 | 1011 0100 | 11 | 2 | M |
    | 43 | 0010 1011 | 2 | 5 | M |
    | 2 | 0000 0010 | 0 | 1 | **H**（和 3 同一個 block） |
    | 191 | 1011 1111 | 11 | 7 | M |
    | 88 | 0101 1000 | 5 | 4 | M |
    | 190 | 1011 1110 | 11 | 7 | **H** |
    | 14 | 0000 1110 | 0 | 7 | M（踢掉 190 那塊） |
    | 181 | 1011 0101 | 11 | 2 | **H** |
    | 44 | 0010 1100 | 2 | 6 | M |
    | 186 | 1011 1010 | 11 | 5 | M（踢掉 43 那塊） |
    | 253 | 1111 1101 | 15 | 6 | M |

    **注意**：題目表格的示範列寫「3 → tag 0, index 3」，那是 1-word block 的切法（COD 原題的上一小題）。2-word block 時最低位元是 offset，index 是位元 [3:1]，所以 3 的 index 是 1。考試遇到這種情況，**寫出你的切法並說明**。

### 2.4 AMAT 與含記憶體停頓的 CPU time {#u2-4}

$$\text{AMAT}=\text{hit time}+\text{miss rate}\times\text{miss penalty}$$

多層：$\text{AMAT}=t_{L1}+m_{L1}\times(t_{L2}+m_{L2}\times t_{mem})$，$m_{L2}$ 是 L2 的 local miss rate。

!!! example "112 Q1.1–1.2（10%）：miss latency 10；direct-mapped hit 2 cycle、miss rate 15%；set-associative hit 3 cycle"
    DM：$2+0.15\times10=3.5$。

    SA 要更快：$3+m\times10<3.5$ → $m<5\%$。

!!! example "113 Q6（16%）：CPI 2.0、1 ns、每指令 1.5 次記憶體存取、miss penalty 80 ns；DM miss rate 1.5%、2-way miss rate 1.1% 但時脈要拉長 1.3 倍"
    **AMAT**（hit time 1 個週期）：

    - DM：$1.0+0.015\times80=2.2$ ns
    - 2-way：$1.3+0.011\times80=2.18$ ns

    **CPU time / IC**（penalty 是固定的 80 ns，不隨時脈變）：

    - DM：$2.0\times1.0+1.5\times0.015\times80=2.0+1.8=3.8$ ns
    - 2-way：$2.0\times1.3+1.5\times0.011\times80=2.6+1.32=3.92$ ns

    **結論**：2-way 的 AMAT 略好，但每條指令都被拉長的時脈拖累，整體 CPU time 反而 DM 較快。這正是 115 Q6.2 要你講的道理。

!!! example "115 Q6（15 分）：(1) hit 1 cycle、miss rate 2%、penalty 100 cycle 的 AMAT (2) 為什麼 associativity 太高反而變慢"
    (1) $1+0.02\times100=3$ cycles。

    (2) associativity 增加只減少 **conflict miss**，但：比較器變多、要多一層 mux 選出命中的 way → **hit time 變長**（甚至拖慢整顆 CPU 的時脈）；面積和功耗增加；而且 8-way 以上 miss rate 幾乎不再下降（剩下的是 compulsory、capacity miss）。hit time 的成本最後超過 miss rate 的收益。

### 2.5 觀念題 {#u2-5}

!!! example "111 P1（10%）：五個觀念題"
    - **多層 cache 寫入策略**：L1 常用 write-through（簡單、L2 隨時有最新資料，方便維持一致性），L2／L3 用 write-back（減少寫入主記憶體的流量）。寫入時用 write buffer 避免停頓。
    - **multi-word block 與 set-associative 的差別**：multi-word block 利用**空間區域性**（一次搬進相鄰資料），代價是 block 變大時 miss penalty 變大、block 數變少；set-associative 減少**衝突 miss**，代價是 hit time 和硬體成本。
    - **nonblocking cache**：miss 處理期間仍可服務其他存取（hit under miss、miss under miss），所以 cache 在 miss 時不會整個停住，**同時有多個請求在處理**，有效頻寬變高。
    - **TLB 放大後還用 fully associative 嗎**：不一定。entry 多時，全部平行比較的硬體太大、太慢、太耗電，所以大 TLB 通常改用 set-associative（或兩層 TLB：小的 fully associative L1 TLB＋大的 set-associative L2 TLB）。

!!! example "112 Q6（20%）：只知道三組位址序列的 hit rate，反推 cache 參數"
    已知 hit rate 依序是 1/2、5/8、1/3，選項是 block 8–128 B、1/2/4/8-way、4 或 8 KB、LRU 或 FIFO。

    **思路**：

    1. **block 大小**：序列 1 的 0、4、8、16 若在同一個 block 就會命中。0 之後 4、8 命中，16 也命中，就有 3 次命中＝1/2 → block 至少 32 B；如果 64 命中，block 就要 128 B，hit rate 會超過 1/2。所以 block 是 32 或 64 B，再用序列 2 的 31 與 63 區分：只有 64 B 才會讓 31、63 落在同一個 block。
    2. **associativity 與大小**：序列 2 中 0、4096、8192、16384 這些相隔 4 KB 的倍數會搶同一個 set；看它們能同時留住幾個，就推得出 way 數與容量。
    3. **LRU 或 FIFO**：序列 3 的 0 是否被保留，取決於序列 2 末段有沒有「再用到」某個 block 而改變它的順序。

    把每組參數都模擬一遍，唯一符合三個 hit rate 的是 **64 B block、4-way、8 KB、LRU**。考試時要把模擬的 cache 狀態畫出來當理由。

### 單元 2 小考 {#u2-quiz}

**2-1.** 32-bit 位址、64 KB direct-mapped、16 B block、write-through：offset、index、tag 各幾位元？總位元數？

??? quiz "看答案"
    offset 4、block 數 4096 → index 12、tag 16。總位元數 $4096\times(128+16+1)=593920$。

**2-2.** 同上但改成 4-way，index 和 tag？

??? quiz "看答案"
    set 數 $4096/4=1024$ → index 10、tag 18。

**2-3.** 4 個 block 的 direct-mapped cache（1-word block），word address 序列 0、8、0、6、8，幾次 miss？改成 fully associative LRU 呢？

??? quiz "看答案"
    DM：0、8、0、8 都映到 index 0 互踢，6 映到 index 2 → 5 次全 miss。
    FA：0 M、8 M、0 H、6 M、8 H → 3 次 miss。

**2-4.** L1 hit 1 cycle、miss rate 5%；L2 hit 10 cycle、local miss rate 20%；主記憶體 100 cycle。AMAT？

??? quiz "看答案"
    $1+0.05\times(10+0.2\times100)=1+0.05\times30=2.5$ cycles。

## 單元 3：虛擬記憶體與 TLB {#u3}

!!! key "一句話重點"
    虛擬位址 ＝ **VPN | page offset**。page offset 由 page 大小決定，直接搬到實體位址；VPN 查 TLB 或 page table 換成 PPN。

### 3.1 位元切割與 page table 大小 {#u3-1}

- page offset $=\log_2(\text{page 大小})$
- VPN $=$ 虛擬位址位元 $-$ offset，**page table entry 數 $=2^{\text{VPN}}$**
- PPN $=$ 實體位址位元 $-$ offset
- page table 大小 $=2^{\text{VPN}}\times$ PTE 大小
- TLB 若是 set-associative：TLB index $=\log_2(\text{TLB set 數})$，TLB tag $=$ VPN $-$ TLB index

!!! example "114 Q2（14%）：256 MiB 實體、4 GiB 虛擬、1 KiB page、TLB 4 sets × 8-way"
    | 項目 | 計算 | 位元數 |
    |---|---|---|
    | page offset | $\log_2 1024$ | 10 |
    | VPN | $32-10$ | 22 |
    | PPN | $28-10$ | 18 |
    | TLB index | $\log_2 4$ | 2 |
    | TLB tag | $22-2$ | 20 |

    page table 有 $2^{22}$ 個 entry。

!!! example "113 Q7.1（8%）：42-bit 虛擬位址、16 GiB DRAM、4 KiB page、PTE 4 B"
    VPN $=42-12=30$ → $2^{30}$ 個 PTE，page table $=2^{30}\times4\text{ B}=4\text{ GiB}$。

    （這比實體記憶體 16 GiB 的四分之一還大，這就是為什麼需要多層 page table。）

!!! example "111 P2（30%）：程式需要 4 GB、只分到 2 GB DRAM、page 4 KB、write-back、LRU"
    (1) page table 至少：$4\text{ GB}/4\text{ KB}=2^{20}$ 個 entry。每個 entry 至少要 PPN（2 GB／4 KB ＝ $2^{19}$ 個 frame → 19 位元）＋ valid ＋ dirty（write-back 需要）＝ 21 位元，約 $2^{20}\times21$ 位元 ≈ 2.6 MB；以 4 B 對齊則是 4 MB。

    (2) 隨機存取、沒有區域性：任一時刻只有一半的 page 在記憶體裡，**page fault rate ≈ 50%**。

    (3) TLB miss rate 75% → hit rate 25%。隨機存取下 hit rate ≈ TLB entry 數 / 總 page 數，所以 TLB 至少 $0.25\times2^{20}=2^{18}$ 個 entry。

### 3.2 TLB 與 page table 模擬 {#u3-2}

每個位址的處理順序：

1. 切出 VPN 和 offset。
2. 查 TLB：hit → 直接得 PPN（更新 LRU）。
3. TLB miss → 查 page table：valid → 得 PPN，放進 TLB。
4. page table 也 invalid → **page fault**，從磁碟載入，分配新的 PPN，更新 page table 和 TLB。

!!! example "113 Q7.2（12%）：4 KiB page、4-entry fully associative TLB、LRU，位址 4669、13916"
    | 位址 | VPN（$\lfloor a/4096\rfloor$） | 結果 |
    |---|---|---|
    | 4669 | 1 | TLB miss；page table 第 1 列是 Disk → **page fault**。新 PPN ＝ 目前最大的 12 加 1 ＝ 13。更新 page table[1] ＝ (1, 13)；TLB 用掉 invalid 的那格 → (1, tag 1, PPN 13) |
    | 13916 | 3 | **TLB hit**（tag 3 → PPN 6），更新 LRU |

    最後 TLB：(1,11,12)、(1,7,4)、(1,3,6)、(1,1,13)。

    這題是 COD 第 5 章 TLB 習題的改編，原題的位址串更長，練習時可以找原題做完整版本。

### 單元 3 小考 {#u3-quiz}

**3-1.** 32-bit 虛擬位址、8 KB page、PTE 4 B，單層 page table 多大？

??? quiz "看答案"
    offset 13、VPN 19 → $2^{19}\times4=2\text{ MB}$。

**3-2.** VPN 19 位元，TLB 16 entries、4-way，TLB index 和 tag 幾位元？

??? quiz "看答案"
    set 數 4 → index 2、tag 17。

**3-3.** 為什麼 page offset 不用轉換？

??? quiz "看答案"
    虛擬 page 和實體 frame 一樣大，page 內的相對位置不變，只有「第幾頁」需要對應。

## 單元 4：Pipeline 與 hazard {#u4}

!!! key "一句話重點"
    pipeline 讓**吞吐量**變高，但單一指令的**延遲**不會變短。週期時間由最慢的那一級決定。

### 4.1 pipeline 的時間計算 {#u4-1}

- single-cycle：週期 $=$ 各級延遲總和
- pipelined：週期 $=$ 最慢一級；$n$ 條指令、$k$ 級的總時間 $=(k+n-1)\times T$

!!! example "113 Q3（18%）：IF 250、ID 150、EX 350、MEM 300、WB 200 ps；alu 45%、beq 10%、lw 25%、sw 20%"
    | 小題 | 非 pipeline | pipeline |
    |---|---|---|
    | 3.1 週期時間 | $250+150+350+300+200=1250$ ps | 350 ps |
    | 3.2 lw、beq 的延遲 | 1250 ps | $5\times350=1750$ ps |
    | 3.3 lw、sw、add、beq 四條總時間 | $4\times1250=5000$ ps | $(5+3)\times350=2800$ ps |

    3.4 使用率：data memory 只有 lw、sw 用到 → $25\%+20\%=45\%$；register 寫入埠只有 alu、lw 用到 → $45\%+25\%=70\%$。

### 4.2 三種 hazard {#u4-2}

| 種類 | 原因 | 解法 |
|---|---|---|
| structural | 兩條指令同時要用同一個硬體 | 複製硬體（例如分開的 I-cache、D-cache） |
| data | 後面的指令要用前面還沒寫回的結果 | forwarding；load-use 還是要 stall 1 cycle |
| control | branch 結果還沒出來就要 fetch 下一條 | 預測、提早在 ID 決定、delayed branch |

!!! example "115 Q5.1（8 分）：lw R1, 0(R2) 後面緊接 add R3, R1, R4"
    (1) **為什麼有 hazard**：add 在 EX 需要 R1，但 lw 要到 MEM 結束才從記憶體拿到資料。

    (2) **為什麼 forwarding 不夠**：forwarding 只能把資料往**後面的時間**送。lw 的資料在第 4 個 cycle 結束才有，add 的 EX 在第 4 個 cycle 開始就要用，資料不能回到過去。

    (3) **最少 stall 1 個 cycle**，之後從 MEM/WB 暫存器 forward 給 add 的 EX。

!!! example "111 P5（15%）：沒有 forwarding 的 5 級 MIPS，執行 sub \$2 → and、or、add、sw 都用 \$2"
    (1) sub 在第 5 個 cycle 寫回。假設 register file **前半週期寫、後半週期讀**，and 的 ID 最早要在第 5 個 cycle，原本在第 3 個 → **stall 2 個 cycle**。之後 or、add、sw 的 ID 都在第 5 個 cycle 以後，不用再停。（若 register file 不能同週期先寫後讀，就是 3 個 cycle。）

    (2) 最小 ALU：這段程式只用到 sub、and、or、add（sw 的位址計算也是 add）。一個 32 位元 ALU 只要 AND、OR、加法器，減法用「加法器 + 第二運算元取反 + 進位輸入 1」（二補數），再用 mux 依 ALU control 選輸出。

    (3) branch 目標加法器**可以**移到 ID：它只需要 PC+4 和 sign-extend 後的立即值，兩者在 ID 都已經有了。好處是提早算出目標位址，搭配在 ID 做相等比較，misprediction penalty 從 2 降到 1。代價是比較器要的暫存器值可能還沒寫回，需要額外的 forwarding 或 stall。

!!! example "114 Q4（14%）：forwarding 值不值得？原本需要 0.4n 個 NOP、週期 250 ps；加 forwarding 後 0.05n 個 NOP、週期 300 ps"
    4.1：沒 forwarding $1.4n\times250=350n$；有 forwarding $1.05n\times300=315n$。speedup $=\frac{350}{315}\approx1.11$。

    4.2：沒 forwarding 只需 0.075n 個 NOP 的程式：$1.075n\times250=268.75n$。有 forwarding 最好的情況也要 $n\times300=300n$，**不可能更快**。

    4.3：設沒 forwarding 時的 NOP 比例為 $x$，要 $(1+x)\times250>300$（forwarding 最好情況 0 個 NOP），得 $x>0.2$，**至少 20%**。

    這題是 COD 第 4 章的習題原題。

### 單元 4 小考 {#u4-quiz}

**4-1.** 各級 200、100、250、200、150 ps。single-cycle 和 pipeline 的週期？1000 條指令時 pipeline 的總時間和 speedup？

??? quiz "看答案"
    single-cycle 900 ps、pipeline 250 ps。pipeline 總時間 $(5+999)\times250=251000$ ps；single-cycle $900\times1000=900000$ ps；speedup ≈ 3.59。

**4-2.** `lw x1, 0(x2)` 接 `add x3, x1, x4`：有 forwarding 時 stall 幾個？沒 forwarding（但 register file 前寫後讀）時呢？

??? quiz "看答案"
    有 forwarding：1 個。沒有：2 個（add 的 ID 要等到 lw 的 WB）。

## 單元 5：分支預測 {#u5}

!!! key "一句話重點"
    猜錯一次要丟掉「branch 決定之前已經進來的指令」。penalty 由**在第幾級決定**決定，pipeline 越深 penalty 越大。

### 5.1 公式 {#u5-1}

- **misprediction penalty** ＝ 決定 branch 的那一級 $-1$（在第 $k$ 級**結束時**決定，就丟掉前面 $k-1$ 級的指令）
- **額外 CPI** $=$ branch 比例 $\times$ 預測錯誤率 $\times$ penalty

!!! example "113 Q4（15%）：R 40%、BEQ 20%、JMP 5%、LW 25%、SW 10%；always-taken 準確率 40%、always-not-taken 60%、2-bit 80%；branch 在 EX 決定"
    假設 EX 結束時決定、IF 和 ID 的兩條要丟掉，penalty $=2$（如果你假設 PC 在 MEM 才更新，就用 3，寫清楚即可）。

    4.1 always-taken：$0.2\times(1-0.4)\times2=0.24$。

    4.2 2-bit：$0.2\times0.2\times2=0.08$。

    4.3 一半 branch 換成 ALU 指令（指令數不變）：branch 剩 10%，$\text{CPI}=1+0.1\times0.6\times2=1.12$；原本 $1.24$。speedup $=\frac{1.24}{1.12}\approx1.11$。

!!! example "112 Q1.3–1.4（10%）：30% branch、準確率 2/3、penalty 3 cycle；加深 pipeline、時脈加倍"
    1.3：$\text{CPI}=1+0.3\times\frac13\times3=1.3$。

    1.4：深 pipeline 的 penalty 為 $P$，時脈加倍 → 週期減半。深的較快的條件：
    $$\frac{1+0.3\times\frac13\times P}{2}<1.3\ \Rightarrow\ 1+0.1P<2.6\ \Rightarrow\ P<16$$
    misprediction penalty 小於 16 個週期時，深 pipeline 才划算。

!!! example "115 Q5.2（7 分）：branch 在最後一級決定，準確率 90%，pipeline 深 5、10、20"
    | 深度 | penalty | 每個 branch 平均成本 |
    |---|---|---|
    | 5 | 4 | $0.1\times4=0.4$ |
    | 10 | 9 | 0.9 |
    | 20 | 19 | 1.9 |

    準確率不變，但每次猜錯丟掉的指令跟深度成正比。所以 pipeline 越深，預測準確率每提升 1% 的價值就越高。

!!! example "114 Q3（18%）：7 級 pipeline、branch 在第 6 級決定、20% 是 branch"
    3.1：每次猜錯浪費 **5 條**指令（第 1–5 級的）。

    3.2：$N$ 條正確路徑的指令、準確率 $A$：
    $$\text{fetch 總數}=N+0.2N(1-A)\times5=N(2-A)$$

    3.3：dual-path（兩條路徑各 fetch 一樣多）：每個 branch 都有 5 個 slot 花在錯的那條路徑上 → $N+0.2N\times5=2N$。

    3.4：比例 $C$ 的 branch 是高信心（用預測，猜錯機率 $M$），其餘 $1-C$ 用 dual-path：
    $$N+0.2N\times5\times[CM+(1-C)]=N(2-C+CM)$$

    這題是 CMU 18-447（Onur Mutlu）2013 年期中考的原題型。

### 5.2 2-bit 預測器 {#u5-2}

四個狀態：強不跳（00）、弱不跳（01）、弱跳（10）、強跳（11）。狀態 ≥10 就預測跳。實際跳了往上加 1，沒跳往下減 1（到頭就停）。好處是迴圈最後一次不跳，只會讓狀態從「強跳」掉到「弱跳」，下次進迴圈仍然預測跳。

### 單元 5 小考 {#u5-quiz}

**5-1.** 25% branch、penalty 3、準確率 90%，CPI（理想 1）？

??? quiz "看答案"
    $1+0.25\times0.1\times3=1.075$。

**5-2.** 2-bit 預測器從 00 開始，實際結果依序 T、T、N、T，預測錯幾次？

??? quiz "看答案"
    00 預測 N（錯）→01；預測 N（錯）→10；預測 T（錯，實際 N）→01；預測 N（錯）→10。4 次全錯。這說明 2-bit 在剛開始和模式交替時表現不好。

## 單元 6：多執行緒 {#u6}

!!! key "一句話重點"
    多執行緒用「別的 thread 的指令」填滿某個 thread 等待的空檔。要算的是：**需要幾個 thread，才能每個 cycle 都有指令可發**。

### 6.1 兩種切換方式 {#u6-1}

- **Fixed switching（fine-grained，round-robin）**：每個 cycle 換下一個 thread，$N$ 個 thread 時每個 thread 每 $N$ 個 cycle 發一條。相依距離為 $d$ 條指令的兩條指令，時間間隔是 $dN$，必須 $\ge$ 前一條的延遲。**$N=\max\lceil\text{延遲}/d\rceil$**。
- **Data-dependent switching（switch-on-stall）**：一個 thread 一直跑到要 stall 才換。先算一個 thread 每輪「週期長度」與「發出的指令數」，**$N=\lceil\text{週期長度}/\text{每輪指令數}\rceil$**。

!!! example "114 Q5（18%）：LD 13 cycle、整數加 1、FADD 6、branch 1；迴圈 LD f2 / ADDI x1 / FADD f3,f3,f2 / BNE f2,f4"
    **5.1 Fixed**：

    - FADD 用到 LD 的 f2，距離 2：$2N\ge13$ → $N\ge7$
    - BNE 用到 f2，距離 3：$3N\ge13$ → $N\ge5$
    - 下一輪 FADD 用到這輪的 f3，距離 4：$4N\ge6$ → $N\ge2$

    取最大，**7 個 thread**。

    **5.1 Data-dependent**：一個 thread 的一輪是 LD（第 0 cycle）、ADDI（1）、FADD 要等到 13、BNE（14）、下一輪 LD（15）。週期 15 個 cycle、發 4 條指令 → $\lceil15/4\rceil=$ **4 個 thread**。

    **5.2 LD 改成 1 cycle**：Fixed 只剩 FADD 對 FADD：$4N\ge6$ → **2 個**。Data-dependent：每輪受 FADD 間隔 6 cycle 限制，6 cycle 發 4 條 → $\lceil6/4\rceil=$ **2 個**。

!!! example "112 Q3（15%）：linked list 走訪，LW 50 cycle、沒有 cache、load/store 非阻塞"
    程式：LW x3,0(x1) / LW x4,4(x1) / SEQ x3,x3,x2 / BNEZ x3,end / ADD x1,x0,x4 / BNEZ x4,loop

    3.1 單 thread 一輪：LW（1）、LW（2）、SEQ 要等 x3 到第 51、BNEZ 52、ADD 53、BNEZ 54，下一輪 LW 在 55 → **每輪 54 cycle**。

    3.2 Fixed：SEQ 距離第一個 LW 2 條，$2N\ge50$ → **25 個 thread**。（ADD 距第二個 LW 3 條，$3N\ge50$ → 17，較小。）

    3.3 Data-dependent：每輪 54 cycle、發 6 條指令 → $\lceil54/6\rceil=$ **9 個 thread**。

    MIT 6.823 的 Problem Set 10 有一模一樣的題目，可以拿來練（連結在最後）。

### 單元 6 小考 {#u6-quiz}

**6-1.** 迴圈只有兩條相依指令：LD（延遲 20）、緊接著用它的 ADD，再加一條 BNE。Fixed switching 需要幾個 thread？

??? quiz "看答案"
    ADD 距 LD 1 條：$N\ge20$。

## 單元 7：DRAM 與資料重用 {#u7}

!!! key "一句話重點"
    DRAM 的電容會漏電，每一列都要在 retention time 內 refresh 一次。refresh 會佔用 command bus 和 bank，這就是它的效能成本。

### 7.1 Refresh 使用率 {#u7-1}

$$\text{使用率}=\frac{\text{期間內 refresh 次數}\times\text{每次佔用時間}}{\text{期間長度}}$$

!!! example "114 Q1（18%）：8 banks × $2^{16}$ 列，每次 refresh 佔 command bus 5 ns"
    1.1 64 ms 內要 refresh $8\times2^{16}=2^{19}$ 次：
    $$\frac{2^{19}\times5\text{ ns}}{64\text{ ms}}=\frac{2^{19}\times5}{2^6\times10^6}=\frac{2^{13}\times5}{10^6}=4.096\%$$

    1.2 70% 的列只要 256 ms 一次：新的使用率 $=4.096\%\times(0.3+0.7\times\frac{64}{256})=4.096\%\times0.475$，**減少 $1-0.475=52.5\%$**。

    這就是 Mutlu 團隊的 RAIDR 想法：依各列的保存時間分組 refresh。

!!! example "112 Q2（15%）：4 channel × 2 rank × 8 bank × 32K 列，64 ms，command bus 5 ns、bank 40 ns，期間 1.024 秒"
    2.1 總列數 $2^2\times2\times2^3\times2^{15}=2^{21}$；1.024 秒有 $1.024/0.064=16$ 個 64 ms → refresh 共 $2^{21}\times16=2^{25}$ 次。

    2.2 每個 channel 有自己的 command bus，負擔 $2^{25}/4=2^{23}$ 次：$\frac{2^{23}\times5\text{ ns}}{1.024\text{ s}}=\frac{2^{23}\times5}{2^{10}\times10^6}=4.096\%$。

    2.3 每個 bank $2^{15}\times16=2^{19}$ 次 × 40 ns：$\frac{2^{19}\times40}{2^{10}\times10^6}=2.048\%$。

### 7.2 資料重用與迴圈順序 {#u7-2}

!!! example "112 Q4（15%）：矩陣乘法 $Z[m,n] \mathrel{+}= A[m,k]\times B[k,n]$ 的 reuse interval（RI）"
    RI ＝ 同一個元素兩次被用到之間，用過多少個不同的該矩陣元素（題目的例子：每次都用同一個 → RI 1）。

    | 迴圈順序（外到內） | RI of A | RI of B | RI of Z |
    |---|---|---|---|
    | 4.1 m, n, k | $K$ | $NK$ | 1 |
    | 4.2 k, m, n | 1 | $N$ | $MN$ |

    4.3（$M=500$、$N=1000$、$K=30$，MAC 單元＋32 個元素的 SRAM）：選 **m, n, k**。Z 的 RI 是 1，放在 MAC 輸出的 flip-flop；A 的 RI 是 $K=30$，**一整列 A（30 個）剛好放進 SRAM**，每列只從 DRAM 讀一次；B 的 RI 是 $NK=30000$，放不下，只能串流讀取。這樣每次 MAC 大約只需讀一次 DRAM（讀 B），Z 每個元素只寫一次，A 幾乎不用重讀。k, m, n 順序下 B 和 Z 的 RI 都遠大於 32，沒辦法用 SRAM 保住。

### 單元 7 小考 {#u7-quiz}

**7-1.** 4 banks × $2^{14}$ 列，refresh 間隔 32 ms，每次 refresh 佔 command bus 4 ns，使用率？

??? quiz "看答案"
    $\frac{2^{16}\times4\text{ ns}}{32\text{ ms}}=\frac{262144}{32\times10^6}=0.8192\%$。

## 單元 8：平行與微架構 {#u8}

### 8.1 GPU 峰值與記憶體頻寬 {#u8-1}

!!! example "113 Q2（8%）：2 GHz、16 個 SIMD processor、各 16 個單精度 FPU、600 GB/s"
    2.1 峰值：$2\times10^9\times16\times16=512$ GFLOPS（假設每個 FPU 每 cycle 1 個 flop；若算 FMA 為 2 個 flop 則 1024）。

    2.2 撐不住：如果每個 flop 都要從記憶體讀一個 4 B 的運算元，需要 $512\times4=2048$ GB/s，遠超過 600 GB/s。只有每個 byte 被重用約 $512/600\approx0.85$ 個 flop 以上（運算強度夠高，roofline 模型）時，才能接近峰值。

### 8.2 VLIW、superscalar、array processor {#u8-2}

!!! example "114 Q6（18%）：比較三種微架構"
    - **共同點**：每個 cycle 執行多個運算，利用平行性提高吞吐量。
    - **VLIW 比同寬度的 superscalar 簡單**：(1) 由**編譯器**決定哪些指令一起發，硬體不用做相依性檢查；(2) 不需要動態排程和複雜的 issue 邏輯。
    - **superscalar 可能更快**：硬體在執行時能根據實際情況（cache miss、branch 結果）動態排程，編譯器在編譯時看不到這些；而且不需要塞 NOP，程式碼較小。
    - **VLIW 比 array processor 彈性**：VLIW 每個 slot 可以做**不同的運算**；array processor 所有單元做**同一個運算**（SIMD）。
    - **array processor 比同寬度的 VLIW 簡單**：只需要一份指令、一個控制單元廣播給所有運算單元，指令頻寬和解碼成本都小。

### 8.3 記憶體一致性：sequential consistency {#u8-3}

!!! example "112 Q5（15%）：P1：ST A←1; LD RC←C；P2：ST B←1; LD RA←A；P3：ST C←1; LD RB←B"
    SC 的意思是：所有指令排成**一個**全域順序，且每個處理器自己的指令保持程式順序。

    | {RA, RB, RC} | 可能的順序 |
    |---|---|
    | {0,0,0} | **X**。RA＝0 要 P2.2 在 P1.1 前，RC＝0 要 P1.2 在 P3.1 前，RB＝0 要 P3.2 在 P2.1 前，再加上各自的程式順序，會形成 P1.1 < P1.2 < P3.1 < P3.2 < P2.1 < P2.2 < P1.1 的循環 |
    | {0,1,0} | P2.1 → P2.2 → P1.1 → P1.2 → P3.1 → P3.2 |
    | {1,0,0} | P1.1 → P1.2 → P3.1 → P3.2 → P2.1 → P2.2 |
    | {0,0,1} | P3.1 → P3.2 → P2.1 → P2.2 → P1.1 → P1.2 |

### 單元 8 小考 {#u8-quiz}

**8-1.** 為什麼 superscalar 需要 reorder buffer，而 VLIW 不需要？

??? quiz "看答案"
    superscalar 會動態亂序執行，需要 ROB 讓結果依程式順序 commit，才能做到精確例外和推測失敗時回復；VLIW 的順序由編譯器排好、照順序執行，不需要。

## 單元 9：ISA 與算術 {#u9}

!!! example "115 Q3（15 分）：RISC 與 PC-relative addressing"
    **Q3.1 為什麼現代 ISA 偏好 RISC**：指令簡單、長度固定 → 解碼快、容易 pipeline、每級時間平均；複雜指令的延遲不一，會拉長週期或需要微碼。指令數變多的代價，由更高的時脈和更低的 CPI 補回來（CPU time ＝ IC × CPI × T，三者要一起看）。另外編譯器實際上很少用到複雜指令。

    **Q3.2(a) 系統層**：(1) **位置無關**：程式被載入到不同位址（動態連結、共享函式庫、ASLR）時，相對位移不變，不用重新定位；(2) branch 目標通常很近，offset 用少少幾個位元就夠，**指令較短、程式密度高**，對 I-cache 有利。

    **Q3.2(b) 微架構層**：目標位址 ＝ PC ＋ 立即值，在 ID（甚至 IF）就能算出來，**不用讀暫存器**，所以可以提早算出目標、減少 control hazard 的 penalty。

!!! example "115 Q4（15 分）：二補數與浮點"
    **Q4.1**：8 位元二補數範圍 $-128$ 到 $127$。不對稱是因為 0 佔用了符號位元為 0 的一個 pattern：符號位元 0 有 128 個 pattern（0 到 127），符號位元 1 也有 128 個（$-1$ 到 $-128$）。多出來的是 **1000 0000 ＝ $-128$**，它沒有對應的正數，取負（反相加 1）還是自己，會溢位。

    **Q4.2**：(a) 浮點數只有固定位數的 mantissa，**每次運算都會捨入**，所以加法**不滿足結合律**：$(a+b)+c\ne a+(b+c)$；而且大數加小數時，小數的低位元在對齊指數時被移出（被「吃掉」）。(b) **由小到大加比較準**：小的數先累加成較大的部分和，再跟大數相加，被捨掉的誤差較少。

!!! example "111 P1.1（2%）：為什麼需要虛擬記憶體，優缺點"
    **好處**：程式可以用比實體記憶體更大的位址空間；每個 process 有獨立位址空間，彼此保護；方便共享（共享函式庫）和重新定位。**壞處**：位址轉換的時間與硬體成本（需要 TLB）、page table 佔記憶體、page fault 時要存取磁碟非常慢。

### 單元 9 小考 {#u9-quiz}

**9-1.** $-5$ 的 8 位元二補數？$100+50$ 在 8 位元有號運算會怎樣？

??? quiz "看答案"
    $5=0000\,0101$，反相 $1111\,1010$，加 1 得 $1111\,1011$。$150>127$，**溢位**，結果會變成負數（$1001\,0110=-106$）。

## 綜合小考 {#mix}

**M-1.** CPI 1.5 的處理器，每條指令 0.3 次資料存取，I-cache miss rate 2%、D-cache miss rate 5%，miss penalty 50 cycle。實際 CPI？

??? quiz "看答案"
    $1.5+1\times0.02\times50+0.3\times0.05\times50=1.5+1+0.75=3.25$。

**M-2.** 48-bit 虛擬位址、32-bit 實體位址、4 KB page，page table 有幾個 entry？（111 年 OS 也考過這題）

??? quiz "看答案"
    $2^{48-12}=2^{36}$ 個。

**M-3.** 6 級 pipeline，branch 在第 4 級結束時決定，branch 佔 20%、預測準確率 85%，CPI？

??? quiz "看答案"
    penalty 3：$1+0.2\times0.15\times3=1.09$。

## 資源 {#res}

- **Patterson & Hennessy《Computer Organization and Design》（RISC-V 版）**：第 1 章（效能）、第 4 章（pipeline）、第 5 章（記憶體階層）的習題，中山 113 年幾乎全出自這裡。
- **[Onur Mutlu 計算機結構考古題（附詳解）](https://safari.ethz.ch/architecture/fall2022/doku.php?id=exams)**、**[Digital Design & Computer Architecture 考古題](https://safari.ethz.ch/digitaltechnik/spring2020/doku.php?id=exams)**：112、114 年的 DRAM refresh、多執行緒、分支題都是這個風格。
- **[MIT 6.823 Problem Set 10：多執行緒](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10.pdf)**（[詳解](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10_sol.pdf)）：和 112 Q3、114 Q5 同一個題型。
- **[清大 OCW 黃婷婷：計算機結構](https://ocw.nthu.edu.tw/courses/13)**：中文講解，觀念不懂時看。
