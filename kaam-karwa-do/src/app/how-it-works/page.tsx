import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function HowItWorksPage() {
  return (
    <PageShell
      title="How It Works"
      subtitle="Getting a local task done with KAAM KARWA DO takes just a few steps."
    >
      <div className="not-prose grid gap-5 sm:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-ink">For Customers</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
            <li>Post a task with details, location, and timing.</li>
            <li>Review interested workers near you.</li>
            <li>Choose a worker and get the task done.</li>
            <li>Confirm completion.</li>
          </ol>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-ink">For Workers</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
            <li>Create a worker profile and pick your categories.</li>
            <li>Browse tasks posted near your area.</li>
            <li>Offer to help and agree on details.</li>
            <li>Complete the task and get paid.</li>
          </ol>
        </Card>
      </div>
    </PageShell>
  );
}
