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
      parseDOM: [{ tag: 'div.charm-column-row' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-column-row' }];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

const StyledColumnLayout = styled(Box)<{colCount: number}>`
  min-height: 60px;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)};
  margin: ${({ theme }) => theme.spacing(2, 0)};

  & > .bangle-nv-child-container {
    height: 100%;
  }

  & > .bangle-nv-child-container > .bangle-nv-content {
    display: grid;
    grid-template-columns: repeat(${({ colCount }) => colCount}, 1fr);
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

export default function ColumnLayout ({ children, node }: {node: Node, children: ReactNode}) {
  const totalChildren = (node.content as any)?.content?.length ?? 3;
  return (
    <StyledColumnLayout colCount={totalChildren}>
      {children}
    </StyledColumnLayout>
  );
}
