'use client';

import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Link from 'next/link';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';

export function InviteButtons() {
  const { user } = useUser();
  const [copied, setCopied] = useState('');
  const trackEvent = useTrackEvent();
  const referral = user?.referralCode;
  const url = `https://scoutgame.xyz/login?ref=${referral}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(
    "Join me in Scout Game. Collect builder cards to earn Scout Points, OP, Moxie and more! Use my link to sign up and we'll both earn 5 Scout Points to play.🫡"
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('Copied!');
      trackEvent('copy_referral_link');
    } catch (_) {
      setCopied('You need to give access to copy the link');
    }
  };

  if (!referral) {
    return null;
  }

  return (
    <Paper>
      <Stack
        justifyContent='center'
        alignItems={{ xs: 'start', sm: 'center' }}
        gap={1}
        p={2}
        flexDirection={{ xs: 'column', sm: 'row' }}
      >
        <Typography sx={{ width: '100%', cursor: 'pointer' }} variant='caption'>
          https://scoutgame.xyz/login?ref={referral}
        </Typography>
        <Box display='flex' gap={1} justifyContent='start'>
          <Tooltip arrow placement='top' title={copied || undefined} disableInteractive>
            <IconButton
              sx={{
                bgcolor: 'black.main',
                borderRadius: '10px'
              }}
              onClick={onCopy}
            >
              <LuCopy />
            </IconButton>
          </Tooltip>
          <IconButton
            href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            LinkComponent={Link}
            target='_blank'
            sx={{
              bgcolor: 'black.main',
              borderRadius: '10px'
            }}
          >
            <img src='/images/logos/x.png' alt='x' width={25} height={25} />
          </IconButton>
          <IconButton
            href={`https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`}
            LinkComponent={Link}
            target='_blank'
            sx={{
              bgcolor: 'black.main',
              borderRadius: '10px'
            }}
          >
            <img src='/images/logos/warpcast.png' alt='warpcast' width={25} height={25} />
          </IconButton>
        </Box>
      </Stack>
    </Paper>
  );
}
