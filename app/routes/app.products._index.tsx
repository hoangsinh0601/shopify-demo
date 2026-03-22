import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useFetcher, useSearchParams } from "react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Page, BlockStack, Card, Layout, IndexTable, Checkbox, Text,
  InlineStack, Badge, Button, Pagination,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { fetchProducts } from "../services/product.server";
import { bulkTagOperation, bulkStatusUpdate } from "../services/tag.server";
import type { ProductNode, PageInfo, BulkActionResponse } from "../utils/graphql";
import { extractNumericId } from "../utils/graphql";
import { StatusBadge } from "../components/atoms/StatusBadge";
import { SearchFilter } from "../components/molecules/SearchFilter";
import { BulkActionsPanel } from "../components/organisms/BulkActionsPanel";
import { useTranslation } from "../utils/i18n";

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  const result = await fetchProducts(admin, {
    after: url.searchParams.get("after"),
    before: url.searchParams.get("before"),
    search: url.searchParams.get("search") ?? "",
    status: url.searchParams.get("status") ?? "",
  });

  return {
    ...result,
    search: url.searchParams.get("search") ?? "",
    status: url.searchParams.get("status") ?? "",
  };
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "bulkTag" || intent === "bulkRemoveTag") {
      const productIds = JSON.parse(formData.get("productIds") as string) as string[];
      const tag = formData.get("tag") as string;
      const op = intent === "bulkTag" ? "add" : "remove";
      const { processed } = await bulkTagOperation(admin, productIds, tag, op);
      return { intent, success: true, processed } satisfies BulkActionResponse;
    }

    if (intent === "bulkStatus") {
      const productIds = JSON.parse(formData.get("productIds") as string) as string[];
      const status = formData.get("status") as string;
      const { processed } = await bulkStatusUpdate(admin, productIds, status);
      return { intent: "bulkStatus", success: true, processed } satisfies BulkActionResponse;
    }

    return { intent: "bulkTag", success: false, error: "Unknown intent" } satisfies BulkActionResponse;
  } catch (error) {
    return {
      intent: "bulkTag" as const,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies BulkActionResponse;
  }
};

// --- Product Row ---

function ProductRow({
  product, index, isSelected, onToggle,
}: {
  product: ProductNode; index: number; isSelected: boolean; onToggle: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasBestSellerTag = product.tags.includes("Bán chạy");
  const numericId = extractNumericId(product.id);

  return (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <Checkbox label="" checked={isSelected} onChange={() => onToggle(product.id)} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <Button variant="plain" onClick={() => navigate(`/app/products/${numericId}`)}>
            {product.title}
          </Button>
          {hasBestSellerTag && <Badge tone="warning">{t("products.bestSeller")}</Badge>}
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell><StatusBadge status={product.status} /></IndexTable.Cell>
      <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" tone={product.totalInventory <= 0 ? "critical" : undefined}>
          {product.totalInventory}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}

// --- Products Page ---

export default function ProductsPage() {
  const { products, pageInfo, search, status } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bulkFetcher = useFetcher<BulkActionResponse>();
  const shopify = useAppBridge();
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState(search);
  const [statusValue, setStatusValue] = useState(status);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("Bán chạy");
  const [bulkStatus, setBulkStatus] = useState("ACTIVE");

  useEffect(() => {
    if (bulkFetcher.data?.success) {
      shopify.toast.show(
        t("bulk.successMsg", { processed: bulkFetcher.data.processed ?? 0, total: selectedIds.size }),
      );
      setSelectedIds(new Set());
    } else if (bulkFetcher.data && !bulkFetcher.data.success) {
      shopify.toast.show(`${t("common.error")}: ${bulkFetcher.data.error}`, { isError: true });
    }
  }, [bulkFetcher.data]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  }, [products, selectedIds.size]);

  const submitBulk = (intent: string, extra: Record<string, string> = {}) => {
    bulkFetcher.submit(
      { intent, productIds: JSON.stringify(Array.from(selectedIds)), ...extra },
      { method: "POST" },
    );
  };

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (statusValue) params.set("status", statusValue);
    navigate(`/app/products?${params.toString()}`);
  }, [searchValue, statusValue, navigate]);

  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("before");
    params.set("after", pageInfo.endCursor ?? "");
    navigate(`/app/products?${params.toString()}`);
  };

  const handlePrevPage = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("after");
    params.set("before", pageInfo.startCursor ?? "");
    navigate(`/app/products?${params.toString()}`);
  };

  return (
    <Page title={t("products.title")} backAction={{ url: "/app" }}>
      <BlockStack gap="500">
        <Card>
          <SearchFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onClear={() => {
              setSearchValue("");
              const params = new URLSearchParams();
              if (statusValue) params.set("status", statusValue);
              navigate(`/app/products?${params.toString()}`);
            }}
            searchPlaceholder={t("products.searchPlaceholder")}
            filterLabel={t("products.status")}
            filterOptions={[
              { label: t("common.all"), value: "" },
              { label: t("products.statusActive"), value: "active" },
              { label: t("products.statusDraft"), value: "draft" },
              { label: t("products.statusArchived"), value: "archived" },
            ]}
            filterValue={statusValue}
            onFilterChange={(val) => {
              setStatusValue(val);
              const params = new URLSearchParams();
              if (searchValue) params.set("search", searchValue);
              if (val) params.set("status", val);
              navigate(`/app/products?${params.toString()}`);
            }}
            onSubmit={handleSearch}
          />
        </Card>

        {selectedIds.size > 0 && (
          <BulkActionsPanel
            selectedCount={selectedIds.size}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            bulkStatus={bulkStatus}
            onBulkStatusChange={setBulkStatus}
            onBulkTag={() => submitBulk("bulkTag", { tag: tagInput })}
            onBulkRemoveTag={() => submitBulk("bulkRemoveTag", { tag: tagInput })}
            onBulkStatusUpdate={() => submitBulk("bulkStatus", { status: bulkStatus })}
            isSubmitting={bulkFetcher.state === "submitting"}
          />
        )}

        <Layout>
          <Layout.Section>
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: t("nav.products"), plural: t("nav.products") }}
                itemCount={products.length}
                headings={[
                  { title: "" },
                  { title: t("products.productName") },
                  { title: t("products.status") },
                  { title: t("products.vendor") },
                  { title: t("products.inventory") },
                ]}
                selectable={false}
              >
                <IndexTable.Row id="select-all" position={-1}>
                  <IndexTable.Cell>
                    <Checkbox
                      label=""
                      checked={selectedIds.size === products.length && products.length > 0}
                      onChange={toggleAll}
                    />
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {selectedIds.size === products.length ? t("common.deselectAll") : t("common.selectAll")}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell />
                  <IndexTable.Cell />
                  <IndexTable.Cell />
                </IndexTable.Row>

                {products.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                    isSelected={selectedIds.has(product.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </IndexTable>
            </Card>

            <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
              <Pagination
                hasPrevious={pageInfo.hasPreviousPage}
                hasNext={pageInfo.hasNextPage}
                onPrevious={handlePrevPage}
                onNext={handleNextPage}
              />
            </div>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
