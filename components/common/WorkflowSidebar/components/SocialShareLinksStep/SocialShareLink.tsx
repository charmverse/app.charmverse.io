import TelegramIcon from '@mui/icons-material/Telegram';
import { Box, SvgIcon } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode } from 'react';
import { BsTwitterX } from 'react-icons/bs';

import Link from 'components/common/Link';
import { capitalize } from 'lib/utils/strings';
import FarcasterLogo from 'public/images/logos/farcaster.svg';

type ShareSite = 'x' | 'telegram' | 'warpcast';

const siteIconsRecord: Record<ShareSite, ReactNode> = {
  x: <BsTwitterX style={{ fill: 'white', fontSize: 16 }} />,
  warpcast: (
    <SvgIcon
      sx={{
        fill: '#fff'
      }}
      viewBox='0 0 20 20'
      fontSize='small'
    >
      <FarcasterLogo />
    </SvgIcon>
  ),
  telegram: <TelegramIcon fontSize='small' sx={{ fill: 'white' }} />
};

export function SocialShareLink({ text, link, site }: { text: string; link: string; site: ShareSite }) {
  const urlEncodedText = encodeURIComponent(text);

  const shareLink =
    site === 'x'
      ? `https://twitter.com/intent/tweet?text=${urlEncodedText}&url=${encodeURIComponent(link)}`
      : site === 'warpcast'
        ? `https://warpcast.com/~/compose?text=${urlEncodedText}&embeds%5B%5D=${encodeURIComponent(link)}`
        : `https://t.me/share/url?text=${urlEncodedText}&url=${encodeURIComponent(link)}`;

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
              backgroundColor: site === 'x' ? '#000' : site === 'telegram' ? '#0088cc' : '#8660cd'
            }}
          >
            {siteIconsRecord[site]}
          </Box>
        </Link>
      </div>
    </Tooltip>
  );
}
