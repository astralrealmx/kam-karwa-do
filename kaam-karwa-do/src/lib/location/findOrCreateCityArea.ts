import "server-only";
import { prisma } from "@/lib/db";

export async function findOrCreateCity(name: string, state: string) {
  return prisma.city.upsert({
    where: { name_state: { name, state } },
    update: {},
    create: { name, state },
  });
}

export async function findOrCreateArea(name: string, cityId: string) {
  const existing = await prisma.area.findFirst({ where: { name, cityId } });
  if (existing) return existing;
  return prisma.area.create({ data: { name, cityId } });
}
