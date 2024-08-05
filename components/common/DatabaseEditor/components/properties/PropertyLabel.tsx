import styled from '@emotion/styled';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import Button from '../../widgets/buttons/button';

type PropertyLabelProps = {
  children?: ReactNode;
  readOnly?: boolean;
  required?: boolean;
  highlighted?: boolean;
  fullWidth?: boolean;
};

const Wrapper = styled(({ highlighted, fullWidth, ...props }: any) => <Box {...props} />)<{
  fullWidth?: boolean;
  highlighted?: boolean;
}>`
  ${({ highlighted }) => (highlighted ? 'color: var(--primary-text) !important;' : '')};
  ${({ fullWidth }) => (fullWidth ? 'width: auto !important;' : '')}
`;

const Asterisk = styled.span`
  color: var(--danger-text);
`;

export function PropertyLabel({ children, required, fullWidth, readOnly = true, highlighted }: PropertyLabelProps) {
  if (readOnly) {
    return (
      <Wrapper
        className='octo-propertyname octo-propertyname--readonly'
        highlighted={highlighted}
        fullWidth={fullWidth}
      >
        <Button rightIcon icon={required && <Asterisk>&nbsp;*</Asterisk>}>
          {children}
        </Button>
      </Wrapper>
    );
  }
  return null;
}
