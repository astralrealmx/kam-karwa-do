import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

export default async function CustomerSettingsPage() {
  const user = await requireCustomer();

  const settings = await prisma.platformSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <SettingsClient
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
