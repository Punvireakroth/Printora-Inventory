import { Suspense } from "react";
import {
  AuthMarketingPane,
  AuthSplitShell,
} from "@/features/auth/components/auth-split-shell";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";
import { getTranslations } from "next-intl/server";

export default async function ForgotPasswordPage () {
  const tAuth = await getTranslations("auth");

  return (
    <AuthSplitShell
      form={(
        <Suspense fallback={null}>
          <ForgotPasswordPanel />
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
