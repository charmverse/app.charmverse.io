import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';

const Legend = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
  border-bottom: 1px solid #ccc;
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(6)};
`;

export default Legend;
