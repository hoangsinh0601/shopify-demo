import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { Outlet, useLoaderData, useRouteError } from "react-router";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";

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

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <AppProvider embedded apiKey={apiKey}>
        <s-app-nav>
          <s-link href="/app">Dashboard</s-link>
          <s-link href="/app/products">Sản phẩm</s-link>
          <s-link href="/app/orders">Đơn hàng</s-link>
          <s-link href="/app/inventory">Tồn kho</s-link>
        </s-app-nav>
        <Outlet />
      </AppProvider>
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
