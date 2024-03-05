import type { BoxProps, SxProps, Theme } from '@mui/material';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { IChainDetails } from 'connectors/chains';
import { getChainList, getChainById } from 'connectors/chains';
import { useEffect, useState, useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isTruthy } from 'lib/utils/types';

interface Props extends Omit<Partial<AutocompleteProps<IChainDetails, false, true, true>>, 'onChange'> {
  onChange?: (chainId: number) => void;
  defaultChainId?: number; // allow setting a default
  hideInputIcon?: boolean;
  chainId?: number; // allow overriding from the parent
  sx?: SxProps<Theme>;
  chains?: number[];
  fullWidth?: boolean;
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
  fullWidth
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
      onChange={(_, _value: IChainDetails) => {
        if (_value?.chainId) {
          onChange(_value.chainId);
          setValue(_value);
        }
      }}
      sx={{ minWidth: 150, ...sx }}
      options={options}
      data-test='chain-options'
      disableClearable
      autoHighlight
      size='small'
      getOptionLabel={(option) => `${option.chainName}`}
      renderOption={(props, option) => (
        <Box data-test={`select-chain-${option.chainId}`} component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
          <IconLogo src={option.iconUrl} />
          <Box component='span'>{option.chainName}</Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            placeholder: 'Select a chain',
            startAdornment: !hideInputIcon && value && <IconLogo src={value?.iconUrl} ml={1} />
          }}
        />
      )}
      disabled={disabled}
      readOnly={readOnly}
      fullWidth={fullWidth}
    />
  );
}

function IconLogo({ src, ...props }: { src?: string } & BoxProps) {
  return (
    <Box width='1em' height='1em' display='flex' justifyContent='center' {...props}>
      <img src={src} style={{ height: '1em', marginRight: '0.5em' }} />
    </Box>
  );
}
