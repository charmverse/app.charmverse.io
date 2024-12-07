'use client';

import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import { telegramBotName } from '@packages/scoutgame/constants';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';

export function InviteButtons() {
  const { user } = useUser();
  const [copied, setCopied] = useState('');
  const trackEvent = useTrackEvent();
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
            trackEvent('copy_referral_link');
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
      <Button
        href={shareUrl}
        sx={{ bgcolor: 'secondary.main', width: '100%', color: 'black.main' }}
        onClick={() => trackEvent('click_telegram_refer_friend_button')}
      >
        Invite Friends
      </Button>
      <Tooltip arrow placement='top' title={copied || undefined} disableInteractive>
        <IconButton
          sx={{
            bgcolor: 'secondary.main',
            borderRadius: '10px',
            color: 'black.main',
            '&:hover': {
              bgcolor: 'secondary.main',
              opacity: 1
            }
          }}
          onClick={onCopy}
        >
          <LuCopy />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
