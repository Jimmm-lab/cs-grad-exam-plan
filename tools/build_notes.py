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
    body = md.convert(src)
    nav = "".join(
        f'<a href="{s}.html"{" aria-current=\"page\"" if s == slug else ""}>{html.escape(l)}</a>'
        for s, l in PAGES
    )
    page = (TEMPLATE.replace("{{TITLE}}", html.escape(title))
                    .replace("{{SLUG}}", slug)
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
