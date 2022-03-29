import TableRow from '@mui/material/TableRow';
import styled from '@emotion/styled';

const StyledRow = styled(TableRow)`
  .row-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  &:hover .row-actions {
    opacity: 1;
  }
`;

export default StyledRow;
