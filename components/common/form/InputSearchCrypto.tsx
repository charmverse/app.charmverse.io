import { Autocomplete, Box, TextField } from '@mui/material';
import { CryptoCurrency, CryptoCurrencyList, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import { UseFormRegister } from 'react-hook-form';
import { CryptoCurrencies } from 'connectors';

export interface IInputSearchCryptoProps {
  onChange?: (value: CryptoCurrency) => any,
  defaultValue?: CryptoCurrency | string,
  register?: UseFormRegister<any>
  modelKey?: string,
  label?: string,
  readOnly?: boolean,
  cryptoList?: Array<string | CryptoCurrency>
}

export function InputSearchCrypto ({
  onChange = () => {},
  defaultValue,
  register = () => ({}) as any,
  modelKey = '-',
  readOnly = false,
  cryptoList = CryptoCurrencies,
  label = 'Choose a crypto' }: IInputSearchCryptoProps) {

  function emitValue (value: string) {
    console.log('To Emit', value);
    if (value !== null && cryptoList.indexOf(value as CryptoCurrency) >= 0) {
      onChange(value as CryptoCurrency);
    }
  }

  const valueToDisplay = defaultValue ?? cryptoList[0];

  return (
    <Autocomplete
      defaultValue={valueToDisplay}
      onChange={(_, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={cryptoList}
      disableClearable={true}
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
          value={valueToDisplay}
        />
      )}
    />
  );
}

