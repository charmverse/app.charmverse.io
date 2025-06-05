import englishMessages from '@packages/databases/i18n/en.json';
import { useAppDispatch, useAppSelector } from '@packages/databases/store/hooks';
import { fetchLanguage, getLanguage } from '@packages/databases/store/language';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';

// import { getMessages } from '@packages/databases/i18n';
export default function IntlProviderComponent({ children }: { children: ReactNode }) {
  const language = useAppSelector<string>(getLanguage);
  const dispatch = useAppDispatch();
  const locale = 'en'; // language.split(/[_]/)[0];

  useEffect(() => {
    dispatch(fetchLanguage());
  }, []);

  return (
    <IntlProvider locale={locale} messages={englishMessages}>
      {children as any}
    </IntlProvider>
  );
}
