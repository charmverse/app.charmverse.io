import type { Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import { memo } from 'react';

// grid-template-columns: repeat(${({ colCount }) => `${colCount}, ${Math.floor(100 / colCount)}`}fr);
const StyledColumnLayout = styled.div<{ colCount: number }>`

  & > .bangle-nv-child-container {
    height: 100%;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    & > .bangle-nv-child-container > .bangle-nv-content {
      display: grid;
      gap: ${({ theme }) => theme.spacing(3)};
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
    }
  }
`;

function ColumnLayout ({ children, node }: { node: Node, children: ReactNode }) {
  const totalChildren = (node.content as any)?.content?.length ?? 3;
  return (
    <StyledColumnLayout colCount={totalChildren}>
      {children}
    </StyledColumnLayout>
  );
}

export default memo(ColumnLayout);
