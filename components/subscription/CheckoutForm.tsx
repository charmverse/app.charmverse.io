import { useTheme } from '@emotion/react';
import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItemText,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/system';
import {
  AddressElement,
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import type { StripeAddressElementChangeEvent, StripeElementChangeEvent } from '@stripe/stripe-js';
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
import { SUBSCRIPTION_PRODUCTS_RECORD, SUBSCRIPTION_PRODUCT_IDS } from 'lib/subscription/constants';
import type { SubscriptionProductId, SubscriptionPeriod } from 'lib/subscription/constants';
import type { CreateCryptoSubscriptionRequest } from 'lib/subscription/createCryptoSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

import type { PaymentType } from './PaymentTabs';
import PaymentTabs, { PaymentTabPanel } from './PaymentTabs';

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
  const [cardEvent, setCardEvent] = useState<{
    cardNumber: StripeElementChangeEvent | null;
    cvc: StripeElementChangeEvent | null;
    expiry: StripeElementChangeEvent | null;
    address: StripeAddressElementChangeEvent | null;
  }>({
    address: null,
    expiry: null,
    cvc: null,
    cardNumber: null
  });

  const {
    data: subscriptionData,
    trigger: createCryptoSubscription,
    isMutating: isLoadingCreateSubscriptionIntent
  } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription-intent`,
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

  const changePaymentType = (event: SyntheticEvent, newValue: PaymentType) => {
    setPaymentType(newValue);
  };

  useEffect(() => {
    if (spaceSubscription) {
      setPeriod(spaceSubscription.period);
      setProductId(spaceSubscription.productId);
    }
  }, [spaceSubscription]);

  const cardError =
    cardEvent.cardNumber?.error ||
    cardEvent.cvc?.error ||
    cardEvent.expiry?.error ||
    errors.billingEmail ||
    billingEmail.length === 0;

  const cardComplete =
    cardEvent.cardNumber?.complete &&
    cardEvent.cvc?.complete &&
    cardEvent.expiry?.complete &&
    cardEvent.address?.complete;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardNumberElement = elements?.getElement('cardNumber');
    const cardAddressElement = elements?.getElement('address');

    if (!cardNumberElement || !cardAddressElement) {
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
      const { error: createPaymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        billing_details: {
          email: paymentDetails.billingEmail,
          address: cardEvent.address
            ? {
                ...cardEvent.address.value.address,
                line2: cardEvent.address.value.address.line2 ?? undefined
              }
            : undefined,
          name: cardEvent.address?.value.name,
          phone: cardEvent.address?.value.phone
        },
        card: cardNumberElement,
        type: 'card'
      });

      if (createPaymentMethodError) {
        log.error(`[stripe]: Failed to create payment method. ${createPaymentMethodError.message}`, {
          ...paymentErrorMetadata,
          errorType: createPaymentMethodError.type,
          errorCode: createPaymentMethodError.code
        });
      } else if (paymentMethod) {
        const { clientSecret, paymentIntentStatus, subscriptionId } = await charmClient.subscription.createSubscription(
          space.id,
          {
            paymentMethodId: paymentMethod.id,
            period,
            productId,
            billingEmail: paymentDetails.billingEmail
          }
        );

        if (clientSecret && subscriptionId && paymentIntentStatus) {
          if (paymentIntentStatus !== 'succeeded') {
            const { error: confirmCardPaymentError } = await stripe.confirmCardPayment(clientSecret, {
              receipt_email: paymentDetails.billingEmail,
              payment_method: paymentMethod.id
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
        billingEmail: paymentDetails.billingEmail,
        address: cardEvent.address
          ? {
              ...cardEvent.address.value.address,
              line2: cardEvent.address.value.address.line2 ?? undefined
            }
          : undefined,
        name: cardEvent.address?.value.name
      }
    });
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
            aria-label='Product Id'
            valueLabelDisplay='off'
            value={SUBSCRIPTION_PRODUCT_IDS.indexOf(productId)}
            marks={SUBSCRIPTION_PRODUCT_IDS.map((_productId, index) => ({
              value: index,
              label: `$${SUBSCRIPTION_PRODUCTS_RECORD[_productId].pricing[period]}/${period === 'annual' ? 'yr' : 'mo'}`
            }))}
            min={0}
            max={SUBSCRIPTION_PRODUCT_IDS.length - 1}
            onChange={(_, value) => {
              setProductId(SUBSCRIPTION_PRODUCT_IDS[value as number]);
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
      <Divider sx={{ mb: 1 }} />
      <Stack>
        <Typography variant='h6' mb={1}>
          Billing Information
        </Typography>
        <AddressElement
          options={{
            mode: 'billing',
            defaultValues: {
              address: {
                country: 'US'
              }
            }
          }}
          onChange={(e) =>
            setCardEvent({
              ...cardEvent,
              address: e
            })
          }
        />
        <Stack gap={0.5} my={2}>
          <InputLabel>Billing Email</InputLabel>
          <TextField disabled={isProcessing} placeholder='johndoe@gmail.com' {...register('billingEmail')} />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <Typography variant='h6'>Payment method</Typography>
      <PaymentTabs value={paymentType} onChange={changePaymentType} />
      <PaymentTabPanel value={paymentType} index='card'>
        <Stack display='flex' mb={1} flexDirection='row' gap={1}>
          <Stack gap={0.5} flexGrow={1}>
            <InputLabel>Card number</InputLabel>
            <StyledCardElementContainer>
              <CardNumberElement
                options={{
                  disabled: isProcessing,
                  placeholder: '4242 4242 4242 4242',
                  style: {
                    base: {
                      color: theme.palette.text.primary
                    }
                  }
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
                  placeholder: '10 / 25',
                  style: {
                    base: {
                      color: theme.palette.text.primary
                    }
                  }
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
                  placeholder: '1234',
                  style: {
                    base: {
                      color: theme.palette.text.primary
                    }
                  }
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
            disabled={cardError || !cardComplete || isProcessing || !stripe || !elements || !space}
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
          <Button onClick={() => startCryptoPayment()} disabled={!cardEvent.address?.complete}>
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
                sm: '400px'
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
          {subscriptionData && (
            <Iframe
              loading='lazy'
              url={`${subscriptionData}?embed=true&cartEnabled=false`}
              position='relative'
              width='100%'
              height='100%'
            />
          )}
          {isLoadingCreateSubscriptionIntent && (
            <LoadingComponent height='100%' isLoading={isLoadingCreateSubscriptionIntent} />
          )}
        </Drawer>
      </PaymentTabPanel>
    </Stack>
  );
}
