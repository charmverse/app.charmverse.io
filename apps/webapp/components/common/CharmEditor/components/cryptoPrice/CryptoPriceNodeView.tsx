import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Autorenew from '@mui/icons-material/Autorenew';
import { Box, Card, CardContent, CardActions, CircularProgress, IconButton, Typography } from '@mui/material';
import type { CryptoCurrency, FiatCurrency, IPairQuote } from '@packages/blockchain/connectors/chains';
import { CryptoCurrencies, getChainById } from '@packages/blockchain/connectors/chains';
import { getTokenInfo } from '@packages/lib/tokens/tokenData';
import { formatMoney } from '@packages/lib/utils/formatting';
import { isTruthy } from '@packages/utils/types';
import type { EditorView } from 'prosemirror-view';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { CoinLogoAndTicker } from 'components/common/CoinLogoAndTicker';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { InputSearchCurrency } from 'components/common/form/InputSearchCurrency';
import { RelativeTime } from 'components/common/RelativeTime';
import { usePaymentMethods } from 'hooks/usePaymentMethods';

import { enableDragAndDrop } from '../../utils';

/**
 * Simple utility as the Crypto Price component allows selecting the base or quote
 */
type OptionListName = Extract<keyof IPairQuote, 'base' | 'quote'>;

