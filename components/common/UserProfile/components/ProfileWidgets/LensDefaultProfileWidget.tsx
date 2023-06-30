import type { MediaSetFragment, ProfileFragment } from '@lens-protocol/client';
import LanguageIcon from '@mui/icons-material/Language';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Divider, Link, Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';

import { ProfileWidget } from './ProfileWidget';

export function LensDefaultProfileWidget({ lensProfile }: { lensProfile: ProfileFragment }) {
  return (
    <ProfileWidget title='Lens Protocol'>
      <Stack spacing={1}>
        <Stack direction='row' spacing={1}>
          <Avatar
            size='large'
            name={lensProfile.name ?? ''}
            avatar={(lensProfile.picture as MediaSetFragment)?.original?.url}
            variant='circular'
          />
          <Stack spacing={0.5}>
            <Typography variant='body1' fontWeight='bold'>
              {lensProfile?.name ?? lensProfile?.handle}
            </Typography>
            <Typography variant='subtitle2'>{lensProfile?.id}</Typography>
          </Stack>
        </Stack>
        <Stack direction='row'>
          <Typography variant='body2'>
            Followers: {lensProfile?.stats?.totalFollowers ?? 0} | Following: {lensProfile?.stats?.totalFollowing ?? 0}
          </Typography>
        </Stack>
        <Divider />
        <Typography>{lensProfile?.bio}</Typography>

        {(lensProfile?.attributes ?? []).map((attribute) => {
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
              <Link key={attribute.key} href={`https://twitter.com/${attribute.value}`} target='_blank' display='flex'>
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
    </ProfileWidget>
  );
}
