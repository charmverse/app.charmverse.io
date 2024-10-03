import { MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { optimism } from 'viem/chains';

import { ChainComponent } from './ChainComponent';
import { getChainOptions } from './chains';

export type SelectedPaymentOption = { chainId: number; currency: 'ETH' | 'USDC' };

function SelectField(
  {
    useTestnets,
    balance,
    onSelectChain,
    value,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectChain: (opt: SelectedPaymentOption) => void;
    value: SelectedPaymentOption;
    useTestnets?: boolean;
    balance?: string;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  const chainOpts = getChainOptions({ useTestnets });

  return (
    <Select<SelectedPaymentOption>
      fullWidth
      displayEmpty
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
      value={
        chainOpts.map(({ id }) => id).includes(value.chainId)
          ? value
          : ({ chainId: optimism.id, currency: 'ETH' } as SelectedPaymentOption)
      }
      {...restProps}
    >
      <MenuItem value='' disabled>
        Select a Chain
      </MenuItem>
      {chainOpts.map((_chain) => (
        <MenuItem
          key={_chain.id + _chain.currency} // Unique key for each chain and currency combination
          value={_chain.id}
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onSelectChain({ chainId: _chain.id, currency: _chain.currency });
          }}
          sx={{ my: 1 }}
        >
          <ChainComponent chain={_chain} />
        </MenuItem>
      ))}
    </Select>
  );
}

export const BlockchainSelect = forwardRef(SelectField);
