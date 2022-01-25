import Box from '@mui/material/Box';

export default function TabPanel ({ children }: { children: React.ReactNode }) {
  return (
    <Box p={3}>
      {children}
    </Box>
  );
}