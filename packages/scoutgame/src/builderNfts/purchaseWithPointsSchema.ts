import type { BuilderNftType } from '@charmverse/core/prisma-client';
import * as yup from 'yup';

export const schema = yup.object({
  builderId: yup.string().required(),
  recipientAddress: yup.string().required(),
  amount: yup.number().required(),
  nftType: yup
    .string()
    .required()
    .oneOf(['default', 'season_1_starter_pack'] as BuilderNftType[])
});

export type FormValues = yup.InferType<typeof schema>;
