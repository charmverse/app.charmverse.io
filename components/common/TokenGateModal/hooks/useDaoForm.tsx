import { yupResolver } from '@hookform/resolvers/yup';
import { readContract } from '@wagmi/core';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

import { daoCheck } from '../utils/utils';

const daoCheckIds = daoCheck.map((d) => d.id);

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  check: yup.string().required('DAO type is required').oneOf(daoCheckIds),
  contract: yup
    .string<`0x${string}`>()
    .required('Contract is required')
    .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
    .test('isContract', 'Invalid contract or chain', async (value, context) => {
      try {
        await readContract({
          address: value,
          chainId: Number(context.parent.chain),
          abi: [
            {
              inputs: [],
              name: 'name',
              outputs: [
                {
                  internalType: 'string',
                  name: '',
                  type: 'string'
                }
              ],
              stateMutability: 'view',
              type: 'function'
            }
          ] as const,
          functionName: 'name'
        });
        return true;
      } catch (err) {
        return false;
      }
    })
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  contract: '' as FormValues['contract'],
  chain: '',
  check: '' as FormValues['check']
};

export function useDaoForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
