import { Box, Stack } from '@mui/material';
import { Header } from '@packages/scoutgame-ui/components/common/Navigation/Header';
import { StickyFooter } from '@packages/scoutgame-ui/components/common/Navigation/StickyFooter';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Stack height='100vh'>
      <Header />
      <Box
        sx={{
          minHeight: 'calc(100vh - 117.5px)',
          px: 1
        }}
        component='main'
      >
        {children}
      </Box>
      <StickyFooter />
    </Stack>
  );
}
