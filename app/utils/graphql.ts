// --- Shared TypeScript Interfaces ---

export interface ProductNode {
  id: string;
  title: string;
  status: string;
  vendor: string;
  totalInventory: number;
  tags: string[];
}

export interface ProductDetailNode {
  id: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  status: string;
  productType: string;
  tags: string[];
  variants: { nodes: VariantNode[] };
}

export interface VariantNode {
  id: string;
  title: string;
  sku: string;
  price: string;
  inventoryQuantity: number;
}

export interface OrderNode {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  customer: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface MetafieldNode {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface LocationNode {
  id: string;
  name: string;
  inventoryLevels: {
    nodes: InventoryLevelNode[];
  };
}

export interface InventoryLevelNode {
  id: string;
  quantities: Array<{ name: string; quantity: number }>;
  item: {
    id: string;
    variant: {
      id: string;
      displayName: string;
      sku: string;
    } | null;
  };
}

// --- Action Response Types ---

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface TagActionResponse extends ActionResponse {
  intent: "tagProduct";
}

export interface ExportActionResponse extends ActionResponse {
  csv?: string;
}

export interface MetafieldActionResponse extends ActionResponse {
  intent: "set" | "delete";
}

export interface BulkActionResponse extends ActionResponse {
  intent: "bulkTag" | "bulkRemoveTag" | "bulkStatus";
  processed?: number;
}

// --- GraphQL Query Constants ---

export const PRODUCTS_QUERY = `
  #graphql
  query GetProducts($first: Int, $last: Int, $after: String, $before: String, $query: String) {
    products(first: $first, last: $last, after: $after, before: $before, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        title
        status
        vendor
        totalInventory
        tags
      }
    }
  }
`;

export const PRODUCT_DETAIL_QUERY = `
  #graphql
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      descriptionHtml
      vendor
      status
      productType
      tags
      variants(first: 100) {
        nodes {
          id
          title
          sku
          price
          inventoryQuantity
        }
      }
    }
  }
`;

export const ORDERS_QUERY = `
  #graphql
  query GetOrders($first: Int, $last: Int, $after: String, $before: String, $query: String) {
    orders(first: $first, last: $last, after: $after, before: $before, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        name
        email
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          firstName
          lastName
        }
      }
    }
  }
`;

export const INVENTORY_QUERY = `
  #graphql
  query {
    locations(first: 10) {
      nodes {
        id
        name
        inventoryLevels(first: 100) {
          nodes {
            id
            quantities(names: ["available", "committed", "on_hand"]) {
              name
              quantity
            }
            item {
              id
              variant {
                id
                displayName
                sku
              }
            }
          }
        }
      }
    }
  }
`;

export const METAFIELDS_QUERY = `
  #graphql
  query GetProductMetafields($id: ID!) {
    product(id: $id) {
      id
      title
      metafields(first: 50) {
        nodes {
          id
          namespace
          key
          value
          type
        }
      }
    }
  }
`;

export const METAFIELD_TYPES = [
  { label: "Text (1 dòng)", value: "single_line_text_field" },
  { label: "Text (nhiều dòng)", value: "multi_line_text_field" },
  { label: "Số nguyên", value: "number_integer" },
  { label: "Số thập phân", value: "number_decimal" },
  { label: "Boolean", value: "boolean" },
  { label: "Ngày", value: "date" },
  { label: "URL", value: "url" },
  { label: "Màu sắc", value: "color" },
  { label: "JSON", value: "json" },
] as const;

// --- Helper to extract numeric ID from GID ---

export function extractNumericId(gid: string): string {
  return gid.split("/").pop() ?? "";
}
