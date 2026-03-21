import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, FormLayout } from "@shopify/polaris";
import { METAFIELD_TYPES } from "../../utils/graphql";

interface MetafieldFormProps {
  namespace: string;
  onNamespaceChange: (v: string) => void;
  keyValue: string;
  onKeyChange: (v: string) => void;
  value: string;
  onValueChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function MetafieldForm({
  namespace,
  onNamespaceChange,
  keyValue,
  onKeyChange,
  value,
  onValueChange,
  type,
  onTypeChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: MetafieldFormProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Thêm / Sửa Metafield
        </Text>
        <FormLayout>
          <FormLayout.Group>
            <TextField label="Namespace" value={namespace} onChange={onNamespaceChange} autoComplete="off" />
            <TextField label="Key" value={keyValue} onChange={onKeyChange} autoComplete="off" />
          </FormLayout.Group>
          <Select
            label="Loại dữ liệu"
            options={[...METAFIELD_TYPES]}
            value={type}
            onChange={onTypeChange}
          />
          <TextField
            label="Giá trị"
            value={value}
            onChange={onValueChange}
            multiline={type === "multi_line_text_field" || type === "json" ? 4 : undefined}
            autoComplete="off"
          />
        </FormLayout>
        <InlineStack gap="300" align="end">
          <Button onClick={onCancel}>Hủy</Button>
          <Button variant="primary" loading={isSubmitting} onClick={onSubmit}>
            Lưu Metafield
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
