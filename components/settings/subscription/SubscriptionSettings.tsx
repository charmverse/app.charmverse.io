import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, InputLabel, Stack, TextField, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { CreateProSubscriptionRequest } from 'lib/subscription/interfaces';

import Legend from '../Legend';

import { CheckoutForm } from './CheckoutForm';
import { CreateSubscriptionInformation } from './CreateSubscriptionInformation';
import { EnterpriseBillingScreen } from './EnterpriseBillingScreen';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { LoadingSubscriptionSkeleton } from './LoadingSkeleton';
import { loadStripe } from './loadStripe';
import { PlanSelection } from './PlanSelection';
import { SubscriptionInformation } from './SubscriptionInformation';

const schema = () => {
  return yup
    .object({
      email: yup.string().email().required(),
      coupon: yup.string().optional()
    })
    .strict();
};

export function SubscriptionSettings({ space }: { space: Space }) {
  const { showMessage } = useSnackbar();

  const { spaceSubscription, isLoading: isLoadingSpaceSubscription, refetchSpaceSubscription } = useSpaceSubscription();

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const {
    register,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<{ email: string; coupon: string }>({
    defaultValues: {
      email: '',
      coupon: ''
    },
    resolver: yupResolver(schema())
  });

  const {
    data: initialSubscriptionData,
    trigger: createSubscription,
    isMutating: isInitialSubscriptionLoading
  } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateProSubscriptionRequest } }>) =>
      charmClient.subscription.createSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Checkout failed! Please try again', 'error');
      },
      async onSuccess(data) {
        setShowCheckoutForm(true);
        setValue('coupon', data.coupon || '');
        setValue('email', data.email || '');
      }
    }
  );

  const emailField = watch('email');
  const couponField = watch('coupon');

  const { trigger: validateCoupon, isMutating: isValidationLoading } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: { coupon: string } } }>) =>
      charmClient.subscription.validateDiscount(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Your coupon is not valid', 'error');
        setValue('coupon', '');
      }
    }
  );

  const { data: blockCountData } = useSWR(space.id ? `space-block-count-${space.id}` : null, () =>
    charmClient.spaces.getBlockCount({ spaceId: space.id })
  );

  const blockCount = blockCountData?.count || 0;

  const minimumBlockQuota = blockCount > 10000 ? Math.ceil(blockCount / 10000) * 10 : 10;

  const [period, setPeriod] = useState<SubscriptionPeriod>('annual');
  const [blockQuota, setBlockQuota] = useState(10);

  // useLayoutEffect(() => {
  //   reset({ email: initialSubscriptionData?.email || '', coupon: initialSubscriptionData?.coupon || '' });
  // }, [initialSubscriptionData?.coupon, initialSubscriptionData?.email, isInitialSubscriptionLoading]);

  useEffect(() => {
    charmClient.track.trackAction('view_subscription', {
      spaceId: space.id
    });
  }, []);

  async function handleShowCheckoutForm() {
    if (minimumBlockQuota > blockQuota) {
      setBlockQuota(minimumBlockQuota);
    }

    setShowCheckoutForm(true);
    charmClient.track.trackAction('initiate_subscription', {
      spaceId: space.id
    });

    await createSubscription({
      spaceId: space.id,
      payload: {
        period,
        blockQuota: minimumBlockQuota > blockQuota ? minimumBlockQuota : blockQuota,
        billingEmail: emailField
      }
    });
  }

  const handlePlanSelect = (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      setBlockQuota(minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  const handlePlanSelectCommited = async (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      await createSubscription({
        spaceId: space.id,
        payload: {
          blockQuota: minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota,
          period,
          billingEmail: emailField,
          coupon: couponField
        }
      });
    } else if (_period) {
      await createSubscription({
        spaceId: space.id,
        payload: { blockQuota, period: _period, billingEmail: emailField, coupon: couponField }
      });
    }
  };

  const handleCoupon = async (coupon: string | undefined) => {
    if (coupon) {
      await validateCoupon({
        spaceId: space.id,
        payload: { coupon }
      });
    }

    await createSubscription({
      spaceId: space.id,
      payload: { blockQuota, period, coupon, billingEmail: emailField }
    });
  };

  const theme = useTheme();

  const stripePromise = loadStripe();

  if (space.paidTier === 'enterprise') {
    return <EnterpriseBillingScreen />;
  }

  if (!showCheckoutForm) {
    return (
      <Stack gap={1}>
        {isLoadingSpaceSubscription ? (
          <LoadingSubscriptionSkeleton isLoading={isLoadingSpaceSubscription} />
        ) : spaceSubscription && spaceSubscription.status !== 'free_trial' ? (
          <SubscriptionInformation
            space={space}
            spaceSubscription={spaceSubscription}
            refetchSpaceSubscription={refetchSpaceSubscription}
          />
        ) : (
          <CreateSubscriptionInformation onClick={handleShowCheckoutForm} spaceSubscription={spaceSubscription} />
        )}
      </Stack>
    );
  }
  const isLoading = isValidationLoading || isInitialSubscriptionLoading || isLoadingSpaceSubscription;

  return (
    <Stack gap={1}>
      <Legend>Upgrade to Community</Legend>
      <Typography variant='h6'>Onboard & Engage Community Members</Typography>
      <Typography>Comprehensive access control, roles, guests, custom domain, API access and more.</Typography>
      {!!blockCountData && (
        <PlanSelection
          disabled={isInitialSubscriptionLoading}
          onSelect={handlePlanSelect}
          onSelectCommited={handlePlanSelectCommited}
          blockQuotaInThousands={blockQuota}
          period={period}
        />
      )}
      <Stack maxWidth='400px'>
        <Typography variant='h6' mb={1}>
          Billing Information
        </Typography>
        <Stack gap={0.5} my={2}>
          <InputLabel>Email (required)</InputLabel>
          <TextField
            {...register('email')}
            placeholder='johndoe@gmail.com'
            error={!!errors.email}
            disabled={isLoading}
          />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <LoadingComponent isLoading={isLoading} />
      {!isLoading && spaceSubscription !== undefined && initialSubscriptionData?.clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: initialSubscriptionData.clientSecret,
            appearance: {
              theme: theme.palette.mode === 'dark' ? 'night' : 'stripe'
            }
          }}
        >
          <CheckoutForm
            emailField={emailField}
            couponField={couponField}
            space={space}
            blockQuota={blockQuota}
            period={period}
            subscription={initialSubscriptionData}
            handleCoupon={handleCoupon}
            onCancel={() => setShowCheckoutForm(false)}
            errors={errors}
            registerCoupon={{ ...register('coupon') }}
          />
        </Elements>
      )}
    </Stack>
  );
}
