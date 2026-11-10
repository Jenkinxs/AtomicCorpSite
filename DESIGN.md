# Design system — atomiccorp.org

The site is a **systems catalogue**: every page is a numbered plate from a technical
document. It borrows the visual language of r/textmodefuturism — character-cell grids,
monospace type, hard registration marks, dithered fills, spec-sheet density — and applies
it as an interface system rather than as decoration.

## Why this world

The company sells small, specific software and then operates it. A parts catalogue is the
honest metaphor: each system is an entry with a designation, a function, a licence, and a
release state. Nothing is a platform, so nothing is presented as one.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#EFE3C8` | Ground. Sampled from the reference corpus. |
| `--paper-lift` | `#F5ECD8` | Raised surfaces, figure plates, row hover. |
| `--paper-deep` | `#E6D8B8` | Inline code, active nav cell. |
| `--ink` | `#12110C` | Primary text, rules, plate frames. |
| `--ink-2` | `#4A473A` | Body copy. 7.32:1 on paper. |
| `--ink-3` | `#5E5946` | Secondary labels. 5.51:1. |
| `--ink-4` | `#6B6550` | Tertiary numerals, leaders. 4.58:1. |
| `--rule` | `#CDBF9C` | Hairline row dividers. |
| `--rule-strong` | `#B3A47E` | Structural dividers. |
| `--olive` | `#4F4E28` | Isometric side faces, copyleft state. |
| `--olive-lt` | `#8A8758` | Public state dot. |
| `--accent` | `#C1500E` | Fills, rules, large display. |
| `--accent-ink` | `#A8430A` | Accent text at small sizes. 4.75:1. |
| `--signal` | `#0B4FD8` | Focus rings only. |

Contrast is verified, not eyeballed. `--accent` at 3.73:1 is never used for small text;
`--accent-ink` exists for that.

## Type

One face: **Departure Mono** (SIL OFL 1.1), self-hosted, 22 KB woff2.

Hierarchy comes from scale, case, tracking, and colour — never from a second family.
Display is uppercase at `clamp(40px, 6.6vw, 96px)` with `-0.035em` tracking. Micro labels
are 10.5px at `0.18em`. Body is 15px / 1.62, measure capped at 44ch in the masthead and
`64ch` in documents.

Monospace is earned here: the content is genuinely data — model codes, licences, commit
dates, port numbers.

## Plate apparatus

- `.plate` — a section bounded by a rule, carrying `.plate-head` (number, rule, folio).
- `.plate-corners` — registration crosses at two corners, drawn from an inline SVG data URI.
- `.figplate` — a framed figure with a solid ink header bar, a gridded stage, and a footer.
- `.cat` — datasheet table with `colgroup` widths, tabular numerals, top-aligned cells.
- `.ledger` — article index; date rail, title, summary, arrow.
- `.chan` — channel list with dotted leaders.
- `.doc` — long-form measure for policy and article bodies.

Heavy rules (1px ink) start a list or table. Light rules (`--rule`) divide rows. That
grammar is consistent across every page.

## Motion

One authored moment: the masthead elements enter once on load, staggered 70 ms, from an
already-visible default via `cubic-bezier(0.16, 1, 0.3, 1)`.

The flow diagram's input connectors run a dashed stroke animation, paused until the figure
is in view. Nothing moves on scroll otherwise. No parallax, no card fades, no tilt.

All of it collapses under `prefers-reduced-motion: reduce`.

## Browser surfaces

Selection is accent-on-paper-lift. Focus is a 2px signal-blue ring at 3px offset. The
caret is accent-coloured. Scrollbars are themed `--rule-strong` on `--paper`. Numerals in
tables are `tabular-nums`.

## What this deliberately is not

- No card grid of icon-plus-heading-plus-text.
- No eyebrow above a heading.
- No gradient text, glass, or zero-blur offset shadows.
- No invented metrics, reviews, or customers. Every number on the site is derived from a
  real repository: language, licence, first-commit date, public/private state.
- No contact form that cannot send. The contact page gives an address and a working
  `mailto:` action instead.

## Content rules

Model codes (`AT-2025`, `SN-2026`) tie the catalogue table to the flow diagram so the two
figures cross-reference. Release vocabulary is one axis only: **Public** (repository and
licence), **Source** (repository only), **Private** (not distributed).
