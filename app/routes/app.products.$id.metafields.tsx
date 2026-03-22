import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { Page, BlockStack, Layout, Card, IndexTable, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { fetchMetafields, setMetafield, deleteMetafield } from "../services/metafield.server";
import type { MetafieldActionResponse, MetafieldNode } from "../utils/graphql";
import { MetafieldRow } from "../components/molecules/MetafieldRow";
import { MetafieldForm } from "../components/organisms/MetafieldForm";
import { useTranslation } from "../utils/i18n";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const productId = `gid://shopify/Product/${params.id}`;
  const result = await fetchMetafields(admin, productId);
  return { ...result, numericId: params.id };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const productId = `gid://shopify/Product/${params.id}`;

  try {
    if (intent === "set") {
      const result = await setMetafield(admin, {
        ownerId: productId,
        namespace: formData.get("namespace") as string,
        key: formData.get("key") as string,
        value: formData.get("value") as string,
        type: formData.get("type") as string,
      });
      return { intent: "set", ...result } satisfies MetafieldActionResponse;
    }

    if (intent === "delete") {
      const result = await deleteMetafield(admin, formData.get("metafieldId") as string);
      return { intent: "delete", ...result } satisfies MetafieldActionResponse;
    }

    return { intent: "set", success: false, error: "Unknown intent" } satisfies MetafieldActionResponse;
  } catch (error) {
    return {
      intent: (intent === "delete" ? "delete" : "set") as "set" | "delete",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies MetafieldActionResponse;
  }
};

export default function ProductMetafieldsPage() {
  const { productTitle, metafields, numericId } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<MetafieldActionResponse>();
  const shopify = useAppBridge();
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [namespace, setNamespace] = useState("custom");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState("single_line_text_field");

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(
        fetcher.data.intent === "delete" ? t("metafields.deleteSuccess") : t("metafields.saveSuccess"),
      );
      setShowForm(false);
      setKey("");
      setValue("");
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(`${t("common.error")}: ${fetcher.data.error}`, { isError: true });
    }
  }, [fetcher.data]);

  const handleEdit = (mf: MetafieldNode) => {
    setNamespace(mf.namespace);
    setKey(mf.key);
    setValue(mf.value);
    setType(mf.type);
    setShowForm(true);
  };

  const handleDelete = (metafieldId: string) => {
    fetcher.submit({ intent: "delete", metafieldId }, { method: "POST" });
  };

  return (
    <Page
      title={`${t("metafields.title")} — ${productTitle}`}
      backAction={{ url: `/app/products/${numericId}` }}
      primaryAction={
        <Button variant="primary" onClick={() => setShowForm(true)}>
          {t("metafields.addMetafield")}
        </Button>
      }
    >
      <BlockStack gap="500">
        {showForm && (
          <MetafieldForm
            namespace={namespace}
            onNamespaceChange={setNamespace}
            keyValue={key}
            onKeyChange={setKey}
            value={value}
            onValueChange={setValue}
            type={type}
            onTypeChange={setType}
            onSubmit={() =>
              fetcher.submit({ intent: "set", namespace, key, value, type }, { method: "POST" })
            }
            onCancel={() => setShowForm(false)}
            isSubmitting={fetcher.state === "submitting"}
          />
        )}

        <Layout>
          <Layout.Section>
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: "metafield", plural: "metafields" }}
                itemCount={metafields.length}
                headings={[
                  { title: t("metafields.namespace") },
                  { title: t("metafields.key") },
                  { title: t("metafields.dataType") },
                  { title: t("metafields.value") },
                  { title: t("metafields.actions") },
                ]}
                selectable={false}
              >
                {metafields.map((mf, i) => (
                  <MetafieldRow
                    key={mf.id}
                    metafield={mf}
                    index={i}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={fetcher.state === "submitting"}
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
