import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';

const Container = styled(Box)`
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export interface ILoaderInput {
  message?: string;
  size?: number;
  sx?: any;
  position?: 'left' | 'right';
}

export default function Loader({ message, size, sx, position = 'left' }: ILoaderInput) {
  return (
    <Container sx={sx}>
      <div>
        {position === 'left' && <CircularProgress size={size} />}
        {message !== undefined && <Typography sx={{ textAlign: 'center' }}>{message}</Typography>}
        {position === 'right' && <CircularProgress size={size} />}
      </div>
    </Container>
  );
}
