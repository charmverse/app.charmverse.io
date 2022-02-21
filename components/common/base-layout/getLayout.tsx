import { ReactElement } from 'react';
import PageWrapper from './PageWrapper';
import Header from './Header';

export default function getLayout (page: ReactElement) {
  return (
    <PageWrapper>
      <Header />
      {page}
    </PageWrapper>
  );
}
