import React, { useState } from 'react';
import styled from '@emotion/styled';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { NftData } from 'lib/nft/types';
import Avatar from 'components/common/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/system/Box';

const StyledAvatarItem = styled(Avatar)`
  width: 80px;
  height: 80px;
`;

type Props = {
  nft: NftData;
  isSelected: boolean;
  onClick: () => void;
};

export function NftGalleryItem ({ nft, isSelected, onClick }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      sx={{ p: 1, cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      raised={isHovered || isSelected}
      onClick={onClick}
    >
      <Stack>
        <Box sx={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
          <StyledAvatarItem avatar={nft.image} variant='hexagon' size='large' />
        </Box>

        <Typography noWrap variant='subtitle1'>
          {nft.title}
        </Typography>
        <Typography noWrap variant='subtitle2'>
          {nft.tokenIdInt ? `#${nft.tokenIdInt}` : ''}
        </Typography>

      </Stack>
    </Card>
  );
}
