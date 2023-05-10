import { useTheme } from '@emotion/react';
import InputLabel from '@mui/material/InputLabel';
import { Box, Stack } from '@mui/system';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementChangeEvent } from '@stripe/stripe-js';
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
  const [cardEvent, setCardEvent] = useState<{
    cardNumber: StripeElementChangeEvent | null;
    cvc: StripeElementChangeEvent | null;
    expiry: StripeElementChangeEvent | null;
  }>({
    expiry: null,
    cvc: null,
    cardNumber: null
  });

  const cardError = cardEvent.cardNumber?.error || cardEvent.cvc?.error || cardEvent.expiry?.error;
  const cardComplete = cardEvent.cardNumber?.complete && cardEvent.cvc?.complete && cardEvent.expiry?.complete;
  const cardEmpty = cardEvent.cardNumber?.empty || cardEvent.cvc?.empty || cardEvent.expiry?.empty;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements?.getElement('card');
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

  const theme = useTheme();

  return (
    <form id='payment-form' onSubmit={createSubscription}>
      <Stack display='flex' mb={2} flexDirection='row' gap={1}>
        <Stack gap={0.5} flexGrow={1}>
          <InputLabel>Card number</InputLabel>
          <Box
            sx={{
              p: 1,
              backgroundColor: 'background.light',
              border: `2px solid ${theme.palette.background.dark}`
            }}
          >
            <CardNumberElement
              options={{
                placeholder: '4242 4242 4242 4242'
              }}
              onChange={(e) =>
                setCardEvent({
                  ...cardEvent,
                  cardNumber: e
                })
              }
            />
          </Box>
        </Stack>
        <Stack gap={0.5} flexGrow={0.25}>
          <InputLabel>Expiry Date</InputLabel>
          <Box
            sx={{
              p: 1,
              backgroundColor: 'background.light',
              border: `2px solid ${theme.palette.background.dark}`
            }}
          >
            <CardExpiryElement
              options={{
                placeholder: '10 / 25'
              }}
              onChange={(e) =>
                setCardEvent({
                  ...cardEvent,
                  expiry: e
                })
              }
            />
          </Box>
        </Stack>
        <Stack gap={0.5} flexGrow={0.25}>
          <InputLabel>CVC</InputLabel>
          <Box
            sx={{
              p: 1,
              backgroundColor: 'background.light',
              border: `2px solid ${theme.palette.background.dark}`
            }}
          >
            <CardCvcElement
              options={{
                placeholder: '1234'
              }}
              onChange={(e) =>
                setCardEvent({
                  ...cardEvent,
                  cvc: e
                })
              }
            />
          </Box>
        </Stack>
      </Stack>
      <Stack gap={1} display='flex' flexDirection='row'>
        <Button
          type='submit'
          sx={{ width: 'fit-content' }}
          disabled={cardError || !cardComplete || cardEmpty || isProcessing || !stripe || !elements || !space}
        >
          {isProcessing ? 'Processing ... ' : 'Upgrade'}
        </Button>
        <Button sx={{ width: 'fit-content' }} color='secondary' variant='outlined'>
          Cancel
        </Button>
      </Stack>
    </form>
  );
}
