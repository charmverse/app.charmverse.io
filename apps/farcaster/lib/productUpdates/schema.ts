import * as yup from 'yup';

export const DIVIDER = '__$__';

export const schema = yup.object({
  content: yup
    .object({
      json: yup.object().required(),
      text: yup.string().required()
    })
    .required(),
  projectId: yup.string().required(),
  authorFid: yup.number().required(),
  createdAtLocal: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;
