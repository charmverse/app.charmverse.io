import { Typography, Stack, IconButton } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from '../../../../../hooks/useMediaScreens';

type ShareMessageProps = {
  totalUnclaimedPoints: number;
  isBuilder: boolean;
  platform: 'x' | 'telegram' | 'warpcast';
  userPath: string;
  builders: { farcasterHandle?: string; displayName: string }[];
  week: string;
};

export function PointsClaimSocialShare(props: Omit<ShareMessageProps, 'platform'>) {
  const isMd = useMdScreen();

  const handleShare = (platform: 'x' | 'telegram' | 'warpcast') => {
    const shareUrl = getShareMessage({ ...props, platform });
    window.open(shareUrl, '_blank');
  };

  const size = !isMd ? 30 : 42.5;

  return (
    <Stack
      sx={{
        justifyContent: 'center',
        p: {
          xs: 1,
          md: 2
        },
        alignItems: 'center',
        backgroundColor: '#D8E1FF'
      }}
    >
      <Typography variant={isMd ? 'h6' : 'subtitle1'} color='#000' fontWeight='bold'>
        Share your win!
      </Typography>
      <Stack flexDirection='row' justifyContent='center'>
        <IconButton onClick={() => handleShare('x')}>
          <Image src='/images/logos/x.png' alt='X' width={size} height={size} />
        </IconButton>
        <IconButton onClick={() => handleShare('telegram')}>
          <Image src='/images/logos/telegram.png' alt='Telegram' width={size} height={size} />
        </IconButton>
        <IconButton onClick={() => handleShare('warpcast')}>
          <Image src='/images/logos/warpcast.png' alt='Warpcast' width={size} height={size} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function getShareMessage({ totalUnclaimedPoints, isBuilder, platform, userPath, builders, week }: ShareMessageProps) {
  const imageUrl = `${window.location.origin}/points-claim/${userPath}?week=${week}`;
  let shareMessage = isBuilder
    ? `I scored ${totalUnclaimedPoints} Scout Points this week as a Top Builder!`
    : `I scored ${totalUnclaimedPoints} Scout Points this week as a Top Scout!`;
  // Twitter discounts tweets with links
  if (platform === 'x') {
    shareMessage += `\n\nJoin me on @scoutgamexyz\n\n`;
  } else if (isBuilder) {
    shareMessage += ` Discover my work and scout me to see what I'm building next!\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  } else {
    const buildersFormatted =
      platform === 'warpcast'
        ? builders
            .map((builder) => (builder.farcasterHandle ? `@${builder.farcasterHandle}` : builder.displayName))
            .join(', ')
        : builders.map((builder) => builder.displayName).join(', ');
    shareMessage += ` Big shoutout to my top Builders: ${buildersFormatted}. Who will be next?\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  }
  const urls = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(shareMessage)}`,
    warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(
      imageUrl
    )}`
  };
  return urls[platform];
}
