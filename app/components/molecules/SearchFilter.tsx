import { InlineStack, TextField, Select, Button } from "@shopify/polaris";
import { useTranslation } from "../../utils/i18n";

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  filterLabel?: string;
  filterOptions?: Array<{ label: string; value: string }>;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  onSubmit: () => void;
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  onClear,
  searchPlaceholder,
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  onSubmit,
}: SearchFilterProps) {
  const { t } = useTranslation();

  return (
    <InlineStack gap="300" blockAlign="end">
      <div style={{ flex: 1 }}>
        <TextField
          label={t("common.search")}
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          autoComplete="off"
          clearButton
          onClearButtonClick={onClear}
        />
      </div>
      {filterOptions && filterLabel && onFilterChange && (
        <div style={{ width: 200 }}>
          <Select
            label={filterLabel}
            options={filterOptions}
            value={filterValue ?? ""}
            onChange={onFilterChange}
          />
        </div>
      )}
      <Button onClick={onSubmit}>{t("common.search")}</Button>
    </InlineStack>
  );
}
