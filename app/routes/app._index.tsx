import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";

// --- Types ---

interface ProductNode {
  id: string;
  title: string;
  status: string;
  vendor: string;
  totalInventory: number;
  tags: string[];
}

interface ProductsQueryResponse {
  data: {
    products: {
      nodes: ProductNode[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

interface ActionResponse {
  intent: "export" | "tagProduct";
  success: boolean;
  csv?: string;
  error?: string;
}

// --- Shared GraphQL query ---

const PRODUCTS_QUERY = `
  #graphql
  query GetProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        status
        vendor
        totalInventory
        tags
      }
    }
  }
`;

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first: 50 },
  });

  const { data } = (await response.json()) as ProductsQueryResponse;

  return { products: data.products.nodes };
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    // --- Mutation: Gắn tag "Bán chạy" ---
    if (intent === "tagProduct") {
      const productId = formData.get("productId") as string;

      const tagResponse = await admin.graphql(
        `
        #graphql
        mutation addTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) {
            node { id }
            userErrors { field message }
          }
        }
      `,
        {
          variables: {
            id: productId,
            tags: ["Bán chạy"],
          },
        },
      );

      const tagResult = await tagResponse.json();
      const userErrors =
        (tagResult as { data: { tagsAdd: { userErrors: Array<{ field: string; message: string }> } } })
          .data?.tagsAdd?.userErrors ?? [];

      if (userErrors.length > 0) {
        return {
          intent: "tagProduct",
          success: false,
          error: userErrors.map((e) => e.message).join(", "),
        } satisfies ActionResponse;
      }

      return {
        intent: "tagProduct",
        success: true,
      } satisfies ActionResponse;
    }

    // --- Export CSV ---
    const response = await admin.graphql(PRODUCTS_QUERY, {
      variables: { first: 50 },
    });

    const { data } = (await response.json()) as ProductsQueryResponse;
    const products = data.products.nodes;

    await prisma.exportHistory.create({
      data: {
        shop: session.shop,
        totalProducts: products.length,
      },
    });

    const header = "ID,Title,Status,Vendor,Total Inventory\n";
    const rows = products
      .map((p) => {
        const safeTitle = p.title?.replace(/"/g, '""') ?? "";
        const safeVendor = p.vendor?.replace(/"/g, '""') ?? "";
        return `"${p.id}","${safeTitle}","${p.status}","${safeVendor}",${p.totalInventory}`;
      })
      .join("\n");
    const csvStr = "\uFEFF" + "sep=,\n" + header + rows;

    return {
      intent: "export",
      success: true,
      csv: csvStr,
    } satisfies ActionResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return {
      intent: intent === "tagProduct" ? "tagProduct" : "export",
      success: false,
      error: message,
    } satisfies ActionResponse;
  }
};

// --- Product Row Component ---

function ProductRow({ product, index }: { product: ProductNode; index: number }) {
  const fetcher = useFetcher<ActionResponse>();
  const shopify = useAppBridge();
  const isSubmitting = fetcher.state === "submitting";
  const hasBestSellerTag = product.tags.includes("Bán chạy");

  useEffect(() => {
    if (fetcher.data?.intent === "tagProduct") {
      if (fetcher.data.success) {
        shopify.toast.show(`Đã gắn tag "Bán chạy" thành công!`);
      } else {
        shopify.toast.show(`Lỗi: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data]);

  return (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {product.title}
          </Text>
          {hasBestSellerTag && <Badge tone="warning">Bán chạy</Badge>}
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={product.status === "ACTIVE" ? "success" : "attention"}>
          {product.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
      <IndexTable.Cell>{product.totalInventory}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          size="slim"
          disabled={hasBestSellerTag}
          loading={isSubmitting}
          onClick={() =>
            fetcher.submit(
              { intent: "tagProduct", productId: product.id },
              { method: "POST" },
            )
          }
        >
          {hasBestSellerTag ? "Đã gắn tag" : "Đánh dấu Bán chạy"}
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}

// --- Main Page Component ---

export default function CatalogManager() {
  const { products } = useLoaderData<typeof loader>();
  const exportFetcher = useFetcher<ActionResponse>();
  const shopify = useAppBridge();

  useEffect(() => {
    const data = exportFetcher.data;
    if (data?.intent === "export") {
      if (data.success && data.csv) {
        shopify.toast.show("Xuất dữ liệu thành công");

        const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "catalog.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (!data.success && data.error) {
        shopify.toast.show(`Lỗi xuất CSV: ${data.error}`, { isError: true });
      }
    }
  }, [exportFetcher.data]);

  return (
    <Page
      title="Quản lý Catalog Sản Phẩm"
      primaryAction={
        <Button
          variant="primary"
          loading={exportFetcher.state === "submitting"}
          onClick={() =>
            exportFetcher.submit({ intent: "export" }, { method: "POST" })
          }
        >
          Xuất dữ liệu Catalog
        </Button>
      }
    >
      <BlockStack gap="500">
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
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </IndexTable>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}