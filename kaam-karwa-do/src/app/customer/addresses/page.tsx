import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AddressesClient } from "./AddressesClient";

export default async function CustomerAddressesPage() {
  const user = await requireCustomer();

  // Never exposed publicly — this query is scoped to the logged-in
  // customer only, and this page itself is behind requireCustomer().
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AddressesClient
      initialAddresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        formatted: a.formatted,
        pincode: a.pincode,
        isDefault: a.isDefault,
      }))}
    />
  );
}
