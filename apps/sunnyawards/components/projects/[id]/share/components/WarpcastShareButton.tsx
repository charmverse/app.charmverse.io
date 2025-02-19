'use client';

import styled from '@emotion/styled';
import { Button, SvgIcon } from '@mui/material';
import { useTrackEvent } from '@packages/connect-shared/hooks/useTrackEvent';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import FarcasterIcon from 'public/images/farcaster.svg';

const StyledButton = styled(Button)`
  color: white;
  &:hover {
    color: white;
  }
  font-size: 18px;
` as typeof Button;

export function WarpcastShareButton({ projectIdOrPath }: { projectIdOrPath: string }) {
  const trackEvent = useTrackEvent();
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectIdOrPath}`);
  }, []);

  const href = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    'I just registered for the SUNNY Awards to be eligible for 540K OP!'
  )}&embeds[]=${url}`;

  return (
    <div data-test='share-project-to-warpcast'>
      <StyledButton
        LinkComponent={Link}
        size='large'
        variant='contained'
        href={href}
        rel='noopener noreferrer'
        target='_blank'
        startIcon={<SvgIcon component={FarcasterIcon} inheritViewBox sx={{ height: 30, width: 30, fill: 'white' }} />}
        sx={{
          gap: 1,
          backgroundColor: 'farcaster.main',
          '&:hover': {
            backgroundColor: 'farcaster.dark'
          }
        }}
        onMouseDown={() => trackEvent('click_share_on_warpcast')}
      >
        Share
      </StyledButton>
    </div>
  );
}
