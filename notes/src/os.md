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

**為什麼「等待 ＝ 完成 − 到達 − 執行時間」**：從到達到完成的這段時間（turnaround）裡，行程不是在跑就是在 ready queue 等（這裡不考慮 I/O），所以扣掉跑的時間，剩下的就是等的時間。

動畫可以切換演算法、改行程（每個寫「名稱 到達時間 burst」，有 priority 就寫在最後）：

<div class="viz" data-viz="sched" data-procs="P1 0 5, P2 0 3" data-algo="rr" data-q="2"></div>

#### thread 和 process

同一個 process 裡的 threads **共用**程式碼、全域資料、開啟的檔案，但各自有自己的 **program counter、暫存器、stack**。像同一個廚房裡的幾個廚師，共用冰箱和爐子，但各自做到不同步驟。

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

    都在時間 0 到達，所以等待時間就是開始時間。平均等待 $=\frac{0+1+2+4+9}{5}=\frac{16}{5}=3.2$。

    **Non-preemptive priority**（數字小的先）：P2(1)、P5(2)、P1(3)、P3(3)、P4(4)。P1、P3 同為 3，照編號 P1 先。

    | | P2 | P5 | P1 | P3 | P4 |
    |---|---|---|---|---|---|
    | 時間 | 0–1 | 1–6 | 6–16 | 16–18 | 18–19 |

    等待（＝開始時間）$0+1+6+16+18=41$，平均 $\frac{41}{5}=8.2$。

    **RR（q＝1，佇列初始順序 P1–P5）**：完成時間 P1＝19、P2＝2、P3＝7、P4＝4、P5＝14。等待 ＝ 完成 $-$ burst：$9,1,5,3,9$，平均 $\frac{27}{5}=5.4$。

    RR 的 Gantt chart 最容易算錯，畫的時候把每一輪寫成一列：
    `P1 P2 P3 P4 P5 | P1 P3 P5 | P1 P5 | P1 P5 | P1 P5 | P1 P1 P1 P1 P1`

    加上時間（每格 1）：

    | 時間 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14–19 |
    |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
    | 執行 | P1 | **P2** | P3 | **P4** | P5 | P1 | **P3** | P5 | P1 | P5 | P1 | P5 | P1 | **P5** | P1 ×5 |

    粗體是該行程最後一次跑，下一格的時間就是它的完成時間：P2＝2、P4＝4、P3＝7、P5＝14、P1＝19。

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

- **檔案描述子（file descriptor）**：0 是標準輸入（鍵盤）、1 是標準輸出（螢幕）、2 是標準錯誤。
- **`pipe(fd)`**：建一條管子，`fd[0]` 是讀端、`fd[1]` 是寫端。記法：0 對應 stdin（讀）、1 對應 stdout（寫）。
- **`close(1); dup(fd[1]);`**：dup 會用「目前最小的空號碼」複製一份。剛關掉 1，所以新的 1 就是 pipe 的寫端。之後寫到標準輸出的東西都流進 pipe，不會出現在螢幕上。（`dup2(fd[1], 1)` 是一次做完的寫法。）
- **`execl("/bin/echo", ...)`**：把目前這個行程**換成**另一個程式。execl 成功後，原本程式下面的程式碼**不會再執行**，但已經開好的檔案描述子會留著，所以 echo 的輸出照樣流進 pipe。

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

#### 觀念小考

選擇題按下選項就會對答案；問答題先寫在手寫板或紙上，再打開參考答案。

<div class="mcq" data-ans="1" markdown="1">

**C-1.** 下面的程式，父行程印出什麼？

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

<div class="mcq" data-ans="2" markdown="1">

**C-2.** `runner` 會把傳進來的整數加 3。下面印出什麼？

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

<div class="mcq" data-ans="3" markdown="1">

**C-3.** `fork(); fork(); fork();` 連續三行執行完，總共有幾個行程（含原本的）？

1. 3
2. 6
3. 8
4. 4

