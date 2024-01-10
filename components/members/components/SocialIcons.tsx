import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import type { StackProps } from '@mui/material';
import { Link, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { FaXTwitter } from 'react-icons/fa6';

import { DiscordSocialIcon } from './DiscordSocialIcon';

const iconHeight = '22px';

export function SocialIcons({
  children,
  social = {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: '',
    googleName: '',
    telegramUsername: ''
  },
  showDiscord = true,
  showTwitter = true,
  showGithub = true,
  showLinkedIn = true,
  showGoogle = true,
  showTelegram = true,
  ...props
}: {
  showDiscord?: boolean;
  showTwitter?: boolean;
  showGithub?: boolean;
  showGoogle?: boolean;
  showTelegram?: boolean;
  showLinkedIn?: boolean;
  children?: ReactNode;
  social?: {
    twitterURL?: string;
    githubURL?: string;
    discordUsername?: string;
    linkedinURL?: string;
    googleName?: string;
    telegramUsername?: string;
  };
} & StackProps) {
  return (
    <Stack direction='row' alignItems='center' gap={2} {...props}>
      {showDiscord && social?.discordUsername && <DiscordSocialIcon username={social.discordUsername} />}
      {showTwitter && social.twitterURL && (
        <Link href={social.twitterURL} target='_blank' display='flex'>
          <FaXTwitter style={{ color: '#888', height: iconHeight }} />
        </Link>
      )}
      {showLinkedIn && social?.linkedinURL && (
        <Link href={social.linkedinURL} target='_blank' display='flex'>
          <LinkedInIcon style={{ color: '#0072B1', height: iconHeight }} />
        </Link>
      )}
      {showGithub && social.githubURL && (
        <Link href={social.githubURL} target='_blank' display='flex'>
          <GitHubIcon style={{ color: '#141414', height: iconHeight }} />
        </Link>
      )}
      {showGoogle && social.googleName && (
        <img
          src='/images/walletLogos/Google_G.png'
          style={{
            width: iconHeight,
            height: iconHeight
          }}
        />
      )}
      {showGithub && social.telegramUsername && (
        <Link href={`https://t.me/${social.telegramUsername}`} target='_blank' display='flex'>
          <TelegramIcon style={{ color: '#229ED9', height: iconHeight }} />
        </Link>
      )}
      {children}
    </Stack>
  );
}
