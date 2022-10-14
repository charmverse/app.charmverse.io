import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import type { StackProps } from '@mui/material';
import { Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import type { Social } from 'components/profile/interfaces';

import { DiscordSocialIcon } from './DiscordSocialIcon';

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
        <DiscordSocialIcon username={social.discordUsername} />
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
