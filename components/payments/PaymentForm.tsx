import { useStripe, useElements } from '@stripe/react-stripe-js';
import type { FormEvent } from 'react';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const space = useCurrentSpace();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements.getElement('card');

    if (!cardElement) {
      return;
    }

    try {
      setIsProcessing(true);
      const paymentMethod = await stripe.createPaymentMethod({
        card: cardElement,
        type: 'card'
      });

      if (paymentMethod.paymentMethod) {
        const subscriptionResponse = await charmClient.payment.createSubscription({
          spaceId: space.id,
          paymentMethodId: paymentMethod.paymentMethod.id,
          monthly: false
        });

        if (subscriptionResponse.clientSecret) {
          const { error } = await stripe.confirmCardPayment(subscriptionResponse.clientSecret, {
            payment_method: paymentMethod.paymentMethod.id
          });
          if (error) {
            setMessage('Payment failed! Please try again');
          } else {
            setMessage('Payment successful! Subscription active.');
          }
        } else {
          setMessage('Payment failed! Please try again');
        }
      }
    } catch (err) {
      setMessage('Payment failed! Please try again');
    }

    setIsProcessing(false);
  };

  return (
    <form id='payment-form' onSubmit={createSubscription}>
      <Button type='submit' disabled={isProcessing || !stripe || !elements || !space}>
        {isProcessing ? 'Processing ... ' : 'Pay now'}
      </Button>
      {/* Show any error or success messages */}
      {message && <div id='payment-message'>{message}</div>}
    </form>
  );
}
