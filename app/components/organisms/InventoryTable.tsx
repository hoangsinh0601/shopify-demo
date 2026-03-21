import { Layout, Card, IndexTable, InlineStack, Text, Badge } from "@shopify/polaris";
import type { LocationNode } from "../../utils/graphql";
import { InventoryRow } from "../molecules/InventoryRow";

interface InventoryTableProps {
  location: LocationNode;
}

export function InventoryTable({ location }: InventoryTableProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <div style={{ padding: "16px 16px 0" }}>
            <InlineStack align="space-between">
              <Text as="h2" variant="headingMd">
                📍 {location.name}
              </Text>
              <Badge>{`${location.inventoryLevels.nodes.length} items`}</Badge>
            </InlineStack>
          </div>
          <IndexTable
            resourceName={{ singular: "item", plural: "items" }}
            itemCount={location.inventoryLevels.nodes.length}
            headings={[
              { title: "Sản phẩm" },
              { title: "SKU" },
              { title: "Có sẵn" },
              { title: "Đã cam kết" },
              { title: "Trong kho" },
              { title: "Điều chỉnh" },
            ]}
            selectable={false}
          >
            {location.inventoryLevels.nodes.map((level, index) => (
              <InventoryRow
                key={level.id}
                level={level}
                locationId={location.id}
                index={index}
              />
            ))}
          </IndexTable>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
