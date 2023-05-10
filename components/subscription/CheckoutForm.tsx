import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import type { FormEvent } from 'react';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod, SubscriptionUsage } from 'lib/subscription/utils';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const space = useCurrentSpace();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const [period, setPeriod] = useState<SubscriptionPeriod>('monthly');
  const [usage, setUsage] = useState<SubscriptionUsage>('1');
  const [cardEvent, setCardEvent] = useState<StripeCardElementChangeEvent | null>(null);
  const cardElement = elements?.getElement('card');

  const onCardChange = (event: StripeCardElementChangeEvent) => {
    setCardEvent(event);
  };

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

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
        // TODO: Handle period/usage for subscriptions
        const subscriptionResponse = await charmClient.subscription.createSubscription({
          spaceId: space.id,
          paymentMethodId: paymentMethod.paymentMethod.id,
          period: 'monthly',
          usage: '1'
        });

        if (subscriptionResponse.clientSecret) {
          const { error } = await stripe.confirmCardPayment(subscriptionResponse.clientSecret, {
            payment_method: paymentMethod.paymentMethod.id
          });
          if (error) {
            showMessage('Payment failed! Please try again', 'error');
          } else {
            showMessage('Payment successful! Subscription active.', 'success');
          }
        } else {
          showMessage('Payment failed! Please try again', 'error');
        }
      }
    } catch (err) {
      showMessage('Payment failed! Please try again', 'error');
    }

    setIsProcessing(false);
  };

  return (
    <form id='payment-form' onSubmit={createSubscription}>
      <CardElement
        id='card-element'
        onChange={onCardChange}
        options={{
          style: {}
        }}
      />
      <Button
        type='submit'
        disabled={
          cardEvent?.error || !cardEvent?.complete || cardEvent?.empty || isProcessing || !stripe || !elements || !space
        }
      >
        {isProcessing ? 'Processing ... ' : 'Purchase'}
      </Button>
    </form>
  );
}
