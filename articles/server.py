#!/usr/bin/env python3
"""
AtomicCorp Articles Server
===========================
FastAPI backend with SQLite for dynamic article management.

Provides:
  - POST   /api/articles      Create a new article
  - GET    /api/articles      List all articles (with pagination)
  - GET    /api/articles/<id>  Get a single article by ID
  - PUT    /api/articles/<id>  Update an article
  - DELETE /api/articles/<id>  Delete an article
  - GET    /api/tags          List all unique tags with counts
  - GET    /api/search?q=     Full-text search across title/summary/content

Two operational modes:
  1) STANDALONE SERVER (default) — runs its own FastAPI/Uvicorn server.
     Access the API at http://localhost:8742/api/articles
     Access the article editor at http://localhost:8742/editor

  2) CGI/FastCGI — can be mounted behind nginx as a sub-path.

The server stores articles in a SQLite database at articles/data/articles.db.
It can also optionally write articles.json for compatibility with the static site.

Start with:
  python articles/server.py           # default port 8742
  python articles/server.py --port 8080
  python articles/server.py --sync    # also writes articles.json after every change
"""

import argparse
import json
import os
import sqlite3
import sys
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
DB_PATH = DATA_DIR / "articles.db"
MANIFEST = DATA_DIR / "articles.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)


