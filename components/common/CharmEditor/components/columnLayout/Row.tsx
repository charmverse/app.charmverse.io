import { Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { ReactNode, memo } from 'react';

// grid-template-columns: repeat(${({ colCount }) => `${colCount}, ${Math.floor(100 / colCount)}`}fr);
const StyledRow = styled.div<{colCount: number}>`

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

function Row ({ children, node }: {node: Node, children: ReactNode}) {
  const totalChildren = (node.content as any)?.content?.length ?? 3;
  console.log(node.content?.content);
  return (
    <StyledRow colCount={totalChildren}>
      {children}
    </StyledRow>
  );
}

export default memo(Row);
