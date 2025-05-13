import { createClient, reservoirChains } from '@reservoir0x/reservoir-sdk';

export const reservoirClient = createClient({
  chains: Object.values(reservoirChains).map((chain) => ({ ...chain, active: true })),
  source: 'charmverse.io'
});
