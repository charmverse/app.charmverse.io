import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';

import Bolt from 'public/images/lightning_bolt.svg';

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  text-align: center;
`;

const StyledBolt = styled(Bolt)`
  position: relative;
  left: -20px;
`;

const Text = styled(Typography)`
  font-size: 24px;
  font-weight: 700;
`;

export default function ErrorPage () {
  return (
    <Container>
      <Content>
        <StyledBolt />
        <Text sx={{ mt: 5 }}>
          Sorry! there was an error
        </Text>
      </Content>
    </Container>
  );
}
