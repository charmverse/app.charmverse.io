import { BaseRawNodeSpec } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import Button from 'components/common/Button';
import { ArrowDropDown, Autorenew } from '@mui/icons-material';
import { Box, Card, CardContent, CardActions, CircularProgress, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { InputSearchCurrency } from '../../components/common/form/InputSearchCurrency';
import { InputSearchCrypto } from '../../components/common/form/InputSearchCrypto';
import { getPricing } from '../../hooks/usePricing';
import { CryptoCurrency, FiatCurrency, IPairQuote } from '../../models/Currency';
import { formatMoney } from '../../lib/utilities/formatting';
import { RelativeTime } from '../common/RelativeTime';

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
    if (error === null
      && (lastQuote.amount === 0 || lastQuote.base !== baseCurrency || lastQuote.quote !== quoteCurrency)) {
      refreshPrice();
    }
  });

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

  function toggleSelectionList (list: OptionListName): void {
    if (selectionList === list) {
      setSelectionList(null);
    }
    else {
      setSelectionList(list);
    }
  }

  return (
    <Card className='cryptoPrice' component='div' raised={true} sx={{ display: 'inline-block', mx: '10px', minWidth: '250px' }}>

      {(baseCurrency === null) && (
        <div style={{ marginTop: '4px', padding: '5px' }}>
          <InputSearchCrypto onChange={changeBaseCurrency} />
        </div>
      )}

      {baseCurrency !== null && (
        <CardContent>
          <div>
            <Button color='secondary' component='span' variant='text' size='small' onClick={() => toggleSelectionList('base')}>
              {baseCurrency}
              {' '}
              <ArrowDropDown />
            </Button>
            /
            <Button color='secondary' component='span' variant='text' size='small' onClick={() => toggleSelectionList('quote')}>
              {' '}
              {quoteCurrency}
              {' '}
              <ArrowDropDown />
            </Button>
            <IconButton size='small' onClick={() => refreshPrice()} sx={{ float: 'right' }}>
              <Autorenew />
            </IconButton>
          </div>

          {(selectionList === 'base') && (
            <Box pt={1}>
              <InputSearchCrypto onChange={changeBaseCurrency} />
            </Box>
          )}

          {selectionList === 'quote' && (
            <Box pt={1}>
              <InputSearchCurrency onChange={changeQuoteCurrency} />
            </Box>
          )}

          <Typography variant='h2' align='center'>
            {loading === false && !error && formatMoney(lastQuote.amount, quoteCurrency)}
            {loading === true && !error && '- -'}
            {error && 'No price found'}
          </Typography>
        </CardContent>
      )}

      {(loading === true) && (
        <CardActions sx={{ justifyContent: 'center' }}>
          <Typography variant='caption' color='secondary'>
            <CircularProgress size={10} color='inherit' sx={{ mr: 1 }} />
            Loading price...
          </Typography>
        </CardActions>
      )}
      {(loading === false && baseCurrency !== null) && (
        <CardActions sx={{ justifyContent: 'center' }}>
          <Typography variant='caption' color='secondary'>
            Updated:
            {' '}
            <RelativeTime timestamp={(
              lastQuote?.receivedOn && lastQuote?.receivedOn > 0) ? lastQuote.receivedOn : Date.now()}
            />
          </Typography>
        </CardActions>
      )}
    </Card>
  );
}
