import { Game7Page } from '@packages/scoutgame-ui/components/info/partner-rewards/Game7Page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game7 Partner Rewards'
};

export default async function Game7() {
  return <Game7Page />;
}
