"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TaskStatusBadge } from "@/components/customer/TaskStatusBadge";
import { apiFetch } from "@/lib/apiFetch";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  categoryName: string | null;
  addressLabel: string | null;
  budget: number | null;
  scheduledFor: string | null;
  createdAt: string;
}

export function TaskDetailClient({ task }: { task: TaskDetail }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [error, setError] = useState<string | null>(null);

  const canCancel = status === "PENDING" || status === "ACCEPTED" || status === "ACTIVE";

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      await apiFetch(`/api/customer/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setStatus("CANCELLED");
      router.refresh();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <Link href="/customer/tasks" className="mb-4 inline-block text-sm font-medium text-brand">
        ← {t("customer.myTasks")}
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-ink">{task.title}</h1>
          <TaskStatusBadge status={status} />
        </div>

        {task.description && (
          <p className="mt-3 text-sm text-slate-600">{task.description}</p>
        )}

        <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Category</dt>
            <dd className="text-right font-medium text-ink">
              {task.categoryName ?? "General"}
            </dd>
          </div>
          {task.addressLabel && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Location</dt>
              <dd className="max-w-[60%] text-right font-medium text-ink">
                {task.addressLabel}
              </dd>
            </div>
          )}
          {task.budget && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Budget</dt>
              <dd className="text-right font-medium text-ink">₹{task.budget}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Posted</dt>
            <dd className="text-right font-medium text-ink">
              {new Date(task.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {canCancel && (
          <Button
            variant="outline"
            className="mt-5 border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "..." : t("customer.cancelTask")}
          </Button>
        )}
      </Card>
    </div>
  );
}
