import styled from '@emotion/styled';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import Button from '../../focalboard/src/widgets/buttons/button';

type PropertyLabelProps = {
  children: ReactNode;
  readOnly?: boolean;
  highlighted?: boolean;
};

const Wrapper = styled(Box)<{ highlighted?: boolean }>`
  color: ${({ highlighted }) => (highlighted ? 'var(--primary-text) !important' : '')};
`;

export function PropertyLabel({ children, readOnly = true, highlighted }: PropertyLabelProps) {
  if (readOnly) {
    return (
      <Wrapper className='octo-propertyname octo-propertyname--readonly' highlighted={highlighted}>
        <Button>{children}</Button>
      </Wrapper>
    );
  }
  return null;
}
