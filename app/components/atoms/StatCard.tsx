import { Card, BlockStack, Text } from "@shopify/polaris";

interface StatCardProps {
  title: string;
  value: number;
  tone?: "success" | "warning" | "critical" | "info";
}

const toneColors: Record<string, string> = {
  success: "#108043",
  warning: "#B98900",
  critical: "#D72C0D",
  info: "#2C6ECB",
};

export function StatCard({ title, value, tone }: StatCardProps) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingXl" fontWeight="bold">
          {value}
        </Text>
        {tone && (
          <div
            style={{
              width: "100%",
              height: 4,
              borderRadius: 2,
              backgroundColor: toneColors[tone] ?? "#ccc",
            }}
          />
        )}
      </BlockStack>
    </Card>
  );
}
