"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  categoryName: string | null;
  budget: number | null;
  createdAt: string;
  approximateArea: string | null;
  exactAddress: string | null;
}

type Scope = "available" | "nearby" | "accepted" | "active" | "completed";

export function WorkerDashboardClient({
  userName,
  verificationStatus,
  hasLocation,
  tasks,
  stats,
}: {
  userName: string | null;
  verificationStatus: string;
  hasLocation: boolean;
  tasks: Record<Scope, TaskRow[]>;
  stats: {
    earnings: number;
    pendingPayout: number;
    rating: number | null;
    completionRate: number | null;
    unreadNotifications: number;
  };
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("available");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TABS: { key: Scope; labelKey: string; count: number }[] = [
    { key: "available", labelKey: "availableTasks", count: tasks.available.length },
    { key: "nearby", labelKey: "nearbyTasks", count: tasks.nearby.length },
    { key: "accepted", labelKey: "acceptedTasks", count: tasks.accepted.length },
    { key: "active", labelKey: "activeTask", count: tasks.active.length },
    { key: "completed", labelKey: "completedTasks", count: tasks.completed.length },
  ];

  const EMPTY_KEY: Record<Scope, string> = {
    available: "noAvailableTasks",
    nearby: "noNearbyTasks",
    accepted: "noAcceptedTasks",
    active: "noActiveTasks",
    completed: "noCompletedTasks",
  };

  async function runAction(taskId: string, action: "accept" | "start" | "complete") {
    setBusyId(taskId);
    setError(null);
    try {
      await apiFetch(`/api/worker/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  }

  const list = tasks[scope];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("worker.dashboard")}</h1>
          {userName && <p className="text-sm text-slate-500">Welcome back, {userName}.</p>}
        </div>
        {verificationStatus !== "VERIFIED" && (
          <Link
            href="/worker/verification"
            className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
          >
            {t("worker.verification")}: {verificationStatus}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">₹{stats.earnings}</p>
          <p className="text-xs font-medium text-slate-500">{t("worker.earnings")}</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">₹{stats.pendingPayout}</p>
          <p className="text-xs font-medium text-slate-500">{t("worker.pendingPayout")}</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">
            {stats.rating !== null ? stats.rating.toFixed(1) : "—"}
          </p>
          <p className="text-xs font-medium text-slate-500">
            {stats.rating !== null ? t("worker.rating") : t("worker.noRatingsYet")}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">
            {stats.completionRate !== null ? `${stats.completionRate}%` : "—"}
          </p>
          <p className="text-xs font-medium text-slate-500">{t("worker.completionRate")}</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">{stats.unreadNotifications}</p>
          <p className="text-xs font-medium text-slate-500">{t("worker.notifications")}</p>
        </Card>
      </div>

      <div className="mt-6 mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScope(tab.key)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap",
              scope === tab.key ? "bg-brand text-white" : "bg-white text-slate-600 shadow-card"
            )}
          >
            {t(`worker.${tab.labelKey}`)} ({tab.count})
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {scope === "nearby" && !hasLocation && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set your location in Availability to see nearby tasks.
        </p>
      )}

      {list.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 text-4xl">🗒️</div>
          <p className="font-semibold text-ink">{t(`worker.${EMPTY_KEY[scope]}`)}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((task) => (
            <Card key={task.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.categoryName ?? "General"} ·{" "}
                    {task.exactAddress ?? task.approximateArea ?? "Location not specified"}
                  </p>
                </div>
                {task.budget && (
                  <span className="flex-shrink-0 text-sm font-semibold text-ink">
                    ₹{task.budget}
                  </span>
                )}
              </div>

              {task.description && (
                <p className="mt-2 text-sm text-slate-600">{task.description}</p>
              )}

              <div className="mt-3">
                {(scope === "available" || scope === "nearby") && (
                  <Button
                    size="sm"
                    onClick={() => runAction(task.id, "accept")}
                    disabled={busyId === task.id}
                  >
                    {busyId === task.id ? "..." : t("worker.accept")}
                  </Button>
                )}
                {scope === "accepted" && (
                  <Button
                    size="sm"
                    onClick={() => runAction(task.id, "start")}
                    disabled={busyId === task.id}
                  >
                    {busyId === task.id ? "..." : t("worker.start")}
                  </Button>
                )}
                {scope === "active" && (
                  <Button
                    size="sm"
                    onClick={() => runAction(task.id, "complete")}
                    disabled={busyId === task.id}
                  >
                    {busyId === task.id ? "..." : t("worker.complete")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
