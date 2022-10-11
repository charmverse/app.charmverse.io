import type { AutocompleteProps } from '@mui/material/Autocomplete';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { SxProps } from '@mui/system';
import type { IChainDetails } from 'connectors';
import { RPCList } from 'connectors';
import { useEffect, useState } from 'react';

interface Props extends Omit<Partial<AutocompleteProps<IChainDetails, false, true, true>>, 'onChange'>{
  onChange?: (chainId: number) => void;
  defaultChainId?: number; // allow setting a default
  chainId?: number; // allow overriding from the parent
  sx?: SxProps;
}

export default function InputSearchBlockchain ({
  defaultChainId,
  chainId,
  onChange = () => {},
  sx = {},
  disabled,
  readOnly
}: Props) {

  const [value, setValue] = useState<IChainDetails | null>(null);

  useEffect(() => {
    if (defaultChainId && !value) {
      const chain = RPCList.find(rpc => rpc.chainId === defaultChainId);
      if (chain) {
        setValue(chain);
      }
    }
  }, [defaultChainId]);

  useEffect(() => {
    if (chainId) {
      const chain = RPCList.find(rpc => rpc.chainId === chainId);
      if (chain) {
        setValue(chain);
      }
    }
  }, [chainId]);

  const defaultValueToAssign = defaultChainId ? RPCList.find(rpc => {
    return rpc.chainId === defaultChainId;
  }) : undefined;

  return (
    <Autocomplete
      defaultValue={defaultValueToAssign}
      // @ts-ignore - autocomplete types are a mess
      value={value}
      onChange={(_, _value: IChainDetails) => {
        if (_value?.chainId) {
          onChange(_value.chainId);
          setValue(_value);
        }
      }}
      sx={{ minWidth: 150, ...sx }}
      options={RPCList}
      disableClearable
      autoHighlight
      size='small'
      getOptionLabel={option => `${option.chainName}`}
      renderOption={(props, option) => (
        <Box component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
          <Box component='span'>
            {option.chainName}
          </Box>
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
