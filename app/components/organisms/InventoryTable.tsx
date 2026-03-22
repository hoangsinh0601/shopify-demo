import { Layout, Card, IndexTable, InlineStack, Text, Badge } from "@shopify/polaris";
import type { LocationNode } from "../../utils/graphql";
import { InventoryRow } from "../molecules/InventoryRow";
import { useTranslation } from "../../utils/i18n";

interface InventoryTableProps {
  location: LocationNode;
}

export function InventoryTable({ location }: InventoryTableProps) {
  const { t } = useTranslation();

  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <div style={{ padding: "16px 16px 0" }}>
            <InlineStack align="space-between">
              <Text as="h2" variant="headingMd">
                📍 {location.name}
              </Text>
              <Badge>{`${location.inventoryLevels.nodes.length} ${t("common.items")}`}</Badge>
            </InlineStack>
          </div>
          <IndexTable
            resourceName={{ singular: "item", plural: t("common.items") }}
            itemCount={location.inventoryLevels.nodes.length}
            headings={[
              { title: t("inventory.product") },
              { title: t("inventory.sku") },
              { title: t("inventory.available") },
              { title: t("inventory.committed") },
              { title: t("inventory.onHand") },
              { title: t("inventory.adjust") },
            ]}
            selectable={false}
          >
            {location.inventoryLevels.nodes.map((level, index) => (
              <InventoryRow key={level.id} level={level} locationId={location.id} index={index} />
            ))}
          </IndexTable>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
