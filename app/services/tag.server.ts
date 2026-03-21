interface AdminClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

export async function addTag(
  admin: AdminClient,
  productId: string,
  tag: string,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation addTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `,
    { variables: { id: productId, tags: [tag] } },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { tagsAdd: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.tagsAdd?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}

export async function removeTag(
  admin: AdminClient,
  productId: string,
  tag: string,
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(
    `
    #graphql
    mutation removeTags($id: ID!, $tags: [String!]!) {
      tagsRemove(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `,
    { variables: { id: productId, tags: [tag] } },
  );

  const result = await response.json();
  const userErrors =
    (result as { data: { tagsRemove: { userErrors: Array<{ field: string; message: string }> } } })
      .data?.tagsRemove?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors.map((e) => e.message).join(", ") };
  }
  return { success: true };
}

export async function bulkTagOperation(
  admin: AdminClient,
  productIds: string[],
  tag: string,
  operation: "add" | "remove",
): Promise<{ processed: number }> {
  let processed = 0;
  const fn = operation === "add" ? addTag : removeTag;

  for (const id of productIds) {
    const result = await fn(admin, id, tag);
    if (result.success) processed++;
  }

  return { processed };
}

export async function bulkStatusUpdate(
  admin: AdminClient,
  productIds: string[],
  status: string,
): Promise<{ processed: number }> {
  let processed = 0;

  for (const productId of productIds) {
    const response = await admin.graphql(
      `
      #graphql
      mutation UpdateStatus($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { message }
        }
      }
    `,
      { variables: { input: { id: productId, status } } },
    );

    const result = await response.json();
    const errors =
      (result as { data: { productUpdate: { userErrors: Array<{ message: string }> } } })
        .data?.productUpdate?.userErrors ?? [];

    if (errors.length === 0) processed++;
  }

  return { processed };
}
