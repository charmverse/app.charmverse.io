/* deprecated  use import { Button } from 'components/common/Button'; */

import styled from '@emotion/styled';
import { darken } from '@mui/material/styles';
import { charmBlue as blueColor } from '@root/config/colors';
import type { ElementType } from 'react';

import { Button, StyledSpinner } from 'components/common/Button';

import type { InputProps } from './Button';

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
    font-size: 0.85em;
  }

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      background: ${darken(blueColor, 0.1)};
      color: white;
      border: 0 none;
    }
  }
`;

function DeprecatedButton<C extends ElementType>(props: InputProps<C>) {
  const { children, loading, loadingMessage, disabled, ...rest } = props;

  return (
    <StyledButton {...rest} disabled={loading || disabled}>
      {loading && loadingMessage ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
}

/* deprecated  use import { Button } from 'components/common/Button'; */
export default DeprecatedButton;
