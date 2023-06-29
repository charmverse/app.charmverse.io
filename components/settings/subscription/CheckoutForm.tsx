import type { Space } from '@charmverse/core/prisma-client';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { Divider, Drawer, Grid, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import log from 'loglevel';
import type { FormEvent, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';
import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import Iframe from 'react-iframe';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { isProdEnv } from 'config/constants';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { communityProduct, loopCheckoutUrl } from 'lib/subscription/constants';
import type { CreateCryptoSubscriptionRequest, SubscriptionPaymentIntent } from 'lib/subscription/interfaces';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';

import type { PaymentType } from './PaymentTabs';
import PaymentTabs, { PaymentTabPanel } from './PaymentTabs';

export function CheckoutForm({
  onCancel,
  handleCoupon,
  registerCoupon,
  errors,
  space,
  period,
  blockQuota,
  subscription,
  emailField,
  couponField
}: {
  emailField: string;
  couponField: string;
  space: Space;
  blockQuota: number;
  period: SubscriptionPeriod;
  subscription: SubscriptionPaymentIntent & { email?: string };
  errors: FieldErrors<{
    email: string;
    coupon: string;
  }>;
  registerCoupon: UseFormRegisterReturn<'coupon'>;
  onCancel: VoidFunction;
  handleCoupon: (coupon: string | undefined) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  // const {
  //   register,
  //   getValues,
  //   watch,
  //   formState: { errors }
  // } = useForm<{ email: string; coupon: string }>({
  //   mode: 'onChange',
  //   defaultValues: {
  //     email: subscription.email || '',
  //     coupon: subscription.coupon || ''
  //   },
  //   resolver: yupResolver(schema())
  // });

  useEffect(() => {
    charmClient.track.trackAction('page_view', {
      spaceId: space.id,
      type: 'billing/checkout'
    });
  }, []);

  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [cryptoDrawerOpen, setCryptoDrawerOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const [pendingPayment, setPendingPayment] = useState(false);

  const {
    data: checkoutUrl,
    trigger: createCryptoSubscription,
    isMutating: isLoadingCreateSubscriptionIntent
  } = useSWRMutation(
    `/api/spaces/${space?.id}/crypto-subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateCryptoSubscriptionRequest } }>) =>
      charmClient.subscription.createCryptoSubscription(arg.spaceId, arg.payload),
    {
      onError(error) {
        showMessage('Payment failed! Please try again', 'error');
        log.error(`[stripe]: Payment failed. ${error.message}`, {
          errorType: error.type,
          errorCode: error.code
        });
        setCryptoDrawerOpen(false);
      }
    }
  );

  const { trigger: updateSpaceSubscription } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      }
    }
  );

  const changePaymentType = (_event: SyntheticEvent, newValue: PaymentType) => {
    if (newValue !== null) {
      setPaymentType(newValue);
    }
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== loopCheckoutUrl) {
        return;
      }

      if (event?.type === 'message' && event?.data === 'CheckoutComplete') {
        setPendingPayment(true);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const emailError = emailField.length === 0;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const paymentErrorMetadata = {
      spaceId: space.id,
      period,
      email: emailField
    };

    try {
      const { error } = await elements.submit();

      if (error || !emailField || errors.email || errors.coupon) {
        return;
      }

      setIsProcessing(true);

      await updateSpaceSubscription({
        spaceId: space.id,
        payload: {
          billingEmail: emailField,
          subscriptionId: subscription.subscriptionId
        }
      });

      const { error: confirmPaymentError } = await stripe.confirmPayment({
        elements,
        // There are some payment methods that require the user to open another page and then redirect back to the app
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.href}?subscription=true`,
          receipt_email: emailField,
          payment_method_data: {
            billing_details: {
              email: emailField
            }
          }
        }
      });

      if (confirmPaymentError) {
        showMessage('Payment failed! Please try again', 'error');
        log.error(`[stripe]: Failed to confirm payment. ${confirmPaymentError.message}`, {
          ...paymentErrorMetadata,
          errorType: confirmPaymentError.type,
          errorCode: confirmPaymentError.code
        });
      } else {
        showMessage('Payment successful! Community subscription active.', 'success');
      }
      onCancel();
    } catch (error: any) {
      showMessage('Payment failed! Please try again', 'error');
      log.error(`[stripe]: Payment failed. ${error.message}`, {
        ...paymentErrorMetadata,
        errorType: error.type,
        errorCode: error.code
      });
      onCancel();
    }

    setIsProcessing(false);
  };

  const startCryptoPayment = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (!emailField || errors.email || errors.coupon) {
      return;
    }

    setCryptoDrawerOpen(true);
    await createCryptoSubscription({
      spaceId: space.id,
      payload: {
        subscriptionId: subscription.subscriptionId,
        email: emailField
      }
    });
    setPendingPayment(true);
  };

  const price = period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  return (
    <>
      {pendingPayment && (
        <Stack gap={1}>
          <Typography>Payment pending. Please revisit this page in a few minutes.</Typography>
        </Stack>
      )}
      <Grid container gap={2} sx={{ flexWrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={8} onSubmit={createSubscription}>
          {!isProdEnv && <PaymentTabs value={paymentType} onChange={changePaymentType} />}
          <PaymentTabPanel value={paymentType} index='card'>
            <PaymentElement options={{ paymentMethodOrder: ['card', 'us_bank_account'] }} />
          </PaymentTabPanel>
          <PaymentTabPanel value={paymentType} index='crypto'>
            <Typography mb={1}>
              We accept crypto payments through our partner Loop. After you click Upgrade a popup will appear with
              instructions on finishing your payment.
            </Typography>
          </PaymentTabPanel>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant='h6' mb={2}>
            Order Summary
          </Typography>
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography mb={1}>Community Edition</Typography>
              <Typography variant='body2'>Billed {period}</Typography>
            </Stack>
            <Stack>
              <Typography>${(price * blockQuota).toFixed(2)}/mo</Typography>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={0.5} my={2}>
            <Typography>Coupon code</Typography>
            <Stack>
              <TextField
                disabled={isProcessing || !!subscription.coupon}
                {...registerCoupon}
                error={!!errors.coupon}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={subscription?.coupon ? undefined : () => handleCoupon(couponField)}
                        disabled={!!(subscription?.coupon || !couponField)}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {subscription.totalPrice !== subscription.subTotalPrice && (
            <>
              <Stack display='flex' flexDirection='row' justifyContent='space-between'>
                <Stack>
                  <Typography>Subtotal</Typography>
                </Stack>
                <Stack>
                  <Typography>${(subscription.subTotalPrice || 0).toFixed(2)}</Typography>
                </Stack>
              </Stack>
              <Stack display='flex' flexDirection='row' justifyContent='space-between'>
                <Stack>
                  <Typography>Discount</Typography>
                </Stack>
                <Stack>
                  <Typography>${(subscription.subTotalPrice - subscription.totalPrice).toFixed(2)}</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
            </>
          )}
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography>Total</Typography>
            </Stack>
            <Stack>
              <Typography>${(subscription.totalPrice || 0).toFixed(2)}</Typography>
            </Stack>
          </Stack>
          <PaymentTabPanel value={paymentType} index='card'>
            <Stack gap={1} display='flex' flexDirection='column'>
              <Button
                onClick={createSubscription}
                loading={isProcessing}
                disabled={emailError || !emailField || isProcessing || !stripe || !elements}
              >
                {isProcessing ? 'Processing ... ' : 'Upgrade'}
              </Button>
              <Button disabled={isProcessing} onClick={onCancel} color='secondary' variant='text'>
                Cancel
              </Button>
            </Stack>
          </PaymentTabPanel>
          <PaymentTabPanel value={paymentType} index='crypto'>
            <Stack gap={1} display='flex' flexDirection='column'>
              <Button onClick={() => startCryptoPayment()} disabled={emailError || !emailField || isProcessing}>
                Upgrade
              </Button>
              <Button disabled={isProcessing} onClick={onCancel} color='secondary' variant='text'>
                Cancel
              </Button>
            </Stack>
          </PaymentTabPanel>
        </Grid>
      </Grid>
      <Drawer
        anchor='right'
        open={cryptoDrawerOpen}
        onClose={() => {
          setCryptoDrawerOpen(false);
          onCancel();
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
            onCancel();
          }}
          size='small'
          sx={{ position: 'absolute', right: 5, top: 10, zIndex: 1 }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
        {checkoutUrl && <Iframe loading='lazy' url={checkoutUrl} position='relative' width='100%' height='100%' />}
        <LoadingComponent height='100%' isLoading={isLoadingCreateSubscriptionIntent} />
      </Drawer>
    </>
  );
}
