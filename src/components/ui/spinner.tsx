import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClassName = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
} as const;

export function Spinner ({ className, label, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(
        "animate-spin text-primary",
        sizeClassName[size],
        className,
      )}
      role={label ? "status" : undefined}
    />
  );
}
