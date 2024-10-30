import * as yup from 'yup';

export const loginWithWalletSchema = yup.object({
  message: yup.string().required(),
  signature: yup.string().required()
});

export type LoginWithWalletSchema = yup.InferType<typeof loginWithWalletSchema>;
