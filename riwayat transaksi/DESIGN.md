---
name: Sovereign Ledger
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  currency-xl:
    fontFamily: JetBrains Mono
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.03em
  currency-md:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a high-trust, mission-critical interface engineered specifically for Indonesian enterprise treasury teams, CFOs, and financial controllers. The brand character projects absolute institutional rigor, clarity under pressure, and effortless authority. It discards playful fintech tropes in favor of an exacting, high-density, analytical workspace reminiscent of professional institutional trading terminals and modern executive suites.

The visual style blends **Modern Corporate Technical Minimalist** with **Tonal Surface Layering**. Key tenets include:
- **Zero Ambiguity:** Precision takes precedence over decorative flair. Financial metrics, audit logs, and approval queues demand instantaneous scannability.
- **Controlled Density:** Maximizes screen real estate for multi-column data, audit trails, and ledger trees without causing visual exhaustion.
- **Engineered Contrast:** Deep obsidian-navy canvases provide an immersive backdrop where color is reserved almost exclusively for actionable states, risk signals, and cash movement trajectories.

## Colors
The color architecture relies on a specialized dark spectrum formulated to eliminate eye strain during multi-hour financial reconciliation while enforcing WCAG AAA compliance for numerical readouts.

### Primary Spectrum (System & State)
- **Primary Electric Blue (`#3B82F6`)**: Core interaction hooks, focused input fields, active navigation rails, and primary transactional triggers.
- **Deep Slate Canvas (`#0B0F19`)**: Base system backdrop.
- **Layer 1 Surface (`#0F172A`)**: Primary card containers and grouped table layouts.
- **Layer 2 Surface (`#161F30` / `#1E293B`)**: Elevated overlays, slide-overs, dropdowns, and modal dialogs.
- **Border Structural (`#223049`) & Interactive (`#334155`)**: Crisp hairpins that preserve boundaries without adding visual clutter.

### Ledger Semantic Values
Financial data requires unambiguous directional color assignments:
- **Credit / Surplus (`#10B981`, hover `#059669`, soft-tint `#10B9811A`)**: Inbound cash flow, positive reconciliations, approved transfers.
- **Debit / Outflow (`#EF4444`, hover `#DC2626`, soft-tint `#EF44441A`)**: Operational expenses, disbursements, tax debits, overdue liabilities.
- **Pending / Attention (`#F59E0B`, soft-tint `#F59E0B1A`)**: Unreconciled bank feeds, pending multi-sig approvals, provisional balances.

### Text Contrast Hierarchy
- **Text Highest Contrast (`#F8FAFC`)**: All headline values, primary currency displays, table headers.
- **Text Slate Secondary (`#94A3B8`)**: Field labels, metadata, secondary timestamp stamps.
- **Text Muted (`#64748B`)**: Inactive states, disabled controls, micro-captions.

## Typography
The system uses **Inter** for all narrative labels, UI controls, navigation items, and descriptive contextual copy, leveraging its tall x-height and exceptional micro-legibility.

For all currency figures, numerical sequences, invoice references, account codes, and tabular data tables, **JetBrains Mono** is mandatory. This strict segregation guarantees:
- Full vertical column alignment of Indonesian Rupiah figures (`Rp 1.250.000.000,00`) without character jitter.
- Instant distinction between alphanumeric transaction hashes, tax identification numbers (NPWP), and natural language transaction memos.
- All `label-caps` tokens enforce uppercase styling via CSS text transforms with wide tracking (`0.05em`) for category labels and audit logs.

## Layout & Spacing
The layout follows a responsive 12-column fluid grid configured for compact corporate data density:
- **Desktop (1280px and above):** 12 columns, fixed 256px collapsible side navigation rail, 24px (`space-xl`) outer margins, and 20px (`gutter-desktop`) gutters. Content is structured into multi-pane master-detail views (e.g., Ledger view left 8-col, Cashflow summary & detail panel right 4-col).
- **Tablet (768px - 1279px):** 8 columns, icon-collapsed navigation rail, 20px gutters, and 16px margins. Complex tabular grids scroll horizontally with frozen transaction title and balance columns.
- **Mobile (below 768px):** 4 columns, bottom navigation bar, 16px margins, and 12px gutters. High-density cards replace nested tables.

Vertical layout cadence follows strict 4px / 8px sub-grid multiples. Internal card padding is locked to `space-lg` (20px), while high-density table cells compress to `space-sm` (8px) vertically to maximize visible ledger rows per viewport.

