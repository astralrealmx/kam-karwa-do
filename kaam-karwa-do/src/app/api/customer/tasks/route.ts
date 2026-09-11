import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().optional(),
  addressId: z.string().optional(),
  budget: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const statusParam = req.nextUrl.searchParams.get("status");
  const validStatuses = ["PENDING", "ACCEPTED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
  const status = validStatuses.includes(statusParam as (typeof validStatuses)[number])
    ? (statusParam as (typeof validStatuses)[number])
    : undefined;

  // Always scoped to the logged-in customer — never trust a customerId
  // from the query string.
  const tasks = await prisma.task.findMany({
    where: { customerId: user.id, ...(status ? { status } : {}) },
    include: { category: true, address: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, tasks });
}

export async function POST(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      customerId: user.id,
    },
  });

  return NextResponse.json({ ok: true, task }, { status: 201 });
}
