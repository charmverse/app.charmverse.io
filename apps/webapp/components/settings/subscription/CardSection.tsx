import { useTheme } from '@emotion/react';
import { InputLabel, Stack, Typography } from '@mui/material';
import { CardCvcElement, CardExpiryElement, CardNumberElement } from '@stripe/react-stripe-js';
import type {
  StripeCardCvcElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardNumberElementChangeEvent
} from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

import { CardElementContainer } from './CardElementContainer';

export function CardSection({
  disabled,
  handleCardDetails
}: {
  disabled: boolean;
  handleCardDetails: (disabled: boolean) => void;
}) {
  const theme = useTheme();

  const [cardEvent, setCardEvent] = useState<{
    cardNumber: StripeCardNumberElementChangeEvent | null;
    cvc: StripeCardCvcElementChangeEvent | null;
    expiry: StripeCardExpiryElementChangeEvent | null;
  }>({
    expiry: null,
    cvc: null,
    cardNumber: null
  });

  const cardError = cardEvent.cardNumber?.error || cardEvent.cvc?.error || cardEvent.expiry?.error;
  const cardComplete = cardEvent.cardNumber?.complete && cardEvent.cvc?.complete && cardEvent.expiry?.complete;

  useEffect(() => {
    if (cardComplete && !cardError) {
      handleCardDetails(false);
    } else {
      handleCardDetails(true);
    }
  }, [cardComplete, cardError]);

  const onChange = (
    event: StripeCardNumberElementChangeEvent | StripeCardCvcElementChangeEvent | StripeCardExpiryElementChangeEvent
  ) => {
    if (event.elementType === 'cardNumber') {
      setCardEvent((prev) => ({ ...prev, cardNumber: event }));
    }
    if (event.elementType === 'cardExpiry') {
      setCardEvent((prev) => ({ ...prev, expiry: event }));
    }
    if (event.elementType === 'cardCvc') {
      setCardEvent((prev) => ({ ...prev, cvc: event }));
    }
  };

  return (
    <Stack display='flex' mb={1} flexDirection='row' flexWrap='wrap' gap={1}>
      <Stack flex='1 1 auto' width='100%'>
        <InputLabel sx={{ mb: 1, color: theme.palette.text.primary }}>Card number</InputLabel>
        <CardElementContainer error={!!cardEvent.cardNumber?.error}>
          <CardNumberElement
            options={{
              disabled,
              showIcon: true,
              placeholder: '1234 1234 1234 1234',
              style: {
                base: {
                  color: theme.palette.text.primary
                }
              }
            }}
            onChange={onChange}
          />
        </CardElementContainer>
      </Stack>
      <Stack flexGrow={1}>
        <InputLabel sx={{ mb: 1, color: theme.palette.text.primary }}>Expiry Date</InputLabel>
        <CardElementContainer error={!!cardEvent.expiry?.error}>
          <CardExpiryElement
            options={{
              disabled,
              placeholder: '10 / 25',
              style: {
                base: {
                  color: theme.palette.text.primary
                }
              }
            }}
            onChange={onChange}
          />
        </CardElementContainer>
      </Stack>
      <Stack sx={{ mb: 1 }} flexGrow={1}>
        <InputLabel sx={{ mb: 1, color: theme.palette.text.primary }}>CVC</InputLabel>
        <CardElementContainer error={!!cardEvent.cvc?.error}>
          <CardCvcElement
            options={{
              disabled,
              placeholder: '123',
              style: {
                base: {
                  color: theme.palette.text.primary
                }
              }
            }}
            onChange={onChange}
          />
        </CardElementContainer>
      </Stack>
      <Stack flexGrow={1}>
        <Typography variant='body2' color={theme.palette.text.secondary}>
          By providing your card information, you allow CharmVerse to charge your card for future payments in accordance
          with their terms.
        </Typography>
      </Stack>
    </Stack>
  );
}
