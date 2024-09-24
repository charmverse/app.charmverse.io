import type { BuilderEventType, GemsReceiptType } from '@charmverse/core/prisma-client';
import { Paper, Stack, Typography } from '@mui/material';
import { getRelativeTime } from '@packages/scoutgame/utils';
import Image from 'next/image';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

export type BuilderActivity = {
  id: string;
  type: BuilderEventType;
  createdAt: Date;
  gemsReceipt?: {
    type: GemsReceiptType;
    value: number;
  } | null;
  nftPurchaseEvent?: {
    scout: {
      username: string;
    };
  } | null;
  githubEvent?: {
    repo: {
      owner: string;
      name: string;
    };
  } | null;
};

export function BuilderActivitiesList({ events }: { events: BuilderActivity[] }) {
  return (
    <Stack gap={1}>
      {events.map((event) => {
        return (
          <Paper key={event.id} sx={{ px: 2, py: 1 }}>
            <Stack direction='row' justifyContent='space-between'>
              <Stack gap={1} width='60%'>
                <Typography>
                  {event.type === 'merged_pull_request'
                    ? event.gemsReceipt?.type === 'first_pr'
                      ? 'First contribution'
                      : event.gemsReceipt?.type === 'regular_pr'
                      ? 'Contribution accepted'
                      : 'Contribution streak'
                    : event.type === 'nft_purchase'
                    ? 'Scouted by'
                    : null}
                </Typography>
                <Stack flexDirection='row' gap={0.5} alignItems='center'>
                  {event.type === 'merged_pull_request' ? (
                    <LuBookMarked size='15px' />
                  ) : event.type === 'nft_purchase' ? (
                    <BiLike size='15px' />
                  ) : null}
                  {event.type === 'nft_purchase' ? (
                    <Typography>{event.nftPurchaseEvent?.scout.username}</Typography>
                  ) : event.type === 'merged_pull_request' ? (
                    <Typography textOverflow='ellipsis' overflow='hidden' whiteSpace='nowrap'>
                      {event.githubEvent?.repo.owner}/{event.githubEvent?.repo.name}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
              <Stack justifyContent='flex-start'>
                {event.gemsReceipt?.value ? (
                  <Stack flexDirection='row' gap={0.5} alignItems='center'>
                    <Typography variant='h6'>+{event.gemsReceipt?.value}</Typography>
                    <Image width={20} height={20} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                  </Stack>
                ) : null}
                {/** TODO: Add bonus rewards */}
              </Stack>
              <Typography>{getRelativeTime(event.createdAt)}</Typography>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
