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
  BlockStack
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";

interface ProductNode {
  id: string;
  title: string;
  status: string;
  vendor: string;
  totalInventory: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            status
            vendor
            totalInventory
          }
        }
      }
    }
  `);

  const parsedResponse = await response.json();

  return {
    products: parsedResponse.data.products.edges as Array<{ node: ProductNode }>
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            status
            vendor
            totalInventory
          }
        }
      }
    }
  `);

  const parsedResponse = await response.json();
  const products = parsedResponse.data.products.edges as Array<{ node: ProductNode }>;

  // Lưu lịch sử xuất file vào cơ sở dữ liệu (Prisma ExportHistory)
  await prisma.exportHistory.create({
    data: {
      shop: session.shop,
      totalProducts: products.length,
    }
  });

  // Tạo định dạng nội dung CSV
  const header = "ID,Title,Status,Vendor,Total Inventory\n";
  const rows = products.map(({ node }) => {
    const safeTitle = node.title ? node.title.replace(/"/g, '""') : "";
    const safeVendor = node.vendor ? node.vendor.replace(/"/g, '""') : "";
    return `"${node.id}","${safeTitle}","${node.status}","${safeVendor}",${node.totalInventory}`;
  }).join("\n");
  const csvStr = "\uFEFF" + "sep=,\n" + header + rows;

  return {
    success: true,
    csv: csvStr
  };
};

export default function CatalogManager() {
  const { products } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.csv) {
      shopify.toast.show('Xuất dữ liệu thành công');

      const blob = new Blob([fetcher.data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "catalog.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [fetcher.data]);

  const rowMarkup = products.map(({ node }, index) => (
    <IndexTable.Row id={node.id} key={node.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {node.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={node.status === "ACTIVE" ? "success" : "attention"}>
          {node.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{node.vendor}</IndexTable.Cell>
      <IndexTable.Cell>{node.totalInventory}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Quản lý Catalog Sản Phẩm"
      primaryAction={
        <Button
          variant="primary"
          loading={fetcher.state === "submitting"}
          onClick={() => fetcher.submit({}, { method: "POST" })}
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
                resourceName={{ singular: 'sản phẩm', plural: 'sản phẩm' }}
                itemCount={products.length}
                headings={[
                  { title: 'Tên sản phẩm' },
                  { title: 'Trạng thái' },
                  { title: 'Nhà cung cấp' },
                  { title: 'Tồn kho' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}