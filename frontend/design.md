# Design System --- Soft Premium Fitness Dashboard

## 1. Design Overview

A soft, premium fitness/SaaS dashboard aesthetic combining:

-   Soft minimalism
-   Premium health and fitness UI
-   Subtle neumorphic influence
-   Rounded card-based layout
-   Pastel accent colors
-   High whitespace
-   Low visual noise
-   Thin outline icons
-   Minimal borders
-   Extremely subtle shadows
-   Strong visual hierarchy

### Design principle

> Soft surfaces, generous spacing, rounded geometry, pastel accents, and
> restrained contrast.

The interface should feel calm, modern, friendly, premium, and
approachable rather than aggressive or overly technical.

------------------------------------------------------------------------

# 2. Color System

The UI uses a light neutral foundation with four accent families: blue,
green, peach, and black.

## Core Colors

  Token              Hex         Usage
  ------------------ ----------- -----------------------------------
  `background`       `#C6D6DA`   Outer/page background
  `surface`          `#EFEFEF`   Main dashboard background
  `card`             `#FFFFFF`   Cards and elevated surfaces
  `surface-soft`     `#F7F7F6`   Secondary surfaces
  `blue-100`         `#BAE2EF`   Soft information/hero backgrounds
  `blue-500`         `#54A8BD`   Charts, active indicators, links
  `green-100`        `#DCE9C5`   Progress/stat backgrounds
  `green-500`        `#8CB64A`   Progress, health, success
  `peach-100`        `#F2B29A`   Actions, points, warm highlights
  `text-primary`     `#171717`   Main text
  `text-secondary`   `#6F7070`   Secondary text
  `text-light`       `#999999`   Metadata and tertiary text
  `border`           `#E5E5E5`   Subtle dividers

## CSS Variables

``` css
:root {
  --background: #C6D6DA;

  --surface: #EFEFEF;
  --card: #FFFFFF;
  --surface-soft: #F7F7F6;

  --blue-100: #BAE2EF;
  --blue-500: #54A8BD;

  --green-100: #DCE9C5;
  --green-500: #8CB64A;

  --peach-100: #F2B29A;

  --text-primary: #171717;
  --text-secondary: #6F7070;
  --text-light: #999999;

  --border: #E5E5E5;
}
```

### Color Usage Rules

-   Use `text-primary` sparingly for important information.
-   Use `text-secondary` for supporting labels.
-   Use pastel colors for semantic grouping rather than decoration
    alone.
-   Blue represents information/activity.
-   Green represents progress, health, and positive status.
-   Peach represents action, points, and warm emphasis.
-   Avoid introducing saturated colors unless they have a clear semantic
    purpose.
-   Avoid large areas of pure black.

------------------------------------------------------------------------

# 3. Typography

## Recommended Typeface

Primary recommendation:

**Inter**

Alternative:

-   Manrope
-   SF Pro Display
-   Helvetica Neue

Use a modern sans-serif with clean geometric forms.

``` css
font-family: "Inter", sans-serif;
```

## Type Scale

  Element               Size     Weight   Approx. Line Height
  --------------- ---------- ---------- ---------------------
  Page greeting     28--32px        700                  1.15
  Major heading     26--30px   600--700                  1.15
  Card heading      16--18px        600                   1.3
  Large metric      24--30px        600                   1.1
  Body              13--15px        400                   1.5
  Small label       10--12px        500                   1.3
  Metadata          10--12px   400--500                   1.3

## Typography Rules

-   Prefer 600 over extremely heavy weights.
-   Avoid 900-weight typography.
-   Use large numbers as visual anchors.
-   Keep secondary labels visibly quieter than metrics.
-   Use short line lengths in dashboard cards.
-   Maintain clear contrast between heading, metric, label, and
    metadata.

Example:

``` css
.heading {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--text-primary);
}

.card-title {
  font-size: 17px;
  line-height: 1.3;
  font-weight: 600;
}

.body {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  color: var(--text-secondary);
}

.metric {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 600;
}
```

