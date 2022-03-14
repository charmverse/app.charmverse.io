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

/**
 * Use as an alternative to getLayout when you need to control if the whole page should appear
 */
export function BaseLayout ({ children }: {children: ReactElement []}) {
  return (
    <PageWrapper>
      <Header />
      {children}
    </PageWrapper>
  );
}
