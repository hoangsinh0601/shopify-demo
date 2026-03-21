import { useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import { IndexTable, InlineStack, Badge, Button, Text } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { ProductNode, TagActionResponse } from "../../utils/graphql";
import { StatusBadge } from "../atoms/StatusBadge";
import { extractNumericId } from "../../utils/graphql";

interface ProductRowProps {
  product: ProductNode;
  index: number;
}

export function ProductRow({ product, index }: ProductRowProps) {
  const fetcher = useFetcher<TagActionResponse>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const hasBestSellerTag = product.tags.includes("Bán chạy");
  const isSubmitting = fetcher.state === "submitting";
  const numericId = extractNumericId(product.id);

  useEffect(() => {
    if (fetcher.data?.intent === "tagProduct") {
      if (fetcher.data.success) {
        shopify.toast.show(`Đã gắn tag "Bán chạy" thành công!`);
      } else {
        shopify.toast.show(`Lỗi: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data]);

  return (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <Button variant="plain" onClick={() => navigate(`/app/products/${numericId}`)}>
            {product.title}
          </Button>
          {hasBestSellerTag && <Badge tone="warning">Bán chạy</Badge>}
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <StatusBadge status={product.status} />
      </IndexTable.Cell>
      <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" tone={product.totalInventory <= 0 ? "critical" : undefined}>
          {product.totalInventory}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          size="slim"
          disabled={hasBestSellerTag}
          loading={isSubmitting}
          onClick={() =>
            fetcher.submit(
              { intent: "tagProduct", productId: product.id },
              { method: "POST" },
            )
          }
        >
          {hasBestSellerTag ? "Đã gắn tag" : "Đánh dấu Bán chạy"}
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
