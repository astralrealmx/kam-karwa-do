import { redirect } from "next/navigation";
import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { WorkerNav } from "@/components/worker/WorkerNav";

export default async function WorkerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative check: validates the session against the database and
  // confirms role === WORKER. Redirects to /login (no session) or /
  // (logged in but not a worker — e.g. a customer account) before any
  // worker-area UI or data is ever rendered. Every /api/worker/* route
  // handler performs this same check independently.
  const user = await requireWorker();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    select: { onboardingCompletedAt: true },
  });

  // A worker whose profile isn't fully submitted yet is sent back into
  // onboarding rather than seeing an empty/broken dashboard.
  if (!profile?.onboardingCompletedAt) {
    redirect("/worker/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
      <WorkerNav user={user} />
      <main className="min-w-0 flex-1 pb-20 md:pb-6">{children}</main>
    </div>
  );
}
