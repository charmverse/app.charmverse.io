import * as yup from 'yup';

export const schema = yup.object({
  email: yup.string().email('Invalid email').nullable(),
  terms: yup.bool().required('Terms are Required').oneOf([true], 'You need to accept the terms and conditions.'),
  notify: yup.bool()
});

export type FormValues = yup.InferType<typeof schema>;
