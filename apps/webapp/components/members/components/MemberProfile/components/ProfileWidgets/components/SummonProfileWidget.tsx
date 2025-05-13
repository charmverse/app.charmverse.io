import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import type { SummonUserProfile } from '@packages/lib/summon/interfaces';

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

export function SummonProfileWidget({ summonProfile }: { summonProfile: SummonUserProfile }) {
  const theme = useTheme();

  const achievements = summonProfile.meta.achievements;
  const trophies = summonProfile.meta.trophies;

  return (
    <ProfileWidget
      title='Summon Profile'
      avatarVariant='square'
      avatarSrc={
        theme.palette.mode === 'light' ? '/images/logos/summon_dark_mark.svg' : '/images/logos/summon_light_mark.svg'
      }
    >
      {summonProfile && (
        <Stack
          gap={2}
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
            avatar={
              summonProfile.meta.avatarUrl ||
              (theme.palette.mode === 'light'
                ? '/images/logos/summon_dark_mark.svg'
                : '/images/logos/summon_light_mark.svg')
            }
          />
          <Stack gap={1} width='100%'>
            <SummonPlayerStatistics label='Rank' value={summonProfile.meta.rank} />
            <SummonPlayerStatistics label='XP' value={summonProfile.meta.xp} />
            <SummonPlayerStatistics
              label='Achievements'
              value={Array.isArray(achievements) ? achievements.length : achievements}
            />
            <SummonPlayerStatistics label='Skills' value={Array.isArray(trophies) ? trophies.length : trophies} />
          </Stack>
        </Stack>
      )}
    </ProfileWidget>
  );
}
