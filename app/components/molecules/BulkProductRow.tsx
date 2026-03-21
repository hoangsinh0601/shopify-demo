import { IndexTable, InlineStack, Text, Badge, Checkbox } from "@shopify/polaris";
import type { ProductNode } from "../../utils/graphql";
import { StatusBadge } from "../atoms/StatusBadge";

interface BulkProductRowProps {
  product: ProductNode;
  index: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function BulkProductRow({ product, index, isSelected, onToggle }: BulkProductRowProps) {
  return (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <Checkbox label="" checked={isSelected} onChange={() => onToggle(product.id)} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="bold">
          {product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <StatusBadge status={product.status} />
      </IndexTable.Cell>
      <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="100" wrap>
          {product.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} size="small">
              {tag}
            </Badge>
          ))}
          {product.tags.length > 3 && (
            <Text as="span" variant="bodySm" tone="subdued">
              +{product.tags.length - 3}
            </Text>
          )}
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
