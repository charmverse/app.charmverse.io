import type { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode } from 'react';

export const spec = specFactory;

const name = 'columnLayout';

function specFactory (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'columnBlock*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      }
    }
  };
}

const StyledColumnLayout = styled(Box)`
  min-height: 100px;
  background-color: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)};

  & .bangle-nv-child-container .bangle-nv-content {
    display: flex;
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

export default function ColumnLayout ({ children, node }: {node: Node, children: ReactNode}) {
  return (
    <StyledColumnLayout>
      {children}
    </StyledColumnLayout>
  );
}
