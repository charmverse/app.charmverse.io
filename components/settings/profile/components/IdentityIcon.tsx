import type { IdentityType } from '@charmverse/core/prisma';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import TelegramIcon from '@mui/icons-material/Telegram';
import { SiDiscord } from 'react-icons/si';

export function IdentityIcon({
  type,
  height = 40,
  width = 40
}: {
  type: IdentityType | null;
  height?: number;
  width?: number;
}) {
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

    case 'UnstoppableDomain':
      return (
        <img
          src='/images/walletLogos/unstoppable-domains.png'
          style={{
            width,
            height
          }}
        />
      );

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

    case 'RandomName':
    default:
      return <PersonIcon style={{ color: '#777', height, width }} />;
  }
}
