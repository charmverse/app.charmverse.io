import type { ReactElement } from 'react';

import Header from './components/Header';
import PageWrapper from './components/PageWrapper';

export default function getLayout (page: ReactElement) {
  return (
    <PageWrapper>
      <Header />
      {page}
    </PageWrapper>
  );
}
