import type { IdentityType } from '@charmverse/core/prisma';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import TelegramIcon from '@mui/icons-material/Telegram';
import { SiDiscord } from 'react-icons/si';

export type IdentityIconSize = 'medium' | 'small' | 'xSmall';

const sizeStyleMap: Record<
  IdentityIconSize,
  {
    height: number;
    width: number;
  }
> = {
  medium: {
    height: 40,
    width: 40
  },
  small: {
    height: 24,
    width: 24
  },
  xSmall: {
    height: 20,
    width: 20
  }
};

export function IdentityIcon({
  type,
  size = 'medium'
}: {
  type: IdentityType | null;
  size?: IdentityIconSize | number;
}) {
  const { height, width } =
    typeof size === 'number'
      ? {
          height: size,
          width: size
        }
      : sizeStyleMap[size];

  switch (type) {
    case 'Wallet':
      return <AccountBalanceWalletIcon color='primary' style={{ height, width }} />;

    case 'Discord':
      return (
        <SiDiscord
          color='#5865F2'
          style={{
            width,
            height
          }}
        />
      );

    case 'Telegram':
      return <TelegramIcon style={{ color: '#229ED9', height, width }} />;

    case 'Google':
      return (
        <img
          src='/images/walletLogos/Google_G.png'
          style={{
            width,
            height
          }}
        />
      );

    case 'VerifiedEmail':
      return <EmailIcon style={{ height, width }} />;

    case 'Lens': {
      return (
        <img
          src='/images/logos/lens_logo.png'
          style={{
            width,
            height
          }}
        />
      );
    }

    case 'Farcaster': {
      return (
        <img
          src='/images/logos/farcaster_logo.png'
          style={{
            width,
            height
          }}
        />
      );
    }

    case 'RandomName':
    default:
      return <PersonIcon style={{ color: '#777', height, width }} />;
  }
}
