import Box from '@mui/material/Box';
import styled from '@emotion/styled';

export default styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 2px solid #000;
  box-shadow: ${({ theme }) => theme.shadows[15]};
  padding: ${({ theme }) => theme.spacing(4)};
`;