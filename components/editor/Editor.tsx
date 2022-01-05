import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import BangleEditor from './BangleEditor';

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  margin: 0 auto;
`;

const Controls = styled.div`
  margin-top: 80px;
  margin-bottom:
`;

export function Editor () {

  const page = {
    title: 'Welcome!'
  };

  return (<>
    <Container>
      <Controls>

      </Controls>
      <Typography variant='h1'>{page.title}</Typography>
    </Container>
    <Container>
      <BangleEditor />
    </Container>
  </>);
}