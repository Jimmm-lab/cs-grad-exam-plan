#!/usr/bin/env python3
"""檢查題目 id 有沒有被改動：手寫筆跡和作答紀錄都是用題目 id 存的，舊題目的 id 一變，筆跡就會跑到別題。

用 notes/*.html（tools/build_notes.py 產生的）照網頁上的規則算出每一題的 id，
跟 tools/quiz_ids.json 記下來的比：

- 舊的 id 不見了，或同一個 id 現在是另一題（題號標籤不一樣）→ 報錯，不更新紀錄。
  通常是在舊題目前面插了新題目卻沒有用 <div data-qid="..."> 包起來。
- 只有新增的 id → 加進 tools/quiz_ids.json。

用法：python3 tools/check_quiz_ids.py          （檢查並記下新題目）
      python3 tools/check_quiz_ids.py --force  （確定是故意改的，例如只改了題號標籤，照現在的重新記錄）
build_notes.py 建完教材會自動跑一次。需要 beautifulsoup4（沒裝就跳過檢查）。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOTES = ROOT / "notes"
SNAP = ROOT / "tools" / "quiz_ids.json"
PAGES = ["discrete", "arch", "os", "ds", "method"]


def closest(tag, test):
    while tag is not None and getattr(tag, "name", None):
        if test(tag):
            return tag
        tag = tag.parent
    return None


def quiz_ids(html_text):
    """跟 tools/notes_template.html 裡的那段程式一樣的規則。回傳 [(id, 標籤), ...]。"""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html_text, "html.parser")
    art = soup.find("article")
    out, seen = [], {}
    for i, d in enumerate(art.select("details.quiz")):
        box = closest(d, lambda t: "mcq" in (t.get("class") or []))
        prev = box.find("p") if box else d.find_previous_sibling()
        label = "Q%d" % (i + 1)
        if prev is not None:
            s = prev.find("strong")
            if s is not None:
                label = re.sub(r"[.．。:：]$", "", s.get_text())[:16]
        fixed = closest(d, lambda t: t.has_attr("data-qid"))
        if fixed is not None:
            qid = "q-" + fixed["data-qid"]
        else:
            h = (box or d).find_previous_sibling()
            while h is not None and not (h.name in ("h2", "h3") and h.get("id")):
                h = h.find_previous_sibling()
            base = h["id"] if h is not None else "top"
            seen[base] = seen.get(base, 0) + 1
            qid = "q-%s-%d" % (base, seen[base])
        out.append((qid, label))
    return out


def main(force=False):
    try:
        import bs4  # noqa: F401
    except ImportError:
        print("check_quiz_ids: 沒有 beautifulsoup4，跳過題目 id 檢查（pip install beautifulsoup4）", file=sys.stderr)
        return 0
    old = json.loads(SNAP.read_text(encoding="utf-8")) if SNAP.exists() else {}
    new, problems, added = {}, [], 0
    for slug in PAGES:
        f = NOTES / f"{slug}.html"
        if not f.exists():
            continue
        cur = quiz_ids(f.read_text(encoding="utf-8"))
        ids = [q for q, _ in cur]
        dup = sorted({q for q in ids if ids.count(q) > 1})
        if dup:
            problems.append(f"{slug}: 重複的 id {', '.join(dup)}")
        now = dict(cur)
        before = old.get(slug, {})
        for q, lab in before.items():
            if q not in now:
                problems.append(f"{slug}: {q}（原本是 {lab}）不見了")
            elif now[q] != lab:
                problems.append(f"{slug}: {q} 原本是 {lab}，現在是 {now[q]}")
        added += sum(1 for q in now if q not in before)
        new[slug] = now
    if problems and not force:
        print("題目 id 被改動了，這些題目的手寫筆跡和作答紀錄會對不到：", file=sys.stderr)
        for p in problems:
            print("  " + p, file=sys.stderr)
        print("在舊題目前面插新題目時，用 <div data-qid=\"固定的 id\" markdown=\"1\"> 包起來；"
              "確定是故意的（例如只改了題號標籤）再加 --force。", file=sys.stderr)
        return 1
    SNAP.write_text(json.dumps(new, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    total = sum(len(v) for v in new.values())
    print(f"題目 id 檢查通過：{total} 題" + (f"，新增 {added} 題" if added else "") + ("（--force，照現在的重新記錄）" if problems else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(force="--force" in sys.argv[1:]))
