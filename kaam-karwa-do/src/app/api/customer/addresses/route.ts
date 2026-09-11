import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

const createAddressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  formatted: z.string().trim().min(3).max(300),
  pincode: z.string().trim().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  source: z.enum(["DEVICE_GPS", "MANUAL"]).default("MANUAL"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, addresses });
}

export async function POST(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = createAddressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const existingCount = await prisma.address.count({ where: { userId: user.id } });

  const address = await prisma.address.create({
    data: {
      ...data,
      userId: user.id,
      // First saved address becomes the default automatically.
      isDefault: data.isDefault ?? existingCount === 0,
    },
  });

  return NextResponse.json({ ok: true, address }, { status: 201 });
}
