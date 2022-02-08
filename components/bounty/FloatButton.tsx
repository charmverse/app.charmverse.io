import Button from '@mui/material/Button';
import styled from '@emotion/styled';

const StyledButton = styled(Button)`
  position: absolute;
  bottom: 30px;
  right: 30px;
`;

export default function FloatButton () {
  return <StyledButton>Suggest+</StyledButton>;
}
