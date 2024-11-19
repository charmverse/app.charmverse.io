import { Typography, Stack, IconButton } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from 'hooks/useMediaScreens';

type ShareMessageProps = {
  builderPoints: number;
  scoutPoints: number;
  platform: 'x' | 'telegram' | 'warpcast';
  userPath: string;
  builders: string[];
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

function getShareMessage({ builderPoints, scoutPoints, platform, userPath, builders }: ShareMessageProps) {
  const imageUrl = `https://scoutgame.xyz/points-claim/${userPath}`;
  let shareMessage = builderPoints
    ? `I scored ${builderPoints} Scout Points this week as a Top Builder!`
    : `I scored ${scoutPoints} Scout Points this week as a Top Scout!`;
  // Twitter discounts tweets with links
  if (platform === 'x') {
    shareMessage += `\n\nJoin me on @scoutgamexyz\n\n`;
  } else if (builderPoints) {
    shareMessage += ` Discover my work and scout me to see what I'm building next!\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  } else {
    shareMessage += ` Big shoutout to my top Builders: ${builders.join(
      ', '
    )}. Who will be next?\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  }
  const urls = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
    telegram: `https://t.me/share/url?url=${imageUrl}&text=${encodeURIComponent(shareMessage)}`,
    warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${window.location.origin}/points-claim/${userPath}`
  };
  return urls[platform];
}
