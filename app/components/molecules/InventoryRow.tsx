import { useEffect } from "react";
import { useFetcher } from "react-router";
import { IndexTable, InlineStack, Text, Button } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { InventoryLevelNode, ActionResponse } from "../../utils/graphql";
import { StockBadge } from "../atoms/StockBadge";

interface InventoryRowProps {
  level: InventoryLevelNode;
  locationId: string;
  index: number;
}

export function InventoryRow({ level, locationId, index }: InventoryRowProps) {
  const fetcher = useFetcher<ActionResponse>();
  const shopify = useAppBridge();
  const available = level.quantities.find((q) => q.name === "available")?.quantity ?? 0;
  const committed = level.quantities.find((q) => q.name === "committed")?.quantity ?? 0;
  const onHand = level.quantities.find((q) => q.name === "on_hand")?.quantity ?? 0;
  const isOutOfStock = available <= 0;

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Đã điều chỉnh tồn kho!");
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(`Lỗi: ${fetcher.data.error}`, { isError: true });
    }
  }, [fetcher.data]);

  return (
    <IndexTable.Row id={level.id} key={level.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="bold">
          {level.item.variant?.displayName ?? "N/A"}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{level.item.variant?.sku || "—"}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <Text
            as="span"
            tone={isOutOfStock ? "critical" : available < 5 ? "caution" : undefined}
            fontWeight="bold"
          >
            {available}
          </Text>
          <StockBadge available={available} />
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>{committed}</IndexTable.Cell>
      <IndexTable.Cell>{onHand}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          <Button
            size="slim"
            loading={fetcher.state === "submitting"}
            onClick={() =>
              fetcher.submit(
                { inventoryItemId: level.item.id, locationId, delta: "10" },
                { method: "POST" },
              )
            }
          >
            +10
          </Button>
          <Button
            size="slim"
            tone="critical"
            loading={fetcher.state === "submitting"}
            onClick={() =>
              fetcher.submit(
                { inventoryItemId: level.item.id, locationId, delta: "-10" },
                { method: "POST" },
              )
            }
          >
            -10
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
