# Services Page Design Spec
**Date:** 2026-04-23  
**Route:** `/services`  
**Site:** energy-intelligence-map.vercel.app  
**Status:** Approved for implementation

---

## Overview

A native, fully responsive marketing page added to `energy-intelligence-map.vercel.app` as a sixth nav item ("Services"). It pitches the RES/RAP AI Energy Procurement service to Philippine franchise operators — grocery chains, fuel stations, fast food networks, and any multi-site franchise navigating competitive electricity procurement.

**Goal:** Full-funnel — awareness → proof → lead capture. No outbound link to `resbid-viewer.vercel.app`.

**Audience:** Franchise owners / finance / operations decision-makers, not energy analysts.

**Scrub rule:** No 7-Eleven Philippines branding, no specific store counts, no raw peso spend figures tied to a named client. All savings claims use percentages and per-store estimates. Contact email appears only as a `mailto:` href, never as plain visible text.

---

## Architecture

### New files
```
src/app/services/
  page.tsx              — Next.js page (static, SSG)
  ServicesPage.tsx      — Client component (owns slider state)

src/components/services/
  ServicesHero.tsx
  SavingsOpportunity.tsx   — slider + table + KPI cards
  BeforeAfter.tsx
  Pipeline.tsx
  PlatformFeatures.tsx
  ServicesCTA.tsx

src/data/services.ts    — all copy, numbers, and config
```

### Modified files
```
src/components/layout/Header.tsx   — add "Services" nav link
```

### Conventions
- All text/numbers live in `src/data/services.ts` — components are pure renderers
- No new npm dependencies (slider built with React `useState` + CSS, table is static)
- Matches existing dark theme: `glass-card`, `glass-hover`, design tokens from `globals.css`
- Mobile-first: test at 375px and 1280px

---

## Section 1 — Hero

**File:** `ServicesHero.tsx`

```
Eyebrow (mono, uppercase):  RES/RAP ENERGY PROCUREMENT · PHILIPPINES

H1 (large, two-line):
  "Your bid window is 2 weeks.
   Manual encoding takes 4–6."

Subheadline:
  "AI eliminates the encoding bottleneck.
   Humans scan and validate. The platform does everything else."

Stat chips (3, inline row):
  ⚡ ~20% savings vs DU rates
  ⏱ 5–7 days to LOI-ready
  🏪 Any franchise, any utility

CTAs (two buttons):
  Primary:   [Request a Brief →]      — smooth-scrolls to #contact
  Secondary: [See How It Works ↓]     — smooth-scrolls to #pipeline
```

---

## Section 2 — The Savings Opportunity

**File:** `SavingsOpportunity.tsx`  
**Id:** `savings`

### 2a — Live Savings Slider (interactive)

```
Label:  "How many stores does your franchise operate?"

Slider: min=10, max=2000, step=10, default=200
        thumb min-height 44px (touch target)

Live readout (animates on drag):
  Estimated monthly electricity spend:  ₱ {stores × 80,000}
  Your ~20% RES/RAP savings:            ₱ {spend × 0.20} / month
                                         ₱ {spend × 0.20 × 12} / year

Fine print:
  "Based on ₱80,000 avg monthly electricity spend per store.
   Actual savings depend on your DU mix, consumption profile,
   and RES bid terms."
```

Numbers formatted with `toLocaleString('en-PH')`. Values animate via `requestAnimationFrame` ease-out when slider moves.

### 2b — Tiered Savings Table (static, always visible)

| Stores | Est. Monthly Spend | ~20% Savings/mo | Savings/Year |
|--------|-------------------|-----------------|--------------|
| ~50    | ₱4M               | ₱800K           | ₱9.6M        |
| ~200   | ₱16M              | ₱3.2M           | ₱38.4M       |
| ~500   | ₱40M              | ₱8M             | ₱96M         |
| ~1,000+ | ₱80M+           | ₱16M+           | ₱192M+       |

Mobile: horizontal scroll or 2-column stacked cards.

### 2c — KPI Cards (3 glass cards)

```
~20%           | 5–7 days        | ~50×
vs DU rates    | bills to LOI    | faster encoding
               | any scale       | vs manual
```

---

## Section 3 — Before vs After

**File:** `BeforeAfter.tsx`  
**Eyebrow:** `THE PROBLEM`

```
H2: "Your bid window is 2 weeks.
     Manual encoding takes 4–6."

Two-column glass panel:

BEFORE (MANUAL)                      AFTER (PLATFORM)
──────────────────────────────────   ──────────────────────────────────
✗ Collect bills across 100+ DUs      ✓ Scan bills              [human]
✗ Manually encode each bill 1-by-1   ✓ AI extracts everything  [automated]
✗ 4–6 weeks to LOI-ready data        ✓ 5–7 days, LOI-ready
✗ Miss the bid window                ✓ Submit before deadline

Stat:  "4–6 weeks"                   Stat:  "5–7 days"
       depending on scale                    any scale
Badge: [window-ready only]           Badge: [actually done ✓]
```

