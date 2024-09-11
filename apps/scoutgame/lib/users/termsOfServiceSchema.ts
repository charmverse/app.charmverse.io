import * as yup from 'yup';

export const schema = yup.object({
  email: yup
    .string()
    .nullable()
    .when('sendMarketing', ([sendMarketing]) => {
      if (sendMarketing === true) {
        return yup.string().required('Email is required').email('Invalid email');
      }
      return yup.string().nullable();
    }),
  agreedToTOS: yup.bool().required('Terms are Required').oneOf([true], 'You need to accept the terms and conditions.'),
  sendMarketing: yup.bool()
});

export type FormValues = yup.InferType<typeof schema>;
