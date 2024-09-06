import type { Hex } from 'viem';
import { optimism } from 'viem/chains';
import * as yup from 'yup';

export const authConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'charmverse.io',
  siweUri: 'https://app.charmverse.io/login',
  provider: optimism
} as const;

export const authSchema = yup.object({
  nonce: yup.string().defined(),
  message: yup.string().required(),
  signature: yup.string<Hex>().required()
  // state: yup.string<'pending' | 'completed'>().defined().oneOf(['pending', 'completed']),
  // custody: yup.string<Hex>().required()
});

export type AuthSchema = yup.InferType<typeof authSchema>;
