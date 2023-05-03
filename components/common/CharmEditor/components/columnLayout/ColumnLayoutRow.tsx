import type { Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import { memo } from 'react';

// grid-template-columns: repeat(${({ colCount }) => `${colCount}, ${Math.floor(100 / colCount)}`}fr);
const StyledColumnLayoutRow = styled.div<{ colCount: number }>`
  & > .bangle-nv-child-container {
    height: 100%;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    & > .bangle-nv-child-container > .bangle-nv-content {
      display: flex;
      gap: ${({ theme }) => theme.spacing(3)};

      .charm-column {
        flex: 1 1 0;
      }
    }
  }
`;

function ColumnLayoutRow({ children, node }: { node: Node; children: ReactNode }) {
  const totalChildren = (node.content as any)?.content?.length ?? 3;
  return <StyledColumnLayoutRow colCount={totalChildren}>{children}</StyledColumnLayoutRow>;
}

export default memo(ColumnLayoutRow);
