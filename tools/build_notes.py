"""把 notes/src/*.md 轉成 notes/*.html。

用法：python3 tools/build_notes.py
需要：pip install markdown pymdown-extensions
Markdown 語法：
  - 數學：$...$、$$...$$
  - 例題框：!!! example "標題"（內容縮排 4 格）
  - 重點框：!!! key "標題"；陷阱框：!!! trap "標題"
  - 小考答案（可折疊、可記錄對錯）：??? quiz "看答案"（內容縮排 4 格）
  - 標題錨點：## 單元 1：計數 {#u1}
"""
import pathlib, re, sys, html
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "notes" / "src"
OUT = ROOT / "notes"

PAGES = [
    ("method", "學習方法"),
    ("discrete", "離散數學"),
    ("arch", "計算機結構"),
    ("os", "作業系統"),
    ("ds", "資料結構"),
]

TEMPLATE = (ROOT / "tools" / "notes_template.html").read_text(encoding="utf-8")

# 一次只顯示一個單元的頁面（學習方法頁不用切）
SPLIT = {"discrete", "arch", "os", "ds"}

# 內文裡的 ✓ ✗ ★ 換成自己畫的 SVG 圖示（手機上 emoji 字型長得不一樣）
_SVG = ('<svg class="ico {cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" '
        'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">{d}</svg>')
ICONS = {
    "✓": ("ico-ok", '<path d="M5 12.5l4.5 4.5L19 7.5"/>', "對"),
    "✗": ("ico-no", '<path d="M7 7l10 10M17 7L7 17"/>', "錯"),
    "★": ("ico-star", '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8z" fill="currentColor" stroke-width="1.2"/>', ""),
}
_SKIP = re.compile(r'(<(script|pre|code|style)\b.*?</\2>|<(span|div) class="arithmatex">.*?</\3>)', re.S)


def iconize(html_text):
    """把數學式、程式碼以外的 ✓ ✗ ★ 換成 SVG。"""
    out, last = [], 0
    for m in _SKIP.finditer(html_text):
        out.append(_icon_text(html_text[last:m.start()]))
        out.append(m.group(0))
        last = m.end()
    out.append(_icon_text(html_text[last:]))
    return "".join(out)


def _icon_text(s):
    for ch, (cls, d, label) in ICONS.items():
        svg = _SVG.format(cls=cls, d=d)
        if label:
            svg = svg.replace('aria-hidden="true"', f'role="img" aria-label="{label}"')
        s = s.replace(ch, svg)
    return s


def sectionize(body):
    """每個 <h2> 到下一個 <h2> 之前包成一個 <section class="unit">；h1 和開頭介紹併進第一節。"""
    parts = re.split(r'(?=<h2[ >])', body)
    if len(parts) < 3:
        return body
    head, rest = parts[0], parts[1:]
    out = []
    for i, p in enumerate(rest):
        m = re.match(r'<h2[^>]*\bid="([^"]+)"', p)
        sid = m.group(1) if m else f"s{i}"
        if i == 0:
            p = head + p
        out.append(f'<section class="unit" data-unit="{sid}">\n{p}\n</section>')
    return "\n".join(out)

def pad_display_math(text):
    """單行的 $$...$$ 前後補空行，否則在段落或框內會被當成行內數學。"""
    out = []
    lines = text.split("\n")
    for i, line in enumerate(lines):
        s = line.strip()
        is_block = s.startswith("$$") and s.endswith("$$") and len(s) > 4
        if is_block and out and out[-1].strip():
            out.append("")
        out.append(line)
        if is_block and i + 1 < len(lines) and lines[i + 1].strip():
            out.append("")
    return "\n".join(out)


def build(slug, label):
    src = pad_display_math((SRC / f"{slug}.md").read_text(encoding="utf-8"))
    m = re.match(r"^#\s+(.+)\n", src)
    title = m.group(1).strip() if m else label
    md = markdown.Markdown(extensions=[
        "tables", "attr_list", "md_in_html", "admonition", "toc", "fenced_code",
        "pymdownx.details", "pymdownx.arithmatex", "pymdownx.superfences", "sane_lists",
    ], extension_configs={
        "pymdownx.arithmatex": {"generic": True},
        "toc": {"toc_depth": "2-2", "permalink": False},
    })
    body = iconize(md.convert(src))
    split = slug in SPLIT
    if split:
        body = sectionize(body)
    nav = "".join(
        f'<a href="{s}.html"{" aria-current=\"page\"" if s == slug else ""}>{html.escape(l)}</a>'
        for s, l in PAGES
    )
    page = (TEMPLATE.replace("{{TITLE}}", html.escape(title))
                    .replace("{{SLUG}}", slug)
                    .replace("{{SPLIT}}", "1" if split else "0")
                    .replace("{{NAV}}", nav)
                    .replace("{{TOC}}", md.toc)
                    .replace("{{BODY}}", body))
    (OUT / f"{slug}.html").write_text(page, encoding="utf-8")
    print("built", slug, len(page))

if __name__ == "__main__":
    for slug, label in PAGES:
        if (SRC / f"{slug}.md").exists():
            build(slug, label)
        else:
            print("skip", slug, file=sys.stderr)
