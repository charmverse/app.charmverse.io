import type { MediaSetFragment } from '@lens-protocol/client';
import LanguageIcon from '@mui/icons-material/Language';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Divider, Link, Stack, Typography } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';

import { ProfileWidget } from './ProfileWidget';

export function LensDefaultProfileWidget({ userId }: { userId: string }) {
  const { data: defaultLensProfile, isLoading } = useSWR(`lens/profile/${userId}`, () =>
    charmClient.profile.getLensDefaultProfile(userId)
  );

  if (isLoading) {
    return (
      <ProfileWidget title='Lens Protocol'>
        <LoadingComponent isLoading />
      </ProfileWidget>
    );
  }

  return (
    <ProfileWidget title='Lens Protocol'>
      {defaultLensProfile ? (
        <Stack spacing={1}>
          <Stack direction='row' spacing={1}>
            <Avatar
              size='large'
              name={defaultLensProfile.name ?? ''}
              avatar={(defaultLensProfile.picture as MediaSetFragment)?.original?.url}
              variant='circular'
            />
            <Stack spacing={0.5}>
              <Typography variant='body1' fontWeight='bold'>
                {defaultLensProfile?.name ?? defaultLensProfile?.handle}
              </Typography>
              <Typography variant='subtitle2'>{defaultLensProfile?.id}</Typography>
            </Stack>
          </Stack>
          <Stack direction='row'>
            <Typography variant='body2'>
              Followers: {defaultLensProfile?.stats?.totalFollowers ?? 0} | Following:{' '}
              {defaultLensProfile?.stats?.totalFollowing ?? 0}
            </Typography>
          </Stack>
          <Divider />
          <Typography>{defaultLensProfile?.bio}</Typography>

          {(defaultLensProfile?.attributes ?? []).map((attribute) => {
            if (attribute.key === 'website') {
              return (
                <Link key={attribute.key} href={attribute.value} target='_blank' display='flex'>
                  <Stack direction='row' spacing={0.5}>
                    <LanguageIcon fontSize='small' />
                    <Typography color='initial' variant='subtitle2'>
                      Website: {attribute.value}
                    </Typography>
                  </Stack>
                </Link>
              );
            } else if (attribute.key === 'twitter') {
              return (
                <Link
                  key={attribute.key}
                  href={`https://twitter.com/${attribute.value}`}
                  target='_blank'
                  display='flex'
                >
                  <Stack direction='row' spacing={0.5}>
                    <TwitterIcon style={{ color: '#00ACEE', height: 20 }} />
                    <Typography color='initial' variant='subtitle2'>
                      Twitter: {attribute.value}
                    </Typography>
                  </Stack>
                </Link>
              );
            }

            return null;
          })}
        </Stack>
      ) : (
        <Typography color='secondary'>No lens protocol account detected</Typography>
      )}
    </ProfileWidget>
  );
}
