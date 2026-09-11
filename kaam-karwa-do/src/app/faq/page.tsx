import { PageShell } from "@/components/layout/PageShell";

const FAQS = [
  {
    q: "What is KAAM KARWA DO?",
    a: "A local task marketplace where you can post everyday tasks — errands, pickups, document help, and more — and get matched with a trusted worker near you.",
  },
  {
    q: "How do I post a task?",
    a: "Tap 'Post a Task', describe what you need, set your location, and submit. Workers near you can then respond.",
  },
  {
    q: "How are workers verified?",
    a: "Workers go through a profile verification step before they can accept tasks on the platform.",
  },
  {
    q: "Is my location shared publicly?",
    a: "No. Only an approximate area is used for discovery. Your exact address is shared only with the worker assigned to your task, at the right point in the task lifecycle.",
  },
  {
    q: "Which cities are supported?",
    a: "We're starting in select Indian cities and expanding from there.",
  },
  {
    q: "What languages does the app support?",
    a: "English and Hinglish today, with more Indian languages planned.",
  },
];

export default function FaqPage() {
  return (
    <PageShell title="Frequently Asked Questions">
      <div className="not-prose divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
        {FAQS.map((faq) => (
          <div key={faq.q} className="px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">{faq.q}</h3>
            <p className="mt-1 text-sm text-slate-500">{faq.a}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
