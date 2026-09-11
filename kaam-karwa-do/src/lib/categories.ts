// Phase 1 category list. This doubles as the seed source for the
// `Category` table (see prisma/seed.ts) and as static data for rendering
// the homepage / categories page without a database round-trip.

export interface CategoryDef {
  slug: string;
  nameEn: string;
  nameHinglish: string;
  icon: string; // lucide-style icon name placeholder, rendered as emoji fallback in Phase 1
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "pickup-drop",
    nameEn: "Local Pickup / Drop",
    nameHinglish: "Local Pickup / Drop",
    icon: "📦",
  },
  {
    slug: "errands",
    nameEn: "Errands",
    nameHinglish: "Errands",
    icon: "🏃",
  },
  {
    slug: "document-assistance",
    nameEn: "Document / Form Assistance",
    nameHinglish: "Document/Form Assistance",
    icon: "📄",
  },
  {
    slug: "shop-business-assistance",
    nameEn: "Shop / Business Assistance",
    nameHinglish: "Shop/Business Assistance",
    icon: "🏪",
  },
  {
    slug: "computer-online-assistance",
    nameEn: "Computer / Online Assistance",
    nameHinglish: "Computer/Online Assistance",
    icon: "💻",
  },
  {
    slug: "event-assistance",
    nameEn: "Event Assistance",
    nameHinglish: "Event Assistance",
    icon: "🎉",
  },
  {
    slug: "moving-helper",
    nameEn: "Moving / Helper Tasks",
    nameHinglish: "Moving/Helper Tasks",
    icon: "🚚",
  },
  {
    slug: "other",
    nameEn: "Other",
    nameHinglish: "Other",
    icon: "✨",
  },
];
