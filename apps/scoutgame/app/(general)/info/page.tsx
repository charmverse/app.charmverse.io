import type { Metadata } from 'next';

import { InfoPage } from '../../../components/info/InfoPage';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Info'
};

export default async function Info() {
  return <InfoPage />;
}
