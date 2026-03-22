import { Layout, Card, IndexTable, Pagination } from "@shopify/polaris";
import type { OrderNode, PageInfo } from "../../utils/graphql";
import { OrderRow } from "../molecules/OrderRow";
import { useTranslation } from "../../utils/i18n";

interface OrderTableProps {
  orders: OrderNode[];
  pageInfo: PageInfo;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function OrderTable({ orders, pageInfo, onNextPage, onPrevPage }: OrderTableProps) {
  const { t } = useTranslation();

  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <IndexTable
            resourceName={{ singular: t("nav.orders"), plural: t("nav.orders") }}
            itemCount={orders.length}
            headings={[
              { title: t("orders.orderName") },
              { title: t("orders.customer") },
              { title: t("orders.financial") },
              { title: t("orders.fulfillment") },
              { title: t("orders.totalPrice") },
              { title: t("orders.createdAt") },
            ]}
            selectable={false}
          >
            {orders.map((order, index) => (
              <OrderRow key={order.id} order={order} index={index} />
            ))}
          </IndexTable>
        </Card>

        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
          <Pagination
            hasPrevious={pageInfo.hasPreviousPage}
            hasNext={pageInfo.hasNextPage}
            onPrevious={onPrevPage}
            onNext={onNextPage}
          />
        </div>
      </Layout.Section>
    </Layout>
  );
}
