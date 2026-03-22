# Shopify Demo App

A Shopify store management application built on **React Router + Polaris + Shopify Admin GraphQL API**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Router (forked from Remix) |
| **UI Library** | Shopify Polaris |
| **API** | Shopify Admin GraphQL API |
| **Database** | SQLite + Prisma ORM |
| **Auth** | Shopify OAuth (Session Tokens) |
| **Language** | TypeScript (strict, no `any`) |
| **i18n** | Custom TranslationProvider (en / vi) |
| **Embedded** | Shopify App Bridge |

## Features

### 📊 Dashboard (`/app`)
- Overview stats: total products, active, draft, out of stock
- Quick access links to management pages
- Export all products as CSV + export history log

### 📦 Product Management — Full CRUD (`/app/products`)
- **Create**: New product form (`/app/products/new`)
- **Read**: Paginated listing + search by name + filter by status
- **Update**: Edit product details (`/app/products/:id`)
- **Delete**: Delete product with confirmation modal
- **Bulk Operations**: Multi-select → bulk add/remove tags, bulk status change
- **Metafields CRUD**: Manage metafields per product (`/app/products/:id/metafields`)

### 🛒 Order Management (`/app/orders`)
- Paginated order listing
- Search by order number / email
- Filter by payment status
- Color-coded badges for financial / fulfillment status

### 📋 Inventory Management (`/app/inventory`)
- Stock levels displayed per location
- Out-of-stock / low-stock alerts
- Quick ±10 adjustments

### 🌐 Internationalization (i18n)
- Auto-detects locale from `Accept-Language` header
- Supports English + Vietnamese
- Polaris also switches locale accordingly

### 🔔 Webhooks
- Listens to events: `products/create`, `products/update`, `products/delete`
- Logs webhooks to database (`WebhookLog` model)

## Project Architecture

```
app/
├── components/                # Atomic Design
│   ├── atoms/                 # Smallest UI units (Badge, Card)
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── FinancialBadge.tsx
│   │   ├── FulfillmentBadge.tsx
│   │   └── StockBadge.tsx
│   ├── molecules/             # Atom compositions (Row, SearchFilter)
│   │   ├── SearchFilter.tsx
│   │   ├── ProductRow.tsx
│   │   ├── OrderRow.tsx
│   │   ├── InventoryRow.tsx
│   │   ├── MetafieldRow.tsx
│   │   └── BulkProductRow.tsx
│   └── organisms/             # Molecule compositions (Table, Form, Panel)
│       ├── StatsOverview.tsx
│       ├── ProductTable.tsx
│       ├── OrderTable.tsx
│       ├── InventoryTable.tsx
│       ├── MetafieldForm.tsx
│       ├── ProductForm.tsx
│       ├── BulkActionsPanel.tsx
│       └── ExportHistory.tsx
├── locales/                   # i18n JSON locale files
│   ├── en.json
│   └── vi.json
├── routes/                    # Thin routes (loader + action + composition)
│   ├── app.tsx                # Main layout + TranslationProvider
│   ├── app._index.tsx         # Dashboard
│   ├── app.products._index.tsx # Product listing + bulk actions
│   ├── app.products.new.tsx   # Create product
│   ├── app.products.$id.tsx   # Product detail (update + delete)
│   ├── app.products.$id.metafields.tsx
│   ├── app.orders.tsx
│   ├── app.inventory.tsx
│   └── webhooks.products.tsx
├── services/                  # Business logic (server-only)
│   ├── product.server.ts      # CRUD: fetch, create, update, delete
│   ├── order.server.ts
│   ├── inventory.server.ts
│   ├── tag.server.ts          # Bulk tag/status mutations
│   ├── metafield.server.ts
│   └── export.server.ts
├── utils/                     # Shared utilities
│   ├── graphql.ts             # Types, query constants, helpers
│   ├── i18n.tsx               # TranslationProvider + useTranslation hook
│   ├── csv.ts                 # CSV builder
│   └── format.ts              # Date/currency formatting
├── db.server.ts               # Prisma client
└── shopify.server.ts          # Shopify auth config
```

## Design Principles

### 1. Thin Routes
Route files only contain `loader`, `action`, and component composition. All business logic lives in `services/`, all UI in `components/`.

### 2. Atomic Design
- **Atoms**: Badge, Card — no logic
- **Molecules**: Row components — simple interactions
- **Organisms**: Table, Form — complete compositions

### 3. Server/Client Separation
- `.server.ts` files run only on the server (GraphQL calls, DB access)
- Components render only on the client (hooks, state, events)

### 4. Type Safety
- All GraphQL responses have TypeScript interfaces
- Action responses use `satisfies` for type enforcement
- No usage of `any`

## Lessons Learned

### 🔑 Shopify Embedded App — Navigation
**Problem**: Polaris `Page` component `backAction={{ url: "..." }}` and `Button url="..."` cause **full page navigation**, breaking the embedded app session → login screen appears.

**Solution**: Always use `onAction` + `useNavigate()` or `onClick` + `navigate()` for client-side routing:
```tsx
// ❌ WRONG — full page navigation, loses session
<Page backAction={{ url: "/app" }}>
<Button url="/app/products/new">

// ✅ CORRECT — client-side navigation
<Page backAction={{ onAction: () => navigate("/app") }}>
<Button onClick={() => navigate("/app/products/new")}>
```

### 🔑 React Router Flat File Routing
**Problem**: `app.products.tsx` acts as a **layout route**, swallowing child routes like `app.products.$id.tsx` → detail page doesn't render.

**Solution**: Rename to `app.products._index.tsx` — the `_index` convention makes it an index route instead of a layout:
```
app.products.tsx          → Layout route (requires <Outlet />)
app.products._index.tsx   → Index route (standalone)
```

### 🔑 Shopify API Scopes
Each GraphQL field requires a specific scope. Missing scope → `Access denied` error.

Must be declared in `shopify.app.toml`:
```toml
[access_scopes]
scopes = "read_products, write_products, read_orders, read_inventory, write_inventory, read_locations"
```

### 🔑 Loader Authentication
**Every route** in a Shopify embedded app must call `authenticate.admin(request)` in its loader. Missing it → Shopify has no session → login screen appears.

### 🔑 i18n Architecture
- Use React Context + custom hook (`useTranslation`) instead of heavy libraries
- Detect locale from `Accept-Language` header in loader (server-side)
- Polaris also needs locale switching via `AppProvider i18n`
- Use dot-notation keys with parameter interpolation: `t("bulk.successMsg", { count: 5 })`

### 🔑 Prisma Models
When adding new models, always run migrations:
```bash
npx prisma migrate dev --name add_model_name
npx prisma generate
```

## Setup & Development

### Prerequisites
- Node.js 18+
- Shopify CLI
- Shopify Partner account + Development store

### Install
```bash
yarn install
npx prisma migrate dev
```

### Development
```bash
yarn dev
# or
shopify app dev
```

### Type Check
```bash
npx tsc --noEmit
```

### Deploy
```bash
shopify app deploy
```

## API Scopes
```
read_products, write_products
read_orders
read_inventory, write_inventory
read_locations
```

## Database Schema (Prisma)

| Model | Purpose |
|-------|---------|
| `Session` | Shopify session storage |
| `WebhookLog` | Log incoming webhook events |
| `ExportHistory` | Track CSV export history |

## Resources

- [Shopify App Development](https://shopify.dev/docs/apps/getting-started)
- [Polaris Components](https://polaris.shopify.com)
- [Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [App Bridge](https://shopify.dev/docs/api/app-bridge-library)
- [React Router Docs](https://reactrouter.com/home)
