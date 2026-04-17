import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

const SUPPORTED_LOCALES = [
  'en',
  'de',
  'es',
  'id',
  'ms',
  'zh',
  'tl',
  'jp'
] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(locale: string | undefined): locale is SupportedLocale {
  return Boolean(locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = merged[key];

    if (isRecord(baseValue) && isRecord(overrideValue)) {
      merged[key] = deepMerge(baseValue, overrideValue);
      continue;
    }

    merged[key] = overrideValue;
  }

  return merged;
}
 
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: SupportedLocale = isSupportedLocale(requestedLocale)
    ? requestedLocale
    : 'en';

  const enMessages = (await import('../language/en.json')).default as Record<string, unknown>;

  if (locale === 'en') {
    return {
      locale,
      messages: enMessages
    };
  }

  const localeMessages = (await import(`../language/${locale}.json`)).default as Record<string, unknown>;
 
  return {
    locale,
    messages: deepMerge(enMessages, localeMessages)
  };
});

