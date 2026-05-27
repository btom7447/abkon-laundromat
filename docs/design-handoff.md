# Design Handoff — Abkon Laundromat

> Read [`design-system-prompt.md`](./design-system-prompt.md) first. That sets the philosophy, audience, Nigerian context rules, voice, and constraints. This document specifies the actual screens to design.

## Context

Abkon Laundromat has shipped M1-M3 (auth, CMS, customers, walk-in ticket creation, status flow, SMS pipeline, cash reconciliation, reports). Data shapes, server actions, and routes are stable. **Your work is purely visual + UX.** Engineering owns one in-flight system change: the catalog now supports **4 services** (Wash, Iron, Wash + Iron, Dry Clean) — design must reflect 4 services everywhere services appear.

## Brand status

**Locked (use these):**
- ✅ Color palette — **Sky (primary) + Navy (structure) + White**. Full token table in [`design-system-prompt.md`](./design-system-prompt.md#color-palette-locked--sky--navy--white). Dark mode is already wired via the `.dark` class on `<html>`. **Use the semantic utility classes** (`bg-background`, `bg-surface`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-default`, `border-strong`) — they adapt automatically.

**Pending from owner (block list):**

- [ ] Logo SVG (light + dark variants)
- [ ] Typography (display + body font stack — currently Geist Sans/Mono)
- [ ] Photography (shop interior, workers, finished laundry)
- [ ] Illustration style reference — owner picks between flat geometric, hand-drawn line + selective color, or custom commissioned. **Propose 2-3 reference examples in your first response.**
- [ ] Real WhatsApp business number (placeholder is currently `2348000000000`)

---

## Screens — priority order

### 1. Ticket creation — `/admin/tickets/new`  ⭐ HIGHEST PRIORITY

The most-used screen in the system. Reception will be here 50–100 times per day.

**Current state:** A long form with a typeahead customer picker, stacked line-item rows with dropdowns, add-on checkbox pills, and a totals card. Functional but flat.

**Reimagine as a POS app — three-pane layout:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STICKY CUSTOMER BAR                                                      │
│ [Avatar] Tunde Adeyemi · +234 803 xxx xxxx · 4 past visits · ₦12,400 LTV │
├─────────────────┬────────────────────────────────┬───────────────────────┤
│ CATEGORIES      │ ITEM GRID                      │ LIVE CART             │
│ (sidebar)       │ (illustrated cards, 3-4 cols)  │ (sticky right column) │
│                 │                                │                       │
│ All items       │ ┌────────┐ ┌────────┐ ┌──────┐ │ • Shirt × 3 (wash)    │
│ Tops            │ │[shirt] │ │[t-shir]│ │[trou]│ │   + starching         │
│ Bottoms         │ │ Shirt  │ │T-shirt │ │Trous.│ │   ₦1,500              │
│ Native wear     │ │ ₦300+  │ │ ₦300+  │ │₦300+ │ │ ─────                 │
│ Household       │ └────────┘ └────────┘ └──────┘ │ • Agbada × 1          │
│ Footwear        │ ┌────────┐ ┌────────┐ ┌──────┐ │   (wash + iron)       │
│ Negotiable      │ │[agbada]│ │[senatr]│ │[wrap]│ │   ₦1,500              │
│                 │ │Agbada  │ │Senator │ │Wrap. │ │ ─────                 │
│                 │ │₦700+   │ │₦500+   │ │₦500+ │ │ Subtotal    ₦3,000    │
│                 │ └────────┘ └────────┘ └──────┘ │ Urgent      [ off ]   │
│                 │ ┌────────┐ ┌────────┐ ┌──────┐ │ Discount    [ + ]     │
│                 │ │[duvet] │ │ [rug]  │ │[towl]│ │ ─────                 │
│                 │ │Duvet   │ │Rug/sqm │ │Towel │ │ GRAND   ₦3,000        │
│                 │ │₦2,500  │ │₦800/sqm│ │₦1k   │ │                       │
│                 │ └────────┘ └────────┘ └──────┘ │ Pickup: [Fri 23 May]  │
│                 │                                │ [ Create ticket → ]   │
└─────────────────┴────────────────────────────────┴───────────────────────┘
```

**Tapping an item card** opens a slide-in side panel from the right (overlays the cart temporarily):

```
┌──────────────────────────────┐
│  Agbada                   ×  │
│  ┌────────────────────────┐  │
│  │   [big agbada illo]    │  │  ← Custom SVG (Nigerian agbada silhouette)
│  └────────────────────────┘  │
│                              │
│  Service                     │
│  ┌──┬──┬────┬──┐             │
│  │🫧│🔥│🫧+🔥│✨│             │  ← 4 tabs: Wash, Iron, Wash+Iron, Dry Clean
│  └──┴──┴────┴──┘             │     (use proper Lucide icons, emoji shown
│   ↑ selected: Wash + Iron    │      here for sketch only)
│                              │
│  Quantity                    │
│  ┌───┬───┬───┐               │
│  │ − │ 1 │ + │               │  ← Big stepper, tap targets ≥44px
│  └───┴───┴───┘               │
│                              │
│  Add-ons (tap to toggle)     │
│  ┌──────────┐ ┌────────────┐ │
│  │ Starch   │ │ Stain rem. │ │
│  │ +₦200    │ │ +₦300      │ │
│  └──────────┘ └────────────┘ │
│  ┌──────────┐ ┌────────────┐ │
│  │ Whiten   │ │ Perfume    │ │
│  │ +₦250    │ │ +₦100      │ │
│  └──────────┘ └────────────┘ │
│                              │
│  Line total: ₦1,500          │
│  [ Add to ticket ]           │
└──────────────────────────────┘
```

**Per-ticket add-ons** (Urgent, Same-day rush, Home pickup, Home delivery, Premium garment bag) live as toggle cards in the cart column or in a dedicated row above the cart total — pick the cleaner placement.

**Discount** behind an "Apply discount" disclosure → opens percentage input + reason textarea. Show reception's max-discount cap visibly.

**Sticky bottom bar:** pickup date · urgent toggle · grand total · big "Create ticket" CTA.

**On successful creation:** redirect to a success view showing the ticket number HUGE in mono (e.g. `AB-AB-482917-KON` at 4xl+ size) with a "Copy" button and a "Create another" CTA. Reception will eyeball this to write on the tag.

**Empty states:**
- Customer not selected: cart says "Pick a customer first."
- No items in cart: cart says "Tap an item to start."

---

### 2. Admin dashboard — `/admin`

**Current state:** 4 stat cards + "Getting started" prose card. Looks empty.

**Reimagine as a real dashboard.** Three bands of KPI cards plus three bottom panels:

**Band 1 — Today (live):**
- Revenue today (with hour-by-hour sparkline)
- Tickets created today
- Tickets paid today
- Tickets ready for pickup right now
- Urgent due today
- New customers today

**Band 2 — Period rollups + deltas:**
- Revenue this month (with vs-last-month delta)
- Tickets this month (delta)
- Avg ticket value this month
- Top item this week
- Top service this week (Wash / Iron / Wash+Iron / Dry-clean)

**Band 3 — Attention flags (red/amber if non-zero):**
- Unpaid total (count + ₦) — ≥7 days
- Uncollected ≥4 days (count + ₦)
- Pending bot bookings (post M4 — placeholder card for now)
- Discounts applied today (count + total)

**Bottom row (3 panels):**
- Activity feed — last 10 events from audit log, human-readable
- Revenue sparkline — 30 days
- Quick actions strip — New ticket, Find ticket, Customer lookup, Today's cash, Reports

---

### 3. Ticket detail — `/admin/tickets/[id]`

**Current state:** Status badge + items table + totals card + status actions + SMS history + timeline + customer card.

**Reimagine:**

- **Massive mono ticket number** at the very top with a copy button — primary visual element.
- **Visual status stepper** below: Received → Ready → Collected (with In Storage as a branch). Active step highlighted. Cancelled state distinct.
- **Items section:** each line item as a card showing the matching illustration, service tag (one of 4), qty, addons inline, line subtotal.
- **Totals card** with breakdown.
- **Action panel (right column):** big contextual primary button (Mark Ready, Mark Collected, Move to Storage), secondary actions below.
- **Customer card** with avatar + lifetime stats.
- **Timeline** as a vertical stream with colored status dots.
- **SMS history** as message-bubble previews with delivery status.

---

### 4. Ticket list — `/admin/tickets`

**Current state:** Filter form + dense table.

**Reimagine:**

- **KPI strip** on top: Filtered total · Paid · Unpaid · Urgent count · Avg value.
- **Filter chip bar:** status pills, payment pill, urgent toggle, search.
- **Tickets as cards** in a list (not a table). Each card prominently shows ticket number (mono, large), customer name + phone, status badge with color, urgent flag if true, payment badge, grand total, pickup date, age since received.
- Pagination as previous / next at the bottom.

---

### 5. Public landing — `/`

**Current state:** Hero with QR + CTAs, 3-card services, 3-step how-it-works, CTA banner, footer. Generic feel.

**Reimagine — hero + 6 core sections + footer:**

**Hero**
- Bold headline ("Clean clothes, done right." — owner can wordsmith)
- Subhead about home pickup + drop-off + 4 services
- WhatsApp QR code + "Book on WhatsApp" primary CTA
- "Visit us" secondary CTA → scrolls to find-us section
- Subtle Ankara pattern accent in one corner
- Soap-bubble bokeh in background (low opacity)

**Section 1 — Services**
4 big illustrated cards: Wash, Iron, Wash + Iron, Dry Clean. Each shows representative items, "from ₦X" price teaser, 3–4 feature bullets.

**Section 2 — Add-ons strip**
Horizontal scroll of illustrated chips for Starching, Stain removal, Whitening, Color restoration, Sanitizing, Perfuming, Button replacement, Stitching, Hem adjustment.

**Section 3 — How it works**
4-step visual flow with illustrations:
1. Book on WhatsApp OR walk in
2. Reception indexes your clothes + gives you a ticket
3. We wash / iron / dry clean
4. SMS when ready → come collect

**Section 4 — Pricing preview**
Card-grid of 8–12 popular items with prices (Shirt ₦300, Agbada ₦700, Duvet ₦2,500, Rug ₦800/sqm, etc.) — pulled from the live catalog. CTA: "See full price list" → `/prices` page (also design this — same grid but exhaustive).

**Section 5 — Service areas**
Visual list or stylized map of neighborhoods covered (Ikot Ekpene, Itak, Abak, etc.) — pulled from `branch.serviceAreas`. Tagline: "We pick up + deliver in these areas."

**Section 6 — Testimonials + trust**
3 customer testimonial cards with names + photos/initials + quotes. Below: a trust strip with numbers ("3+ years · 10k+ items handled · 2-day average turnaround").

**FAQ** — collapsible accordion at the end with 4–6 common questions (How long? Negotiable items? Lost ticket? Delicate fabrics? Payment methods? Pickup hours?).

**Find us / contact** — branch address, hours, phone, embedded map link.

**Footer — detailed and standard:**
- Logo + tagline + WhatsApp CTA
- Quick links column: Services, How it works, Pricing, Service areas, FAQ
- Contact column: phone, address, hours
- Service areas column: list of neighborhoods covered
- Social icons: Instagram, X/Twitter, Facebook, TikTok
- Legal: Privacy policy, Terms of service
- Copyright + "Made with care in Nigeria" line

---

### 6. Customers — `/admin/customers` + `/admin/customers/[id]`

- **List page:** KPI strip (Total · New this week · Top spender · Avg lifetime value). Customer cards with colored-initial avatars, name, phone, ticket count, total spend, last visit, status badge.
- **Detail page:** Hero with avatar + name + phone + lifetime stats. History as a vertical timeline of ticket cards with status pills + service badges + amounts.

---

### 7. Cash reconciliation — `/admin/cash`

**Current state:** Form + history table.

**Reimagine:**
- **KPI strip:** Today's expected · Last reconcile discrepancy · Week paid total · Avg daily revenue.
- **Today panel:** visual "register drawer" graphic with big expected number, input for counted, arrow indicator showing variance, color-coded result (green balanced / amber overage / red shortage).
- **History:** 30-day calendar grid color-coded by discrepancy. Hover a day for details.

---

### 8. Reports — `/admin/reports`

- **Hero stat row** with sparklines + period delta arrows.
- **"Insights" auto-callouts** above the charts ("Shirts are 45% of revenue this month — up 12% from last month").
- Existing chart cards redrawn with more breathing room.
- Aging tables redrawn with horizontal bar indicators showing bucket weights.
- Preset tabs polished: Today · Week · Month · Year + Custom range.

---

### 9. Items + Add-ons CMS — `/admin/items`, `/admin/addons`

- **Items:** KPI strip (Active items · Top by revenue · Top by volume · Avg price). Grid of item cards with the matching illustration, name, unit, **four** service prices (Wash · Iron · Wash + Iron · Dry-clean) with inline edit. Drag handle for reorder. Make it obvious that `Wash + Iron` auto-derives when not set.
- **Add-ons:** Cards grouped by scope (Per-item / Per-ticket). Each shows name + icon + price/mode + applicable services as chips (4 chips: wash, iron, wash+iron, dry-clean).

---

### 10. Login — `/login`

- **Desktop:** split-screen — left illustration of Abkon shop scene with Nigerian context (storefront, Ankara accents, agbada hanging in window), right form.
- **Mobile:** small hero illustration on top, form below.

---

## Acceptance criteria

- All screens responsive (mobile, tablet landscape, desktop)
- Tablet-landscape (1280×800) is the primary admin target
- All money displayed via Naira formatter (`formatNaira` helper)
- All icons from Lucide React + inline SVG illustrations for clothing types
- WCAG AA contrast, keyboard nav, labeled inputs
- Components reuse existing `@/components/ui/*` where possible; new primitives go in the same folder with the same patterns
- No new heavy runtime dependencies
- Production-ready React/TSX, not pseudocode

## Out of scope (don't design)

- The WhatsApp bot conversation itself (lives in Meta's Business Manager)
- Payment gateway UI (cash-only at pickup)
- Backend route or data shape changes — owned by engineering
- Email — system uses SMS, not email
- Audit log view — keep current implementation; low value to redesign

## Data shapes to reference

- `prisma/schema.prisma` — full data model
- `src/server/actions/*.ts` — server actions and their types
- `src/lib/ticket-pricing.ts` — pricing engine driving the live total

## First response from you (the designer)

1. Confirm you understand the brief and the POS philosophy.
2. Propose 2–3 illustration style references for the owner to pick between.
3. Start with screen #1 (ticket creation) — that's the biggest impact.
4. Flag blockers from the brand-assets list before going deep.
