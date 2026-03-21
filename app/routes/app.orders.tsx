import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { useState, useCallback } from "react";
import { Page, BlockStack, Card } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { fetchOrders } from "../services/order.server";
import { SearchFilter } from "../components/molecules/SearchFilter";
import { OrderTable } from "../components/organisms/OrderTable";

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  const result = await fetchOrders(admin, {
    after: url.searchParams.get("after"),
    before: url.searchParams.get("before"),
    search: url.searchParams.get("search") ?? "",
    financialStatus: url.searchParams.get("financial") ?? "",
  });

  return {
    ...result,
    search: url.searchParams.get("search") ?? "",
    financialStatus: url.searchParams.get("financial") ?? "",
  };
};

// --- Orders Page ---

export default function OrdersPage() {
  const { orders, pageInfo, search, financialStatus } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const [financial, setFinancial] = useState(financialStatus);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (financial) params.set("financial", financial);
    navigate(`/app/orders?${params.toString()}`);
  }, [searchValue, financial, navigate]);

  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("before");
    params.set("after", pageInfo.endCursor ?? "");
    navigate(`/app/orders?${params.toString()}`);
  };

  const handlePrevPage = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("after");
    params.set("before", pageInfo.startCursor ?? "");
    navigate(`/app/orders?${params.toString()}`);
  };

  return (
    <Page title="Quản lý Đơn hàng" backAction={{ url: "/app" }}>
      <BlockStack gap="500">
        <Card>
          <SearchFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onClear={() => {
              setSearchValue("");
              const params = new URLSearchParams();
              if (financial) params.set("financial", financial);
              navigate(`/app/orders?${params.toString()}`);
            }}
            searchPlaceholder="Mã đơn hoặc email..."
            filterLabel="Thanh toán"
            filterOptions={[
              { label: "Tất cả", value: "" },
              { label: "Đã thanh toán", value: "paid" },
              { label: "Chờ thanh toán", value: "pending" },
              { label: "Đã hoàn tiền", value: "refunded" },
            ]}
            filterValue={financial}
            onFilterChange={(val) => {
              setFinancial(val);
              const params = new URLSearchParams();
              if (searchValue) params.set("search", searchValue);
              if (val) params.set("financial", val);
              navigate(`/app/orders?${params.toString()}`);
            }}
            onSubmit={handleSearch}
          />
        </Card>

        <OrderTable
          orders={orders}
          pageInfo={pageInfo}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />
      </BlockStack>
    </Page>
  );
}
