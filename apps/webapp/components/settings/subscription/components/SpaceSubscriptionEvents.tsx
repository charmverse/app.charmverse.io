import { Box, capitalize, Stack, Typography } from '@mui/material';
import { formatDate } from '@packages/lib/utils/dates';
import { isDowngrade, tierConfig } from '@packages/subscriptions/constants';
import type {
  SubscriptionContributionEvent,
  SubscriptionEvent,
  SubscriptionPaymentEvent,
  SubscriptionTierChangeEvent
} from '@packages/subscriptions/getSubscriptionEvents';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import Image from 'next/image';
import { formatUnits } from 'viem';

import Avatar from 'components/common/Avatar';
import { useMembers } from 'hooks/useMembers';

function SubscriptionTierChangeEventRow({ event }: { event: SubscriptionTierChangeEvent }) {
  const { members } = useMembers();
  const user = members.find((member) => member.id === event.userId);
  const _isDowngrade = isDowngrade(event.previousTier, event.tier);

  return (
    <Stack key={event.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
      <Box display='flex' alignItems='center' gap={1}>
        <Avatar
          name={user?.username}
          avatar={user ? user?.avatar : 'https://app.charmverse.io/images/logos/charmverse_black.png'}
          size='small'
          isNft={user ? hasNftAvatar(user) : false}
        />
        <Typography variant='body1'>
          {user
            ? _isDowngrade
              ? `${user.username} selected ${tierConfig[event.tier].name} tier for next month`
              : `${user.username} upgraded to ${capitalize(event.tier)} tier`
            : `CharmVerse ${_isDowngrade ? 'downgraded' : 'upgraded'} the tier to ${tierConfig[event.tier].name}`}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {formatDate(event.createdAt, { month: 'long', withYear: true })}
        </Typography>
      </Box>
    </Stack>
  );
}

function SubscriptionContributionEventRow({ event }: { event: SubscriptionContributionEvent }) {
  const { members } = useMembers();
  const user = members.find((member) => member.id === event.userId);

  return (
    <Stack flexDirection='row' justifyContent='space-between' alignItems='center' gap={1}>
      <Box display='flex' alignItems='center' gap={1}>
        <Avatar
          name={user ? user.username : undefined}
          avatar={user ? user?.avatar : 'https://app.charmverse.io/images/logos/charmverse_black.png'}
          size='small'
          isNft={user ? hasNftAvatar(user) : false}
        />
        <Typography variant='body1'>Contribution by {user ? user?.username : 'CharmVerse'}</Typography>
        <Typography variant='caption' color='text.secondary'>
          {formatDate(event.createdAt, { month: 'long', withYear: true })}
        </Typography>
      </Box>
      <Stack flexDirection='row' alignItems='center' gap={1}>
        <Typography variant='body2' fontWeight={600} color='success.main'>
          +{Number(formatUnits(BigInt(event.paidTokenAmount), 18)).toLocaleString()}
        </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='' width={18} height={18} />
      </Stack>
    </Stack>
  );
}

function SubscriptionPaymentEventRow({ event }: { event: SubscriptionPaymentEvent }) {
  const date = new Date(event.createdAt);
  const month = date.toLocaleString('default', { month: 'long' });

  return (
    <Stack flexDirection='row' justifyContent='space-between' alignItems='center' gap={1}>
      <Box display='flex' alignItems='center' gap={1}>
        <Avatar avatar='https://app.charmverse.io/images/logos/charmverse_black.png' size='small' />
        <Typography variant='body1'>
          {month} {date.getFullYear()} - {capitalize(event.tier)} Plan
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {formatDate(event.createdAt, { month: 'long', withYear: true })}
        </Typography>
      </Box>
      <Stack flexDirection='row' alignItems='center' gap={1}>
        <Typography variant='body2' fontWeight={600} color='error.main'>
          -{Number(formatUnits(BigInt(event.paidTokenAmount), 18)).toLocaleString()}
        </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='' width={18} height={18} />
      </Stack>
    </Stack>
  );
}

function SubscriptionEventRow({ event }: { event: SubscriptionEvent }) {
  if (event.type === 'tier-change') {
    return <SubscriptionTierChangeEventRow event={event} />;
  } else if (event.type === 'contribution') {
    return <SubscriptionContributionEventRow event={event} />;
  } else if (event.type === 'payment') {
    return <SubscriptionPaymentEventRow event={event} />;
  }
  return null;
}

export function SpaceSubscriptionEventsList({ subscriptionEvents }: { subscriptionEvents: SubscriptionEvent[] }) {
  return (
    <Stack gap={2} my={2}>
      {subscriptionEvents.length === 0 ? (
        <Typography>No plan history yet</Typography>
      ) : (
        <>
          <Typography variant='h6'>Plan History</Typography>
          {subscriptionEvents.map((event) => (
            <SubscriptionEventRow key={event.id} event={event} />
          ))}
        </>
      )}
    </Stack>
  );
}
