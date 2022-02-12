export const CryptoCurrencyList = {
  BTC: 'Bitcoin',
  ETH: 'Ether',
  XRP: 'Ripple',
  LTC: 'Litecoin',
  BCH: 'Bitcoin Cash',
  ETC: 'Ethererum Classic'
};

export type CryptoCurrency = keyof typeof CryptoCurrencyList;

/**
 * https://www.cryptofonts.com/icons.php
 */
export const CryptoLogoPaths: Record<CryptoCurrency, string> = {
  ETH: '/cryptoLogos/ethereum-eth-logo.svg',
  BTC: '/cryptoLogos/bitcoin-btc-logo.svg',
  BCH: '/cryptoLogos/bitcoin-cash-bch-logo.svg',
  ETC: '/cryptoLogos/ethereum-classic-etc-logo.svg',
  LTC: '/cryptoLogos/litecoin-ltc-logo.svg',
  XRP: '/cryptoLogos/ripple-xrp-logo.svg'
};

export const FiatCurrencyList = {
  USD: 'US Dollar',
  GBP: 'British Pound Sterling',
  EUR: 'Euro',
  JPY: 'Japanese Yen'
};

export type FiatCurrency = keyof typeof FiatCurrencyList;

export type Currency = CryptoCurrency | FiatCurrency;

export interface ICurrencyPair {
  base: CryptoCurrency;
  quote: FiatCurrency;
}

export interface IPairQuote extends ICurrencyPair {
  amount: number;
  receivedOn?: number | Date;
  source?: string;
}
