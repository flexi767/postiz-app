'use client';
import { FC, useEffect, useState } from 'react';
import { useTranslationSettings } from '@gitroom/react/translation/get.transation.service.client';
import { resolveSupportedLanguage } from '@gitroom/react/translation/i18n.config';

export const HtmlComponent: FC = () => {
  const settings = useTranslationSettings();
  const [dir, setDir] = useState(settings.dir());

  useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      setDir(settings.dir());
      document.documentElement.lang = resolveSupportedLanguage(language);
    };
    settings.on('languageChanged', handleLanguageChanged);
    return () => settings.off('languageChanged', handleLanguageChanged);
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
  }, [dir]);

  return null;
};
