import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { Outlet, useLoaderData, useRouteError } from "react-router";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";

// Static imports for Polaris translations
import polarisEn from "@shopify/polaris/locales/en.json";
import polarisVi from "@shopify/polaris/locales/vi.json";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-link": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { href?: string };
    }
  }
}
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { TranslationProvider, detectLocale, useTranslation } from "../utils/i18n";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const locale = detectLocale(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale,
  };
};

// --- Polaris translations map ---

const POLARIS_TRANSLATIONS: Record<string, typeof polarisEn> = {
  en: polarisEn,
  vi: polarisVi,
};

// --- Nav with i18n ---

function AppNav() {
  const { t } = useTranslation();
  return (
    <s-app-nav>
      <s-link href="/app">{t("nav.dashboard")}</s-link>
      <s-link href="/app/products">{t("nav.products")}</s-link>
      <s-link href="/app/orders">{t("nav.orders")}</s-link>
      <s-link href="/app/inventory">{t("nav.inventory")}</s-link>
    </s-app-nav>
  );
}

export default function App() {
  const { apiKey, locale } = useLoaderData<typeof loader>();
  const polarisI18n = POLARIS_TRANSLATIONS[locale] ?? POLARIS_TRANSLATIONS.en;

  return (
    <PolarisAppProvider i18n={polarisI18n}>
      <TranslationProvider locale={locale}>
        <AppProvider embedded apiKey={apiKey}>
          <AppNav />
          <Outlet />
        </AppProvider>
      </TranslationProvider>
    </PolarisAppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

import type { HeadersArgs } from "react-router";

export const headers: HeadersFunction = (headersArgs: HeadersArgs) => {
  return boundary.headers(headersArgs);
};
