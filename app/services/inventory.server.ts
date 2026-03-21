import type { LocationNode } from "../utils/graphql";
import { INVENTORY_QUERY } from "../utils/graphql";

interface AdminClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

export async function fetchInventoryByLocation(
  admin: AdminClient,
): Promise<LocationNode[]> {
  const response = await admin.graphql(INVENTORY_QUERY);
  const { data } = (await response.json()) as {
    data: { locations: { nodes: LocationNode[] } };
  };
  return data.locations.nodes;
}

interface AdjustInput {
  inventoryItemId: string;
  locationId: string;
  delta: number;
}

export async function adjustInventory(
  admin: AdminClient,
  input: AdjustInput,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup { reason }
        userErrors { field message }
      }
    }
  `,
    {
      variables: {
        input: {
          reason: "correction",
          name: "available",
          changes: [
            {
              inventoryItemId: input.inventoryItemId,
              locationId: input.locationId,
              delta: input.delta,
            },
          ],
        },
      },
    },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { inventoryAdjustQuantities: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.inventoryAdjustQuantities?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}
