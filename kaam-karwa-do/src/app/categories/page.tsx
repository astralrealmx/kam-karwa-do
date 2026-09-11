import { PageShell } from "@/components/layout/PageShell";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  return (
    <PageShell
      title="Categories"
      subtitle="Browse the kinds of local tasks people post on KAAM KARWA DO."
    >
      <div className="not-prose grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => (
          <div
            key={category.slug}
            id={category.slug}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-card scroll-mt-24"
          >
            <span className="text-3xl">{category.icon}</span>
            <span className="text-sm font-medium text-ink">
              {category.nameEn}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
