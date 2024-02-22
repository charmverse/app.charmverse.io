import { yupResolver } from '@hookform/resolvers/yup';
import { readContract } from '@wagmi/core';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

import { daoCheck } from '../utils/utils';

const daoCheckIds = daoCheck.map((d) => d.id);
type DaoCheck = (typeof daoCheckIds)[number];

const schema = yup.object({
  chain: yup.string().when('check', {
    is: (val: DaoCheck) => val === 'builder' || val === 'moloch',
    then: () => yup.string().required('Chain is required'),
    otherwise: () => yup.string()
  }),
  check: yup.string<DaoCheck>().required('DAO type is required').oneOf(daoCheckIds),
  contract: yup.string<`0x${string}`>().when('check', {
    is: (val: DaoCheck) => val === 'builder' || val === 'moloch',
    then: () =>
      yup
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
        }),
    otherwise: () => yup.string<`0x${string}`>()
  }),
  guild: yup.string().when('check', {
    is: (val: DaoCheck) => val === 'guild',
    then: () => yup.string().required('Guild url or id is required'),
    otherwise: () => yup.string()
  })
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  contract: '' as FormValues['contract'],
  chain: '',
  check: '' as FormValues['check'],
  guild: ''
};

export function useDaoForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
