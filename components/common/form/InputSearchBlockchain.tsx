import type { BoxProps, SxProps, Theme } from '@mui/material';
import { Box, ListItemIcon, ListItemText, Autocomplete, MenuItem, TextField } from '@mui/material/';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IChainDetails } from '@packages/connectors/chains';
import { getChainList, getChainById } from '@packages/connectors/chains';
import { useEffect, useState, useMemo } from 'react';

import { BlockchainLogo } from 'components/common/Icons/BlockchainLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isTruthy } from 'lib/utils/types';

interface Props extends Omit<Partial<AutocompleteProps<IChainDetails, false, boolean, true>>, 'onChange'> {
  onChange?: (chainId: number | null) => void;
  defaultChainId?: number; // allow setting a default
  hideInputIcon?: boolean;
  chainId?: number; // allow overriding from the parent
  sx?: SxProps<Theme>;
  chains?: number[];
  fullWidth?: boolean;
  disableClearable?: boolean;
}

export function InputSearchBlockchain({
  defaultChainId,
  chainId,
  onChange = () => {},
  hideInputIcon,
  chains,
  sx = {},
  disabled,
  readOnly,
  fullWidth,
  disableClearable = true
}: Props) {
  const [value, setValue] = useState<IChainDetails | null>(null);
  const { space } = useCurrentSpace();

  const options = useMemo(() => {
    return chains
      ? chains.map((chain) => getChainById(chain)).filter(isTruthy)
      : getChainList({ enableTestnets: !!space?.enableTestnets });
  }, [chains, space?.enableTestnets]);

  useEffect(() => {
    if (defaultChainId && !value) {
      const chain = getChainById(defaultChainId);
      if (chain) {
        setValue(chain);
      }
    }
  }, [defaultChainId]);

  useEffect(() => {
    if (chainId) {
      const chain = getChainById(chainId);
      if (chain) {
        setValue(chain);
      }
    }
  }, [chainId]);

  const defaultValueToAssign = defaultChainId ? getChainById(defaultChainId) : undefined;

  return (
    <Autocomplete
      defaultValue={defaultValueToAssign}
      // @ts-ignore - autocomplete types are a mess
      // dummy bounty object with chainName to show N/A for empty value
      value={value}
      onChange={(_, _value: IChainDetails | null) => {
        onChange(_value?.chainId ?? null);
        setValue(_value);
      }}
      sx={{ minWidth: 150, ...sx }}
      options={options}
      data-test='chain-options'
      disableClearable={disableClearable}
      autoHighlight
      size='small'
      getOptionLabel={(option) => `${option.chainName}`}
      renderOption={(props, option) => <Chain info={option} data-test={`select-chain-${option.chainId}`} {...props} />}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            placeholder: 'Select a chain',
            startAdornment: !hideInputIcon && value && <BlockchainLogo src={value?.iconUrl} sx={{ ml: 0.5 }} />
          }}
        />
      )}
      disabled={disabled}
      readOnly={readOnly}
      fullWidth={fullWidth}
    />
  );
}

export function Chain({ info, ...props }: { info: Pick<IChainDetails, 'chainName' | 'iconUrl'> }) {
  return (
    <MenuItem {...props}>
      <ListItemIcon>
        <BlockchainLogo src={info.iconUrl} sx={{ ml: '-4px' }} />
      </ListItemIcon>
      <ListItemText>{info.chainName}</ListItemText>
    </MenuItem>
  );
}