# ── Database setup ──────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS articles (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            date        TEXT NOT NULL DEFAULT (date('now')),
            summary     TEXT DEFAULT '',
            tags        TEXT DEFAULT '[]',
            content     TEXT NOT NULL,
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);

        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
            title, summary, content,
            content=articles, content_rowid=rowid
        );

        -- Triggers to keep FTS in sync
        CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
            INSERT INTO articles_fts(rowid, title, summary, content)
            VALUES (new.rowid, new.title, new.summary, new.content);
        END;

        CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, summary, content)
            VALUES ('delete', old.rowid, old.title, old.summary, old.content);
        END;

        CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, summary, content)
            VALUES ('delete', old.rowid, old.title, old.summary, old.content);
            INSERT INTO articles_fts(rowid, title, summary, content)
            VALUES (new.rowid, new.title, new.summary, new.content);
        END;
    """)
    conn.commit()
    conn.close()


# ── Pydantic models ─────────────────────────────────────────────────────────

class ArticleCreate(BaseModel):
    id: Optional[str] = None
    title: str
    date: Optional[str] = None
    summary: str = ""
    tags: list[str] = Field(default_factory=list)
    content: str


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[list[str]] = None
    content: Optional[str] = None


class ArticleOut(BaseModel):
    id: str
    title: str
    date: str
    summary: str
    tags: list[str]
    content: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    import re
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "untitled"


def row_to_article(row: sqlite3.Row) -> dict:
    tags = json.loads(row["tags"]) if isinstance(row["tags"], str) else (row["tags"] or [])
    print(tags, file=sys.stderr)
    return {
        "id": row["id"],
        "title": row["title"],
        "date": row["date"],
        "summary": row["summary"],
        "tags": tags,
        "content": row["content"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def sync_manifest(conn: sqlite3.Connection):
    """Write articles.json for static site compatibility."""
    rows = conn.execute(
        "SELECT id, title, date, summary, tags, content, created_at, updated_at "
        "FROM articles ORDER BY date DESC"
    ).fetchall()
    articles = [row_to_article(r) for r in rows]
    MANIFEST.write_text(json.dumps(articles, indent=2, ensure_ascii=False), encoding="utf-8")


# ── Application ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AtomicCorp Articles API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYNC_MANIFEST = False  # set via --sync


# ── API Routes ──────────────────────────────────────────────────────────────

@app.get("/api/articles", response_model=list[ArticleOut])
def list_articles(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    tag: Optional[str] = None,
):
    conn = get_db()
    offset = (page - 1) * per_page

    if tag:
        rows = conn.execute(
            "SELECT id, title, date, summary, tags, content, created_at, updated_at "
            "FROM articles WHERE tags LIKE ? ORDER BY date DESC LIMIT ? OFFSET ?",
            (f"%{tag}%", per_page, offset),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, title, date, summary, tags, content, created_at, updated_at "
            "FROM articles ORDER BY date DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        ).fetchall()

    articles = [row_to_article(r) for r in rows]
    conn.close()
    return articles


@app.get("/api/articles/{article_id}", response_model=ArticleOut)
def get_article(article_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT id, title, date, summary, tags, content, created_at, updated_at "
        "FROM articles WHERE id = ?", (article_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return row_to_article(row)


@app.post("/api/articles", response_model=ArticleOut, status_code=201)
def create_article(article: ArticleCreate):
    article_id = article.id or slugify(article.title)
    article_date = article.date or str(date.today())
    tags_json = json.dumps(article.tags)

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO articles (id, title, date, summary, tags, content) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (article_id, article.title, article_date, article.summary, tags_json, article.content),
        )
        conn.commit()

        row = conn.execute(
            "SELECT id, title, date, summary, tags, content, created_at, updated_at "
            "FROM articles WHERE id = ?", (article_id,)
        ).fetchone()

        if SYNC_MANIFEST:
            sync_manifest(conn)

        conn.close()
        return row_to_article(row)

    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(
            status_code=409,
            detail=f"Article with id '{article_id}' already exists",
        )


@app.put("/api/articles/{article_id}", response_model=ArticleOut)
def update_article(article_id: str, update: ArticleUpdate):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM articles WHERE id = ?", (article_id,)
    ).fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Article not found")

    updates = {}
    if update.title is not None:
        updates["title"] = update.title
    if update.date is not None:
        updates["date"] = update.date
    if update.summary is not None:
        updates["summary"] = update.summary
    if update.tags is not None:
        updates["tags"] = json.dumps(update.tags)
    if update.content is not None:
        updates["content"] = update.content

    if updates:
        updates["updated_at"] = "datetime('now')"
        set_clause = ", ".join(
            f"{k} = ?" if k != "updated_at" else f"{k} = {v}"
            for k, v in updates.items()
        )
        params = [v for k, v in updates.items() if k != "updated_at"]
        params.append(article_id)
        conn.execute(
            f"UPDATE articles SET {set_clause} WHERE id = ?",
            params,
        )
        conn.commit()

    row = conn.execute(
        "SELECT id, title, date, summary, tags, content, created_at, updated_at "
        "FROM articles WHERE id = ?", (article_id,)
    ).fetchone()

    if SYNC_MANIFEST:
        sync_manifest(conn)

    conn.close()
    return row_to_article(row)


@app.delete("/api/articles/{article_id}", status_code=204)
def delete_article(article_id: str):
    conn = get_db()
    cur = conn.execute("DELETE FROM articles WHERE id = ?", (article_id,))
    conn.commit()

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Article not found")

    if SYNC_MANIFEST:
        sync_manifest(conn)

    conn.close()


@app.get("/api/tags")
def list_tags():
    conn = get_db()
    rows = conn.execute("SELECT tags FROM articles").fetchall()
    conn.close()

    tag_counts: dict[str, int] = {}
    for row in rows:
        tag_list = json.loads(row["tags"]) if row["tags"] else []
        for tag in tag_list:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    return sorted(
        [{"tag": k, "count": v} for k, v in tag_counts.items()],
        key=lambda t: (-t["count"], t["tag"]),
    )


@app.get("/api/search")
def search_articles(q: str = Query(..., min_length=1)):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT a.id, a.title, a.date, a.summary, a.tags, a.content, a.created_at, a.updated_at "
            "FROM articles a "
            "JOIN articles_fts fts ON a.rowid = fts.rowid "
            "WHERE articles_fts MATCH ? "
            "ORDER BY rank "
            "LIMIT 50",
            (q,),
        ).fetchall()
    except sqlite3.OperationalError:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid search query")
    conn.close()
    return [row_to_article(r) for r in rows]


# ── Main ────────────────────────────────────────────────────────────────────

def serve_static(app: FastAPI):
    """Mount static file serving for articles/ directory."""
    articles_dir = str(HERE.resolve())
    static_dir = str(HERE.parent.resolve())

    # Serve the articles directory itself
    app.mount("/articles", StaticFiles(directory=articles_dir, html=True), name="articles")
    # Also serve from root so /articles/ paths work
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="root")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AtomicCorp Articles Server")
    parser.add_argument("--port", type=int, default=8742, help="Port to listen on")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--sync", action="store_true", help="Sync to articles.json on every change")
    args = parser.parse_args()

    if args.sync:
        SYNC_MANIFEST = True

    try:
        import uvicorn
    except ImportError:
        print("⚠  Need uvicorn: pip install uvicorn")
        sys.exit(1)

    serve_static(app)
    print(f"✦ Articles server running at http://{args.host}:{args.port}/articles/")
    print(f"  API:       http://{args.host}:{args.port}/api/articles")
    print(f"  Editor:    http://{args.host}:{args.port}/articles/editor.html")
    print(f"  Sync JSON: {'yes' if SYNC_MANIFEST else 'no'}")
    uvicorn.run(app, host=args.host, port=args.port)
