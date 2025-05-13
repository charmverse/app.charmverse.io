import { CircularProgress, Typography, Box } from '@mui/material';

type Props = {
  progress: number;
  size?: number;
};

export function CircularProgressWithLabel({ progress, size = 38 }: Props) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant='determinate'
        value={100}
        sx={{
          color: (theme) => theme.palette.divider
        }}
        size={size}
        thickness={3}
      />
      <CircularProgress
        sx={{
          position: 'absolute',
          left: 0,
          top: 0
        }}
        variant='determinate'
        value={progress}
        size={size}
        thickness={3}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant='caption' color='secondary'>{`${Math.round(progress)}%`}</Typography>
      </Box>
    </Box>
  );
}
