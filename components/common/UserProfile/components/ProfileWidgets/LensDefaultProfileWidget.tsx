import type { MediaSetFragment, ProfileFragment } from '@lens-protocol/client';
import LanguageIcon from '@mui/icons-material/Language';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Divider, Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import Avatar from 'components/common/Avatar';

import { ProfileWidget } from './ProfileWidget';

function LensProfileAttributes({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} target='_blank' display='flex'>
      <Stack direction='row' spacing={0.5}>
        {icon}
        <Typography color='initial' variant='subtitle2'>
          {label}
        </Typography>
      </Stack>
    </Link>
  );
}

export function LensDefaultProfileWidget({ lensProfile }: { lensProfile: ProfileFragment }) {
  return (
    <ProfileWidget title='Lens Protocol' avatarSrc='/images/lens_logo.svg'>
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
              <LensProfileAttributes
                href={attribute.value}
                key={attribute.key}
                icon={<LanguageIcon fontSize='small' />}
                label={`Website: ${attribute.value}`}
              />
            );
          } else if (attribute.key === 'twitter') {
            return (
              <LensProfileAttributes
                key={attribute.key}
                href={`https://twitter.com/${attribute.value}`}
                icon={<TwitterIcon style={{ color: '#00ACEE', height: 20 }} />}
                label={`Twitter: ${attribute.value}`}
              />
            );
          }
          return null;
        })}
      </Stack>
    </ProfileWidget>
  );
}