------------------------------------------------------------------------

# 4. Border Radius

Rounded geometry is one of the defining characteristics of the design.

## Radius Scale

  Token               Value Usage
  --------------- --------- -----------------------
  `radius-sm`        `12px` Small controls
  `radius-md`        `18px` Compact cards
  `radius-lg`        `24px` Standard cards
  `radius-xl`        `32px` Main containers
  `radius-pill`     `999px` Buttons, tags, search

``` css
:root {
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;
}
```

## Rules

-   Cards should generally use 20--28px radius.
-   Large dashboard containers can use 28--32px.
-   Buttons and badges should use pill geometry.
-   Avoid sharp corners.
-   Avoid mixing many unrelated radius values.

------------------------------------------------------------------------

# 5. Spacing System

Use an 8px-based spacing system.

``` text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

## Recommended Usage

    Space Usage
  ------- -----------------------------
      4px Icon-to-label micro spacing
      8px Tight internal spacing
     12px Small component gaps
     16px Standard component gap
     20px Card internal spacing
     24px Card padding / section gaps
     32px Major layout spacing
     40px Large separation
     48px Page-level spacing

Example:

``` css
.card {
  padding: 24px;
}

.dashboard-grid {
  gap: 16px;
}

.section {
  margin-bottom: 32px;
}
```

------------------------------------------------------------------------

# 6. Layout

The primary layout is a compact sidebar combined with a spacious
dashboard.

``` text
┌───────────────────────────────────────────────────────────┐
│ Sidebar │ Header                         Search  Actions  │
│         │                                                  │
│         │ ┌────────────────┐ ┌─────────────────────────┐ │
│         │ │ Hero / Coach   │ │ Today's Activity        │ │
│         │ │                │ │                         │ │
│         │ └────────────────┘ └─────────────────────────┘ │
│         │                                                  │
│         │ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│         │ │ Exercise   │ │ Analytics  │ │ Muscle       │ │
│         │ │            │ │            │ │ Workload     │ │
│         │ └────────────┘ └────────────┘ └──────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Main Dashboard

-   Outer background: soft blue-gray.
-   Main content: light neutral surface.
-   Cards: white.
-   Sidebar: white.
-   Content should feel spacious rather than densely packed.

## Sidebar

Approximate width:

`64–76px`

Characteristics:

-   White surface
-   Rounded outer container
-   Vertically distributed navigation
-   Circular icon controls
-   Active state uses black fill
-   Inactive states remain minimal

------------------------------------------------------------------------

# 7. Card System

Cards are the primary information containers.

``` css
.card {
  background: var(--card);
  border-radius: var(--radius-lg);
  border: none;
}
```

Optional extremely subtle shadow:

``` css
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.025);
```

## Card Rules

-   Prefer white cards on the light gray dashboard surface.
-   Use whitespace to create hierarchy.
-   Do not rely on heavy shadows.
-   Do not use strong borders.
-   Keep card contents aligned to a consistent grid.
-   Use pastel backgrounds for highlighted metrics.

------------------------------------------------------------------------

# 8. Shadows

Shadows should be almost invisible.

Recommended:

``` css
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.025);
```

or no shadow at all.

Avoid:

``` css
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
```

The visual separation should primarily come from:

``` text
#EFEFEF background
        +
#FFFFFF cards
```

rather than heavy elevation.

------------------------------------------------------------------------

# 9. Buttons

## Primary Button

``` css
.primary-button {
  height: 40px;
  padding: 0 24px;

  border: none;
  border-radius: 999px;

  background: #171717;
  color: #FFFFFF;

  font-size: 13px;
  font-weight: 600;
}
```

## Secondary Button

Use white or soft pastel backgrounds.

``` css
.secondary-button {
  background: var(--surface-soft);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}
```

## Rules

-   Buttons should feel soft and compact.
-   Prefer pill-shaped actions.
-   Avoid sharp rectangular buttons.
-   Use black for high-priority actions.
-   Use pastel colors for secondary contextual actions.

