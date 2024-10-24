import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { getSeasonBuilderRewards, getWeeklyBuilderRewards } from 'lib/builders/getBuilderRewards';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { DividerRow } from '../common/DividerRow';
import { PointsCell } from '../common/PointsCell';
import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

export async function BuilderRewardsTable({ week }: { week: string | null }) {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const builderRewards = week
    ? await getWeeklyBuilderRewards({ week, userId: user.id })
    : await getSeasonBuilderRewards({ userId: user.id });

  const totalPoints = builderRewards.reduce((acc, reward) => acc + reward.points, 0);

  return (
    <>
      <Table>
        <StyledTableHead>
          <TableRow>
            <TableCell align='left'>BUILDER</TableCell>
            <TableCell align='center'>CARDS HELD</TableCell>
            {week ? <TableCell align='center'>RANK</TableCell> : null}
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </StyledTableHead>
        {builderRewards.length ? (
          <StyledTableBody>
            {builderRewards.map((reward) => (
              <>
                <DividerRow />
                <TableRow key={reward.username}>
                  <TableCell
                    sx={{
                      maxWidth: {
                        xs: 150,
                        md: 'none'
                      }
                    }}
                  >
                    <Link href={`/u/${reward.username}`}>
                      <Stack direction='row' alignItems='center' gap={1}>
                        <Avatar src={reward.avatar} name={reward.username} size='small' />
                        <Typography noWrap overflow='hidden'>
                          {reward.username}
                        </Typography>
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
              <TableCell colSpan={week ? 3 : 2}>
                <Typography>Total Scout Points</Typography>
              </TableCell>
              <TableCell align='right'>
                <PointsCell points={totalPoints} />
              </TableCell>
            </TableRow>
          </StyledTableBody>
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
    </>
  );
}
