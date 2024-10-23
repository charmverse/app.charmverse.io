import * as yup from 'yup';

export const schema = yup.object({
  email: yup.string().required('Email is required'),
  agreedToTOS: yup.bool().required('Terms are Required').oneOf([true], 'You need to accept the terms and conditions.'),
  sendMarketing: yup.bool()
});

export type FormValues = yup.InferType<typeof schema>;
