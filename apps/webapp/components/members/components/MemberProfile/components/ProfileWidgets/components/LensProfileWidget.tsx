import type { ProfileFragment } from '@lens-protocol/client';
import type { Profile } from '@lens-protocol/react-web';
import LanguageIcon from '@mui/icons-material/Language';
import { Divider, Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { FaXTwitter } from 'react-icons/fa6';

import Avatar from 'components/common/Avatar';

import { ProfileWidget } from './ProfileWidget';

function LensProfileAttributes({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} target='_blank' display='flex'>
      <Stack direction='row' spacing={1}>
        {icon}
        <Typography
          color='initial'
          variant='subtitle2'
          sx={{
            wordBreak: 'break-word'
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Link>
  );
}

export function LensProfileWidget({ lensProfile }: { lensProfile: ProfileFragment }) {
  return (
    <ProfileWidget
      link={`https://www.lensfrens.xyz/${lensProfile.handle?.localName}`}
      title='Lens Protocol'
      avatarSrc='/images/logos/lens_logo.png'
    >
      <Stack spacing={1}>
        <Stack direction='row' spacing={1}>
          <Avatar
            size='large'
            name={lensProfile.handle?.fullHandle ?? lensProfile.metadata?.displayName ?? lensProfile.id}
            avatar={
              (lensProfile.metadata?.picture?.__typename === 'ImageSet'
                ? lensProfile.metadata?.picture?.optimized?.uri || lensProfile.metadata?.picture?.raw.uri
                : lensProfile.metadata?.picture?.image?.optimized?.uri ||
                  lensProfile.metadata?.picture?.image?.raw?.uri) || 'https://www.lensfrens.xyz/assets/defaultPfp.png'
            }
            variant='circular'
          />
          <Stack>
            <Stack
              gap={0.5}
              sx={{
                flexDirection: {
                  xs: 'column',
                  sm: 'row'
                }
              }}
            >
              <Typography variant='body1' fontWeight='bold'>
                {lensProfile.metadata?.displayName ?? lensProfile.handle?.fullHandle}
              </Typography>
              <Typography
                variant='subtitle2'
                fontWeight='bold'
                alignSelf={{
                  xs: 'flex-start',
                  sm: 'flex-end'
                }}
              >
                #{lensProfile.id}
              </Typography>
            </Stack>
            <Typography variant='subtitle1'>{lensProfile.handle?.fullHandle}</Typography>
          </Stack>
        </Stack>
        <Stack direction='row'>
          <Typography variant='body2'>
            Followers: {lensProfile.stats?.followers ?? 0} | Following: {lensProfile.stats?.following ?? 0}
          </Typography>
        </Stack>
        {lensProfile.metadata?.bio || (lensProfile.metadata?.attributes ?? []).length ? (
          <>
            <Divider />
            <Typography variant='subtitle1'>{lensProfile.metadata?.bio}</Typography>
            {(lensProfile.metadata?.attributes ?? []).map((attribute) => {
              if (attribute.key === 'website') {
                return (
                  <LensProfileAttributes
                    href={attribute.value}
                    key={attribute.key}
                    icon={<LanguageIcon fontSize='small' />}
                    label={attribute.value}
                  />
                );
              } else if (attribute.key === 'twitter') {
                return (
                  <LensProfileAttributes
                    key={attribute.key}
                    href={`https://x.com/${attribute.value}`}
                    icon={<FaXTwitter style={{ color: '#888', height: 20, width: 18 }} />}
                    label={attribute.value}
                  />
                );
              }
              return null;
            })}
          </>
        ) : null}
      </Stack>
    </ProfileWidget>
  );
}
