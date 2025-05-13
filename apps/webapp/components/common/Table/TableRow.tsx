import styled from '@emotion/styled';
import TableRow from '@mui/material/TableRow';

const StyledRow = styled(TableRow)`
  @media (hover: hover) {
    .row-actions {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    &:hover .row-actions {
      opacity: 1;
    }
  }
`;

export default StyledRow;
