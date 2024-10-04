import { Paper, Stack, Typography } from '@mui/material';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import { getRelativeTime } from '@packages/utils/dates';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { GemsIcon } from 'components/common/Icons';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';

export function getActivityLabel(activity: BuilderActivity) {
  return activity.type === 'merged_pull_request'
    ? activity.contributionType === 'first_pr'
      ? 'First CONTRIBUTION'
      : activity.contributionType === 'regular_pr'
      ? 'Contribution ACCEPTED'
      : 'Contribution STREAK'
    : activity.type === 'nft_purchase'
    ? 'Scouted by'
    : null;
}

export function BuilderActivityLabel({ activity }: { activity: BuilderActivity }) {
  return <Typography component='span'>{getActivityLabel(activity)}</Typography>;
}

export function BuilderActivityDetail({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack component='span' flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'merged_pull_request' ? (
        <LuBookMarked size='15px' />
      ) : activity.type === 'nft_purchase' ? (
        <BiLike size='15px' />
      ) : null}
      {activity.type === 'nft_purchase' ? (
        <Link href={`/u/${activity.scout}`}>{activity.scout}</Link>
      ) : activity.type === 'merged_pull_request' ? (
        <Link href={activity.url}>{activity.repo}</Link>
      ) : null}
    </Stack>
  );
}

export function BuilderActivityGems({
  activity,
  showEmpty = false
}: {
  activity: BuilderActivity;
  showEmpty?: boolean;
}) {
  return (
    <Stack component='span' flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'merged_pull_request' ? (
        <>
          <Typography component='span'>+{activity.gems}</Typography>
          <GemsIcon />
        </>
      ) : showEmpty ? (
        '-'
      ) : null}
    </Stack>
  );
}

export function BuilderActivityBonusPartner({
  activity,
  showEmpty = false
}: {
  activity: BuilderActivity;
  showEmpty?: boolean;
}) {
  return activity.type === 'merged_pull_request' &&
    activity.bonusPartner &&
    bonusPartnersRecord[activity.bonusPartner] ? (
    <Image width={20} height={20} src={bonusPartnersRecord[activity.bonusPartner].icon} alt='Bonus Partner' />
  ) : showEmpty ? (
    '-'
  ) : null;
}

export function BuilderActivitiesList({ activities }: { activities: BuilderActivity[] }) {
  return (
    <Stack gap={0.5}>
      {activities.map((activity) => {
        return (
          <Paper
            key={activity.id}
            sx={{
              px: {
                xs: 1,
                md: 3
              },
              py: {
                xs: 1,
                md: 2
              }
            }}
          >
            <Stack direction='row' justifyContent='space-between'>
              <Stack width='60%'>
                <BuilderActivityLabel activity={activity} />
                <BuilderActivityDetail activity={activity} />
              </Stack>
              <Stack justifyContent='flex-start' alignItems='flex-end' gap={1}>
                <BuilderActivityGems activity={activity} />
                <BuilderActivityBonusPartner activity={activity} />
              </Stack>
              <Typography width={75} textAlign='right'>
                {getRelativeTime(activity.createdAt)}
              </Typography>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
