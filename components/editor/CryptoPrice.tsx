import { BaseRawNodeSpec } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import { ArrowDropDown, Autorenew } from '@mui/icons-material';
import { Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getPricing } from 'hooks/usePricing';
import { InputSearchCurrency } from 'components/common/form/InputSearchCurrency';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, FiatCurrency, IPairQuote } from 'models/Currency';
import { formatMoney } from 'lib/utilities/formatting';
import { RelativeTime } from 'components/common/RelativeTime';

/**
 * Simple utility as the Crypto Price component allows selecting the base or quote
 */
type OptionListName = Extract<keyof IPairQuote, 'base' | 'quote'>

/**
 * TODO - Implement spec
 * @returns
 */
export function cryptoPriceSpec () {
  const spec: BaseRawNodeSpec = {
    name: 'cryptoPrice',
    type: 'node',
    schema: {
      attrs: {
        base: {
          default: null
        },
        quote: {
          default: null
        }
      },
      group: 'block',
      parseDOM: [{ tag: 'div.cryptoPrice' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.cryptoPrice', 0];
      }
    }
  };
  return spec;
}

export function CryptoPrice ({ preset, onQuoteCurrencyChange, onBaseCurrencyChange }: {
  preset?: Partial<{
    base: CryptoCurrency | null;
    quote: FiatCurrency | null;
  }>,
  onQuoteCurrencyChange?: ((currency: FiatCurrency) => void),
  onBaseCurrencyChange?: ((currency: CryptoCurrency) => void)
}) {

  const [loading, setLoadingState] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState(preset?.base ?? null as any as CryptoCurrency);
  const [quoteCurrency, setQuoteCurrency] = useState(preset?.quote ?? 'USD' as FiatCurrency);
  const [lastQuote, setPrice] = useState({
    amount: 0,
    receivedOn: 0,
    base: baseCurrency,
    quote: quoteCurrency
  } as IPairQuote);
  // Defines which list to show a search field for
  const [selectionList, setSelectionList] = useState(null as null | OptionListName);
  const [error, setError] = useState(null as null | string);

  useEffect(() => {
    // Load the price automatically on the initial render, or if a currency was changed
    if (error === null && baseCurrency && quoteCurrency) {
      refreshPrice();
    }
  }, [baseCurrency, quoteCurrency]);

  function refreshPrice () {
    setLoadingState(true);
    getPricing(baseCurrency, quoteCurrency)
      .then((quote) => {
        setError(null);
        setPrice({ ...quote, receivedOn: Date.now() });
        setLoadingState(false);
      })
      .catch(() => {
        setError('Failed to get price');
        setLoadingState(false);
      });
  }

  function changeBaseCurrency (newBase: CryptoCurrency): void {
    setSelectionList(null);
    setBaseCurrency(newBase);

    if (onBaseCurrencyChange) {
      onBaseCurrencyChange(newBase);
    }
  }

  function changeQuoteCurrency (newQuote: FiatCurrency): void {
    setSelectionList(null);
    setQuoteCurrency(newQuote);

    if (onQuoteCurrencyChange) {
      onQuoteCurrencyChange(newQuote);
    }
  }

  return (
    <Card className='cryptoPrice' component='div' raised={true} sx={{ display: 'inline-block', mx: '10px', minWidth: '250px' }}>

      {
        (baseCurrency === null) && (
          <div style={{ marginTop: '4px', padding: '5px' }}>
            <InputSearchCrypto onChange={changeBaseCurrency} />
          </div>
        )
      }

      {
        baseCurrency !== null && (
        <CardContent>
          <Typography variant='h5'>
            {baseCurrency}
            {' '}
            <ArrowDropDown onClick={() => setSelectionList('base')} />
            /
            {' '}
            {quoteCurrency}
            {' '}
            <ArrowDropDown onClick={() => setSelectionList('quote')} />
            <Autorenew onClick={() => refreshPrice()} sx={{ float: 'right' }} />
          </Typography>

          {
          (selectionList === 'base') && (
            <div style={{ marginTop: '4px', padding: '5px' }}>
              <InputSearchCrypto onChange={changeBaseCurrency} />
            </div>
          )
        }

          {
          selectionList === 'quote' && (
            <div style={{ marginTop: '4px', padding: '5px' }}>
              <InputSearchCurrency onChange={changeQuoteCurrency} />
            </div>
          )
        }

          {(loading === true && error === null) && (
          <div>
            <CircularProgress />
            <h2 style={{ textAlign: 'center' }}>Loading price..</h2>
          </div>
          )}

          {(loading === false && lastQuote.amount > 0 && error === null) && (
          <h2 style={{ textAlign: 'center' }}>{formatMoney(lastQuote.amount, quoteCurrency)}</h2>
          )}

          {error !== null && (
          <h2 style={{ textAlign: 'center' }}>No price found</h2>
          )}

        </CardContent>
        )
      }

      {
        (loading === false && baseCurrency !== null) && (
          <p style={{ margin: 'auto', textAlign: 'center', fontSize: '14px', paddingBottom: '3px' }}>
            Updated:
            {' '}
            <RelativeTime timestamp={(
              lastQuote?.receivedOn && lastQuote?.receivedOn > 0) ? lastQuote.receivedOn : Date.now()}
            />
          </p>
        )
      }
    </Card>
  );
}