## Elevation & Depth
This design system avoids heavy drop shadows, which degrade contrast and read poorly on dark backgrounds. Instead, visual hierarchy is constructed through **Tonal Surface Layering** and **Crisp Structural Outlines**.

### Structural Tiers
- **Canvas Base (`#0B0F19`)**: Ground zero. Holds background canvases and fixed system status strips.
- **Base Containers (`#0F172A`)**: Primary cards, ledger tables, and persistent charts. Defined with a single 1px hairline border of `#223049`.
- **Raised Containers (`#161F30`)**: Hovered list items, active filter panels, pinned summary stat cards. Finished with 1px border of `#334155`.
- **Floating Overlays (`#1E293B`)**: Contextual popovers, date range pickers, modal dialogs, and slide-over audit panels. Uses an ultra-diffused shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)` accompanied by a crisp top-edge highlight using a subtle inset border: `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`.

## Shapes
The system implements a structured **Rounded** geometry pattern scaled to establish clear visual hierarchy:
- **Primary Dashboard Cards & Modal Windows:** Scaled to `rounded-xl` (16px / 1rem) to frame high-level corporate data cleanly without aggressive cutoffs.
- **Form Controls, Search Bars, Table Row Selections:** Scaled to standard `rounded-lg` (8px / 0.5rem), maintaining a compact, modern workspace profile.
- **Status Badges, Filter Pills, Action Chips:** Scaled to full `rounded-full` (9999px) to contrast with rectangular ledger modules.

## Components

### Buttons
- **Primary:** Solid `#2563EB` background, text `#FFFFFF`, subtle gradient overlay to `#3B82F6`, border `1px solid rgba(255, 255, 255, 0.15)`. Active/Hover: `#1D4ED8`.
- **Secondary / Neutral:** Background `#1E293B`, text `#F8FAFC`, border `1px solid #334155`. Hover: background `#27354A`, border `#475569`.
- **Destructive:** Background `rgba(239, 68, 68, 0.1)`, text `#F87171`, border `1px solid rgba(239, 68, 68, 0.3)`. Hover: background `#EF4444`, text `#FFFFFF`.
- **Dimensions:** Height 36px (compact default) and 42px (primary header actions), corner radius 8px, font size `body-md` bold.

### Form Inputs & Search Fields
- **Container:** Background `#0F172A`, 1px border `#223049`, border-radius 8px.
- **States:** Focus sets border to `#3B82F6` with an outer glow `0 0 0 1px #3B82F6`. Invalid inputs swap border to `#EF4444`.
- **Currency Field Extension:** Integrated non-editable prefix badge container on left with `#161F30` background displaying `IDR` or `Rp` in monospaced font, visually separated by a 1px border from the numeric input.

### Status Badges & Chips
- Structure: 24px height, horizontal padding 8px, full rounded pill.
- **Income / Paid:** Background `rgba(16, 185, 129, 0.12)`, text `#34D399`, border `1px solid rgba(16, 185, 129, 0.25)`.
- **Expense / Unpaid:** Background `rgba(239, 68, 68, 0.12)`, text `#F87171`, border `1px solid rgba(239, 68, 68, 0.25)`.
- **In Review / Pending:** Background `rgba(245, 158, 11, 0.12)`, text `#FBBF24`, border `1px solid rgba(245, 158, 11, 0.25)`.

### Segmented Controls & Timeframe Selectors
- Outer frame background `#0B0F19`, 4px padding, 1px border `#223049`, radius 10px.
- Active segment: Background `#1E293B`, text `#F8FAFC`, shadow `0 2px 4px rgba(0,0,0,0.3)`, radius 6px.
- Inactive segment: Background transparent, text `#94A3B8`. Hover: text `#F8FAFC`.

### Data Tables & Ledger Rows
- Table Header: Background `#0B0F19`, uppercase `label-caps` text `#64748B`, 1px bottom border `#223049`.
- Table Rows: Alternating hover state with `#161F30`, 1px bottom border `#161F30`.
- All monetary columns align right, strictly using `currency-md` in `JetBrains Mono`. Debit transactions automatically include the minus sign (`- Rp 12.450.000`) styled with `#F87171`; credits include the plus sign (`+ Rp 45.000.000`) styled with `#34D399`.

### Enterprise Metric Cards (KPI Tiles)
- Background `#0F172A`, 1px border `#223049`, border-radius 16px, padding 20px.
- Structure: Label and trend pill on top row, large monospaced headline currency in center, comparison delta against previous accounting period at bottom.