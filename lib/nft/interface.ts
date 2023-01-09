import type { supportedChainIds } from 'connectors';

export type NftNodeAttrs = {
  chain: typeof supportedChainIds[number];
  contract: string;
  token: string;
};
