export type CryptoCurrency = 'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'ETC';

export type FiatCurrency = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'ZAR';

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
