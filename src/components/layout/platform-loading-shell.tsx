"use client";

import { Suspense, type ReactNode } from "react";

import { LoadingIndicator } from "@/components/layout/loading-indicator";
import { LoadingProvider } from "@/components/layout/loading-provider";
import { NavigationLoadingListener } from "@/components/layout/navigation-loading-listener";
import { Toaster } from "@/components/ui/sonner";

function NavigationListenerWithSuspense () {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingListener />
    </Suspense>
  );
}

export function PlatformLoadingShell ({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <div className="print:hidden">
        <LoadingIndicator />
        <Toaster />
      </div>
      <NavigationListenerWithSuspense />
      {children}
    </LoadingProvider>
  );
}
