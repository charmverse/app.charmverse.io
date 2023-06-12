import type { Space } from '@charmverse/core/src/prisma-client';
import Chip from '@mui/material/Chip';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import { LoadingSubscriptionSkeleton } from 'components/settings/subscription/LoadingSkeleton';
import { useMembers } from 'hooks/useMembers';
import { SUBSCRIPTION_PRODUCTS_RECORD } from 'lib/subscription/constants';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import { capitalize } from 'lib/utilities/strings';

export function SubscriptionInformation({
  space,
  spaceSubscription,
  isLoading
}: {
  space: Space;
  spaceSubscription?: SpaceSubscription | null;
  isLoading: boolean;
}) {
  const { members } = useMembers();

  if (spaceSubscription === undefined) {
    return null;
  }

  if (isLoading) {
    return <LoadingSubscriptionSkeleton isLoading={isLoading} />;
  }

  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
        {spaceSubscription === null ? 'Upgrade to Community' : 'Space subscription'}
      </Legend>
      <Typography>
        More blocks, user roles, guests, custom domains and more.{' '}
        <Link href='https://charmverse.io/pricing' target='_blank'>
          Read about all the benefits
        </Link>
      </Typography>
      <Stack>
        <InputLabel>Current tier</InputLabel>
        <Typography>{capitalize(space.paidTier)}</Typography>
      </Stack>
      {spaceSubscription?.period && (
        <Stack>
          <InputLabel>Period</InputLabel>
          <Typography>{capitalize(spaceSubscription.period)}</Typography>
        </Stack>
      )}
      {spaceSubscription?.productId && (
        <Stack>
          <InputLabel>Plan</InputLabel>
          <Stack>
            <Typography>Blocks: 0/{SUBSCRIPTION_PRODUCTS_RECORD[spaceSubscription.productId].blockLimit}</Typography>
            <Typography>
              Members: {members.length}/
              {SUBSCRIPTION_PRODUCTS_RECORD[spaceSubscription.productId].monthlyActiveUserLimit}
            </Typography>
          </Stack>
        </Stack>
      )}
    </>
  );
}
