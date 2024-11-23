'use client';

import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';

import { telegramBotName } from 'lib/telegram/config';

export function InviteButtons() {
  const { user } = useUser();
  const [copied, setCopied] = useState('');
  const referral = user?.referralCode;
  const url = `https://t.me/${telegramBotName}/start?startapp=ref_${referral}`;
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent('Pick great builders. Earn rewards.');

  const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;

  const onCopy = async () => {
    if (typeof window !== 'undefined') {
      WebApp.requestWriteAccess(async (access) => {
        if (access) {
          try {
            await navigator.clipboard.writeText(url);
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
      <Button href={shareUrl} sx={{ bgcolor: 'secondary.main', width: '100%', color: 'black.main' }}>
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
