import { PageShell } from "@/components/layout/PageShell";

export default function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      subtitle="Have a question, feedback, or a partnership idea? We'd love to hear from you."
    >
      <p>
        Email us at{" "}
        <a href="mailto:hello@kaamkarwado.in" className="text-brand">
          hello@kaamkarwado.in
        </a>
        .
      </p>
      <p className="text-sm text-slate-400">
        (A full contact form will be added as the platform grows.)
      </p>
    </PageShell>
  );
}
