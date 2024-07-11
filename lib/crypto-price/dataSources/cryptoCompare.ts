import fetch from '@root/adapters/http/fetch';
import type { CryptoCurrency, FiatCurrency, IPairQuote } from '@root/connectors/chains';

export function getPriceFromCryptoCompare(base: CryptoCurrency | string, quote: FiatCurrency) {
  return fetch<any>(`https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=${quote}`).then((data) => {
    if (!data[quote]) {
      return null;
    }

    const pairQuote: IPairQuote = {
      base,
      quote,
      amount: data[quote],
      receivedOn: Date.now()
    };

    return pairQuote;
  });
}
