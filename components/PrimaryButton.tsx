
import MuiButton from '@mui/material/Button';
import styled from '@emotion/styled';
import { darken } from '@mui/system';
import Button, { InputProps, StyledSpinner } from './Button';
import { blueColor } from '../theme/colors';

const StyledButton = styled(Button)`

  background: ${blueColor};
  border: 0 none;
  color: white;
  font-weight: bold;
  padding: .5em 2em;
  white-space: nowrap;

  span {
    font-size: .85em;
  }

  &:hover {
    background: ${blueColor};
    color: white;
    border: 0 none;
    box-shadow: 1px 2px 3px #444;
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