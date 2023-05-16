import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, FormControlLabel, List, ListItemText, TextField, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import { Box, Stack, styled } from '@mui/system';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementChangeEvent } from '@stripe/stripe-js';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { KeyedMutator } from 'swr';
import * as yup from 'yup';

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
import type { PaymentDetails } from 'lib/subscription/createProSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

const StyledList = styled(List)`
  list-style-type: disc;
  padding-inline-start: 40px;
`;

const StyledListItemText = styled(ListItemText)`
  display: list-item;
`;

const StyledCardElementContainer = styled(Box)`
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  border: 1px solid var(--input-border);
  border-radius: 4px;
  &:hover {
    border: ${({ theme }) => `1px solid ${theme.palette.text.primary}`};
  }
  background-color: var(--input-bg);
`;

const schema = () => {
  return yup.object({
    billingEmail: yup.string().email().required(),
    streetAddress: yup.string(),
    fullName: yup.string().required()
  });
};

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

  const {
    register,
    getValues,
    formState: { errors, isValid }
  } = useForm<PaymentDetails>({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      billingEmail: '',
      streetAddress: ''
    },
    resolver: yupResolver(schema())
  });

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

  const cardError =
    cardEvent.cardNumber?.error ||
    cardEvent.cvc?.error ||
    cardEvent.expiry?.error ||
    errors.billingEmail ||
    errors.fullName;
  const cardComplete =
    cardEvent.cardNumber?.complete && cardEvent.cvc?.complete && cardEvent.expiry?.complete && isValid;

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
        const paymentDetails = getValues();
        const { clientSecret, paymentIntentStatus } = await charmClient.subscription.createSubscription({
          spaceId: space.id,
          paymentMethodId: paymentMethod.paymentMethod.id,
          period,
          usage,
          fullName: paymentDetails.fullName,
          billingEmail: paymentDetails.billingEmail,
          streetAddress: paymentDetails.streetAddress
        });

        if (clientSecret) {
          if (paymentIntentStatus !== 'succeeded') {
            const { error } = await stripe.confirmCardPayment(clientSecret, {
              payment_method: paymentMethod.paymentMethod.id
            });
            if (error) {
              showMessage('Payment failed! Please try again', 'error');
            } else {
              showMessage('Payment successful! Community subscription active.', 'success');
            }
          } else {
            showMessage('Payment successful! Community subscription active.', 'success');
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
          <StyledCardElementContainer>
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
          </StyledCardElementContainer>
        </Stack>
        <Stack gap={0.5} flexGrow={0.25}>
          <InputLabel>Expiry Date</InputLabel>
          <StyledCardElementContainer>
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
          </StyledCardElementContainer>
        </Stack>
        <Stack gap={0.5} flexGrow={0.25}>
          <InputLabel>CVC</InputLabel>
          <StyledCardElementContainer>
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
          </StyledCardElementContainer>
        </Stack>
      </Stack>
      <Stack display='flex' flexDirection='row' gap={1}>
        <Stack gap={0.5} flexGrow={1}>
          <InputLabel>Full Name</InputLabel>
          <TextField disabled={isProcessing} {...register('fullName')} />
        </Stack>
        <Stack gap={0.5} flexGrow={1}>
          <InputLabel>Billing Email</InputLabel>
          <TextField disabled={isProcessing} {...register('billingEmail')} />
        </Stack>
      </Stack>
      <Stack gap={0.5}>
        <InputLabel>Street Address</InputLabel>
        <TextField disabled={isProcessing} {...register('streetAddress')} />
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
          disabled={cardError || !cardComplete || isProcessing || !stripe || !elements || !space}
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
