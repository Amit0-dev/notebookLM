---
name: ShelfLM
description: Inkan Seal Desk — washi ground, sumi ink, vermilion seal for operate surfaces
colors:
  washi: "#F4EFE6"
  sumi: "#1A1A1A"
  vermilion: "#C23A2B"
  vermilion-ink: "#FFF8F0"
  paper-secondary: "#E8DFD0"
  ink-faint: "#8B7355"
  border-rule: "#D4CBB8"
  amber-cue: "#C9A227"
  muted-wash: "#EBE4D7"
typography:
  display:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  brand:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
  meta:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.65rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
  seal:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  seal: "0px"
  control: "2px"
spacing:
  column: "420px"
  column-pad: "24px"
  canvas: "1440px"
  canvas-pad: "48px"
  section: "40px"
  cluster: "12px"
components:
  button-seal:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
    rounded: "{rounded.control}"
    height: "48px"
    width: "100%"
  button-seal-hover:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
  mode-tab-active:
    textColor: "{colors.sumi}"
  mode-tab-idle:
    textColor: "{colors.ink-faint}"
---

# Design System: ShelfLM

## Overview

**Creative North Star: "Inkan Seal Desk"**

ShelfLM’s operate UI is a Japanese desk ritual: washi paper ground, sumi ink text, and a vermilion seal for decisive acts. Identity and primary actions feel like pressing a hanko — deliberate, square, and rare — not like a floating SaaS card.

Surfaces share one fixed measure. Content aligns to a single left edge inside a centered column. Ornament is sparse: hairline rules, one amber step cue on the primary action, and the vermilion seal mark.

**Key Characteristics:**
- Fixed 420px content column with shared left alignment
- Washi / sumi / vermilion palette (restrained neutrals + one seal accent)
- Work Sans for brand, headings, and body; JetBrains Mono for meta labels
- Near-square geometry; hairline dividers instead of cards
- Seal-press motion reserved for the primary auth action
- Light = washi desk; Dark = lacquer night desk (warm ink black, same vermilion seal)

## Colors

Warm paper neutrals with one vermilion voice for seals and primary CTAs. Amber marks the active step only.

### Primary
- **Vermilion Seal** (#C23A2B): Primary buttons, hanko mark, error stamp borders. Rare on purpose.

### Secondary
- **Amber Cue** (#C9A227): Single step marker on the primary action; focus ring accent.

### Neutral
- **Washi** (#F4EFE6): Page ground
- **Sumi** (#1A1A1A): Headings and primary text
- **Ink Faint** (#8B7355): Supporting copy and idle tabs
- **Paper Secondary** (#E8DFD0): Soft washes / secondary fills
- **Rule** (#D4CBB8): Hairline borders and dividers

### Named Rules
**The Seal Rarity Rule.** Vermilion appears on the seal mark, the primary CTA, and failure stamps — not as decoration across the page.

## Typography

**Display Font:** Work Sans (system-ui fallback)  
**Body Font:** Work Sans (system-ui fallback)  
**Label/Mono Font:** JetBrains Mono

**Character:** Clean geometric Work Sans across the desk; mono for measured meta (mode tabs, status codes).

### Hierarchy
- **Brand** (600, 1.5rem, -0.02em): ShelfLM wordmark
- **Headline** (600, 1.75rem, tight): Page task title
- **Body** (400, 0.95rem, ~36–40ch comfort): Supporting lines
- **Label** (400, 0.7rem, uppercase, tracked): Mode tabs, section meta

### Named Rules
**The One Measure Rule.** Body copy stays inside the fixed column; do not widen readable text past the column for “breathing room.”

## Colors (Dark)

Dark mode keeps the same seal language on a **lacquer night desk**: warm near-black ground (`#12100E`), soft washi text (`#F2EBE3`), lifted vermilion (`#E25545`), amber cue (`#D4B03A`). Never cold blue-black.

## Layout

- **Auth & focused forms** use `FixedColumn`: `max-width: 420px` (`26.25rem`), horizontal padding 24px.
- **Dashboard canvas** uses `DeskCanvas`: `max-width: 1440px` (`90rem`), wider gutters — for workspace grids and multi-panel operate surfaces only.
- Vertical rhythm clusters tightly (12px) and separates sections generously (40px).
- Auth gate: header, body, action, and footer share one left edge — no card shell.
- Dashboard: tip strips and workspace tiles are interaction containers (bordered plates), not decorative card stacks.

## Elevation & Depth

Mostly flat. Depth comes from paper tone washes and hairline rules. The hanko may carry a short offset shadow (`2px 2px 0` soft sumi mix) to read as a pressed seal — not soft ambient card shadows.

### Named Rules
**The No Card Rule.** Do not wrap gate or dashboard content in bordered elevated cards. Rules and spacing define regions.

## Shapes

Near-square language: controls use ~2px radius; the hanko is 0px square. Avoid pills and large rounded rectangles. Primary CTA is a full-column rectangular plate.

## Components

### Buttons
- **Shape:** Rectangular plate (~2px), full column width for primary gate actions
- **Primary (seal):** Vermilion fill, light ink text, amber 8px cue at top-right, seal-press animation on activate
- **Hover / Focus:** Slight brightness drop; focus ring uses amber cue with washi offset
- **Ghost / text:** Hairline underline tabs for mode switches — no filled secondary buttons on the auth gate

### Seal mark
- Solid vermilion square with white 「印」; slight settle rotation on entrance
- Used once in the header lockup, not repeated as decoration

### Dividers
- 1px rule in border-rule color; more space above headings than below when stacking

### Alerts / errors
- Border in vermilion at low opacity, light vermilion wash, mono uppercase label (“Seal incomplete”), then recovery copy

## Do's and Don'ts

### Do
- Keep every operate control on the shared 420px measure
- Treat Google (or future providers) as the seal action — one decisive press
- Use mono labels for mode, status, and meta only
- Leave landing free to evolve without breaking this desk system

### Don't
- Recreate a centered SaaS auth card with soft shadow
- Scatter vermilion accents or multiple hanko stamps
- Add eyebrow kickers above headlines
- Use feTurbulence grain, glassmorphism, or gradient text
- Introduce Inter / Roboto / Playfair as the voice of this world
- Use cold blue-black dark mode; keep the lacquer warmth
