"use client";

import { getCurrentUserAction } from "@/features/auth/actions/get-current-user";
import type { AppModule } from "@/features/auth/constants/app-modules";
import {
  userCanAccessModule,
} from "@/features/auth/services/module-access-client";
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
  allowedModules: AppModule[];
  canAccessModule: (module: AppModule) => boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider ({
  initialUser,
  allowedModules,
  children,
}: {
  initialUser: CurrentUser | null;
  allowedModules: AppModule[];
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
      allowedModules,
      canAccessModule: (module) =>
        userCanAccessModule(user, module, allowedModules),
    }),
    [user, isLoading, refresh, allowedModules],
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
