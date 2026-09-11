import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { WorkerSignupStep } from "./WorkerSignupStep";
import { WorkerOnboardingForm } from "./WorkerOnboardingForm";

export default async function WorkerOnboardingPage() {
  const user = await getSessionUser();

  if (!user) {
    // Step 1: anonymous visitor creating a worker account. Deliberately
    // NOT behind requireWorker() — there is no session yet at this point.
    return <WorkerSignupStep />;
  }

  if (user.role !== "WORKER") {
    // A logged-in customer/admin has no business here.
    redirect("/");
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
  });

  if (profile?.onboardingCompletedAt) {
    redirect("/worker/dashboard");
  }

  return (
    <WorkerOnboardingForm
      categories={CATEGORIES}
      defaultName={user.name}
      defaultPhone={user.phone}
    />
  );
}
