import { Badge } from "@shopify/polaris";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = status === "ACTIVE" ? "success" : "attention";
  return <Badge tone={tone}>{status}</Badge>;
}
