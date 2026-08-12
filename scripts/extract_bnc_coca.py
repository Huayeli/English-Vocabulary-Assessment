"""Extract the List / Headword / Related forms columns from BNC_COCA_lists.pdf.

The PDF contains the BNC/COCA word-family frequency lists (1k..25k) as tables.
The extraction works in three stages:

1. For every page, read the character-level layout (positions + text runs).
2. Detect each table row from its "1k".."25k" list marker, and rebuild the
   Headword and Related forms cells from character positions.  The PDF has a
   rendering quirk where some glyphs are drawn twice at the same position
   (e.g. the last digit of a frequency or a closing parenthesis), so
   overlapping duplicates are removed before the text is assembled.
3. Validate every row: the frequencies in the Related forms cell must add up
   to the Total frequency column.

Usage:
    python extract_bnc_coca.py [pdf_path] [-o output.json]

Defaults to:
    pdf_path  = BNC_COCA_lists.pdf (same folder as the script)
    output    = BNC_COCA_lists.json
"""

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf

LIST_RE = re.compile(r"^\d{1,2}k$")
TOKEN_VALIDATOR = re.compile(r"([^,\s()]+)\s*\((\d+)\)")
TOKEN_RE = re.compile(r"([A-Za-z][A-Za-z'’\-]*)\s*\((\d+)\)")

# Column boundaries found in the PDF (page coordinates):
#   list column .... x < 85
#   headword ....... starts near x = 88
#   related forms .. starts at x ~ 168 or ~ 241 depending on the page
#   total frequency starts at x ~ 479.5 (first line of each row only)
REL_X_MIN = 160.0
TOTAL_X_MIN = 479.5

NOISE_LINE_RE = re.compile(
    r"^(List\s+Headword|Related\s+fo|Total(\s+[A-Za-z]+)?|"
    r"rms|frequency|BNC/COCA lists|\d{1,4})$"
)


def read_lines(page):
    """Return the page's visual text lines with characters and spans.

    PyMuPDF's rawdict splits one visual line into several entries when text
    runs change; entries with the same vertical position are merged back here.
    """
    data = page.get_text("rawdict")
    raw_lines = []
    for block in data["blocks"]:
        for line in block.get("lines", []):
            y = line["bbox"][1]
            chars = []
            spans = []
            for span in line["spans"]:
                text = "".join(c["c"] for c in span["chars"])
                spans.append((span["bbox"][0], span["bbox"][2], text))
                for ch in span["chars"]:
                    chars.append((ch["origin"][0], ch["origin"][1], ch["c"]))
            raw_lines.append({"y": y, "chars": chars, "spans": spans})
    raw_lines.sort(key=lambda item: item["y"])

    lines = []
    for item in raw_lines:
        if lines and abs(item["y"] - lines[-1]["y"]) < 0.6:
            prev = lines[-1]
            prev["chars"].extend(item["chars"])
            prev["spans"].extend(item["spans"])
            prev["y"] = (prev["y"] + item["y"]) / 2
        else:
            lines.append(dict(item))
    return lines


def is_noise_line(line):
    """True for table headers, page numbers and page footers."""
    text = "".join(c for _x, _y, c in line["chars"]).strip()
    if NOISE_LINE_RE.fullmatch(text):
        return True
    return (
        "Headword" in text
        or "Related" in text
        or text.startswith("Total")
        or text.startswith("List")
    )


def line_list_value(chars):
    """Return the '1k'..'25k' marker of a line, or None if it is not a row."""
    text = "".join(c for x, _y, c in chars if x < 85).strip()
    return text if LIST_RE.match(text) else None


def dedup_chars(chars):
    """Drop glyphs drawn twice at (almost) the same position."""
    chars = sorted(chars, key=lambda ch: (ch[1], ch[0]))
    out = []
    for x, y, c in chars:
        if out:
            px, py, pc = out[-1]
            if c == pc and abs(x - px) < 1.0 and abs(y - py) < 0.6:
                continue
        out.append((x, y, c))
    return out


def assemble(lines, row_y, next_row_y, rel_x0):
    """Rebuild the Headword / Related forms / Total of one table row."""
    head_chars = []
    rel_chars = []
    total_chars = []
    for line in lines:
        if is_noise_line(line):
            continue
        y = line["y"]
        if y < row_y - 0.5 or y >= next_row_y - 0.5:
            continue
        is_first = abs(y - row_y) < 0.5
        for x, _cy, c in line["chars"]:
            if is_first:
                if 85.0 <= x < rel_x0 - 0.25:
                    head_chars.append((x, y, c))
                elif rel_x0 - 0.25 <= x < TOTAL_X_MIN:
                    rel_chars.append((x, y, c))
                elif x >= TOTAL_X_MIN:
                    total_chars.append((x, y, c))
            elif x >= rel_x0 - 0.25:
                rel_chars.append((x, y, c))

    head = "".join(c for _x, _y, c in dedup_chars(head_chars)).strip()
    total = "".join(c for _x, _y, c in dedup_chars(total_chars)).strip()

    rel_lines = {}
    for x, y, c in dedup_chars(rel_chars):
        key = round(y, 1)
        rel_lines.setdefault(key, []).append((x, c))
    line_texts = []
    for key in sorted(rel_lines):
        line_texts.append("".join(c for _x, c in sorted(rel_lines[key])))

    related = ""
    for text in line_texts:
        if not text:
            continue
        if not related:
            related = text
        elif related.endswith(" ") or text.startswith(" "):
            related += text
        elif related.endswith("(") or text[0] in "),.":
            related += text
        else:
            related += " " + text
    related = re.sub(r"\s+", " ", related).strip()
    return head, related, total


