import { Badge } from "@shopify/polaris";
import { useTranslation } from "../../utils/i18n";

interface StockBadgeProps {
  available: number;
}

export function StockBadge({ available }: StockBadgeProps) {
  const { t } = useTranslation();

  if (available <= 0) {
    return <Badge tone="critical">{t("inventory.outOfStock")}</Badge>;
  }
  if (available < 5) {
    return <Badge tone="warning">{t("inventory.lowStock")}</Badge>;
  }
  return null;
}
