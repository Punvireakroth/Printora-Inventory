import { AuthMarketingPane, AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { LoginPanel } from "@/features/auth/components/login-panel";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

export default async function LoginPage () {
  const tAuth = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <AuthSplitShell
      form={(
        <Suspense fallback={(
          <div
            aria-busy
            className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-8 text-muted-foreground text-sm"
          >
            {tCommon("loading")}
          </div>
        )}
        >
          <LoginPanel />
        </Suspense>
      )}
      hero={(
        <AuthMarketingPane
          welcomeText={tAuth("heroWelcome")}
        />
      )}
    />
  );
}
