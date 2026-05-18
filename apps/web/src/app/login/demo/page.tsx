import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import {
  BackToLoginOptions,
  DemoCredentials,
  getAuthErrorMessage,
  LoginPageShell,
  ManualLoginForm,
  type LoginSearchParams,
} from "../_components/login-content";

export const dynamic = "force-dynamic";

export default async function DemoLoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  await redirectAuthenticatedUserFromPublicRoute();

  const params = (await searchParams) ?? {};
  const copy = await getDictionary();
  const loginCopy = copy.marketing.login;
  const authError = getAuthErrorMessage(loginCopy.authErrors, params.error);

  return (
    <LoginPageShell
      authError={authError}
      copy={loginCopy}
      description={loginCopy.demoPageDescription}
      desktopAside={<DemoCredentials copy={loginCopy} />}
      desktopBreakpoint="lg"
      title={loginCopy.demoPageTitle}
      renderContent={(variant) => (
        <>
          {variant === "mobile" ? <DemoCredentials copy={loginCopy} /> : null}
          <ManualLoginForm copy={loginCopy} />
          <BackToLoginOptions label={loginCopy.backToChooser} />
        </>
      )}
    />
  );
}
