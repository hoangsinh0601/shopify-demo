import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, Banner } from "@shopify/polaris";

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
  const hasSelection = selectedCount > 0;

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Thao tác ({selectedCount} sản phẩm đã chọn)
        </Text>

        {!hasSelection && (
          <Banner tone="info">
            <p>Chọn sản phẩm từ bảng bên dưới để thực hiện thao tác hàng loạt.</p>
          </Banner>
        )}

        {hasSelection && (
          <BlockStack gap="300">
            <InlineStack gap="300" blockAlign="end">
              <div style={{ width: 200 }}>
                <TextField label="Tag" value={tagInput} onChange={onTagInputChange} autoComplete="off" />
              </div>
              <Button loading={isSubmitting} onClick={onBulkTag}>
                Gắn tag
              </Button>
              <Button tone="critical" loading={isSubmitting} onClick={onBulkRemoveTag}>
                Gỡ tag
              </Button>
            </InlineStack>

            <InlineStack gap="300" blockAlign="end">
              <div style={{ width: 200 }}>
                <Select
                  label="Trạng thái mới"
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
                Đổi trạng thái
              </Button>
            </InlineStack>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