Mobile: stacks vertically, Before on top, After below.

---

## Section 4 — The Pipeline

**File:** `Pipeline.tsx`  
**Id:** `pipeline`  
**Eyebrow:** `TECHNICAL ARCHITECTURE`

```
H2: "From scanned PDF to bid-ready dataset
     in 7 stages."

Sub: "Every bill passes the same deterministic pipeline —
      no human encoding, no format-specific exceptions."

Horizontal stepper (scrollable on mobile):
  1  Extract      OCR + AI LLM
  2  Clean        10 validation rules (C1–C10)
  3  Dedup        3-tier by store + period
  4  Enrich       Geo + DU normalization
  5  Compute      effective_rate, generation_rate
  6  Aggregate    Meta / pipeline KPIs
  7  Bid Artifacts  data.json · Excel workbook · LOI template

Connector arrows between steps (CSS, no SVG needed).
Active step highlights on hover.
```

---

## Section 5 — Platform Features

**File:** `PlatformFeatures.tsx`  
**Eyebrow:** `THE PLATFORM`

```
H2: "14 sections. Every number
     your bidder will ask for."

Sub: "A live intelligence dashboard built on the extracted data —
      navigable end-to-end without leaving the browser."

4×4 icon grid (emoji + label, glass chip):
  🎯 Opportunity       🗺 How to Navigate    📊 Portfolio KPIs    📍 Store Map
  📈 Consumption       💡 Rate Landscape     🧠 Bid Intelligence  🧾 Bill Anatomy
  🔢 Bid Simulator     🤝 Negotiation        ⚖️ Compare Proposals 🏢 DU Deep Dive
  📁 Data Room         🔬 Methodology

No CTA / no outbound link.
Mobile: 2×7 grid.
```

---

## Section 6 — Who It's For + Contact CTA

**File:** `ServicesCTA.tsx`  
**Id:** `contact`  
**Eyebrow:** `READY TO BID?`

```
H2: "Works for any franchise
     with distributed utility bills."

Sub: "The platform is utility-agnostic. What's franchise-specific
      is only the store master schema — a single config file."

Audience pills (row, glass chips):
  🛒 Grocery chains   ⛽ Fuel stations   🍔 Fast food networks
  🏪 Any multi-site franchise

Contact form (glass card, max-w-lg centered):
  Name           [text input]
  Organization   [text input]
  Store count    [select: <50 / 50–200 / 200–1,000 / 1,000+]
  Message        [textarea, 4 rows]
  [Request a Brief →]   (submit button, primary style)

Form action: `mailto:bernadettemisa403@gmail.com` (HTML form method, no backend needed).
  Opens the user's mail client pre-filled with subject + body.
  Upgrade path: swap for a Resend edge function in a future PR.
  
Email address NOT displayed as visible text anywhere on the page.
```

---

## Navigation Change

**File:** `src/components/layout/Header.tsx`

Add to `NAV_LINKS` array:
```ts
{ href: '/services', label: 'Services' }
```

Position: appended after `Roadmap` — last item in the nav array.
Current order becomes: Dashboard · Cascade · Oil Primer · References · Roadmap · **Services**

---

## Data File

**File:** `src/data/services.ts`

Exports:
```ts
export const servicesHero         // eyebrow, h1, sub, chips, ctas
export const savingsTiers         // 4-row table data
export const savingsSlider        // min, max, step, default, avgPerStore
export const kpiCards             // 3 cards
export const beforeAfterItems     // before[] and after[] arrays
export const pipelineStages       // 7 stages with name + description
export const platformFeatures     // 14 items with emoji + label
export const audiencePills        // 4 pills
export const servicesCTA          // eyebrow, h2, sub, form fields config
```

---

## Scrub Rules (enforced in data file)

| Removed | Replaced with |
|---------|---------------|
| "7-Eleven Philippines" | "a national franchise network" (if needed as example) |
| "~₱500M/month spend" | removed entirely |
| "~₱100M/month savings" | expressed as "~20% of your spend" |
| "~4,900 stores" | removed |
| "107 utilities" | "100+ utilities" |
| "104 more DUs" | "100+ more DUs" |
| Raw email in text | `mailto:` href only |

---

## Responsive Behaviour

| Component | Mobile (375px) | Desktop (1280px) |
|-----------|---------------|------------------|
| Hero H1 | 2.5rem, stacked | 4rem, inline |
| Stat chips | wrap to 2 rows | single row |
| Savings slider | full width | 600px centered |
| Tiered table | horizontal scroll | full width |
| Before/After | stacked | 2-col side by side |
| Pipeline stepper | horizontal scroll | full width |
| Platform grid | 2×7 | 4×4 (7 + 7) |
| CTA form | full width | max-w-lg centered |

---

## Non-Goals (explicitly out of scope)

- No link to `resbid-viewer.vercel.app`
- No authentication or gating
- No file upload (bills upload is a future feature)
- No Stripe / payments
- No backend API (form is `mailto:` or simple Resend edge function)
- No animations beyond what existing `FadeIn` component provides + slider counter easing
