import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';

// import { getMessages } from 'components/common/DatabaseEditor/i18n';
import englishMessages from 'components/common/DatabaseEditor/i18n/en.json';
import { useAppDispatch, useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { fetchLanguage, getLanguage } from 'components/common/DatabaseEditor/store/language';

export default function IntlProviderComponent({ children }: { children: ReactNode }) {
  const language = useAppSelector<string>(getLanguage);
  const dispatch = useAppDispatch();
  const locale = 'en'; // language.split(/[_]/)[0];

  useEffect(() => {
    dispatch(fetchLanguage());
  }, []);

  return (
    <IntlProvider locale={locale} messages={englishMessages}>
      {children}
    </IntlProvider>
  );
}
