import { Suspense } from "react";
import {
  AuthMarketingPane,
  AuthSplitShell,
} from "@/features/auth/components/auth-split-shell";
import { UpdatePasswordPanel } from "@/features/auth/components/update-password-panel";
import { getTranslations } from "next-intl/server";

export default async function UpdatePasswordPage () {
  const tAuth = await getTranslations("auth");

  return (
    <AuthSplitShell
      form={(
        <Suspense fallback={null}>
          <UpdatePasswordPanel />
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
