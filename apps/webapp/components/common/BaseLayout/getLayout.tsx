import type { ReactElement } from 'react';

import { BaseCurrentDomainProvider } from 'hooks/useBaseCurrentDomain';

import { Header } from './components/Header';
import type { PageWrapperOptions } from './components/PageWrapper';
import PageWrapper from './components/PageWrapper';

export function getLayout(page: ReactElement, options: PageWrapperOptions = {}) {
  return (
    <BaseCurrentDomainProvider>
      <PageWrapper bgcolor={options.bgcolor}>
        <Header />
        {page}
      </PageWrapper>
    </BaseCurrentDomainProvider>
  );
}
