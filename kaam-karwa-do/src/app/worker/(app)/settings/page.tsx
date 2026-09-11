import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { WorkerSettingsClient } from "./WorkerSettingsClient";

export default async function WorkerSettingsPage() {
  const user = await requireWorker();

  const settings = await prisma.platformSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <WorkerSettingsClient
      initial={{
        language: settings.language,
        locationPreference: settings.locationPreference,
        notificationsEnabled: settings.notificationsEnabled,
        smsNotifications: settings.smsNotifications,
        emailNotifications: settings.emailNotifications,
      }}
      phone={user.phone}
    />
  );
}
