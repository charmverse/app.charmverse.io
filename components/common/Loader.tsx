import { Box, CircularProgress, Typography } from '@mui/material';
import styled from '@emotion/styled';

const Container = styled.div`
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
}

export default function Loader ({ message, size }: ILoaderInput) {
  return (
    <Container>
      <div>
        <CircularProgress size={size} />
        { message !== undefined && <Typography sx={{ textAlign: 'center' }}>{message}</Typography>}
      </div>
    </Container>
  );
}
