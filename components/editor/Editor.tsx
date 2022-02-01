import { ChangeEvent } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Input from '@mui/material/Input';
import Emoji from 'components/common/Emoji';
import { Page } from 'models';
import BangleEditor from './BangleEditor';

const Container = styled.div`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 20px 0 40px;
`;

const Controls = styled.div`
  margin-top: 80px;
  margin-bottom: 4px;
`;

const PageTitle = styled.input`
  border: 0 none;
  cursor: text;
  font-size: 40px;
  font-weight: 700;
  outline: none;
`;

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {

  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  return (
    <Container>
      <Controls />
      <Box py={3}>
        <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
      </Box>
      <PageTitle placeholder='Untitled' autoFocus value={page.title} onChange={updateTitle} />
      <BangleEditor content={page.content} />
    </Container>
  );
}
