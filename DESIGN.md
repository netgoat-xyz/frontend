# NetGoat frontend-v2 — marketing design

Living design notes for the public pages. Everything here is grounded in the real
product: the screenshots are captured from this app, the copy is written from what
the panel actually does.

## Concept

**Idea.** Color is data. The page is monochrome infrastructure, and green, amber and
red appear only where traffic is: statuses, WAF outcomes, the wire itself.

**Metaphor.** The wire. A single hairline runs down the page like the link between a
visitor and an origin; every section hangs off it.

**Signature.** The panel. A real screenshot of the product inside a browser frame,
anchored to the wire, fading into the page at its bottom edge like it is still running.

**Emotion.** "Infrastructure I can hold." Calm, precise, already up.

**Motion verb.** Settle like a link coming up: quick, eased out, no bounce, nothing
decorative on repeat.

**Screenshot.** The hero panel with `api.example.com` showing Active / Verified /
Auto SSL above the stat row.

## Palette

Roles, all existing tokens — the marketing pages do not invent a second theme.

| Role | Token | Notes |
| --- | --- | --- |
| Ground | `--background` | white / `neutral-950` mix |
| Ink | `--foreground` | `neutral-800` / `neutral-100` |
| Muted | `--muted-foreground` | secondary copy, mono labels |
| Line | `--border` | hairlines, frames, grid |
| Signal | `--success` (emerald) | live dots, healthy status, the wire pulse |
| Alert | `--warning` (amber), `--destructive` (red) | challenged and blocked traffic |

## Type

Two families, both already loaded by `app/layout.tsx` — no extra bytes.

- **Inter** (`font-sans`, `font-heading`) for every piece of prose and display type.
  Display sizes get negative tracking (`-0.02em` at 32px, `-0.035em` at 56px+).
- **Geist Mono** (`font-mono`) for spec strips, terminal, metric labels, anything that
  names a machine. Mono is the "instrument" voice.

Fluid display scale: `clamp(2.5rem, 6vw, 4.5rem)` for the hero, `clamp(1.75rem, 3.5vw, 2.5rem)`
for section headings. Body 16–18px, 1.55 leading.

## Grid and rhythm

- Container `max-w-[75rem]` (1200px), gutters 24px desktop / 20px mobile.
- Sections are separated by hairlines, not by huge gaps: the page reads as one
  instrument, and each band changes layout family (full-bleed panel, bento grid,
  wire steps, split code, logo wall).

## Shape

One radius rule: outer surfaces `rounded-2xl` (matches the product's cards), inner
elements one step smaller so radii stay concentric. The browser frame adds 6px of
padding around a `rounded-xl` viewport.

## Motion

All timing comes from the motion tokens in `app/globals.css`.

| Moment | Motion |
| --- | --- |
| Hero entrance | staggered rise, 40ms apart, `--duration-slow`, `--ease-smooth-out` |
| Section reveal on scroll | opacity + 8px rise, `--duration-slow`, once |
| Wire draw | the hairline scales in, status dot pops at `--duration-very-slow` |
| Card hover | border and shadow only, `--duration-quick` |
| Buttons | press scale .97, `--duration-quick` |

Nothing loops. No parallax. `prefers-reduced-motion` removes the movement and keeps
color transitions.

## Copy rules

- Sentence case, specific nouns, no filler verbs, no em dashes in visible text.
- Numbers only when they are true (screenshot values come from the running panel).
- No invented customers, awards or metrics. The logo wall is labelled Integrations,
  because that is what those logos are.
