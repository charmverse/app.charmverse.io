import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const PageEditorContainer = styled(({ fullWidth, top, ...props }: any) => <Box {...props} />)<{
  top: number;
  fullWidth?: boolean;
}>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '860px')};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top || 0}px;
  position: relative;
  top: ${({ top }) => top || 0}px;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;
