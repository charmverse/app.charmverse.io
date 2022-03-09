import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import { RPCList } from 'connectors';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { UseFormRegister } from 'react-hook-form';

interface Props {
  onChange?: (chainId: number) => void
  defaultChainId?: number
}

export function InputBlockchainSearch ({
  defaultChainId,
  onChange = () => {}
}: Props) {

  const defaultValueToAssign = defaultChainId ? RPCList.find(rpc => {
    return rpc.chainId === defaultChainId;
  }) : undefined;

  return (
    <Autocomplete
      defaultValue={defaultValueToAssign}
      onChange={(_, event) => {
        if (event?.chainId) {
          onChange(event.chainId);
        }
      }}
      sx={{ minWidth: 150 }}
      options={RPCList}
      autoHighlight
      size='small'
      getOptionLabel={option => `${option.nativeCurrency.name} (${option.chainName})`}
      renderOption={(props, option) => (
        <Box component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
          <Box component='span'>
            {option.nativeCurrency.name}
          </Box>
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
    />
  );
}
