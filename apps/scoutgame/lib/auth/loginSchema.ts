import * as yup from 'yup';

import { authSchema as walletSchema } from '../blockchain/config';
import { authSchema as farcasterSchema } from '../farcaster/config';

export const schema = yup.object({
  type: yup.string<'farcaster' | 'wallet'>().required().oneOf(['farcaster', 'wallet']),
  farcaster: farcasterSchema
    .optional()
    .default(undefined)
    .when('type', {
      is: (val: 'farcaster' | 'wallet') => val === 'farcaster',
      then: () => farcasterSchema.required('Warpcast payload is required'),
      otherwise: () => yup.object().optional()
    }),
  wallet: walletSchema
    .optional()
    .default(undefined)
    .when('type', {
      is: (val: 'farcaster' | 'wallet') => val === 'wallet',
      then: () => walletSchema.required('Wallet payload is required'),
      otherwise: () => yup.object().optional()
    })
});

export type LoginSchema = yup.InferType<typeof schema>;
