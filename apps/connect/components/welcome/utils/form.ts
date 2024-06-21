import * as yup from 'yup';

export const schema = yup.object({
  email: yup.string().email('Invalid email').nullable(),
  emailOption: yup.string().required('Email option is required').oneOf(['notify', 'terms'])
});

export type FormValues = yup.InferType<typeof schema>;
