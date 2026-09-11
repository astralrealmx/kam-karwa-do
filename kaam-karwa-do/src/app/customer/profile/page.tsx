import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";

export default async function CustomerProfilePage() {
  const user = await requireCustomer();

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <ProfileClient
      initial={{
        name: fullUser?.name ?? "",
        phone: fullUser?.phone ?? "",
        email: fullUser?.email ?? "",
        avatarUrl: fullUser?.avatarUrl ?? "",
        language: fullUser?.language ?? "EN",
      }}
    />
  );
}
