# DEB ENTERPRISE — Evening Business Management Frontend

> Next.js app for **evening** wholesale/retail operations: sales entry, billing, payments, inventory, customers, and reporting.

**Daily** (daytime) workflows live in the sibling `vue-app` project against daily APIs. This Next app uses Evening customers/bills (`/customers-evening`, `/customer-bills-evening`, `/products-evening`) where API paths named `yesterday-date` typically mean the **current business/settlement day (today)**.

**Stack:** Next.js App Router · TypeScript · React 19 · Zustand · Axios · Bootstrap 5 · react-toastify

---

## About the Project

**DEB ENTERPRISE** evening frontend mirrors the daily Vue app for the night shift — group-wise sales entry, current orders, payments, totals, and master data against the evening session tables.

### What it solves

- **Evening sales at scale** — step-based entry by customer group with a sticky footer and keyboard-friendly quantity inputs
- **End-to-end billing** — current bills, settlement-date payments, balances, and dues
- **Operations & reporting** — evening product totals, payment summaries, CSV/PDF exports, and date-range history
- **Master data management** — evening customers, groups (including member assignment), products, and company settings

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript + React 19 |
| State | Zustand (evening sales grid) |
| HTTP | Axios |
| UI | Bootstrap 5 (npm) + Font Awesome via CDN |
| Feedback | react-toastify |

---

## Modules at a Glance

| Module | What it does |
| --- | --- |
| Dashboard | Stats and quick links |
| Evening Sales | Group-wise quantity entry and bulk save |
| Evening Total | Product summary by group + CSV/PDF export |
| Current Orders | Today’s evening bills + group PDF print |
| Order Payment | Settlement-date bills + payment entry |
| Order History | Date-range search, export, bulk delete |
| Payment Total | Payment totals by customer group (defaults to today) |
| Customers | CRUD, filters, **Import CSV** / **Reset CSV**, export |
| Groups | CRUD + manage members (bulk assign / move) |
| Products | CRUD, **Import CSV** / **Reset CSV**, export |
| Company Info | Profile and settings |

### CSV import modes

| Button | API `mode` | Behavior |
| --- | --- | --- |
| **Import CSV** | `upsert` (default) | Merge/update from file; keep rows not in the CSV |
| **Reset CSV** | `reset` | Replace all records with the CSV; delete rows missing from the file (confirm first) |

---

## Architecture

```text
src/
  app/               App Router pages by domain
  components/        Shared UI + evening-sales + order bill table
  lib/api/           Axios client + feature API modules
  lib/utils/         Dates, CSV/PDF download, amounts, toast helpers
  stores/            Zustand evening sales store
  types/             Shared TypeScript models
```

**Design choices**

- One Axios client via `lib/api/client.ts` (`NEXT_PUBLIC_API_BASE_URL`)
- Reusable `PageHeader`, `LoadingState`, `EmptyState`, `PaginationControls`, `CustomerBillTable`
- Brand: **DEB ENTERPRISE**; toast for action feedback
- Evening products use a **single `product_rate`** (not daily multi-rate / `rate_type` selection)

---

## Quick Start

**Requirements:** Node.js, npm, running backend API

```bash
cd next-app
npm install
```

Configure API in `.env.local` (matches docker nginx on port 80 by default):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost/api/v1
```

```bash
npm run dev      # next dev --webpack
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

### Hostinger (`production` branch)

Shared hosting serves `public_html`. The `production` branch is only the built static export (`index.html` at the root). In hPanel, point Git deploy at that branch and set the directory to `public_html`.

Pushes to `main` build the app and update `production`. To do the same locally:

```bash
NEXT_PUBLIC_API_BASE_URL=https://mstorebacknew.creativeventure.space/api/v1 npm run publish
git push origin production
```

Override the baked-in API URL with a GitHub Actions variable or secret named `NEXT_PUBLIC_API_BASE_URL`.

### Why `--webpack`?

`package.json` sets `"dev": "next dev --webpack"` on purpose. Turbopack can misbehave with this project’s Docker and iCloud Drive paths, so the webpack bundler is the default for local development.

---

## Routes

| Path | Feature |
| --- | --- |
| `/` | Dashboard |
| `/sales/evening` | Evening sales |
| `/sales/total` | Evening totals |
| `/order/list` | Current orders |
| `/order/payment` | Order payment |
| `/order/delete` | Delete current orders |
| `/order/history` | Order history |
| `/pay/total` | Payment totals |
| `/customers/evening` | Evening customers |
| `/customers/groups` | Customer groups |
| `/product/list` | Products |
| `/info/company` | Company settings |

---

## Evening vs daily

| Topic | This app (`next-app`) | Daily app (`vue-app`) |
| --- | --- | --- |
| API prefixes | `*-evening` | daily / non-evening |
| Settlement / `yesterday-date` | Usually **today** | Calendar **yesterday** |
| Product pricing | Single `product_rate` | Multiple rates via `rate_type` |
| State | Zustand | Pinia |

---

## Notes

- Evening-only frontend; daily UI is in `vue-app`
- Font Awesome is loaded from CDN; Bootstrap is an npm dependency
- Monetary values are shown as integers (rounded up)
- Do not apply next-app “yesterday = today” semantics to the Vue daily app

**License:** Private / project use
