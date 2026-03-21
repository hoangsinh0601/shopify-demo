import { Layout, Card, IndexTable, Pagination } from "@shopify/polaris";
import type { ProductNode, PageInfo } from "../../utils/graphql";
import { ProductRow } from "../molecules/ProductRow";

interface ProductTableProps {
  products: ProductNode[];
  pageInfo: PageInfo;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function ProductTable({ products, pageInfo, onNextPage, onPrevPage }: ProductTableProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <IndexTable
            resourceName={{ singular: "sản phẩm", plural: "sản phẩm" }}
            itemCount={products.length}
            headings={[
              { title: "Tên sản phẩm" },
              { title: "Trạng thái" },
              { title: "Nhà cung cấp" },
              { title: "Tồn kho" },
              { title: "Hành động" },
            ]}
            selectable={false}
          >
            {products.map((product, index) => (
              <ProductRow key={product.id} product={product} index={index} />
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
