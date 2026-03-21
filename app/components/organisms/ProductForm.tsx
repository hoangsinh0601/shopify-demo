import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, FormLayout } from "@shopify/polaris";

interface ProductFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  descriptionHtml: string;
  onDescriptionChange: (v: string) => void;
  vendor: string;
  onVendorChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ProductForm({
  title,
  onTitleChange,
  descriptionHtml,
  onDescriptionChange,
  vendor,
  onVendorChange,
  status,
  onStatusChange,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Thông tin sản phẩm
        </Text>
        <FormLayout>
          <TextField label="Tên sản phẩm" value={title} onChange={onTitleChange} autoComplete="off" />
          <TextField
            label="Mô tả (HTML)"
            value={descriptionHtml}
            onChange={onDescriptionChange}
            multiline={4}
            autoComplete="off"
          />
          <TextField label="Nhà cung cấp" value={vendor} onChange={onVendorChange} autoComplete="off" />
          <Select
            label="Trạng thái"
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Draft", value: "DRAFT" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
            value={status}
            onChange={onStatusChange}
          />
        </FormLayout>
        <InlineStack align="end">
          <Button variant="primary" loading={isSubmitting} onClick={onSubmit}>
            Lưu thay đổi
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
