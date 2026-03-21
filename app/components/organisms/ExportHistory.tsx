import { Layout, Card, IndexTable, Text, Badge, Box } from "@shopify/polaris";
import { formatDateTime } from "../../utils/format";

interface ExportRecord {
  id: string;
  exportedAt: string | Date;
  totalProducts: number;
}

interface ExportHistoryProps {
  records: ExportRecord[];
}

export function ExportHistory({ records }: ExportHistoryProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card padding="0">
          <Box padding="400" paddingBlockEnd="0">
            <Text as="h2" variant="headingMd">
              Lịch sử xuất dữ liệu
            </Text>
          </Box>
          <IndexTable
            resourceName={{ singular: "lần xuất", plural: "lần xuất" }}
            itemCount={records.length}
            headings={[{ title: "Thời gian" }, { title: "Số sản phẩm" }]}
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
