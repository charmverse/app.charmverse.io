import * as yup from 'yup';

export const loginWithWalletSchema = yup.object({
  message: yup.string().required(),
  signature: yup.string().required(),
  inviteCode: yup.string().optional().nullable(),
  referralCode: yup.string().optional().nullable()
});

export type LoginWithWalletSchema = yup.InferType<typeof loginWithWalletSchema>;
