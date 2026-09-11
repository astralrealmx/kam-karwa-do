import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: {
      categories: true,
      skills: true,
      location: { include: { city: true, area: true } },
      verification: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  // Live-computed, never cached: completed tasks + completion rate.
  const [completedCount, acceptedOrBeyondCount] = await Promise.all([
    prisma.task.count({ where: { assignedWorkerId: user.id, status: "COMPLETED" } }),
    prisma.task.count({
      where: {
        assignedWorkerId: user.id,
        status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] },
      },
    }),
  ]);

  const completionRate =
    acceptedOrBeyondCount > 0
      ? Math.round((completedCount / acceptedOrBeyondCount) * 100)
      : null;

  // Deliberately shaped so bank/verification internals never leave this
  // route: only status (no rejectionReason/provider internals to self is
  // fine since it's their own record, but we still never include
  // payoutAccountRef raw value beyond the masked label).
  return NextResponse.json({
    ok: true,
    profile: {
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: profile.bio,
      experienceYears: profile.experienceYears,
      languages: profile.languages,
      categories: profile.categories.map((c) => ({ slug: c.slug, nameEn: c.nameEn })),
      skills: profile.skills.map((s) => s.name),
      city: profile.location?.city?.name ?? null,
      area: profile.location?.area?.name ?? null,
      radiusKm: profile.location?.radiusKm ?? null,
      rating: profile.rating,
      completedCount,
      completionRate,
      verificationStatus: profile.verification?.status ?? "PENDING",
      payoutLinked: Boolean(profile.payoutLinkedAt),
      payoutMaskedLabel: profile.payoutMaskedLabel,
    },
  });
}

const updateSchema = z.object({
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  experienceYears: z.number().int().min(0).max(60).optional(),
  languages: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  categorySlugs: z.array(z.string()).min(1).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bio, avatarUrl, experienceYears, languages, categorySlugs, skills } = parsed.data;

  if (avatarUrl !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: avatarUrl || null },
    });
  }

  let categoryConnect: { id: string }[] | undefined;
  if (categorySlugs) {
    const categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
    });
    categoryConnect = categories.map((c) => ({ id: c.id }));
  }

  await prisma.workerProfile.update({
    where: { id: profile.id },
    data: {
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(experienceYears !== undefined ? { experienceYears } : {}),
      ...(languages !== undefined ? { languages } : {}),
      ...(categoryConnect ? { categories: { set: categoryConnect } } : {}),
    },
  });

  if (skills) {
    await prisma.workerSkill.deleteMany({ where: { workerProfileId: profile.id } });
    if (skills.length > 0) {
      await prisma.workerSkill.createMany({
        data: skills.map((name) => ({ workerProfileId: profile.id, name })),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
