'use client';

import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';

export function InviteButtons() {
  const { user } = useUser();
  const [copied, setCopied] = useState('');
  const referral = user?.referralCode;
  const url = encodeURIComponent(`https://t.me/ScoutGameXYZBot/start?startapp=${referral}`);
  const text = encodeURIComponent('Play ScoutGame with me!');

  const shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;

  const onCopy = async () => {
    if (typeof window !== 'undefined') {
      WebApp.requestWriteAccess(async (access) => {
        if (access) {
          try {
            await navigator.clipboard.writeText(shareUrl);
          } catch (_) {
            // permissions error
          }
          setCopied('Copied!');
        } else {
          setCopied('You need to give access to copy the link');
        }
      });
    }
  };

  if (!referral) {
    return null;
  }

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2} flexDirection='row'>
      <Button href={shareUrl} sx={{ bgcolor: 'secondary.main', width: '100%' }} color='secondary'>
        Invite Friends
      </Button>
      <Tooltip arrow placement='top' title={copied || undefined} disableInteractive>
        <IconButton sx={{ bgcolor: 'secondary.main', borderRadius: '10px', color: 'black.main' }} onClick={onCopy}>
          <LuCopy />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
