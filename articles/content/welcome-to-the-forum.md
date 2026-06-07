---
title: Welcome to the Forum
date: 2026-06-06
tags: [meta, writing]
summary: A brief introduction to the AtomicCorp articles section — what it is, how it works, and how to contribute.
---

Welcome to the **AtomicCorp Articles** section. This is a space for writing — notes, guides, manifestos, technical deep-dives, or whatever else comes to mind.

## How It Works

Articles are written in **Markdown** and stored in `articles/content/` as `.md` files. Each file can include YAML frontmatter for metadata:

```yaml
---
title: My Article
date: 2026-06-06
tags: [tech, writing]
summary: A short description for the listing card.
---
```

## The Pipeline

To add an article:

1. Create a `.md` file in `articles/content/`
2. Run `python articles/build.py` to regenerate `articles/data/articles.json`
3. Commit and push — the site automatically picks up the new listing

> The build script reads every markdown file, parses the frontmatter, and produces a single JSON manifest that the frontend loads.

## Writing Tips

- Use `#` for headings, `**bold**` for emphasis
- Code blocks with triple backticks render with monospace
- Links, images, and blockquotes all work
- Tags help categorize — add as many as you want

## Why?

Because sometimes you need more room than a README, and less structure than a documentation site. This is a forum in the original sense — a place for public discourse and record-keeping.

Let's see what gets written.