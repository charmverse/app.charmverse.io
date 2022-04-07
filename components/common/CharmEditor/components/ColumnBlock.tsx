import type { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode, memo } from 'react';

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
      parseDOM: [{ tag: 'div.charm-column' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-column', 0];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

const StyledColumnBlock = styled.div`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  position: relative;
  transition: background-color 250ms ease-in-out;

  &:hover {
    transition: background-color 250ms ease-in-out;
    background-color: ${({ theme }) => theme.palette.background.light};
  }

  & .bangle-nv-content p {
    overflow-wrap: anywhere;
  }

  margin: 0 -4px;

  > div {
    padding: 0 4px;
  }
`;

function ColumnBlock ({ children, node }: {node: Node, children: ReactNode}) {
  return (
    <StyledColumnBlock>
      <div>
        {children}
      </div>
    </StyledColumnBlock>
  );
}

export default memo(ColumnBlock);
