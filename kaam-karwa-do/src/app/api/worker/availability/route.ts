import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";
import { WEEKDAYS } from "@/lib/validation/worker";

export async function GET() {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { availability: true, location: true },
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    availability: {
      isAvailable: profile.availability?.isAvailable ?? false,
      workingDays: profile.availability?.workingDays ?? [],
      startTime: profile.availability?.startTime ?? null,
      endTime: profile.availability?.endTime ?? null,
      radiusKm: profile.location?.radiusKm ?? 5,
    },
  });
}

const updateSchema = z.object({
  isAvailable: z.boolean().optional(),
  workingDays: z.array(z.enum(WEEKDAYS)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  radiusKm: z.number().int().min(1).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { location: true },
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  const { isAvailable, workingDays, startTime, endTime, radiusKm } = parsed.data;

  await prisma.workerAvailability.upsert({
    where: { workerProfileId: profile.id },
    update: {
      ...(isAvailable !== undefined ? { isAvailable } : {}),
      ...(workingDays !== undefined ? { workingDays } : {}),
      ...(startTime !== undefined ? { startTime: startTime || null } : {}),
      ...(endTime !== undefined ? { endTime: endTime || null } : {}),
    },
    create: {
      workerProfileId: profile.id,
      isAvailable: isAvailable ?? false,
      workingDays: workingDays ?? [],
      startTime: startTime || null,
      endTime: endTime || null,
    },
  });

  if (radiusKm !== undefined) {
    if (profile.location) {
      await prisma.workerLocation.update({
        where: { workerProfileId: profile.id },
        data: { radiusKm },
      });
    } else {
      // No base location set yet — radius alone isn't meaningful without
      // one, so this is a no-op rather than creating a half-formed
      // WorkerLocation row. The UI should direct the worker to set a
      // location first (see /worker/availability page).
    }
  }

  return NextResponse.json({ ok: true });
}
