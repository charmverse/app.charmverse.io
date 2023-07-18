import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';

import { ProfileWidget } from './ProfileWidget';

function SummonPlayerStatistics({ label, value }: { label: string; value: string | number }) {
  const theme = useTheme();
  const backgroundColor =
    theme.palette.mode === 'dark' ? theme.palette.background.dark : theme.palette.background.light;
  return (
    <Stack
      direction='row'
      sx={{
        p: 1,
        backgroundColor,
        borderRadius: theme.spacing(1)
      }}
    >
      <Typography mr={0.5} variant='subtitle2' fontWeight='bold' textTransform='uppercase'>
        {label}:
      </Typography>
      <Typography variant='subtitle2' fontWeight='bold'>
        {value}
      </Typography>
    </Stack>
  );
}

export function Game7ProfileWidget({ userId }: { userId: string }) {
  const { data: game7Profile, isLoading: isLoadingGame7Profile } = useSWR(`public/profile/${userId}/game7`, () =>
    charmClient.publicProfile.getSummonProfile(userId)
  );

  return (
    <ProfileWidget
      isLoading={isLoadingGame7Profile}
      title='Game7 Profile'
      avatarVariant='square'
      avatarSrc='/images/logos/game7_logo.svg'
      emptyContent={!game7Profile ? 'User does not have a Game7 profile' : null}
    >
      {game7Profile && (
        <Stack
          gap={1}
          sx={{
            flexDirection: {
              xs: 'column',
              sm: 'row'
            }
          }}
          alignItems='center'
        >
          <Avatar
            size='2xLarge'
            variant='rounded'
            avatar={game7Profile.meta.avatarUrl || `/images/logos/game7_logo.svg`}
          />
          <Stack gap={1} width='100%'>
            <SummonPlayerStatistics label='Rank' value={game7Profile.meta.rank} />
            <SummonPlayerStatistics label='XP' value={game7Profile.meta.xp} />
            <SummonPlayerStatistics label='Achievements' value={game7Profile.meta.achievements.length} />
            <SummonPlayerStatistics label='Skills' value={game7Profile.meta.trophies.length} />
          </Stack>
        </Stack>
      )}
    </ProfileWidget>
  );
}
