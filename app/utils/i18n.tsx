import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import enTranslations from "../locales/en.json";
import viTranslations from "../locales/vi.json";

// --- Types ---

type TranslationDict = Record<string, unknown>;

// --- Supported locales ---

const TRANSLATIONS: Record<string, TranslationDict> = {
  en: enTranslations,
  vi: viTranslations,
};

export const SUPPORTED_LOCALES = Object.keys(TRANSLATIONS);
export const DEFAULT_LOCALE = "en";

// --- Get nested value by dot path ---

function getNestedValue(obj: TranslationDict, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path; // fallback to key
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : path;
}

// --- Translation function ---

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

function createTFunction(locale: string): TFunction {
  const dict = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];

  return (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(dict as TranslationDict, key);

    // Fallback to English if key missing
    if (value === key && locale !== DEFAULT_LOCALE) {
      value = getNestedValue(TRANSLATIONS[DEFAULT_LOCALE] as TranslationDict, key);
    }

    // Interpolate params: {count}, {processed}, etc.
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
      }
    }

    return value;
  };
}

// --- React Context ---

interface TranslationContextValue {
  locale: string;
  t: TFunction;
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: DEFAULT_LOCALE,
  t: createTFunction(DEFAULT_LOCALE),
});

// --- Provider ---

interface TranslationProviderProps {
  locale: string;
  children: ReactNode;
}

export function TranslationProvider({ locale, children }: TranslationProviderProps) {
  const normalizedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const t = createTFunction(normalizedLocale);

  return (
    <TranslationContext.Provider value={{ locale: normalizedLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

// --- Hook ---

export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext);
}

// --- Detect locale from request ---

export function detectLocale(request: Request): string {
  const acceptLanguage = request.headers.get("Accept-Language") ?? "";
  // Parse first language code, e.g. "vi-VN,vi;q=0.9,en;q=0.8" -> "vi"
  const primary = acceptLanguage.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
  if (primary && SUPPORTED_LOCALES.includes(primary)) {
    return primary;
  }
  return DEFAULT_LOCALE;
}

// --- Get Polaris translations ---

export function getPolarisTranslations(locale: string) {
  // Polaris i18n is loaded statically; we import both and pick
  // This avoids dynamic imports which are problematic in server components
  switch (locale) {
    case "vi":
      return import("@shopify/polaris/locales/vi.json");
    default:
      return import("@shopify/polaris/locales/en.json");
  }
}
