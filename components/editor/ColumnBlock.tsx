import type { RawSpecs } from '@bangle.dev/core';
import {
  DOMOutputSpec, Node
} from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode, useState } from 'react';
import { StyledResizeHandle } from './ResizeHandle';

export const spec = specFactory;

const name = 'columnBlock';

function specFactory (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      }
    }
  };
}

const StyledColumnBlock = styled(Box)<{opacity: number}>`
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1, 2)};
  position: relative;
  
  & .bangle-nv-content p {
    overflow-wrap: anywhere;
  }

  &:hover .image-resize-handler {
    opacity: ${({ opacity }) => opacity};
    transition: opacity 250ms ease-in-out
  }
`;

export default function ColumnBlock ({ children, node }: {node: Node, children: ReactNode}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <StyledColumnBlock opacity={isDragging ? 0 : 1}>
      {children}
      <StyledResizeHandle pos='right' className='image-resize-handler' />
    </StyledColumnBlock>
  );
}
