import type { Metadata } from 'next';

import { Game7Page } from 'components/info/partner-rewards/Game7Page';

export const metadata: Metadata = {
  title: 'Game7 Partner Rewards'
};

export default async function Game7() {
  return <Game7Page />;
}
