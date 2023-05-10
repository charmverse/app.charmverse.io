import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';

import { CheckoutForm } from './CheckoutForm';

export function PaymentForm() {
  const [stripePromise, setStripePromise] = useState<PromiseLike<Stripe | null> | null>(null);

  useEffect(() => {
    async function fetchStripePublicKey() {
      const { publicKey } = await charmClient.payment.getStripePublicKey();
      setStripePromise(loadStripe(publicKey));
    }

    fetchStripePublicKey();
  }, []);

  return (
    stripePromise && (
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    )
  );
}
