import type { Metadata } from 'next';

import { DataProcessingPage } from 'components/info/dpa/DataProcessingPage';

export const metadata: Metadata = {
  title: 'Data Processing Addendum'
};

export default async function Info() {
  return <DataProcessingPage />;
}
