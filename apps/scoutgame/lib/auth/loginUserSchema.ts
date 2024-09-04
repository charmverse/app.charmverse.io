import type { StatusAPIResponse } from '@farcaster/auth-client';
import type { Hex } from 'viem';
import * as yup from 'yup';

export const warpcastSchema: yup.ObjectSchema<StatusAPIResponse> = yup.object({
  state: yup.string<'pending' | 'completed'>().defined().oneOf(['pending', 'completed']),
  nonce: yup.string().defined(),
  url: yup.string().required(),
  message: yup.string(),
  signature: yup.string<Hex>(),
  fid: yup.number(),
  username: yup.string(),
  bio: yup.string(),
  displayName: yup.string(),
  pfpUrl: yup.string(),
  verifications: yup.array().of(yup.string<Hex>().required()),
  custody: yup.string<Hex>(),
  signatureParams: yup.object({
    siweUri: yup.string().defined(),
    domain: yup.string().defined(),
    nonce: yup.string(),
    notBefore: yup.string(),
    expirationTime: yup.string(),
    requestId: yup.string(),
    redirectUrl: yup.string()
  }),
  metadata: yup.object({
    ip: yup.string().defined(),
    userAgent: yup.string().defined()
  })
});

export type LoginWarpcastSchema = yup.InferType<typeof warpcastSchema>;

export const walletSchema = yup.object({ message: yup.string().required(), signature: yup.string().required() });

export type LoginWalletSchema = yup.InferType<typeof walletSchema>;

export const schema = yup.object({
  type: yup.string<'warpcast' | 'wallet'>().required().oneOf(['warpcast', 'wallet']),
  warpcast: warpcastSchema
    .optional()
    .default(undefined)
    .when('type', {
      is: (val: 'warpcast' | 'wallet') => val === 'warpcast',
      then: () => warpcastSchema.required('Warpcast payload is required'),
      otherwise: () => yup.object().optional()
    }),
  wallet: walletSchema
    .optional()
    .default(undefined)
    .when('type', {
      is: (val: 'warpcast' | 'wallet') => val === 'wallet',
      then: () => walletSchema.required('Wallet payload is required'),
      otherwise: () => yup.object().optional()
    })
});

export type LoginSchema = yup.InferType<typeof schema>;
