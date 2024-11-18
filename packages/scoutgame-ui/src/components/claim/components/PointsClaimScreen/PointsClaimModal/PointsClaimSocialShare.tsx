import { Typography, Stack, IconButton } from '@mui/material';
import { getLastWeek } from '@packages/scoutgame/dates';
import Image from 'next/image';

export function PointsClaimSocialShare({
  builderPoints,
  scoutPoints,
  builders,
  userId,
  userPath
}: {
  userId: string;
  userPath: string;
  builderPoints: number;
  scoutPoints: number;
  builders: string[];
}) {
  const imageUrl = `https://cdn.charmverse.io/points-claim/${userId}/${getLastWeek()}.png`;
  const shareMessage = builderPoints
    ? `I scored ${builderPoints} Scout Points this week as a Top Builder! Discover my work and scout me to see what I'm building next!\nMy profile: https://soutgame.xyz/u/${userPath}\n\n`
    : `I scored ${scoutPoints} Scout Points this week as a Top Scout! Big shoutout to my top Builders: ${builders.join(
        ', '
      )}. Who will be next?\nMy profile: https://soutgame.xyz/u/${userPath}\n\n`;

  const handleShare = (platform: 'x' | 'telegram' | 'warpcast') => {
    const urls = {
      x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${imageUrl}`,
      telegram: `https://t.me/share/url?url=${imageUrl}&text=${encodeURIComponent(shareMessage)}`,
      warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${window.location.origin}/points-claim/${userPath}`
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <Stack
      sx={{
        justifyContent: 'center',
        p: 2,
        alignItems: 'center',
        backgroundColor: '#D8E1FF'
      }}
    >
      <Typography variant='h6' color='#000' fontWeight='bold'>
        Share your win!
      </Typography>
      <Stack flexDirection='row' justifyContent='center'>
        <IconButton onClick={() => handleShare('x')}>
          <Image src='/images/logos/x.png' alt='X' width={42.5} height={42.5} />
        </IconButton>
        <IconButton onClick={() => handleShare('telegram')}>
          <Image src='/images/logos/telegram.png' alt='Telegram' width={42.5} height={42.5} />
        </IconButton>
        <IconButton onClick={() => handleShare('warpcast')}>
          <Image src='/images/logos/warpcast.png' alt='Warpcast' width={42.5} height={42.5} />
        </IconButton>
      </Stack>
    </Stack>
  );
}
