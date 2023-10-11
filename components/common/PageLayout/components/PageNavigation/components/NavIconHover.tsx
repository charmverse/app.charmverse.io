import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const NavIconHover = styled(Box)`
  border-radius: 4px;
  cursor: pointer;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      background-color: ${({ theme }) => theme.palette.background.light};
    }
  }
`;
