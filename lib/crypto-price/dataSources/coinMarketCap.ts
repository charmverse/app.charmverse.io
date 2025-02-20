import type { CryptoCurrency, FiatCurrency, IPairQuote } from '@packages/connectors/chains';
import fetch from '@root/adapters/http/fetch';

const CoinMarketCapCryptoMapping: Record<CryptoCurrency | string, number> = {
  AVAX: 5805,
  BNB: 1839,
  CELO: 5567,
  ETH: 1027,
  FTM: 3513,
  MATIC: 3890,
  ONE: 3945,
  XDAI: 8635
};

const apiServiceToken = process.env.CMC_API_TOKEN as string;

export function getPriceFromCoinMarketCap(
  base: CryptoCurrency | string,
  quote: FiatCurrency,
  apiToken = apiServiceToken
): Promise<IPairQuote> {
  return new Promise((resolve, reject) => {
    const cmcCryptoCurrencyId = CoinMarketCapCryptoMapping[base];

    if (!cmcCryptoCurrencyId) {
      reject(new Error('Currency not supported'));
      return;
    }

    fetch<any>(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcCryptoCurrencyId}&convert=${quote}`,
      {
        headers: { 'X-CMC_PRO_API_KEY': apiToken }
      }
    )
      .then((data) => {
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
      .catch((error) => {
        reject(error);
      });
  });
}
