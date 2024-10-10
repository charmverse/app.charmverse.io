import { getAlchemyBaseUrl } from '@root/lib/blockchain/provider/alchemy/client';
import type { Hex } from 'viem';
import { optimism } from 'viem/chains';
import * as yup from 'yup';

export function getAuthConfig() {
  const config = {
    relay: 'https://relay.farcaster.xyz',
    rpcUrl: optimism.rpcUrls.default.http[0],
    domain: 'scoutgame.xyz',
    siweUri: 'https://scoutgame.xyz/login',
    provider: optimism
  };
  try {
    const optimismRpc = getAlchemyBaseUrl(optimism.id);
    return {
      ...config,
      rpcUrl: optimismRpc
    };
  } catch (_) {
    return config;
  }
}

export const authSchema = yup.object({
  nonce: yup.string().defined(),
  message: yup.string().required(),
  signature: yup.string<Hex>().required()
  // state: yup.string<'pending' | 'completed'>().defined().oneOf(['pending', 'completed']),
  // custody: yup.string<Hex>().required()
});

export type AuthSchema = yup.InferType<typeof authSchema>;
