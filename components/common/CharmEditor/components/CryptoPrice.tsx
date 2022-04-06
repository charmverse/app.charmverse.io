import { BaseRawNodeSpec } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import Button from 'components/common/Button';
import Autorenew from '@mui/icons-material/Autorenew';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import { Box, Card, CardContent, CardActions, CircularProgress, IconButton, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { InputSearchCurrency } from 'components/common/form/InputSearchCurrency';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, FiatCurrency, IPairQuote } from 'models/Currency';
import { formatMoney } from 'lib/utilities/formatting';
import { RelativeTime } from 'components/common/RelativeTime';
import charmClient from 'charmClient';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { CryptoCurrencies, getChainById, RPCList } from 'connectors';
import { getTokenInfo } from 'lib/tokens/tokenData';
import { isTruthy } from 'lib/utilities/types';

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
      parseDOM: [{ tag: 'div.charm-crypto-price' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-crypto-price', 0];
      }
    },
    markdown: {
      toMarkdown: () => null
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

  const [loading, setLoadingState] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(preset?.base ?? null as any as CryptoCurrency);
  const [quoteCurrency, setQuoteCurrency] = useState(preset?.quote ?? 'USD' as FiatCurrency);
  const [lastQuote, setPrice] = useState({
    amount: 0,
    receivedOn: 0,
    base: baseCurrency,
    quote: quoteCurrency
  } as IPairQuote);
  // Defines which list to show a search field for
  const [selectionList, setSelectionList] = useState<null | OptionListName>(null);
  const [error, setError] = useState<null | string>(null);

  const [paymentMethods] = usePaymentMethods();

  const customCryptoContractAddresses = paymentMethods
    .filter(method => {
      const chainId = method.chainId;
      const chain = getChainById(chainId);
      return chain?.testnet !== true && isTruthy(method.contractAddress);
    })
    .map(method => method.contractAddress) as string[];

  const cryptoList = (CryptoCurrencies as string []).concat(customCryptoContractAddresses);

  useEffect(() => {
    // Load the price automatically on the initial render, or if a currency was changed
    if (error === null && baseCurrency && quoteCurrency) {
      refreshPrice();
    }
  }, [baseCurrency, quoteCurrency]);

  function refreshPrice () {
    setLoadingState(true);

    const symbol = getTokenInfo(paymentMethods, baseCurrency).tokenSymbol;

    charmClient.getPricing(symbol, quoteCurrency)
      .then((quote) => {

        setError(null);
        setPrice({ ...quote, receivedOn: quote.receivedOn ?? Date.now() });
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

  function toggleSelectionList (option: OptionListName): void {
    if (selectionList === option) {
      setSelectionList(null);
    }
    else {
      setSelectionList(option);
    }
  }

  return (
    <Card
      draggable={false}
      className='cryptoPrice'
      component='div'
      raised={true}
      // disable propagation for bangle.dev
      onMouseUp={e => e.stopPropagation()}
      sx={{ display: 'inline-block', minWidth: '250px' }}
    >

      {(baseCurrency === null) && (
        <CardContent>
          <Box pt={1}>
            <InputSearchCrypto cryptoList={cryptoList} onChange={changeBaseCurrency} />
          </Box>
        </CardContent>
      )}
      {baseCurrency && (
        <CardContent>
          <div>
            <StyledButton
              active={selectionList === 'base'}
              onClick={() => toggleSelectionList('base')}
            >
              {getTokenInfo(paymentMethods, baseCurrency)?.tokenSymbol}
            </StyledButton>
            <Typography component='span' color='secondary'>/</Typography>
            <StyledButton
              active={selectionList === 'quote'}
              onClick={() => toggleSelectionList('quote')}
            >
              {getTokenInfo(paymentMethods, quoteCurrency)?.tokenSymbol}
            </StyledButton>
            <IconButton size='small' onClick={() => refreshPrice()} sx={{ float: 'right' }}>
              <Autorenew color='secondary' fontSize='small' />
            </IconButton>
          </div>

          {(selectionList === 'base') && (
            <Box pt={1}>
              <InputSearchCrypto cryptoList={cryptoList} onChange={changeBaseCurrency} />
            </Box>
          )}

          {selectionList === 'quote' && (
            <Box pt={1}>
              <InputSearchCurrency onChange={changeQuoteCurrency} />
            </Box>
          )}

          <Typography component='div' align='center' sx={{ fontSize: 36, lineHeight: 1, mt: 2 }}>
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

type ButtonProps = { children: React.ReactNode, active: boolean, onClick: () => void };

function StyledButton ({ children, active, onClick }: ButtonProps) {
  return (
    <Button
      color='secondary'
      endIcon={<ArrowDropDown />}
      component='span'
      variant='text'
      sx={{ color: active ? 'text.primary' : undefined, p: 0, px: 0.5 }}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
