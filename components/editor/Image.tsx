import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import React, { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import ImageSelector from './ImageSelector';
import Resizer from './Resizer';

const MAX_IMAGE_SIZE = 750; const
  MIN_IMAGE_SIZE = 250;

const StyledEmptyImageContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyImageContainer (props: HTMLAttributes<HTMLDivElement>) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5)
      }}
      {...props}
    >
      <StyledEmptyImageContainer>
        <ImageIcon fontSize='small' />
        <Typography>
          Add an image
        </Typography>
      </StyledEmptyImageContainer>
    </ListItem>
  );
}

const StyledImage = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
  box-shadow: ${({ theme }) => theme.shadows[3]}
`;

export function Image ({ node, updateAttrs }: NodeViewProps) {
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <ImageSelector onImageSelect={(imageSrc) => {
        updateAttrs({
          src: imageSrc
        });
      }}
      >
        <EmptyImageContainer />
      </ImageSelector>
    );
  }

  return (
    <BlockAligner onDelete={() => {
      updateAttrs({
        src: null
      });
    }}
    >
      <Resizer initialSize={MIN_IMAGE_SIZE} maxSize={MAX_IMAGE_SIZE} minSize={MIN_IMAGE_SIZE}>
        <StyledImage
          draggable={false}
          src={node.attrs.src}
          alt={node.attrs.alt}
        />
      </Resizer>
    </BlockAligner>
  );
}
