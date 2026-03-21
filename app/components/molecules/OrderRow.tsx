import { IndexTable, Text } from "@shopify/polaris";
import type { OrderNode } from "../../utils/graphql";
import { FinancialBadge } from "../atoms/FinancialBadge";
import { FulfillmentBadge } from "../atoms/FulfillmentBadge";
import { formatDate, formatCurrency } from "../../utils/format";

interface OrderRowProps {
  order: OrderNode;
  index: number;
}

export function OrderRow({ order, index }: OrderRowProps) {
  return (
    <IndexTable.Row id={order.id} key={order.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="bold">
          {order.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {order.customer
          ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
          : order.email || "—"}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <FinancialBadge status={order.displayFinancialStatus} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <FulfillmentBadge status={order.displayFulfillmentStatus} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        {formatCurrency(
          order.totalPriceSet.shopMoney.amount,
          order.totalPriceSet.shopMoney.currencyCode,
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {formatDate(order.createdAt)}
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
