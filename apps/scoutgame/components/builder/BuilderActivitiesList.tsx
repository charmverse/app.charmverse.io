import { Paper, Stack, Typography } from '@mui/material';
import { getRelativeTime } from '@packages/scoutgame/utils';
import Image from 'next/image';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import type { BuilderActivity } from 'lib/builders/getBuilderActivities';

export function BuilderActivityLabel({ activity }: { activity: BuilderActivity }) {
  return (
    <Typography>
      {activity.type === 'merged_pull_request'
        ? activity.contributionType === 'first_pr'
          ? 'First CONTRIBUTION'
          : activity.contributionType === 'regular_pr'
          ? 'Contribution ACCEPTED'
          : 'Contribution STREAK'
        : activity.type === 'nft_purchase'
        ? 'Scouted by'
        : null}
    </Typography>
  );
}

export function BuilderActivityDetail({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'merged_pull_request' ? (
        <LuBookMarked size='15px' />
      ) : activity.type === 'nft_purchase' ? (
        <BiLike size='15px' />
      ) : null}
      {activity.type === 'nft_purchase' ? (
        <Typography>{activity.scout}</Typography>
      ) : activity.type === 'merged_pull_request' ? (
        <Typography textOverflow='ellipsis' overflow='hidden' whiteSpace='nowrap'>
          {activity.repo}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function BuilderActivityGems({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'merged_pull_request' ? (
        <>
          <Typography variant='h6'>+{activity.gems}</Typography>
          <Image width={20} height={20} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
        </>
      ) : null}
    </Stack>
  );
}

export function BuilderActivitiesList({ activities }: { activities: BuilderActivity[] }) {
  return (
    <Stack gap={0.5}>
      {activities.map((activity) => {
        return (
          <Paper key={activity.id} sx={{ px: 2, py: 1 }}>
            <Stack direction='row' justifyContent='space-between'>
              <Stack width='60%'>
                <BuilderActivityLabel activity={activity} />
                <BuilderActivityDetail activity={activity} />
              </Stack>
              <Stack justifyContent='flex-start'>
                <BuilderActivityGems activity={activity} />
                {/** TODO: Add bonus rewards */}
              </Stack>
              <Typography>{getRelativeTime(activity.createdAt)}</Typography>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
