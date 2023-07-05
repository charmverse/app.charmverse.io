import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import type { Game7Inventory } from 'lib/profile/getGame7Profile';

import { ProfileWidget } from './ProfileWidget';

function Game7PlayerStatistics({ label, value }: { label: string; value: string | number }) {
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

export function Game7ProfileWidget({ game7Profile }: { game7Profile: Game7Inventory }) {
  return (
    <ProfileWidget title='Game7 Profile' avatarVariant='square' avatarSrc='/images/logos/game7_logo.svg'>
      <Stack spacing={1} direction='row' alignItems='center'>
        <Avatar size='2xLarge' variant='rounded' avatar={game7Profile.meta.avatarUrl} />
        <Stack spacing={1} width='100%'>
          <Game7PlayerStatistics label='Rank' value={game7Profile.meta.rank} />
          <Game7PlayerStatistics label='XP' value={game7Profile.meta.xp} />
          <Game7PlayerStatistics label='Achievements' value={game7Profile.meta.achievements.length} />
          <Game7PlayerStatistics label='Skills' value={game7Profile.meta.trophies.length} />
        </Stack>
      </Stack>
    </ProfileWidget>
  );
}
