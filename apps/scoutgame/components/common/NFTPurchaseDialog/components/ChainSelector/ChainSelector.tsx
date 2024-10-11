import { MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Address } from 'viem';

import { useGetTokenBalances } from '../../hooks/useGetTokenBalances';

import { ChainComponent } from './ChainComponent';
import { ETH_NATIVE_ADDRESS, getChainOptions } from './chains';

export type SelectedPaymentOption = { chainId: number; currency: 'ETH' | 'USDC' };

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency;
}

function SelectField(
  {
    useTestnets,
    balance,
    onSelectChain,
    value,
    address,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectChain: (opt: SelectedPaymentOption) => void;
    value: SelectedPaymentOption;
    useTestnets?: boolean;
    balance?: string;
    address?: Address;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  const chainOpts = getChainOptions({ useTestnets });

  const { tokens } = useGetTokenBalances({ address: address as Address });

  return (
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
      renderValue={(selected) => {
        const chain = chainOpts.find(({ id, currency }) => selected.chainId === id && selected.currency === currency);

        if (!chain) {
          return (
            <Stack>
              <Typography variant='body2'>Select a Chain</Typography>
            </Stack>
          );
        }

        return <ChainComponent chain={chain} balance={balance} />;
      }}
      ref={ref}
      value={value}
      {...restProps}
    >
      <MenuItem value='' disabled>
        Select a Chain
      </MenuItem>
      {chainOpts.map((_chain) => {
        const _tokenBalanceInfo = tokens?.find(
          (t) =>
            t.chainId === _chain.id &&
            (_chain.currency === 'ETH'
              ? t.address === ETH_NATIVE_ADDRESS
              : t.address?.toLowerCase() === _chain.usdcAddress.toLowerCase())
        );
        let _balance = Number(_tokenBalanceInfo?.balance);

        if (_balance) {
          if (_chain.currency === 'ETH') {
            _balance /= 1e18;
          } else {
            _balance /= 1e6;
          }
        }

        return (
          <MenuItem
            key={_chain.id + _chain.currency} // Unique key for each chain and currency combination
            value={_chain.id}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onSelectChain({ chainId: _chain.id, currency: _chain.currency });
            }}
            sx={{ py: 1.5 }}
          >
            <ChainComponent
              chain={_chain}
              selected={isSameOption({ chainId: _chain.id, currency: _chain.currency }, value)}
              balance={!Number.isNaN(_balance) ? _balance.toFixed(2) : undefined}
            />
          </MenuItem>
        );
      })}
    </Select>
  );
}

export const BlockchainSelect = forwardRef(SelectField);
