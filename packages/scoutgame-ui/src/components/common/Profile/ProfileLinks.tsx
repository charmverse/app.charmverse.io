import { IconButton, Typography, Tooltip } from '@mui/material';
import type { TalentProfile } from '@packages/scoutgame/users/getUserByPath';
import Image from 'next/image';
import Link from 'next/link';

import { useMdScreen } from '../../../hooks/useMediaScreens';

export function ProfileLinks({
  farcasterName,
  githubLogin,
  talent,
  hasMoxieProfile
}: {
  farcasterName?: string | null;
  githubLogin?: string | null;
  talent?: TalentProfile | null;
  hasMoxieProfile?: boolean;
}) {
  const isDesktop = useMdScreen();
  return (
    <>
      {farcasterName ? (
        <IconButton
          href={`https://warpcast.com/${farcasterName}`}
          target='_blank'
          rel='noopener noreferrer'
          sx={{ px: 0 }}
        >
          <Image
            src='/images/profile/icons/warpcast-circle-icon.svg'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='warpcast icon'
          />
        </IconButton>
      ) : null}
      {githubLogin ? (
        <IconButton href={`https://github.com/${githubLogin}`} target='_blank' rel='noopener noreferrer' sx={{ px: 0 }}>
          <Image
            src='/images/profile/icons/github-circle-icon.svg'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='github icon'
          />
        </IconButton>
      ) : null}
      {talent ? (
        <Tooltip title='Talent protocol score'>
          <IconButton
            href={`https://passport.talentprotocol.com/profile/${talent.id}`}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ px: 0 }}
          >
            <Typography
              variant='body2'
              sx={{
                width: isDesktop ? '28px' : '24px',
                height: isDesktop ? '28px' : '24px',
                border: '2.5px solid rgb(130, 106, 238)',
                borderRadius: '50%',
                color: 'white',
                fontSize: isDesktop ? '10px' : '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {talent.score}
            </Typography>
          </IconButton>
        </Tooltip>
      ) : null}
      {hasMoxieProfile ? (
        <Tooltip title='Moxie profile'>
          <IconButton
            href={`https://airstack.xyz/users/fc_fname%3A${farcasterName}`}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ px: 0 }}
          >
            <Image
              src='/images/moxie.svg'
              alt='moxie icon'
              width={isDesktop ? '24' : '18'}
              height={isDesktop ? '24' : '18'}
            />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
}
