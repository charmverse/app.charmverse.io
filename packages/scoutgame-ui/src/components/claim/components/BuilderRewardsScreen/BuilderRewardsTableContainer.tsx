import { Paper, Typography } from '@mui/material';
import { getSeasonBuilderRewards, getWeeklyBuilderRewards } from '@packages/scoutgame/builders/getBuilderRewards';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import Image from 'next/image';

import { BuilderRewardsTable } from './BuilderRewardsTable';

export async function BuilderRewardsTableContainer({ week }: { week: string | null }) {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const builderRewards = week
    ? await getWeeklyBuilderRewards({ week, userId: user.id })
    : await getSeasonBuilderRewards({ userId: user.id });

  const totalPoints = builderRewards.reduce((acc, reward) => acc + reward.points, 0);

  if (builderRewards.length === 0) {
    return (
      <Paper
        sx={{
          width: '100%',
          px: 2.5,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          mt: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.dark'
        }}
      >
        <Typography>Time to scout some Builders!</Typography>
        <Image src='/images/cat-with-binoculars.png' alt='Scouts' width={400} height={400} />
      </Paper>
    );
  }

  return <BuilderRewardsTable week={week} builderRewards={builderRewards} totalPoints={totalPoints} />;
}
