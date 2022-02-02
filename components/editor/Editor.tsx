import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { ListItem, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji from 'components/common/Emoji';
import { Page } from 'models';
import { ChangeEvent } from 'react';
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
  background: transparent;
  border: 0 none;
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: text;
  font-size: 40px;
  font-weight: 700;
  outline: none;
`;

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {
  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  const theme = useTheme();

  return (
    <Container>
      <Controls>
        {!page.icon && (
        <ListItem
          button
          disableRipple
          sx={{
            borderRadius: theme.spacing(0.5),
            opacity: 0.5,
            display: 'flex',
            gap: 1,
            padding: `${theme.spacing(0.75)}`,
            width: 'fit-content'
          }}
        >
          <EmojiEmotionsIcon fontSize='small' />
          Add Icon
        </ListItem>
        )}
      </Controls>
      <Box py={3}>
        <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
      </Box>
      <PageTitle
        placeholder='Untitled'
        autoFocus
        value={page.title}
        onChange={updateTitle}
      />
      <BangleEditor content={page.content} />
    </Container>
  );
}
