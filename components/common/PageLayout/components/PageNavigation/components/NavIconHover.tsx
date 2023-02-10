import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const NavIconHover = styled(Box)`
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
`;
