import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import { RPCList } from 'connectors';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { UseFormRegister } from 'react-hook-form';

interface Props {
  onChange?: (chainId: string) => void
  defaultChainId?: string | number
  modelKey?: string
  register?: UseFormRegister<any>,
}

export function InputBlockchainSearch ({
  defaultChainId,
  onChange = () => {},
  modelKey,
  register = () => ({}) as any }: Props) {

  const defaultValueToAssign = defaultChainId ? RPCList.find(rpc => {
    return rpc.chainId === defaultChainId;
  }) : null;

  return (
    <Autocomplete
      defaultValue={defaultValueToAssign}
      {...register(modelKey ?? 'selectBlockchain', {
        onChange: (event) => {

        }
      })}
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
        />
      )}
    />
  );
}
