import { cn } from "@/lib/utils";

export type Status = "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const STYLES: Record<Status, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-sky-50 text-sky-700",
  ACTIVE: "bg-brand/10 text-brand",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const LABELS: Record<Status, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function TaskStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}
