import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { Page, Layout, Card, BlockStack, InlineStack, Text, Badge, IndexTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { fetchProductDetail, updateProduct } from "../services/product.server";
import type { ActionResponse } from "../utils/graphql";
import { extractNumericId } from "../utils/graphql";
import { ProductForm } from "../components/organisms/ProductForm";
import { useTranslation } from "../utils/i18n";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const productId = `gid://shopify/Product/${params.id}`;
  const product = await fetchProductDetail(admin, productId);
  return { product };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = `gid://shopify/Product/${params.id}`;

  try {
    const result = await updateProduct(admin, {
      id: productId,
      title: formData.get("title") as string,
      descriptionHtml: formData.get("descriptionHtml") as string,
      vendor: formData.get("vendor") as string,
      status: formData.get("status") as string,
    });
    return result satisfies ActionResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies ActionResponse;
  }
};

export default function ProductDetailPage() {
  const { product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionResponse>();
  const shopify = useAppBridge();
  const { t } = useTranslation();

  const [title, setTitle] = useState(product.title);
  const [descriptionHtml, setDescriptionHtml] = useState(product.descriptionHtml ?? "");
  const [vendor, setVendor] = useState(product.vendor ?? "");
  const [status, setStatus] = useState(product.status);

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(t("productDetail.updateSuccess"));
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(`${t("common.error")}: ${fetcher.data.error}`, { isError: true });
    }
  }, [fetcher.data]);

  const numericId = extractNumericId(product.id);

  return (
    <Page
      title={product.title}
      backAction={{ url: "/app/products" }}
      secondaryActions={[{ content: t("productDetail.metafields"), url: `/app/products/${numericId}/metafields` }]}
    >
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <ProductForm
              title={title}
              onTitleChange={setTitle}
              descriptionHtml={descriptionHtml}
              onDescriptionChange={setDescriptionHtml}
              vendor={vendor}
              onVendorChange={setVendor}
              status={status}
              onStatusChange={setStatus}
              onSubmit={() => fetcher.submit({ title, descriptionHtml, vendor, status }, { method: "POST" })}
              isSubmitting={fetcher.state === "submitting"}
            />
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">{t("productDetail.additionalInfo")}</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t("productDetail.type")}: {product.productType || "N/A"}
                </Text>
                <InlineStack gap="200" wrap>
                  {product.tags.map((tag) => (<Badge key={tag}>{tag}</Badge>))}
                  {product.tags.length === 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">{t("productDetail.noTags")}</Text>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card padding="0">
              <div style={{ padding: "16px 16px 0" }}>
                <Text as="h2" variant="headingMd">
                  {t("productDetail.variants")} ({product.variants.nodes.length})
                </Text>
              </div>
              <IndexTable
                resourceName={{ singular: "variant", plural: "variants" }}
                itemCount={product.variants.nodes.length}
                headings={[
                  { title: t("productDetail.variantName") },
                  { title: t("productDetail.sku") },
                  { title: t("productDetail.price") },
                  { title: t("products.inventory") },
                ]}
                selectable={false}
              >
                {product.variants.nodes.map((v, i) => (
                  <IndexTable.Row id={v.id} key={v.id} position={i}>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd" fontWeight="bold">{v.title}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{v.sku || "—"}</IndexTable.Cell>
                    <IndexTable.Cell>{v.price}</IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" tone={v.inventoryQuantity <= 0 ? "critical" : undefined}>
                        {v.inventoryQuantity}
                      </Text>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
