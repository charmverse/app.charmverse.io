import { BuilderNftsPage } from '@packages/scoutgame-ui/components/info/pages/BuilderNftsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Builder NFTs'
};

export default async function BuilderNfts() {
  return <BuilderNftsPage />;
}
