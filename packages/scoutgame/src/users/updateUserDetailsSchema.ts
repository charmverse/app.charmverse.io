import * as yup from 'yup';

export const updateUserDetailsSchema = yup.object({
  avatar: yup.string().required('Avatar is required'),
  displayName: yup.string().required('Display name is required')
});

export type UpdateUserDetailsFormValues = yup.InferType<typeof updateUserDetailsSchema>;
