import { requireCustomer } from "@/lib/auth/session";
import { CustomerNav } from "@/components/customer/CustomerNav";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative check: validates the session against the database and
  // confirms role === CUSTOMER. Redirects to /login (no session) or /
  // (logged in but not a customer — e.g. a worker/admin account) before
  // any customer-area UI or data is ever rendered. Every /api/customer/*
  // route handler performs this same check independently, so this layout
  // guard is a UX convenience, not the only line of defense.
  const user = await requireCustomer();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
      <CustomerNav user={user} />
      <main className="min-w-0 flex-1 pb-20 md:pb-6">{children}</main>
    </div>
  );
}
