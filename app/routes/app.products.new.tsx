import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useFetcher, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Page, Layout, Card, BlockStack, InlineStack, Text, TextField, Select, Button, FormLayout,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { createProduct } from "../services/product.server";
import { extractNumericId } from "../utils/graphql";
import { useTranslation } from "../utils/i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

interface CreateActionResponse {
  success: boolean;
  productId?: string;
  error?: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    const result = await createProduct(admin, {
      title: formData.get("title") as string,
      descriptionHtml: (formData.get("descriptionHtml") as string) || undefined,
      vendor: (formData.get("vendor") as string) || undefined,
      productType: (formData.get("productType") as string) || undefined,
      status: formData.get("status") as string,
    });
    return result satisfies CreateActionResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies CreateActionResponse;
  }
};

export default function CreateProductPage() {
  const fetcher = useFetcher<CreateActionResponse>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [vendor, setVendor] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(t("products.createSuccess"));
      navigate("/app/products");
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(`${t("common.error")}: ${fetcher.data.error}`, { isError: true });
    }
  }, [fetcher.data]);

  const isSubmitting = fetcher.state === "submitting";
  const isValid = title.trim().length > 0;

  return (
    <Page title={t("products.createProduct")} backAction={{ onAction: () => navigate("/app/products") }}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t("productDetail.productInfo")}
              </Text>
              <FormLayout>
                <TextField
                  label={t("productDetail.title")}
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label={t("productDetail.description")}
                  value={descriptionHtml}
                  onChange={setDescriptionHtml}
                  multiline={4}
                  autoComplete="off"
                />
                <FormLayout.Group>
                  <TextField
                    label={t("productDetail.vendor")}
                    value={vendor}
                    onChange={setVendor}
                    autoComplete="off"
                  />
                  <TextField
                    label={t("products.productType")}
                    value={productType}
                    onChange={setProductType}
                    autoComplete="off"
                  />
                </FormLayout.Group>
                <Select
                  label={t("productDetail.status")}
                  options={[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Draft", value: "DRAFT" },
                  ]}
                  value={status}
                  onChange={setStatus}
                />
              </FormLayout>
              <InlineStack align="end" gap="300">
                <Button onClick={() => navigate("/app/products")}>{t("common.cancel")}</Button>
                <Button
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!isValid}
                  onClick={() =>
                    fetcher.submit(
                      { title, descriptionHtml, vendor, productType, status },
                      { method: "POST" },
                    )
                  }
                >
                  {t("products.createProduct")}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
