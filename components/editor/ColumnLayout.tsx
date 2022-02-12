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
  width: 500px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(5)};
`;

export default function ColumnLayout ({ children, node }: {node: Node, children: ReactNode}) {
  return (
    <StyledColumnLayout>
      {children}
    </StyledColumnLayout>
  );
}