??? quiz "看解析"
    **C. 8**。每一個 fork，**當時存在的每個行程**都會再複製一份，行程數乘以 2：1 → 2 → 4 → 8，也就是 $2^3$。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-4.** 執行 `close(1); dup(fd[1]);` 之後（fd 是 pipe），`printf` 印的東西會去哪裡？

1. 還是螢幕
2. pipe 的寫端，從讀端讀得到
3. pipe 的讀端
4. 消失，因為 1 被關掉了

??? quiz "看解析"
    **B**。dup 用目前最小的空號碼，剛關掉的 1 就是最小的，所以新的 1 指向 pipe 的寫端。printf 寫到 1（標準輸出），資料就進了 pipe，另一個行程從 `fd[0]` 讀得到。

</div>

<div class="mcq" data-ans="2" markdown="1">

**C-5.** 子行程呼叫 `execl("/bin/echo", ...)` 成功之後，execl 下一行的程式碼會怎樣？

1. 等 echo 結束後執行
2. 不會執行，因為這個行程已經整個換成 echo
3. 由父行程執行
4. 只有 echo 失敗時才不執行

??? quiz "看解析"
    **B**。exec 把行程的程式碼換掉，原本的程式碼已經不在了，不會「回來」。反過來說，**只有 exec 失敗時**，下一行才會執行，所以常見寫法是在 exec 後面接錯誤處理。

</div>

**W-1.** 用自己的話說明：為什麼 fork 出來的子行程改變數，父行程看不到；thread 改變數，main 卻看得到？

??? quiz "看參考答案"
    fork 會**複製**整個行程的記憶體，父子各有一份變數，改的是自己那份。thread 是同一個行程裡的另一條執行路線，**共用**同一份記憶體（全域變數、heap、傳進去的指標指到的變數），所以 thread 改了，main 看得到。

    **自我檢查**：你有沒有寫出「複製」和「共用」這兩個關鍵字？

**W-2.** 106 Q1 裡，為什麼 B 印 101、C 也印 101？

??? quiz "看參考答案"
    - **B（P1）**：P1 沒有開 thread，value 一直是 101。`value--` 是先印再減，所以印 101。
    - **C（P2）**：P2 開的 thread 把 P2 的 value 減成 100。`++value` 先加再印，所以印 101。

    兩個都是 101，但原因不同：一個是「沒被減、先印」，一個是「被減了、又加回來」。

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

