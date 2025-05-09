import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export const StyledBanner = styled(Box, {
  shouldForwardProp: (prop: string) => prop !== 'errorBackground'
})<{ errorBackground?: boolean }>`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme, errorBackground }) => (errorBackground ? theme.palette.white.main : theme.palette.text.primary)};
  background-color: ${({ errorBackground, theme }) => (errorBackground ? theme.palette.error.main : `var(--bg-blue)`)};
  padding: ${({ theme }) => theme.spacing(1.4)};
  position: sticky;
  align-items: center;
`;
