"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster (props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-primary/30",
        },
      }}
      {...props}
    />
  );
}
