import { Box, SvgIcon, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import DiscordIcon from 'public/images/discord_logo.svg';

export function DiscordSocialIcon (
  { username, showLogo = true, showUsername = false }:
  { username: string, showLogo?: boolean, showUsername?: boolean }
) {
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
          <Box>
            {showLogo && (
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', height: '22px' }}>
                <DiscordIcon />
              </SvgIcon>
            )}
            {showUsername && <Typography variant='body2'>{username}</Typography>}
          </Box>
        </CopyToClipboard>
      </Box>
    </Tooltip>
  );
}
