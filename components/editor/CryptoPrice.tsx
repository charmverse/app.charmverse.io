import { BaseRawNodeSpec } from '@bangle.dev/core';
import { Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Typography, Box } from '@mui/material';
import { Autorenew, ArrowDropDown } from '@mui/icons-material';
import { useEffect, useState, Suspense } from 'react';
import LoadingComponent from '../common/LoadingComponent';
import { InputSearchCurrency } from '../../components/common/form/InputSearchCurrency';
import { getPricing } from '../../hooks/usePricing';
import { CryptoCurrency, FiatCurrency, ICurrencyPair, IPairQuote, CryptoCurrencyList, FiatCurrencyList, Currency } from '../../models/Currency';
import { formatMoney } from '../../utilities/formatting';
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
    schema: {}
  };
  return spec;
}

export function CryptoPrice ({ preset } : {preset?: Partial<ICurrencyPair> }) {

  const [loading, setLoadingState] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState(preset?.base ?? 'BTC' as CryptoCurrency);
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

  function currencySelected (selected: string, eventFromList: OptionListName): void {

    if (eventFromList === 'base') {
      setBaseCurrency(selected as any);
    }
    else if (eventFromList === 'quote') {
      setQuoteCurrency(selected as any);
    }
  }

  return (
    <Card raised={true} sx={{ display: 'inline-block', mx: '10px' }}>
      <CardContent>
        <Typography variant='h2'>
          {baseCurrency}
          {' '}
          /
          {' '}
          {quoteCurrency}
          {' '}
          <ArrowDropDown onClick={() => setSelectionList('base')} />
          <Autorenew onClick={refreshPrice} sx={{ float: 'right' }} />
        </Typography>

        {/*
            Section for display list of cryptos

            REINSERT BELOW IF NEEDED
            <InputSearch name={selectionList} options={listOptions} callback={currencySelected} />
          */}
        {
          selectionList === 'base' && (
            <InputSearchCurrency />
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
      {
        loading === false && (
          <p style={{ margin: 'auto', minWidth: '250px', textAlign: 'center', fontSize: '14px', paddingBottom: '3px' }}>
            Updated:
            {' '}
            <RelativeTime timestamp={lastQuote.receivedOn > 0 ? lastQuote.receivedOn : Date.now()} />
          </p>
        )
      }
    </Card>
  );
}
