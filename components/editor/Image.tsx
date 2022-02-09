import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import React, { HTMLAttributes, useState } from 'react';
import ImageSelector from './ImageSelector';

const MAX_IMAGE_WIDTH = 750; const
  MIN_IMAGE_WIDTH = 250;

const StyledImageContainer = styled.div<{ align?: string }>`
  display: flex;
  justify-content: ${props => props.align};
  &:hover .controls {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 250ms ease-in-out;
`;

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
  box-shadow: ${({ theme }) => theme.shadows[3]};
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

const StyledImageResizeHandle = styled(Box)<{pos: 'right' | 'left'}>`
  width: 7.5px;
  height: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 250ms ease-in-out;
  ${({ pos }) => pos === 'left' ? 'left: 15px' : 'right: 15px'};
`;

interface ImageResizeHandleProps {
  imageWidth: number
  setImageWidth: React.Dispatch<React.SetStateAction<number>>
  setClientX: React.Dispatch<React.SetStateAction<number>>
  clientX: number,
  position: 'right' | 'left'
  isDragging: boolean
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
}

function ImageResizeHandle (
  { isDragging, setIsDragging, position, imageWidth, setClientX, setImageWidth, clientX }: ImageResizeHandleProps
) {
  return (
    <>
      {/** Adding StyledImageResizeHandle twice to hide image ghost while dragging  */}
      <StyledImageResizeHandle
        pos={position}
        /** custom class required to show resize handler when hovering over the image */
        className='image-resize-handler'
      />
      <StyledImageResizeHandle
        pos={position}
        onDragEnd={() => {
          if (isDragging) {
            setIsDragging(false);
          }
        }}
        onDrag={(e) => {
          if (!isDragging) {
            setIsDragging(true);
          }
          // Make sure the image is not below 250px, and above 750px
          if (imageWidth >= MIN_IMAGE_WIDTH && imageWidth <= MAX_IMAGE_WIDTH) {
            let difference = clientX - e.clientX;
            // Making sure the difference isn't too abrupt clipping the difference to a limit
            difference = difference < -5 ? -5 : difference > 5 ? 5 : difference;
            // Avoid updating state when the clientX value are the same
            // This happens when the user is dragging but staying still
            if (clientX !== e.clientX) {
              let newImageWidth = imageWidth;
              if (position === 'right') {
                // left to right movement. Increasing image size
                if (difference < 0) {
                  newImageWidth -= difference;
                }
                // Right to left movement. Decreasing image size
                else {
                  newImageWidth -= difference;
                }
              }
              else if (position === 'left') {
                // right to left movement. Increasing image size
                if (difference > 0) {
                  newImageWidth += difference;
                }
                // Left to right movement. Decreasing image size
                else {
                  newImageWidth += difference;
                }
              }
              // Making sure that the image width is within a certain range
              if (newImageWidth < MIN_IMAGE_WIDTH) {
                newImageWidth = MIN_IMAGE_WIDTH;
              }
              else if (newImageWidth > MAX_IMAGE_WIDTH) {
                newImageWidth = MAX_IMAGE_WIDTH;
              }
              setImageWidth(newImageWidth);

              setClientX(e.clientX);
            }
          }
        }}
        draggable
      />
    </>
  );
}

export function Image ({ node, updateAttrs }: NodeViewProps) {
  const [align, setAlign] = useState('center');
  const theme = useTheme();
  // State to keep track of the current image width
  const [imageWidth, setImageWidth] = useState(500);
  // State to keep track of the current dragged mouse position
  const [clientX, setClientX] = useState<number>(0);
  // Is dragging is used to hide the resize handles while dragging
  const [isDragging, setIsDragging] = useState(false);

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

  const imageResizeHandleProps: Omit<ImageResizeHandleProps, 'position'> = {
    clientX,
    imageWidth,
    setClientX,
    setImageWidth,
    isDragging,
    setIsDragging
  };

  return (
    <StyledImageContainer
      align={align}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className='content' style={{ position: 'relative' }}>
        { /* eslint-disable-next-line */}
        <Box 
          sx={{
            position: 'relative',
            cursor: 'col-resize',
            width: imageWidth,
            '&:hover .image-resize-handler': {
              opacity: isDragging ? 0 : 1,
              transition: 'opacity 250ms ease-in-out'
            }
          }}
        >
          <ImageResizeHandle {...imageResizeHandleProps} position='left' />
          <StyledImage
            draggable={false}
            src={node.attrs.src}
            alt={node.attrs.alt}
          />
          <ImageResizeHandle {...imageResizeHandleProps} position='right' />
        </Box>
        <Controls className='controls'>
          {[
            [
              'start', <AlignHorizontalLeftIcon sx={{
                fontSize: 14
              }}
              />
            ], [
              'center', <AlignHorizontalCenterIcon sx={{
                fontSize: 14
              }}
              />
            ], [
              'end', <AlignHorizontalRightIcon
                sx={{
                  fontSize: 14
                }}
              />
            ]
          ].map(([alignLabel, alignIcon]) => (
            <ListItem
              key={alignLabel as string}
              sx={{
                padding: theme.spacing(1),
                backgroundColor: align === alignLabel ? theme.palette.background.dark : 'inherit'
              }}
              button
              disableRipple
              onClick={() => {
                setAlign(alignLabel as string);
              }}
            >
              {alignIcon}
            </ListItem>
          ))}
          <ListItem
            button
            disableRipple
            onClick={() => {
              updateAttrs({
                src: null
              });
            }}
            sx={{
              padding: theme.spacing(1),
              backgroundColor: 'inherit'
            }}
          >
            <DeleteIcon sx={{
              fontSize: 14
            }}
            />
          </ListItem>
        </Controls>
      </div>
    </StyledImageContainer>
  );
}
