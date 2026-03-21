import { InlineStack } from "@shopify/polaris";
import { StatCard } from "../atoms/StatCard";

interface StatsOverviewProps {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
}

export function StatsOverview({ total, active, draft, outOfStock }: StatsOverviewProps) {
  return (
    <InlineStack gap="400" wrap={true}>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title="Tổng sản phẩm" value={total} tone="info" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title="Đang bán" value={active} tone="success" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title="Bản nháp" value={draft} tone="warning" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title="Hết hàng" value={outOfStock} tone="critical" />
      </div>
    </InlineStack>
  );
}
