import * as yup from 'yup';

export const schema = yup.object({
  text: yup.string().required(),
  projectId: yup.string().required(),
  authorFid: yup.number().required(),
  createdAtLocal: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;
