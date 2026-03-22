import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { Page, Layout, Card, BlockStack, InlineStack, Text, Badge, IndexTable, Modal, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { fetchProductDetail, updateProduct, deleteProduct } from "../services/product.server";
import type { ActionResponse } from "../utils/graphql";
import { extractNumericId } from "../utils/graphql";
import { ProductForm } from "../components/organisms/ProductForm";
import { useTranslation } from "../utils/i18n";

// --- Action Response with intent ---

interface ProductActionResponse extends ActionResponse {
  intent: "update" | "delete";
}

// --- Loader ---

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const productId = `gid://shopify/Product/${params.id}`;
  const product = await fetchProductDetail(admin, productId);
  return { product };
};

// --- Action ---

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const productId = `gid://shopify/Product/${params.id}`;

  try {
    if (intent === "delete") {
      const result = await deleteProduct(admin, productId);
      return { intent: "delete" as const, ...result } satisfies ProductActionResponse;
    }

    // Default: update
    const result = await updateProduct(admin, {
      id: productId,
      title: formData.get("title") as string,
      descriptionHtml: formData.get("descriptionHtml") as string,
      vendor: formData.get("vendor") as string,
      status: formData.get("status") as string,
    });
    return { intent: "update" as const, ...result } satisfies ProductActionResponse;
  } catch (error) {
    return {
      intent: (intent === "delete" ? "delete" : "update") as "update" | "delete",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies ProductActionResponse;
  }
};

// --- Product Detail Page ---

export default function ProductDetailPage() {
  const { product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ProductActionResponse>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState(product.title);
  const [descriptionHtml, setDescriptionHtml] = useState(product.descriptionHtml ?? "");
  const [vendor, setVendor] = useState(product.vendor ?? "");
  const [status, setStatus] = useState(product.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data.intent === "delete") {
        shopify.toast.show(t("products.deleteSuccess"));
        navigate("/app/products");
      } else {
        shopify.toast.show(t("productDetail.updateSuccess"));
      }
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(`${t("common.error")}: ${fetcher.data.error}`, { isError: true });
    }
  }, [fetcher.data]);

  const numericId = extractNumericId(product.id);
  const isSubmitting = fetcher.state === "submitting";

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    fetcher.submit({ intent: "delete" }, { method: "POST" });
  }, [fetcher]);

  return (
    <Page
      title={product.title}
      backAction={{ onAction: () => navigate("/app/products") }}
      secondaryActions={[
        { content: t("productDetail.metafields"), onAction: () => navigate(`/app/products/${numericId}/metafields`) },
        {
          content: t("products.deleteProduct"),
          destructive: true,
          onAction: () => setShowDeleteConfirm(true),
        },
      ]}
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
              onSubmit={() =>
                fetcher.submit(
                  { intent: "update", title, descriptionHtml, vendor, status },
                  { method: "POST" },
                )
              }
              isSubmitting={isSubmitting}
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

        {/* Variants */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t("products.deleteProduct")}
        primaryAction={{
          content: t("products.deleteProduct"),
          destructive: true,
          loading: isSubmitting,
          onAction: handleDelete,
        }}
        secondaryActions={[
          { content: t("common.cancel"), onAction: () => setShowDeleteConfirm(false) },
        ]}
      >
        <Modal.Section>
          <Banner tone="critical">
            <p>{t("products.deleteConfirm")}</p>
          </Banner>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
