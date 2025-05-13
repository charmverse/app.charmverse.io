import { wagmiConfig } from '@packages/blockchain/connectors/config';
import type { GetEnsAddressReturnType } from '@wagmi/core';
import { getEnsAddress } from '@wagmi/core';
import { isValidName } from 'ethers/lib/utils';
import { useCallback } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { normalize } from 'viem/ens';
import * as yup from 'yup';

import { isValidChainAddress } from '@packages/lib/tokens/validation';

const schema = yup.object({
  contract: yup
    .string()
    .required('Contract is required')
    .test(
      'isAddress',
      'Invalid address',
      (value) => isValidChainAddress(value) || (value.endsWith('.eth') && isValidName(value))
    ),
  ensWallet: yup
    .string()
    .test('isAddress', 'Invalid ens wallet address', (value) => isValidChainAddress(value) || !value)
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = { contract: '', ensWallet: '' };

export function useWalletForm() {
  const resolveEnsAddress = async (ensName: string) =>
    getEnsAddress(wagmiConfig, { chainId: 1, name: normalize(ensName) });

  const resolver = useCallback(
    (validationSchema: typeof schema): Resolver<FormValues> => customResolver(validationSchema, resolveEnsAddress),
    []
  );

  const methods = useForm<FormValues>({
    resolver: resolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return { ...methods, resolveEnsAddress };
}

function customResolver(
  validationSchema: typeof schema,
  resolveEnsAddress: (ensName: string) => Promise<GetEnsAddressReturnType>
): Resolver<FormValues> {
  return async (data: FormValues) => {
    try {
      if (data.contract.endsWith('.eth') && isValidName(data.contract)) {
        const address = await resolveEnsAddress(data.contract);

        if (address) {
          return {
            values: {
              ...data,
              ensWallet: address
            },
            errors: {}
          };
        } else {
          throw new yup.ValidationError({
            errors: ['Invalid ENS name'],
            inner: [] as yup.ValidationError[],
            path: 'contract',
            message: 'Invalid ENS name',
            value: data.contract,
            name: 'ValidationError',
            type: 'isENSName'
          } as yup.ValidationError);
        }
      }

      const values = await validationSchema.validate(data, {
        abortEarly: false
      });

      return {
        values: {
          ...values,
          ensWallet: undefined
        },
        errors: {}
      };
    } catch (_errors: any) {
      const errors = _errors as yup.ValidationError;

      return {
        values: {},
        errors: errors?.inner?.reduce(
          (allErrors, currentError) => ({
            ...allErrors,
            [currentError.path || '']: {
              type: currentError.type ?? 'validation',
              message: currentError.message
            }
          }),
          {}
        )
      };
    }
  };
}
