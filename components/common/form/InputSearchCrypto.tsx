import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { CryptoCurrencyList, CryptoCurrency } from '../../../models/Currency';

const currencyOptions = Object.keys(CryptoCurrencyList);

const cryptoList = ['BTC', 'ETH'] as const;

type Crypto = typeof cryptoList[number]

/**
 * https://www.cryptofonts.com/icons.php
 */
const cryptoLogoPaths: Record<CryptoCurrency, string> = {
  ETH: '/cryptoLogos/ethereum-eth-logo.svg',
  BTC: '/cryptoLogos/bitcoin-btc-logo.svg',
  BCH: '/cryptoLogos/bitcoin-cash-bch-logo.svg',
  ETC: '/cryptoLogos/ethereum-classic-etc-logo.svg',
  LTC: '/cryptoLogos/litecoin-ltc-logo.svg',
  XRP: '/cryptoLogos/ripple-xrp-logo.svg'
};

export function InputSearchCrypto ({ onChange }: {onChange: (value: CryptoCurrency) => any}) {

  function emitValue (value: string) {
    if (value !== null && currencyOptions.indexOf(value) >= 0) {
      onChange(value as CryptoCurrency);
    }
  }

  return (
    <Autocomplete
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
            src={cryptoLogoPaths[option as CryptoCurrency]}
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

