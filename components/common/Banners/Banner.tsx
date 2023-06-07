import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export const StyledBanner = styled(Box)<{ errorBackground?: boolean }>`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary};
  background-color: ${({ errorBackground, theme }) => (!errorBackground ? `var(--bg-blue)` : theme.palette.error.main)};
  padding: ${({ theme }) => theme.spacing(1.4)};
  position: sticky;
  align-items: center;
`;
