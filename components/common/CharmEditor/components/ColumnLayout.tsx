import type { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
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
// grid-template-columns: repeat(${({ colCount }) => `${colCount}, ${Math.floor(100 / colCount)}`}fr);
const StyledColumnLayout = styled.div<{colCount: number}>`
  min-height: 60px;

  & > .bangle-nv-child-container {
    height: 100%;
  }

  & > .bangle-nv-child-container > .bangle-nv-content {
    display: grid;
    gap: ${({ theme }) => theme.spacing(3)};
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
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
