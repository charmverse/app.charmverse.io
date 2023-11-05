import type { ReactElement } from 'react';

import { Header } from './components/Header';
import type { PageWrapperOptions } from './components/PageWrapper';
import PageWrapper from './components/PageWrapper';

export function getLayout(page: ReactElement, options: PageWrapperOptions = {}) {
  return (
    <PageWrapper bgcolor={options.bgcolor}>
      <Header />
      {page}
    </PageWrapper>
  );
}
