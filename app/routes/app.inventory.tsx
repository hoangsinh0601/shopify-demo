import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Page, BlockStack, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { fetchInventoryByLocation, adjustInventory } from "../services/inventory.server";
import type { ActionResponse } from "../utils/graphql";
import { InventoryTable } from "../components/organisms/InventoryTable";
import { useTranslation } from "../utils/i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const locations = await fetchInventoryByLocation(admin);
  return { locations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const delta = parseInt(formData.get("delta") as string, 10);
  if (isNaN(delta)) {
    return { success: false, error: "Invalid adjustment" } satisfies ActionResponse;
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
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies ActionResponse;
  }
};

export default function InventoryPage() {
  const { locations } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    <Page title={t("inventory.title")} backAction={{ onAction: () => navigate("/app") }}>
      <BlockStack gap="500">
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <BlockStack gap="300">
            {outOfStockCount > 0 && (
              <Banner title={t("inventory.outOfStockAlert")} tone="critical">
                <p>{t("inventory.outOfStockMsg", { count: outOfStockCount })}</p>
              </Banner>
            )}
            {lowStockCount > 0 && (
              <Banner title={t("inventory.lowStockAlert")} tone="warning">
                <p>{t("inventory.lowStockMsg", { count: lowStockCount })}</p>
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
