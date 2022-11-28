import Box from '@mui/material/Box';

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component='main'
      height='100%'
      sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}
    >
      {children}
    </Box>
  );
}
