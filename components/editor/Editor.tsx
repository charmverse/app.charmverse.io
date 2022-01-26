
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import BangleEditor from './BangleEditor';
import Emoji from 'components/common/Emoji';

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  margin: 0 auto 5px;
`;

const Controls = styled.div`
  margin-top: 80px;
  margin-bottom: 4px;
`;

export function Editor () {

  const page = {
    title: 'Welcome!'
  };

  return (<>
    <Container>
      <Controls>

      </Controls>
      <Box py={3}>
        <Emoji sx={{ fontSize: 78 }}>📌</Emoji>
      </Box>
      <Typography variant='h1'>{page.title}</Typography>
    </Container>
    <Container>
      <BangleEditor />
    </Container>
  </>);
}