import { Divider, Grid, Stack, Typography } from '@mui/material';

import { useCharmsLeaderBoard } from 'charmClient/hooks/charms';
import Avatar from 'components/common/Avatar';
import { CharmsLogo } from 'components/common/CharmsLogo';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import type { LeaderBoardUser } from '@packages/lib/charms/getLeaderBoard';
import type { CharmsBalance } from '@packages/lib/charms/getUserOrSpaceBalance';

type Props = {
  charmWallet?: CharmsBalance | null;
};

export function LeaderBoardTab({ charmWallet }: Props) {
  const { user } = useUser();
  const { data: charmLeaderBoard } = useCharmsLeaderBoard();
  const isUserOnLeaderBoard = charmLeaderBoard?.leaders?.findIndex((u) => u.id === user?.id) !== -1;

  if (!charmLeaderBoard) {
    return <LoadingComponent isLoading />;
  }

  return (
    <Stack gap={2} justifyContent='center'>
      {user && charmLeaderBoard.currentUser && !isUserOnLeaderBoard && (
        <Stack>
          <Typography variant='subtitle1'>Your rank</Typography>
          <CharmLeader
            leader={{
              id: user.id,
              avatar: user.avatar || '',
              totalBalance: charmLeaderBoard.currentUser.totalBalance || 0,
              username: user.username
            }}
            isHighlighted
            position={charmLeaderBoard.currentUser.position}
          />
        </Stack>
      )}
      <Typography variant='subtitle1'>Charm leaders</Typography>
      <Stack>
        {charmLeaderBoard.leaders.map((leader, i) => (
          <CharmLeader key={leader.id} leader={leader} isHighlighted={leader.id === user?.id} position={`${i + 1}`} />
        ))}
      </Stack>
    </Stack>
  );
}

function CharmLeader({
  leader,
  position,
  isHighlighted
}: {
  leader: LeaderBoardUser;
  position: string;
  isHighlighted?: boolean;
}) {
  return (
    <Stack key={leader.id}>
      <Stack
        direction='row'
        gap={1}
        alignItems='center'
        sx={{
          background: isHighlighted ? 'var(--charmeditor-active)' : 'transparent',
          py: 1.5,
          px: 2
        }}
      >
        <Stack minWidth='30px'>
          <Typography variant='subtitle1' color='secondary' fontWeight='bold'>
            {position ? `#${position}` : '-'}
          </Typography>
        </Stack>

        <Stack direction='row' alignItems='center' gap={1} flex={1}>
          <Stack direction='row' alignItems='center' gap={2} flex={1}>
            <Avatar avatar={leader.avatar} name={leader.username} />
            <Typography>{leader.username}</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' gap={0.5}>
            <Typography variant='subtitle1' color='primary'>
              {leader.totalBalance}
            </Typography>
            <CharmsLogo color='primary' />
          </Stack>
        </Stack>
      </Stack>
      <Divider />
    </Stack>
  );
}
