"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  type: string;
}

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationRow[];
}) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busy, setBusy] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markRead(id: string) {
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await apiFetch("/api/customer/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id }),
      });
    } catch {
      // Non-critical — a failed mark-as-read doesn't need a user-facing error.
    }
  }

  async function markAllRead() {
    setBusy(true);
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await apiFetch("/api/customer/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAll: true }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">
          {t("customer.notifications")}
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} disabled={busy}>
            {t("customer.markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 text-4xl">🔔</div>
          <p className="font-semibold text-ink">{t("customer.noNotifications")}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "cursor-pointer",
                !n.isRead && "border-l-4 border-brand bg-brand/5"
              )}
              onClick={() => !n.isRead && markRead(n.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("font-medium text-ink", !n.isRead && "font-semibold")}>
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
