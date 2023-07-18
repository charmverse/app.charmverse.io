import type { SxProps, Theme } from '@mui/material';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { IChainDetails } from 'connectors';
import { RPCList, getChainById } from 'connectors';
import { useEffect, useState, useMemo } from 'react';

import { isTruthy } from 'lib/utilities/types';

interface Props extends Omit<Partial<AutocompleteProps<IChainDetails, false, true, true>>, 'onChange'> {
  onChange?: (chainId: number) => void;
  defaultChainId?: number; // allow setting a default
  chainId?: number; // allow overriding from the parent
  sx?: SxProps<Theme>;
  chains?: number[];
}

export function InputSearchBlockchain({
  defaultChainId,
  chainId,
  onChange = () => {},
  chains,
  sx = {},
  disabled,
  readOnly
}: Props) {
  const [value, setValue] = useState<IChainDetails | null>(null);

  const options = useMemo(() => {
    return chains ? chains.map((chain) => getChainById(chain)).filter(isTruthy) : RPCList;
  }, [chains]);

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
      value={value ?? { chainName: 'N/A' }}
      onChange={(_, _value: IChainDetails) => {
        if (_value?.chainId) {
          onChange(_value.chainId);
          setValue(_value);
        }
      }}
      sx={{ minWidth: 150, ...sx }}
      options={options}
      disableClearable
      autoHighlight
      size='small'
      getOptionLabel={(option) => `${option.chainName}`}
      renderOption={(props, option) => (
        <Box component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
          <Box component='span'>{option.chainName}</Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}
