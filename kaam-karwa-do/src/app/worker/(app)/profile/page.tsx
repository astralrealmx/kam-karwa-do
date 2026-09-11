import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { WorkerProfileClient } from "./WorkerProfileClient";

export default async function WorkerProfilePage() {
  const user = await requireWorker();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { categories: true, skills: true, verification: true, location: { include: { city: true, area: true } } },
  });

  const [completedCount, acceptedOrBeyondCount] = await Promise.all([
    prisma.task.count({ where: { assignedWorkerId: user.id, status: "COMPLETED" } }),
    prisma.task.count({
      where: { assignedWorkerId: user.id, status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } },
    }),
  ]);

  const completionRate =
    acceptedOrBeyondCount > 0 ? Math.round((completedCount / acceptedOrBeyondCount) * 100) : null;

  return (
    <WorkerProfileClient
      categories={CATEGORIES}
      initial={{
        name: user.name ?? "",
        phone: user.phone ?? "",
        avatarUrl: user.avatarUrl ?? "",
        bio: profile?.bio ?? "",
        experienceYears: profile?.experienceYears ?? null,
        languages: profile?.languages ?? [],
        skills: profile?.skills.map((s) => s.name) ?? [],
        categorySlugs: profile?.categories.map((c) => c.slug) ?? [],
        area:
          [profile?.location?.area?.name, profile?.location?.city?.name]
            .filter(Boolean)
            .join(", ") || null,
        rating: profile?.rating ?? null,
        completedCount,
        completionRate,
        verificationStatus: profile?.verification?.status ?? "PENDING",
      }}
    />
  );
}
