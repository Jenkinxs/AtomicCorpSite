#!/usr/bin/env python3
"""
AtomicCorp Articles Builder
============================
Reads markdown articles from articles/content/, compiles them into
data/articles.json manifest for the static site.

ARTICLE FORMAT
--------------
Each .md file in articles/content/ should start with YAML frontmatter:

    ---
    title: My Article Title
    date: 2026-06-06
    tags: [tech, linux, writing]
    summary: A short blurb for the listing card.
    ---

    Article body in markdown here...

If no frontmatter is found, the filename is used as the title and
today's date as the date.

USAGE
-----
  python build.py              # builds articles.json
  python build.py --watch      # watches for changes (needs inotify)
  python build.py --help       # show options
"""

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

# Paths relative to this script's location
HERE = Path(__file__).resolve().parent
CONTENT_DIR = HERE / "content"
DATA_DIR = HERE / "data"
MANIFEST = DATA_DIR / "articles.json"

# Ensure directories exist
CONTENT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

FRONTMATTER_RE = re.compile(
    r"^---\s*\n(.*?)\n---\s*\n(.*)", re.DOTALL
)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML-like frontmatter from markdown text.
    
    Returns (metadata dict, body text). Uses a simple line-based parser
    instead of importing pyyaml to keep dependencies minimal.
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text.strip()

    raw = m.group(1)
    body = m.group(2).strip()

    meta = {}
    for line in raw.strip().split("\n"):
        line = line.strip()
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip().lower()
        value = value.strip()

        # Strip quotes
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1]

        # Handle lists like [a, b, c]
        if value.startswith("[") and value.endswith("]"):
            value = [
                v.strip().strip("\"'")
                for v in value[1:-1].split(",")
                if v.strip()
            ]

        meta[key] = value

    return meta, body


def build_manifest() -> list[dict]:
    """Scan content/ directory and build articles list."""
    articles = []

    for md_file in sorted(CONTENT_DIR.glob("*.md"), reverse=True):
        text = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)

        article_id = meta.get("id", md_file.stem)
        title = meta.get("title", md_file.stem.replace("-", " ").title())
        raw_date = meta.get("date", str(date.today()))
        summary = meta.get("summary", "")
        tags = meta.get("tags", [])

        articles.append({
            "id": article_id,
            "title": title,
            "date": raw_date,
            "summary": summary,
            "tags": tags if isinstance(tags, list) else [tags],
            "content": body,
        })

    # Sort by date descending
    articles.sort(key=lambda a: a["date"], reverse=True)
    return articles


def write_manifest(articles: list[dict]):
    """Write the manifest JSON file."""
    MANIFEST.write_text(
        json.dumps(articles, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"✓ Wrote {len(articles)} article(s) to {MANIFEST}")


def main():
    parser = argparse.ArgumentParser(
        description="Build articles.json from markdown sources"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Watch content/ for changes and rebuild",
    )
    args = parser.parse_args()

    articles = build_manifest()
    write_manifest(articles)

    if args.watch:
        try:
            from watchdog.observers import Observer
            from watchdog.events import FileSystemEventHandler
        except ImportError:
            print("⚠  --watch requires `pip install watchdog`. Install it and re-run.")
            sys.exit(1)

        class Rebuilder(FileSystemEventHandler):
            def on_modified(self, event):
                if event.src_path.endswith(".md"):
                    print(f"Change detected: {event.src_path}")
                    arts = build_manifest()
                    write_manifest(arts)

        observer = Observer()
        observer.schedule(
            Rebuilder(), str(CONTENT_DIR.resolve()), recursive=False
        )
        observer.start()
        print(f"Watching {CONTENT_DIR} for changes... (Ctrl+C to stop)")
        try:
            observer.join()
        except KeyboardInterrupt:
            observer.stop()
        observer.join()


if __name__ == "__main__":
    main()
