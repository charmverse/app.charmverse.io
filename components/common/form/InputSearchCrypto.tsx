import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { CryptoCurrencyList, CryptoCurrency, CryptoLogoPaths } from 'models/Currency';

const currencyOptions = Object.keys(CryptoCurrencyList);

export function InputSearchCrypto ({ onChange, defaultValue }:
    { onChange: (value: CryptoCurrency) => any, defaultValue?: CryptoCurrency }) {

  function emitValue (value: string) {
    if (value !== null && currencyOptions.indexOf(value) >= 0) {
      onChange(value as CryptoCurrency);
    }
  }

  return (
    <Autocomplete
      defaultValue={defaultValue}
      onChange={(event, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={currencyOptions}
      autoHighlight
      renderOption={(props, option) => (
        <Box component='li' sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
          <Image
            loading='lazy'
            width='20px'
            height='20px'
            src={CryptoLogoPaths[option as CryptoCurrency]}
          />
          {'    '}
          {option}
          {' '}
          {CryptoCurrencyList[option as CryptoCurrency]}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Choose a crypto'
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
    />
  );
}

