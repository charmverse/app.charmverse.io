import * as yup from 'yup';

import { isValidChainAddress } from 'lib/utils/validation';

export const schema = yup.object({
  wallet: yup
    .string()
    .test('isAddress', 'Invalid address', (value) => !value || isValidChainAddress(value))
    .nullable(),
  email: yup.string().email('Invalid email').nullable(),
  emailOption: yup.string().required('Email option is required').oneOf(['notify', 'terms'])
});

export type FormValues = yup.InferType<typeof schema>;
