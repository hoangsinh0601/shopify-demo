import { Badge } from "@shopify/polaris";

interface FulfillmentBadgeProps {
  status: string;
}

function getTone(status: string): "success" | "warning" | "attention" | "info" {
  switch (status) {
    case "FULFILLED": return "success";
    case "UNFULFILLED": return "warning";
    case "PARTIALLY_FULFILLED": return "attention";
    default: return "info";
  }
}

export function FulfillmentBadge({ status }: FulfillmentBadgeProps) {
  return <Badge tone={getTone(status)}>{status || "UNFULFILLED"}</Badge>;
}
