import * as yup from 'yup';

export const setupBuilderProfileSchema = yup.object({
  code: yup.string().required(),
  state: yup.string().required()
});
