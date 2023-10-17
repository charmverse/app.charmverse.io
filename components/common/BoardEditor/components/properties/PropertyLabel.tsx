import styled from '@emotion/styled';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import Button from '../../focalboard/src/widgets/buttons/button';

type PropertyLabelProps = {
  children: ReactNode;
  readOnly?: boolean;
  required?: boolean;
  highlighted?: boolean;
};

const Wrapper = styled(({ highlighted, ...props }: any) => <Box {...props} />)<{ highlighted?: boolean }>`
  color: ${({ highlighted }) => (highlighted ? 'var(--primary-text) !important' : '')};
`;

const Asterisk = styled.span`
  color: var(--danger-text);
`;

export function PropertyLabel({ children, required, readOnly = true, highlighted }: PropertyLabelProps) {
  if (readOnly) {
    return (
      <Wrapper className='octo-propertyname octo-propertyname--readonly' highlighted={highlighted}>
        <Button rightIcon icon={required && <Asterisk>&nbsp;*</Asterisk>}>
          {children}
        </Button>
      </Wrapper>
    );
  }
  return null;
}
