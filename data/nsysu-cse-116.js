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
     "read": "111–115 年的考題分布，加上 100–110 年還常考的題型，都已經整理好（108、109 留作模考，不列）",
     "practice": "圈出出現 3 年以上的主題，當作讀書的優先順序",
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
     "read": "先讀觀念課 1.0，再讀教材 1.1–1.2：先判斷「東西有沒有區別、順序重不重要」",
     "practice": "例題 111 Q8、113 Q1、113 Q5、114 Q3 先遮詳解自己做",
     "link": "notes/discrete.html#u1-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "效能：CPU time 與加權 CPI",
     "read": "先讀觀念課 1.0，再讀教材 1.1",
     "practice": "例題 115 Q1.2、Q2.1",
     "link": "notes/arch.html#u1-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：C 程式：運算子優先順序與位元運算",
     "read": "先讀觀念課 1.0，再讀教材 1.1：背優先順序表",
     "practice": "例題 115 Q5a、112 Q1a、113 Q1a",
     "link": "notes/ds.html#u1-0"
    }
   ],
   "review": [
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    }
   ],
   "id": "d03"
  },
  {
   "phase": "foundation",
   "title": "計數：插空法、不相鄰、格子路徑｜效能：Amdahl 定律｜行程、PCB、IPC、fork 程式追蹤",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "計數：插空法、不相鄰、格子路徑",
     "read": "教材 1.3、1.7：碰到 x 軸的路徑用反射原理",
     "practice": "例題 115 A1、A6、101 Q5；Grimaldi 第 1 章同類題 5 題",
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
     "title": "OS：行程、PCB、IPC、fork 程式追蹤",
     "read": "先讀觀念課 1.0，再讀教材 1.1、1.3",
     "practice": "例題 112 Q5a、115 Q2、114 Q6b、106 Q1、110 Q1",
     "link": "notes/os.html#u1-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈計數：四個基本模型、球放箱子〉的小考（昨天學的）",
     "link": "notes/discrete.html#u1-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈效能：CPU time 與加權 CPI〉的小考（昨天學的）",
     "link": "notes/arch.html#u1-0"
    },
    {
     "subject": "osds",
     "text": "回想〈C 程式：運算子優先順序與位元運算〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u1-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    }
   ],
   "id": "d04"
  },
  {
   "phase": "foundation",
   "title": "計數：多項式係數、字串、二項式恆等式｜效能：時脈的限制、MIPS 值、功耗、平均數｜C 程式：指標與遞迴追蹤",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "計數：多項式係數、字串、二項式恆等式",
     "read": "教材 1.4–1.6",
     "practice": "例題 112 Q1、Q4、113 Q2、111 Q4、114 Q1、106 Q3、100 Q8；做單元 1 小考",
     "link": "notes/discrete.html#u1-4"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "效能：時脈的限制、MIPS 值、功耗、平均數",
     "read": "教材 1.3–1.4：比快慢只看執行時間",
     "practice": "例題 115 Q1.1、Q1.3、100 Q3、102 Q1、101 Q2、105 Q5；做單元 1 小考",
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈計數：四個基本模型、球放箱子〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u1-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈效能：CPU time 與加權 CPI〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u1-0"
    },
    {
     "subject": "osds",
     "text": "回想〈C 程式：運算子優先順序與位元運算〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u1-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "先讀觀念課 2.0，再讀教材 2.1–2.2",
     "practice": "例題 115 A3；Grimaldi 第 8 章倍數題 5 題",
     "link": "notes/discrete.html#u2-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：位址切割",
     "read": "先讀觀念課 2.0，再讀教材 2.1：offset、index、tag 三步驟",
     "practice": "COD 第 5 章位址切割習題 6 題",
     "link": "notes/arch.html#u2-0"
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈計數：插空法、不相鄰、格子路徑〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u1-3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈效能：Amdahl 定律〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u1-2"
    },
    {
     "subject": "osds",
     "text": "回想〈行程、PCB、IPC、fork 程式追蹤〉的重點，寫不出來就重看",
     "link": "notes/os.html#u1-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈計數：多項式係數、字串、二項式恆等式〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u1-4"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈效能：時脈的限制、MIPS 值、功耗、平均數〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u1-3"
    },
    {
     "subject": "osds",
     "text": "回想〈C 程式：指標與遞迴追蹤〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u1-2"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "先讀觀念課 3.0，再讀教材 3.1：每個變數寫一個因子",
     "practice": "例題 114 Q7、112 Q5",
     "link": "notes/discrete.html#u3-0"
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
     "read": "先讀觀念課 2.0，再讀教材單元 2（含 2.2 priority inversion、two-phase locking）",
     "practice": "例題 114 Q6a、112 Q5b、105 Q1、104 Q8；做單元 2 小考",
     "link": "notes/os.html#u2-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈排容：公式與倍數問題〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u2-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Cache：位址切割〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u2-0"
    },
    {
     "subject": "osds",
     "text": "回想〈CPU 排程計算〉的重點，寫不出來就重看",
     "link": "notes/os.html#u1-2"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "先讀觀念課 2.0，再讀教材 2.1–2.2：背複雜度表",
     "practice": "例題 115 Q9、113 Q3、112 Q2",
     "link": "notes/ds.html#u2-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈排容：上限整數解、錯排〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u2-3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Cache：總位元數〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u2-2"
    },
    {
     "subject": "osds",
     "text": "回想〈C 程式：static 與迴圈〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u1-3"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d10"
  },
  {
   "phase": "foundation",
   "title": "生成函數：解遞迴、整數分割｜Cache：觀念題、逆向工程、進階方法｜死結",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "生成函數：解遞迴、整數分割",
     "read": "教材 3.3–3.4：部分分式；分割是每種加數寫一個因子",
     "practice": "例題 113 Q10、103 Q6；做單元 3 小考",
     "link": "notes/discrete.html#u3-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Cache：觀念題、逆向工程、進階方法",
     "read": "教材 2.7、2.9",
     "practice": "例題 111 P1、112 Q6、105 Q2、110 Q1、Q4；做單元 2 小考",
     "link": "notes/arch.html#u2-5"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：死結",
     "read": "先讀觀念課 3.0，再讀教材單元 3（含 3.2 哲學家、磁帶機、wait-die）",
     "practice": "例題 115 Q3a、112 Q8a、103 Q1、100 Q3；做單元 3 小考",
     "link": "notes/os.html#u3-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈生成函數：OGF 建模與卷積〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u3-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Cache：hit／miss 追蹤〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u2-3"
    },
    {
     "subject": "osds",
     "text": "回想〈同步〉的重點，寫不出來就重看",
     "link": "notes/os.html#u2-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
   "tag": "週考",
   "id": "d12"
  },
  {
   "phase": "foundation",
   "title": "生成函數：OGF／EGF 混合練習｜虛擬記憶體：位元切割、page table 大小｜heap sort、radix sort、排序的下界",
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
     "read": "先讀觀念課 3.0，再讀教材 3.1",
     "practice": "例題 114 Q2、113 Q7.1、111 P2",
     "link": "notes/arch.html#u3-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：heap sort、radix sort、排序的下界",
     "read": "教材 2.3–2.5",
     "practice": "例題 111 Q4、114 Q2、104 Q1、106 Q9；做單元 2 小考",
     "link": "notes/ds.html#u2-3"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈生成函數：EGF 與奇偶限制〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u3-2"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Cache：AMAT 與記憶體停頓〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u2-4"
    },
    {
     "subject": "osds",
     "text": "回想〈排序：比較表與逆序數〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u2-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d13"
  },
  {
   "phase": "foundation",
   "title": "遞迴：最後一步分類法｜TLB 與 page table 模擬｜位址繫結、TLB、記憶體配置",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：最後一步分類法",
     "read": "先讀觀念課 4.0，再讀教材 4.1：112、114 連續兩年考同一模型",
     "practice": "例題 112 Q7、114 Q6、111 Q6",
     "link": "notes/discrete.html#u4-0"
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
     "title": "OS：位址繫結、TLB、記憶體配置",
     "read": "先讀觀念課 4.0，再讀教材 4.1、4.5",
     "practice": "例題 112 Q6a、114 Q7、113 Q5a、100 Q4、105 Q3",
     "link": "notes/os.html#u4-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈生成函數：解遞迴、整數分割〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u3-3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Cache：觀念題、逆向工程、進階方法〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u2-5"
    },
    {
     "subject": "osds",
     "text": "回想〈死結〉的重點，寫不出來就重看",
     "link": "notes/os.html#u3-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d14"
  },
  {
   "phase": "foundation",
   "title": "遞迴：特徵方程（相異、重根、複數根）｜單週期與多週期 datapath｜樹：走訪重建、運算式、BST",
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
     "title": "單週期與多週期 datapath",
     "read": "先讀觀念課 4.0，再讀教材 4.3：每種指令經過哪些元件、控制訊號",
     "practice": "例題 106 Q6、102 Q4、101 Q5、103 Q5",
     "link": "notes/arch.html#u4-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：樹：走訪重建、運算式、BST",
     "read": "先讀觀念課 3.0，再讀教材 3.1、3.5、3.2",
     "practice": "例題 115 Q6、100 Q7、106 Q10、103 Q7(2)、111 Q3",
     "link": "notes/ds.html#u3-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈生成函數：OGF／EGF 混合練習〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈虛擬記憶體：位元切割、page table 大小〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u3-0"
    },
    {
     "subject": "osds",
     "text": "回想〈heap sort、radix sort、排序的下界〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u2-3"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d15"
  },
  {
   "phase": "foundation",
   "title": "遞迴：非齊次、換元、分治｜Pipeline：時間計算，跟單週期、多週期比較｜記憶體計算模板",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "遞迴：非齊次、換元、分治",
     "read": "教材 4.3–4.4：特解猜法表；n 每次減半就令 n＝2^k",
     "practice": "例題 114 Q9、101 Q2；做單元 4 小考",
     "link": "notes/discrete.html#u4-3"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "Pipeline：時間計算，跟單週期、多週期比較",
     "read": "教材 4.1，再看 4.3 的 100 Q4、106 Q3",
     "practice": "例題 113 Q3、100 Q4、106 Q3",
     "link": "notes/arch.html#u4-1"
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈遞迴：最後一步分類法〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u4-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈TLB 與 page table 模擬〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u3-2"
    },
    {
     "subject": "osds",
     "text": "回想〈位址繫結、TLB、記憶體配置〉的重點，寫不出來就重看",
     "link": "notes/os.html#u4-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
   "tag": "週考",
   "id": "d17"
  },
  {
   "phase": "foundation",
   "title": "遞迴：混合練習｜Pipeline：hazard、forwarding 值不值得｜AVL tree 與紅黑樹",
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
     "title": "Pipeline：hazard、forwarding 值不值得",
     "read": "教材 4.2：load-use 一定要 stall 1",
     "practice": "例題 115 Q5.1、111 P5、114 Q4；做單元 4 小考",
     "link": "notes/arch.html#u4-2"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：AVL tree 與紅黑樹",
     "read": "教材 3.3：四種旋轉；再讀 7.1 紅黑樹",
     "practice": "例題 114 Q3、103 Q6、105 Q7(2)；自己插入 10 個數練旋轉",
     "link": "notes/ds.html#u3-3"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈遞迴：特徵方程（相異、重根、複數根）〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u4-2"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈單週期與多週期 datapath〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u4-0"
    },
    {
     "subject": "osds",
     "text": "回想〈樹：走訪重建、運算式、BST〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u3-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d18"
  },
  {
   "phase": "foundation",
   "title": "數論：gcd 與線性組合｜分支：penalty 與額外 CPI｜置換、thrashing、二維陣列的 page fault",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "數論：gcd 與線性組合",
     "read": "先讀觀念課 5.0，再讀教材 5.1",
     "practice": "例題 112 Q2、Q8；自己再證 3 題互質",
     "link": "notes/discrete.html#u5-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "分支：penalty 與額外 CPI",
     "read": "先讀觀念課 5.0，再讀教材 5.1",
     "practice": "例題 113 Q4、112 Q1.3–1.4",
     "link": "notes/arch.html#u5-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：置換、thrashing、二維陣列的 page fault",
     "read": "教材 4.3–4.4",
     "practice": "例題 112 Q6b、115 Q3b、103 Q2–Q3、110 Q5；做單元 4 小考",
     "link": "notes/os.html#u4-3"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈遞迴：非齊次、換元、分治〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u4-3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Pipeline：時間計算，跟單週期、多週期比較〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u4-1"
    },
    {
     "subject": "osds",
     "text": "回想〈記憶體計算模板〉的重點，寫不出來就重看",
     "link": "notes/os.html#u4-2"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d19"
  },
  {
   "phase": "foundation",
   "title": "數論：歐幾里得演算法與模反元素｜分支：深 pipeline、dual-path、2-bit｜Optimal BST 與 Huffman 編碼",
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
     "title": "資結：Optimal BST 與 Huffman 編碼",
     "read": "教材 3.4、3.6",
     "practice": "例題 112 Q3、101 Q8、102 Q4；做單元 3 小考",
     "link": "notes/ds.html#u3-4"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈遞迴：混合練習〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u4"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈Pipeline：hazard、forwarding 值不值得〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u4-2"
    },
    {
     "subject": "osds",
     "text": "回想〈AVL tree 與紅黑樹〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u3-3"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d20"
  },
  {
   "phase": "foundation",
   "title": "數論：質數、同餘、Fermat｜多執行緒：fixed 與 data-dependent 切換｜檔案系統、目錄、開檔表、I/O 方式",
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
     "read": "先讀觀念課 6.0，再讀教材 6.1",
     "practice": "例題 114 Q5",
     "link": "notes/arch.html#u6-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：檔案系統、目錄、開檔表、I/O 方式",
     "read": "先讀觀念課 5.0，再讀教材 5.1、5.5",
     "practice": "例題 114 Q5a、112 Q7、111 Q5、104 Q6(1)、105 Q2、107 Q3",
     "link": "notes/os.html#u5-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈數論：gcd 與線性組合〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u5-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈分支：penalty 與額外 CPI〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u5-0"
    },
    {
     "subject": "osds",
     "text": "回想〈置換、thrashing、二維陣列的 page fault〉的重點，寫不出來就重看",
     "link": "notes/os.html#u4-3"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
   "tag": "週考",
   "id": "d22"
  },
  {
   "phase": "foundation",
   "title": "群、環、體：生成元、Euler 定理、同構｜多執行緒：linked list 題｜雜湊與雜湊的理論",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "群、環、體：生成元、Euler 定理、同構",
     "read": "先讀觀念課 11.0，再讀教材單元 11：先弄懂 Z_n、Z_n* 和元素的 order",
     "practice": "例題 102 Q8、107 Q4–Q6、103 Q7–Q8、104 Q7；做單元 11 小考",
     "link": "notes/discrete.html#u11-0"
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
     "title": "資結：雜湊與雜湊的理論",
     "read": "先讀觀念課 4.0，再讀教材單元 4（含 4.2）",
     "practice": "例題 115 Q7、104 Q2(3)、105 Q5(1)、103 Q9；做單元 4 小考",
     "link": "notes/ds.html#u4-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈數論：歐幾里得演算法與模反元素〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u5-2"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈分支：深 pipeline、dual-path、2-bit〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u5"
    },
    {
     "subject": "osds",
     "text": "回想〈Optimal BST 與 Huffman 編碼〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u3-4"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d23"
  },
  {
   "phase": "foundation",
   "title": "鴿籠、Erdős–Szekeres、Ramsey｜DRAM refresh｜磁碟、磁碟排程與 I/O",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "鴿籠、Erdős–Szekeres、Ramsey",
     "read": "先讀觀念課 6.0，再讀教材 6.1–6.4：先想「鴿子是什麼、籠子是什麼」",
     "practice": "例題 111 Q1、114 Q4、112 Q3、115 B3、100 Q2、105 Q1、110 Q3；做單元 6 小考",
     "link": "notes/discrete.html#u6-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "DRAM refresh",
     "read": "先讀觀念課 7.0，再讀教材 7.1",
     "practice": "例題 114 Q1、112 Q2",
     "link": "notes/arch.html#u7-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：磁碟、磁碟排程與 I/O",
     "read": "教材 5.2–5.4",
     "practice": "例題 111 Q7、115 Q4、110 Q2、102 Q7、114 Q5b；做單元 5 小考",
     "link": "notes/os.html#u5-2"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈數論：質數、同餘、Fermat〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u5-3"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈多執行緒：fixed 與 data-dependent 切換〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u6-0"
    },
    {
     "subject": "osds",
     "text": "回想〈檔案系統、目錄、開檔表、I/O 方式〉的重點，寫不出來就重看",
     "link": "notes/os.html#u5-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d24"
  },
  {
   "phase": "foundation",
   "title": "關係的計數、等價關係、偏序｜資料重用與迴圈順序｜圖：BFS／DFS 與 MST",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "關係的計數、等價關係、偏序",
     "read": "先讀觀念課 7.0，再讀教材 7.1、7.4–7.5：把關係想成矩陣的格子；會畫 Hasse 圖",
     "practice": "例題 113 Q7、111 Q3、100 Q7、104 Q2、102 Q7",
     "link": "notes/discrete.html#u7-0"
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
     "title": "資結：圖：BFS／DFS 與 MST",
     "read": "先讀觀念課 5.0，再讀教材單元 5（含 5.2 BFS／DFS）",
     "practice": "例題 115 Q8、104 Q3、105 Q8、107 Q5(1)；做單元 5 小考",
     "link": "notes/ds.html#u5-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈群、環、體：生成元、Euler 定理、同構〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u11-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈多執行緒：linked list 題〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u6"
    },
    {
     "subject": "osds",
     "text": "回想〈雜湊與雜湊的理論〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u4-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d25"
  },
  {
   "phase": "foundation",
   "title": "函數、邏輯、布林代數、可數性｜GPU、VLIW、superscalar、Tomasulo｜保護、安全、分散式與網路",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "函數、邏輯、布林代數、可數性",
     "read": "教材 7.2–7.3、7.6–7.7",
     "practice": "例題 115 A8、113 Q6、115 B2、114 Q2、100 Q5、105 Q2；做單元 7 小考",
     "link": "notes/discrete.html#u7-2"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "GPU、VLIW、superscalar、Tomasulo",
     "read": "先讀觀念課 8.0，再讀教材 8.1–8.2、8.5",
     "practice": "例題 113 Q2、114 Q6、107 Q6、105 Q1",
     "link": "notes/arch.html#u8-0"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "OS：保護、安全、分散式與網路",
     "read": "先讀觀念課 6.0，再讀教材單元 6（含 6.2–6.3）",
     "practice": "例題 112 Q8b–c、Q9、113 Q7、101 Q5、105 Q4、107 Q4、101 Q6、102 Q8",
     "link": "notes/os.html#u6-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈鴿籠、Erdős–Szekeres、Ramsey〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u6-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈DRAM refresh〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u7-0"
    },
    {
     "subject": "osds",
     "text": "回想〈磁碟、磁碟排程與 I/O〉的重點，寫不出來就重看",
     "link": "notes/os.html#u5-2"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
   "tag": "週考",
   "id": "d27"
  },
  {
   "phase": "foundation",
   "title": "有限狀態機｜記憶體一致性與多處理器｜B-tree、heap 家族、treap",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "有限狀態機",
     "read": "先讀觀念課 8.0，再讀教材單元 8：狀態＝需要記住的資訊",
     "practice": "例題 111 Q2、114 Q5；做單元 8 小考",
     "link": "notes/discrete.html#u8-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "記憶體一致性與多處理器",
     "read": "教材 8.3–8.4",
     "practice": "例題 112 Q5、107 Q5、101 Q7；做單元 8 小考",
     "link": "notes/arch.html#u8-3"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：B-tree、heap 家族、treap",
     "read": "先讀觀念課 7.0，再讀教材 7.2–7.5",
     "practice": "例題 101 Q9、107 Q6、104 Q4、105 Q5(2)、103 Q8；做單元 7 小考",
     "link": "notes/ds.html#u7-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈關係的計數、等價關係、偏序〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u7-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈資料重用與迴圈順序〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u7-2"
    },
    {
     "subject": "osds",
     "text": "回想〈圖：BFS／DFS 與 MST〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u5-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d28"
  },
  {
   "phase": "foundation",
   "title": "機率與期望值｜ISA 與算術：二補數、浮點數的編碼與解讀｜名詞填空總表（第一輪）",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "機率與期望值",
     "read": "先讀觀念課 9.0，再讀教材單元 9",
     "practice": "例題 115 B1、A10；做單元 9 小考",
     "link": "notes/discrete.html#u9-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "ISA 與算術：二補數、浮點數的編碼與解讀",
     "read": "先讀觀念課 9.0，再讀教材 9.0–9.2：數值轉位元、位元轉數值兩個方向都要會",
     "practice": "例題 115 Q3、Q4、111 P1.1、100 Q2、103 Q2",
     "link": "notes/arch.html#u9-0"
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈函數、邏輯、布林代數、可數性〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u7-2"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈GPU、VLIW、superscalar、Tomasulo〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u8-0"
    },
    {
     "subject": "osds",
     "text": "回想〈保護、安全、分散式與網路〉的重點，寫不出來就重看",
     "link": "notes/os.html#u6-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d29"
  },
  {
   "phase": "foundation",
   "title": "圖論基礎：度數、樹、二分圖、平面圖｜MIPS 組合語言、加法器與乘法器｜Catalan 數、遞迴式與 DP",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "圖論基礎：度數、樹、二分圖、平面圖",
     "read": "先讀觀念課 10.0，再讀教材單元 10：先背握手定理和 Euler 公式，再看三種證明套路",
     "practice": "例題 100 Q4、Q6、101 Q4、104 Q6、105 Q6、106 Q4；做單元 10 小考",
     "link": "notes/discrete.html#u10-0"
    },
    {
     "subject": "ca",
     "time": "下午",
     "title": "MIPS 組合語言、加法器與乘法器",
     "read": "教材 9.3–9.4：陣列位址要乘 4；會寫 g、p 和進位式",
     "practice": "例題 101 Q3、102 Q2、103 Q4、101 Q8、102 Q3、101 Q4；做單元 9 小考",
     "link": "notes/arch.html#u9-mips"
    },
    {
     "subject": "osds",
     "time": "晚上",
     "title": "資結：Catalan 數、遞迴式與 DP",
     "read": "先讀觀念課 6.0，再讀教材 6.1–6.2",
     "practice": "例題 114 Q4、111 Q2、112 Q4、113 Q4、Q2；做單元 6 小考",
     "link": "notes/ds.html#u6-0"
    }
   ],
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈有限狀態機〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u8-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈記憶體一致性與多處理器〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u8-3"
    },
    {
     "subject": "osds",
     "text": "回想〈B-tree、heap 家族、treap〉的重點，寫不出來就重看",
     "link": "notes/ds.html#u7-0"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "id": "d30"
  },
  {
   "phase": "foundation",
   "title": "離散綜合小考與總回顧｜計結綜合小考與總回顧｜OS 綜合小考",
   "blocks": [
    {
     "subject": "dm",
     "time": "上午",
     "title": "離散綜合小考與總回顧",
     "read": "限時 40 分鐘做綜合小考，再回看第 0 節的考題分布表",
     "practice": "錯題本最弱的 3 個單元各再做 5 題",
     "link": "notes/discrete.html#mix"
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
   "review": [
    {
     "subject": "dm",
     "text": "不看答案重做〈機率與期望值〉的小考（約 3 天前學的）",
     "link": "notes/discrete.html#u9-0"
    },
    {
     "subject": "ca",
     "text": "不看答案重做〈ISA 與算術：二補數、浮點數的編碼與解讀〉的小考（約 3 天前學的）",
     "link": "notes/arch.html#u9-0"
    },
    {
     "subject": "osds",
     "text": "回想〈名詞填空總表（第一輪）〉的重點，寫不出來就重看",
     "link": "notes/os.html#u7"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
    },
    {
     "text": "錯題本：重做右上角日期是今天的題目"
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
     "read": "只看題目重做，做錯題本上今天到期的題目",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    }
   ],
   "note": "複習日不學新東西，目標是把這輪的錯題清掉。這一天重做的是約 1 週前學的單元，正好是第二次間隔複習。",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
   "review": [
    {
     "text": "錯題本：重做右上角日期是今天的題目"
    },
    {
     "subject": "osds",
     "text": "OS 名詞閃卡 10 分鐘",
     "link": "notes/os.html#u7"
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
 "tracks": [
  {
   "min": 85,
   "id": "full",
   "name": "完整計畫",
   "rest": [
    3,
    0
   ],
   "desc": "時間充足，照四個階段走：診斷 2 天、打底 30 天（照單元讀，每 5 天一次週考）、考古題 18 天、衝刺 12 天。每週休 2 天。"
  },
  {
   "min": 70,
   "id": "standard",
   "name": "標準計畫",
   "rest": [
    0
   ],
   "desc": "內容和完整計畫一樣，改成每週休 1 天把時間補回來；天數比較少時，他校考古題、他校模考這些選做日會先拿掉。"
  },
  {
   "min": 55,
   "id": "fast",
   "name": "加速計畫",
   "rest": [
    0
   ],
   "desc": "打底期照單元讀，但週考減半；考古題從 104 年做起，100–103 年有空再做。每個單元先做小考再讀，寫得出來的小節快速帶過。"
  },
  {
   "min": 40,
   "id": "sprint",
   "name": "衝刺計畫",
   "rest": [
    0
   ],
   "desc": "打底期兩天併一天：每個區塊先做兩個小節的小考，錯了才讀觀念課。考古題做 104–107 年，再限時重做 111–114 年，模考 2 次。★★★ 主題優先，★ 主題先跳過。"
  },
  {
   "min": 25,
   "id": "final",
   "name": "考前計畫",
   "rest": [
    0
   ],
   "desc": "打底期三到四天併一天，只讀 ★★★ 主題；以考古題帶讀：先寫題，錯的才回去讀教材。錯題本、公式總表一定要做。"
  },
  {
   "min": 0,
   "id": "last",
   "name": "最後衝刺",
   "rest": [
    0
   ],
   "desc": "不讀新單元。每天一份近年考古題（限時），寫完把錯的題目對應的教材小節讀懂；睡前背公式、翻錯題本。"
  }
 ],
 "compress": [
  {
   "label": "取消選做日（他校考古題、他校模考、限時小模考），有空再做",
   "drop": [
    "d43",
    "d55",
    "d61"
   ]
  },
  {
   "label": "診斷考和訂正併成 1 天",
   "merge": [
    {
     "ids": [
      "d01",
      "d02"
     ],
     "title": "診斷考＋訂正：用 110 年考古題摸底",
     "tag": "考古題"
    }
   ]
  },
  {
   "label": "打底期週考減半（6 次 → 3 次）",
   "drop": [
    "d07",
    "d17",
    "d27"
   ]
  },
  {
   "label": "100、101 年考古題有空再做；錯題本一刷併成 1 天",
   "drop": [
    "d42",
    "d41"
   ],
   "merge": [
    {
     "ids": [
      "d49",
      "d50"
     ],
     "title": "錯題本一刷＋公式總表",
     "tag": "複習"
    }
   ]
  },
  {
   "label": "102、103 年考古題有空再做；弱點補強 3 天 → 2 天",
   "drop": [
    "d39",
    "d38",
    "d44"
   ]
  },
  {
   "label": "打底期兩天併一天：先做小考，錯了才讀",
   "group": {
    "ids": [
     "d03",
     "d04",
     "d05",
     "d06",
     "d08",
     "d09",
     "d10",
     "d11",
     "d13",
     "d14",
     "d15",
     "d16",
     "d18",
     "d19",
     "d20",
     "d21",
     "d23",
     "d24",
     "d25",
     "d26",
     "d28",
     "d29",
     "d30",
     "d31"
    ],
    "size": 2
   }
  },
  {
   "label": "模考 3 次 → 2 次（108 年有空再做）；週考 → 1 次；弱點補強 → 1 天",
   "drop": [
    "d53",
    "d54",
    "d12",
    "d22",
    "d40"
   ]
  },
  {
   "label": "打底期三天併一天，只讀 ★★★ 主題；104 年考古題有空再做",
   "group": {
    "ids": [
     "d03",
     "d04",
     "d05",
     "d06",
     "d08",
     "d09",
     "d10",
     "d11",
     "d13",
     "d14",
     "d15",
     "d16",
     "d18",
     "d19",
     "d20",
     "d21",
     "d23",
     "d24",
     "d25",
     "d26",
     "d28",
     "d29",
     "d30",
     "d31"
    ],
    "size": 3
   },
   "drop": [
    "d37"
   ]
  },
  {
   "label": "105、106 年考古題有空再做；高頻題速刷和公式背誦併成 1 天",
   "drop": [
    "d35",
    "d34"
   ],
   "merge": [
    {
     "ids": [
      "d56",
      "d60"
     ],
     "title": "高頻題型速刷＋公式背誦",
     "tag": "衝刺"
    }
   ]
  },
  {
   "label": "打底期四天併一天，只讀 ★★★ 主題；111 年重做有空再做",
   "group": {
    "ids": [
     "d03",
     "d04",
     "d05",
     "d06",
     "d08",
     "d09",
     "d10",
     "d11",
     "d13",
     "d14",
     "d15",
     "d16",
     "d18",
     "d19",
     "d20",
     "d21",
     "d23",
     "d24",
     "d25",
     "d26",
     "d28",
     "d29",
     "d30",
     "d31"
    ],
    "size": 4
   },
   "drop": [
    "d45"
   ]
  },
  {
   "label": "打底期改成 3 天的 ★★★ 速讀，其他時間只做考古題、錯題本、公式",
   "group": {
    "ids": [
     "d03",
     "d04",
     "d05",
     "d06",
     "d08",
     "d09",
     "d10",
     "d11",
     "d13",
     "d14",
     "d15",
     "d16",
     "d18",
     "d19",
     "d20",
     "d21",
     "d23",
     "d24",
     "d25",
     "d26",
     "d28",
     "d29",
     "d30",
     "d31"
    ],
    "size": 8
   },
   "drop": [
    "d32"
   ]
  },
  {
   "label": "診斷考取消；107 年考古題、弱點補強有空再做；★★★ 速讀 3 天 → 2 天",
   "group": {
    "ids": [
     "d03",
     "d04",
     "d05",
     "d06",
     "d08",
     "d09",
     "d10",
     "d11",
     "d13",
     "d14",
     "d15",
     "d16",
     "d18",
     "d19",
     "d20",
     "d21",
     "d23",
     "d24",
     "d25",
     "d26",
     "d28",
     "d29",
     "d30",
     "d31"
    ],
    "size": 12
   },
   "drop": [
    "d01",
    "d02",
    "d33",
    "d36"
   ]
  },
  {
   "label": "不讀新單元（★★★ 速讀取消）；112 年重做、109 年模考有空再做",
   "drop": [
    "d03",
    "d04",
    "d05",
    "d06",
    "d08",
    "d09",
    "d10",
    "d11",
    "d13",
    "d14",
    "d15",
    "d16",
    "d18",
    "d19",
    "d20",
    "d21",
    "d23",
    "d24",
    "d25",
    "d26",
    "d28",
    "d29",
    "d30",
    "d31",
    "d46",
    "d51",
    "d52"
   ]
  },
  {
   "label": "113 年重做、錯題本二刷有空再做",
   "drop": [
    "d47",
    "d59"
   ]
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
   "desc": "11 個單元各有觀念課，111–115 全部 48 題都有詳解：計數、排容、生成函數、遞迴、數論、鴿籠、關係、FSM、機率，加上 100–110 年考過的圖論、群論、偏序、布林代數、可數性、格子路徑",
   "url": "notes/discrete.html"
  },
  {
   "slug": "arch",
   "subject": "ca",
   "title": "計算機結構",
   "desc": "9 個單元各有觀念課：效能（含 MIPS 值、功耗）、cache（含進階方法）、虛擬記憶體、pipeline（含單週期、多週期 datapath）、分支、多執行緒、DRAM、平行（含多處理器、Tomasulo）、ISA 與算術（含 MIPS 組合語言、加法器與乘法器）",
   "url": "notes/arch.html"
  },
  {
   "slug": "os",
   "subject": "osds",
   "title": "作業系統",
   "desc": "6 個單元各有觀念課：行程與排程（含 fork 程式追蹤）、同步、死結、記憶體（含二維陣列 page fault、記憶體配置）、儲存與 I/O（含磁碟排程、目錄、I/O 方式）、安全與分散式（含攻擊手法、事件順序）；加上 113–115 填空總表",
   "url": "notes/os.html"
  },
  {
   "slug": "ds",
   "subject": "osds",
   "title": "資料結構",
   "desc": "7 個單元各有觀念課：C 程式追蹤、排序（含下界）、樹（含運算式、Huffman）、雜湊（含理論）、圖（含 BFS／DFS）、遞迴計數與 DP、進階資料結構（紅黑樹、B-tree、heap、treap）",
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
   "body": "111–115 年的離散，計數、生成函數、遞迴每年都佔一半以上；圖論、群論 111–115 年幾乎沒考，100–107 年卻常考，教材已補上；計結每年都在算 CPI、Amdahl、AMAT、cache 位元數、pipeline 與分支。教材把這五年的題目全部拆成單元，照單元把模板練熟，弱科也能穩定拿分。",
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
   "body": "最近五年的題目用來學（每題都有詳解），100–110 年近年沒考但以前常考的題型（磁碟排程、運算式、datapath、圖論、群論、紅黑樹與 B-tree、MIPS 組合語言等）也挑進教材；108、109 年先不要碰，留到一月當全真模考。110 年第一天已用來診斷。115 年是新格式，衝刺期再整份重考一次。",
   "src": [
    7
   ]
  },
  {
   "title": "主動回想＋間隔複習，不要重讀",
   "body": "研究評價最高的讀書方法是練習測驗和分散練習，重讀和畫重點效果最差。所以每個單元都先做小考再看答案、錯題在 3、7、14 天後各重做一次、每 5 天一次週考。",
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
  "note": "111–115 已拆進教材當例題，100–107、110 年近年沒考的題型也挑了一些進教材；108、109 先不要碰，留到一月當全真模考。資工系的 PDF 在圖資處考古題頁，檔名是 infoe_年度.pdf。下載時看試題上的「科目名稱」：要寫【資工系碩士班甲組】（計算機結構是甲組、乙組共用）。111–113 年考卷最上面印著「碩士班暨碩士在職專班招生考試試題」，那是整場考試的名稱（碩士班和在職專班同一次考），不代表這份是在職專班的題目。",
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
