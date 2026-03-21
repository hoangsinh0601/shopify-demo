import { Badge } from "@shopify/polaris";

interface FinancialBadgeProps {
  status: string;
}

function getTone(status: string): "success" | "warning" | "critical" | "attention" | "info" {
  switch (status) {
    case "PAID": return "success";
    case "PENDING": return "warning";
    case "REFUNDED":
    case "VOIDED": return "critical";
    case "PARTIALLY_REFUNDED": return "attention";
    default: return "info";
  }
}

export function FinancialBadge({ status }: FinancialBadgeProps) {
  return <Badge tone={getTone(status)}>{status}</Badge>;
}
