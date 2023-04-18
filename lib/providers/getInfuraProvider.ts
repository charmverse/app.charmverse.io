import type { Networkish } from '@ethersproject/providers';
import { InfuraProvider } from '@ethersproject/providers';

const INFURA_API_KEY = process.env.INFURA_API_KEY;

export function getInfuraProvider(chain: Networkish) {
  if (!INFURA_API_KEY) {
    throw new Error('No Infura API key provided');
  }

  return new InfuraProvider(chain, INFURA_API_KEY);
}
