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

export function SummonProfileWidget({ userId }: { userId: string }) {
  const { data: summonProfile, isLoading: isLoadingSummonProfile } = useSWR(`public/profile/${userId}/summon`, () =>
    charmClient.publicProfile.getSummonProfile(userId)
  );

  const theme = useTheme();

  return (
    <ProfileWidget
      isLoading={isLoadingSummonProfile}
      title='Summon Profile'
      avatarVariant='square'
      avatarSrc={
        theme.palette.mode === 'light' ? '/images/logos/summon_dark_mark.svg' : '/images/logos/summon_light_mark.svg'
      }
      emptyContent={!summonProfile ? 'Profile Not Found' : null}
    >
      {summonProfile && (
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
            avatar={summonProfile.meta.avatarUrl || `/images/logos/summon_logo.svg`}
          />
          <Stack gap={1} width='100%'>
            <SummonPlayerStatistics label='Rank' value={summonProfile.meta.rank} />
            <SummonPlayerStatistics label='XP' value={summonProfile.meta.xp} />
            <SummonPlayerStatistics label='Achievements' value={summonProfile.meta.achievements.length} />
            <SummonPlayerStatistics label='Skills' value={summonProfile.meta.trophies.length} />
          </Stack>
        </Stack>
      )}
    </ProfileWidget>
  );
}
