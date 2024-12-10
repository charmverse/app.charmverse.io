import { Paper, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import type { BuilderActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { getRelativeTime } from '@packages/utils/dates';
import Image from 'next/image';
import Link from 'next/link';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { GemsIcon } from '../../../common/Icons';

export function getActivityLabel(activity: BuilderActivity, shorten = false) {
  return activity.type === 'github_event'
    ? activity.contributionType === 'first_pr'
      ? shorten
        ? 'First PR!'
        : 'First contribution!'
      : activity.contributionType === 'regular_pr'
        ? shorten
          ? 'Regular PR!'
          : 'Contribution accepted!'
        : activity.contributionType === 'third_pr_in_streak'
          ? shorten
            ? 'PR Streak!'
            : 'Contribution streak!'
          : activity.contributionType === 'daily_commit'
            ? shorten
              ? 'Commit!'
              : 'Daily commit!'
            : null
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
      {activity.type === 'nft_purchase' ? (
        <Link href={`/u/${activity.scout.path}`}>{activity.scout.displayName}</Link>
      ) : activity.type === 'github_event' ? (
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
      {activity.type === 'github_event' ? (
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
  return activity.type === 'github_event' &&
    activity.bonusPartner &&
    bonusPartnersRecord[activity.bonusPartner as BonusPartner] ? (
    <Image
      width={20}
      height={20}
      src={bonusPartnersRecord[activity.bonusPartner as BonusPartner].icon}
      alt='Bonus Partner'
    />
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
                xs: 2,
                md: 3
              },
              py: {
                xs: 1.5,
                md: 2
              }
            }}
          >
            <Stack
              gap={{
                xs: 1,
                md: 0.5
              }}
            >
              <Stack flexDirection='row' justifyContent='space-between'>
                <Stack flexDirection='row' gap={0.5} alignItems='center' width='60%'>
                  {activity.type === 'github_event' ? (
                    <LuBookMarked size='15px' />
                  ) : activity.type === 'nft_purchase' ? (
                    <BiLike size='15px' />
                  ) : null}
                  <BuilderActivityLabel activity={activity} />
                </Stack>
                <BuilderActivityGems activity={activity} />
                <BuilderActivityBonusPartner activity={activity} />
                <Typography width={75} textAlign='right' variant='body2'>
                  {getRelativeTime(activity.createdAt)}
                </Typography>
              </Stack>
              <BuilderActivityDetail activity={activity} />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
