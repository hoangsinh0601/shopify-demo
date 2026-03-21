import { Layout, Card, IndexTable, Pagination } from "@shopify/polaris";
import type { OrderNode, PageInfo } from "../../utils/graphql";
import { OrderRow } from "../molecules/OrderRow";

interface OrderTableProps {
  orders: OrderNode[];
  pageInfo: PageInfo;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function OrderTable({ orders, pageInfo, onNextPage, onPrevPage }: OrderTableProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <IndexTable
            resourceName={{ singular: "đơn hàng", plural: "đơn hàng" }}
            itemCount={orders.length}
            headings={[
              { title: "Mã đơn" },
              { title: "Khách hàng" },
              { title: "Thanh toán" },
              { title: "Giao hàng" },
              { title: "Tổng tiền" },
              { title: "Ngày tạo" },
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
