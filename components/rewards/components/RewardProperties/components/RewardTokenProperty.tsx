import type { PaymentMethod } from '@charmverse/core/prisma';
import { Box, Stack, TextField, Typography } from '@mui/material';
import type { CryptoCurrency } from 'connectors/chains';
import { getChainById } from 'connectors/chains';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { EmptyPlaceholder } from 'components/common/BoardEditor/components/properties/EmptyPlaceholder';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import TokenLogo from 'components/common/TokenLogo';
import { RewardTokenSelect } from 'components/rewards/components/RewardProperties/components/RewardTokenSelect';
import type { RewardTokenDetails } from 'components/rewards/components/RewardProperties/interfaces';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { getTokenInfo } from 'lib/tokens/tokenData';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  onChange: (value: RewardTokenDetails | null) => void;
  currentReward: (RewardCreationData & RewardWithUsers) | null;
  readOnly?: boolean;
};

type FormInput = {
  chainId?: number;
  rewardAmount?: number;
  rewardToken?: string;
};

export function RewardTokenProperty({ onChange, currentReward, readOnly }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);

  const [paymentMethods] = usePaymentMethods();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormInput>({
    defaultValues: {
      rewardToken: currentReward?.rewardToken || '',
      chainId: currentReward?.chainId || undefined,
      rewardAmount: currentReward?.rewardAmount || undefined
    }
  });

  const tokenInfo =
    (!!currentReward &&
      !!currentReward.chainId &&
      !!currentReward.rewardToken &&
      getTokenInfo({
        chainId: currentReward?.chainId,
        symbolOrAddress: currentReward?.rewardToken,
        methods: paymentMethods
      })) ||
    null;

  const watchChainId = watch('chainId');

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = (values: FormInput) => {
    onChange(values as RewardTokenDetails);
    handleClose();
  };

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

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  useEffect(() => {
    if (currentReward) {
      refreshCryptoList(currentReward.chainId || 1, currentReward.rewardToken || undefined);
    }

    reset({
      rewardToken: currentReward?.rewardToken || '',
      chainId: currentReward?.chainId || undefined,
      rewardAmount: currentReward?.rewardAmount || undefined
    });
  }, [currentReward, reset]);

  useEffect(() => {
    if (watchChainId) {
      const newNativeCurrency = refreshCryptoList(watchChainId);
      setValue('rewardToken', newNativeCurrency);
    }
  }, [watchChainId]);

  if (!currentReward) {
    return null;
  }

  const currentChain = currentReward.chainId && getChainById(currentReward.chainId);

  return (
    <>
      <SelectPreviewContainer readOnly={readOnly} displayType='details' onClick={() => !readOnly && setIsOpen(true)}>
        {tokenInfo ? (
          <Stack direction='row'>
            <Box
              component='span'
              sx={{
                width: 25,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
            </Box>

            <Typography component='span' variant='subtitle1' fontWeight='normal'>
              {currentReward.rewardAmount}
            </Typography>
            <Typography ml={0.5} component='span' variant='subtitle1' fontWeight='normal'>
              {tokenInfo.tokenSymbol} {currentChain ? `(${currentChain.chainName})` : ''}
            </Typography>
          </Stack>
        ) : (
          <EmptyPlaceholder>Empty</EmptyPlaceholder>
        )}
      </SelectPreviewContainer>

      <Dialog
        open={isOpen}
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
                  chainId={currentReward?.chainId ?? undefined}
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
            <TextField
              {...register('rewardAmount', { required: true, validate: (value) => Number(value) > 0 })}
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
          </Box>
        </Stack>
      </Dialog>
    </>
  );
}
