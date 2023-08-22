import { Box, SvgIcon, Tooltip, Typography, Stack } from '@mui/material';
import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import DiscordIcon from 'public/images/logos/discord_logo.svg';

export function DiscordSocialIcon({
  username,
  showLogo = true,
  showUsername = false,
  showLabel = false,
  direction = 'row'
}: {
  showLabel?: boolean;
  username: string;
  showLogo?: boolean;
  showUsername?: boolean;
  direction?: 'row' | 'column';
}) {
  const [isDiscordUsernameCopied, setIsDiscordUsernameCopied] = useState(false);

  const onDiscordUsernameCopy = () => {
    setIsDiscordUsernameCopied(true);
    setTimeout(() => setIsDiscordUsernameCopied(false), 1000);
  };

  return (
    <Tooltip
      placement='top'
      title={isDiscordUsernameCopied ? 'Copied' : `Click to copy: ${username}`}
      disableInteractive
      arrow
    >
      <Box sx={{ display: 'initial', cursor: 'pointer' }}>
        <CopyToClipboard text={username} onCopy={onDiscordUsernameCopy}>
          <Stack direction={direction} alignItems='center' spacing={0.5}>
            {showLogo && (
              <SvgIcon viewBox='0 0 70 70' sx={{ color: '#5865F2', height: '22px' }}>
                <DiscordIcon />
              </SvgIcon>
            )}
            {showLabel && (
              <Typography variant='body2' fontWeight='bold'>
                Discord:
              </Typography>
            )}
            {showUsername && <Typography variant='body2'>{username}</Typography>}
          </Stack>
        </CopyToClipboard>
      </Box>
    </Tooltip>
  );
}