export function CryptoPriceNodeView({
  base,
  quote,
  onQuoteCurrencyChange,
  onBaseCurrencyChange,
  readOnly,
  view,
  getPos
}: {
  readOnly: boolean;
  base: CryptoCurrency | null;
  quote: FiatCurrency | null;
  onQuoteCurrencyChange: (currency: FiatCurrency) => void;
  onBaseCurrencyChange: (currency: CryptoCurrency) => void;
  view: EditorView;
  getPos: () => number | undefined;
}) {
  const [loading, setLoadingState] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<CryptoCurrency | null>(base);
  const [quoteCurrency, setQuoteCurrency] = useState<FiatCurrency>(quote ?? 'USD');
  const [lastQuote, setPrice] = useState<{ amount: number; receivedOn: number }>({
    amount: 0,
    receivedOn: 0
  });
  // Defines which list to show a search field for
  const [selectionList, setSelectionList] = useState<null | OptionListName>(null);
  const [error, setError] = useState<null | string>(null);

  const [paymentMethods] = usePaymentMethods();

  const customCryptoContractAddresses = paymentMethods
    .filter((method) => {
      const chainId = method.chainId;
      const chain = getChainById(chainId);
      return chain?.testnet !== true && isTruthy(method.contractAddress);
    })
    .map((method) => method.contractAddress) as string[];

  const cryptoList = CryptoCurrencies.concat(customCryptoContractAddresses);

  useEffect(() => {
    setBaseCurrency(base);
    setQuoteCurrency(quote ?? 'USD');
  }, [base, quote]);

  useEffect(() => {
    // Load the price automatically on the initial render, or if a currency was changed
    if (error === null && baseCurrency && quoteCurrency) {
      refreshPrice();
    }
  }, [baseCurrency, quoteCurrency]);

  function refreshPrice() {
    if (!baseCurrency || !quoteCurrency) {
      return;
    }

    setLoadingState(true);

    const symbol = getTokenInfo({
      methods: paymentMethods,
      symbolOrAddress: baseCurrency
    }).tokenSymbol;

    charmClient
      .getPricing(symbol, quoteCurrency)
      .then((_quote) => {
        setError(null);
        setPrice({ ..._quote, receivedOn: typeof _quote.receivedOn === 'number' ? _quote.receivedOn : Date.now() });
        setLoadingState(false);
      })
      .catch(() => {
        setError('Failed to get price');
        setLoadingState(false);
      });
  }

  function changeBaseCurrency(newBase: CryptoCurrency): void {
    setSelectionList(null);
    setBaseCurrency(newBase);
    onBaseCurrencyChange(newBase);
  }

  function changeQuoteCurrency(newQuote: FiatCurrency): void {
    setSelectionList(null);
    setQuoteCurrency(newQuote);
    onQuoteCurrencyChange(newQuote);
  }

  function toggleSelectionList(option: OptionListName): void {
    if (selectionList === option) {
      setSelectionList(null);
    } else {
      setSelectionList(option);
    }
  }

  return (
    <Card
      className='cryptoPrice'
      onDragStart={() => {
        enableDragAndDrop(view, getPos());
      }}
      component='div'
      // disable propagation for bangle.dev
      onMouseUp={(e) => e.stopPropagation()}
      sx={{ display: 'inline-block', minWidth: '250px' }}
    >
      {baseCurrency === null && (
        <CardContent>
          <Box pt={1}>
            <InputSearchCrypto
              disabled={readOnly}
              readOnly={readOnly}
              cryptoList={cryptoList}
              onChange={changeBaseCurrency}
            />
          </Box>
        </CardContent>
      )}
      {baseCurrency && (
        <CardContent>
          <div>
            <StyledButton
              disabled={readOnly}
              active={selectionList === 'base'}
              onClick={() => toggleSelectionList('base')}
            >
              <CoinLogoAndTicker {...getTokenInfo({ methods: paymentMethods, symbolOrAddress: baseCurrency })} />
            </StyledButton>
            <Typography component='span' color='secondary'>
              /
            </Typography>
            <StyledButton
              disabled={readOnly}
              active={selectionList === 'quote'}
              onClick={() => toggleSelectionList('quote')}
            >
              {getTokenInfo({ methods: paymentMethods, symbolOrAddress: quoteCurrency }).tokenSymbol}
            </StyledButton>
            <IconButton disabled={readOnly} size='small' onClick={() => refreshPrice()} sx={{ float: 'right' }}>
              <Autorenew color='secondary' fontSize='small' />
            </IconButton>
          </div>

          {selectionList === 'base' && (
            <Box pt={1}>
              <InputSearchCrypto readOnly={readOnly} cryptoList={cryptoList} onChange={changeBaseCurrency} />
            </Box>
          )}

          {selectionList === 'quote' && (
            <Box pt={1}>
              <InputSearchCurrency onChange={changeQuoteCurrency} />
            </Box>
          )}

          {!error && (
            <Typography component='div' align='center' sx={{ fontSize: 36, lineHeight: 1, mt: 2 }}>
              {loading === false &&
                !error &&
                formatMoney(lastQuote.amount ?? 0, quoteCurrency, window.navigator.language)}
              {loading === true && !error && '- -'}
            </Typography>
          )}
          {error && (
            <Typography component='div' align='center' sx={{ fontSize: 24, lineHeight: 1, mt: 2 }}>
              No price found
            </Typography>
          )}
        </CardContent>
      )}

      {loading === true && (
        <CardActions sx={{ justifyContent: 'center' }}>
          <Typography variant='caption' color='secondary'>
            <CircularProgress size={10} color='inherit' sx={{ mr: 1 }} />
            Loading price...
          </Typography>
        </CardActions>
      )}
      {loading === false && baseCurrency !== null && (
        <CardActions sx={{ justifyContent: 'center' }}>
          <Typography variant='caption' color='secondary'>
            Updated:{' '}
            <RelativeTime
              timestamp={lastQuote?.receivedOn && lastQuote?.receivedOn > 0 ? lastQuote.receivedOn : Date.now()}
            />
          </Typography>
        </CardActions>
      )}
    </Card>
  );
}

type ButtonProps = { disabled?: boolean; children: React.ReactNode; active: boolean; onClick: () => void };

function StyledButton({ disabled, children, active, onClick }: ButtonProps) {
  return (
    <Button
      color='secondary'
      endIcon={<ArrowDropDown />}
      component='span'
      variant='text'
      sx={{ color: active ? 'text.primary' : undefined, p: 0, px: 0.5 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
