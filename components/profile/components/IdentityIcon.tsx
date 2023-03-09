import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import TelegramIcon from '@mui/icons-material/Telegram';
import type { IdentityType } from '@prisma/client';
import { SiDiscord } from 'react-icons/si';

export function IdentityIcon({ type }: { type: IdentityType | null }) {
  switch (type) {
    case 'Wallet':
      return <AccountBalanceWalletIcon color='primary' sx={{ height: '40px', width: '40px' }} />;

    case 'Discord':
      return <SiDiscord color='#5865F2' size={40} />;

    case 'Telegram':
      return <TelegramIcon sx={{ color: '#229ED9', height: '40px', width: '40px' }} />;

    case 'UnstoppableDomain':
      return <img src='/images/walletLogos/unstoppable-domains.png' height={40} width={40} />;

    case 'Google':
      return <img src='/images/walletLogos/Google_G.png' height={40} width={40} />;

    case 'RandomName':
    default:
      return <PersonIcon sx={{ color: '#777', height: '40px', width: '40px' }} />;
  }
}
