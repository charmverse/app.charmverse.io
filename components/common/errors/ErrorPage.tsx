import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Bolt from 'public/images/lightning_bolt.svg';

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledBolt = styled(Bolt)`
  margin: 0 auto;
  position: relative;
  left: -15px;
`;

const Text = styled(Typography)`
  font-size: 24px;
  font-weight: 700;
`;

export default function ErrorPage ({ message = 'Sorry! there was an error' }: { message?: string }) {
  return (
    <Container>
      <Box sx={{ textAlign: 'center' }}>
        <StyledBolt />
        <Text sx={{ mt: 3 }}>
          {message}
        </Text>
      </Box>
    </Container>
  );
}
