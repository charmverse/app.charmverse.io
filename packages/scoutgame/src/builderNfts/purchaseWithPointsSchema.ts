import * as yup from 'yup';

export const schema = yup.object({
  builderId: yup.string().required(),
  recipientAddress: yup.string().required(),
  amount: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;
