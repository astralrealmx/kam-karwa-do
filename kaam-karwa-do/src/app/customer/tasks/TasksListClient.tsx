"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TaskStatusBadge } from "@/components/customer/TaskStatusBadge";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface TaskRow {
  id: string;
  title: string;
  status: Status;
  categoryName: string | null;
  createdAt: string;
}

const FILTERS: { key: Status | "ALL"; labelKey: string }[] = [
  { key: "ALL", labelKey: "myTasks" },
  { key: "ACTIVE", labelKey: "activeTasks" },
  { key: "ACCEPTED", labelKey: "acceptedTasks" },
  { key: "PENDING", labelKey: "pendingTasks" },
  { key: "COMPLETED", labelKey: "completedTasks" },
  { key: "CANCELLED", labelKey: "cancelledTasks" },
];

export function TasksListClient({ tasks }: { tasks: TaskRow[] }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Status | "ALL">("ALL");

  const filtered = filter === "ALL" ? tasks : tasks.filter((t2) => t2.status === filter);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">{t("customer.myTasks")}</h1>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap",
              filter === f.key
                ? "bg-brand text-white"
                : "bg-white text-slate-600 shadow-card"
            )}
          >
            {t(`customer.${f.labelKey}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
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
  );
}
