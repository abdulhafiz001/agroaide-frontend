import { useCallback } from 'react';

import { useAppStore } from '@/store/useAppStore';
import translations, { type SupportedLanguage } from './translations';

export function useTranslation() {
  const preferredLanguage = useAppStore(
    (s) => (s.farmerProfile?.preferredLanguage as SupportedLanguage) ?? 'en',
  );

  const t = useCallback(
    (key: keyof (typeof translations)['en']): string => {
      return translations[preferredLanguage]?.[key] ?? translations.en[key] ?? key;
    },
    [preferredLanguage],
  );

  const getGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  return { t, lang: preferredLanguage, getGreeting };
}
