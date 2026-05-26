import { CurrentUserProvider } from "@/features/auth/components/current-user-provider";
import { getCurrentUser } from "@/features/auth/services/get-current-user";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardGroupLayout ({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <CurrentUserProvider initialUser={user}>
      <DashboardShell>{children}</DashboardShell>
    </CurrentUserProvider>
  );
}
