import { CircularProgress, Typography } from '@mui/material';

export interface ILoaderInput {
  message?: string;
}

export default function Loader ({ message }: ILoaderInput) {
  return (
    <div>
      <CircularProgress />
      { message !== undefined && <Typography variant='h2' sx={{ textAlign: 'center' }}>{message}</Typography>}
    </div>
  );
}
