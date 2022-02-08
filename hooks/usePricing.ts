import { Currency, IPairQuote } from '../models/Currency';
import fetch from '../adapters/http/fetch';

export function getPricing (base: Currency, quote: Currency): Promise<IPairQuote> {
  return new Promise((resolve, reject) => {
    fetch(`https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=${quote}`)
      .then(data => {

        const pairQuote: IPairQuote = {
          base,
          quote,
          amount: data[quote]
        };

        resolve(pairQuote);
      });
  });

}
