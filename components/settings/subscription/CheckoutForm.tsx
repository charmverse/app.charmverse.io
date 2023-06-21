import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import { Divider, Drawer, Grid, IconButton, InputLabel, Stack, TextField, Typography } from '@mui/material';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import log from 'loglevel';
import type { FormEvent, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Iframe from 'react-iframe';
import type { KeyedMutator } from 'swr';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { communityProduct, loopCheckoutUrl } from 'lib/subscription/constants';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { CreateCryptoSubscriptionRequest } from 'lib/subscription/interfaces';

import type { PaymentType } from './PaymentTabs';
import PaymentTabs, { PaymentTabPanel } from './PaymentTabs';

const schema = () => {
  return yup
    .object({
      email: yup.string().email().required()
    })
    .strict();
};

export function CheckoutForm({
  onCancel,
  refetch,
  show,
  period,
  blockQuota,
  subscriptionId
}: {
  show: boolean;
  blockQuota: number;
  period: SubscriptionPeriod;
  subscriptionId: string;
  onCancel: VoidFunction;
  refetch: KeyedMutator<SpaceSubscription | null>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    getValues,
    watch,
    formState: { errors }
  } = useForm<{ email: string }>({
    mode: 'onChange',
    defaultValues: {
      email: ''
    },
    resolver: yupResolver(schema())
  });

  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [cryptoDrawerOpen, setCryptoDrawerOpen] = useState(false);

  const email = watch('email');

  const { space } = useCurrentSpace();
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
      },
      async onSuccess() {
        await refetch();
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

  const emailError = errors.email || email.length === 0;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const paymentDetails = getValues();

    const paymentErrorMetadata = {
      spaceId: space.id,
      period,
      email: paymentDetails.email
    };

    try {
      const { error } = await elements.submit();

      if (error) {
        return;
      }

      setIsProcessing(true);
      // @TODO update billing email
      const { error: confirmPaymentError } = await stripe.confirmPayment({
        elements,
        // There are some paym,ent methods that require the user to open another page and then redirect back to the app
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.href}?subscription=true`,
          receipt_email: paymentDetails.email
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
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setCryptoDrawerOpen(true);

    const paymentDetails = getValues();
    await createCryptoSubscription({
      spaceId: space.id,
      payload: {
        subscriptionId,
        email: paymentDetails.email
      }
    });
    setPendingPayment(true);
  };

  return (
    <>
      {pendingPayment && (
        <Stack gap={1}>
          <Typography>Payment pending. Please revisit this page in a few minutes.</Typography>
        </Stack>
      )}

      {show && (
        <>
          <Stack maxWidth='400px'>
            <Typography variant='h6' mb={1}>
              Billing Information
            </Typography>
            <Stack gap={0.5} my={2}>
              <InputLabel>Email (required)</InputLabel>
              <TextField disabled={isProcessing} placeholder='johndoe@gmail.com' {...register('email')} />
            </Stack>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Grid container gap={2} sx={{ flexWrap: { sm: 'nowrap' } }}>
            <Grid item xs={12} sm={8} onSubmit={createSubscription}>
              <PaymentTabs value={paymentType} onChange={changePaymentType} />
              <PaymentTabPanel value={paymentType} index='card'>
                <PaymentElement />
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
                  <Typography>${(communityProduct.pricing[period] ?? 0) * blockQuota}/mo</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack display='flex' flexDirection='row' justifyContent='space-between'>
                <Stack>
                  <Typography>Total</Typography>
                </Stack>
                <Stack>
                  <Typography>${(communityProduct.pricing[period] ?? 0) * blockQuota}</Typography>
                </Stack>
              </Stack>
              <PaymentTabPanel value={paymentType} index='card'>
                <Stack gap={1} display='flex' flexDirection='column'>
                  <Button
                    onClick={createSubscription}
                    loading={isProcessing}
                    disabled={emailError || !email || isProcessing || !stripe || !elements || !space}
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
                  <Button onClick={() => startCryptoPayment()} disabled={!email}>
                    Upgrade
                  </Button>
                  <Button disabled={isProcessing} onClick={onCancel} color='secondary' variant='text'>
                    Cancel
                  </Button>
                </Stack>
              </PaymentTabPanel>
            </Grid>
          </Grid>
        </>
      )}
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
