import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";
import { workerOnboardingSchema } from "@/lib/validation/worker";
import { findOrCreateCity, findOrCreateArea } from "@/lib/location/findOrCreateCityArea";
import { getPayoutProvider } from "@/lib/worker/payoutProvider";

export async function POST(req: NextRequest) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const existingProfile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existingProfile?.onboardingCompletedAt) {
    return NextResponse.json(
      { ok: false, error: "ALREADY_ONBOARDED" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = workerOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const categories = await prisma.category.findMany({
    where: { slug: { in: data.categorySlugs } },
  });

  if (categories.length === 0) {
    return NextResponse.json(
      { ok: false, error: "INVALID_CATEGORIES" },
      { status: 400 }
    );
  }

  const city = await findOrCreateCity(data.cityName, data.stateName);
  const area = data.areaName ? await findOrCreateArea(data.areaName, city.id) : null;

  // Payout: only ever the DEV ONLY provider's return value (masked label +
  // opaque reference) is persisted. The raw account number/IFSC the
  // worker typed in `data.payout` is used for exactly this one call and
  // is never written to the database.
  let payoutFields: {
    payoutProvider?: string;
    payoutAccountRef?: string;
    payoutMaskedLabel?: string;
    payoutLinkedAt?: Date;
  } = {};

  if (data.payout) {
    const provider = getPayoutProvider();
    const linked = await provider.linkAccount(data.payout);
    payoutFields = {
      payoutProvider: linked.provider,
      payoutAccountRef: linked.accountRef,
      payoutMaskedLabel: linked.maskedLabel,
      payoutLinkedAt: new Date(),
    };
  }

  if (data.avatarUrl) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: data.avatarUrl },
    });
  }

  const workerProfile = await prisma.$transaction(async (tx) => {
    const profile = await tx.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: data.bio || null,
        experienceYears: data.experienceYears,
        languages: data.languages,
        onboardingCompletedAt: new Date(),
        categories: { set: categories.map((c) => ({ id: c.id })) },
        ...payoutFields,
      },
      create: {
        userId: user.id,
        bio: data.bio || null,
        experienceYears: data.experienceYears,
        languages: data.languages,
        onboardingCompletedAt: new Date(),
        categories: { connect: categories.map((c) => ({ id: c.id })) },
        ...payoutFields,
      },
    });

    // Replace skill list wholesale — simplest correct semantics for a
    // one-shot onboarding submit.
    await tx.workerSkill.deleteMany({ where: { workerProfileId: profile.id } });
    if (data.skills.length > 0) {
      await tx.workerSkill.createMany({
        data: data.skills.map((name) => ({ workerProfileId: profile.id, name })),
      });
    }

    await tx.workerAvailability.upsert({
      where: { workerProfileId: profile.id },
      update: {
        isAvailable: data.isAvailable,
        workingDays: data.workingDays,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      },
      create: {
        workerProfileId: profile.id,
        isAvailable: data.isAvailable,
        workingDays: data.workingDays,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      },
    });

    await tx.workerLocation.upsert({
      where: { workerProfileId: profile.id },
      update: {
        cityId: city.id,
        areaId: area?.id,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusKm: data.radiusKm,
        source: data.locationSource,
      },
      create: {
        workerProfileId: profile.id,
        cityId: city.id,
        areaId: area?.id,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusKm: data.radiusKm,
        source: data.locationSource,
      },
    });

    await tx.workerVerification.upsert({
      where: { workerProfileId: profile.id },
      update: {},
      create: {
        workerProfileId: profile.id,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    return profile;
  });

  return NextResponse.json({ ok: true, workerProfileId: workerProfile.id });
}
