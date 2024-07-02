import { yupResolver } from '@hookform/resolvers/yup';
import { getToken } from '@wagmi/core';
import { wagmiConfig } from 'connectors/config';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

import { tokenCheck } from '../utils/utils';

const tokenIds = tokenCheck.map((t) => t.id);
type TokenType = (typeof tokenIds)[number];

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  check: yup
    .string()
    .oneOf(tokenIds)
    .test('empty-check', 'Token selection is required', (option) => !!option),
  contract: yup.string().when('check', {
    is: (val: TokenType) => val === 'customToken' || val === 'customContractMethod',
    then: () =>
      yup
        .string<`0x${string}`>()
        .required('Contract is required')
        .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
        .test('isContract', 'Invalid contract or chain', async (value, context) => {
          const chain = context.parent.chain;
          const check = context.parent.check;

          if (chain && check === 'customToken') {
            try {
              await getToken(wagmiConfig, {
                address: value,
                chainId: Number(chain)
              });
              return true;
            } catch (err) {
              return false;
            }
          }

          return true;
        }),
    otherwise: () => yup.string()
  }),
  method: yup.string().when('check', {
    is: (val: TokenType) => val === 'customContractMethod',
    then: () => yup.string().required('Method is required'),
    // .test('isContract', 'Invalid contract or chain', async (value, context) => {
    //   const chain = context.parent.chain;
    //   const check = context.parent.check;

    //   if (chain && check === 'customToken') {
    //     try {
    //       await getToken(wagmiConfig, {
    //         address: value,
    //         chainId: Number(chain)
    //       });
    //       return true;
    //     } catch (err) {
    //       return false;
    //     }
    //   }

    //   return true;
    // }),
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
