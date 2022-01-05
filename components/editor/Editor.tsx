import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  margin: 0 auto;
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
      <Typography variant='h1'>{page.title}</Typography>
    </Container>
    <Container>
      Editor!
    </Container>
  </>);
}