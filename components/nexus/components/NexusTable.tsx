import styled from '@emotion/styled';
import Table from '@mui/material/Table';

const StyledTable = styled(Table)`
  & > .MuiTableBody-root {
    .MuiTableRow-root {
      &:hover {
        background-color: rgba(var(--center-channel-color-rgb),.05);
      }
    }
  }
`;

export default StyledTable;
