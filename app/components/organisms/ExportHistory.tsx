import { Layout, Card, IndexTable, Text, Badge, Box } from "@shopify/polaris";
import { formatDateTime } from "../../utils/format";
import { useTranslation } from "../../utils/i18n";

interface ExportRecord {
  id: string;
  exportedAt: string | Date;
  totalProducts: number;
}

interface ExportHistoryProps {
  records: ExportRecord[];
}

export function ExportHistory({ records }: ExportHistoryProps) {
  const { t } = useTranslation();

  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <Box padding="400" paddingBlockEnd="0">
            <Text as="h2" variant="headingMd">
              {t("dashboard.exportHistory")}
            </Text>
          </Box>
          <IndexTable
            resourceName={{ singular: "export", plural: "exports" }}
            itemCount={records.length}
            headings={[
              { title: t("dashboard.exportTime") },
              { title: t("dashboard.exportCount") },
            ]}
            selectable={false}
          >
            {records.map((record, index) => (
              <IndexTable.Row id={record.id} key={record.id} position={index}>
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    {formatDateTime(record.exportedAt)}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge>{String(record.totalProducts)}</Badge>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
