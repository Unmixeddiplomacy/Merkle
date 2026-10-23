---
name: Executive Monochrome
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#47464a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#78767b'
  outline-variant: '#c8c5ca'
  surface-tint: '#5f5e60'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1d'
  on-primary-container: '#858386'
  inverse-primary: '#c8c6c8'
  secondary: '#5e5e67'
  on-secondary: '#ffffff'
  secondary-container: '#e0dee9'
  on-secondary-container: '#62626b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1b22'
  on-tertiary-container: '#83838c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e1e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1c1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c7c5d0'
  on-secondary-fixed: '#1a1b23'
  on-secondary-fixed-variant: '#46464f'
  tertiary-fixed: '#e3e1ec'
  tertiary-fixed-dim: '#c6c5cf'
  on-tertiary-fixed: '#1a1b22'
  on-tertiary-fixed-variant: '#46464e'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system targets institutional leaders, financial executives, and precision-driven operators who demand absolute clarity, rapid scan-efficiency, and institutional authority. The aesthetic is rooted in Swiss modernist graphic design, high-end editorial typography, and high-density software ergonomics (evoking the disciplined utility of the Stripe Dashboard, Linear Light, and financial terminal intelligence). 

The emotional tone is calm, authoritative, unyielding, and impeccably refined. There are no gimmicks, neon hues, decorative gradients, or artificial visual weight. Every structural element must justify its presence through spatial alignment, strict typographic scale, and razor-sharp border divisions. Depth is conveyed purely through structural grouping and micro-tonal surface shifts rather than elevation or heavy drop shadows.

## Colors
The color architecture operates strictly within a calibrated monochrome spectrum ranging from pure optical white to deep pitch zinc.

- **Primary Canvas & Surfaces**: `#ffffff` forms the primary structural card and active input surface. `#fafafa` serves as the canvas ground and subtle container fill, while `#f4f4f5` provides tactile differentiation for table headers, inactive rows, and subtle badge backdrops.
- **Hairlines & Dividers**: Structural separation relies entirely on crisp 1px borders using `#e4e4e7` for internal nested dividers and `#d4d4d8` for primary structural panels and interactive boundaries.
- **Typography & Content Hierarchy**: Primary typography, high-priority icons, and structural focus elements sit at `#09090b` (zinc-950). Supporting labels, metadata, and column headers use `#52525b` (zinc-600). Tertiary captions and placeholder states utilize `#71717a` (zinc-500) and `#a1a1aa` (zinc-400).
- **Interactive Inversion**: Primary actions use an inverted high-contrast paradigm—solid `#09090b` surface with crisp `#ffffff` content—anchoring critical user actions without chromatic distraction.

## Typography
Typographic discipline is centered around the pairing of three precise typefaces:
- **Hanken Grotesk** for primary headers, delivering sharp geometric clarity and contemporary architectural poise with tight letter spacing.
- **Geist** for high-density interface body text, balance sheets, and narrative copy, selected for its neutral, highly legible micro-details and vertical metric consistency.
- **JetBrains Mono** for data metrics, timestamps, status values, codes, badges, and financial figures to ensure columnar tabular alignment and analytical utility.

All uppercase labels must utilize expanded tracking (`0.02em` to `0.04em`) to maintain legibility at micro scales (10px–11px). Tabular figures (`tnum`) must be forced on all numeric displays across both body and mono fonts.

## Layout & Spacing
The layout model employs a disciplined 12-column fluid grid system bounded by a maximum display container of 1600px for workstation dashboards and dense tabular panels.

- **Breakpoints**: Desktop (≥1200px), Tablet (768px–1199px), Mobile (<768px).
- **Rhythm & Grid Behavior**: Layouts transition from 12 columns on desktop to 6 columns on tablet and 2 or 4 columns on mobile devices.
- **Density Principles**: The spacing tokens prioritize analytical compactness over sprawling empty space. Component paddings rely strictly on `space-xs` (4px), `space-sm` (8px), and `space-md` (12px) to ensure multi-column data views fit within single-screen executive dashboards.
- **Dividers as Spatial Drivers**: Vertical and horizontal structural boundaries are enforced by 1px hairline zinc borders rather than expansive whitespace, maximizing data density per viewport inch.

## Elevation & Depth
Elevation in this system eschews artificial blur shadows, atmospheric gradients, and multi-layered drop shadows entirely. Depth is structural, planar, and tectonic:

