import fetch from 'adapters/http/fetch';
import { CryptoCurrency, FiatCurrency, IPairQuote } from 'models/Currency';

export function getPricing (base: CryptoCurrency, quote: FiatCurrency): Promise<IPairQuote> {

  return fetch(`/api/crypto-price?base=${base}&quote=${quote}`);
}
