"""
Step 0.10 — Regex validation against the 3 fixture files.
Classifies every line, reports failures, appends results to docs/format-research.md.
"""

import re
import os
import sys
from dataclasses import dataclass, field
from typing import Literal

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# iOS group / iOS individual: M/D/YY, H:MM AM|PM
IOS_TS = r"\d{1,2}/\d{1,2}/\d{2},\s+\d{1,2}:\d{2}\s+[AP]M"

# Android individual: DD/MM/YYYY, HH:MM  (24-hour, 4-digit year)
ANDROID_TS = r"\d{2}/\d{2}/\d{4},\s+\d{2}:\d{2}"

TS_PATTERN = rf"(?:{IOS_TS}|{ANDROID_TS})"

# Full message line: TIMESTAMP - SENDER: body
MSG_RE = re.compile(
    rf"^({TS_PATTERN})\s+-\s+(.+?):\s+(.*)$"
)

# System/event line: TIMESTAMP - event text  (no "Sender: " separator)
SYS_RE = re.compile(
    rf"^({TS_PATTERN})\s+-\s+(.+)$"
)

# Android header: plain encryption notice with NO timestamp
ANDROID_HEADER_RE = re.compile(
    r"^Messages and calls are end-to-end encrypted\."
)


LineKind = Literal["message", "system", "continuation", "blank", "header"]


@dataclass
class ParsedLine:
    lineno: int
    raw: str
    kind: LineKind
    sender: str = ""
    body: str = ""
    failure_reason: str = ""


@dataclass
class FileResult:
    path: str
    lines: list[ParsedLine] = field(default_factory=list)

    @property
    def failures(self):
        return [l for l in self.lines if l.failure_reason]

    def counts(self):
        from collections import Counter
        return Counter(l.kind for l in self.lines)


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------

def classify_line(lineno: int, raw: str, prev_kind: LineKind | None) -> ParsedLine:
    stripped = raw.rstrip("\n")

    if stripped == "":
        return ParsedLine(lineno, stripped, "blank")

    # Android-style plain header (no timestamp)
    if ANDROID_HEADER_RE.match(stripped):
        return ParsedLine(lineno, stripped, "header")

    m = MSG_RE.match(stripped)
    if m:
        return ParsedLine(lineno, stripped, "message", sender=m.group(2), body=m.group(3))

    m = SYS_RE.match(stripped)
    if m:
        return ParsedLine(lineno, stripped, "system")

    # No timestamp => continuation of previous message or file header
    if lineno == 1:
        return ParsedLine(lineno, stripped, "header")

    # Continuation line (belongs to the preceding multi-line message)
    return ParsedLine(lineno, stripped, "continuation")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def test_fixture(path: str) -> FileResult:
    result = FileResult(path=path)
    prev_kind: LineKind | None = None
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, start=1):
            pl = classify_line(lineno, raw, prev_kind)
            # A continuation is only valid after message, system, or another continuation
            if pl.kind == "continuation" and prev_kind not in (
                "message", "system", "continuation", "header", "blank", None
            ):
                pl.failure_reason = (
                    f"Continuation on line {lineno} follows unexpected kind '{prev_kind}'"
                )
            result.lines.append(pl)
            prev_kind = pl.kind
    return result


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

FIXTURE_NAMES = ["ios-group.txt", "ios-indiv.txt", "android-indiv.txt"]


def run_tests(fixtures_dir: str) -> list[FileResult]:
    results = []
    for name in FIXTURE_NAMES:
        path = os.path.join(fixtures_dir, name)
        if not os.path.exists(path):
            print(f"MISSING: {path}", file=sys.stderr)
            sys.exit(1)
        results.append(test_fixture(path))
    return results


def build_report(results: list[FileResult]) -> str:
    lines = []
    lines.append("\n---\n")
    lines.append("## Step 0.10 — Regex Test Results\n")

    total_failures = 0
    for r in results:
        counts = r.counts()
        failures = r.failures
        total_failures += len(failures)
        status = "PASS" if not failures else f"FAIL ({len(failures)} failures)"
        lines.append(f"### {os.path.basename(r.path)} — {status}\n")
        lines.append(f"| Kind | Count |\n|---|---|\n")
        for kind in ("message", "system", "continuation", "blank", "header"):
            lines.append(f"| {kind} | {counts.get(kind, 0)} |\n")
        lines.append(f"| **total** | {len(r.lines)} |\n")
        lines.append("\n")
        if failures:
            lines.append("**Failure details:**\n\n")
            for f in failures:
                lines.append(f"- Line {f.lineno}: `{f.raw[:80]}` — {f.failure_reason}\n")
            lines.append("\n")

    if total_failures == 0:
        lines.append(
            "**Overall result: PASS — 0 unresolved failures across all 3 fixture files.**\n"
        )
    else:
        lines.append(
            f"**Overall result: FAIL — {total_failures} failures. Resolve before proceeding.**\n"
        )
    return "".join(lines)


def append_to_format_research(report: str, docs_dir: str):
    path = os.path.join(docs_dir, "format-research.md")
    with open(path, encoding="utf-8") as f:
        content = f.read()

    # Remove any previously appended Step 0.10 section to avoid duplicates
    content = re.sub(
        r"\n---\n## Step 0\.10.*", "", content, flags=re.DOTALL
    ).rstrip() + "\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(content + report)

    print(f"Results appended to {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixtures_dir = os.path.join(base, "docs", "fixtures")
    docs_dir = os.path.join(base, "docs")

    results = run_tests(fixtures_dir)
    total_failures = sum(len(r.failures) for r in results)

    for r in results:
        counts = r.counts()
        status = "PASS" if not r.failures else f"FAIL ({len(r.failures)} failures)"
        print(f"{os.path.basename(r.path)}: {status} | "
              f"msg={counts.get('message',0)} sys={counts.get('system',0)} "
              f"cont={counts.get('continuation',0)}")

    report = build_report(results)
    append_to_format_research(report, docs_dir)

    if total_failures:
        sys.exit(1)
    else:
        print("All fixtures passed.")
