
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import BangleEditor from './BangleEditor';
import Emoji from 'components/common/Emoji';

const Container = styled.div`
  width: 800px;
  max-width: 100%;
  margin: 0 auto 5px;
`;

const Controls = styled.div`
  margin-top: 80px;
  margin-bottom: 4px;
`;

const PageTitle = styled(Typography)`
  cursor: text;
  font-size: 40px;
  font-weight: 700;
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
      <PageTitle>{page.title}</PageTitle>
    </Container>
    <Container>
      <BangleEditor />
    </Container>
  </>);
}