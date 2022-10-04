
import type { CryptoCurrency, FiatCurrency, IPairQuote } from 'connectors';

import fetch from 'adapters/http/fetch';

export function getPriceFromCryptoCompare (
  base: CryptoCurrency | string,
  quote: FiatCurrency
) {

  return fetch<any>(`https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=${quote}`)
    .then(data => {

      if (!data[quote]) {
        throw new Error('No valid price');
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

