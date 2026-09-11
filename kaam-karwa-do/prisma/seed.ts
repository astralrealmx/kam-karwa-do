import { PrismaClient } from "@prisma/client";
import { CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameEn: category.nameEn,
        nameHinglish: category.nameHinglish,
        icon: category.icon,
      },
      create: {
        slug: category.slug,
        nameEn: category.nameEn,
        nameHinglish: category.nameHinglish,
        icon: category.icon,
      },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
