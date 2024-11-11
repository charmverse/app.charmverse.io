import { Paper } from '@mui/material';

export function InfoPageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      sx={{
        zIndex: 2,
        p: 2,
        width: 'calc(100% - 48px)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {children}
    </Paper>
  );
}
