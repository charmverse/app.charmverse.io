import * as yup from 'yup';

export const userActionSchema = yup.object({
  initData: yup.string().required()
});

export type UserActionSchema = yup.InferType<typeof userActionSchema>;
