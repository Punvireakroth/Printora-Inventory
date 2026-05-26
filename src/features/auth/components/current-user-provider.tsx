"use client";

import { getCurrentUserAction } from "@/features/auth/actions/get-current-user";
import type { CurrentUser } from "@/features/auth/types/current-user";
import {
  userIsCashier,
  userIsOwner,
} from "@/features/auth/types/current-user";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  isOwner: boolean;
  isCashier: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider ({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await getCurrentUserAction();
      setUser(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      isLoading,
      refresh,
      isOwner: userIsOwner(user),
      isCashier: userIsCashier(user),
    }),
    [user, isLoading, refresh],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser (): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return context;
}
