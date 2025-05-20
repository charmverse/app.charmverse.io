import { Box, capitalize, Stack, Typography } from '@mui/material';
import { relativeTime } from '@packages/lib/utils/dates';
import type { SubscriptionReceipt } from '@packages/subscriptions/getSubscriptionReceipts';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { formatUnits } from 'viem';

import Avatar from 'components/common/Avatar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';

function isStartOfMonth(date: Date | string) {
  const dt = DateTime.fromJSDate(date instanceof Date ? date : new Date(date), { zone: 'utc' });
  return dt.day === 1 && dt.hour === 0 && dt.minute === 0 && dt.second === 0 && dt.millisecond === 0;
}

export function SpaceSubscriptionReceiptsList({
  subscriptionReceipts
}: {
  subscriptionReceipts: SubscriptionReceipt[];
}) {
  const { space } = useCurrentSpace();
  const { members } = useMembers();

  const subscriptionReceiptsWithUser = subscriptionReceipts.map((receipt) => ({
    ...receipt,
    user: receipt.type === 'contribution' ? members.find((member) => member.id === receipt.userId)! : undefined
  }));

  return (
    <Stack gap={2}>
      {subscriptionReceipts.length === 0 ? (
        <Typography>No subscription receipts yet</Typography>
      ) : (
        subscriptionReceiptsWithUser.map((receipt) => (
          <Stack key={receipt.id} flexDirection='row' justifyContent='space-between' alignItems='center' gap={2}>
            <Box display='flex' alignItems='center' gap={1} flexGrow={1}>
              <Avatar
                name={receipt.user ? receipt.user.username : space?.name}
                avatar={receipt.user ? receipt.user?.avatar : space?.spaceImage}
                size='small'
                isNft={receipt.user ? hasNftAvatar(receipt.user) : false}
              />
              <Typography variant='body1'>
                {receipt.type === 'contribution'
                  ? `Contribution by ${receipt.user?.username}`
                  : isStartOfMonth(receipt.createdAt)
                    ? 'Monthly Payment'
                    : `Changed tier to ${capitalize(receipt.tier)}`}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {relativeTime(receipt.createdAt)}
              </Typography>
            </Box>
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <Typography
                variant='body2'
                fontWeight={600}
                color={receipt.type === 'contribution' ? 'success.main' : 'error.main'}
              >
                {receipt.type === 'contribution' ? '+' : '-'}
                {formatUnits(BigInt(receipt.paidTokenAmount), 18)}
              </Typography>
              <Image src='/images/logos/dev-token-logo.png' alt='' width={18} height={18} />
            </Stack>
          </Stack>
        ))
      )}
    </Stack>
  );
}