def related_x0_candidate(line):
    """Start x of the Related forms text on a row's first line, if visible."""
    spans = sorted(line["spans"], key=lambda s: s[0])
    prev_x1 = None
    for x0, x1, _text in spans:
        if REL_X_MIN <= x0 < TOTAL_X_MIN:
            if prev_x1 is not None and x0 - prev_x1 > 15.0:
                return x0
        prev_x1 = x1
    return None


def frequencies_match(related, total):
    """Check that the Related forms frequencies add up to the Total column."""
    try:
        expected = int(total)
    except ValueError:
        return False
    tokens = [t for t in re.split(r",\s*", related) if t]
    if not tokens:
        return False
    got = 0
    for token in tokens:
        m = TOKEN_VALIDATOR.fullmatch(token)
        if not m:
            return False
        got += int(m.group(2))
    return got == expected


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "pdf",
        nargs="?",
        default=str(script_dir / "BNC_COCA_lists.pdf"),
        help="path to the input PDF",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=str(script_dir / "BNC_COCA_lists.json"),
        help="path of the output JSON file",
    )
    args = parser.parse_args()

    doc = pymupdf.open(args.pdf)
    entries = []
    issues = []
    last_rel_x0 = None
    raw_line_counts = Counter()

    for pno in range(doc.page_count):
        page = doc[pno]
        lines = read_lines(page)
        rows = []  # (line y, list value, candidate x0)
        candidates = []
        for line in lines:
            lst = line_list_value(line["chars"])
            if lst:
                cand = related_x0_candidate(line)
                rows.append((line["y"], lst, cand))
                if cand is not None:
                    candidates.append(cand)
                raw_line_counts[lst] += 1

        if not rows:
            continue

        last_paren_y = None
        for line in lines:
            if is_noise_line(line):
                continue
            text = "".join(c for _x, _y, c in line["chars"])
            if re.search(r"\(\d", text):
                last_paren_y = line["y"]

        if candidates:
            groups = {}
            for cand in candidates:
                groups.setdefault(round(cand, 1), []).append(cand)
            rel_x0 = max(groups.items(), key=lambda kv: len(kv[1]))[1][0]
        elif last_rel_x0 is not None:
            rel_x0 = last_rel_x0
        else:
            rel_x0 = 167.8
        last_rel_x0 = rel_x0

        for idx, (row_y, lst, cand) in enumerate(rows):
            rel_x = cand if cand is not None else rel_x0
            if idx + 1 < len(rows):
                next_y = rows[idx + 1][0]
            elif last_paren_y is not None:
                next_y = last_paren_y + 1.5
            else:
                next_y = page.rect.height
            head, related, total = assemble(lines, row_y, next_y, rel_x)
            if not head:
                issues.append(
                    {"page": pno + 1, "type": "empty-headword", "list": lst}
                )
                continue
            ok = frequencies_match(related, total)
            if not ok:
                issues.append(
                    {
                        "page": pno + 1,
                        "type": "total-mismatch",
                        "list": lst,
                        "headword": head,
                        "total": total,
                        "related": related[:200],
                    }
                )
            entries.append(
                {"list": lst, "headword": head, "related_forms": related}
            )

        if (pno + 1) % 100 == 0:
            print(
                f"progress: page {pno + 1}/{doc.page_count}, "
                f"entries so far: {len(entries)}",
                flush=True,
            )

    page_count = doc.page_count
    doc.close()

    per_list = Counter(e["list"] for e in entries)
    raw_diffs = {
        k: raw_line_counts[k] - per_list[k]
        for k in sorted(raw_line_counts, key=lambda k: int(k[:-1]))
        if raw_line_counts[k] != per_list[k]
    }

    print("SUMMARY", flush=True)
    print(f"pages            : {page_count}", flush=True)
    print(f"entries extracted: {len(entries)}", flush=True)
    print("entries per list :", dict(sorted(per_list.items(), key=lambda kv: int(kv[0][:-1]))), flush=True)
    if raw_diffs:
        print("raw-vs-json diff :", raw_diffs, flush=True)
    else:
        print("raw-vs-json diff : none (row counts match the PDF text)", flush=True)
    output = {
        "source": "BNC/COCA word family lists (BNC_COCA_lists.pdf)",
        "fields": ["list", "headword", "related_forms"],
        "entry_count": len(entries),
        "entries": entries,
    }
    out_path = Path(args.output)
    out_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {out_path} ({out_path.stat().st_size} bytes)", flush=True)

    if issues:
        issue_types = Counter(i["type"] for i in issues)
        print("issues by type   :", dict(issue_types), flush=True)
        for issue in issues[:60]:
            print("issue:", issue, flush=True)
    else:
        print("issues           : none", flush=True)


if __name__ == "__main__":
    sys.exit(main())
