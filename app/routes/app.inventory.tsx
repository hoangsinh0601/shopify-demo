import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Page, BlockStack, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { fetchInventoryByLocation, adjustInventory } from "../services/inventory.server";
import type { ActionResponse } from "../utils/graphql";
import { InventoryTable } from "../components/organisms/InventoryTable";

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const locations = await fetchInventoryByLocation(admin);
  return { locations };
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const delta = parseInt(formData.get("delta") as string, 10);
  if (isNaN(delta)) {
    return { success: false, error: "Số lượng điều chỉnh không hợp lệ" } satisfies ActionResponse;
  }

  try {
    const result = await adjustInventory(admin, {
      inventoryItemId: formData.get("inventoryItemId") as string,
      locationId: formData.get("locationId") as string,
      delta,
    });
    return result satisfies ActionResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định",
    } satisfies ActionResponse;
  }
};

// --- Inventory Page ---

export default function InventoryPage() {
  const { locations } = useLoaderData<typeof loader>();

  const lowStockCount = locations.reduce(
    (count, loc) =>
      count +
      loc.inventoryLevels.nodes.filter((l) => {
        const avail = l.quantities.find((q) => q.name === "available")?.quantity ?? 0;
        return avail > 0 && avail < 5;
      }).length,
    0,
  );

  const outOfStockCount = locations.reduce(
    (count, loc) =>
      count +
      loc.inventoryLevels.nodes.filter((l) => {
        const avail = l.quantities.find((q) => q.name === "available")?.quantity ?? 0;
        return avail <= 0;
      }).length,
    0,
  );

  return (
    <Page title="Quản lý Tồn kho" backAction={{ url: "/app" }}>
      <BlockStack gap="500">
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <BlockStack gap="300">
            {outOfStockCount > 0 && (
              <Banner title="Cảnh báo hết hàng" tone="critical">
                <p>{outOfStockCount} sản phẩm đã hết hàng.</p>
              </Banner>
            )}
            {lowStockCount > 0 && (
              <Banner title="Tồn kho thấp" tone="warning">
                <p>{lowStockCount} sản phẩm có tồn kho dưới 5 đơn vị.</p>
              </Banner>
            )}
          </BlockStack>
        )}

        {locations.map((location) => (
          <InventoryTable key={location.id} location={location} />
        ))}
      </BlockStack>
    </Page>
  );
}
