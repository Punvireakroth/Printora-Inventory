"use client";

import { useCallback } from "react";

import { useLoadingContext } from "@/components/layout/loading-provider";

export function useLoadingAction () {
  const { startAction, stopAction, actionPending } = useLoadingContext();

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startAction();
      try {
        return await fn();
      } finally {
        stopAction();
      }
    },
    [startAction, stopAction],
  );

  return { run, isLoading: actionPending };
}

export function useNavigationLoading () {
  const { startNavigation } = useLoadingContext();
  return startNavigation;
}
