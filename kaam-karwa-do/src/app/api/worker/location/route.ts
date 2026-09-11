import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";
import { findOrCreateCity, findOrCreateArea } from "@/lib/location/findOrCreateCityArea";

export async function GET() {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { location: { include: { city: true, area: true } } },
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  // This is the owning worker reading their own record, so it's fine to
  // include lat/lng here — the privacy rule is about OTHER users/public
  // endpoints never seeing it, not about the worker seeing their own data.
  return NextResponse.json({
    ok: true,
    location: profile.location
      ? {
          cityName: profile.location.city?.name ?? null,
          stateName: profile.location.city?.state ?? null,
          areaName: profile.location.area?.name ?? null,
          latitude: profile.location.latitude,
          longitude: profile.location.longitude,
          radiusKm: profile.location.radiusKm,
          source: profile.location.source,
        }
      : null,
  });
}

const updateSchema = z.object({
  cityName: z.string().trim().min(2).max(100),
  stateName: z.string().trim().min(2).max(100),
  areaName: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  source: z.enum(["DEVICE_GPS", "MANUAL"]).default("MANUAL"),
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

  const data = parsed.data;
  const city = await findOrCreateCity(data.cityName, data.stateName);
  const area = data.areaName ? await findOrCreateArea(data.areaName, city.id) : null;

  await prisma.workerLocation.upsert({
    where: { workerProfileId: profile.id },
    update: {
      cityId: city.id,
      areaId: area?.id ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      source: data.source,
    },
    create: {
      workerProfileId: profile.id,
      cityId: city.id,
      areaId: area?.id,
      latitude: data.latitude,
      longitude: data.longitude,
      source: data.source,
    },
  });

  return NextResponse.json({ ok: true });
}
