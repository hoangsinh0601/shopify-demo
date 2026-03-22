import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, FormLayout } from "@shopify/polaris";
import { useTranslation } from "../../utils/i18n";

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
  const { t } = useTranslation();

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t("productDetail.productInfo")}
        </Text>
        <FormLayout>
          <TextField label={t("productDetail.title")} value={title} onChange={onTitleChange} autoComplete="off" />
          <TextField
            label={t("productDetail.description")}
            value={descriptionHtml}
            onChange={onDescriptionChange}
            multiline={4}
            autoComplete="off"
          />
          <TextField label={t("productDetail.vendor")} value={vendor} onChange={onVendorChange} autoComplete="off" />
          <Select
            label={t("productDetail.status")}
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
            {t("productDetail.saveChanges")}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
