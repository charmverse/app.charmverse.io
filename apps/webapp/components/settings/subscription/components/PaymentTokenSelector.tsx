import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { NULL_EVM_ADDRESS, devTokenAddress } from '@packages/subscriptions/constants';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';

import { BASE_USDC_ADDRESS, OPTIMISM_USDC_ADDRESS } from '../hooks/useGetTokenBalances';
import type { PaymentOption } from '../hooks/useTokenPayment';

export type AvailableCurrency = 'ETH' | 'USDC' | 'DEV';

export type SelectedPaymentOption = {
  decimals: number;
  chainId: number;
  currency: AvailableCurrency;
  address: Address;
};

export const TOKEN_LOGO_RECORD = {
  ETH: '/images/cryptoLogos/ethereum-circle.png',
  USDC: '/images/cryptoLogos/usdc.png',
  DEV: '/images/logos/dev-token-logo.png'
};

export const DEV_PAYMENT_OPTION: SelectedPaymentOption = {
  chainId: base.id,
  address: devTokenAddress,
  currency: 'DEV',
  decimals: 18
};

export const BASE_USDC_PAYMENT_OPTION: PaymentOption = {
  chainId: base.id,
  address: BASE_USDC_ADDRESS,
  currency: 'USDC' as const,
  decimals: 6
};

const paymentOptions: PaymentOption[] = [
  DEV_PAYMENT_OPTION,
  {
    chainId: base.id,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  BASE_USDC_PAYMENT_OPTION,
  {
    chainId: optimism.id,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  {
    chainId: optimism.id,
    address: OPTIMISM_USDC_ADDRESS,
    currency: 'USDC' as const,
    decimals: 6
  }
];

function PaymentOptionSelector(
  {
    onSelectPaymentOption,
    selectedPaymentOption,
    selectedTokenBalance,
    disabled,
    tokensWithBalances,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectPaymentOption: (opt: SelectedPaymentOption) => void;
    selectedPaymentOption: SelectedPaymentOption;
    selectedTokenBalance?: number;
    tokensWithBalances?: {
      chainId: number;
      address: Address;
      balance: number;
    }[];
    disabled?: boolean;
  },
  ref: Ref<unknown>
) {
  return (
    <Stack gap={1} my={1}>
      <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'>
        <Typography color='secondary' fontWeight={500} gutterBottom>
          Select Tokens
        </Typography>
      </Stack>
      <Box>
        <Select<SelectedPaymentOption>
          fullWidth
          displayEmpty
          MenuProps={{
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'center'
            },
            transformOrigin: {
              vertical: 'bottom',
              horizontal: 'center'
            }
          }}
          disabled={disabled}
          renderValue={(selected) => {
            const paymentOption = paymentOptions.find(
              ({ chainId, currency }) => selected.chainId === chainId && selected.currency === currency
            );
            if (!paymentOption) return null;

            return (
              <Stack direction='row' alignItems='center' gap={1}>
                <Image
                  src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                  alt={paymentOption.currency}
                  width={30}
                  height={30}
                />
                <Stack>
                  <Stack flexDirection='row' gap={0.5} alignItems='center'>
                    <Typography>{paymentOption.currency}</Typography>
                    <Typography variant='caption'>on Base</Typography>
                  </Stack>
                  <Stack direction='row' gap={0.5} alignItems='center'>
                    <Typography variant='caption'>
                      Balance:{' '}
                      {selectedTokenBalance
                        ? paymentOption.currency === 'DEV'
                          ? selectedTokenBalance.toFixed(4)
                          : paymentOption.currency === 'ETH'
                            ? selectedTokenBalance.toFixed(6)
                            : selectedTokenBalance.toFixed(2)
                        : '0'}
                    </Typography>
                    <Image
                      src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                      alt={paymentOption.currency}
                      width={14}
                      height={14}
                    />
                  </Stack>
                </Stack>
              </Stack>
            );
          }}
          ref={ref}
          value={selectedPaymentOption}
          {...props}
        >
          {paymentOptions.map((paymentOption) => (
            <MenuItem
              key={`${paymentOption.chainId}-${paymentOption.currency}-${paymentOption.address}`}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onSelectPaymentOption(paymentOption);
              }}
              sx={{ py: 1.5 }}
            >
              <Stack direction='row' alignItems='center' gap={1}>
                <Image
                  src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                  alt={paymentOption.currency}
                  width={30}
                  height={30}
                />
                <Stack>
                  <Typography>
                    {paymentOption.currency} on{' '}
                    <span style={{ fontWeight: 500 }}>
                      {getChainById(paymentOption.chainId)?.chainName ?? 'Unknown'}
                    </span>
                  </Typography>
                  <Typography variant='caption'>
                    Balance:{' '}
                    {tokensWithBalances?.find(
                      (token) =>
                        token.chainId === paymentOption.chainId &&
                        token.address.toLowerCase() === paymentOption.address.toLowerCase()
                    )?.balance ?? '0'}
                  </Typography>
                </Stack>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  );
}

export const PaymentTokenSelector = forwardRef(PaymentOptionSelector);