------------------------------------------------------------------------

# 10. Pills, Badges & Status Indicators

Pastel pills are an important recurring pattern.

Examples:

``` text
★ 10 th
◷ 28m 45s
♙ 10 min
```

Recommended:

``` css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 8px 12px;

  border-radius: 999px;

  font-size: 11px;
  font-weight: 500;
}
```

Color variants:

``` css
.badge-blue {
  background: var(--blue-100);
}

.badge-green {
  background: var(--green-100);
}

.badge-peach {
  background: var(--peach-100);
}
```

------------------------------------------------------------------------

# 11. Iconography

Recommended icon style:

-   Outline
-   Thin stroke
-   Rounded joins
-   Rounded caps
-   Minimal detail

Recommended libraries:

-   Lucide
-   Phosphor
-   Feather

Recommended stroke:

``` css
stroke-width: 1.8px;
```

Avoid heavy filled icon sets.

## Icon Buttons

``` css
.icon-button {
  width: 40px;
  height: 40px;

  display: grid;
  place-items: center;

  border-radius: 999px;
  background: transparent;
}
```

Active:

``` css
.icon-button.active {
  background: #171717;
  color: #FFFFFF;
}
```

------------------------------------------------------------------------

# 12. Search

The search field is pill-shaped and visually quiet.

``` css
.search {
  height: 42px;
  width: 190px;

  padding: 0 16px;

  border: none;
  border-radius: 999px;

  background: #FFFFFF;

  font-size: 12px;
}
```

The search icon should be small and lightweight.

------------------------------------------------------------------------

# 13. Charts

Charts should be visually restrained.

## Line Chart

``` css
.chart-line {
  stroke: var(--blue-500);
  stroke-width: 3px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

## Grid

``` css
.chart-grid {
  stroke: #E8E8E8;
  stroke-width: 1px;
}
```

## Data Points

Use small circular points with a light center.

Avoid excessive labels, gradients, or chart decoration.

The chart should communicate information without becoming the main
visual element.

------------------------------------------------------------------------

# 14. Progress Rings

Progress rings use a neutral track and pastel/brand progress.

``` css
.progress-track {
  stroke: #E8E8E8;
}

.progress-value {
  stroke: var(--green-500);
  stroke-linecap: round;
}
```

Important:

``` css
stroke-linecap: round;
```

Rounded ends reinforce the friendly aesthetic.

------------------------------------------------------------------------

# 15. Hero Sections

The hero card combines:

-   Pastel blue background
-   Large heading
-   Supporting copy
-   Human/fitness imagery
-   Circular play/action button

Recommended:

``` css
.hero {
  background: var(--blue-100);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
```

The human image should preferably be:

-   Transparent PNG/WebP
-   Cutout subject
-   Integrated into the card composition
-   Not presented as a generic rectangular photo

------------------------------------------------------------------------

# 16. Image Treatment

Images should feel integrated with the UI.

Preferred:

-   Subject cutouts
-   Soft backgrounds
-   Rounded containers
-   Natural lighting
-   Clean fitness photography
-   Minimal visual clutter

Avoid:

-   Stock-photo-heavy layouts
-   Strong gradients
-   Dark overlays
-   Hard rectangular image frames

------------------------------------------------------------------------

# 17. Dashboard Metrics

Metrics should use strong numerical hierarchy.

Example:

``` text
Weekly points

1544   ↑ 6%
```

Recommended:

``` css
.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}
```

Use accent colors only for changes/status.

------------------------------------------------------------------------

# 18. Muscle / Body Visualization

Body visualizations should use:

-   Thin anatomical outline
-   Light neutral body
-   Small pastel muscle highlights
-   Minimal labels
-   Rounded containers

Selected muscle card:

``` css
.muscle-card.selected {
  border: 2px solid var(--blue-500);
}
```

Unselected:

``` css
.muscle-card {
  background: var(--surface-soft);
  border: 1px solid transparent;
}
```

------------------------------------------------------------------------

# 19. Navigation States

## Default

``` text
transparent background
gray icon
```

## Hover

``` css
background: #F4F4F4;
```

## Active

``` css
background: #171717;
color: #FFFFFF;
```

## Focus

Use a subtle accessible ring:

``` css
outline: 2px solid var(--blue-500);
outline-offset: 3px;
```

------------------------------------------------------------------------

# 20. Interaction & Motion

Animations should be subtle.

Recommended:

``` css
transition:
  background-color 180ms ease,
  color 180ms ease,
  transform 180ms ease,
  box-shadow 180ms ease;
