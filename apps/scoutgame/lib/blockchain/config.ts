import * as yup from 'yup';

export const authSchema = yup.object({ message: yup.string().required(), signature: yup.string().required() });

export type AuthSchema = yup.InferType<typeof authSchema>;
