import styled from '@emotion/styled';
import { Box, DialogActions, Divider } from '@mui/material';
import type { ReactNode } from 'react';

const Container = styled(Box)`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    width: 860px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;

export function StickyFooterContainer({ children }: { children: ReactNode }) {
  return (
    <Box display='flex' flexDirection='column'>
      <Divider light />
      <Container className='footer-actions'>
        <DialogActions sx={{ px: 0 }}>{children}</DialogActions>
      </Container>
    </Box>
  );
}
