import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export const StyledBanner = styled(Box, { shouldForwardProp: (prop: string) => prop !== 'noBg' })<{ noBg?: boolean }>`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary};
  background-color: ${({ noBg }) => (noBg ? 'none' : 'var(--bg-blue)')};
  border: ${({ theme, noBg }) => (noBg ? `2px solid ${theme.palette.text.primary}` : '0')};
  padding: ${({ theme }) => theme.spacing(1.4)};
`;
