import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function PricingPage() {
  return (
    <PageShell
      title="Pricing"
      subtitle="Simple and transparent — no hidden fees."
    >
      <div className="not-prose grid gap-5 sm:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-ink">Customers</h3>
          <p className="mt-1 text-sm text-slate-500">
            Posting a task is free. You agree on the price directly with the
            worker you choose.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-ink">Workers</h3>
          <p className="mt-1 text-sm text-slate-500">
            Joining as a worker is free. A small platform fee structure will
            be introduced transparently as the marketplace grows.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