```

Hover:

``` css
.card:hover {
  transform: translateY(-1px);
}
```

Buttons:

``` css
.button:hover {
  transform: translateY(-1px);
}
```

Avoid:

-   Large bounce animations
-   Aggressive scaling
-   Long transitions
-   Excessive parallax

The UI should feel calm and controlled.

------------------------------------------------------------------------

# 21. Responsive Behavior

## Desktop

Use:

-   Sidebar
-   Multi-column dashboard
-   Large hero
-   3-column lower grid

## Tablet

-   Reduce sidebar width
-   Reduce card padding
-   Collapse lower grid from 3 columns to 2

## Mobile

Replace the desktop sidebar with:

-   Bottom navigation
-   Or compact top navigation

Cards should become single-column.

Recommended mobile padding:

``` css
padding: 16px;
```

Recommended mobile radius:

``` css
border-radius: 20px;
```

------------------------------------------------------------------------

# 22. Component Design Language

Every component should follow these rules:

### Do

-   Rounded
-   Soft
-   Minimal
-   Spacious
-   Pastel accents
-   Clear hierarchy
-   Thin icons
-   Low-contrast borders
-   Subtle motion

### Don't

-   Sharp corners
-   Heavy shadows
-   Highly saturated colors
-   Excessive gradients
-   Dense dashboards
-   Thick icon strokes
-   Strong outlines
-   Excessive text
-   Too many competing accent colors

------------------------------------------------------------------------

# 23. Component Tokens

``` css
:root {
  /* Colors */
  --background: #C6D6DA;
  --surface: #EFEFEF;
  --card: #FFFFFF;
  --surface-soft: #F7F7F6;

  --blue-100: #BAE2EF;
  --blue-500: #54A8BD;

  --green-100: #DCE9C5;
  --green-500: #8CB64A;

  --peach-100: #F2B29A;

  --text-primary: #171717;
  --text-secondary: #6F7070;
  --text-light: #999999;

  --border: #E5E5E5;

  /* Radius */
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Effects */
  --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.025);

  /* Typography */
  --font-family: "Inter", sans-serif;
}
```

------------------------------------------------------------------------

# 24. Quick Reference

  Property                Recommendation
  ----------------------- --------------------------
  Style                   Soft premium minimalism
  Background              `#C6D6DA` / `#EFEFEF`
  Cards                   `#FFFFFF`
  Primary text            `#171717`
  Secondary text          `#6F7070`
  Accent blue             `#54A8BD`
  Accent green            `#8CB64A`
  Accent peach            `#F2B29A`
  Card radius             `24px`
  Main container radius   `32px`
  Button radius           `999px`
  Card padding            `20–24px`
  Grid gap                `16–24px`
  Font                    Inter / Manrope
  Heading weight          `600–700`
  Body weight             `400`
  Icons                   Lucide / Phosphor
  Icon stroke             `~1.8px`
  Shadows                 Almost none
  Borders                 Very subtle
  Layout                  Sidebar + card dashboard
  Motion                  Subtle, 150--200ms
  Overall feel            Calm, friendly, premium

------------------------------------------------------------------------

# 25. Design Identity

The defining combination is:

**Pastel colors + white cards + huge rounded corners + black
typography + thin icons + generous whitespace + almost no shadows.**

When creating new components, preserve these properties before adding
decorative elements.

The design should feel:

> **Soft. Premium. Calm. Friendly. Modern. Fitness-focused.**

Do not sacrifice these qualities for visual complexity.
