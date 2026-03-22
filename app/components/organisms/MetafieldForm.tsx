import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, FormLayout } from "@shopify/polaris";
import { useTranslation } from "../../utils/i18n";

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
  const { t } = useTranslation();

  const typeOptions = [
    { label: t("metafields.types.singleLine"), value: "single_line_text_field" },
    { label: t("metafields.types.multiLine"), value: "multi_line_text_field" },
    { label: t("metafields.types.integer"), value: "number_integer" },
    { label: t("metafields.types.decimal"), value: "number_decimal" },
    { label: t("metafields.types.boolean"), value: "boolean" },
    { label: t("metafields.types.date"), value: "date" },
    { label: t("metafields.types.url"), value: "url" },
    { label: t("metafields.types.color"), value: "color" },
    { label: t("metafields.types.json"), value: "json" },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t("metafields.editMetafield")}
        </Text>
        <FormLayout>
          <FormLayout.Group>
            <TextField label={t("metafields.namespace")} value={namespace} onChange={onNamespaceChange} autoComplete="off" />
            <TextField label={t("metafields.key")} value={keyValue} onChange={onKeyChange} autoComplete="off" />
          </FormLayout.Group>
          <Select label={t("metafields.dataType")} options={typeOptions} value={type} onChange={onTypeChange} />
          <TextField
            label={t("metafields.value")}
            value={value}
            onChange={onValueChange}
            multiline={type === "multi_line_text_field" || type === "json" ? 4 : undefined}
            autoComplete="off"
          />
        </FormLayout>
        <InlineStack gap="300" align="end">
          <Button onClick={onCancel}>{t("common.cancel")}</Button>
          <Button variant="primary" loading={isSubmitting} onClick={onSubmit}>
            {t("metafields.saveMetafield")}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
