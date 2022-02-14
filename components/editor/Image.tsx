import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import useResize from 'hooks/useResize';
import React, { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import ImageSelector from './ImageSelector';
import { ResizeHandle } from './ResizeHandle';

const MAX_IMAGE_WIDTH = 750; const
  MIN_IMAGE_WIDTH = 250;

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
  object-fit: contain;
  width: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export function Image ({ node, updateAttrs }: NodeViewProps) {
  const resizeState = useResize({ initialWidth: 500 });

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
      <Box
        sx={{
          position: 'relative',
          cursor: 'col-resize',
          width: resizeState.width,
          '&:hover .resize-handler': {
            opacity: resizeState.isDragging ? 0 : 1,
            transition: 'opacity 250ms ease-in-out'
          }
        }}
      >
        <ResizeHandle maxWidth={MAX_IMAGE_WIDTH} minWidth={MIN_IMAGE_WIDTH} {...resizeState} position='left' />
        <StyledImage
          draggable={false}
          src={node.attrs.src}
          alt={node.attrs.alt}
        />
        <ResizeHandle maxWidth={MAX_IMAGE_WIDTH} minWidth={MIN_IMAGE_WIDTH} {...resizeState} position='right' />
      </Box>
    </BlockAligner>
  );
}
