import styled from '@emotion/styled';
import { Box } from '@mui/system';
import React from 'react';

export const StyledResizeHandle = styled(Box)<{pos: 'right' | 'left'}>`
  width: 7.5px;
  height: calc(100% - 15px);
  max-height: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 250ms ease-in-out;
  ${({ pos }) => pos === 'left' ? 'left: 15px' : 'right: 15px'};
  cursor: col-resize;
`;

interface ResizeHandleProps {
  width: number
  setWidth: React.Dispatch<React.SetStateAction<number>>
  setClientX: React.Dispatch<React.SetStateAction<number>>
  clientX: number,
  position: 'right' | 'left'
  isDragging: boolean
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  minWidth: number
  maxWidth: number
}

export function ResizeHandle (
  { minWidth, maxWidth, isDragging, setIsDragging, position, width, setClientX, setWidth, clientX }: ResizeHandleProps
) {
  return (
    <>
      {/** Adding StyledResizeHandle twice to hide image ghost while dragging  */}
      <StyledResizeHandle
        pos={position}
        /** custom class required to show resize handler when hovering over the image */
        className='resize-handler'
      />
      <StyledResizeHandle
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
          // Make sure the width is within certain limits
          if (width >= minWidth && width <= maxWidth) {
            let difference = clientX - e.clientX;
            // Making sure the difference isn't too abrupt clipping the difference to a limit
            difference = difference < -5 ? -5 : difference > 5 ? 5 : difference;
            // Avoid updating state when the clientX value are the same
            // This happens when the user is dragging but staying still
            if (clientX !== e.clientX) {
              let newWidth = width;
              if (position === 'right') {
                // left to right movement. Increasing width
                if (difference < 0) {
                  newWidth -= difference;
                }
                // Right to left movement. Decreasing width
                else {
                  newWidth -= difference;
                }
              }
              else if (position === 'left') {
                // right to left movement. Increasing width
                if (difference > 0) {
                  newWidth += difference;
                }
                // Left to right movement. Decreasing width
                else {
                  newWidth += difference;
                }
              }
              // Making sure that the width is within a certain range
              if (newWidth < minWidth) {
                newWidth = minWidth;
              }
              else if (newWidth > maxWidth) {
                newWidth = maxWidth;
              }
              setWidth(newWidth);

              setClientX(e.clientX);
            }
          }
        }}
        draggable
      />
    </>
  );
}
