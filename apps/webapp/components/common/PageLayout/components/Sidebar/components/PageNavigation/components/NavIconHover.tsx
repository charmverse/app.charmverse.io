import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import { Box } from '@mui/material';

export const NavIconHoverContainer = styled(Box)`
  width: ${({ theme }) => (theme.breakpoints.down('md') ? '30px' : '20px')}
  height: ${({ theme }) => (theme.breakpoints.down('md') ? '30px' : '20px')}
  display: flex;
  alignItems: center;
  justifyContent: center;
  border-radius: 4px;
  cursor: pointer;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      background-color: ${({ theme }) => theme.palette.background.light};
    }
  }
`;

export function NavIconHoverExpand() {
  return (
    <NavIconHoverContainer>
      <ExpandMoreIcon fontSize='large' />
    </NavIconHoverContainer>
  );
}

export function NavIconHoverCollapse() {
  return (
    <NavIconHoverContainer>
      <ChevronRightIcon fontSize='large' />
    </NavIconHoverContainer>
  );
}
