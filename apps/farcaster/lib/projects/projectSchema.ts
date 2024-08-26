import * as yup from 'yup';

export const schema = yup.object({
  id: yup.string(),
  name: yup.string().required('Project name is required'),
  avatar: yup.string(),
  teamLeadFarcasterId: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;
