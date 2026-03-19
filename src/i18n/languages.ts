export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  es: 'Español',
  en: 'English',
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  es: 'Spanish',
  en: 'English',
};

export function normalizeLanguage(code: string): LanguageCode {
  const base = code.toLowerCase().split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(base as LanguageCode)) {
    return base as LanguageCode;
  }
  return 'es';
}
