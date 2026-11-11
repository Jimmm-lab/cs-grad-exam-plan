# 計算機結構：從中山考古題學

這份教材從中山資工碩甲組 111–115 年的「計算機結構」考古題整理而來，五年共 **30 大題**全部拆進各單元。中山這科的題目有兩個明顯來源：

- **Patterson & Hennessy《Computer Organization and Design》（COD）課本習題**：113 年幾乎整份都是，數字都很像。
- **Onur Mutlu（ETH Zürich／CMU）計算機結構課的考題**：112、114 年的 DRAM refresh、多執行緒切換、dual-path execution、VLIW 對比 superscalar 對比 array processor 都是他課上的經典題型。

!!! key "一句話重點"
    計結考的是**會不會算**加上**能不能講出取捨**。每一題的背後只有幾條公式：CPU time、Amdahl、AMAT、位址切割、pipeline 的 stall／penalty。把公式和「為什麼」都講清楚，就能拿到大部分分數。

!!! key "看不懂的時候"
    1. 先讀單元開頭的「觀念課」（每個單元的第 0 節）：用比喻和小例子把每種情況列出來，再推出公式。讀完先做觀念課最後的「換你試試」。
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

### 1.0 觀念課：執行時間由三個數字決定 {#u1-0}

#### 比喻：走一段路要多久

走完一段路的時間 ＝ **走幾步** × **每步要踩幾拍** × **每一拍多長**。

程式也一樣：

| 走路 | 程式 | 符號 |
|---|---|---|
| 走幾步 | 執行幾條指令 | IC（instruction count） |
| 每步踩幾拍 | 每條指令平均要幾個 clock cycle | CPI（cycles per instruction） |
| 每拍多長 | 一個 clock cycle 多長 | $T=1/f$ |

$$\text{CPU time}=\text{IC}\times\text{CPI}\times T$$

#### 加權平均的 CPI：一個 10 條指令的小程式

6 條 ALU 指令（每條 1 cycle）、4 條 load（每條 3 cycle）：

- 總 cycle 數 $=6\times1+4\times3=18$
- 平均 CPI $=18\div10=1.8$，也就是 $0.6\times1+0.4\times3$（**比例 × 各自的 CPI**，再加總）
- 時脈 1 GHz → $T=1$ ns → 時間 $=18$ ns

#### 為什麼「時脈高」不代表比較快

| | 時脈 | CPI | 每條指令的時間 |
|---|---|---|---|
| A | 2 GHz（$T=0.5$ ns） | 2.0 | $2.0\times0.5=1.0$ ns |
| B | 1.5 GHz（$T\approx0.67$ ns） | 1.2 | $1.2\div1.5=0.8$ ns |

同樣的指令數，B 比較快。**三個數字要一起看**，只比其中一個（時脈或 CPI）都可能錯。

#### Amdahl 定律：加速一部分，整體最多快多少

一個程式跑 100 秒：80 秒的部分可以加速，20 秒不行。

- 可加速的部分快 4 倍：$20+80/4=40$ 秒，整體 speedup $=100/40=2.5$
- 可加速的部分快到無限：$20+0=20$ 秒，整體最多 $100/20=5$ 倍

**不能加速的那 20% 決定了上限。** 寫成公式（$f$＝可加速比例、$s$＝加速倍數）：

$$\text{新時間}=(1-f)+\frac fs,\qquad\text{Speedup}=\frac{1}{(1-f)+\frac fs}$$

