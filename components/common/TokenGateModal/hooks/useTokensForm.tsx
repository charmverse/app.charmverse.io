import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

import { tokenCheck } from '../utils/utils';

const tokenIds = tokenCheck.map((t) => t.id);

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  check: yup
    .string()
    .oneOf(tokenIds)
    .test('empty-check', 'Token selection is required', (option) => !!option),
  contract: yup.string().when('check', {
    is: (val: 'token' | 'customToken') => val === 'customToken',
    then: () =>
      yup
        .string()
        .required('Contract is required')
        .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value)),
    otherwise: () => yup.string()
  }),
  quantity: yup
    .string()
    .required()
    .test('isNumber', 'Quantity must be a number greater then 0', (value) => !!Number(value))
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  chain: '',
  check: '' as FormValues['check'],
  contract: '',
  quantity: ''
};

export function useTokensForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
