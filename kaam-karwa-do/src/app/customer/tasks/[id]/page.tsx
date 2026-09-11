import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function CustomerTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireCustomer();

  // Scoped to customerId — a customer can never fetch another customer's
  // task by guessing an id, regardless of what the URL says.
  const task = await prisma.task.findFirst({
    where: { id: params.id, customerId: user.id },
    include: { category: true, address: true },
  });

  if (!task) {
    notFound();
  }

  return (
    <TaskDetailClient
      task={{
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        categoryName: task.category?.nameEn ?? null,
        addressLabel: task.address?.formatted ?? null,
        budget: task.budget,
        scheduledFor: task.scheduledFor?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
      }}
    />
  );
}
