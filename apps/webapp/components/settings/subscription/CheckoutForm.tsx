import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import { Divider, Drawer, Grid, IconButton, InputLabel, Stack, TextField, Typography } from '@mui/material';
import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';
import { communityProduct, loopCheckoutUrl } from '@packages/lib/subscription/constants';
import type { CreateProSubscriptionRequest, SubscriptionPaymentIntent } from '@packages/lib/subscription/interfaces';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

import { CardSection } from './CardSection';
import { OrderSummary } from './OrderSummary';

const schema = yup
  .object({
    coupon: yup.string().optional(),
    email: yup.string().required('Email is required').email('Invalid email address')
  })
  .strict();

type FormValues = yup.InferType<typeof schema>;

export function CheckoutForm({
  onCloseCheckout,
  handlePending,
  handleCreateSubscription,
  space,
  period,
  blockQuota
}: {
  space: Space;
  blockQuota: number;
  period: SubscriptionPeriod;
  onCloseCheckout: VoidFunction;
  handlePending: VoidFunction;
  handleCreateSubscription: (args: { spaceId: string; payload: CreateProSubscriptionRequest }) => Promise<
    | (SubscriptionPaymentIntent & {
        email?: string;
      })
    | undefined
  >;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      coupon: '',
      email: ''
    },
    resolver: yupResolver(schema)
  });

  const couponField = watch('coupon');
  const emailField = watch('email');
  useTrackPageView({ type: 'billing/checkout' });

  const [cryptoDrawerOpen, setCryptoDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDisabled, setCardDisabled] = useState(true);

  const { showMessage } = useSnackbar();

  const {
    trigger: validateCoupon,
    data: couponData,
    isMutating: isValidationLoading
  } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: { coupon: string } } }>) =>
      charmClient.subscription.validateDiscount(arg.spaceId, arg.payload),
    {
      onSuccess(data) {
        setValue('coupon', data === null ? '' : data.code);
      },
      onError() {
        showMessage('Your coupon is not valid', 'error');
        setValue('coupon', '');
      }
    }
  );

  const handleCoupon = async (coupon?: string) => {
    await validateCoupon({
      spaceId: space.id,
      payload: { coupon: coupon ?? '' }
    });
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== loopCheckoutUrl) {
        return;
      }

      if (event?.type === 'message' && event?.data === 'CheckoutComplete') {
        showMessage(
          'Payment successful! Please revisit this page in a few minutes to see your new account details.',
          'success'
        );
        onCloseCheckout();
        handlePending();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    const paymentErrorMetadata = {
      spaceId: space.id,
      period,
      email: emailField
    };

    try {
      const { error } = await elements.submit();
      const cardNumber = elements.getElement(CardNumberElement);
      const cardExpiry = elements.getElement(CardExpiryElement);
      const cardCvc = elements.getElement(CardCvcElement);
      const cardError = cardDisabled || !cardNumber || !cardExpiry || !cardCvc;

      if (error || !emailField || !!errors.email || !!errors.coupon || cardError) {
        return;
      }

      setIsProcessing(true);

      const subscription = await handleCreateSubscription({
        spaceId: space.id,
        payload: {
          billingEmail: emailField,
          blockQuota,
          period,
          name: space.name,
          coupon: couponData?.code || undefined
        }
      });

      if (!subscription) {
        return;
      }

      const { error: confirmCardError } = await stripe.confirmCardPayment(subscription.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: space.name,
            email: emailField
          }
        },
        receipt_email: emailField,
        return_url: `${window?.location.origin}?settingTab=subscription`
      });

      if (confirmCardError) {
        showMessage('Payment failed! Please try again', 'error');
        log.error(`[stripe]: Failed to confirm payment. ${confirmCardError.message}`, {
          ...paymentErrorMetadata,
          errorType: confirmCardError.type,
          errorCode: confirmCardError.code
        });
      } else {
        showMessage('Payment successful! Community subscription active.', 'success');
        handlePending();
      }
      onCloseCheckout();
    } catch (error: any) {
      showMessage('Payment failed! Please try again', 'error');
      log.error(`[stripe]: Payment failed. ${error.message}`, {
        ...paymentErrorMetadata,
        errorType: error.type,
        errorCode: error.code
      });
      onCloseCheckout();
    }

    setIsProcessing(false);
  };

  const handleCardDetails = (disabled: boolean) => {
    setCardDisabled(disabled);
  };

  const price = period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  const disableUpgradeButton =
    !!errors.coupon ||
    !emailField ||
    !!errors.email ||
    !stripe ||
    !elements ||
    isValidationLoading ||
    isProcessing ||
    cardDisabled;

  return (
    <>
      <Divider sx={{ mb: 1 }} />
      <Grid container gap={2} sx={{ flexWrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={8} onSubmit={createSubscription}>
          <Stack gap={0.5} mt={2}>
            <InputLabel sx={{ color: (theme) => theme.palette.text.primary }}>Email (required)</InputLabel>
            <TextField
              {...register('email')}
              placeholder='johndoe@gmail.com'
              disabled={isValidationLoading}
              InputProps={{
                sx: {
                  boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02)',
                  backgroundColor: 'transparent'
                }
              }}
            />
          </Stack>
          <CardSection disabled={isProcessing} handleCardDetails={handleCardDetails} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OrderSummary
            discount={couponData}
            blockQuota={blockQuota}
            price={price}
            period={period}
            isLoading={isProcessing}
            disabledButton={disableUpgradeButton}
            handleCheckout={createSubscription}
            handleCancelCheckout={onCloseCheckout}
          >
            <Typography>Coupon code</Typography>
            <Stack display='flex' flexDirection='row' gap={1}>
              <TextField {...register('coupon')} disabled={isProcessing || !!couponData || isValidationLoading} />
              <Button
                onClick={() => (couponData ? handleCoupon('') : handleCoupon(couponField))}
                disabled={isProcessing || !couponField || isValidationLoading}
              >
                {couponData ? 'Remove' : 'Apply'}
              </Button>
            </Stack>
          </OrderSummary>
        </Grid>
      </Grid>
      <Drawer
        anchor='right'
        open={cryptoDrawerOpen}
        onClose={() => {
          setCryptoDrawerOpen(false);
          onCloseCheckout();
        }}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: '600px'
            }
          }
        }}
      >
        <IconButton
          onClick={() => {
            setCryptoDrawerOpen(false);
            onCloseCheckout();
          }}
          size='small'
          sx={{ position: 'absolute', right: 5, top: 10, zIndex: 1 }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      </Drawer>
    </>
  );
}
