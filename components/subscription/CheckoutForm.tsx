import { useTheme } from '@emotion/react';
import { Divider, FormControlLabel, List, ListItemText, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import { Box, Stack, styled } from '@mui/system';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementChangeEvent } from '@stripe/stripe-js';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import {
  SUBSCRIPTION_USAGE,
  SUBSCRIPTION_USAGE_RECORD,
  type SubscriptionPeriod,
  type SubscriptionUsage
} from 'lib/subscription/constants';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

const StyledList = styled(List)`
  list-style-type: disc;
  padding-inline-start: 40px;
`;

const StyledListItemText = styled(ListItemText)`
  display: list-item;
`;

export function CheckoutForm({
  onCancel,
  refetch,
  spaceSubscription
}: {
  spaceSubscription: null | SpaceSubscription;
  onCancel: VoidFunction;
  refetch: KeyedMutator<SpaceSubscription | null>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const space = useCurrentSpace();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const [period, setPeriod] = useState<SubscriptionPeriod>('monthly');
  const [usage, setUsage] = useState<SubscriptionUsage>(1);
  const [cardEvent, setCardEvent] = useState<{
    cardNumber: StripeElementChangeEvent | null;
    cvc: StripeElementChangeEvent | null;
    expiry: StripeElementChangeEvent | null;
  }>({
    expiry: null,
    cvc: null,
    cardNumber: null
  });

  useEffect(() => {
    if (spaceSubscription) {
      setPeriod(spaceSubscription.period);
      setUsage(spaceSubscription.usage);
    }
  }, [spaceSubscription]);

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

    const cardNumberElement = elements?.getElement('cardNumber');

    if (!cardNumberElement) {
      return;
    }

    try {
      setIsProcessing(true);
      const paymentMethod = await stripe.createPaymentMethod({
        card: cardNumberElement,
        type: 'card'
      });

      if (paymentMethod.paymentMethod) {
        const { clientSecret, paymentIntentStatus } = await charmClient.subscription.createSubscription({
          spaceId: space.id,
          paymentMethodId: paymentMethod.paymentMethod.id,
          period,
          usage
        });

        if (clientSecret && paymentIntentStatus !== 'succeeded') {
          const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethod.paymentMethod.id
          });
          if (error) {
            showMessage('Payment failed! Please try again', 'error');
          } else {
            showMessage('Payment successful! Subscription active.', 'success');
          }
        }
      }
    } catch (err) {
      showMessage('Payment failed! Please try again', 'error');
    }

    setIsProcessing(false);
    await refetch();
    onCancel();
  };

  const theme = useTheme();

  return (
    <Stack onSubmit={createSubscription} gap={1}>
      <Stack>
        <InputLabel>Usage</InputLabel>
        <Box
          sx={{
            mx: 2
          }}
        >
          <Slider
            disabled={isProcessing}
            size='small'
            aria-label='usage'
            valueLabelDisplay='off'
            value={usage}
            marks={SUBSCRIPTION_USAGE.map((_usage) => ({
              value: _usage,
              label: `$${SUBSCRIPTION_USAGE_RECORD[_usage].pricing[period]}/${period === 'annual' ? 'yr' : 'mo'}`
            }))}
            min={SUBSCRIPTION_USAGE[0]}
            max={SUBSCRIPTION_USAGE[SUBSCRIPTION_USAGE.length - 1]}
            onChange={(_, value) => {
              setUsage(value as SubscriptionUsage);
            }}
          />
        </Box>
      </Stack>
      <Stack>
        <InputLabel>Billing Period</InputLabel>
        <FormControlLabel
          sx={{
            width: 'fit-content'
          }}
          control={
            <Switch
              checked={period === 'annual'}
              onChange={(e) => {
                setPeriod(e.target.checked ? 'annual' : 'monthly');
              }}
              disabled={isProcessing}
            />
          }
          label='Annual'
        />
      </Stack>
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
                disabled: isProcessing,
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
                disabled: isProcessing,
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
                disabled: isProcessing,
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
      <Divider sx={{ mb: 1 }} />
      <Typography variant='h6'>Order Summary</Typography>
      <Typography>Paid plan: ${SUBSCRIPTION_USAGE_RECORD[usage].pricing[period]}/mo</Typography>
      <StyledList>
        <StyledListItemText>{SUBSCRIPTION_USAGE_RECORD[usage].totalBlocks} blocks</StyledListItemText>
        <StyledListItemText>{SUBSCRIPTION_USAGE_RECORD[usage].totalActiveUsers} Active users</StyledListItemText>
        <StyledListItemText>Billed {period === 'annual' ? 'annually' : 'monthly'}</StyledListItemText>
      </StyledList>
      <Stack gap={1} display='flex' flexDirection='row'>
        <Button
          onClick={createSubscription}
          sx={{ width: 'fit-content' }}
          loading={isProcessing}
          disabled={cardError || !cardComplete || cardEmpty || isProcessing || !stripe || !elements || !space}
        >
          {isProcessing ? 'Processing ... ' : 'Upgrade'}
        </Button>
        <Button onClick={onCancel} sx={{ width: 'fit-content' }} color='secondary' variant='outlined'>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}
