import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover",
        className
      )}
      {...props}
    />
  );
}
