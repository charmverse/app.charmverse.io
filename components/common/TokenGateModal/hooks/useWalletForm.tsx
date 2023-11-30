import type { Web3Provider } from '@ethersproject/providers';
import { isValidName } from 'ethers/lib/utils';
import { useCallback } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useWeb3Account } from 'hooks/useWeb3Account';
import { isValidChainAddress } from 'lib/tokens/validation';

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
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

const defaultValues: FormValues = { contract: '', chain: '', ensWallet: undefined };

export function useWalletForm() {
  const { provider } = useWeb3Account();

  const resolver = useCallback(
    (validationSchema: typeof schema): Resolver<FormValues> => customResolver(validationSchema, provider),
    [provider]
  );

  const methods = useForm<FormValues>({
    resolver: resolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return { ...methods, provider };
}

function customResolver(validationSchema: typeof schema, provider?: Web3Provider): Resolver<FormValues> {
  return async (data: FormValues) => {
    try {
      if (data.contract.endsWith('.eth') && isValidName(data.contract)) {
        const address = await provider?.resolveName?.(data.contract);

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
