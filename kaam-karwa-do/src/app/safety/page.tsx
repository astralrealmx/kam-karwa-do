import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

const POINTS = [
  {
    title: "Profile verification",
    desc: "Workers complete a verification step before they can appear in search or accept tasks.",
  },
  {
    title: "Privacy-first location sharing",
    desc: "Your exact address is never shown publicly. It is only shared with the worker assigned to your task, at the appropriate point in the task lifecycle.",
  },
  {
    title: "Transparent task status",
    desc: "Every task has a clear status so both sides know what stage it's at.",
  },
  {
    title: "Report a concern",
    desc: "If something feels off, you'll be able to report it directly from the task or profile.",
  },
];

export default function SafetyPage() {
  return (
    <PageShell
      title="Trust & Safety"
      subtitle="A few of the ways we're building KAAM KARWA DO to be safe for both customers and workers."
    >
      <div className="not-prose grid gap-5 sm:grid-cols-2">
        {POINTS.map((point) => (
          <Card key={point.title}>
            <h3 className="font-semibold text-ink">{point.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{point.desc}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
