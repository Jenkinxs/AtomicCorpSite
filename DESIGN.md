# Design system — atomiccorp.org

Bold textmode futurism. Print-poster colour, four type voices, live generated graphics,
and almost no prose. The site says what the company does and stops.

## Palette

Sampled from the r/textmodefuturism reference corpus, then pushed louder.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F2E6C9` | Ground. |
| `--paper-3` | `#F8F0DC` | Text on dark fills. |
| `--ink` | `#0C0C08` | Display type, rules, dark bands. |
| `--ink-2` | `#3B382C` | Body. 9.47:1 on paper. |
| `--ink-3` | `#5C5745` | Secondary labels. 5.83:1. |
| `--vermilion` | `#E8401A` | Brand accent: headline word, rules, index numbers. |
| `--vermilion-fill` | `#C73512` | Any fill that carries text. 4.68:1 with paper-3. |
| `--amber` | `#F0A018` | Land on the globe, script accents, hover numerals. |
| `--azure` | `#1F6FEB` | System 02 hover fill. |
| `--azure-fill` | `#1550C4` | Azure when it carries text. 6.21:1. |
| `--olive` | `#4A4A24` | System 03 hover fill. |
| `--teal` | `#23302E` | Globe plate, contact band, flow band. |
| `--sea` | `#6E7B7B` | Muted marks. |

Rule: a fill may only carry text if it is a `-fill` token. Vivid `--vermilion` is for
large display and non-text marks.

## Type

Four faces, four jobs, no overlap.

| Role | Face | Where |
|---|---|---|
| Display | **Anton** | Wordmark, section heads, system names, page titles. |
| Script | **Pinyon Script** | One flourish per page: "for everything you do", "systems", "to us". |
| Serif | **Bodoni Moda** | The deck line. Roman, never italic — that voice belongs to the script. |
| Mono | **Departure Mono** | Nav, labels, data, tags, body of documents. |

All self-hosted woff2, all SIL OFL 1.1. No hosted font stylesheet.

The pairing is the point: condensed grotesque shouted against a delicate script, with
mono as the machine layer underneath.

## Generated graphics

Nothing here is a stock image. Both visuals are drawn at runtime.

**The globe** (`#globe`) is a textmode Earth. A 144×72 land mask, decoded from a 1,728-byte
base64 string embedded in `site.js`, is sampled per character cell and projected
orthographically with a 20° axial tilt. Land is `█` on the limb and `▒` inside, in amber,
with alpha scaled by depth. The graticule is drawn as real strokes — parallels and
meridians every 30°, a vermilion equator, a rim — so the "WIRE MESH" caption is true.
It rotates continuously; under reduced motion it holds one frame.

The mask was rasterised from Natural Earth `land-110m` TopoJSON with longitudes unwrapped
across the antimeridian, which is what removes the horizontal streak artefact.

**The flow band** (`#flow`) is a character field: ~42% of cells seeded with glyphs, drifting
right at per-particle speeds, displaced vertically by a sine wave, coloured from the
palette. It is the "materials moving through the factory" idea as texture.

**The marquee** is duplicated text translated −50% on a 26s loop, with edge fades in the
band colour so the seam never reads as a cut.

## Motion

One entrance: hero elements rise 14px and fade once on load, staggered 60–270ms, from an
already-visible default. Gated behind a `.js` class added in `<head>` so a JS failure
never leaves the page blank.

System rows fill with colour on hover via a `translateY(101%)` pseudo-element on a
0.42s ease. The name grows an arrow. The tag border brightens.

Everything collapses under `prefers-reduced-motion: reduce`; the canvases draw one static
frame instead of looping.

## Browser surfaces

Selection is vermilion on paper-3. Focus is a 3px azure ring at 3px offset. Scrollbars are
vermilion on paper. Numerals are `tabular-nums`.

## Content

Short. Each system is a name and one line. No ledes, no margin notes, no excerpts.
Every fact is real: language, licence, first commit, public/private state, all pulled from
the actual repositories.

Release vocabulary is one axis: **Public**, **GPL-3.0**, **Source**, **Private**.

## What this is not

- No card grid of icon plus heading plus text.
- No gradient text, glass, or soft shadows. The one shadow is a hard offset block, and the
  world earned it.
- No invented metrics, customers, or reviews.
- No contact form that cannot send.
