import { Badge } from "@shopify/polaris";

interface StockBadgeProps {
  available: number;
}

export function StockBadge({ available }: StockBadgeProps) {
  if (available <= 0) {
    return <Badge tone="critical">Hết hàng</Badge>;
  }
  if (available < 5) {
    return <Badge tone="warning">Sắp hết</Badge>;
  }
  return null;
}
