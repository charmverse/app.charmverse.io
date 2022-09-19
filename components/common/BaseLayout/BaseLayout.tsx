import type { ReactElement } from 'react';
import PageWrapper from './components/PageWrapper';
import Header from './components/Header';

export default function getLayout (page: ReactElement) {
  return (
    <PageWrapper>
      <Header />
      {page}
    </PageWrapper>
  );
}
