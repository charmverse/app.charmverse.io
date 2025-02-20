import type { PaymentMethod } from '@charmverse/core/prisma-client';
import { Box, Stack, TextField } from '@mui/material';
import type { CryptoCurrency } from '@packages/connectors/chains';
import { getChainById } from '@packages/connectors/chains';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { FieldLabel } from 'components/common/WorkflowSidebar/components/FieldLabel';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { isTruthy } from 'lib/utils/types';

export type FormInput = {
  chainId?: number | null;
  rewardAmount?: number | null;
  rewardToken?: string | null;
};

/**
 *
 * When a user is creating a reward from a template and the token is set but not the amount, props should be:
 *  readOnly: true, readOnlyToken: true, requireTokenAmount: true, readOnlyTokenAmount: true|false
 */
type Props = {
  defaultValues?: FormInput;
  readOnly: boolean;
  readOnlyToken?: boolean;
  readOnlyTokenAmount?: boolean;
  requireTokenAmount: boolean;
  onChange: (value: FormInput) => void;
  setIsValid?: (value: boolean) => void;
};

export function RewardTokenForm({
  defaultValues,
  onChange,
  setIsValid,
  readOnly,
  readOnlyToken,
  readOnlyTokenAmount,
  requireTokenAmount
}: Props) {
  const [paymentMethods] = usePaymentMethods();
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);
  const {
    control,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormInput>({
    defaultValues: {
      rewardToken: defaultValues?.rewardToken || '',
      chainId: defaultValues?.chainId || 1,
      rewardAmount: defaultValues?.rewardAmount || undefined
    }
  });

  const values = watch();

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  function refreshCryptoList(chainId: number, _rewardToken?: string | null) {
    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {
      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter((method) => method.chainId === chainId)
        .map((method) => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setValue('rewardToken', _rewardToken || nativeCurrency);
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  // useEffect(() => {
  //   refreshCryptoList(defaultChainId, defaultTokenId || undefined);
  // }, [faultTokenId]);

  useEffect(() => {
    if (values.chainId) {
      refreshCryptoList(values.chainId, values.rewardToken);
    }
  }, [values.chainId, values.rewardToken]);

  useEffect(() => {
    setIsValid?.(isValid);
    onChange(values);
  }, [isValid, values.chainId, values.rewardAmount, values.rewardToken]);

  return (
    <Stack gap={1}>
      <Box display='flex' alignItems='center'>
        <FieldLabel required={!readOnly} style={{ width: 150 }}>
          Chain
        </FieldLabel>
        <Controller
          name='chainId'
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange: _onChange, value } }) => (
            <InputSearchBlockchain
              disabled={readOnly || readOnlyToken}
              readOnly={readOnly || readOnlyToken}
              chainId={value || undefined}
              sx={{
                flexGrow: 1
              }}
              onChange={_onChange}
            />
          )}
        />
      </Box>

      <Box display='flex' alignItems='center'>
        <FieldLabel required={!readOnly} style={{ width: 150 }}>
          Token
        </FieldLabel>
        <Controller
          name='rewardToken'
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange: _onChange, value } }) => (
            <InputSearchCrypto
              readOnly={readOnly || readOnlyToken}
              placeholder='Empty'
              disabled={readOnly || readOnlyToken || !isTruthy(values.chainId)}
              cryptoList={availableCryptos}
              chainId={values.chainId || undefined}
              defaultValue={value ?? undefined}
              value={value ?? undefined}
              hideBackdrop={true}
              onChange={_onChange}
              onNewPaymentMethod={onNewPaymentMethod}
              sx={{
                flexGrow: 1
              }}
            />
          )}
        />
      </Box>

      <Box display='flex' alignItems='center'>
        <FieldLabel required={requireTokenAmount && !readOnlyTokenAmount} style={{ flexShrink: 0, width: 150 }}>
          Amount
        </FieldLabel>
        <Controller
          name='rewardAmount'
          control={control}
          rules={{
            required: requireTokenAmount,
            validate: (value) => (requireTokenAmount ? Number(value) > 0 : true)
          }}
          render={({ field: { onChange: _onChange, value } }) => (
            <TextField
              onChange={_onChange}
              value={value}
              data-test='reward-property-amount'
              type='number'
              inputProps={{
                step: 0.01
              }}
              sx={{
                flexGrow: 1
              }}
              required={requireTokenAmount}
              disabled={readOnly || readOnlyTokenAmount}
              placeholder='Enter amount'
              error={!!errors.rewardAmount}
            />
          )}
        />
      </Box>
    </Stack>
  );
}
