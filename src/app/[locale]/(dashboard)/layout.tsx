import { CurrentUserProvider } from "@/features/auth/components/current-user-provider";
import { getCurrentUser } from "@/features/auth/services/get-current-user";
import { getCashierAllowedModules } from "@/features/auth/services/module-access";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardGroupLayout ({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, allowedModules] = await Promise.all([
    getCurrentUser(),
    getCashierAllowedModules(),
  ]);

  return (
    <CurrentUserProvider allowedModules={allowedModules} initialUser={user}>
      <DashboardShell>{children}</DashboardShell>
    </CurrentUserProvider>
  );
}
