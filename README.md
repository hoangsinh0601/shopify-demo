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

### Shopify Admin GraphQL API

#### Cursor-based Pagination
Shopify uses **cursor-based pagination** (not offset). Use `first`/`after` for forward and `last`/`before` for backward navigation. Always request `pageInfo { hasNextPage hasPreviousPage startCursor endCursor }`.

#### Mutations Pattern
All write operations follow the same structure: send a mutation with an `input` variable, then check `userErrors` array in the response. If `userErrors.length > 0`, the operation failed with validation errors — not an HTTP error.
```tsx
const { data } = await response.json();
const userErrors = data.productCreate.userErrors; // Always check this!
```

#### GID Format
Shopify IDs are globally unique: `gid://shopify/Product/123456`. Extract the numeric ID with `.split("/").pop()` when building URLs.

#### API Scopes
Each GraphQL field requires a specific access scope (e.g. `read_orders`, `read_locations`). Missing scope → runtime `Access denied` error. Declare all needed scopes in `shopify.app.toml`.

---

### React Router (Remix-based)

#### Loader / Action Pattern
- **Loader**: Runs on GET requests (page load). Fetches data, returns JSON. Accessed via `useLoaderData()`.
- **Action**: Runs on POST/PUT/DELETE (form submissions). Mutates data, returns result. Triggered via `useFetcher().submit()`.

This clean separation ensures data fetching and mutations never mix.

#### Flat File Routing Conventions
| File | Behavior |
|------|----------|
| `app.products.tsx` | **Layout route** — wraps children, must render `<Outlet />` |
| `app.products._index.tsx` | **Index route** — standalone, renders at `/app/products` |
| `app.products.$id.tsx` | **Dynamic route** — matches `/app/products/:id` |
| `app.products.new.tsx` | **Static child** — matches `/app/products/new` |

**Key pitfall**: If a listing page is named `app.products.tsx` without `<Outlet />`, it becomes a layout and "swallows" child routes. Rename to `_index.tsx` to make it standalone.

#### useFetcher vs useSubmit
- `useFetcher`: For mutations that **don't navigate** — returns `fetcher.data`, `fetcher.state`. Best for inline actions (tag, delete, adjust).
- `useSubmit`: For mutations that **trigger navigation** — causes a full page reload of the current route.

---

### Shopify Embedded App

#### Session & Authentication
Every route **must** call `authenticate.admin(request)` in its loader. This validates the session token. Missing it → Shopify redirects to the login screen.

#### Client-side Navigation
Embedded apps run inside an iframe. Any **full page navigation** breaks out of the iframe and loses the session.

| Method | Effect | Use? |
|--------|--------|------|
| `<a href>` | Full page navigation | ❌ Never |
| `Button url="..."` | Full page navigation | ❌ Never |
| `backAction={{ url }}` | Full page navigation | ❌ Never |
| `navigate()` from `useNavigate` | Client-side routing | ✅ Always |
| `<Link to>` from `react-router` | Client-side routing | ✅ Always |

#### App Bridge
`useAppBridge()` provides access to Shopify UI primitives inside the embedded iframe:
- `shopify.toast.show(message)` — show success/error notifications
- Used for feedback after mutations

---

### Polaris UI Library

#### Core Components Used
| Component | Purpose |
|-----------|---------|
| `Page` | Page layout with title, back action, primary/secondary actions |
| `IndexTable` | Data table with rows, columns, selection |
| `Card` | Content container |
| `TextField` / `Select` | Form inputs |
| `Badge` | Status indicators with tone (success, warning, critical) |
| `Banner` | Alert messages |
| `Modal` | Confirmation dialogs |
| `Pagination` | Page navigation controls |

#### Polaris i18n
Polaris ships locale JSON files (`@shopify/polaris/locales/vi.json`). Pass the correct one to `<AppProvider i18n={...}>` to localize built-in component strings (e.g. pagination, empty states).

---

### Prisma ORM

#### Schema → Migration → Client Flow
```bash
# 1. Define model in prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_new_model
# 3. Regenerate client (auto-runs after migrate)
npx prisma generate
```

#### Server-only Access
Prisma client is imported only in `.server.ts` files. Never import in client components — it would expose DB credentials.

#### Type Inference
Prisma auto-generates TypeScript types from the schema. `Date` fields come as `Date` objects from Prisma but must be serialized to `string` when passed to client components via loaders.

---

### Atomic Design Pattern

#### Layer Responsibilities
| Layer | Responsibility | Dependencies | Example |
|-------|---------------|-------------|---------|
| **Atoms** | Single UI element, no logic | Only Polaris | `StatusBadge`, `StatCard` |
| **Molecules** | Combine atoms + simple interaction | Atoms + hooks | `ProductRow`, `SearchFilter` |
| **Organisms** | Full feature blocks | Molecules + atoms | `ProductTable`, `MetafieldForm` |
| **Routes** | Composition + data orchestration | Organisms + services | `app.products._index.tsx` |

#### Benefits
- **Reusability**: Same `SearchFilter` used across products, orders, inventory
- **Testability**: Each layer can be tested in isolation
- **Maintainability**: Changes to a badge style only touch one atom file

---

### Internationalization (i18n)

#### Architecture
Custom lightweight system using React Context — no external dependencies:
1. **Locale detection**: `Accept-Language` header parsed in the layout loader (server-side)
2. **TranslationProvider**: Wraps the entire app, provides `t()` function via context
3. **`useTranslation()` hook**: Components call `t("key.path")` to get translated strings
4. **Parameter interpolation**: `t("bulk.successMsg", { count: 5 })` replaces `{count}` in the template

#### Locale Files Structure
Dot-notation keys organized by page/feature:
```json
{
  "nav": { "dashboard": "Dashboard", "products": "Products" },
  "products": { "title": "Product Management", "searchPlaceholder": "..." },
  "common": { "save": "Save", "cancel": "Cancel" }
}
```

---

### TypeScript Patterns

#### `satisfies` Keyword
Used on action return values to ensure the return type matches the expected interface at compile time while preserving the literal type:
```tsx
return { success: true, intent: "update" } satisfies ProductActionResponse;
```

#### Discriminated Unions for Actions
When a route handles multiple action intents, use a union type with `intent` as discriminator:
```tsx
type ProductActionResponse = 
  | { intent: "update"; success: boolean; error?: string }
  | { intent: "delete"; success: boolean; error?: string };
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
