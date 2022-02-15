import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import React, { HTMLAttributes, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import BlockAligner from './BlockAligner';
import ImageSelector from './ImageSelector';

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

export const StyledResizeHandle = styled(Box)`
  width: 7.5px;
  height: calc(100% - 15px);
  max-height: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  opacity: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 250ms ease-in-out;
  cursor: col-resize;

  &.react-resizable-handle-w {
    left: 15px;
  }

  &.react-resizable-handle-e {
    right: 15px;
  }
`;

export function Image ({ node, updateAttrs }: NodeViewProps) {
  const [dimensions, setDimensions] = useState({ width: 200, height: 200 });

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
      <Box sx={{
        '&:hover .react-resizable-handle': {
          opacity: 1,
          transition: 'opacity 250ms ease-in-out'
        }
      }}
      >
        <ResizableBox
          resizeHandles={['w', 'e']}
          lockAspectRatio
          {...dimensions}
          onResize={(_, { size }) => {
            setDimensions(size);
          }}
          minConstraints={[MIN_IMAGE_WIDTH, MIN_IMAGE_WIDTH]}
          maxConstraints={[MAX_IMAGE_WIDTH, MAX_IMAGE_WIDTH]}
          /* eslint-disable-next-line */
          handle={(handleAxis: string, ref: React.Ref<unknown>) => <StyledResizeHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
        >
          <StyledImage
            draggable={false}
            src={node.attrs.src}
            alt={node.attrs.alt}
          />
        </ResizableBox>
      </Box>
    </BlockAligner>
  );
}
