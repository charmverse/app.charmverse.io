import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import type { SvgIconProps, SvgIconPropsColorOverrides } from '@mui/material';
import { Box, SvgIcon, Typography } from '@mui/material';
import type { ElementType } from 'react';

import { Button } from 'components/common/Button';
import GrantorIcon from 'public/images/template_icons/grantor_icon.svg';
import NFTCommunityIcon from 'public/images/template_icons/nft_community_icon.svg';

import { useTokenGateModal, type DisplayedPage } from '../hooks/useTokenGateModalContext';

type ButtonProps = {
  name: DisplayedPage;
  title: string;
  icon: ElementType;
  iconColor?: SvgIconProps['color'];
};

const requirementButton: ButtonProps[] = [
  {
    name: 'collectables',
    title: 'Digital Collectibles (i.e. NFTs, POAPs)',
    icon: NFTCommunityIcon
  },
  {
    name: 'tokens',
    title: 'Tokens (i.e. ERC-20s)',
    icon: GrantorIcon
  },
  {
    name: 'wallet',
    title: 'Wallet',
    icon: AccountBalanceWalletIcon,
    iconColor: 'primary'
  },
  {
    name: 'dao',
    title: 'MolochDAOv2.1',
    icon: WaterDropIcon,
    iconColor: 'error'
  }
];

export function TokenGateHome() {
  const { setDisplayedPage } = useTokenGateModal();

  return (
    <>
      <Typography variant='h5'>Select Requirements</Typography>
      {requirementButton.map((btn) => (
        <Box key={btn.name}>
          <Button
            variant='outlined'
            fullWidth
            size='large'
            color='inherit'
            sx={{ justifyContent: 'left', px: 3, py: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}
            startIcon={<SvgIcon component={btn.icon} inheritViewBox color={btn.iconColor} />}
            onClick={() => setDisplayedPage(btn.name)}
          >
            {btn.title}
          </Button>
        </Box>
      ))}
    </>
  );
}
