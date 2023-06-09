import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import {
  Divider,
  Drawer,
  IconButton,
  InputLabel,
  List,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/system';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
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
import { SUBSCRIPTION_PRODUCTS_RECORD } from 'lib/subscription/constants';
import type { SubscriptionProductId, SubscriptionPeriod } from 'lib/subscription/constants';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { CreateSubscriptionRequest } from 'lib/subscription/interfaces';

import type { PaymentType } from './PaymentTabs';
import PaymentTabs, { PaymentTabPanel } from './PaymentTabs';
import { PlanSelection } from './PlanSelection';

const StyledList = styled(List)`
  list-style-type: disc;
  padding-inline-start: 40px;
`;

const StyledListItemText = styled(ListItemText)`
  display: list-item;
`;

const schema = () => {
  return yup
    .object({
      billingEmail: yup.string().email().required()
    })
    .strict();
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
    watch,
    formState: { errors }
  } = useForm<{ billingEmail: string }>({
    mode: 'onChange',
    defaultValues: {
      billingEmail: ''
    },
    resolver: yupResolver(schema())
  });

  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [cryptoDrawerOpen, setCryptoDrawerOpen] = useState(false);

  const billingEmail = watch('billingEmail');

  const space = useCurrentSpace();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const [period, setPeriod] = useState<SubscriptionPeriod>('monthly');
  const [productId, setProductId] = useState<SubscriptionProductId>('community_5k');

  const {
    data: checkoutUrl,
    trigger: createCryptoSubscription,
    isMutating: isLoadingCreateSubscriptionIntent
  } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription-intent`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateSubscriptionRequest } }>) =>
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

  const changePaymentType = (event: SyntheticEvent, newValue: PaymentType) => {
    setPaymentType(newValue);
  };

  useEffect(() => {
    if (spaceSubscription) {
      setPeriod(spaceSubscription.period);
      setProductId(spaceSubscription.productId);
    }
  }, [spaceSubscription]);

  const cardError = errors.billingEmail || billingEmail.length === 0;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements?.getElement(CardElement);

    if (!cardElement) {
      return;
    }

    const paymentDetails = getValues();

    const paymentErrorMetadata = {
      spaceId: space.id,
      period,
      billingEmail: paymentDetails.billingEmail
    };
    try {
      setIsProcessing(true);
      const { clientSecret, paymentIntentStatus } = await charmClient.subscription.createSubscription(space.id, {
        period,
        productId,
        billingEmail: paymentDetails.billingEmail
      });

      if (clientSecret && paymentIntentStatus) {
        if (paymentIntentStatus !== 'succeeded') {
          const { error: confirmCardPaymentError } = await stripe.confirmCardPayment(clientSecret, {
            receipt_email: paymentDetails.billingEmail,
            payment_method: {
              card: cardElement
            }
          });
          if (confirmCardPaymentError) {
            showMessage('Payment failed! Please try again', 'error');
            log.error(`[stripe]: Failed to confirm card payment. ${confirmCardPaymentError.message}`, {
              ...paymentErrorMetadata,
              errorType: confirmCardPaymentError.type,
              errorCode: confirmCardPaymentError.code
            });
          } else {
            showMessage('Payment successful! Community subscription active.', 'success');
          }
        } else {
          showMessage('Payment successful! Community subscription active.', 'success');
        }
      }
    } catch (error: any) {
      showMessage('Payment failed! Please try again', 'error');
      log.error(`[stripe]: Payment failed. ${error.message}`, {
        ...paymentErrorMetadata,
        errorType: error.type,
        errorCode: error.code
      });
    }

    setIsProcessing(false);
    await refetch();
    onCancel();
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
        period,
        productId,
        billingEmail: paymentDetails.billingEmail
      }
    });
  };

  const handlePlanSelect = (_productId: SubscriptionProductId | null, _period: SubscriptionPeriod | null) => {
    if (_productId) {
      setProductId(_productId);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  return (
    <Stack onSubmit={createSubscription} gap={1}>
      <PlanSelection disabled={isProcessing} onSelect={handlePlanSelect} productId={productId} period={period} />
      <Divider sx={{ mb: 1 }} />
      <Stack>
        <Typography variant='h6' mb={1}>
          Billing Information
        </Typography>
        <Stack gap={0.5} my={2}>
          <InputLabel>Email</InputLabel>
          <TextField disabled={isProcessing} placeholder='johndoe@gmail.com' {...register('billingEmail')} />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <Typography variant='h6'>Payment method</Typography>
      <PaymentTabs value={paymentType} onChange={changePaymentType} />
      <PaymentTabPanel value={paymentType} index='card'>
        <CardElement />
      </PaymentTabPanel>
      <PaymentTabPanel value={paymentType} index='crypto'>
        <Typography mb={1}>
          We accept crypto payments through our partner Loop. After you click Upgrade a popup will appear with
          instructions on finishing your payment.
        </Typography>
      </PaymentTabPanel>
      <Divider sx={{ mb: 1 }} />
      <Typography variant='h6'>Order Summary</Typography>
      <Typography>Paid plan: ${SUBSCRIPTION_PRODUCTS_RECORD[productId].pricing[period]}/mo</Typography>
      <StyledList>
        <StyledListItemText>{SUBSCRIPTION_PRODUCTS_RECORD[productId].blockLimit} blocks</StyledListItemText>
        <StyledListItemText>
          {SUBSCRIPTION_PRODUCTS_RECORD[productId].monthlyActiveUserLimit} Active users
        </StyledListItemText>
        <StyledListItemText>Billed {period === 'annual' ? 'annually' : 'monthly'}</StyledListItemText>
      </StyledList>

      <PaymentTabPanel value={paymentType} index='card'>
        <Stack gap={1} display='flex' flexDirection='row'>
          <Button
            onClick={createSubscription}
            sx={{ width: 'fit-content' }}
            loading={isProcessing}
            disabled={cardError || !billingEmail || isProcessing || !stripe || !elements || !space}
          >
            {isProcessing ? 'Processing ... ' : 'Upgrade'}
          </Button>
          <Button
            disabled={isProcessing}
            onClick={onCancel}
            sx={{ width: 'fit-content' }}
            color='secondary'
            variant='outlined'
          >
            Cancel
          </Button>
        </Stack>
      </PaymentTabPanel>
      <PaymentTabPanel value={paymentType} index='crypto'>
        <Stack gap={1} display='flex' flexDirection='row'>
          <Button onClick={() => startCryptoPayment()} disabled={!billingEmail}>
            Upgrade
          </Button>
          <Button
            disabled={isProcessing}
            onClick={onCancel}
            sx={{ width: 'fit-content' }}
            color='secondary'
            variant='outlined'
          >
            Cancel
          </Button>
        </Stack>
        <Drawer
          anchor='right'
          open={cryptoDrawerOpen}
          onClose={() => setCryptoDrawerOpen(false)}
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
            onClick={() => setCryptoDrawerOpen(false)}
            size='small'
            sx={{ position: 'absolute', right: 5, top: 10, zIndex: 1 }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
          {checkoutUrl && <Iframe loading='lazy' url={checkoutUrl} position='relative' width='100%' height='100%' />}
          {isLoadingCreateSubscriptionIntent && (
            <LoadingComponent height='100%' isLoading={isLoadingCreateSubscriptionIntent} />
          )}
        </Drawer>
      </PaymentTabPanel>
    </Stack>
  );
}
