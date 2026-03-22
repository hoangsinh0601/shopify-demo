import { Layout, Card, IndexTable, Pagination } from "@shopify/polaris";
import type { ProductNode, PageInfo } from "../../utils/graphql";
import { ProductRow } from "../molecules/ProductRow";
import { useTranslation } from "../../utils/i18n";

interface ProductTableProps {
  products: ProductNode[];
  pageInfo: PageInfo;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function ProductTable({ products, pageInfo, onNextPage, onPrevPage }: ProductTableProps) {
  const { t } = useTranslation();

  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <IndexTable
            resourceName={{ singular: t("nav.products"), plural: t("nav.products") }}
            itemCount={products.length}
            headings={[
              { title: t("products.productName") },
              { title: t("products.status") },
              { title: t("products.vendor") },
              { title: t("products.inventory") },
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
