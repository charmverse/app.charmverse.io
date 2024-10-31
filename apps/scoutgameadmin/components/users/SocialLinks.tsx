import { IconButton } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from 'hooks/useMediaScreens';

export function SocialLinks({
  farcasterName,
  githubLogin
}: {
  farcasterName?: string | null;
  githubLogin?: string | null;
}) {
  const isDesktop = useMdScreen();
  return (
    <>
      {farcasterName ? (
        <IconButton href={`https://warpcast.com/${farcasterName}`} target='_blank' rel='noopener noreferrer'>
          <Image
            src='/images/icons/warpcast-circle-icon.svg'
            width={isDesktop ? '20' : '16'}
            height={isDesktop ? '20' : '16'}
            alt='warpcast icon'
          />
        </IconButton>
      ) : null}
      {githubLogin ? (
        <IconButton href={`https://github.com/${githubLogin}`} target='_blank' rel='noopener noreferrer' sx={{ px: 0 }}>
          <Image
            src='/images/icons/github-circle-icon.svg'
            width={isDesktop ? '20' : '16'}
            height={isDesktop ? '20' : '16'}
            alt='github icon'
          />
        </IconButton>
      ) : null}
    </>
  );
}
