import { isValidName } from 'ethers/lib/utils';
import { useCallback } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { isValidChainAddress } from 'lib/tokens/validation';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getWalletUnifiedAccessControlConditions } from '../utils/getWalletUnifiedAccessControlConditions';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

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

export function TokenGateWallet() {
  const { provider } = useWeb3Account();

  const resolver = useCallback(
    (validationSchema: typeof schema): Resolver<FormValues> => {
      return async (data: FormValues) => {
        try {
          if (data.contract.endsWith('.eth') && isValidName(data.contract)) {
            const address = await provider?.resolveName(data.contract);

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
    },
    [provider]
  );

  const {
    register,
    getValues,
    reset,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: resolver(schema),
    mode: 'onChange',
    defaultValues: { contract: '', chain: '', ensWallet: undefined }
  });

  const { setDisplayedPage, handleUnifiedAccessControlConditions } = useTokenGateModal();

  const onSubmit = async () => {
    const initialValues = getValues();
    const values: FormValues = {
      chain: initialValues.chain,
      contract: initialValues.ensWallet || initialValues.contract
    };
    const valueProps = getWalletUnifiedAccessControlConditions(values) || [];
    handleUnifiedAccessControlConditions(valueProps);
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  const { onChange, ...restRegisterContract } = register('contract');

  const onContractChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const value = e.target.value;
    if (value.endsWith('.eth') && isValidName(value)) {
      const address = await provider?.resolveName(value);
      if (address) {
        setValue('ensWallet', address);
      } else {
        setValue('ensWallet', undefined);
      }
    } else {
      setValue('ensWallet', undefined);
    }
  };

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        {...register('chain')}
      />
      <TextInputField
        label='Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        onChange={onContractChange}
        {...restRegisterContract}
      />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
