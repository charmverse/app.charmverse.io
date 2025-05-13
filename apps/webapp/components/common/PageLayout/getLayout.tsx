import type { ReactElement } from 'react';

import PageLayout from './PageLayout';

export default function getLayout(page: ReactElement) {
  return <PageLayout>{page}</PageLayout>;
}
