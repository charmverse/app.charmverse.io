import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import { ReactNode, useState, useEffect, Dispatch } from 'react';
import { getPricing } from '../../hooks/usePricing';
import { Currency, IPairQuote } from '../../models/Currency';

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

export function CryptoPrice () {

  const [baseCurrency, setBaseCurrency] = useState('BTC' as Currency);
  const [quoteCurrency, setQuoteCurrency] = useState('EUR' as Currency);
  const [amount, setPrice] = useState(0);
  const [lastUpdated, setLastUpdated] = useState();

  useEffect(() => {
    // Load the price automatically on the initial render
    if (amount === 0) {
      refreshPrice();
    }
  });

  const lastUpdatedOn = '';

  function refreshPrice () {
    getPricing(baseCurrency, quoteCurrency)
      .then((quote) => {

        setPrice(quote.amount);
      });
  }

  return (
    <div className='price-quote col s12 m6 l4'>
      <h2>
        {baseCurrency}
        /
        {quoteCurrency}
      </h2>

      {
        amount > 0 && <div>{amount}</div>
      }
      <button type='button' onClick={refreshPrice}>Refresh price</button>
    </div>
  );
}
