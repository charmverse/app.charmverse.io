import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { Box, Card, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import type { NFTData } from '@packages/lib/blockchain/getNFTs';

type Props = {
  nft: NFTData;
  isSelected: boolean;
  onClick: () => void;
};

export function NftGalleryItem({ nft, isSelected, onClick }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const onAvatarClick = () => {
    if (!isSelected) {
      onClick();
    }
  };

  return (
    <Card
      sx={{ p: 1, cursor: isSelected ? 'auto' : 'pointer', position: 'relative', height: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      raised={isHovered || isSelected}
      onClick={onAvatarClick}
    >
      <Stack>
        <Box sx={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
          <Avatar avatar={nft.image ?? nft.imageThumb} isNft size='xLarge' />
        </Box>

        <Typography noWrap variant='subtitle1'>
          {nft.title}
        </Typography>
        <Typography noWrap variant='subtitle2'>
          {nft.tokenId ? `#${nft.tokenId}` : ''}
        </Typography>
      </Stack>

      {isSelected && (
        <Box position='absolute' top={3} right={3}>
          <CheckBoxIcon />
        </Box>
      )}
    </Card>
  );
}
