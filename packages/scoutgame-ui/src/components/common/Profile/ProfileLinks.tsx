import { IconButton, Typography, Tooltip } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { useMdScreen } from '../../../hooks/useMediaScreens';

export function ProfileLinks({
  farcasterName,
  githubLogin,
  talent
}: {
  farcasterName?: string | null;
  githubLogin?: string | null;
  talent?: {
    id: string;
    score: number;
  } | null;
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
          <Link
            href={`https://passport.talentprotocol.com/profile/${talent.id}`}
            target='_blank'
            rel='noopener noreferrer'
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
          </Link>
        </Tooltip>
      ) : null}
    </>
  );
}
