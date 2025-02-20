import type { CryptoCurrency, FiatCurrency, IPairQuote } from '@packages/connectors/chains';
import { getTimeDifference } from '@root/lib/utils/dates';

import { getPriceFromCoinMarketCap, getPriceFromCryptoCompare } from './dataSources';

class PricingCache {
  // Cache any other crypto for half a hour
  private defaultCacheDurationInSeconds = 0;

  private cacheDurationInSeconds: Record<CryptoCurrency | string, number> = {
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

  cache: IPairQuote[];

  constructor() {
    this.cache = [];
  }

  /**
   *
   * @param base
   * @param quote
   * @returns
   */
  getQuote(base: CryptoCurrency | string, quote: FiatCurrency): Promise<IPairQuote | null> {
    return new Promise((resolve, reject) => {
      const cachedQuote = this.loadFromCache(base, quote);
      if (cachedQuote === null) {
        this.getPricing(base, quote)
          .then((freshQuote) => {
            if (freshQuote) {
              this.cacheQuote(freshQuote);
            }
            resolve(freshQuote);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve(cachedQuote);
      }
    });
  }

  // Loads an item from cache and deletes it if necessary
  private loadFromCache(base: CryptoCurrency | string, quote: FiatCurrency): IPairQuote | null {
    const cachedQuoteIndex = this.cache.findIndex((item) => {
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

  private cacheQuote(pairQuote: IPairQuote) {
    this.cache.push(pairQuote);
  }

  private getPricing(base: CryptoCurrency | string, quote: FiatCurrency): Promise<IPairQuote | null> {
    if (base === 'XDAI') {
      return getPriceFromCoinMarketCap(base, quote);
    }

    return getPriceFromCryptoCompare(base, quote);
  }
}

export const pricingGetter = new PricingCache();
