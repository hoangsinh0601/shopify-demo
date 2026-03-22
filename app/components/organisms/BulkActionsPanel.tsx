import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, Banner } from "@shopify/polaris";
import { useTranslation } from "../../utils/i18n";

interface BulkActionsPanelProps {
  selectedCount: number;
  tagInput: string;
  onTagInputChange: (v: string) => void;
  bulkStatus: string;
  onBulkStatusChange: (v: string) => void;
  onBulkTag: () => void;
  onBulkRemoveTag: () => void;
  onBulkStatusUpdate: () => void;
  isSubmitting: boolean;
}

export function BulkActionsPanel({
  selectedCount,
  tagInput,
  onTagInputChange,
  bulkStatus,
  onBulkStatusChange,
  onBulkTag,
  onBulkRemoveTag,
  onBulkStatusUpdate,
  isSubmitting,
}: BulkActionsPanelProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t("bulk.operations", { count: selectedCount })}
        </Text>

        {!hasSelection && (
          <Banner tone="info">
            <p>{t("bulk.selectPrompt")}</p>
          </Banner>
        )}

        {hasSelection && (
          <BlockStack gap="300">
            <InlineStack gap="300" blockAlign="end">
              <div style={{ width: 200 }}>
                <TextField label={t("bulk.tag")} value={tagInput} onChange={onTagInputChange} autoComplete="off" />
              </div>
              <Button loading={isSubmitting} onClick={onBulkTag}>
                {t("bulk.addTag")}
              </Button>
              <Button tone="critical" loading={isSubmitting} onClick={onBulkRemoveTag}>
                {t("bulk.removeTag")}
              </Button>
            </InlineStack>

            <InlineStack gap="300" blockAlign="end">
              <div style={{ width: 200 }}>
                <Select
                  label={t("bulk.newStatus")}
                  options={[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Draft", value: "DRAFT" },
                    { label: "Archived", value: "ARCHIVED" },
                  ]}
                  value={bulkStatus}
                  onChange={onBulkStatusChange}
                />
              </div>
              <Button variant="primary" loading={isSubmitting} onClick={onBulkStatusUpdate}>
                {t("bulk.changeStatus")}
              </Button>
            </InlineStack>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
