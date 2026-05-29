"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LoadingContextValue = {
  actionPending: boolean;
  navigationPending: boolean;
  isLoading: boolean;
  startAction: () => void;
  stopAction: () => void;
  startNavigation: () => void;
  completeNavigation: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider ({ children }: { children: ReactNode }) {
  const [actionCount, setActionCount] = useState(0);
  const [navigationPending, setNavigationPending] = useState(false);

  const startAction = useCallback(() => {
    setActionCount((count) => count + 1);
  }, []);

  const stopAction = useCallback(() => {
    setActionCount((count) => Math.max(0, count - 1));
  }, []);

  const startNavigation = useCallback(() => {
    setNavigationPending(true);
  }, []);

  const completeNavigation = useCallback(() => {
    setNavigationPending(false);
  }, []);

  const value = useMemo(
    () => ({
      actionPending: actionCount > 0,
      navigationPending,
      isLoading: actionCount > 0 || navigationPending,
      startAction,
      stopAction,
      startNavigation,
      completeNavigation,
    }),
    [
      actionCount,
      navigationPending,
      startAction,
      stopAction,
      startNavigation,
      completeNavigation,
    ],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoadingContext (): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingContext must be used within LoadingProvider");
  }
  return context;
}
