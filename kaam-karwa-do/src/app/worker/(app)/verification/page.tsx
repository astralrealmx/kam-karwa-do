import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isVerificationProviderConfigured } from "@/lib/worker/verificationProvider";
import { WorkerVerificationClient } from "./WorkerVerificationClient";

export default async function WorkerVerificationPage() {
  const user = await requireWorker();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { verification: true },
  });

  return (
    <WorkerVerificationClient
      status={profile?.verification?.status ?? "PENDING"}
      submittedAt={profile?.verification?.submittedAt?.toISOString() ?? null}
      rejectionReason={profile?.verification?.rejectionReason ?? null}
      providerConfigured={isVerificationProviderConfigured()}
    />
  );
}
