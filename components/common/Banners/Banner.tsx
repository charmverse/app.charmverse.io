import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export const StyledBanner = styled(Box)`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary};
  background-color: var(--bg-blue);
  padding: ${({ theme }) => theme.spacing(1.4)};
`;
