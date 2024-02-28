import type { PaymentMethod } from '@charmverse/core/prisma-client';
import { Box, Stack, TextField } from '@mui/material';
import type { CryptoCurrency } from 'connectors/chains';
import { getChainById } from 'connectors/chains';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { RewardTokenSelect } from 'components/rewards/components/RewardProperties/components/RewardTokenSelect';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utils/types';

type FormInput = {
  chainId?: number;
  rewardAmount?: number;
  rewardToken?: string;
};

export function RewardTokenDialog({
  displayType,
  currentReward,
  readOnly,
  children,
  onChange
}: {
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  currentReward: Pick<RewardCreationData & RewardWithUsers, 'rewardAmount' | 'rewardToken' | 'chainId'>;
  children: ReactNode;
  onChange: (value: RewardTokenDetails | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);

  const [paymentMethods] = usePaymentMethods();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormInput>({
    defaultValues: {
      rewardToken: currentReward.rewardToken || '',
      chainId: currentReward.chainId || undefined,
      rewardAmount: currentReward.rewardAmount || undefined
    }
  });

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = (values: FormInput) => {
    onChange(values as RewardTokenDetails);
    handleClose();
  };

  function openTokenSettings() {
    if (readOnly) {
      return;
    }
    setIsOpen(true);
    reset({
      rewardToken: currentReward?.rewardToken || '',
      chainId: currentReward?.chainId || undefined,
      rewardAmount: currentReward?.rewardAmount || undefined
    });
  }

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  function refreshCryptoList(chainId: number, rewardToken?: string) {
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
      setValue('rewardToken', rewardToken || nativeCurrency);
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  const watchChainId = watch('chainId');

  useEffect(() => {
    if (currentReward) {
      refreshCryptoList(currentReward.chainId || 1, currentReward.rewardToken || undefined);
    }
  }, [currentReward.chainId, currentReward.rewardToken]);

  useEffect(() => {
    if (watchChainId) {
      const newNativeCurrency = refreshCryptoList(watchChainId);
      setValue('rewardToken', newNativeCurrency);
    }
  }, [watchChainId]);

  return (
    <>
      <SelectPreviewContainer
        data-test='open-reward-value-dialog'
        readOnly={readOnly}
        displayType={displayType}
        onClick={openTokenSettings}
      >
        {children}
      </SelectPreviewContainer>
      <Dialog
        open={isOpen}
        data-test='reward-value-configuration'
        onClose={handleClose}
        title='Reward token details'
        footerActions={
          <Stack gap={2} flexDirection='row' alignItems='center'>
            <Button
              sx={{
                alignSelf: 'flex-start'
              }}
              onClick={handleClose}
              variant='outlined'
              color='secondary'
            >
              Cancel
            </Button>

            <Button
              disabled={!isValid}
              data-test='save-reward-value'
              onClick={handleSubmit(onSubmit)}
              sx={{
                alignSelf: 'flex-start'
              }}
            >
              Save
            </Button>
          </Stack>
        }
      >
        <Stack flex={1} className='CardDetail content'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Chain</PropertyLabel>
            <Controller
              name='chainId'
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange: _onChange, value } }) => (
                <InputSearchBlockchain
                  disabled={readOnly}
                  readOnly={readOnly}
                  chainId={value}
                  sx={{
                    width: '100%'
                  }}
                  onChange={_onChange}
                />
              )}
            />
          </Box>

          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Token</PropertyLabel>
            <Controller
              name='rewardToken'
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange: _onChange, value } }) => (
                <RewardTokenSelect
                  disabled={readOnly || !isTruthy(watchChainId)}
                  readOnly={readOnly}
                  cryptoList={availableCryptos}
                  chainId={currentReward?.chainId ?? watchChainId}
                  defaultValue={value ?? undefined}
                  value={value ?? undefined}
                  hideBackdrop={true}
                  onChange={_onChange}
                  onNewPaymentMethod={onNewPaymentMethod}
                  sx={{
                    width: '100%'
                  }}
                />
              )}
            />
          </Box>

          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Amount</PropertyLabel>
            <Controller
              name='rewardAmount'
              control={control}
              rules={{ required: true, validate: (value) => Number(value) > 0 }}
              render={({ field: { onChange: _onChange, value } }) => (
                <TextField
                  onChange={_onChange}
                  value={value ?? undefined}
                  data-test='reward-property-amount'
                  type='number'
                  inputProps={{
                    step: 0.01,
                    style: { height: 'auto' }
                  }}
                  sx={{
                    width: '100%'
                  }}
                  required
                  disabled={readOnly}
                  placeholder='Number greater than 0'
                  error={!!errors.rewardAmount}
                />
              )}
            />
          </Box>
        </Stack>
      </Dialog>
    </>
  );
}
