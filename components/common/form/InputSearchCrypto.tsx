import { Autocomplete, Box, TextField } from '@mui/material';
import { CryptoCurrencies } from 'connectors';
import { CryptoCurrency, CryptoCurrencyList, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';

export interface IInputSearchCryptoProps {
  onChange?: (value: CryptoCurrency) => any,
  defaultValue?: CryptoCurrency | string,

  cryptoList?: Array<string | CryptoCurrency>
}

export function InputSearchCrypto ({
  onChange = () => {},
  defaultValue,
  cryptoList = CryptoCurrencies
}: IInputSearchCryptoProps) {

  function emitValue (value: string) {
    if (value !== null && cryptoList.indexOf(value as CryptoCurrency) >= 0) {
      onChange(value as CryptoCurrency);
    }
  }

  const valueToDisplay = defaultValue ?? (cryptoList[0] ?? '');

  const [inputValue, setInputValue] = useState('');

  const [value, setValue] = useState(valueToDisplay);

  useEffect(() => {
    setInputValue(valueToDisplay);
    setValue(valueToDisplay);
  }, [cryptoList]);

  return (
    <Autocomplete
      sx={{ minWidth: 150 }}
      onChange={(_, _value) => {
        emitValue(_value as any);
      }}
      value={value}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
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
          {...params}
        />
      )}
    />
  );
}