這就是「make the common case fast」：佔比大的部分（$f$ 大）才值得加速。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記（資工所考生整理）**：[了解與評估計算機的效能](https://saberliou.github.io/PrepareCSEMaster/ComputerOrganization/Chapter03.html)：CPU time 三因子、用 MIPS 評估效能的謬誤、Amdahl's Law、make the common case fast，順序跟這節一樣，還多了效能平均（算數、幾何平均）的整理。
    - **中文筆記**：〈[Ch1 Computer Abstraction and Technology](https://hackmd.io/@Toast1001/BJJ9X2GAyl)〉的 1-6 Performance。
    - **影片**：[清大黃婷婷・計算機結構](https://ocw.nthu.edu.tw/courses/13)（課程前段講效能）。

#### 換你試試

**T-1.** 100 條指令：70 條 ALU（CPI 1）、30 條 load（CPI 4），平均 CPI？

??? quiz "看答案"
    總 cycle 數 $=70\times1+30\times4=70+120=190$，平均 CPI $=190\div100=$ **1.9**。

    用比例直接算也一樣：$0.7\times1+0.3\times4=0.7+1.2=1.9$。

**T-2.** 佔 50% 時間的部分加速 2 倍，整體 speedup？

??? quiz "看答案"
    把原本時間當成 1：不能加速的 0.5 不變，能加速的 0.5 變成 $0.5\div2=0.25$。新時間 $0.5+0.25=0.75$。

    speedup $=\frac{1}{0.75}\approx$ **1.33**。

**T-3.** A：3 GHz、CPI 2.4；B：2 GHz、CPI 1.5。同一個程式誰快？

??? quiz "看答案"
    指令數一樣，比「每條指令平均多久」＝ CPI × 週期 ＝ CPI ÷ 時脈：

    - A：$2.4\div3\text{ GHz}=0.8$ ns
    - B：$1.5\div2\text{ GHz}=0.75$ ns

    **B 較快**（快 $0.8/0.75\approx1.07$ 倍），雖然它的時脈比較低。

### 1.1 CPU time 與加權 CPI {#u1-1}

$$\text{CPU time}=\text{IC}\times\text{CPI}\times T_{\text{clock}}=\frac{\text{IC}\times\text{CPI}}{f}$$

$$\text{CPI}_{\text{avg}}=\sum_i(\text{指令類別 } i \text{ 的比例})\times\text{CPI}_i$$

**用單位檢查公式**：IC（條）× CPI（cycle／條）＝ 總 cycle 數；再 × 週期（秒／cycle）＝ 秒。週期 $T=\frac1f$，所以乘 $T$ 跟除以時脈 $f$ 是同一件事。單位對得起來，公式就不會記錯。

**加權 CPI 為什麼是「比例 × CPI」**：總 cycle 數 $=\sum(\text{第 }i\text{ 類的條數}\times\text{CPI}_i)$，除以總條數 IC，每一類的條數 ÷ IC 就是它的比例。

!!! example "115 Q1.2（7 分）：$2\times10^9$ 條指令，50% CPI 1、30% CPI 5、20% CPI 2，2 GHz；記憶體指令 CPI 從 5 降到 2"
    $\text{CPI}=0.5\times1+0.3\times5+0.2\times2=2.4$，時間 $=\frac{2\times10^9\times2.4}{2\times10^9}=2.4$ 秒。

    改善後 $\text{CPI}=0.5+0.6+0.4=1.5$，時間 1.5 秒，speedup $=\frac{2.4}{1.5}=1.6$。

!!! example "115 Q2.1（10 分）：35% CPI 1、45% CPI 3、20% CPI 2，週期 0.4 ns，$10^9$ 條指令"
    $\text{CPI}=0.35+1.35+0.4=2.1$，時間 $=10^9\times2.1\times0.4\text{ ns}=0.84$ 秒。

### 1.2 Amdahl 定律 {#u1-2}

只有比例 $f$ 的部分加速 $s$ 倍：

$$\text{Speedup}=\frac{1}{(1-f)+\dfrac{f}{s}}\qquad\text{上限}=\frac{1}{1-f}$$

**公式怎麼來的**：原本時間當成 1。不能加速的部分佔 $1-f$，時間不變；能加速的部分原本 $f$，變成 $\frac fs$。新時間 $=(1-f)+\frac fs$，speedup ＝ 舊時間 ÷ 新時間。$s$ 再大，$\frac fs$ 也只會趨近 0，新時間至少是 $1-f$，所以上限是 $\frac{1}{1-f}$。

**反過來問「要加速幾倍」**：令 speedup 等於目標 $S$，解 $(1-f)+\frac fs=\frac1S$。如果算出 $\frac fs\le0$，就是**不可能**（111 P4.2）。

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

1. **功耗牆（power wall）**：動態功耗 $\approx\frac12CV^2f$。每個電晶體每切換一次，要把電容 $C$ 充電到電壓 $V$，耗能約 $\frac12CV^2$；每秒切換 $f$ 次，功率就是 $\frac12CV^2f$。時脈 $f$ 上去功耗跟著上去，而且高時脈通常要更高的 $V$，$V$ 又是平方，散熱撐不住。→ 改用**多核、平行**，用更多較慢的核心換效能。
2. **記憶體牆（memory wall）**：DRAM 延遲沒有跟著 CPU 變快，時脈再高也只是多等幾個週期。→ 發展**記憶體階層**（多層 cache）來隱藏延遲。
3. （可再補）**pipeline 越切越細的極限**：每級都有 pipeline 暫存器的固定延遲，切到最後收益變小，而 branch misprediction penalty 越來越大。→ 需要更好的**分支預測**與推測執行。

### 單元 1 小考 {#u1-quiz}

**1-1.** 40% ALU（CPI 1）、30% load（CPI 4）、20% store（CPI 3）、10% branch（CPI 2），1 GHz，$10^9$ 條指令，CPU time？

??? quiz "看答案"
    **平均 CPI**：$0.4\times1+0.3\times4+0.2\times3+0.1\times2=0.4+1.2+0.6+0.2=2.4$。

    **週期**：1 GHz → $T=\frac{1}{10^9}$ 秒 $=1$ ns。

    **CPU time** $=10^9\times2.4\times1\text{ ns}=2.4\times10^9\text{ ns}=$ **2.4 秒**。

**1-2.** 佔 80% 時間的部分要加速幾倍，整體才會快 2 倍？

??? quiz "看答案"
    要整體快 2 倍 → 新時間是原本的 $\frac12$：

    $$(1-0.8)+\frac{0.8}{s}=0.5\ \Rightarrow\ \frac{0.8}{s}=0.3\ \Rightarrow\ s=\frac{0.8}{0.3}=\frac83\approx2.67$$

    那 80% 要加速約 **2.67 倍**。（檢查上限：$\frac1{0.2}=5\ge2$，做得到。）

**1-3.** 90% 可平行，10 個核心的 speedup？

??? quiz "看答案"
    $f=0.9$、$s=10$：新時間 $=0.1+\frac{0.9}{10}=0.1+0.09=0.19$。

    speedup $=\frac{1}{0.19}\approx$ **5.26**（10 個核心只快 5 倍多，上限是 $\frac1{0.1}=10$）。

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

#### 第一步：書桌有幾個抽屜，每本書放哪個抽屜

把書桌想成有 **4 個抽屜**，編號 0–3，這個編號叫 **index**。圖書館的書照順序編號：block 0、1、2、3、…。最簡單的規定是：

> **第 $n$ 號 block 只能放進第 $n \bmod 4$ 號抽屜。**

| 抽屜（index） | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| 可能放進來的 block | 0、4、8、12… | 1、5、9、13… | 2、6、10、14… | 3、7、11、15… |
| 這些 block 的 tag | 0、1、2、3… | 0、1、2、3… | 0、1、2、3… | 0、1、2、3… |

問題來了：0、4、8、12 號都要擠 0 號抽屜，**光看抽屜號碼不知道裡面放的是哪一本**。所以每個抽屜外面貼一張標籤，寫「現在裡面是第幾輪的那本」，也就是 $n\div4$ 的商。這張標籤就是 **tag**。例如 0 號抽屜貼著 tag 2，裡面就是 block $2\times4+0=8$。

這種「每個 block 只有一個抽屜可以放」的 cache 叫 **direct-mapped**。

#### 第二步：用十進位算出 offset、index、tag

位址是「第幾個 byte」。假設 **block 4 bytes、cache 有 4 個抽屜**，CPU 要讀位址 45：

1. **在第幾個 block、block 裡的第幾個 byte**：$45\div4=11$ 餘 $1$ → 在 **block 11**，block 裡的第 **1** 個 byte（從 0 數），這個「第幾個 byte」叫 **offset**。
2. **放哪個抽屜**：$11\bmod4=3$ → **index 3**。
3. **標籤寫什麼**：$11\div4=2$（取商）→ **tag 2**。

寫成公式：

$$\text{block 號碼}=\left\lfloor\frac{\text{位址}}{\text{block 大小}}\right\rfloor,\qquad \text{offset}=\text{位址}\bmod\text{block 大小}$$

$$\text{index}=\text{block 號碼}\bmod\text{set 數},\qquad \text{tag}=\left\lfloor\frac{\text{block 號碼}}{\text{set 數}}\right\rfloor$$

（抽屜正式的名稱是 **set**；direct-mapped 時一個 set 只有一格。）

#### 第三步：換成二進位，其實是同一件事

block 大小和 set 數都是 2 的次方。**除以 4 就是把二進位往右切掉 2 位，餘數就是被切掉的那 2 位**。所以：

- 最右邊 $\log_2(\text{block 大小})$ 位是 offset，
- 再往左 $\log_2(\text{set 數})$ 位是 index，
- 剩下的全部是 tag。

位址 45 ＝ `0010 1101`（8 位元位址）：

| tag | index | offset |
|---|---|---|
| `0010` ＝ 2 | `11` ＝ 3 | `01` ＝ 1 |

跟十進位算的一模一樣。**考試時：幾個位元用 $\log_2$ 算；某個位址的 tag、index 用十進位除法算，比較不會切錯。**

#### 第四步：cache 裡面實際存了什麼

每一格（每個抽屜）存三樣東西。讀完位址 45 之後，cache 長這樣：

| index | valid | tag | data（整個 block，4 bytes） |
|---|---|---|---|
| 0 | 0 | – | – |
| 1 | 0 | – | – |
| 2 | 0 | – | – |
| 3 | 1 | 2 | 位址 44、45、46、47 的內容 |

- **valid**：這格有沒有放東西。開機時全部是 0，所以每一格第一次用一定 miss。
- **tag**：放的是哪一個 block。tag 和 index 合起來就是 block 號碼：$2\times4+3=11$。
- **data**：整個 block 的資料。位址 45 只要 1 個 byte，但搬進來的是 44–47 一整塊。

#### 第五步：查一次 cache 的四個動作

1. 用 **index** 找到那一格。
2. 看 **valid** 是不是 1。
3. 比對格子裡存的 **tag** 跟位址算出來的 tag 一不一樣。
4. valid 是 1 **而且** tag 一樣 → **hit**，用 **offset** 從 data 裡取出那個 byte。否則 → **miss**：去記憶體把整個 block 搬進來，寫入新的 tag、把 valid 設成 1。

所以讀完 45 之後，再讀 44、46、47 都是 hit（同一個 block，只差 offset）；讀 48 就是 miss（block 12，放 0 號抽屜）。

#### 搶抽屜：conflict miss

再看位址 109：$109\div4=27$ 餘 1 → block 27 → index $27\bmod4=3$、tag $27\div4=6$。它也要用 **3 號抽屜**，只是 tag 不同（二進位 `0110 1101`，index 一樣是 `11`）。

依序讀 45、109、45：

1. 45：3 號格是空的（valid 0）→ miss，放入 tag 2
2. 109：3 號格的 tag 是 2，不是 6 → miss，把 45 的 block 踢掉，換成 tag 6
3. 45：3 號格的 tag 是 6，不是 2 → 又 miss

其他三格明明都空著，卻一直 miss，這叫 **conflict miss**。解決方法是讓一個抽屜可以放不只一本：

| 規則 | 比喻 | 名稱 |
|---|---|---|
| 每個 block 只能放固定的一格 | 對號入座 | direct-mapped（1-way） |
| 每個 block 只能放某一區，區裡哪格都可以 | 分區自由座 | $n$-way set-associative |
| 每個 block 哪一格都可以放 | 全部自由座 | fully associative |

「區」就是 **set**。容量一樣是 4 格時，改成 **2-way**：只剩 2 個 set，每個 set 有 2 格。index ＝ block 號碼 mod **2**：45（block 11）和 109（block 27）都在 set 1，但 set 1 有兩格，可以**同時放**，第三次讀 45 就 hit 了。

下面是這個例子的動畫，每一步都會顯示 index、tag 和比對結果。看完以後把「set 數」改成 2、「每個 set 幾格」改成 2（容量一樣是 4 個 block），再按重播，第三次就變成 hit。位址序列也可以換成任何考題的數字：

<div class="viz" data-viz="cache" data-addrs="45,109,45" data-unit="byte" data-block="4" data-sets="4" data-ways="1"></div>

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

!!! trap "最常見的五個錯"
    1. **set-associative 的 index 要用 set 數，不是 block 數**。4096 個 block、4-way → $4096\div4=1024$ 個 set → index 10 位元，不是 12。
    2. **word address 和 byte address**：題目給 word address 時，offset 用「block 有幾個 word」算；給 byte address 時用 byte 數算。
    3. **「cache 容量 16 KB」通常只算 data**，不含 tag、valid；題目問「總位元數」時才把 tag、valid（write-back 再加 dirty）加上去。
    4. **hit 要兩個條件同時成立**：valid 是 1，**而且** tag 一樣。開機時 valid 全是 0，第一次用到一定 miss。
    5. **只差 offset 的位址在同一個 block**：讀過 44，再讀 45、46、47 都是 hit；但 48 已經是下一個 block。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記（資工所考生整理）**：[容量大且速度快的記憶體](https://saberliou.github.io/PrepareCSEMaster/ComputerOrganization/Chapter06.html)：區域性、direct-mapped、**快取位元計算**（valid ＋ tag ＋ data，跟 2.2 一樣）、寫入策略、快取效能。
    - **影片**：[清大黃婷婷・計算機結構](https://ocw.nthu.edu.tw/courses/13) 第 7 週 Large and fast: exploiting memory hierarchy。

#### 換你試試

<div data-qid="u2-0-t0" markdown="1">

**T-0.** block 8 bytes、4 個 set、direct-mapped（byte address）。位址 100 在第幾個 block？offset、index、tag 是多少？先用十進位算，再用二進位對答案。

??? quiz "看答案"
    **十進位**：$100\div8=12$ 餘 $4$ → block 12、**offset 4**；index $=12\bmod4=$ **0**；tag $=12\div4=$ **3**。

    **二進位對答案**：100 ＝ `0110 0100`。offset 是最右 $\log_2 8=3$ 位 `100` ＝ 4；index 是接著 $\log_2 4=2$ 位 `00` ＝ 0；tag 是剩下的 `011` ＝ 3。兩種算法一樣。

    **意思是**：位址 100 在 block 12 的第 4 個 byte；block 12 放在 0 號格，格子的標籤寫 3（$3\times4+0=12$）。

</div>

**T-1.** 8 位元位址、block 2 bytes、8 個 set、direct-mapped。offset、index、tag 各幾位元？位址 90 的 tag、index、offset 是多少？

??? quiz "看答案"
    - offset：block 2 bytes → $\log_2 2=$ **1** 位元
    - index：8 個 set → $\log_2 8=$ **3** 位元
    - tag：$8-3-1=$ **4** 位元

    90 ＝ 64＋16＋8＋2 ＝ `0101 1010`，從右邊切：offset 是最右 1 位 `0`、index 是接著 3 位 `101`（5 號格）、tag 是剩下的 `0101`。

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

**為什麼是這樣**：$k$ 個位元可以表示 $2^k$ 種情況。一個 block 有 $B$ 個 byte，要分出是第幾個 byte，需要 $\log_2B$ 位元；有 $S$ 個 set，要選第幾個，需要 $\log_2S$ 位元。容量 ÷ block 大小 ＝ 總共幾格，再 ÷ 每個 set 幾格 ＝ set 數。

**注意單位**：題目給 word address 時，offset 是「block 裡第幾個 word」，用 word 數算；給 byte address 時用 byte 數算。一個 word 通常是 4 bytes。

#### 三種映射方式一次比較

| | direct-mapped（直接映射，1-way） | $n$-way set-associative（$n$ 路集合關聯） | fully associative（全關聯） |
|---|---|---|---|
| 一個 block 可以放哪裡 | **唯一固定的一格**：block 號碼 mod 格數 | **固定的一個 set**（block 號碼 mod set 數），set 裡哪一格都可以 | **任何一格** |
| index | **最長**：$\log_2(\text{格數})$ | $\log_2(\text{set 數})$ | **沒有**（0 位元，只有 1 個 set） |
| tag | **最短** | 中間 | **最長**：整個 block 號碼都是 tag |
| 查詢時比對幾個 tag | 1 個 | $n$ 個（同時比） | 全部的格（同時比） |
| 要不要替換策略（LRU 等） | 不用，位置被佔就直接換掉 | set 滿了才要 | 全滿才要 |
| 硬體成本、hit time | 最低、最快 | 中間 | 最高、最慢 |

**規律**：容量和 block 大小不變時，associativity 每加倍，set 數就減半 → **index 少 1 位、tag 多 1 位**（offset 不變）。

### 2.2 Cache 總位元數 {#u2-2}

題目說「16 KB 的 cache」，通常只算 **data**。但硬體裡每一格還要存幾個「管理用」的欄位，題目問**總位元數**時要全部加起來。

#### 每一格存了哪些東西

| 欄位 | 幾個位元 | 做什麼用 |
|---|---|---|
| **valid** | 1 | 這格有沒有放有效的資料。開機時全部是 0，所以第一次用到一定 miss |
| **dirty** | 1（只有 write-back 才有） | 這個 block 搬進 cache 之後有沒有被**改過**。被踢出去時，dirty＝1 才要寫回主記憶體（[2.5](#u2-write)） |
| **tag** | 位址位元 − index − offset | 這格現在放的是**哪一個 block** |
| **data** | block 大小 × 8 | block 本身的內容 |

set-associative 用 **LRU** 時，每個 **set** 還要幾個位元記錄「誰最久沒用」（[2.6](#u2-repl)）。2-way 的 set 只有兩格，**1 個位元**就夠：0 表示下次踢第 0 格、1 表示踢第 1 格。

#### 為什麼不用存 index 和 offset

!!! key "位置本身就是答案"
    - **index 不用存**：第幾列本身就是 index。就像抽屜的號碼刻在書桌上，不用另外寫在標籤上。查詢時，硬體把位址的 index 接到**解碼器**，直接打開那一列。
    - **offset 不用存**：block 裡的 byte 本來就照順序排好，offset 只是用來從整個 block 裡**挑出第幾個 byte**（接到多工器 MUX），不用存下來。
    - **只有 tag 一定要存**：同一列可能放過很多不同的 block（0、4、8、12 都擠 0 號抽屜），只能靠存下來的 tag 比對「現在是不是我要的那一塊」。

所以總位元數是「每一格都要存的」加上「每個 set 共用的」：

$$\begin{aligned}\text{總位元數}=\;&\text{block 數}\times(\text{data}+\text{tag}+\text{valid}+\text{dirty})\\&+\text{set 數}\times\text{每個 set 的 LRU 位元}\end{aligned}$$

LRU 加在最後面，是因為它跟著 **set** 走，不是跟著 block 走：2-way 的一個 set 裡兩格共用 1 個位元。direct-mapped 每個 set 只有一格、沒得選，**不需要 LRU**。4-way 以上要記完整的先後順序，位元數依做法不同，考試會給條件。

!!! example "111 P3（25%）：32-bit 位址、16 KB data、write-back、LRU"
    **題目條件與前提**

    - 位址 32 位元（虛擬位址、實體位址都是 32 位元）。
    - data 容量 16 KB ＝ $16\times1024=16384$ bytes。32 位元的系統 1 word ＝ 4 bytes，所以是 **4096 words**（4K words）。
    - write-back：每個 block 除了 tag，還要 **valid 1 位元＋dirty 1 位元**，共 2 位元。

    **(1) direct-mapped、1-word block**

    - **block 數（4096）**：4096 words ÷ 每塊 1 word。
    - **offset（2）**：一塊 4 bytes ＝ $2^2$。
    - **index（12）**：4096 格 ＝ $2^{12}$。
    - **tag（18）**：$32-12-2$。
    - **每塊位元（52）**：data 32 ＋ tag 18 ＋ valid／dirty 2。
    - **總位元數**：$4096\times52=212992$。

    **(2) direct-mapped、4-word block**

    - **block 數（1024）**：$4096\div4$。
    - **offset（4）**：一塊 16 bytes ＝ $2^4$（2 位選第幾個 word ＋ 2 位選 word 裡的第幾個 byte）。
    - **index（10）**：1024 ＝ $2^{10}$。
    - **tag（18）**：$32-10-4$。
    - **每塊位元（148）**：data $4\times32=128$ ＋ 18 ＋ 2。
    - **總位元數**：$1024\times148=151552$。

    **(3) 2-way set-associative、4-word block**

    - **block 數 1024、set 數（512）**：每 2 塊一組，$1024\div2=512=2^9$。
    - **offset（4）**：跟 (2) 一樣。
    - **index（9）**：用 **set 數**算，$\log_2512=9$。（常見錯誤：用 block 數算成 10）
    - **tag（19）**：$32-9-4$。index 少 1 位，tag 就多 1 位。
    - **每塊位元（149）**：128 ＋ 19 ＋ 2。
    - **LRU（512）**：2-way 每個 set 用 1 位元記誰比較久沒用，512 個 set 共 512 位元。
    - **總位元數**：$1024\times149+512=153088$。

    | 設計 | block 數 | offset | index | tag | 每塊位元 | 總位元數 |
    |---|---|---|---|---|---|---|
    | (1) DM、1-word block | 4096 | 2 | 12 | 18 | 52 | 212992 |
    | (2) DM、4-word block | 1024 | 4 | 10 | 18 | 148 | 151552 |
    | (3) 2-way、4-word block | 1024（512 sets） | 4 | 9 | 19 | 149 | 153088 |

    **(4) TLB：10 個 entry、4 KB page、fully associative**

    - **page offset（12）**：4 KB ＝ $2^{12}$。
    - **VPN、PPN（各 20）**：$32-12$。
    - **每個 entry（43）**：fully associative 沒有 index，整個 VPN 當 tag 存 20 ＋ PPN 20 ＋ valid、dirty、ref 共 3。
    - **TLB 總共**：$10\times43=430$ 位元。

    **(5) page table**

    - **entry 數（$2^{20}$）**：VPN 有 20 位元，每個虛擬 page 一個 entry，約一百萬個。
    - **大小（4 MB）**：每個 PTE 取 4 bytes（PPN 20 位元＋狀態位元，湊成 32 位元），$2^{20}\times4\text{ B}=2^{22}\text{ B}=4\text{ MB}$。

!!! example "113 Q5.2（6%）：32 KiB data、8-word block、32-bit 位址的 direct-mapped cache 總位元數"
    block 32 B → offset 5；block 數 $2^{15}/2^5=1024$ → index 10；tag $=32-10-5=17$。

    $1024\times(256+17+1)=1024\times274=280576$ 位元（write-through，沒有 dirty）。

### 2.3 Hit／miss 追蹤 {#u2-3}

!!! example "113 Q5.1（9%）：word address 序列、direct-mapped、2-word block、8 個 block"
    **block 位址** $=\lfloor\text{word address}/2\rfloor$，**index** $=\text{block 位址}\bmod8$，**tag** $=\lfloor\text{block 位址}/8\rfloor$。

    **用十進位算比切二進位快**：例如 180 → block 位址 $\lfloor180/2\rfloor=90$ → index $90\bmod8=2$、tag $\lfloor90/8\rfloor=11$。這跟把 `1011 0100` 切成 tag `1011`、index `010`、offset `0` 是同一件事。

    | word address | 二進位 | block | tag | index | H/M | 說明 |
    |---|---|---|---|---|---|---|
    | 3 | 0000 0011 | 1 | 0 | 1 | M | 搬進 block 1（word 2、3） |
    | 180 | 1011 0100 | 90 | 11 | 2 | M | 搬進 block 90（word 180、181） |
    | 43 | 0010 1011 | 21 | 2 | 5 | M | 搬進 block 21（word 42、43） |
    | 2 | 0000 0010 | 1 | 0 | 1 | **H** | 和 3 同一塊 |
    | 191 | 1011 1111 | 95 | 11 | 7 | M | 搬進 block 95（word 190、191） |
    | 88 | 0101 1000 | 44 | 5 | 4 | M | 搬進 block 44（word 88、89） |
    | 190 | 1011 1110 | 95 | 11 | 7 | **H** | 和 191 同一塊 |
    | 14 | 0000 1110 | 7 | 0 | 7 | M | index 7 被佔：踢掉 block 95，換成 block 7 |
    | 181 | 1011 0101 | 90 | 11 | 2 | **H** | 和 180 同一塊 |
    | 44 | 0010 1100 | 22 | 2 | 6 | M | 搬進 block 22（word 44、45） |
    | 186 | 1011 1010 | 93 | 11 | 5 | M | index 5 被佔：踢掉 block 21（43 那塊） |
    | 253 | 1111 1101 | 126 | 15 | 6 | M | index 6 被佔：踢掉 block 22（44 那塊） |

    **結果**：hit 3 次（2、190、181），**hit rate ＝ 3/12 ＝ 25%**。

    **9 次 miss 都是 compulsory**：每一次 miss 都是第一次用到那個 block。14、186、253 雖然把別的 block 踢掉了，但它們自己也是第一次出現；被踢掉的 block 95、21、22 之後沒再用到，所以這串存取沒有 conflict miss。

    **注意**：題目表格的示範列寫「3 → tag 0, index 3」，那是 1-word block 的切法（COD 原題的上一小題）。2-word block 時最低位元是 offset，index 是位元 [3:1]，所以 3 的 index 是 1。考試遇到這種情況，**寫出你的切法並說明**。

<div class="viz" data-viz="cache" data-addrs="3,180,43,2,191,88,190,14,181,44,186,253" data-unit="word" data-block="2" data-sets="8" data-ways="1" data-title="113 Q5.1：一個一個位址看 hit／miss"></div>

### 2.4 AMAT 與含記憶體停頓的 CPU time {#u2-4}

$$\text{AMAT}=\text{hit time}+\text{miss rate}\times\text{miss penalty}$$

多層：$\text{AMAT}=t_{L1}+m_{L1}\times(t_{L2}+m_{L2}\times t_{mem})$，$m_{L2}$ 是 L2 的 local miss rate。

**多層公式怎麼讀**：每次都先查 L1（$t_{L1}$）。L1 miss 的那 $m_{L1}$ 比例，要再查 L2（$t_{L2}$）；L2 也 miss 的，再去記憶體（$t_{mem}$）。括號裡就是「L1 miss 之後平均還要多久」，也就是 L1 的 miss penalty。

- **local miss rate** $m_{L2}=\dfrac{\text{L2 miss 次數}}{\text{L2 被存取的次數}}$：分母只算「L1 miss、才來問 L2」的那些存取。
- **global miss rate** $=\dfrac{\text{L2 miss 次數}}{\text{CPU 全部的記憶體存取次數}}=m_{L1}\times m_{L2}$：全部存取裡，一路 miss 到主記憶體的比例。

**例子**：CPU 存取 1000 次，L1 miss 40 次（這 40 次去問 L2），L2 又 miss 10 次。L2 的 local miss rate $=10/40=25\%$；global miss rate $=10/1000=1\%$，剛好等於 $4\%\times25\%$。題目沒說清楚時，要寫出你用的是哪一種。

**把 cache miss 算進 CPI**：每條指令平均要等記憶體的 cycle 數 ＝ 每條指令存取幾次 × miss rate × miss penalty，加到原本的 CPI 上：

$$\text{CPI}_{\text{實際}}=\text{CPI}_{\text{base}}+\frac{\text{記憶體存取次數}}{\text{指令}}\times\text{miss rate}\times\text{miss penalty（cycle）}$$

每條指令都要抓指令（I-cache 1 次），load／store 再多 1 次 D-cache。綜合小考 M-1 就是這個公式。

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

### 2.5 寫入策略：write-through 與 write-back {#u2-write}

讀資料只要找得到就好；**寫資料**比較麻煩：cache 和主記憶體各有一份，改了 cache 那份，主記憶體那份怎麼辦？分成兩個情況：要寫的 block 在 cache 裡（**write hit**）、不在 cache 裡（**write miss**）。

#### write hit：什麼時候把新的值寫回主記憶體

| | write-through（寫穿） | write-back（寫回） |
|---|---|---|
| 做法 | 改 cache 的**同時**也寫主記憶體 | 只改 cache；等這個 block **被踢出去時**才寫回主記憶體 |
| 需要 dirty 位元？ | 不需要：主記憶體永遠是最新的 | **需要**：記這塊有沒有被改過，沒改過的被踢掉時不用寫回 |
| 優點 | 簡單；主記憶體隨時是最新的 | 同一塊改很多次，最後只寫回一次，省頻寬 |
| 缺點 | 每次寫都要等慢的主記憶體 | 比較複雜；被踢的 block 要先寫回，才能放新的 |
| 常見搭配 | **write buffer**；write miss 用 no-write-allocate | write miss 用 write-allocate |

**write buffer**：CPU 把要寫的資料丟進一個小緩衝區就繼續做事，由緩衝區慢慢寫進主記憶體。這樣 write-through 就不用每次停下來等。

**一個例子**：迴圈把 `a[0]`～`a[3]`（同一個 16-byte block）各加 1，之後這個 block 被踢掉。

- write-through：寫 4 次，**主記憶體也被寫 4 次**（每次 4 bytes）。
- write-back：4 次都只改 cache，dirty 變成 1；被踢掉時**整個 block 寫回 1 次**（16 bytes）。

同一塊改越多次，write-back 省越多。

#### write miss：要不要先把 block 搬進 cache

- **write-allocate**：先把整個 block 從主記憶體搬進 cache，再在 cache 裡寫，之後再讀寫這塊就會 hit。通常搭配 **write-back**。
- **no-write-allocate**：不搬進 cache，直接寫主記憶體。通常搭配 **write-through**：反正每次都要寫主記憶體，搬進來也省不了寫入。

!!! key "考試常問"
    - **為什麼 write-back 需要 dirty、write-through 不需要？** write-through 的主記憶體永遠是最新的，block 被踢掉時直接丟掉就好；write-back 的主記憶體可能是舊的，要靠 dirty 知道踢掉前要不要寫回。
    - **為什麼 write-through 要 write buffer？** 不然每次寫都要停下來等主記憶體（約 100 個 cycle）。
    - **多層 cache**：L1 常用 write-through（L2 隨時有最新資料），L2／L3 用 write-back（減少寫主記憶體的流量），見 [2.7 的 111 P1](#u2-5)。

### 2.6 替換策略：LRU 與 FIFO {#u2-repl}

direct-mapped 每個 block 只有一個位置，被佔用就直接換掉，沒得選。**set-associative 和 fully associative** 的 set 滿了，就要決定踢掉誰：

| 策略 | 踢掉誰 | hit 時要更新順序嗎 | 想法 |
|---|---|---|---|
| **LRU**（least recently used） | **最久沒被用到**的那一格 | **要**：被用到的變成「最近用過」 | 時間區域性：最近用過的，等一下很可能又用 |
| **FIFO**（first in, first out） | **最早放進來**的那一格 | **不用**：只看放進來的先後 | 簡單，硬體只要記放進來的順序 |
| **Random** | 隨便挑一格 | 不用 | 最簡單；cache 大的時候表現跟 LRU 差不多 |

#### 同一串存取，LRU 和 FIFO 結果不同

只有 1 個 set、2 格（2-way），依序存取 block A、B、A、C、A。中括號裡寫在前面的是「下一個要被踢的」：

| 存取 | A | B | A | C | A |
|---|---|---|---|---|---|
| **LRU** 的 set | [A] | [A, B] | [B, A]（A 變成最近用過） | [A, C]（踢最久沒用的 B） | [C, A] |
| LRU 結果 | M | M | **H** | M | **H** |
| **FIFO** 的 set | [A] | [A, B] | [A, B]（順序不變） | [B, C]（踢最早放進來的 A） | [C, A]（踢 B） |
| FIFO 結果 | M | M | **H** | M | M |

LRU 2 次 hit、FIFO 1 次。差別在第三步：A 被用到了，**LRU 會記得**「A 剛用過」，所以第四步踢 B；**FIFO 不管**，只看 A 最早進來，就把 A 踢掉，第五步又要 miss。LRU 也不是永遠比較好，[2.8 的 C-4](#u2-concept) 有一個 FIFO 反而贏的例子。

下面的動畫是同一串存取（A＝位址 0、B＝4、C＝8，block 4 bytes、1 個 set、2 格）。先用 LRU 看一次，再把「set 滿了踢誰」改成 FIFO 重播：

<div class="viz" data-viz="cache" data-addrs="0,4,0,8,0" data-unit="byte" data-block="4" data-sets="1" data-ways="2" data-policy="lru" data-title="LRU 和 FIFO：同一串存取，結果不同"></div>

### 2.7 考古題的觀念題 {#u2-5}

!!! example "111 P1（10%）：五個觀念題"
    - **多層 cache 寫入策略**：L1 常用 write-through（簡單、L2 隨時有最新資料，方便維持一致性），L2／L3 用 write-back（減少寫入主記憶體的流量）。寫入時用 write buffer 避免停頓。
    - **multi-word block 與 set-associative 的差別**：multi-word block 利用**空間區域性**（一次搬進相鄰資料），代價是 block 變大時 miss penalty 變大、block 數變少；set-associative 減少**衝突 miss**，代價是 hit time 和硬體成本。
    - **nonblocking cache**：miss 處理期間仍可服務其他存取（hit under miss、miss under miss），所以 cache 在 miss 時不會整個停住，**同時有多個請求在處理**，有效頻寬變高。
    - **TLB 放大後還用 fully associative 嗎**：不一定。entry 多時，全部平行比較的硬體太大、太慢、太耗電，所以大 TLB 通常改用 set-associative（或兩層 TLB：小的 fully associative L1 TLB＋大的 set-associative L2 TLB）。

!!! example "112 Q6（20%）：只知道三組位址序列的 hit rate，反推 cache 參數"
    **題目條件**

    | 序列 | 存取的位址（byte，由舊到新） | hit rate |
    |---|---|---|
    | 1 | 0、4、8、16、64、128 | 1/2 |
    | 2 | 31、8192、63、16384、4096、8192、64、16384 | 5/8 |
    | 3 | 32768、0、129、1024、3072、8192 | 1/3 |

    cache 一開始是空的；三組序列**接著做、中間不清空**。要判斷：block 大小（8／16／32／64／128 B）、associativity（1／2／4／8-way）、容量（4 或 8 KB）、替換策略（LRU 或 FIFO）。

    **解題策略**：一次鎖定一個參數。每一步都用「如果是別的選項，hit rate 會變成多少，跟題目矛盾」來排除。（題目寫 Explain to get points，排除的理由一定要寫。）

    **6.1 block 大小 ＝ 64 B**

    - 序列 1 共 6 次，要 3 次 hit。0 一定 miss；要湊到 3 次，4、8、16 都得跟 0 在**同一個 block** → block 至少 32 B。
    - 64、128 要 miss，否則 hit 超過 3 次 → 64 不能跟 0 同一塊 → block 小於 128 B。只剩 32 或 64 B。
    - 用序列 2 的 63 分辨：64 B 時 0–63 都在 block 0，63 會 hit；32 B 時 63 在另一塊，會 miss。照 64 B 算序列 2：

    | 位址 | 31 | 8192 | 63 | 16384 | 4096 | 8192 | 64 | 16384 |
    |---|---|---|---|---|---|---|---|---|
    | block 號碼 | 0 | 128 | 0 | 256 | 64 | 128 | 1 | 256 |
    | 結果 | H | M | **H** | M | M | H | H | H |

    31 和 63 都在序列 1 搬進來的 block 0；64 在序列 1 搬進來的 block 1。共 5 次 hit ＝ **5/8** ✓。換成 32 B，63 會 miss，只剩 4/8，不合。

    **6.2 associativity ＝ 4-way（上下界夾擊）**

    - **先看誰搶同一個 set**：block 0、64、128、256 除以 set 數都餘 0（set 數最多 64；只有 1-way 8 KB 有 128 個 set，那時 block 64 會去 set 64，但 0、128、256 還是在 set 0）。
    - **下界：1-way、2-way 都不行**。序列 2 第 6 步的 8192 要 hit，block 128 就得撐過第 4、5 步放進來的 256 和 64。只有 1 格時，第 4 步的 256 一來就把 128 踢掉；只有 2 格時，LRU 在第 4 步放 256 時就踢掉 128（剛用過的是 0），FIFO 在第 5 步放 64 時踢掉 128。第 6 步都會 miss，hit rate 湊不到 5/8。
    - **上界：不是 8-way**。8-way 時 set 數只有 16（8 KB）或 8（4 KB），到序列 3 結束，擠進 set 0 的 block 有 0、64、128、256、512，再加上 16、48，最多 7 個，8 格都放得下，永遠不用踢。這樣序列 3 的 0、129、8192 都會 hit ＝ 3/6 ＝ 1/2，不是 1/3。

    所以是 **4-way**。

    **6.3 容量 ＝ 8 KB**

    - **4 KB**：$4096\div64\div4=16$ 個 set。序列 3 的 1024（block 16）、3072（block 48）除以 16 都餘 0，也擠進 set 0，把之後要用的 block 踢掉，序列 3 只剩 1/6。
    - **8 KB**：$8192\div64\div4=32$ 個 set。block 16、48 都去 set 16，不干擾 set 0 → 符合 1/3。

    **6.4 替換策略 ＝ LRU**

    進入序列 3 時，set 0 裡有 block 0、64、128、256。最後一次用到：block 0 是序列 2 第 3 步（63）、64 是第 5 步（4096）、128 是第 6 步（8192）、256 是第 8 步（16384）。放進來的先後是 0、128、256、64。

    | 位址 | block（set） | LRU | FIFO |
    |---|---|---|---|
    | 32768 | 512（0） | M，踢 0 | M，踢 0 |
    | 0 | 0（0） | M，踢 64 | M，踢 128 |
    | 129 | 2（2） | H | H |
    | 1024 | 16（16） | M | M |
    | 3072 | 48（16） | M | M |
    | 8192 | 128（0） | **H**（128 還在） | M（128 被踢了） |

    LRU 共 2 次 hit ＝ **1/3** ✓；FIFO 只有 1/6，不合。差別在：序列 2 第 6 步剛用過 8192，**LRU 記得它最近用過**，所以留著；FIFO 只看它是第二早放進來的，就踢掉了。

    **答案**：64 B、4-way、8 KB、LRU。我也用程式把 $5\times4\times2\times2=80$ 種組合全部模擬過，只有這一組三個 hit rate 都符合。

### 2.8 觀念小考 {#u2-concept}

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。答對、答錯都會記在「本頁小考」。

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 哪一種寫入策略，每一格需要 dirty 位元？

1. write-through
2. write-back
3. 兩種都需要
4. 兩種都不需要

??? quiz "看解析"
    **B. write-back**。write-back 只改 cache，主記憶體那份可能是舊的，所以要用 dirty 記「這塊改過沒」，被踢掉時 dirty＝1 才寫回。write-through 每次都同時寫主記憶體，主記憶體永遠是最新的，不需要 dirty。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-2.** direct-mapped cache 為什麼不需要 LRU 位元？

1. direct-mapped 不會發生 miss
2. LRU 的資訊已經存在 tag 裡
3. 每個 block 只有一個位置可以放，被佔用就直接換掉，沒得選
4. direct-mapped 一定搭配 write-through

??? quiz "看解析"
    **C**。LRU 是用來在「同一個 set 的好幾格」裡挑一格踢掉。direct-mapped 每個 set 只有一格，新的 block 來了只能放那一格，不用挑，所以不需要 LRU。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-3.** 計算 cache 總位元數時，為什麼不用加 index 的位元？

1. index 只有幾個位元，可以忽略
2. 格子的位置本身就是 index，硬體用它經過解碼器直接選到那一列
3. index 已經算在 data 裡
4. 只有 fully associative 才不用加

??? quiz "看解析"
    **B**。第幾列本身就代表 index，不用另外存；offset 也一樣，只是用來從 block 裡挑 byte。只有 tag 要存，因為同一列可能放過很多不同的 block。（D 錯在：不只 fully associative，所有 cache 都不用存 index；fully associative 是根本沒有 index。）

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-4.** 1 個 set、2 格，依序存取 A、B、A、C、B。LRU 和 FIFO 各有幾次 hit？

1. LRU 2 次、FIFO 1 次
2. 都是 1 次
3. 都是 2 次
4. LRU 1 次、FIFO 2 次

??? quiz "看解析"
    **D**。前三步都一樣：A miss、B miss、A hit。

    - **LRU**：A 剛用過，所以 C 來的時候踢 B → [A, C]；接著 B 來，最久沒用的是 A → 踢 A，**B miss**。共 1 次 hit。
    - **FIFO**：C 來的時候踢最早進來的 A → [B, C]；接著 B 還在，**B hit**。共 2 次 hit。

    LRU 不保證比較好，它賭的是「最近用過的等一下還會用」。這串存取剛好相反，所以 FIFO 贏。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-5.** 一個 block 被寫了 10 次之後才被踢出 cache。write-through（不考慮 write buffer）和 write-back 各要寫主記憶體幾次？

1. write-through 10 次、write-back 1 次
2. write-through 1 次、write-back 10 次
3. 都是 10 次
4. 都是 1 次

??? quiz "看解析"
    **A**。write-through 每寫一次 cache 就同時寫主記憶體，共 10 次。write-back 這 10 次都只改 cache，dirty 變成 1，被踢掉時把整個 block 寫回 1 次。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-6.** 容量和 block 大小都不變，把 direct-mapped 改成 4-way set-associative，主要會減少哪一種 miss？

1. compulsory miss
2. capacity miss
3. conflict miss
4. 三種都不會變

??? quiz "看解析"
    **C**。conflict miss 是「cache 還有空位，卻因為搶同一格被踢掉」。4-way 讓同一個 set 可以同時放 4 個 block，搶位置的情況變少。compulsory miss（第一次用到）和 capacity miss（cache 整個裝不下）跟 associativity 無關。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-7.** write miss 時採用 write-allocate，意思是？

1. 不把 block 搬進 cache，直接寫主記憶體
2. 先把整個 block 搬進 cache，再在 cache 裡寫
3. 把資料丟進 write buffer 後就不管了
4. 把那一格的 dirty 設成 0

??? quiz "看解析"
    **B**。allocate 就是「在 cache 裡配一格給它」。A 是 no-write-allocate。write-allocate 通常搭配 write-back：搬進來之後，接下來對這塊的寫入都只改 cache。

</div>

<div class="mcq" data-ans="4" markdown="1">

**C-8.** 下面哪一種情況，某一格的 valid 位元是 0？

1. 那一格的資料被修改過
2. 位址的 tag 跟那一格存的 tag 不一樣
3. 剛剛發生 hit
4. 開機之後，這一格還沒有放過任何 block

??? quiz "看解析"
    **D**。valid 只表示「這格有沒有放有效的資料」。A 是 dirty 的意思；B 是 miss 的原因之一，但那一格的 valid 可能是 1（只是放的是別的 block）；C 發生 hit 時 valid 一定是 1。

</div>

**W-1.** 用自己的話說明：為什麼 cache 每一格要存 tag，卻不用存 index 和 offset？

??? quiz "看參考答案"
    - **index**：每一格在第幾列，本身就是 index，硬體用位址的 index 直接選到那一列，不用另外存。
    - **offset**：只是用來從 block 裡挑出第幾個 byte，block 的資料本來就照順序排好，不用存。
    - **tag**：同一列會輪流放很多不同的 block（index 相同、tag 不同），只有把 tag 存下來，才能比對「現在放的是不是我要的那一塊」。

    **自我檢查**：你的答案有沒有提到「同一格會放很多不同的 block」？這是一定要存 tag 的原因。

**W-2.** write-back 的 block 被踢出 cache 時，一定要寫回主記憶體嗎？什麼情況可以不用？

??? quiz "看參考答案"
    **不一定**。看 dirty 位元：dirty＝1 表示搬進 cache 之後被改過，主記憶體那份是舊的，要先寫回；dirty＝0 表示沒被改過，主記憶體那份跟 cache 一樣，直接丟掉就好。這就是 write-back 需要 dirty 位元的原因。

**W-3.** 1 個 set、2 格，依序存取 A、B、C、A、B，用 LRU。每一次是 hit 還是 miss？為什麼表現這麼差？換成 FIFO 會比較好嗎？

??? quiz "看參考答案"
    LRU：A M、B M、C M（踢 A）、A M（踢 B）、B M（踢 C）→ **5 次全 miss**。FIFO 這串的踢法剛好一樣，也是全 miss。

    原因：三個 block 輪流用，但 set 只有兩格。每次要用的，剛好就是上一步被踢掉的那個，這種情況叫 **thrashing**。換替換策略救不了，要讓 set 裝得下正在輪流用的 block，例如改成 3 格以上（提高 associativity），或調整存取順序。

### 單元 2 小考 {#u2-quiz}

**2-1.** 32-bit 位址、64 KB direct-mapped、16 B block、write-through：offset、index、tag 各幾位元？總位元數？

??? quiz "看答案"
    - offset：16 B block → $\log_2 16=$ **4**
    - block 數：$64\text{ KB}\div16\text{ B}=2^{16}\div2^4=2^{12}=4096$；direct-mapped 一個 set 一格 → 4096 個 set → index **12**
    - tag：$32-12-4=$ **16**

    每個 block 要存：data $16\times8=128$ 位元 ＋ tag 16 ＋ valid 1（write-through 不用 dirty）＝ 145 位元。

    總位元數 $4096\times145=$ **593920**。

**2-2.** 同上但改成 4-way，index 和 tag？

??? quiz "看答案"
    block 數還是 4096，但每個 set 有 4 格：set 數 $4096\div4=1024=2^{10}$ → index **10**。offset 不變是 4，tag $=32-10-4=$ **18**。

    associativity 加倍，index 少 1 位、tag 多 1 位。

**2-3.** 4 個 block 的 direct-mapped cache（1-word block），word address 序列 0、8、0、6、8，幾次 miss？改成 fully associative LRU 呢？

??? quiz "看答案"
    **Direct-mapped**：1-word block，index ＝ 位址 mod 4：0→0、8→0、6→2。

    | 存取 | 0 | 8 | 0 | 6 | 8 |
    |---|---|---|---|---|---|
    | index | 0 | 0 | 0 | 2 | 0 |
    | 結果 | M | M（踢掉 0） | M（踢掉 8） | M | M（踢掉 0） |

    **5 次全 miss**。0 和 8 搶同一格，cache 其他格卻空著（conflict miss）。

    **Fully associative、LRU**（4 格都可以放）：0 M、8 M、0 **H**、6 M、8 **H** → **3 次 miss**（都是第一次用到的 compulsory miss）。

    可以把數字填進 [2.0 的動畫](#u2-0)檢查：位址單位選 word、block 1、set 數 4 或 1、每個 set 1 或 4 格。

**2-4.** L1 hit 1 cycle、miss rate 5%；L2 hit 10 cycle、local miss rate 20%；主記憶體 100 cycle。AMAT？

??? quiz "看答案"
    先算 L1 miss 之後平均還要多久（L1 的 miss penalty）：查 L2 要 10，其中 20% 還要再去記憶體 100 → $10+0.2\times100=30$ cycles。

    $\text{AMAT}=1+0.05\times30=1+1.5=$ **2.5 cycles**。

## 單元 3：虛擬記憶體與 TLB {#u3}

!!! key "一句話重點"
    虛擬位址 ＝ **VPN | page offset**。page offset 由 page 大小決定，直接搬到實體位址；VPN 查 TLB 或 page table 換成 PPN。

### 3.0 觀念課：每個程式都以為自己擁有整棟大樓 {#u3-0}

#### 比喻：門牌對照表

每個程式都以為自己住在一整棟大樓裡，房號從 0 開始（**虛擬位址**）。實際上作業系統只分給它幾個真實的房間（**實體記憶體的 frame**），不常用的東西放在倉庫（**磁碟**）。

要找東西時，查一張「虛擬房號 → 實體房號」的對照表，這張表就是 **page table**。

**為什麼要這樣做**：

- 每個程式的位址都從 0 開始，寫程式的人不用管別人用了哪裡。
- 程式之間互相看不到對方的房間（**保護**）。
- 程式可以比實體記憶體還大，不常用的放磁碟。

#### 一個 8 位元的小例子

虛擬位址 8 位元、page 大小 16 bytes。

- page 內有 16 個 byte → **offset 4 位元**（右邊 4 位），這部分**直接照抄**到實體位址
- 剩下左邊 4 位是 **VPN**（虛擬頁號），共 16 頁

page table 的一部分：

| VPN | valid | PPN |
|---|---|---|
| 0 | 1 | 2 |
| 1 | 0 | 在磁碟 |
| 5 | 1 | 0 |

**轉換虛擬位址 0x53 ＝ `0101 0011`**：VPN `0101`＝5、offset `0011`＝3。查表 VPN 5 → PPN 0。實體位址 ＝ PPN 接上 offset ＝ `00 0011` ＝ 3。

**轉換 0x1A ＝ `0001 1010`**：VPN 1，valid 是 0，資料在磁碟上 → **page fault**。作業系統把那一頁從磁碟載入、填好 page table，再重新執行這條指令。

#### 為什麼 page table 這麼大

page table 要替**每一個虛擬頁**留一格。32 位元位址、4 KB page：offset 12 位元、VPN 20 位元 → $2^{20}$ 格，每格 4 bytes 就是 4 MB，而且**每個程式都要一張**。這就是考題愛問「page table 多大」的原因，也是為什麼有多層 page table。

#### TLB：對照表的 cache

page table 放在記憶體裡，所以每次存取資料都要**先讀一次記憶體查表**，等於慢一倍。解法是把最近用過的幾筆對照放進 CPU 裡一個很小、很快的表，叫 **TLB**。它就是 page table 的 cache，所以 cache 學到的 hit、miss、associativity 全部適用。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記**：中大計組 [Ch5 筆記的 Virtual Memory 部分](https://hackmd.io/@jcxyisncu1092/co5c)：page table、page fault、TLB hit／miss 的處理和 TLB 與 cache 的互動。
    - **作業系統角度**：[清大周志遠・作業系統講義](https://ocw.nthu.edu.tw/ocw/index.php?page=course_news_content&cid=141&id=999) Ch8 Memory Management、Ch9 Virtual Memory。這一單元和 OS 的記憶體單元可以一起讀。

#### 換你試試

用上面的 page table（VPN 0→2、VPN 5→0）。

**T-1.** 虛擬位址 0x07 的實體位址？

??? quiz "看答案"
    0x07 ＝ `0000 0111` → VPN `0000` ＝ 0、offset `0111` ＝ 7。查表 VPN 0 → PPN 2。

    實體位址 ＝ PPN 接上 offset ＝ `10 0111` ＝ **39**。用十進位算：PPN × page 大小 ＋ offset ＝ $2\times16+7=39$。

**T-2.** 虛擬位址 0x5F 的實體位址？

??? quiz "看答案"
    0x5F ＝ `0101 1111` → VPN 5、offset 15。查表 VPN 5 → PPN 0。

    實體位址 ＝ $0\times16+15=$ **15**（`00 1111`）。

**T-3.** 16 位元虛擬位址、page 256 bytes，page table 有幾格？

??? quiz "看答案"
    page 256 bytes → offset $\log_2256=8$ 位元；VPN $=16-8=8$ 位元。page table 要替每個虛擬頁留一格：$2^8=$ **256** 格。

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
    - offset：8 KB ＝ $2^{13}$ → 13 位元
    - VPN：$32-13=19$ 位元 → $2^{19}$ 個 entry
    - 大小：$2^{19}\times4\text{ B}=2^{21}\text{ B}=$ **2 MB**

**3-2.** VPN 19 位元，TLB 16 entries、4-way，TLB index 和 tag 幾位元？

??? quiz "看答案"
    TLB 就是 page table 的 cache，切法跟 cache 一樣（只是沒有 offset，因為 TLB 的一格存一整個 VPN 的對照）：

    set 數 $=16\div4=4$ → TLB index $\log_24=$ **2** 位元；TLB tag $=$ VPN $-$ index $=19-2=$ **17** 位元。

**3-3.** 為什麼 page offset 不用轉換？

??? quiz "看答案"
    虛擬 page 和實體 frame 一樣大，page 內的相對位置不變，只有「第幾頁」需要對應。

## 單元 4：Pipeline 與 hazard {#u4}

!!! key "一句話重點"
    pipeline 讓**吞吐量**變高，但單一指令的**延遲**不會變短。週期時間由最慢的那一級決定。

### 4.0 觀念課：洗衣服的流水線 {#u4-0}

#### 比喻：洗、烘、摺

洗衣服有三步：洗 30 分、烘 30 分、摺 30 分。有 4 批衣服：

- **一批做完才做下一批**：$4\times90=360$ 分鐘
- **流水線**：第一批洗完拿去烘的同時，第二批開始洗。總時間 $(3+3)\times30=180$ 分鐘

每一批從頭到尾還是要 90 分鐘（**延遲沒變**），但每 30 分鐘就有一批完成（**吞吐量變高**）。

#### 指令的五個步驟

| 階段 | 做什麼 |
|---|---|
| IF | 從記憶體拿指令 |
| ID | 看懂指令、讀暫存器 |
| EX | ALU 計算（或算位址） |
| MEM | 讀寫資料記憶體（只有 load／store 需要） |
| WB | 把結果寫回暫存器 |

三條指令的時序圖（每格一個 cycle）：

| 指令 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 第 1 條 | IF | ID | EX | MEM | WB | | |
| 第 2 條 | | IF | ID | EX | MEM | WB | |
| 第 3 條 | | | IF | ID | EX | MEM | WB |

$n$ 條指令、$k$ 級：第一條要 $k$ 個 cycle，之後每個 cycle 完成一條，總共 $(k+n-1)$ 個 cycle。**週期由最慢的那一級決定**，因為每一級都要在同一個節拍內做完。

#### Data hazard：下一條要用上一條的結果

```text
add x1, x2, x3     # x1 在第 5 個 cycle（WB）才寫回
sub x4, x1, x5     # 但 sub 在第 4 個 cycle（EX）就要用 x1
```

| 指令 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| add | IF | ID | **EX**（算出 x1） | MEM | WB | |
| sub | | IF | ID | **EX**（要用 x1） | MEM | WB |

add 在第 3 個 cycle 結束時其實已經算出 x1 了，只是還沒寫回。**forwarding** 就是拉一條線，把 EX 算好的結果直接送給下一條指令的 EX，不用等 WB，所以不用停。

**load 不一樣**：load 的資料要到 MEM（第 4 個 cycle）結束才從記憶體拿到。下一條指令在第 4 個 cycle 就要用，資料還沒出來，forwarding 也來不及，**一定要停 1 個 cycle**（插入一個 bubble）。這就是 load-use hazard。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記**：〈[pipeline data hazard](https://hackmd.io/@fu_myN6KTla21R5GiHie3w/SJd7n-Rkc)〉：forwarding unit 的判斷條件（EX/MEM、MEM/WB 的 Rd 等於下一條的 Rs／Rt 時就 forward），配 COD 的 datapath 圖。
    - **中文筆記（資工所考生整理）**：[處理器：資料路徑與控制單元](https://saberliou.github.io/PrepareCSEMaster/ComputerOrganization/Chapter04.html)：先看懂單週期 datapath 的元件，pipeline 圖會好讀很多。
    - **影片**：[清大黃婷婷・計算機結構](https://ocw.nthu.edu.tw/courses/13) 第 6 週 Enhancing performance with pipelining。

#### 換你試試

**T-1.** 10 條指令、5 級 pipeline、每級 200 ps。pipeline 和非 pipeline（每條 1000 ps）各要多久？

??? quiz "看答案"
    **pipeline**：第 1 條要走完 5 級（5 個 cycle），之後每個 cycle 多完成 1 條，剩下 9 條再 9 個 cycle：$(5+9)\times200=$ **2800 ps**。

    **非 pipeline**：一條做完才做下一條，$10\times1000=$ **10000 ps**。

    speedup $=10000/2800\approx3.6$，比 5 小，因為填滿 pipeline 的前 4 個 cycle 沒有完整利用；指令越多，越接近 5 倍。

**T-2.** 有 forwarding 時，下面兩組各要停幾個 cycle？(a) `lw x1, 0(x2)` 接 `add x3, x1, x4` (b) `add x1, x2, x3` 接 `add x4, x1, x5`

??? quiz "看答案"
    (a) 1 個（load-use）。(b) 0 個（EX 的結果直接 forward）。

**T-3.** 各級延遲 150、200、300、200、150 ps，pipeline 的週期是多少？為什麼？

??? quiz "看答案"
    300 ps。每一級都要在一個週期內完成，週期只能配合最慢的那一級。

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
    - **single-cycle 週期**：一個 cycle 要做完所有級，$200+100+250+200+150=$ **900 ps**
    - **pipeline 週期**：最慢的那一級 **250 ps**

    1000 條指令：

    - pipeline：$(5+1000-1)\times250=1004\times250=$ **251000 ps**
    - single-cycle：$1000\times900=900000$ ps

    speedup $=900000\div251000\approx$ **3.59**（理想是 5 倍，但各級不平均，週期被最慢的 250 拖住：$900/250=3.6$）。

**4-2.** `lw x1, 0(x2)` 接 `add x3, x1, x4`：有 forwarding 時 stall 幾個？沒 forwarding（但 register file 前寫後讀）時呢？

??? quiz "看答案"
    **有 forwarding**：lw 的資料在 MEM（第 4 cycle）結束才有，add 的 EX 最早只能在第 5 cycle → 停 **1 個**，再從 MEM/WB forward 過去。

    | | 1 | 2 | 3 | 4 | 5 | 6 |
    |---|---|---|---|---|---|---|
    | lw | IF | ID | EX | MEM | WB | |
    | add | | IF | stall | ID | EX | MEM |

    （也可以畫成 add 在 ID 停一拍，重點是 EX 落在第 5 cycle。）

    **沒有 forwarding**：add 要在 ID 讀暫存器時讀到新值。lw 在第 5 cycle 的 WB 才寫回，register file 前半寫、後半讀，add 的 ID 最早在第 5 cycle，原本在第 3 → 停 **2 個**。

## 單元 5：分支預測 {#u5}

!!! key "一句話重點"
    猜錯一次要丟掉「branch 決定之前已經進來的指令」。penalty 由**在第幾級決定**決定，pipeline 越深 penalty 越大。

### 5.0 觀念課：還不知道要跳去哪，只好先猜 {#u5-0}

#### 問題在哪

`beq` 要比較完兩個暫存器，才知道要跳還是不跳。假設在 EX（第 3 級）結束時才知道結果：

| 指令 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| beq | IF | ID | EX（知道結果） | MEM |
| 下一條？ | | IF | ID | |
| 再下一條？ | | | IF | |

在知道結果之前，pipeline 已經抓了 2 條指令進來。猜對了沒事；**猜錯了，這 2 條要丟掉**，浪費 2 個 cycle。這就是 misprediction penalty：

$$\text{penalty}=\text{決定 branch 的那一級}-1$$

#### 平均多花多少

100 條指令裡有 20 條 branch，猜對率 75%：猜錯 $20\times0.25=5$ 次，每次 2 cycle，多花 10 cycle。理想 CPI 1 變成 $\frac{100+10}{100}=1.1$。

$$\text{CPI}=1+\text{branch 比例}\times(1-\text{準確率})\times\text{penalty}$$

#### 2-bit 預測器為什麼比 1-bit 好

迴圈跑 10 次：branch 前 9 次「跳」（回到迴圈開頭），第 10 次「不跳」（離開迴圈）。整個迴圈重複執行 3 次。

- **1-bit**（記住上一次的結果）：離開時猜錯一次；下次重新進迴圈時，它記得「上次沒跳」，又猜錯一次。第一輪錯 1 次，之後每輪錯 2 次，共 **5 次**。
- **2-bit**（要連錯兩次才改變預測）：離開時猜錯一次，但只從「強烈跳」退到「有點想跳」，下次進迴圈還是猜跳。每輪只錯 1 次，共 **3 次**。

!!! read "還不懂？看別人怎麼講"
    - **影片**：[清大黃婷婷・計算機結構](https://ocw.nthu.edu.tw/courses/13) 第 6 週 pipelining 單元（對應 COD 第 4 章，control hazard 和分支預測在同一章）。
    - **英文**：[ETH Digital Design & Computer Architecture 2025](https://safari.ethz.ch/ddca/spring2025/doku.php?id=start) 的 superscalar 與 branch prediction 講次。114 Q3（dual-path、confidence estimator）就是這門課的題型。

#### 換你試試

**T-1.** 30% 是 branch、準確率 80%、penalty 3，CPI？

??? quiz "看答案"
    每條指令平均多出：branch 比例 0.3 × 猜錯率 $(1-0.8)=0.2$ × 每次 3 cycle $=0.18$。

    $\text{CPI}=1+0.18=$ **1.18**。

**T-2.** branch 在第 4 級結束時決定，penalty 是多少？

??? quiz "看答案"
    3（前 3 級抓進來的指令要丟掉）。

**T-3.** 結果依序是 T、T、T、N，重複 3 輪。1-bit 預測器一開始預測 T，總共猜錯幾次？

??? quiz "看答案"
    1-bit 預測器每次都猜「跟上一次一樣」：

    | 輪 | 實際 | T | T | T | N |
    |---|---|---|---|---|---|
    | 1 | 預測 | T ✓ | T ✓ | T ✓ | T ✗ |
    | 2 | 預測 | N ✗ | T ✓ | T ✓ | T ✗ |
    | 3 | 預測 | N ✗ | T ✓ | T ✓ | T ✗ |

    $1+2+2=$ **5 次**。

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
    額外 CPI ＝ branch 比例 × 猜錯率 × penalty $=0.25\times(1-0.9)\times3=0.075$。

    $\text{CPI}=1+0.075=$ **1.075**。

**5-2.** 2-bit 預測器從 00 開始，實際結果依序 T、T、N、T，預測錯幾次？

??? quiz "看答案"
    狀態 ≥ 10 才預測 T；實際 T 就加 1、實際 N 就減 1：

    | 第幾次 | 狀態 | 預測 | 實際 | 對錯 | 新狀態 |
    |---|---|---|---|---|---|
    | 1 | 00 | N | T | ✗ | 01 |
    | 2 | 01 | N | T | ✗ | 10 |
    | 3 | 10 | T | N | ✗ | 01 |
    | 4 | 01 | N | T | ✗ | 10 |

    **4 次全錯**。2-bit 在一開始（還在「學」）和結果剛好交替時表現不好；它擅長的是迴圈那種「一直跳、偶爾不跳」。

## 單元 6：多執行緒 {#u6}

!!! key "一句話重點"
    多執行緒用「別的 thread 的指令」填滿某個 thread 等待的空檔。要算的是：**需要幾個 thread，才能每個 cycle 都有指令可發**。

### 6.0 觀念課：等水滾的時候先切別的菜 {#u6-0}

#### 問題：load 要等很久

一條 load 要 50 個 cycle 才拿到資料，下一條指令剛好要用它，CPU 只好乾等 49 個 cycle。

**比喻**：廚師在等水滾的時候，不會站著發呆，會先去處理別的訂單。多執行緒就是讓 CPU 準備好幾個 thread（幾張訂單），一個在等的時候就做另一個。

#### 一個小例子：LD 要 4 個 cycle

每個 thread 都在跑這個迴圈：

```text
LD   r, ...     # 4 個 cycle 後 r 才能用
ADD  s, r, ...  # 馬上要用 r
BNE  ...
```

**方法一：固定輪流（fine-grained，round-robin）**。每個 cycle 換下一個 thread。$N$ 個 thread 時，同一個 thread 的相鄰兩條指令相隔 $N$ 個 cycle。

ADD 和 LD 相鄰（距離 1 條指令），相隔 $N$ 個 cycle，必須 $\ge4$，所以 **$N=4$**。

| cycle | 0 | 1 | 2 | 3 | 4 | 5 | … |
|---|---|---|---|---|---|---|---|
| 執行 | T1 LD | T2 LD | T3 LD | T4 LD | T1 ADD（r 剛好好了） | T2 ADD | … |

**方法二：卡住才換（switch-on-stall）**。一個 thread 一直跑，跑到下一條指令要等的時候才換人。

單一個 thread 的一輪：LD（第 0 cycle）、ADD 要等到第 4 cycle、BNE（5）、下一輪 LD（6）。**一輪 6 個 cycle，只發了 3 條指令**，空了 3 個 cycle。要填滿就需要 $\lceil6/3\rceil=$ **2 個 thread**：一個 thread 在等的 3 個 cycle，剛好讓另一個 thread 跑它的 3 條指令。

| 方法 | 怎麼算 |
|---|---|
| 固定輪流 | 相依兩條指令的距離 $d$（條）× $N$ ≥ 延遲 → $N=\lceil\text{延遲}/d\rceil$，取所有相依中最大的 |
| 卡住才換 | 算一個 thread 一輪的週期長度 $P$ 和發出的指令數 $I$ → $N=\lceil P/I\rceil$ |

switch-on-stall 需要的 thread 比較少，因為不會讓「其實可以繼續跑」的 thread 被迫讓位。

!!! read "還不懂？看別人怎麼講"
    - **英文講義**：Onur Mutlu〈[Fine-Grained Multithreading](https://safari.ethz.ch/architecture/fall2020/lib/exe/fetch.php?media=onur-comparch-fall2020-lecture28-fgmt-afterlecture.pdf)〉（ETH 計算機結構第 28 講）。112、114 年的多執行緒題就是這門課的風格。
    - **練習**：[MIT 6.823 Problem Set 10](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10.pdf)（[解答](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10_sol.pdf)）有跟 112 Q3、114 Q5 一樣的 fixed／data-dependent switching 題目。

#### 換你試試

同樣的迴圈，LD 改成 6 個 cycle。

**T-1.** 固定輪流需要幾個 thread？

??? quiz "看答案"
    ADD 距 LD 1 條：$N\ge6$，6 個。

**T-2.** 卡住才換需要幾個 thread？

??? quiz "看答案"
    一輪：LD（0）、ADD（6）、BNE（7）、下一輪 LD（8）→ 週期 8、3 條指令，$\lceil8/3\rceil=3$ 個。

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
    Fixed switching：$N$ 個 thread 輪流，同一個 thread 相鄰的兩條指令相隔 $N$ 個 cycle。ADD 緊接在 LD 後面（距離 1 條），要等 LD 的 20 cycle：$1\times N\ge20$ → **20 個 thread**。

    （BNE 不依賴 LD，不會讓需求變大。）

## 單元 7：DRAM 與資料重用 {#u7}

!!! key "一句話重點"
    DRAM 的電容會漏電，每一列都要在 retention time 內 refresh 一次。refresh 會佔用 command bus 和 bank，這就是它的效能成本。

### 7.0 觀念課：會漏電的記憶體 {#u7-0}

#### DRAM 為什麼要 refresh

DRAM 的每個位元是一顆很小的電容，有電是 1、沒電是 0。電容會**慢慢漏電**，大約 64 ms 後就分不出 0 和 1。所以記憶體控制器必須在 64 ms 內，把每一列（row）讀出來再寫回去一次，這叫 **refresh**。

refresh 有兩個成本：

- refresh 的命令要佔用**命令匯流排**（command bus）一段時間，這段時間不能送別的命令。
- 正在 refresh 的那個 **bank** 不能被讀寫。

#### 使用率怎麼算

$$\text{使用率}=\frac{\text{這段時間內被 refresh 佔用的總時間}}{\text{這段時間}}$$

**小例子**：1 個 bank、1000 列，每次 refresh 佔用 bus 10 ns，每 64 ms 要全部 refresh 一次。

64 ms 內被佔用 $1000\times10\text{ ns}=10\ \mu\text{s}$，使用率 $=\frac{10\ \mu\text{s}}{64\text{ ms}}\approx0.016\%$。

數字很小，但記憶體越大，列數越多（考題常是 $2^{19}$ 列以上），使用率就跟著變大到好幾 %，而且 bank 被佔用時讀寫都要等。

**考試技巧**：數字留成 2 的次方和 10 的次方，例如 $64\text{ ms}=2^6\times10^6$ ns，就能約分不用計算機。

#### 資料重用：同一個東西多久會再用到

SRAM／cache 很小，只能留住「很快又會用到」的資料。

```text
for i in 0..2:
  for j in 0..2:
    use A[i] * B[j]
```

存取順序：A0B0 A0B1 A0B2 A1B0 A1B1 A1B2 …

- A[i] 在內層迴圈一直用同一個 → 每次都馬上重用，**RI ＝ 1**，放一個暫存器就夠
- B[j] 每 3 次才輪回同一個 → **RI ＝ 3**，要留住全部 3 個 B 才有重用

**迴圈順序決定誰的 RI 小**。考題要你選迴圈順序、分配 SRAM，原則是：RI 小於 SRAM 容量的資料才留得住，留得住的資料就不用一直回 DRAM 讀。

!!! read "還不懂？看別人怎麼講"
    - **英文**：〈[Retrospective: RAIDR](https://arxiv.org/abs/2306.16024)〉（Mutlu 團隊）：114 Q1.2「70% 的列可以 256 ms 才 refresh」就是 RAIDR 的想法：把列依保存時間分組，各組用不同的 refresh 頻率。
    - **練習**：[ETH 計算機結構考古題（附詳解）](https://safari.ethz.ch/architecture/fall2022/doku.php?id=exams)，可以找 DRAM refresh 相關的題目練習。

#### 換你試試

**T-1.** 4 個 bank × 1024 列，每次 refresh 佔 bus 5 ns，64 ms 一輪，使用率？

??? quiz "看答案"
    $\frac{4096\times5\text{ ns}}{64\text{ ms}}=\frac{20480}{64\times10^6}=0.032\%$。

**T-2.** 上面的迴圈把 i、j 交換（j 在外、i 在內），A 和 B 的 RI 各是多少？

??? quiz "看答案"
    B[j] 在內層固定 → RI 1；A[i] 每 3 次輪回 → RI 3。

### 7.1 Refresh 使用率 {#u7-1}

$$\text{使用率}=\frac{\text{期間內 refresh 次數}\times\text{每次佔用時間}}{\text{期間長度}}$$

!!! example "114 Q1（18%）：8 banks × $2^{16}$ 列，每次 refresh 佔 command bus 5 ns"
    1.1 64 ms 內要 refresh $8\times2^{16}=2^{19}$ 次：
    $$\frac{2^{19}\times5\text{ ns}}{64\text{ ms}}=\frac{2^{19}\times5}{2^6\times10^6}=\frac{2^{13}\times5}{10^6}=4.096\%$$

    1.2 70% 的列只要 256 ms 一次：在同樣的時間裡，這些列的 refresh 次數只剩 $\frac{64}{256}=\frac14$；另外 30% 不變。refresh 總次數變成原本的 $0.3\times1+0.7\times\frac14=0.475$ 倍。

    新的使用率 $=4.096\%\times0.475\approx1.95\%$，**減少 $1-0.475=52.5\%$**。

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
    32 ms 內每一列都要 refresh 一次：$4\times2^{14}=2^{16}=65536$ 次，每次佔 4 ns → 共 $262144$ ns。

    $$\frac{262144\text{ ns}}{32\text{ ms}}=\frac{262144}{32\times10^6}=0.008192=\mathbf{0.8192\%}$$

    不用計算機的算法：$\frac{2^{16}\times4}{2^5\times10^6}=\frac{2^{13}}{10^6}=\frac{8192}{10^6}$。

## 單元 8：平行與微架構 {#u8}

### 8.0 觀念課：同時做好幾件事的三種方式 {#u8-0}

#### 平行化的上限

90% 可以平行的程式，用 $N$ 個處理器：

| $N$ | 1 | 2 | 4 | 8 | 16 | 無限多 |
|---|---|---|---|---|---|---|
| speedup | 1 | 1.82 | 3.08 | 4.71 | 6.4 | 10 |

處理器加倍，speedup 卻越加越少，因為那 10% 不能平行的部分變成主要的時間。再加上處理器之間要溝通，實際上更低。

#### 三種平行

| 種類 | 做法 | 比喻 |
|---|---|---|
| **VLIW** | 一條超長指令裡有好幾個運算槽，**編譯器**事先排好誰跟誰一起做 | 廚師長前一天就排好每個廚師每分鐘做什麼 |
| **superscalar** | 一般指令，**硬體**在執行時判斷哪幾條可以一起做 | 現場經理看狀況即時分派工作 |
| **array processor（SIMD）** | 一個指令，所有運算單元**做同一個動作**在不同資料上 | 教練喊一個口令，所有隊員做同一個動作 |

從比喻就能回答 114 Q6：VLIW 比 superscalar 簡單（硬體不用排程）、superscalar 可能更快（現場能應變 cache miss）、VLIW 比 array 彈性（每個槽可以做不同事）、array 最簡單（只要一份指令和控制）。

#### 記憶體一致性：把指令洗成一疊牌

兩個處理器同時跑（x、y 一開始都是 0）：

| P1 | P2 |
|---|---|
| x = 1 | y = 1 |
| r1 = y | r2 = x |

**Sequential consistency（SC）** 的意思是：最後的結果，必須等於把兩邊的指令**洗成一疊**（各自的順序不能變）後依序執行的結果。

把所有洗法列出來，(r1, r2) 只可能是 (0,1)、(1,0)、(1,1)。**(0,0) 不可能**：r1＝0 代表 P1 讀 y 時 P2 還沒寫 y；r2＝0 代表 P2 讀 x 時 P1 還沒寫 x。但兩邊都是「先寫再讀」，一定有一邊的寫入比另一邊的讀取早，矛盾。

112 Q5 的三個處理器版本，用的就是同一個推理：把「讀到 0」換成「某個讀取在某個寫入之前」，看會不會繞成一個圈。

#### 頻寬撐不撐得住

運算再快，資料送不進來也沒用。需要的頻寬 ＝ 每秒運算次數 × 每次運算要從記憶體讀幾個 byte。這個值超過記憶體頻寬，運算單元就會空等。

!!! read "還不懂？看別人怎麼講"
    - **英文影片與講義**：[ETH Digital Design & Computer Architecture 2025](https://safari.ethz.ch/ddca/spring2025/doku.php?id=start) 的 VLIW、SIMD（vector／array processor）兩講，114 Q6 的比較題就出自這裡。
    - **英文文章**：Russ Cox〈[Hardware Memory Models](https://research.swtch.com/hwmm)〉用 litmus test（就是這節 P1、P2 那種小程式）解釋 sequential consistency，例子寫得非常清楚。

#### 換你試試

**T-1.** 95% 可平行，處理器無限多，speedup 上限？

??? quiz "看答案"
    處理器無限多時，可平行的 95% 時間趨近 0，只剩不能平行的 5%：speedup 上限 $=\frac{1}{1-f}=\frac{1}{0.05}=$ **20**。

**T-2.** 上面 P1、P2 的例子，寫出一種得到 (r1, r2) ＝ (1, 1) 的洗法。

??? quiz "看答案"
    x=1、y=1、r1=y、r2=x（先做兩個寫入，再做兩個讀取）。

**T-3.** 每秒 1 T 次浮點運算、每次要讀 4 bytes，需要多少頻寬？

??? quiz "看答案"
    $10^{12}\times4=4$ TB/s。

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

### 9.0 觀念課：電腦怎麼表示負數和小數 {#u9-0}

#### 二補數：一個 4 位元的時鐘

4 位元可以表示 16 個 pattern。二補數把它們排成一圈：

| pattern | 0000 | 0001 | … | 0111 | 1000 | 1001 | … | 1111 |
|---|---|---|---|---|---|---|---|---|
| 值 | 0 | 1 | … | 7 | −8 | −7 | … | −1 |

從 0111（7）再加 1 就繞到 1000（−8），像時鐘一樣。所以範圍是 −8 到 7，**負數多一個**，因為 0 佔掉了非負那一半的一個位置。

**為什麼「反相再加 1」就是取負**：$x$ 和 $\sim x$ 每一位都相反，加起來是 1111，也就是 −1。所以 $x+\sim x=-1$，移項得 $-x=\sim x+1$。

例：$-3$：$3=0011$，反相 1100，加 1 得 **1101**。

**溢位**：兩個正數相加得到負數（或兩個負數相加得到正數），結果就超出範圍了。例：$5+4=1001$，讀起來是 −7，溢位。

#### 浮點數：二進位的科學記號

$$(-1)^s\times1.f\times2^{e-127}\quad(\text{單精度：} s\text{ 1 位、}e\text{ 8 位、}f\text{ 23 位})$$

**每一部分的意思**：

- $s$：正負號，0 正 1 負。
- $1.f$：二進位科學記號的有效數字。整理成 $1.xxx\times2^k$ 時，小數點前一定是 1，所以**那個 1 不存**（省一位元），只存小數點後的 $f$。
- $e-127$：指數要能是負的，但 $e$ 用無號數存，所以存「實際指數 ＋ 127」（bias）。$e$ 從 1 到 254 對應指數 −126 到 127；全 0 和全 1 留給 0、非正規數、無限大和 NaN。

例：$5.0=101.0_2=1.01\times2^2$。

- $s=0$
- $e=2+127=129=1000\,0001$
- $f=0100\cdots0$（小數點後的 01，後面補 0）

**為什麼浮點加法不滿足結合律**：$f$ 只有固定幾位，結果要捨入。用「十進位只保留 4 位有效數字」來想：

- $(1000+0.4)+0.4$：$1000.4$ 捨入成 $1000$，再加 $0.4$ 又捨入成 $1000$
- $1000+(0.4+0.4)=1000+0.8=1000.8$，捨入成 $1001$

小的數單獨加到大數上會被「吃掉」，先把小的加在一起，就有機會留下來。所以**由小加到大比較準**。

#### RISC 和 PC-relative：用比喻記

- **RISC**：每條指令都簡單、一樣長，像標準化的零件，流水線每一站的工作量平均，容易 pipeline。
- **PC-relative**：「往後跳 3 條」而不是「跳到 1000 號」。整個程式搬到別的位址，「往後 3 條」還是對的；而且 3 這個數字很小，用很少位元就能寫進指令裡。

!!! read "還不懂？看別人怎麼講"
    - **中文筆記（資工所考生整理）**：[指令：計算機的語言](https://saberliou.github.io/PrepareCSEMaster/ComputerOrganization/Chapter01.html)：ISA、MIPS 暫存器與記憶體、程式的轉譯（組譯、連結、載入）。
    - **中文筆記**：〈[浮點數運算和定點數操作](https://hackmd.io/Z-6yRXzrSp6z6TtH8QH-rw)〉的「浮點數表示法」一節，再往後是 NaN、無限大這些特殊值。
    - **英文**：〈[IEEE 754 conversions](https://teaching.idallen.com/cst8214/08w/notes/ieee754_conversions.txt)〉一步一步手算十進位和 IEEE 754 互換，適合練習。

#### 換你試試

**T-1.** 用 4 位元二補數算 $6+3$，結果是什麼？有沒有溢位？

??? quiz "看答案"
    $0110+0011=1001$，讀起來是 −7。兩個正數加出負數，溢位。

**T-2.** $-2.5$ 的單精度浮點表示（寫出 $s$、$e$、$f$）。

??? quiz "看答案"
    $2.5=10.1_2=1.01\times2^1$。$s=1$、$e=128=1000\,0000$、$f=0100\cdots0$。整個是 `1 10000000 01000000000000000000000`（0xC0200000）。

**T-3.** 8 位元二補數中，哪一個 pattern 取負之後還是它自己？

??? quiz "看答案"
    1000 0000（−128）：反相 0111 1111，加 1 又是 1000 0000。

### 9.1 考古題與重點整理 {#u9-1}

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
    每條指令都要抓指令，I-cache 存取 1 次；另外平均 0.3 次資料存取走 D-cache：

    - I-cache 平均多出：$1\times0.02\times50=1$ cycle
    - D-cache 平均多出：$0.3\times0.05\times50=0.75$ cycle

    $\text{CPI}=1.5+1+0.75=$ **3.25**，記憶體停頓讓 CPI 變成兩倍多。

**M-2.** 48-bit 虛擬位址、32-bit 實體位址、4 KB page，page table 有幾個 entry？（111 年 OS 也考過這題）

??? quiz "看答案"
    page table 的 entry 數只看**虛擬**位址：offset $=\log_2 4\text{K}=12$ 位元，VPN $=48-12=36$ 位元 → **$2^{36}$ 個 entry**。

    實體位址 32 位元只決定每個 entry 裡 PPN 的長度（$32-12=20$ 位元）。

**M-3.** 6 級 pipeline，branch 在第 4 級結束時決定，branch 佔 20%、預測準確率 85%，CPI？

??? quiz "看答案"
    第 4 級結束時決定 → 前 3 級抓進來的指令可能要丟掉，penalty $=4-1=3$。

    $\text{CPI}=1+0.2\times(1-0.85)\times3=1+0.09=$ **1.09**。

## 資源 {#res}

- **Patterson & Hennessy《Computer Organization and Design》（RISC-V 版）**：第 1 章（效能）、第 4 章（pipeline）、第 5 章（記憶體階層）的習題，中山 113 年幾乎全出自這裡。
- **[Onur Mutlu 計算機結構考古題（附詳解）](https://safari.ethz.ch/architecture/fall2022/doku.php?id=exams)**、**[Digital Design & Computer Architecture 考古題](https://safari.ethz.ch/digitaltechnik/spring2020/doku.php?id=exams)**：112、114 年的 DRAM refresh、多執行緒、分支題都是這個風格。
- **[MIT 6.823 Problem Set 10：多執行緒](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10.pdf)**（[詳解](https://csg.csail.mit.edu/6.823S21/StudyMaterials/quiz4/pset10_sol.pdf)）：和 112 Q3、114 Q5 同一個題型。
- **[清大 OCW 黃婷婷：計算機結構](https://ocw.nthu.edu.tw/courses/13)**：中文講解，觀念不懂時看。
