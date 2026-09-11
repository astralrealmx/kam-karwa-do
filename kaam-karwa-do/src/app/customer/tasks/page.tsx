import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TasksListClient } from "./TasksListClient";

export default async function CustomerTasksPage() {
  const user = await requireCustomer();

  const tasks = await prisma.task.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <TasksListClient
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        categoryName: t.category?.nameEn ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
