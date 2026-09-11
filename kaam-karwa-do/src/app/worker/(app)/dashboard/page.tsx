import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { WorkerDashboardClient } from "./WorkerDashboardClient";

const taskInclude = {
  category: true,
  address: { include: { city: true, area: true } },
} as const;

function toRow(
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    budget: number | null;
    createdAt: Date;
    category: { nameEn: string } | null;
    address: { formatted: string; city: { name: string } | null; area: { name: string } | null } | null;
  },
  revealExactAddress: boolean
) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    categoryName: task.category?.nameEn ?? null,
    budget: task.budget,
    createdAt: task.createdAt.toISOString(),
    approximateArea:
      [task.address?.area?.name, task.address?.city?.name].filter(Boolean).join(", ") || null,
    exactAddress: revealExactAddress ? task.address?.formatted ?? null : null,
  };
}

export default async function WorkerDashboardPage() {
  const user = await requireWorker();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { categories: true, location: true, verification: true },
  });

  const categoryIds = profile?.categories.map((c) => c.id) ?? [];
  const cityId = profile?.location?.cityId ?? null;

  const [available, nearby, accepted, active, completed, unreadNotifications] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          status: "PENDING",
          assignedWorkerId: null,
          ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        include: taskInclude,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      cityId
        ? prisma.task.findMany({
            where: {
              status: "PENDING",
              assignedWorkerId: null,
              address: { cityId },
              ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
            },
            include: taskInclude,
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
      prisma.task.findMany({
        where: { assignedWorkerId: user.id, status: "ACCEPTED" },
        include: taskInclude,
        orderBy: { acceptedAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assignedWorkerId: user.id, status: "ACTIVE" },
        include: taskInclude,
        orderBy: { startedAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assignedWorkerId: user.id, status: "COMPLETED" },
        include: taskInclude,
        orderBy: { completedAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

  const earningsAgg = await prisma.task.aggregate({
    where: { assignedWorkerId: user.id, status: "COMPLETED" },
    _sum: { budget: true },
  });

  const pendingPayoutAgg = await prisma.task.aggregate({
    where: { assignedWorkerId: user.id, status: "COMPLETED", payoutStatus: "PENDING" },
    _sum: { budget: true },
  });

  const acceptedOrBeyondCount = accepted.length + active.length + completed.length;
  const completionRate =
    acceptedOrBeyondCount > 0
      ? Math.round((completed.length / acceptedOrBeyondCount) * 100)
      : null;

  return (
    <WorkerDashboardClient
      userName={user.name}
      verificationStatus={profile?.verification?.status ?? "PENDING"}
      hasLocation={Boolean(cityId)}
      tasks={{
        available: available.map((t) => toRow(t, false)),
        nearby: nearby.map((t) => toRow(t, false)),
        accepted: accepted.map((t) => toRow(t, true)),
        active: active.map((t) => toRow(t, true)),
        completed: completed.map((t) => toRow(t, true)),
      }}
      stats={{
        earnings: earningsAgg._sum.budget ?? 0,
        pendingPayout: pendingPayoutAgg._sum.budget ?? 0,
        rating: profile?.rating ?? null,
        completionRate,
        unreadNotifications,
      }}
    />
  );
}
