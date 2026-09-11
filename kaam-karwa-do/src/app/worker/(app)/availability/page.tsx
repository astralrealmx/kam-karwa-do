import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { WorkerAvailabilityClient } from "./WorkerAvailabilityClient";

export default async function WorkerAvailabilityPage() {
  const user = await requireWorker();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { availability: true, location: { include: { city: true, area: true } } },
  });

  return (
    <WorkerAvailabilityClient
      initial={{
        isAvailable: profile?.availability?.isAvailable ?? false,
        workingDays: profile?.availability?.workingDays ?? [],
        startTime: profile?.availability?.startTime ?? "09:00",
        endTime: profile?.availability?.endTime ?? "18:00",
        radiusKm: profile?.location?.radiusKm ?? 5,
        currentArea:
          [profile?.location?.area?.name, profile?.location?.city?.name]
            .filter(Boolean)
            .join(", ") || null,
      }}
    />
  );
}
