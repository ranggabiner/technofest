import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loginDemoHref, loginRealHref } from "@/lib/i18n/marketing";

import {
  getAuthErrorMessage,
  LoginOptionGrid,
  LoginPageShell,
  type LoginOption,
  type LoginSearchParams,
} from "./_components/login-content";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  await redirectAuthenticatedUserFromPublicRoute();

  const params = (await searchParams) ?? {};
  const copy = await getDictionary();
  const loginCopy = copy.marketing.login;
  const authError = getAuthErrorMessage(loginCopy.authErrors, params.error);
  const options: LoginOption[] = loginCopy.optionCards.map((option, index) => ({
    ...option,
    href: index === 0 ? loginDemoHref : loginRealHref,
  }));

  return (
    <LoginPageShell
      authError={authError}
      copy={loginCopy}
      copyright={copy.common.copyright}
      description={loginCopy.chooserDescription}
      title={loginCopy.chooserTitle}
      renderContent={() => <LoginOptionGrid options={options} />}
    />
  );
}
