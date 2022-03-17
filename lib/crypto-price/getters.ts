import fetch from 'adapters/http/fetch';
import { getTimeDifference } from 'lib/utilities/dates';
import { CryptoCurrency, FiatCurrency, IPairQuote } from 'models/Currency';
import { IError } from 'lib/utilities/errors';

const CoinMarketCapCryptoMapping: Record<CryptoCurrency, number> = {
  AVAX: 5805,
  BNB: 1839,
  CELO: 5567,
  ETH: 1027,
  FTM: 3513,
  MATIC: 3890,
  ONE: 3945,
  XDAI: 8635
};

class PricingCache {

  private cmcApiToken: string;

  // Cache any other crypto for half a hour
  private defaultCacheDurationInSeconds = 0;

  private cacheDurationInSeconds: Record<CryptoCurrency, number> = {
    AVAX: 60,
    BNB: 60,
    CELO: 60,
    ETH: 60,
    FTM: 60,
    MATIC: 60,
    ONE: 60,
    // Currently we only need caching for xDai.
    // Our daily limit is 333 requests
    // This duration in seconds allows us to get an xDai quote for all 4 fiat currencies 83 times a day
    XDAI: 1053
  };

  cache: IPairQuote [];

  constructor () {
    this.cache = [];
    this.cmcApiToken = process.env.CMC_API_TOKEN!;
  }

  getQuote (base: CryptoCurrency, quote: FiatCurrency): Promise<IPairQuote> {
    return new Promise((resolve, reject) => {
      const cachedQuote = this.loadFromCache(base, quote);

      if (cachedQuote === null) {
        this.getPricing(base, quote)
          .then(freshQuote => {
            console.log('API Quote', freshQuote);
            this.cacheQuote(freshQuote);
            resolve(freshQuote);
          })
          .catch(error => {
            console.log('API Quote ERROR', error);
            reject(error);
          });
      }
      else {
        resolve(cachedQuote);
      }

    });
  }

  // Loads an item from cache and deletes it if necessary
  private loadFromCache (base: CryptoCurrency, quote: FiatCurrency): IPairQuote | null {
    const cachedQuoteIndex = this.cache.findIndex(item => {
      return item.quote === quote && item.base === base;
    });

    if (cachedQuoteIndex === -1) {
      return null;
    }

    const cachedQuote = this.cache[cachedQuoteIndex];

    const diff = getTimeDifference(Date.now(), 'second', cachedQuote.receivedOn);

    if (diff < (this.cacheDurationInSeconds[base] ?? this.defaultCacheDurationInSeconds)) {
      return cachedQuote;
    }

    // We need to purge the cache
    this.cache.splice(cachedQuoteIndex, 1);
    return null;
  }

  private cacheQuote (pairQuote: IPairQuote) {
    this.cache.push(pairQuote);
  }

  private getPricing (base: CryptoCurrency, quote: FiatCurrency): Promise<IPairQuote> {

    if (base === 'XDAI') {
      return this.getPriceFromCoinMarketCap(base, quote);
    }

    return fetch(`https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=${quote}`)
      .then(data => {

        if (!data.quote) {
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

  private getPriceFromCoinMarketCap (base: CryptoCurrency, quote: FiatCurrency): Promise<IPairQuote> {
    return new Promise((resolve, reject) => {
      const cmcCryptoCurrencyId = CoinMarketCapCryptoMapping[base];
      fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcCryptoCurrencyId}&convert=${quote}`, {
        headers: { 'X-CMC_PRO_API_KEY': this.cmcApiToken }
      })
        .then(data => {

          const quotedPrice = data.data[cmcCryptoCurrencyId.toString()].quote[quote].price;

          if (!quotedPrice) {
            reject(new Error('No price found'));
            return;
          }

          const pairQuote: IPairQuote = {
            base,
            quote,
            amount: quotedPrice,
            receivedOn: Date.now()
          };

          resolve(pairQuote);

        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

export const pricingGetter = new PricingCache();
