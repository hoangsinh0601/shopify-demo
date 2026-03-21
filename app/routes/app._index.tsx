import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, Link } from "react-router";
import { useEffect } from "react";
import { Page, BlockStack, InlineStack, Layout, Card, Text, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { fetchAllProducts } from "../services/product.server";
import { createExportRecord, getExportHistory } from "../services/export.server";
import { buildProductCsv } from "../utils/csv";
import type { ExportActionResponse } from "../utils/graphql";
import { StatsOverview } from "../components/organisms/StatsOverview";
import { ExportHistory } from "../components/organisms/ExportHistory";

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const products = await fetchAllProducts(admin, 250);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "ACTIVE").length,
    draft: products.filter((p) => p.status === "DRAFT").length,
    outOfStock: products.filter((p) => p.totalInventory <= 0).length,
  };

  const exportHistory = await getExportHistory(session.shop);

  return { stats, exportHistory };
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    const products = await fetchAllProducts(admin, 250);
    await createExportRecord(session.shop, products.length);
    const csv = buildProductCsv(products);
    return { success: true, csv } satisfies ExportActionResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định",
    } satisfies ExportActionResponse;
  }
};

// --- Dashboard ---

export default function Dashboard() {
  const { stats, exportHistory } = useLoaderData<typeof loader>();
  const exportFetcher = useFetcher<ExportActionResponse>();
  const shopify = useAppBridge();

  useEffect(() => {
    const data = exportFetcher.data;
    if (data?.success && data.csv) {
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
    } else if (data && !data.success) {
      shopify.toast.show(`Lỗi: ${data.error}`, { isError: true });
    }
  }, [exportFetcher.data]);

  return (
    <Page
      title="Dashboard"
      primaryAction={
        <Button
          variant="primary"
          loading={exportFetcher.state === "submitting"}
          onClick={() => exportFetcher.submit({}, { method: "POST" })}
        >
          Xuất CSV tất cả sản phẩm
        </Button>
      }
    >
      <BlockStack gap="500">
        <StatsOverview
          total={stats.total}
          active={stats.active}
          draft={stats.draft}
          outOfStock={stats.outOfStock}
        />

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Truy cập nhanh</Text>
                <InlineStack gap="300">
                  <Link to="/app/products"><Button>Quản lý sản phẩm</Button></Link>
                  <Link to="/app/orders"><Button>Xem đơn hàng</Button></Link>
                  <Link to="/app/inventory"><Button>Kiểm tra tồn kho</Button></Link>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <ExportHistory records={exportHistory} />
      </BlockStack>
    </Page>
  );
}