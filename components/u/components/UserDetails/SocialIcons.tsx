import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import type { StackProps } from '@mui/material';
import { Link, Stack, SvgIcon, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import DiscordIcon from 'public/images/discord_logo.svg';

import { DiscordSocialIcon } from './DiscordSocialIcon';

const iconHeight = '22px';

export function SocialIcons({
  children,
  social = {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  },
  showDiscord = true,
  showTwitter = true,
  showGithub = true,
  showLinkedIn = true,
  view = 'minified',
  direction = 'row',
  ...props
}: {
  showDiscord?: boolean;
  showTwitter?: boolean;
  showGithub?: boolean;
  showLinkedIn?: boolean;
  children?: ReactNode;
  social?: {
    twitterURL?: string;
    githubURL?: string;
    discordUsername?: string;
    linkedinURL?: string;
  };
  view?: 'minified' | 'detailed';
  direction?: StackProps['direction'];
} & StackProps) {
  if (view === 'detailed') {
    return (
      <Stack direction={direction} gap={2} my={1} {...props}>
        {showDiscord &&
          (social?.discordUsername ? (
            <DiscordSocialIcon showLabel showUsername username={social.discordUsername} />
          ) : (
            <SvgIcon color='disabled' sx={{ height: iconHeight }}>
              <DiscordIcon />
            </SvgIcon>
          ))}

        {showTwitter &&
          (social.twitterURL ? (
            <Stack direction='row' alignItems='center' spacing={0.5}>
              <Link href={social.twitterURL} target='_blank' display='flex'>
                <TwitterIcon style={{ color: '#00ACEE', height: iconHeight }} />
              </Link>
              <Typography variant='body2' fontWeight='bold'>
                Twitter:
              </Typography>
              <Typography variant='body2'>@{social.twitterURL.split('/').at(-1)}</Typography>
            </Stack>
          ) : (
            <TwitterIcon color='disabled' style={{ height: iconHeight }} />
          ))}

        {showLinkedIn &&
          (social.linkedinURL ? (
            <Stack direction='row' alignItems='center' spacing={0.5}>
              <Link href={social.linkedinURL} target='_blank' display='flex'>
                <LinkedInIcon style={{ color: '#0072B1', height: iconHeight }} />
              </Link>
              <Typography variant='body2' fontWeight='bold'>
                LinkedIn:
              </Typography>
              <Typography variant='body2'>
                {social.linkedinURL.split('/').at(social.linkedinURL[social.linkedinURL.length - 1] !== '/' ? -1 : -2)}
              </Typography>
            </Stack>
          ) : (
            <LinkedInIcon color='disabled' style={{ height: iconHeight }} />
          ))}

        {showGithub &&
          (social.githubURL ? (
            <Stack direction='row' alignItems='center' spacing={0.5}>
              <Link href={social.githubURL} target='_blank' display='flex'>
                <GitHubIcon style={{ color: '#141414', height: iconHeight }} />
              </Link>
              <Typography variant='body2' fontWeight='bold'>
                Github:
              </Typography>
              <Typography variant='body2'>@{social.githubURL.split('/').at(-1)}</Typography>
            </Stack>
          ) : (
            <GitHubIcon color='disabled' style={{ height: iconHeight }} />
          ))}
        {children}
      </Stack>
    );
  }

  return (
    <Stack direction={direction} alignItems='center' gap={2} {...props}>
      {showDiscord &&
        (social?.discordUsername ? (
          <DiscordSocialIcon username={social.discordUsername} />
        ) : (
          <SvgIcon color='disabled' sx={{ height: iconHeight }}>
            <DiscordIcon />
          </SvgIcon>
        ))}
      {showTwitter &&
        (social.twitterURL ? (
          <Link href={social.twitterURL} target='_blank' display='flex'>
            <TwitterIcon style={{ color: '#00ACEE', height: iconHeight }} />
          </Link>
        ) : (
          <TwitterIcon color='disabled' style={{ height: iconHeight }} />
        ))}
      {showLinkedIn &&
        (social?.linkedinURL ? (
          <Link href={social.linkedinURL} target='_blank' display='flex'>
            <LinkedInIcon style={{ color: '#0072B1', height: iconHeight }} />
          </Link>
        ) : (
          <LinkedInIcon color='disabled' style={{ height: iconHeight }} />
        ))}
      {showGithub &&
        (social.githubURL ? (
          <Link href={social.githubURL} target='_blank' display='flex'>
            <GitHubIcon style={{ color: '#141414', height: iconHeight }} />
          </Link>
        ) : (
          <GitHubIcon color='disabled' style={{ height: iconHeight }} />
        ))}
      {children}
    </Stack>
  );
}
