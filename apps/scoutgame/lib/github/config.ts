import * as yup from 'yup';

export const githubConnectSchema = yup.object({
  code: yup.string().required(),
  state: yup.string().required()
});
