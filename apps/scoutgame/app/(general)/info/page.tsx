import type { Metadata } from 'next';

import { InfoPage } from 'components/info/InfoPage';

export const metadata: Metadata = {
  title: 'Info'
};

export default async function Info() {
  return <InfoPage />;
}
