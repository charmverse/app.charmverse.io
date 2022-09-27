import type { Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import { memo } from 'react';

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

function ColumnBlock ({ children, node }: { node: Node, children: ReactNode }) {
  return (
    <StyledColumnBlock>
      <div>
        {children}
      </div>
    </StyledColumnBlock>
  );
}

export default memo(ColumnBlock);
