import type { OrderNode, PageInfo } from "../utils/graphql";
import { ORDERS_QUERY } from "../utils/graphql";

interface AdminClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

interface OrderPaginationOptions {
  after?: string | null;
  before?: string | null;
  search?: string;
  financialStatus?: string;
  first?: number;
}

interface OrdersResult {
  orders: OrderNode[];
  pageInfo: PageInfo;
}

export async function fetchOrders(
  admin: AdminClient,
  options: OrderPaginationOptions = {},
): Promise<OrdersResult> {
  const { after, before, search, financialStatus, first = 20 } = options;

  const queryParts: string[] = [];
  if (search) queryParts.push(`name:${search} OR email:${search}`);
  if (financialStatus) queryParts.push(`financial_status:${financialStatus}`);
  const queryStr = queryParts.length > 0 ? queryParts.join(" AND ") : undefined;

  const variables: Record<string, unknown> = { query: queryStr };
  if (before) {
    variables.last = first;
    variables.before = before;
  } else {
    variables.first = first;
    variables.after = after ?? undefined;
  }

  const response = await admin.graphql(ORDERS_QUERY, { variables });
  const { data } = (await response.json()) as {
    data: { orders: { nodes: OrderNode[]; pageInfo: PageInfo } };
  };

  return {
    orders: data.orders.nodes,
    pageInfo: data.orders.pageInfo,
  };
}
