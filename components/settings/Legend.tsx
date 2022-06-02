import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';

const Legend = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
  white-space: nowrap;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(6)};
  ${({ theme }) => `
    ${theme.breakpoints.down('sm')} {
      font-size: 18px;
      padding-bottom: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(1)};
      margin-top: ${theme.spacing(3)};
    }
  `}
`;

export default Legend;