- **Surface Tiers**:
  - `Base`: `#fafafa` (application canvas, outer chassis).
  - `Layer 1`: `#ffffff` (cards, operational panels, primary data grids).
  - `Layer 2`: `#ffffff` resting over `#f4f4f5` background segments to frame internal toolbars and nested modules.
- **Hairline Outlines**: Every card, popover, modal, and panel is bounded by a crisp `1px solid #e4e4e7` (or `#d4d4d8` for foreground emphasis).
- **Floating Overlays (Modals & Dropdowns)**: For contextual overlays requiring distinct separation, use a strictly functional, ultra-subtle contact shadow: `0 1px 2px 0 rgba(9, 9, 11, 0.05), 0 4px 12px 0 rgba(9, 9, 11, 0.04)` combined with a sharp `#d4d4d8` outer border.

## Shapes
Shapes express precision engineering and architectural discipline. The roundedness is set strictly to Level 1 (Soft):
- Default components (buttons, input fields, badges, table cells) feature a disciplined `0.25rem` (4px) corner radius.
- Larger spatial containers, sheet panels, and cards utilize `0.5rem` (8px, `rounded-lg`).
- Modals, complex dialogs, and parent viewports use a maximum of `0.75rem` (12px, `rounded-xl`).
- Pill shapes and full circles are avoided for UI framing, reserved solely for micro status indicator dots (e.g., a 6px heartbeat dot).

## Components

### Buttons
- **Primary**: Solid `#09090b` fill, `#ffffff` label (`Geist` or `JetBrains Mono`, 12px medium), 1px solid `#09090b`. Hover shifts to `#27272a`. Active scale is suppressed; state changes are purely tonal.
- **Secondary**: `#ffffff` background, `#09090b` label, 1px solid `#e4e4e7`. Hover transitions background to `#f4f4f5` and border to `#d4d4d8`.
- **Tertiary / Ghost**: Transparent fill, `#52525b` label. Hover transitions to `#09090b` text and `#f4f4f5` background fill.
- **Metrics/Compact Sizing**: Height 32px for standard action items; height 28px for dense analytical actions. Padding: 8px 12px.

### Inputs & Form Fields
- Surface: `#ffffff`, border: 1px solid `#e4e4e7`, corner radius: 4px.
- Height: 32px standard, 28px high-density.
- Text: 13px `Geist`, `#09090b`. Placeholder text in `#a1a1aa`.
- Focus State: Unbroken 1px `#09090b` outline with an additional crisp 1px `#09090b` box-shadow ring (no colored or fuzzy halos).
- In-field labels and units use `JetBrains Mono` 11px uppercase in `#71717a`.

### Cards & Data Panels
- Background: `#ffffff`, outer border: 1px solid `#e4e4e7`.
- Card Header: Separated by a 1px solid `#f4f4f5` bottom border, padding: 12px 16px. Header titles use `Hanken Grotesk` 14px bold, uppercase or sentence case with tight tracking.
- Sub-cards within dashboards take `#fafafa` background fills with `#e4e4e7` borders.

### Chips & Badges
- Background: `#f4f4f5`, border: 1px solid `#e4e4e7`, text: 10px or 11px `JetBrains Mono`, font weight 500, `#27272a`.
- Active/Key metric chips invert to `#09090b` background with `#ffffff` text and zero border glare.

### Data Tables
- Table Header: `#fafafa` background, height 32px, text: 11px `JetBrains Mono` in `#71717a`, tracked uppercase, border-bottom 1px solid `#d4d4d8`.
- Rows: Height 36px (ultra-dense) to 44px (standard). Alternating rows remain `#ffffff`, hover state shifts row background to `#fafafa`.
- Cell dividers: 1px solid `#f4f4f5`. All numbers aligned right in `JetBrains Mono`.

### Checkboxes & Radios
- Size: 14px x 14px square (checkbox) or circle (radio).
- Default: `#ffffff` surface with a crisp 1px solid `#d4d4d8`.
- Checked: `#09090b` fill, pure `#ffffff` check mark or inner dot. No glow, no radius expansion.

### Key Performance Metric Blocks (Executive Stat Cards)
- Composed of an upper micro-label in `JetBrains Mono` 11px (`#71717a`), a central focal metric in `Hanken Grotesk` 24px/30px (`#09090b`), and a secondary delta indicator badge rendered strictly in monochrome high-contrast treatment (e.g., `+12.4%` inside a `#f4f4f5` container with `#09090b` text).