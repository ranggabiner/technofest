import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import {
  BackToLoginOptions,
  getAuthErrorMessage,
  GoogleLoginForm,
  LoginPageShell,
  type LoginSearchParams,
} from "../_components/login-content";

export const dynamic = "force-dynamic";

export default async function RealLoginPage({
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
      description={loginCopy.realPageDescription}
      title={loginCopy.realPageTitle}
      renderContent={() => (
        <>
          <GoogleLoginForm
            title={loginCopy.oauthTitle}
            label={loginCopy.google}
            loadingLabel={loginCopy.oauthSubmitting}
            className="w-full"
          />
          <BackToLoginOptions label={loginCopy.backToChooser} />
        </>
      )}
    />
  );
}
