"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TaskStatusBadge } from "@/components/customer/TaskStatusBadge";

interface RecentTask {
  id: string;
  title: string;
  status: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  categoryName: string | null;
  createdAt: string;
}

interface Counts {
  PENDING: number;
  ACCEPTED: number;
  ACTIVE: number;
  COMPLETED: number;
  CANCELLED: number;
}

export function DashboardClient({
  counts,
  recentTasks,
  totalTasks,
  userName,
}: {
  counts: Counts;
  recentTasks: RecentTask[];
  totalTasks: number;
  userName: string | null;
}) {
  const { t } = useLanguage();

  const statusCards: { key: keyof Counts; labelKey: string; color: string }[] = [
    { key: "ACTIVE", labelKey: "activeTasks", color: "bg-brand/10 text-brand" },
    { key: "ACCEPTED", labelKey: "acceptedTasks", color: "bg-sky-50 text-sky-700" },
    { key: "PENDING", labelKey: "pendingTasks", color: "bg-amber-50 text-amber-700" },
    { key: "COMPLETED", labelKey: "completedTasks", color: "bg-green-50 text-green-700" },
    { key: "CANCELLED", labelKey: "cancelledTasks", color: "bg-slate-100 text-slate-500" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {t("customer.dashboard")}
          </h1>
          {userName && (
            <p className="text-sm text-slate-500">Welcome back, {userName}.</p>
          )}
        </div>
        <Link href="/post-task">
          <Button>{"➕ "}{t("home.postTaskCta")}</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statusCards.map((card) => (
          <Card key={card.key} className="text-center">
            <div
              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${card.color}`}
            >
              {counts[card.key]}
            </div>
            <p className="text-xs font-medium text-slate-500">
              {t(`customer.${card.labelKey}`)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{t("customer.myTasks")}</h2>
          {totalTasks > 0 && (
            <Link href="/customer/tasks" className="text-sm font-medium text-brand">
              View all →
            </Link>
          )}
        </div>

        {totalTasks === 0 ? (
          <EmptyTasksState />
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <Link key={task.id} href={`/customer/tasks/${task.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.categoryName ?? "General"} ·{" "}
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyTasksState() {
  const { t } = useLanguage();
  return (
    <Card className="flex flex-col items-center py-10 text-center">
      <div className="mb-3 text-4xl">🗒️</div>
      <p className="font-semibold text-ink">{t("customer.emptyTasksTitle")}</p>
      <p className="mt-1 text-sm text-slate-500">
        {t("customer.emptyTasksSubtitle")}
      </p>
      <Link href="/post-task" className="mt-4">
        <Button>{t("home.postTaskCta")}</Button>
      </Link>
    </Card>
  );
}
