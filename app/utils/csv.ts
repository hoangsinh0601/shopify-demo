import type { ProductNode } from "./graphql";

export function buildProductCsv(
  products: Array<Pick<ProductNode, "id" | "title" | "status" | "vendor" | "totalInventory">>,
): string {
  const header = "ID,Title,Status,Vendor,Total Inventory\n";
  const rows = products
    .map((p) => {
      const safeTitle = p.title?.replace(/"/g, '""') ?? "";
      const safeVendor = p.vendor?.replace(/"/g, '""') ?? "";
      return `"${p.id}","${safeTitle}","${p.status}","${safeVendor}",${p.totalInventory}`;
    })
    .join("\n");

  // BOM + sep for Excel compatibility
  return "\uFEFF" + "sep=,\n" + header + rows;
}
