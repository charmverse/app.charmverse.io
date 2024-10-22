import type { Metadata } from 'next';

import { BuilderNftsPage } from 'components/info/pages/BuilderNftsPage';

export const metadata: Metadata = {
  title: 'Builder NFTs'
};

export default async function BuilderNfts() {
  return <BuilderNftsPage />;
}
