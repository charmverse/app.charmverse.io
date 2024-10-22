import type { Metadata } from 'next';

import { BuildersPage } from 'components/info/pages/BuildersPage';

export const metadata: Metadata = {
  title: 'Builders'
};

export default async function Builders() {
  return <BuildersPage />;
}
