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
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      },
      attrs: {
        width: {
          default: 266.666667
        }
      }
    }
  };
}

const StyledColumnBlock = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  height: 250px;
  width: 256px;
`;

export default function ColumnBlock ({ children, node }: {node: Node, children: ReactNode}) {
  return (
    <StyledColumnBlock>
      {children}
    </StyledColumnBlock>
  );
}
