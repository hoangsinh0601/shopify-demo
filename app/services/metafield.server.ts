import type { MetafieldNode } from "../utils/graphql";
import { METAFIELDS_QUERY } from "../utils/graphql";

interface AdminClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

interface MetafieldsResult {
  productId: string;
  productTitle: string;
  metafields: MetafieldNode[];
}

export async function fetchMetafields(
  admin: AdminClient,
  productId: string,
): Promise<MetafieldsResult> {
  const response = await admin.graphql(METAFIELDS_QUERY, {
    variables: { id: productId },
  });

  const { data } = (await response.json()) as {
    data: {
      product: {
        id: string;
        title: string;
        metafields: { nodes: MetafieldNode[] };
      };
    };
  };

  return {
    productId: data.product.id,
    productTitle: data.product.title,
    metafields: data.product.metafields.nodes,
  };
}

interface SetMetafieldInput {
  ownerId: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export async function setMetafield(
  admin: AdminClient,
  input: SetMetafieldInput,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key value }
        userErrors { field message }
      }
    }
  `,
    { variables: { metafields: [input] } },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { metafieldsSet: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.metafieldsSet?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}

export async function deleteMetafield(
  admin: AdminClient,
  metafieldId: string,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation DeleteMetafield($input: MetafieldDeleteInput!) {
      metafieldDelete(input: $input) {
        deletedId
        userErrors { field message }
      }
    }
  `,
    { variables: { input: { id: metafieldId } } },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { metafieldDelete: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.metafieldDelete?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}
