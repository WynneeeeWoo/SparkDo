import { en, type TranslationKey } from './en';
import { zh } from './zh';

export type Language = 'en' | 'zh';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  zh,
};

export { type TranslationKey };
