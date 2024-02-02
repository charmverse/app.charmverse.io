import TelegramIcon from '@mui/icons-material/Telegram';
import XIcon from '@mui/icons-material/X';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { capitalize } from 'lib/utilities/strings';

type ShareSite = 'twitter' | 'telegram' | 'farcaster';

const siteIconsRecord: Record<ShareSite, ReactNode> = {
  twitter: <XIcon fontSize='small' sx={{ fill: 'white', fontSize: 16 }} />,
  farcaster: <img src='/images/logos/farcaster.svg' width={20} height={20} />,
  telegram: <TelegramIcon fontSize='small' sx={{ fill: 'white' }} />
};

export function ProposalSocialShareLink({
  sx,
  proposalTitle,
  proposalLink,
  site
}: {
  proposalTitle: string;
  proposalLink: string;
  site: 'twitter' | 'telegram' | 'farcaster';
  sx?: SxProps;
}) {
  const { space } = useCurrentSpace();
  const linkText = `${proposalTitle || 'Untitled'} from ${
    space?.name
  } is now open for feedback.\nView on CharmVerse:\n`;
  const urlEncodedText = encodeURIComponent(linkText);

  const shareLink =
    site === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${urlEncodedText}&url=${encodeURIComponent(proposalLink)}`
      : site === 'farcaster'
      ? `https://warpcast.com/~/compose?text=${urlEncodedText}&embeds%5B%5D=${encodeURIComponent(proposalLink)}`
      : `https://t.me/share/url?text=${urlEncodedText}&url=${encodeURIComponent(proposalLink)}`;

  return (
    <Tooltip title={`Share on ${capitalize(site)}`}>
      <div>
        <Link href={shareLink} target='_blank'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 35,
              height: 35,
              borderRadius: '50%',
              ...(site === 'twitter'
                ? {
                    backgroundColor: '#000'
                  }
                : site === 'telegram'
                ? {
                    backgroundColor: '#229ED9'
                  }
                : {
                    backgroundColor: '#8660cd'
                  }),
              ...sx
            }}
          >
            {siteIconsRecord[site]}
          </Box>
        </Link>
      </div>
    </Tooltip>
  );
}
