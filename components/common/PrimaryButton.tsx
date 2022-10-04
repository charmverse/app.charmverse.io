import styled from '@emotion/styled';
import { darken } from '@mui/system';
import type { ElementType } from 'react';

import { blueColor } from 'theme/colors';

import type { InputProps } from './Button';
import Button, { StyledSpinner } from './Button';

const StyledButton = styled(Button)`

  background: ${blueColor};
  border: 0 none;
  color: white;
  font-weight: bold;
  padding: 10px 30px;
  white-space: nowrap;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 10px 1px;

  &:disabled {
    box-shadow: none;
  }

  span {
    font-size: .85em;
  }

  &:hover {
    background: ${darken(blueColor, 0.1)};
    color: white;
    border: 0 none;
  }
`;

function PimpedButton<C extends ElementType> (props: InputProps<C>) {
  const { children, loading, loadingMessage, ...rest } = props;
  return (
    <StyledButton disabled={loading} {...rest}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
}

export default PimpedButton;
