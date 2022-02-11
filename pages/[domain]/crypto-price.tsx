import { useState } from 'react';
import { CryptoPrice } from '../../components/editor/CryptoPrice';

export default function CryptoPriceWrapper () {

  return (
    <div>
      <CryptoPrice preset={{ base: 'ETH', quote: 'EUR' }} />
      <CryptoPrice preset={{ base: 'ETH', quote: 'USD' }} />
      <CryptoPrice />
    </div>
  );
}
