
import MuiButton from '@mui/material/Button';
import styled from '@emotion/styled';
import { darken } from '@mui/system';
import Button, { InputProps, StyledSpinner } from './Button';
import { blueColor } from 'theme/colors';

const StyledButton = styled(Button)`

  background: ${blueColor};
  border: 0 none;
  color: white;
  font-weight: bold;
  padding: 10px 30px;
  white-space: nowrap;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 10px 1px;

  span {
    font-size: .85em;
  }

  &:hover {
    background: ${darken(blueColor, .1)};
    color: white;
    border: 0 none;
  }
`;

function PimpedButton<C extends React.ElementType> (props: InputProps<C>)  {
  const { children, loading, loadingMessage, ...rest } = props;
  return (
    <StyledButton disabled={loading} {...rest}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
}

export default PimpedButton;