import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import type { StackProps } from '@mui/material';
import { Box, Link, Stack, SvgIcon, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import type { Social } from 'components/profile/interfaces';
import DiscordIcon from 'public/images/discord_logo.svg';

export function SocialIcons ({
  children,
  social = {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  },
  ...props
}: {
  children?: ReactNode;
  social?: {
    twitterURL?: string;
    githubURL?: string;
    discordUsername?: string;
    linkedinURL?: string;
  };
} & StackProps) {
  const [isDiscordUsernameCopied, setIsDiscordUsernameCopied] = useState(false);

  const onDiscordUsernameCopy = () => {
    setIsDiscordUsernameCopied(true);
    setTimeout(() => setIsDiscordUsernameCopied(false), 1000);
  };

  const hasAnySocialInformation = (model: Social) => model.twitterURL || model.githubURL || model.discordUsername || model.linkedinURL;

  return (
    <Stack direction='row' alignItems='center' gap={2} {...props}>
      {social && social.twitterURL && (
        <Link href={social.twitterURL} target='_blank' display='flex'>
          <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
        </Link>
      )}
      {
      social && social.githubURL && (
        <Link href={social.githubURL} target='_blank' display='flex'>
          <GitHubIcon style={{ color: '#888', height: '22px' }} />
        </Link>
      )
    }
      {
      social && social.discordUsername && (
        <Tooltip
          placement='top'
          title={isDiscordUsernameCopied ? 'Copied' : `Click to copy: ${social.discordUsername}`}
          disableInteractive
          arrow
        >
          <Box sx={{ display: 'initial' }}>
            <CopyToClipboard text={social.discordUsername} onCopy={onDiscordUsernameCopy}>
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', height: '22px' }}>
                <DiscordIcon />
              </SvgIcon>
            </CopyToClipboard>
          </Box>
        </Tooltip>
      )
    }
      {
      social && social.linkedinURL && (
        <Link href={social.linkedinURL} target='_blank' display='flex'>
          <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
        </Link>
      )
    }
      {
      !hasAnySocialInformation(social) && <Typography>No social media links</Typography>
    }
      {children}
    </Stack>
  );
}
