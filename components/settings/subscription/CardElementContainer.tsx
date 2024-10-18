import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export const CardElementContainer = styled(Box, {
  shouldForwardProp: (prop: string) => prop !== 'error'
})<{ error: boolean }>`
  padding: ${({ theme }) => theme.spacing(2, 1)};
  border: ${({ theme, error }) => (error ? `1px solid ${theme.palette.error.main}` : '1px solid var(--input-border)')};
  box-shadow:
    0px 1px 1px rgba(0, 0, 0, 0.03),
    0px 3px 6px rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 16px;
  background-color: ${({ theme }) => (theme.palette.mode === 'dark' ? 'var(--input-bg)' : 'transparent')};
  &:hover {
    border: ${({ theme }) => `1px solid ${theme.palette.text.primary}`};
  }
`;
