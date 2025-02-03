import styled from '@emotion/styled';
import { Box, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';

import Button from '../../widgets/buttons/button';

type PropertyLabelProps = {
  children?: ReactNode;
  readOnly?: boolean;
  required?: boolean;
  highlighted?: boolean;
  fullWidth?: boolean;
  tooltip?: string;
  deleted?: boolean; // when showing deleted card properties
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

export function PropertyLabel({
  children,
  required,
  fullWidth,
  tooltip,
  readOnly = true,
  highlighted,
  deleted
}: PropertyLabelProps) {
  if (readOnly) {
    const deletedTooltip = deleted ? 'This property was deleted' : tooltip;
    return (
      <Wrapper
        className='octo-propertyname octo-propertyname--readonly'
        highlighted={highlighted}
        fullWidth={fullWidth}
      >
        <Tooltip title={tooltip || deletedTooltip} disableInteractive>
          <span>
            <Button rightIcon icon={required && <Asterisk>&nbsp;*</Asterisk>} deleted={deleted}>
              {children}
            </Button>
          </span>
        </Tooltip>
      </Wrapper>
    );
  }
  return null;
}
