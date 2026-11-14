# Design system — atomiccorp.org

Dark cyberpunk textmode. Near-black green ground, phosphor chrome, one hot orange accent,
cream kept for type. Four type voices, two live canvases, and pixel hardware.

## Palette

The ground moved from cream to a green-black; cream survives as the type and as highlight
fills. That is the "less beige, still around" balance.

| Token | Value | Use |
|---|---|---|
| `--void` | `#060A07` | Ground. |
| `--void-2` | `#0B120D` | Bands, contact section. |
| `--void-3` | `#111B14` | Row hover. |
| `--green-2` | `#2F4429` | Hairline dividers. |
| `--moss` | `#6B8F3A` | Globe interior, secondary labels. |
| `--acid` | `#A8E05F` | Phosphor chrome, globe limb, active marks. |
| `--olive` | `#4A5A22` | Floppy body. |
| `--paper` | `#E8DFC4` | Primary type. |
| `--paper-2` | `#D6CAA9` | Body copy. |
| `--paper-3` | `#F4EDD8` | Display headings. |
| `--orange` | `#FF5510` | The one accent: headline word, numbers, fills. |
| `--blue` | `#1F6FFF` | Glitch fringe only. |
| `--amber` | `#F0A018` | Row accent. |

Everything on the dark ground is cream or acid. Orange is reserved for emphasis so it never
has to compete with itself.

## Type

| Role | Face | Where |
|---|---|---|
| Display | **Michroma Ultra Alt** | Wordmark, section heads, system names, page titles. |
| Script | **Pinyon Script** | One flourish per page. |
| Serif | **Bodoni Moda** | The deck line. Roman. |
| Mono | **Departure Mono** | Nav, labels, data, document body. |

All self-hosted woff2, SIL OFL 1.1. See `assets/fonts/FONTS.md`.

## Generated graphics

**The globe** is the hero background, not an ornament. A 144×72 land mask, rasterised from
Natural Earth `land-110m` TopoJSON with longitudes unwrapped across the antimeridian, is
embedded as 1,728 bytes of base64 and projected orthographically with a 20° axial tilt. The
radius is `max(W,H) × 0.74` so the sphere bleeds past every edge of the hero. Land is amber-
green block characters at the limb and mid-tone shade inside; ocean is a sparse dot lattice,
so the entire disc is made of characters. The graticule is stroked lines, the equator is
orange.

**The glyph storm** runs in two places. A fixed full-viewport canvas behind the content
carries a medium-density field; a second canvas inside the hero runs at roughly double
density and 1.25× scale so the symbols are unmistakable there. Both drift, flicker, and wrap.

**The floppies** are 48×48 SVG drawn with `shape-rendering: crispEdges`, so scaling to
~150px gives hard pixel edges with no interpolation.

**Horizontal lines** come from `.bands` (drifting sweep lines under the content), the CRT
`.scanlines` overlay at `z-index: 60`, and the hairline row dividers.

## Layer order

```
#glyphs        fixed, z 1   page-wide character field
main           z 2          content; sections are semi-transparent so glyphs ghost through
  .hero
    .hero-art  z 0         7Plague.jpg, green-shifted, 0.32 opacity
    #globe     z 1         textmode Earth
    #heroGlyphs z 2        dense character field
    .bands     z 1
    .floppy    z 2
    .shell     z 2         type, with a radial scrim so it always wins
.vignette      fixed, z 55
.scanlines     fixed, z 60
```

The hero scrim is deliberately asymmetric — strong behind the text column, clear on the
right — so the globe reads at full strength where there is no type.

## Motion

The globe rotates continuously with a slow radial breath. The glyph fields drift and flicker.
The headline jitters every few seconds via a stepped transform. Nav and system rows scramble
their text on hover using the character-cycling effect from the original site. Bands sweep.

One entrance: hero elements rise and fade once, staggered, gated behind a `.js` class set in
`<head>` so a script failure never leaves the page blank.

All of it collapses under `prefers-reduced-motion: reduce`; canvases draw a single frame.

## Navbar

Two tiers. The upper bar carries the mark, bracketed nav tokens `[ SYSTEMS ] [ LOG ] [ NET ]
[ MAIL ]`, a live clock with a blinking block cursor, and the scramble hover. The lower strip
carries system telemetry — node, link state, revision. It is meant to read as a console, not
a menu.

## Content

Each system is a name and one line. No ledes, no excerpts, no marquee. Every fact is real:
language, licence, first commit, public/private state, all pulled from the repositories.

## What this is not

- No scrolling ticker advertising the products. That was removed on request.
- No gradient text or glass. The glitch fringe is a 2px RGB offset at low opacity, not a fill.
- No invented metrics or claims.
- No contact form that cannot send.

## Tuning the glyph storm

All of it is one object at the top of `assets/site.js`: `GLYPH_CONFIG`.

| Key | Default | Effect |
|---|---|---|
| `count` | `220` | Upper cap on symbols. Actual count also scales with viewport area and is clamped to 30 minimum. |
| `speed` | `1` | Drift multiplier. `0` freezes them, `2` doubles it. |
| `sizeMin` / `sizeMax` | `11` / `26` | Font size range in px. |
| `alphaMin` / `alphaMax` | `0.16` / `0.66` | Opacity range; raised by the flicker pulse. |
| `colors` | acid, orange, blue, paper, amber, moss | Any subset of the palette keys. |
| `glyphs` | brackets, math, block-drawing | The character set drawn from. |
| `glow` | `false` | Soft halo behind each symbol. |
| `density` | `11000` | Page-wide field. Lower = denser. |
| `heroDensity` | `5200` | Hero field. |
| `heroScale` | `1.25` | Size multiplier for the hero field. |

### Scroll-driven wind

The field is calm at the top of the page and turns into a hard left-to-right storm as you
scroll. Scroll progress `t` (0 at top, 1 at bottom) drives it:

| Key | Default | Effect |
|---|---|---|
| `windStart` | `0.05` | Progress at which the wind begins to bite. |
| `scrollWind` | `9` | Horizontal px per frame at full scroll. |
| `scrollDamp` | `0.92` | How much the random drift is suppressed at full scroll, so the storm reads as one direction rather than noise. |
| `streak` | `4` | Trailing ghost copies behind each symbol. |
| `stretch` | `1.1` | Horizontal speed smear; `0` disables it. |

At full scroll each glyph is drawn with a solid horizontal tail plus four fading echoes, so
the vertical character lattice blurs into horizontal banding — the "forceful storm" reading.

Inspect a state without scrolling by pinning progress:

```js
ATX.glyphs({ progress: 0.95 })   // full storm
ATX.glyphs({ progress: 0 })      // calm
ATX.glyphs({ progress: null })   // back to real scroll position
ATX.debug()                      // { progress, redraws, wind, ghosts, stretch }
```

Edit and reload. To tweak a live page, open the console:

```js
ATX.glyphs({ count: 400, speed: 2, colors: ["orange"], glow: true })
```

It mutates the config in place and rebuilds both canvases immediately, so you can dial it in
by eye and then copy the winning values back into `GLYPH_CONFIG`.
