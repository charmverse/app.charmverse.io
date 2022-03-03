import { Autocomplete, Box, TextField } from '@mui/material';
import { CryptoCurrency, CryptoCurrencyList, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import { UseFormRegister } from 'react-hook-form';

const currencyOptions = Object.keys(CryptoCurrencyList);

export interface IInputSearchCryptoProps {
  onChange?: (value: CryptoCurrency) => any,
  defaultValue?: CryptoCurrency,
  register?: UseFormRegister<any>
  modelKey?: string,
  label?: string
}

export function InputSearchCrypto ({
  onChange = () => {},
  defaultValue,
  register = () => ({}) as any,
  modelKey = '-',
  label = 'Choose a crypto' }: IInputSearchCryptoProps) {

  function emitValue (value: string) {
    if (value !== null && currencyOptions.indexOf(value) >= 0) {
      onChange(value as CryptoCurrency);
    }
  }

  return (
    <Autocomplete
      defaultValue={defaultValue ?? null}
      onChange={(_, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={currencyOptions}
      autoHighlight
      size='small'
      renderOption={(props, option) => (
        <Box component='li' sx={{ '& > img': { mr: 2, flexShrink: 0 }, display: 'flex', gap: 1 }} {...props}>
          <Image
            loading='lazy'
            width='20px'
            height='20px'
            src={CryptoLogoPaths[option as CryptoCurrency]}
          />
          <Box component='span'>
            {option}
          </Box>
          <Box component='span'>
            {CryptoCurrencyList[option as CryptoCurrency]}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...register(modelKey)}
          {...params}
          label={label}
        />
      )}
    />
  );
}

