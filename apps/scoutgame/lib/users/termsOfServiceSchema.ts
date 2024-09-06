import type { Scout } from '@charmverse/core/prisma';
import * as yup from 'yup';

export const schema = yup.object({
  email: yup.string().email('Invalid email').nullable(),
  agreedToTOS: yup.bool().required('Terms are Required').oneOf([true], 'You need to accept the terms and conditions.'),
  sendMarketing: yup.bool()
});

export type FormValues = yup.InferType<typeof schema>;
