import { Box, SvgIcon, Typography } from '@mui/material';
import type { ElementType } from 'react';

import { Button } from 'components/common/Button';
import GrantorIcon from 'public/images/template_icons/grantor_icon.svg';
import LightBulbIcon from 'public/images/template_icons/light_bulb_icon_bnw.svg';
import NFTCommunityIcon from 'public/images/template_icons/nft_community_icon.svg';

import { useTokenGateModal, type DisplayedPage } from '../hooks/useTokenGateModalContext';

type ButtonProps = {
  name: DisplayedPage;
  title: string;
  icon: ElementType;
};

const requirementButton: ButtonProps[] = [
  {
    name: 'collectables',
    title: 'Digital Collectibles (i.e. NFTs, POAPs, ETC)',
    icon: NFTCommunityIcon
  },
  {
    name: 'tokens',
    title: 'Tokens (i.e. ERC-20s)',
    icon: GrantorIcon
  },
  {
    name: 'advanced',
    title: 'Advanced',
    icon: LightBulbIcon
  }
];

export function TokenGateHome() {
  const { setDisplayedPage } = useTokenGateModal();

  return (
    <Box display='flex' flexDirection='column' gap={3}>
      <Typography variant='h5'>Select Requirements</Typography>
      {requirementButton.map((btn) => (
        <Box key={btn.name}>
          <Button
            variant='outlined'
            fullWidth
            size='large'
            color='inherit'
            sx={{ justifyContent: 'left', px: 3, py: 2 }}
            startIcon={<SvgIcon component={btn.icon} inheritViewBox />}
            onClick={() => setDisplayedPage(btn.name)}
          >
            {btn.title}
          </Button>
        </Box>
      ))}
    </Box>
  );
}