!!! example "105 Q1(3)（3%）、107 Q1(3)（3%）：critical-section 問題的解法要滿足哪三個條件？"
    mutual exclusion、progress、bounded waiting，意思見 [2.0](#u2-0)。

!!! example "104 Q8(1)（6%）：UNIX 裡 thread 存取共享資料的三種同步機制"
    POSIX threads（Pthreads）提供：

    1. **mutex lock**：`pthread_mutex_lock()`、`pthread_mutex_unlock()`，一次只有一個 thread 能進 critical section。
    2. **semaphore**：`sem_wait()`、`sem_post()`，計數器，可以管理 n 份資源或控制先後順序。
    3. **condition variable**：`pthread_cond_wait()`、`pthread_cond_signal()`，搭配 mutex 使用，讓 thread 等某個條件成立（例如 buffer 不空）。

    （也可以提 read-write lock：可以很多人同時讀，但寫的時候只能一個人。）

#### 交易（transaction）與 two-phase locking

**atomic transaction**：一連串的讀寫要嘛**全部完成**（commit），要嘛**全部取消**（abort、rollback），不會只做一半。例：轉帳時「A 扣錢」和「B 加錢」一定要一起成功。

好幾個交易同時跑時，結果要跟「某種一個接一個做」的結果一樣（serializable）。**two-phase locking（2PL）**：

1. **growing phase**：只能拿 lock，不能放。
2. **shrinking phase**：一旦放了第一把 lock，之後只能放、不能再拿。

遵守 2PL 的排程一定是 **conflict serializable**。缺點：還是可能死結。另一種做法是 [6.1](#u6-1) 的 timestamp-ordering（113 Q7），依 timestamp 決定順序，不用 lock、不會死結，但可能常常 rollback。

!!! example "104 Q8(3)（5%）：two-phase locking 怎麼保證非序列排程的正確性？"
    每個交易分兩個階段：先只拿 lock（growing），開始放 lock 之後就不能再拿（shrinking）。所有交易都這樣做，衝突的操作順序就會依照每個交易「拿到最後一把 lock」的時間（lock point）排好，所以結果等於依 lock point 順序一個一個執行，是 conflict serializable。

#### 觀念小考

<div class="mcq" data-ans="2" markdown="1">

**C-1.** 下面哪一個情況是 priority inversion？

1. 高優先權的 process 一直搶走低優先權的 CPU
2. 高優先權的 process 在等低優先權持有的 lock，低優先權的又被中優先權的搶走
3. 兩個 process 互相等對方的資源
4. 優先權最低的 process 一直排不到 CPU

??? quiz "看解析"
    **B**。A 是正常的優先權排程；C 是死結；D 是 starvation（可以用 aging 解決）。

</div>

<div class="mcq" data-ans="3" markdown="1">

**C-2.** priority inheritance 怎麼解決 priority inversion？

1. 把高優先權 process 的優先權降低
2. 不讓中優先權的 process 執行
3. 持有 lock 的低優先權 process 暫時繼承等待者的高優先權
4. 讓 lock 可以被搶走

??? quiz "看解析"
    **C**。L 繼承 H 的優先權後，M 就搶不走 L；L 很快用完 lock 放開，H 馬上拿到。放開後 L 恢復原本的優先權。

</div>

<div class="mcq" data-ans="1" markdown="1">

**C-3.** 遵守 two-phase locking 的交易，下面哪一個做法是**不允許**的？

1. 放開 lock A 之後，再拿 lock B
2. 先拿 lock A、再拿 lock B，最後一起放
3. 拿 A、拿 B、放 A、放 B
4. 只拿一把 lock

??? quiz "看解析"
    **A**。一旦開始放 lock（進入 shrinking phase），就不能再拿新的。

</div>

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

$$\text{EAT}=(1-p)\times\text{記憶體存取時間}+p\times\text{page fault 處理時間}$$

記憶體 100 ns、page fault 10 ms（$10^7$ ns），$p=0.001$：
$$0.999\times100+0.001\times10^7\approx10100\text{ ns}$$

每 1000 次才 fault 一次，平均存取時間就變成原本的 **100 倍**。這就是考題要你算「page fault rate 要低於多少」的原因。

**公式就是加權平均**：$p$ 是 page fault 的機率。沒 fault（機率 $1-p$）時只花一次記憶體存取的時間；fault（機率 $p$）時要花處理 page fault 的時間（讀磁碟為主）。兩種情況的時間乘上各自的機率再相加。

#### thrashing

行程太多、每個人分到的 frame 太少，每個行程都在不斷 page fault、等磁碟，CPU 使用率反而掉下來。作業系統看到 CPU 閒著，又加更多行程進來，情況更糟。解法是用 working set 估計每個行程需要多少 frame，不夠時**減少**同時執行的行程數。

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
    每次都要查 TLB（50 ns），miss 時才多花 500 ns 查 page table：

    $$\text{平均開銷}=50+(1-h)\times500\le100\ \Rightarrow\ (1-h)\times500\le50\ \Rightarrow\ 1-h\le0.1$$

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

#### 惡意程式的名詞

| 名詞 | 特徵 |
|---|---|
| virus | 附在別的程式上，靠程式執行來散播 |
| worm | 自己透過網路複製散播，不用附在別的程式上 |
| trojan horse | 假裝成有用的程式，暗中做壞事 |
| logic bomb | 平常不動，特定條件（日期、事件）成立才發作 |
| stealth virus | 修改系統中可能偵測到它的部分，躲避防毒 |

這一單元的分數幾乎都在**名詞填空**，看懂意思後，把英文名詞做成閃卡背起來。

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
