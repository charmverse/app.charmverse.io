import { yupResolver } from '@hookform/resolvers/yup';
import { wagmiConfig } from '@packages/connectors/config';
import { readContract } from '@wagmi/core';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { ercAbi, hatsProtocolAbi } from 'lib/tokenGates/abis/abis';
import { isValidChainAddress } from 'lib/tokens/validation';

import { daoCheck } from '../utils/utils';

export const hatsProtocolContractAddress = '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137';

const daoCheckIds = daoCheck.map((d) => d.id);
type DaoCheck = (typeof daoCheckIds)[number];

const schema = yup.object({
  chain: yup.string().when('check', {
    is: (val: DaoCheck) => val === 'builder' || val === 'moloch' || val === 'hats',
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
            if (context.parent.check === 'builder') {
              await readContract(wagmiConfig, {
                address: value,
                chainId: Number(context.parent.chain),
                abi: ercAbi,
                functionName: 'name'
              });
            }
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
  }),
  tokenId: yup.string().when('check', {
    is: (val: DaoCheck) => val === 'hats',
    then: () =>
      yup
        .string<`0x${string}`>()
        .required('Hat id is required')
        .test('isHat', 'Invalid hat id', async (value, context) => {
          try {
            const hatId = BigInt(value);
            const isActive = await readContract(wagmiConfig, {
              address: hatsProtocolContractAddress,
              chainId: Number(context.parent.chain),
              abi: hatsProtocolAbi,
              functionName: 'isActive',
              args: [hatId]
            });
            return isActive;
          } catch (err) {
            return false;
          }
        }),
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

export function useCommunitiesForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
