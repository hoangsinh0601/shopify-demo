import { IndexTable, InlineStack, Text, Badge, Button } from "@shopify/polaris";
import type { MetafieldNode } from "../../utils/graphql";
import { useTranslation } from "../../utils/i18n";

interface MetafieldRowProps {
  metafield: MetafieldNode;
  index: number;
  onEdit: (mf: MetafieldNode) => void;
  onDelete: (metafieldId: string) => void;
  isDeleting: boolean;
}

export function MetafieldRow({ metafield, index, onEdit, onDelete, isDeleting }: MetafieldRowProps) {
  const { t } = useTranslation();

  return (
    <IndexTable.Row id={metafield.id} key={metafield.id} position={index}>
      <IndexTable.Cell>
        <Badge>{metafield.namespace}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" fontWeight="bold">
          {metafield.key}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone="info">{metafield.type}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodySm" truncate>
          {metafield.value.length > 80 ? metafield.value.substring(0, 80) + "..." : metafield.value}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          <Button size="slim" onClick={() => onEdit(metafield)}>
            {t("common.edit")}
          </Button>
          <Button size="slim" tone="critical" loading={isDeleting} onClick={() => onDelete(metafield.id)}>
            {t("common.delete")}
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
