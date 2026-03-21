import prisma from "../db.server";

export async function createExportRecord(
  shop: string,
  totalProducts: number,
): Promise<void> {
  await prisma.exportHistory.create({
    data: { shop, totalProducts },
  });
}

export async function getExportHistory(shop: string, take = 10) {
  return prisma.exportHistory.findMany({
    where: { shop },
    orderBy: { exportedAt: "desc" },
    take,
  });
}
