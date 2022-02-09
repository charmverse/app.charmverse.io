export const CryptoCurrencyList = {
  BTC: 'Bitcoin',
  ETH: 'Ether',
  XRP: 'Ripple',
  LTC: 'Litecoin',
  BCH: 'Bitcoin Cash',
  ETC: 'Ethererum Classic'
};

export type CryptoCurrency = keyof typeof CryptoCurrencyList;

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
