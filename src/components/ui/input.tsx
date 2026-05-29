import type * as React from "react";

import { cn } from "@/lib/utils";

export function Input ({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
