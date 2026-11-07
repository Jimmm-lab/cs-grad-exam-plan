/* 中山資工碩 116 學年度備考計畫資料（由 tools/gen_nsysu_cse_116.py 產生）。新增其他考試：複製這個檔案改內容，並在 index.html 加一行 <script src="data/xxx.js"></script> */
window.EXAMS = window.EXAMS || [];
window.EXAMS.push({
 "id": "nsysu-cse-116",
 "label": "中山資工碩・甲組（116 學年度）",
 "school": "國立中山大學",
 "dept": "資訊工程學系碩士班 甲組（資訊組）",
 "year": 116,
 "start": "2026-11-06",
 "examDate": "2027-02-03",
 "defaultRest": [
  3,
  0
 ],
 "subjects": [
  {
   "key": "dm",
   "name": "離散數學",
   "short": "離散",
   "weak": true
  },
  {
   "key": "ca",
   "name": "計算機結構",
   "short": "計結",
   "weak": true
  },
  {
   "key": "osds",
   "name": "作業系統與資料結構",
   "short": "OS／資結",
   "weak": false
  }
 ],
 "weights": "三科成績直接相加、各科等權。同分時依序比較「作業系統與資料結構」、「離散數學」。",
 "phases": [
  {
   "id": "diagnose",
   "name": "診斷",
   "desc": "用一年考古題摸底，讀學習方法"
  },
  {
   "id": "foundation",
   "name": "打底",
   "desc": "照教材單元讀：上午離散、下午計結、晚上 OS／資結；每 5 天一次週考"
  },
  {
   "id": "papers",
   "name": "考古題",
   "desc": "中山 100–107 逐年做，111–114 整份限時重做"
  },
  {
   "id": "sprint",
   "name": "衝刺",
   "desc": "109、108、115 全真模考，二刷錯題，背公式"
  },
  {
   "id": "final",
   "name": "考前",
   "desc": "只複習不做新題，調整作息"
  }
 ],
 "milestones": [
  {
   "date": "2026-11-11",
   "label": "116 碩士班考試入學簡章預定公告：確認考科與考試時程"
  },
  {
   "date": "2026-12-01",
   "label": "報名開始（預定 12/1–12/16），建議前幾天就報完"
  },
  {
   "date": "2026-12-16",
   "label": "報名截止（預定）"
  },
  {
   "date": "2027-01-20",
   "label": "約這段時間公告試場與准考證下載（以簡章為準）"
  },
  {
   "date": "2027-02-03",
   "label": "筆試（預定）"
  },
  {
   "date": "2027-03-05",
   "label": "放榜（預定，以簡章為準）"
  }
 ],
 "days": [
  {
   "phase": "diagnose",
   "title": "診斷考：用一年考古題摸底",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 110 年（計時）",
     "read": "不看書，照正式考試時間作答",
     "practice": "寫不出來的題目也要寫下想法，標記 ?"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 110 年（計時）",
     "read": "不看書，照正式考試時間作答",
     "practice": "標記完全不會 / 會但算錯 / 會"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 110 年（計時）",
     "read": "不看書，照正式考試時間作答",
     "practice": "標記完全不會 / 會但算錯 / 會"
    }
   ],
   "note": "分數不重要，目的是知道題型、難度和自己差多少。11/11 左右簡章公告，記得確認考科有沒有改。",
   "tag": "考古題",
   "id": "d01"
  },
  {
   "phase": "diagnose",
   "title": "訂正、讀學習方法、看考題分布",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "訂正 110 年三科＋建立錯題本",
     "read": "每題寫錯誤原因（觀念／計算／沒讀到／看錯題）",
     "practice": "錯題本格式見「學習方法」頁",
     "link": "notes/method.html#errlog"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "讀「學習方法」與四份教材的第 0 節",
     "read": "111–115 年的考題分布已經整理好",
     "practice": "自己翻 100–110 年題目，補進頻率表",
     "link": "notes/method.html"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "準備教材與閃卡",
     "read": "每科一本主教材（見各教材的「資源」）",
     "practice": "OS 名詞閃卡先建好",
     "link": "notes/method.html#resources"
    }
   ],
   "tag": "規劃",
   "id": "d02"
  },
  {
   "phase": "foundation",
   "title": "計數：四個基本模型、球放箱子｜效能：CPU time 與加權 CPI｜C 程式：運算子優先順序與位元運算",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "計數：四個基本模型、球放箱子",
     "read": "教材 1.1–1.2：先判斷「東西有沒有區別、順序重不重要」",
     "practice": "例題 111 Q8、113 Q1、113 Q5、114 Q3 先遮詳解自己做",
     "link": "notes/discrete.html#u1-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "效能：CPU time 與加權 CPI",
     "read": "教材 1.1",
     "practice": "例題 115 Q1.2、Q2.1",
     "link": "notes/arch.html#u1-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：C 程式：運算子優先順序與位元運算",
     "read": "教材 1.1：背優先順序表",
     "practice": "例題 115 Q5a、112 Q1a、113 Q1a",
     "link": "notes/ds.html#u1-1"
    }
   ],
   "id": "d03"
  },
  {
   "phase": "foundation",
   "title": "計數：插空法與不相鄰｜效能：Amdahl 定律｜行程、PCB、IPC",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "計數：插空法與不相鄰",
     "read": "教材 1.3",
     "practice": "例題 115 A1、A6；Grimaldi 第 1 章同類題 5 題",
     "link": "notes/discrete.html#u1-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "效能：Amdahl 定律",
     "read": "教材 1.2：記得「不可能」也是答案",
     "practice": "例題 115 Q2.2、111 P4.2、113 Q1",
     "link": "notes/arch.html#u1-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：行程、PCB、IPC",
     "read": "教材 1.1",
     "practice": "例題 112 Q5a、115 Q2、114 Q6b",
     "link": "notes/os.html#u1-1"
    }
   ],
   "id": "d04"
  },
  {
   "phase": "foundation",
   "title": "計數：多項式係數、字串、回文｜效能：時脈的限制、make the common case fast｜C 程式：指標與遞迴追蹤",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "計數：多項式係數、字串、回文",
     "read": "教材 1.4–1.5",
     "practice": "例題 112 Q1、Q4、113 Q2、111 Q4、114 Q1；做單元 1 小考",
     "link": "notes/discrete.html#u1-4"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "效能：時脈的限制、make the common case fast",
     "read": "教材 1.3",
     "practice": "例題 115 Q1.1、Q1.3；做單元 1 小考",
     "link": "notes/arch.html#u1-3"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：C 程式：指標與遞迴追蹤",
     "read": "教材 1.2–1.3：畫表格和呼叫樹",
     "practice": "例題 111 Q1、112 Q1b、113 Q1b",
     "link": "notes/ds.html#u1-2"
    }
   ],
   "id": "d05"
  },
  {
   "phase": "foundation",
   "title": "排容：公式與倍數問題｜Cache：位址切割｜CPU 排程計算",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "排容：公式與倍數問題",
     "read": "教材 2.1–2.2",
     "practice": "例題 115 A3；Grimaldi 第 8 章倍數題 5 題",
     "link": "notes/discrete.html#u2-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：位址切割",
     "read": "教材 2.1：offset、index、tag 三步驟",
     "practice": "COD 第 5 章位址切割習題 6 題",
     "link": "notes/arch.html#u2-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：CPU 排程計算",
     "read": "教材 1.2：畫 Gantt chart",
     "practice": "例題 113 Q6a；做單元 1 小考",
     "link": "notes/os.html#u1-2"
    }
   ],
   "id": "d06"
  },
  {
   "phase": "foundation",
   "title": "第 1 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d07"
  },
  {
   "phase": "foundation",
   "title": "排容：上限整數解、錯排｜Cache：總位元數｜C 程式：static 與迴圈",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "排容：上限整數解、錯排",
     "read": "教材 2.3–2.4",
     "practice": "例題 113 Q8、115 A2、112 Q6(b)；做單元 2 小考",
     "link": "notes/discrete.html#u2-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：總位元數",
     "read": "教材 2.2：別忘了 valid、dirty、LRU",
     "practice": "例題 111 P3、113 Q5.2",
     "link": "notes/arch.html#u2-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：C 程式：static 與迴圈",
     "read": "教材 1.3–1.4",
     "practice": "例題 115 Q5b、114 Q1；做單元 1 小考",
     "link": "notes/ds.html#u1-3"
    }
   ],
   "id": "d08"
  },
  {
   "phase": "foundation",
   "title": "生成函數：OGF 建模與卷積｜Cache：hit／miss 追蹤｜同步",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "生成函數：OGF 建模與卷積",
     "read": "教材 3.1：每個變數寫一個因子",
     "practice": "例題 114 Q7、112 Q5",
     "link": "notes/discrete.html#u3-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：hit／miss 追蹤",
     "read": "教材 2.3",
     "practice": "例題 113 Q5.1（自己畫表）",
     "link": "notes/arch.html#u2-3"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：同步",
     "read": "教材單元 2",
     "practice": "例題 114 Q6a、112 Q5b；做單元 2 小考",
     "link": "notes/os.html#u2"
    }
   ],
   "id": "d09"
  },
  {
   "phase": "foundation",
   "title": "生成函數：EGF 與奇偶限制｜Cache：AMAT 與記憶體停頓｜排序：比較表與逆序數",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "生成函數：EGF 與奇偶限制",
     "read": "教材 3.2：cosh、sinh 的展開要背",
     "practice": "例題 114 Q8、111 Q5、112 Q6(a)",
     "link": "notes/discrete.html#u3-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：AMAT 與記憶體停頓",
     "read": "教材 2.4",
     "practice": "例題 112 Q1.1–1.2、113 Q6、115 Q6",
     "link": "notes/arch.html#u2-4"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：排序：比較表與逆序數",
     "read": "教材 2.1–2.2：背複雜度表",
     "practice": "例題 115 Q9、113 Q3、112 Q2",
     "link": "notes/ds.html#u2-1"
    }
   ],
   "id": "d10"
  },
  {
   "phase": "foundation",
   "title": "生成函數：解遞迴｜Cache：觀念題與逆向工程｜死結",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "生成函數：解遞迴",
     "read": "教材 3.3：部分分式",
     "practice": "例題 113 Q10；做單元 3 小考",
     "link": "notes/discrete.html#u3-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：觀念題與逆向工程",
     "read": "教材 2.5",
     "practice": "例題 111 P1、112 Q6；做單元 2 小考",
     "link": "notes/arch.html#u2-5"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：死結",
     "read": "教材單元 3",
     "practice": "例題 115 Q3a、112 Q8a；做單元 3 小考",
     "link": "notes/os.html#u3"
    }
   ],
   "id": "d11"
  },
  {
   "phase": "foundation",
   "title": "第 2 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d12"
  },
  {
   "phase": "foundation",
   "title": "生成函數：OGF／EGF 混合練習｜虛擬記憶體：位元切割、page table 大小｜heap sort 與 radix sort",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "生成函數：OGF／EGF 混合練習",
     "read": "先判斷要用哪一種，再列式",
     "practice": "Grimaldi 第 9 章習題 8 題（交錯練習）",
     "link": "notes/discrete.html#u3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "虛擬記憶體：位元切割、page table 大小",
     "read": "教材 3.1",
     "practice": "例題 114 Q2、113 Q7.1、111 P2",
     "link": "notes/arch.html#u3-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：heap sort 與 radix sort",
     "read": "教材 2.3–2.4",
     "practice": "例題 111 Q4、114 Q2；做單元 2 小考",
     "link": "notes/ds.html#u2-3"
    }
   ],
   "id": "d13"
  },
  {
   "phase": "foundation",
   "title": "遞迴：最後一步分類法｜TLB 與 page table 模擬｜位址繫結與 TLB",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：最後一步分類法",
     "read": "教材 4.1：112、114 連續兩年考同一模型",
     "practice": "例題 112 Q7、114 Q6、111 Q6",
     "link": "notes/discrete.html#u4-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "TLB 與 page table 模擬",
     "read": "教材 3.2",
     "practice": "例題 113 Q7.2；做單元 3 小考",
     "link": "notes/arch.html#u3-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：位址繫結與 TLB",
     "read": "教材 4.1",
     "practice": "例題 112 Q6a、114 Q7、113 Q5a",
     "link": "notes/os.html#u4-1"
    }
   ],
   "id": "d14"
  },
  {
   "phase": "foundation",
   "title": "遞迴：特徵方程（相異、重根、複數根）｜Pipeline：時間計算｜樹：走訪重建與 BST",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：特徵方程（相異、重根、複數根）",
     "read": "教材 4.2",
     "practice": "例題 113 Q9、111 Q7",
     "link": "notes/discrete.html#u4-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Pipeline：時間計算",
     "read": "教材 4.1",
     "practice": "例題 113 Q3",
     "link": "notes/arch.html#u4-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：樹：走訪重建與 BST",
     "read": "教材 3.1–3.2",
     "practice": "例題 115 Q6、111 Q3",
     "link": "notes/ds.html#u3-1"
    }
   ],
   "id": "d15"
  },
  {
   "phase": "foundation",
   "title": "遞迴：非齊次與換元｜Pipeline：hazard 與 forwarding｜記憶體計算模板",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：非齊次與換元",
     "read": "教材 4.3：特解猜法表",
     "practice": "例題 114 Q9；做單元 4 小考",
     "link": "notes/discrete.html#u4-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Pipeline：hazard 與 forwarding",
     "read": "教材 4.2：load-use 一定要 stall 1",
     "practice": "例題 115 Q5.1、111 P5",
     "link": "notes/arch.html#u4-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：記憶體計算模板",
     "read": "教材 4.2",
     "practice": "例題 111 Q6、Q8、Q9、113 Q6b",
     "link": "notes/os.html#u4-2"
    }
   ],
   "id": "d16"
  },
  {
   "phase": "foundation",
   "title": "第 3 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d17"
  },
  {
   "phase": "foundation",
   "title": "遞迴：混合練習｜Pipeline：forwarding 值不值得｜AVL tree",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：混合練習",
     "read": "建立＋求解一起練",
     "practice": "Grimaldi 第 10 章習題 6 題",
     "link": "notes/discrete.html#u4"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Pipeline：forwarding 值不值得",
     "read": "教材 4.2 最後一題",
     "practice": "例題 114 Q4；做單元 4 小考",
     "link": "notes/arch.html#u4-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：AVL tree",
     "read": "教材 3.3：四種旋轉",
     "practice": "例題 114 Q3；自己插入 10 個數練旋轉",
     "link": "notes/ds.html#u3-3"
    }
   ],
   "id": "d18"
  },
  {
   "phase": "foundation",
   "title": "數論：gcd 與線性組合｜分支：penalty 與額外 CPI｜置換、thrashing、copy-on-write",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "數論：gcd 與線性組合",
     "read": "教材 5.1",
     "practice": "例題 112 Q2、Q8；自己再證 3 題互質",
     "link": "notes/discrete.html#u5-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "分支：penalty 與額外 CPI",
     "read": "教材 5.1",
     "practice": "例題 113 Q4、112 Q1.3–1.4",
     "link": "notes/arch.html#u5-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：置換、thrashing、copy-on-write",
     "read": "教材 4.3",
     "practice": "例題 112 Q6b、115 Q3b；做單元 4 小考",
     "link": "notes/os.html#u4-3"
    }
   ],
   "id": "d19"
  },
  {
   "phase": "foundation",
   "title": "數論：歐幾里得演算法與模反元素｜分支：深 pipeline、dual-path、2-bit｜Optimal BST（DP）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "數論：歐幾里得演算法與模反元素",
     "read": "教材 5.2",
     "practice": "例題 115 A4、113 Q4；手算 3 個模反元素",
     "link": "notes/discrete.html#u5-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "分支：深 pipeline、dual-path、2-bit",
     "read": "教材 5.1–5.2",
     "practice": "例題 115 Q5.2、114 Q3；做單元 5 小考",
     "link": "notes/arch.html#u5"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：Optimal BST（DP）",
     "read": "教材 3.4",
     "practice": "例題 112 Q3；做單元 3 小考",
     "link": "notes/ds.html#u3-4"
    }
   ],
   "id": "d20"
  },
  {
   "phase": "foundation",
   "title": "數論：質數、同餘、Fermat｜多執行緒：fixed 與 data-dependent 切換｜檔案系統",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "數論：質數、同餘、Fermat",
     "read": "教材 5.3",
     "practice": "例題 113 Q3、115 A7；做單元 5 小考",
     "link": "notes/discrete.html#u5-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "多執行緒：fixed 與 data-dependent 切換",
     "read": "教材 6.1",
     "practice": "例題 114 Q5",
     "link": "notes/arch.html#u6-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：檔案系統",
     "read": "教材 5.1",
     "practice": "例題 114 Q5a、112 Q7、111 Q5",
     "link": "notes/os.html#u5-1"
    }
   ],
   "id": "d21"
  },
  {
   "phase": "foundation",
   "title": "第 4 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d22"
  },
  {
   "phase": "foundation",
   "title": "鴿籠與 Erdős–Szekeres｜多執行緒：linked list 題｜雜湊",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "鴿籠與 Erdős–Szekeres",
     "read": "教材 6.1–6.2：先想「鴿子是什麼、籠子是什麼」",
     "practice": "例題 111 Q1、114 Q4、112 Q3",
     "link": "notes/discrete.html#u6-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "多執行緒：linked list 題",
     "read": "教材 6.1",
     "practice": "例題 112 Q3；MIT 6.823 PS10 一題；做單元 6 小考",
     "link": "notes/arch.html#u6"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：雜湊",
     "read": "教材單元 4",
     "practice": "例題 115 Q7；做單元 4 小考",
     "link": "notes/ds.html#u4"
    }
   ],
   "id": "d23"
  },
  {
   "phase": "foundation",
   "title": "Ramsey：R(3,3)=6｜DRAM refresh｜磁碟與 I/O",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "Ramsey：R(3,3)=6",
     "read": "教材 6.3",
     "practice": "例題 115 B3；做單元 6 小考",
     "link": "notes/discrete.html#u6-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "DRAM refresh",
     "read": "教材 7.1",
     "practice": "例題 114 Q1、112 Q2",
     "link": "notes/arch.html#u7-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：磁碟與 I/O",
     "read": "教材 5.2–5.3",
     "practice": "例題 111 Q7、115 Q4、114 Q5b；做單元 5 小考",
     "link": "notes/os.html#u5-2"
    }
   ],
   "id": "d24"
  },
  {
   "phase": "foundation",
   "title": "關係的計數｜資料重用與迴圈順序｜圖：MST",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "關係的計數",
     "read": "教材 7.1：把關係想成矩陣的格子",
     "practice": "例題 113 Q7、111 Q3",
     "link": "notes/discrete.html#u7-1"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "資料重用與迴圈順序",
     "read": "教材 7.2",
     "practice": "例題 112 Q4；做單元 7 小考",
     "link": "notes/arch.html#u7-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：圖：MST",
     "read": "教材單元 5",
     "practice": "例題 115 Q8；做單元 5 小考",
     "link": "notes/ds.html#u5"
    }
   ],
   "id": "d25"
  },
  {
   "phase": "foundation",
   "title": "函數、二元運算、邏輯與證明｜GPU、VLIW、superscalar、array processor｜保護、安全與其他",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "函數、二元運算、邏輯與證明",
     "read": "教材 7.2–7.3",
     "practice": "例題 115 A8、113 Q6、115 B2、114 Q2；做單元 7 小考",
     "link": "notes/discrete.html#u7-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "GPU、VLIW、superscalar、array processor",
     "read": "教材 8.1–8.2",
     "practice": "例題 113 Q2、114 Q6",
     "link": "notes/arch.html#u8-1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：保護、安全與其他",
     "read": "教材單元 6",
     "practice": "例題 112 Q8b–c、Q9、113 Q7",
     "link": "notes/os.html#u6"
    }
   ],
   "id": "d26"
  },
  {
   "phase": "foundation",
   "title": "第 5 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d27"
  },
  {
   "phase": "foundation",
   "title": "有限狀態機｜記憶體一致性（SC）｜Catalan 數",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "有限狀態機",
     "read": "教材單元 8：狀態＝需要記住的資訊",
     "practice": "例題 111 Q2、114 Q5；做單元 8 小考",
     "link": "notes/discrete.html#u8"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "記憶體一致性（SC）",
     "read": "教材 8.3",
     "practice": "例題 112 Q5；做單元 8 小考",
     "link": "notes/arch.html#u8-3"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：Catalan 數",
     "read": "教材 6.1",
     "practice": "例題 114 Q4、111 Q2",
     "link": "notes/ds.html#u6-1"
    }
   ],
   "id": "d28"
  },
  {
   "phase": "foundation",
   "title": "機率與期望值｜ISA 與算術｜名詞填空總表（第一輪）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "機率與期望值",
     "read": "教材單元 9",
     "practice": "例題 115 B1、A10；做單元 9 小考",
     "link": "notes/discrete.html#u9"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "ISA 與算術",
     "read": "教材單元 9",
     "practice": "例題 115 Q3、Q4、111 P1.1；做單元 9 小考",
     "link": "notes/arch.html#u9"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：名詞填空總表（第一輪）",
     "read": "教材單元 7：做成閃卡",
     "practice": "遮住答案自己填 113–115 的 30 格",
     "link": "notes/os.html#u7"
    }
   ],
   "id": "d29"
  },
  {
   "phase": "foundation",
   "title": "離散綜合小考｜Onur Mutlu 考古題｜遞迴式與 DP",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散綜合小考",
     "read": "限時 40 分鐘，題型打散",
     "practice": "教材「綜合小考」6 題",
     "link": "notes/discrete.html#mix"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Onur Mutlu 考古題",
     "read": "教材「資源」的 ETH 考古題頁",
     "practice": "挑一份有詳解的期中考，只做 cache、pipeline、多執行緒題",
     "link": "notes/arch.html#res"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：遞迴式與 DP",
     "read": "教材 6.2",
     "practice": "例題 112 Q4、113 Q4、Q2；做單元 6 小考",
     "link": "notes/ds.html#u6-2"
    }
   ],
   "id": "d30"
  },
  {
   "phase": "foundation",
   "title": "離散總回顧｜計結綜合小考與總回顧｜OS 綜合小考",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散總回顧",
     "read": "回看教材第 0 節的考題分布表",
     "practice": "錯題本最弱的 3 個單元各再做 5 題",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結綜合小考與總回顧",
     "read": "限時",
     "practice": "教材「綜合小考」；錯題本最弱的 3 個單元",
     "link": "notes/arch.html#mix"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：OS 綜合小考",
     "read": "限時",
     "practice": "教材「綜合小考」＋資結各單元小考的錯題",
     "link": "notes/os.html#mix"
    }
   ],
   "id": "d31"
  },
  {
   "phase": "foundation",
   "title": "第 6 輪複習日（週考）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：本輪錯題重做＋小考錯題",
     "read": "只看題目重做，用「1–3–7」節奏",
     "practice": "他校同主題考古題 10 題，限時",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：本輪計算題蓋住答案重算",
     "read": "寫一頁公式卡",
     "practice": "再做一次這 4 天的單元小考",
     "link": "notes/method.html#quiz"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：一頁總整理",
     "read": "把這 4 天的內容寫成一頁重點",
     "practice": "OS 閃卡全部過一遍",
     "link": "notes/method.html#quiz"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。",
   "tag": "週考",
   "id": "d32"
  },
  {
   "phase": "papers",
   "title": "中山 107 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 107 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 107 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 107 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d33"
  },
  {
   "phase": "papers",
   "title": "中山 106 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 106 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 106 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 106 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d34"
  },
  {
   "phase": "papers",
   "title": "中山 105 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 105 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 105 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 105 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d35"
  },
  {
   "phase": "papers",
   "title": "弱點補強日 1",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：錯最多的單元",
     "read": "回教材重讀該單元的例題",
     "practice": "他校同主題考古題 12 題",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：cache／pipeline／分支計算特訓",
     "read": "這三類是計算大題主力",
     "practice": "Mutlu 或 COD 習題 8 題，計時",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：錯題重做",
     "read": "重做本階段 OS 與資結錯題",
     "practice": "手跑一次樹操作與排程",
     "link": "notes/os.html#u7"
    }
   ],
   "tag": "補強",
   "id": "d36"
  },
  {
   "phase": "papers",
   "title": "中山 104 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 104 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 104 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 104 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d37"
  },
  {
   "phase": "papers",
   "title": "中山 103 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 103 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 103 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 103 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d38"
  },
  {
   "phase": "papers",
   "title": "中山 102 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 102 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 102 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 102 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d39"
  },
  {
   "phase": "papers",
   "title": "弱點補強日 2",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：錯最多的單元",
     "read": "回教材重讀該單元的例題",
     "practice": "他校同主題考古題 12 題",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：cache／pipeline／分支計算特訓",
     "read": "這三類是計算大題主力",
     "practice": "Mutlu 或 COD 習題 8 題，計時",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：錯題重做",
     "read": "重做本階段 OS 與資結錯題",
     "practice": "手跑一次樹操作與排程",
     "link": "notes/os.html#u7"
    }
   ],
   "tag": "補強",
   "id": "d40"
  },
  {
   "phase": "papers",
   "title": "中山 101 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 101 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 101 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 101 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d41"
  },
  {
   "phase": "papers",
   "title": "中山 100 年考古題",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 100 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "每題標出對應教材的單元"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 100 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "計算題錯誤要重算到對"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 100 年",
     "read": "計時作答，然後立刻訂正",
     "practice": "OS 名詞不會的加進閃卡"
    }
   ],
   "note": "如果網站上沒有這一年，改做他校同科考古題。",
   "tag": "考古題",
   "id": "d42"
  },
  {
   "phase": "papers",
   "title": "他校考古題日",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "他校離散數學一份（計時）",
     "read": "選題型接近的學校（如中正、中興）",
     "practice": "訂正並記入錯題本"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "他校計組／計結一份（計時）",
     "read": "同上",
     "practice": "訂正並記入錯題本"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "他校 OS＋資結一份（計時）",
     "read": "同上",
     "practice": "訂正並記入錯題本"
    }
   ],
   "optional": true,
   "tag": "考古題",
   "id": "d43"
  },
  {
   "phase": "papers",
   "title": "弱點補強日 3",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：錯最多的單元",
     "read": "回教材重讀該單元的例題",
     "practice": "他校同主題考古題 12 題",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：cache／pipeline／分支計算特訓",
     "read": "這三類是計算大題主力",
     "practice": "Mutlu 或 COD 習題 8 題，計時",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：錯題重做",
     "read": "重做本階段 OS 與資結錯題",
     "practice": "手跑一次樹操作與排程",
     "link": "notes/os.html#u7"
    }
   ],
   "tag": "補強",
   "id": "d44"
  },
  {
   "phase": "papers",
   "title": "重做 111 年整份（限時）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 111 年（整份限時）",
     "read": "這份已經在教材讀過，測的是能不能獨立寫出來",
     "practice": "對照教材詳解，記錄還寫不出來的題目",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 111 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 111 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/os.html#u0"
    }
   ],
   "note": "隔了 5 週以上再做，是在練間隔複習：寫得出來才是真的會。",
   "tag": "重做",
   "id": "d45"
  },
  {
   "phase": "papers",
   "title": "重做 112 年整份（限時）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 112 年（整份限時）",
     "read": "這份已經在教材讀過，測的是能不能獨立寫出來",
     "practice": "對照教材詳解，記錄還寫不出來的題目",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 112 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 112 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/os.html#u0"
    }
   ],
   "note": "隔了 5 週以上再做，是在練間隔複習：寫得出來才是真的會。",
   "tag": "重做",
   "id": "d46"
  },
  {
   "phase": "papers",
   "title": "重做 113 年整份（限時）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 113 年（整份限時）",
     "read": "這份已經在教材讀過，測的是能不能獨立寫出來",
     "practice": "對照教材詳解，記錄還寫不出來的題目",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 113 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 113 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/os.html#u0"
    }
   ],
   "note": "隔了 5 週以上再做，是在練間隔複習：寫得出來才是真的會。",
   "tag": "重做",
   "id": "d47"
  },
  {
   "phase": "papers",
   "title": "重做 114 年整份（限時）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散數學 114 年（整份限時）",
     "read": "這份已經在教材讀過，測的是能不能獨立寫出來",
     "practice": "對照教材詳解，記錄還寫不出來的題目",
     "link": "notes/discrete.html#u0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計算機結構 114 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/arch.html#u0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "作業系統與資料結構 114 年（整份限時）",
     "read": "同上",
     "practice": "同上",
     "link": "notes/os.html#u0"
    }
   ],
   "note": "隔了 5 週以上再做，是在練間隔複習：寫得出來才是真的會。",
   "tag": "重做",
   "id": "d48"
  },
  {
   "phase": "papers",
   "title": "錯題本一刷（上）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散錯題全部重做",
     "read": "只看題目重做",
     "practice": "還是錯的標 ★★"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結錯題全部重做",
     "read": "只看題目重做",
     "practice": "還是錯的標 ★★"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結錯題全部重做",
     "read": "只看題目重做",
     "practice": "還是錯的標 ★★"
    }
   ],
   "tag": "複習",
   "id": "d49"
  },
  {
   "phase": "papers",
   "title": "錯題本一刷（下）＋公式總表",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散公式／定理總表",
     "read": "計數模型表、球放箱子表、生成函數展開表、遞迴通解表",
     "practice": "★★ 題目再做一次",
     "link": "notes/discrete.html#u1-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結公式總表",
     "read": "CPU time、Amdahl、AMAT、位址切割、penalty、多執行緒",
     "practice": "★★ 題目再做一次",
     "link": "notes/arch.html#u1"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結比較表",
     "read": "排程、記憶體計算模板、排序複雜度、樹的旋轉",
     "practice": "★★ 題目再做一次",
     "link": "notes/ds.html#u2-1"
    }
   ],
   "tag": "複習",
   "id": "d50"
  },
  {
   "phase": "sprint",
   "title": "全真模考 #1：中山 109 年",
   "blocks": [
    {
     "subject": "dm",
     "time": "依考試時程",
     "title": "離散數學 109 年",
     "read": "照簡章的考試節次與時間作答，不看書不查資料",
     "practice": "只對答案算分，不訂正"
    },
    {
     "subject": "ca",
     "time": "依考試時程",
     "title": "計算機結構 109 年",
     "read": "同上",
     "practice": "記錄每科分數"
    },
    {
     "subject": "osds",
     "time": "依考試時程",
     "title": "作業系統與資料結構 109 年",
     "read": "同上",
     "practice": "記錄每科分數"
    }
   ],
   "note": "模考日就是考試日的預演，連午餐和休息時間都照考試那天安排。",
   "tag": "模考",
   "id": "d51"
  },
  {
   "phase": "sprint",
   "title": "模考 #1 檢討",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    }
   ],
   "tag": "檢討",
   "id": "d52"
  },
  {
   "phase": "sprint",
   "title": "全真模考 #2：中山 108 年",
   "blocks": [
    {
     "subject": "dm",
     "time": "依考試時程",
     "title": "離散數學 108 年",
     "read": "照簡章的考試節次與時間作答，不看書不查資料",
     "practice": "只對答案算分，不訂正"
    },
    {
     "subject": "ca",
     "time": "依考試時程",
     "title": "計算機結構 108 年",
     "read": "同上",
     "practice": "記錄每科分數"
    },
    {
     "subject": "osds",
     "time": "依考試時程",
     "title": "作業系統與資料結構 108 年",
     "read": "同上",
     "practice": "記錄每科分數"
    }
   ],
   "note": "模考日就是考試日的預演，連午餐和休息時間都照考試那天安排。",
   "tag": "模考",
   "id": "d53"
  },
  {
   "phase": "sprint",
   "title": "模考 #2 檢討",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    }
   ],
   "tag": "檢討",
   "id": "d54"
  },
  {
   "phase": "sprint",
   "title": "他校模考",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "他校離散一份（計時）",
     "read": "選沒做過的一份",
     "practice": "訂正"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Mutlu 期末考一份（計時）",
     "read": "ETH 考古題頁，附詳解",
     "practice": "訂正",
     "link": "notes/arch.html#res"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "他校 OS＋資結一份（計時）",
     "read": "選沒做過的一份",
     "practice": "訂正"
    }
   ],
   "optional": true,
   "tag": "模考",
   "id": "d55"
  },
  {
   "phase": "sprint",
   "title": "高頻題型速刷",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：計數＋生成函數＋遞迴 30 題",
     "read": "每題限時 5 分鐘",
     "practice": "錯的記入錯題本",
     "link": "notes/discrete.html#mix"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：cache＋pipeline＋分支 30 題",
     "read": "每題限時 6 分鐘",
     "practice": "錯的記入錯題本",
     "link": "notes/arch.html#mix"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS 填空 30 格＋資結手動模擬",
     "read": "排程、排序、樹、雜湊各 2 題",
     "practice": "錯的記入錯題本",
     "link": "notes/os.html#u7"
    }
   ],
   "tag": "衝刺",
   "id": "d56"
  },
  {
   "phase": "sprint",
   "title": "全真模考 #3：中山 115 年",
   "blocks": [
    {
     "subject": "dm",
     "time": "依考試時程",
     "title": "離散數學 115 年",
     "read": "照簡章的考試節次與時間作答，不看書不查資料",
     "practice": "只對答案算分，不訂正"
    },
    {
     "subject": "ca",
     "time": "依考試時程",
     "title": "計算機結構 115 年",
     "read": "同上",
     "practice": "記錄每科分數"
    },
    {
     "subject": "osds",
     "time": "依考試時程",
     "title": "作業系統與資料結構 115 年",
     "read": "同上",
     "practice": "記錄每科分數"
    }
   ],
   "note": "115 年是新格式（離散改成簡答＋計算、計結按章節出題），116 年很可能沿用。這份讀教材時看過，現在整份限時重考，練的是格式和速度。",
   "tag": "模考",
   "id": "d57"
  },
  {
   "phase": "sprint",
   "title": "模考 #3 檢討",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結：逐題檢討",
     "read": "每個錯題找出原因，回教材對應單元",
     "practice": "同主題補 5 題"
    }
   ],
   "tag": "檢討",
   "id": "d58"
  },
  {
   "phase": "sprint",
   "title": "錯題本二刷",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散 ★★ 題目",
     "read": "只做標 ★★ 的",
     "practice": "仍然錯的抄到「考前小卡」"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結 ★★ 題目",
     "read": "只做標 ★★ 的",
     "practice": "仍然錯的抄到「考前小卡」"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結 ★★ 題目",
     "read": "只做標 ★★ 的",
     "practice": "仍然錯的抄到「考前小卡」"
    }
   ],
   "tag": "複習",
   "id": "d59"
  },
  {
   "phase": "sprint",
   "title": "公式與定理背誦",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散公式總表默寫",
     "read": "默寫後對照，漏掉的重背",
     "practice": "證明題寫作格式再看一次（數論、鴿籠、歸納）",
     "link": "notes/discrete.html#u5"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結公式總表默寫",
     "read": "默寫後對照，漏掉的重背",
     "practice": "多執行緒、DRAM refresh 各再算一題",
     "link": "notes/arch.html#u6"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS 名詞閃卡＋資結比較表默寫",
     "read": "默寫後對照，漏掉的重背",
     "practice": "樹的旋轉手畫一次",
     "link": "notes/os.html#u7"
    }
   ],
   "tag": "衝刺",
   "id": "d60"
  },
  {
   "phase": "sprint",
   "title": "限時小模考",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散 10 題限時（115 簡答格式）",
     "read": "從各年考古題挑沒做過或錯過的",
     "practice": "檢討"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "計結 10 題限時",
     "read": "同上",
     "practice": "檢討"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS／資結 10 題限時",
     "read": "同上",
     "practice": "檢討"
    }
   ],
   "optional": true,
   "tag": "模考",
   "id": "d61"
  },
  {
   "phase": "sprint",
   "title": "總整理＋準備考試用品",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "考前小卡：離散",
     "read": "整理成 1–2 頁",
     "practice": "考前兩天只看這些"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "考前小卡：計結",
     "read": "整理成 1–2 頁",
     "practice": "確認簡章規定：不可用計算機"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "考前小卡：OS／資結",
     "read": "整理成 1–2 頁",
     "practice": "準備准考證、身分證、文具"
    }
   ],
   "tag": "衝刺",
   "id": "d62"
  }
 ],
 "pinned": [
  {
   "date": "2027-02-01",
   "phase": "final",
   "title": "考前兩天：只複習不做新題",
   "tag": "考前",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "看離散考前小卡",
     "read": "不做新題",
     "practice": "保持手感：挑 3 題簡單的計數題"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "看計結考前小卡",
     "read": "不做新題",
     "practice": "挑 3 題 cache／pipeline 練手"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "看 OS 閃卡與資結小卡",
     "read": "不做新題",
     "practice": "早點睡"
    }
   ],
   "id": "p20270201"
  },
  {
   "date": "2027-02-02",
   "phase": "final",
   "title": "考前一天：確認考場、早睡",
   "tag": "考前",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "翻一遍三科小卡",
     "read": "",
     "practice": ""
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "確認試場、交通、准考證",
     "read": "看試場分配公告，必要時先去看考場",
     "practice": ""
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "整理考試用品後休息",
     "read": "准考證、身分證、文具、手錶",
     "practice": "最晚 23:00 睡"
    }
   ],
   "id": "p20270202"
  }
 ],
 "notes": [
  {
   "slug": "method",
   "title": "學習方法",
   "desc": "中山怎麼考、五個有研究支持的讀書方法、每天的流程、小考與錯題本",
   "url": "notes/method.html"
  },
  {
   "slug": "discrete",
   "subject": "dm",
   "title": "離散數學",
   "desc": "111–115 全部 48 題拆成 9 個單元：計數、排容、生成函數、遞迴、數論、鴿籠、關係、FSM、機率",
   "url": "notes/discrete.html"
  },
  {
   "slug": "arch",
   "subject": "ca",
   "title": "計算機結構",
   "desc": "效能、cache、虛擬記憶體、pipeline、分支、多執行緒、DRAM、平行、ISA 與算術",
   "url": "notes/arch.html"
  },
  {
   "slug": "os",
   "subject": "osds",
   "title": "作業系統",
   "desc": "行程與排程、同步、死結、記憶體、儲存與 I/O、安全；113–115 填空總表",
   "url": "notes/os.html"
  },
  {
   "slug": "ds",
   "subject": "osds",
   "title": "資料結構",
   "desc": "C 程式追蹤、排序、樹、雜湊、圖、遞迴計數與 DP",
   "url": "notes/ds.html"
  }
 ],
 "strategy": [
  {
   "title": "你的兩個弱科就是總分的 2/3",
   "body": "中山資工甲組考計算機結構、作業系統與資料結構、離散數學三科，成績直接相加。離散和計結占了三分之二，所以不能放棄任何一科。計畫把精神最好的上午和下午留給這兩科，OS/資結放在晚上。",
   "src": [
    0
   ]
  },
  {
   "title": "弱科其實是題型最固定的科目",
   "body": "111–115 年的離散，計數、生成函數、遞迴每年都佔一半以上，圖論幾乎沒考；計結每年都在算 CPI、Amdahl、AMAT、cache 位元數、pipeline 與分支。教材把這五年的題目全部拆成單元，照單元把模板練熟，弱科也能穩定拿分。",
   "src": [
    7
   ]
  },
  {
   "title": "知道出題來源，就知道去哪裡找練習題",
   "body": "計結 113 年幾乎全是 Patterson & Hennessy 課本習題，112、114 年是 Onur Mutlu（ETH／CMU）課程考題的風格；OS 的填空和觀念題幾乎都是恐龍書原文。所以計結多做 COD 習題和 Mutlu 附詳解的考古題，OS 把恐龍書名詞做成閃卡。",
   "src": [
    7,
    8
   ]
  },
  {
   "title": "111–115 拆成教材，108–109 留做模考",
   "body": "最近五年的題目用來學（每題都有詳解）；108、109 年先不要碰，留到一月當全真模考。110 年第一天已用來診斷。115 年是新格式，衝刺期再整份重考一次。",
   "src": [
    7
   ]
  },
  {
   "title": "主動回想＋間隔複習，不要重讀",
   "body": "研究評價最高的讀書方法是練習測驗和分散練習，重讀和畫重點效果最差。所以每個單元都先做小考再看答案、錯題用 1–3–7 天節奏重做、每 5 天一次週考。",
   "src": [
    9
   ]
  },
  {
   "title": "弱科先看範例，再逐步自己做",
   "body": "新手先研究完整的解題範例學得最快，熟練後要改成自己解。離散、計結第一次讀時先看懂例題每一步，第二次遮住詳解，第三次限時獨立做。",
   "src": [
    10
   ]
  },
  {
   "title": "115 年格式改了，116 很可能沿用",
   "body": "115 年離散改成 10 題簡答（只寫答案）＋ 3 題計算，計結改成按章節出題、概念與簡單計算為主。答案正確和速度變得更重要，衝刺期要用這個格式練限時。",
   "src": [
    7
   ]
  },
  {
   "title": "多報幾間當保險",
   "body": "中山資工甲組近年錄取率很低（113 學年度報名 1386 人、招 28 人，約 2%；實際到考人數通常比報名少）。同時報考考科相近的學校（例如中正、中興、中央），注意考試日期不要撞期。",
   "src": [
    1
   ]
  },
  {
   "title": "照時數調整份量",
   "body": "這份計畫假設每天讀 8 小時左右（上午 3、下午 3、晚上 2.5）。如果白天要上課或上班，就把每天的三個區塊拆成兩天做，並優先保留離散和計結的部分。",
   "src": []
  }
 ],
 "resources": [
  {
   "subject": "dm",
   "items": [
    "Grimaldi《Discrete and Combinatorial Mathematics》：中山離散的題目風格最接近這本",
    "MIT 6.042J Mathematics for Computer Science：免費課本與影片，補觀念用",
    "本站教材：離散數學（111–115 全部題目詳解）"
   ]
  },
  {
   "subject": "ca",
   "items": [
    "Patterson & Hennessy《Computer Organization and Design》（RISC-V 版）：第 1、4、5 章習題",
    "Onur Mutlu（ETH）計算機結構考古題與詳解；MIT 6.823 多執行緒習題",
    "清大 OCW 黃婷婷計算機結構：中文講解"
   ]
  },
  {
   "subject": "osds",
   "items": [
    "Silberschatz《Operating System Concepts》（恐龍書）：填空與觀念題來源",
    "Horowitz《Fundamentals of Data Structures in C》",
    "VisuAlgo：排序、樹、雜湊、MST 動畫"
   ]
  }
 ],
 "sources": [
  {
   "label": "中山資工系：資訊工程碩士班（考科與計分方式）",
   "url": "https://cse.nsysu.edu.tw/p/412-1205-19722.php?Lang=zh-tw"
  },
  {
   "label": "聯合報：中山大學碩士班招考錄取率（113 學年度）",
   "url": "https://udn.com/news/story/6925/7761404"
  },
  {
   "label": "114 資工所跨考心得（HackMD）",
   "url": "https://hackmd.io/@andychiang4105/Bka4l0Yjyg"
  },
  {
   "label": "114 資工所考試應屆四大上岸心得（HackMD）",
   "url": "https://hackmd.io/@Lunacmcs/ryO47hciJg"
  },
  {
   "label": "大碩：資工所考科怎麼準備",
   "url": "https://daso-master.blogspot.com/2023/08/blog-post.html"
  },
  {
   "label": "中山 116 學年度招生考試預定日程一覽表（PDF）",
   "url": "https://oaa.nsysu.edu.tw/static/file/3/1003/attach/28/pta_246397_7587552_11872.pdf"
  },
  {
   "label": "中山 110 學年度碩士班考試入學簡章（計分方式）",
   "url": "https://exam-acad.nsysu.edu.tw/exam_netlist/pdf_file/aca_master/110ele_brief_41.pdf"
  },
  {
   "label": "中山圖資處：碩士班歷屆考古題（資工系 111–115 年）",
   "url": "https://lis.nsysu.edu.tw/p/412-1001-6014.php?Lang=zh-tw"
  },
  {
   "label": "Onur Mutlu 計算機結構考古題（ETH）",
   "url": "https://safari.ethz.ch/architecture/fall2022/doku.php?id=exams"
  },
  {
   "label": "Dunlosky et al. (2013) 讀書方法研究摘要",
   "url": "https://es.aft.org/sites/default/files/dunlosky_0.pdf"
  },
  {
   "label": "Worked-example effect",
   "url": "https://en.wikipedia.org/wiki/Worked-example_effect"
  }
 ],
 "papers": {
  "years": [
   115,
   114,
   113,
   112,
   111,
   110,
   109,
   108,
   107,
   106,
   105,
   104,
   103,
   102,
   101,
   100
  ],
  "roles": {
   "115": "教材＋模考 #3",
   "114": "教材",
   "113": "教材",
   "112": "教材",
   "111": "教材",
   "110": "診斷",
   "109": "模考 #1",
   "108": "模考 #2"
  },
  "note": "111–115 已拆進教材當例題；108、109 先不要碰，留到一月當全真模考。資工系的 PDF 在圖資處考古題頁，檔名是 infoe_年度.pdf。",
  "url": "https://lis.nsysu.edu.tw/p/412-1001-6014.php?Lang=zh-tw"
 },
 "links": [
  {
   "label": "中山圖資處：碩士班歷屆考古題",
   "url": "https://lis.nsysu.edu.tw/p/412-1001-6014.php?Lang=zh-tw"
  },
  {
   "label": "中山資工系・資訊工程碩士班",
   "url": "https://cse.nsysu.edu.tw/p/412-1205-19722.php?Lang=zh-tw"
  },
  {
   "label": "中山教務處：116 學年度各項招生考試預定日程表",
   "url": "https://oaa.nsysu.edu.tw/p/404-1003-380074.php?Lang=zh-tw"
  },
  {
   "label": "中山招生考試系統（簡章、報名）",
   "url": "https://exam-acad.nsysu.edu.tw/"
  }
 ]
});
