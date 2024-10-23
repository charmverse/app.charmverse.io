import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import {
  currentSeason,
  currentSeasonNumber,
  getLastWeek,
  getNextWeek,
  getPreviousWeek,
  getSeasonWeekFromISOWeek
} from '@packages/scoutgame/dates';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { TabsMenu } from 'components/common/Tabs/TabsMenu';
import { getWeeklyBuilderRewards, getSeasonBuilderRewards } from 'lib/builders/getBuilderRewards';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { DividerRow } from '../common/DividerRow';
import { PointsCell } from '../common/PointsCell';

export async function BuilderRewardsTable({ period }: { period: string }) {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const isSeason = period === 'season';
  const lastWeek = getLastWeek();
  const week = isSeason ? null : period || lastWeek;
  const previousWeek = week ? (week === currentSeason ? null : getPreviousWeek(week)) : null;
  const nextWeek = week ? (week === lastWeek ? null : getNextWeek(week)) : null;

  const builderRewards = week
    ? await getWeeklyBuilderRewards({ week, userId: user.id })
    : await getSeasonBuilderRewards({ userId: user.id });

  const totalPoints = builderRewards.reduce((acc, reward) => acc + reward.points, 0);

  return (
    <Stack gap={1} alignItems='center'>
      <Typography color='secondary' variant='h6'>
        Builder Rewards
      </Typography>
      <TabsMenu
        tabs={[
          { value: week || lastWeek, label: 'Weekly' },
          { value: 'season', label: 'Season Total' }
        ]}
        value={isSeason ? 'season' : week || lastWeek}
      />
      <Stack direction='row' gap={1} alignItems='center'>
        <Link href={previousWeek ? `/claim?tab=${previousWeek}` : ''}>
          <IconButton disabled={!previousWeek} size='small'>
            <ChevronLeftIcon />
          </IconButton>
        </Link>
        <Typography>
          {!week
            ? `Season ${currentSeasonNumber}`
            : `Week ${getSeasonWeekFromISOWeek({ season: currentSeason, week })}`}
        </Typography>
        <Link href={nextWeek ? `/claim?tab=${nextWeek}` : ''}>
          <IconButton disabled={!nextWeek} size='small'>
            <ChevronRightIcon />
          </IconButton>
        </Link>
      </Stack>

      <Table>
        <TableHead
          sx={{
            backgroundColor: 'background.dark',
            '& .MuiTableCell-root': { padding: 1, borderBottom: 'none', px: 1.5 }
          }}
        >
          <TableRow>
            <TableCell align='left'>BUILDER</TableCell>
            <TableCell align='center'>CARDS HELD</TableCell>
            {isSeason ? null : <TableCell align='center'>RANK</TableCell>}
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </TableHead>
        {builderRewards.length ? (
          <TableBody
            sx={{
              backgroundColor: 'background.dark',
              '& .MuiTableCell-root': { padding: 1, borderBottom: 'none', px: 1.5 }
            }}
          >
            {builderRewards.map((reward) => (
              <>
                <DividerRow />
                <TableRow key={reward.username}>
                  <TableCell>
                    <Link href={`/u/${reward.username}`}>
                      <Stack direction='row' alignItems='center' gap={1}>
                        <Avatar src={reward.avatar} name={reward.username} size='small' />
                        <Typography>{reward.username}</Typography>
                      </Stack>
                    </Link>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography>{reward.cardsHeld}</Typography>
                  </TableCell>
                  {reward.rank ? (
                    <TableCell align='center'>
                      <Typography>{reward.rank}</Typography>
                    </TableCell>
                  ) : null}
                  <TableCell align='right'>
                    <PointsCell points={reward.points} />
                  </TableCell>
                </TableRow>
              </>
            ))}
            <DividerRow />
            <TableRow>
              <TableCell>
                <Typography>Total Scout Points</Typography>
              </TableCell>
              <TableCell colSpan={isSeason ? 1 : 2} />
              <TableCell align='right'>
                <PointsCell points={totalPoints} />
              </TableCell>
            </TableRow>
          </TableBody>
        ) : null}
      </Table>
      {builderRewards.length ? null : (
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
      )}
    </Stack>
  );
}
