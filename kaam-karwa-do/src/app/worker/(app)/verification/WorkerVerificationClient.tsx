"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-sky-50 text-sky-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-slate-200 text-slate-700",
};

export function WorkerVerificationClient({
  status,
  submittedAt,
  rejectionReason,
  providerConfigured,
}: {
  status: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  providerConfigured: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-ink">{t("worker.verification")}</h1>

      <Card>
        <span
          className={cn(
            "inline-block rounded-full px-3 py-1 text-sm font-semibold",
            STATUS_STYLES[status] ?? STATUS_STYLES.PENDING
          )}
        >
          {status}
        </span>

        {submittedAt && (
          <p className="mt-3 text-sm text-slate-500">
            Submitted {new Date(submittedAt).toLocaleDateString()}
          </p>
        )}

        {status === "REJECTED" && rejectionReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {rejectionReason}
          </p>
        )}

        {!providerConfigured && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-ink">
              {t("worker.verificationIntegrationPending")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("worker.verificationExplainer")}</p>
          </div>
        )}
      </Card>

      {/* No document upload, no ID number field, anywhere on this page —
          there is no real KYC provider connected in this phase, and this
          app does not fake or simulate one. */}
    </div>
  );
}
