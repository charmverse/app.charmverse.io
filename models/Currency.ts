export const CryptoCurrencyList = {
  ETH: 'Ether',
  BNB: 'Binance Coin',
  MATIC: 'Polygon',
  AVAX: 'Avalanche',
  xDAI: 'xDAI',
  FTM: 'Fantom',
  CELO: 'Celo',
  ONE: 'Harmony'
};

export type CryptoCurrency = keyof typeof CryptoCurrencyList;

/**
 * https://www.cryptofonts.com/icons.php
 */
export const CryptoLogoPaths: Record<CryptoCurrency, string> = {
  ETH: '/cryptoLogos/ethereum-eth-logo.svg',
  BNB: '/cryptoLogos/binance-coin-bnb-logo.svg',
  MATIC: '/cryptoLogos/polygon-matic-logo.svg',
  AVAX: '/cryptoLogos/avalanche-avax-logo.svg',
  xDAI: '/cryptoLogos/gnosis-xdai-logo.svg',
  FTM: '/cryptoLogos/fantom-ftm-logo.svg',
  CELO: '/cryptoLogos/celo-celo-logo.svg',
  ONE: '/cryptoLogos/harmony-one-logo.svg'
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
