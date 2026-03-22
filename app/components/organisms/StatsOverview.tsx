import { InlineStack } from "@shopify/polaris";
import { StatCard } from "../atoms/StatCard";
import { useTranslation } from "../../utils/i18n";

interface StatsOverviewProps {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
}

export function StatsOverview({ total, active, draft, outOfStock }: StatsOverviewProps) {
  const { t } = useTranslation();

  return (
    <InlineStack gap="400" wrap={true}>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title={t("dashboard.totalProducts")} value={total} tone="info" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title={t("dashboard.activeProducts")} value={active} tone="success" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title={t("dashboard.draftProducts")} value={draft} tone="warning" />
      </div>
      <div style={{ flex: "1 1 150px" }}>
        <StatCard title={t("dashboard.outOfStock")} value={outOfStock} tone="critical" />
      </div>
    </InlineStack>
  );
}
