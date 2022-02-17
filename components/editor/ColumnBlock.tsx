import type { RawSpecs } from '@bangle.dev/core';
import {
  DOMOutputSpec, Node
} from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode } from 'react';

export const spec = specFactory;

const name = 'columnBlock';

function specFactory (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      draggable: true,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      }
    }
  };
}

const StyledColumnBlock = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1, 2)};
  position: relative;
  
  & .bangle-nv-content p {
    overflow-wrap: anywhere;
  }
`;

export default function ColumnBlock ({ children, node }: {node: Node, children: ReactNode}) {
  return (
    <StyledColumnBlock>
      {children}
    </StyledColumnBlock>
  );
}
