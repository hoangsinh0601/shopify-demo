import type { ProductNode, ProductDetailNode, PageInfo } from "../utils/graphql";
import { PRODUCTS_QUERY, PRODUCT_DETAIL_QUERY } from "../utils/graphql";

interface AdminClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

interface PaginationOptions {
  after?: string | null;
  before?: string | null;
  search?: string;
  status?: string;
  first?: number;
}

interface ProductsResult {
  products: ProductNode[];
  pageInfo: PageInfo;
}

export async function fetchProducts(
  admin: AdminClient,
  options: PaginationOptions = {},
): Promise<ProductsResult> {
  const { after, before, search, status, first = 20 } = options;

  const queryParts: string[] = [];
  if (search) queryParts.push(`title:*${search}*`);
  if (status) queryParts.push(`status:${status}`);
  const queryStr = queryParts.length > 0 ? queryParts.join(" AND ") : undefined;

  const variables: Record<string, unknown> = { query: queryStr };
  if (before) {
    variables.last = first;
    variables.before = before;
  } else {
    variables.first = first;
    variables.after = after ?? undefined;
  }

  const response = await admin.graphql(PRODUCTS_QUERY, { variables });
  const { data } = (await response.json()) as {
    data: { products: { nodes: ProductNode[]; pageInfo: PageInfo } };
  };

  return {
    products: data.products.nodes,
    pageInfo: data.products.pageInfo,
  };
}

export async function fetchAllProducts(
  admin: AdminClient,
  limit = 250,
): Promise<ProductNode[]> {
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first: limit },
  });
  const { data } = (await response.json()) as {
    data: { products: { nodes: ProductNode[]; pageInfo: PageInfo } };
  };
  return data.products.nodes;
}

export async function fetchProductDetail(
  admin: AdminClient,
  productId: string,
): Promise<ProductDetailNode> {
  const response = await admin.graphql(PRODUCT_DETAIL_QUERY, {
    variables: { id: productId },
  });
  const { data } = (await response.json()) as {
    data: { product: ProductDetailNode };
  };
  return data.product;
}

interface ProductUpdateInput {
  id: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  status: string;
}

export async function updateProduct(
  admin: AdminClient,
  input: ProductUpdateInput,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id title }
        userErrors { field message }
      }
    }
  `,
    { variables: { input } },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { productUpdate: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.productUpdate?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}
