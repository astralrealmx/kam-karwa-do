import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export default async function CustomerDashboardPage() {
  const user = await requireCustomer();

  // Real database values — grouped counts per status for this customer only.
  const grouped = await prisma.task.groupBy({
    by: ["status"],
    where: { customerId: user.id },
    _count: { _all: true },
  });

  const counts = {
    PENDING: 0,
    ACCEPTED: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const recentTasks = await prisma.task.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { category: true },
  });

  const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <DashboardClient
      counts={counts}
      recentTasks={recentTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        categoryName: t.category?.nameEn ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
      totalTasks={totalTasks}
      userName={user.name}
    />
  );
}
