import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Box from '@mui/material/Box';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import type { ElementType } from 'react';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import GitCoindPassportIcon from 'public/images/logos/gitcoin_passport.svg';
import GrantorIcon from 'public/images/template_icons/grantor_icon.svg';
import NFTCommunityIcon from 'public/images/template_icons/nft_community_icon.svg';
import CommunitiesIcon from 'public/images/template_icons/nounish_icon.svg';

import { useTokenGateModal, type DisplayedPage } from '../hooks/useTokenGateModalContext';

import { TokenGateFooter } from './TokenGateFooter';

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
    name: 'communities',
    title: 'Communities',
    icon: CommunitiesIcon,
    iconColor: 'error'
  },
  {
    name: 'credentials',
    title: 'Credentials',
    icon: GitCoindPassportIcon
  }
];

export function TokenGateHome() {
  const { setDisplayedPage, flow } = useTokenGateModal();

  const goBack = () => setDisplayedPage('review');
  const onCancel = flow === 'single' ? undefined : goBack;

  return (
    <>
      <FieldLabel>Select Requirements</FieldLabel>
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
      <TokenGateFooter onCancel={onCancel} />
    </>
  );
}
