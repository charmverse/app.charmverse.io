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
  return activity.type === 'github_event'
    ? activity.contributionType === 'first_pr'
      ? 'First contribution!'
      : activity.contributionType === 'regular_pr'
        ? 'Contribution accepted!'
        : activity.contributionType === 'third_pr_in_streak'
          ? 'Contribution streak!'
          : activity.contributionType === 'daily_commit'
            ? 'Daily commit!'
            : null
    : activity.type === 'nft_purchase'
      ? 'Scouted by'
      : null;
}

export function BuilderActivityLabel({ activity }: { activity: BuilderActivity }) {
  return <Typography component='span'>{getActivityLabel(activity)}</Typography>;
}

export function BuilderActivityAction({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack
      component='span'
      direction='row'
      spacing={0.5}
      alignItems='center'
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {activity.type === 'github_event' ? (
        <LuBookMarked size='15px' style={{ flexShrink: 0 }} />
      ) : activity.type === 'nft_purchase' ? (
        <BiLike size='15px' style={{ flexShrink: 0 }} />
      ) : null}
      <Typography
        variant='body2'
        component='span'
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {getActivityLabel(activity)}
        {activity.type === 'nft_purchase' && (
          <Link href={`/u/${activity.scout}`} style={{ marginLeft: '4px' }}>
            {activity.scout}
          </Link>
        )}
        {activity.type === 'github_event' && (
          <Typography
            component='span'
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              marginLeft: '4px'
            }}
          >
            <Link href={activity.url}>({activity.repo})</Link>
          </Typography>
        )}
      </Typography>
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
      {activity.type === 'github_event' ? (
        <>
          <Typography
            component='span'
            sx={{
              fontSize: {
                xs: '14px',
                md: '16px'
              }
            }}
          >
            {activity.gems}
          </Typography>
          <GemsIcon size={16} />
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
  return activity.type === 'github_event' && activity.bonusPartner && bonusPartnersRecord[activity.bonusPartner] ? (
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
                <BuilderActivityAction activity={activity} />
              </Stack>
              <Stack justifyContent='center' alignItems='center' gap={1}>
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
