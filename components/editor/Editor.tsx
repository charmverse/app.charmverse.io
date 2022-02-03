import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItem } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji from 'components/common/Emoji';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { Page } from 'models';
import React, { ChangeEvent, ReactNode } from 'react';
import BangleEditor from './BangleEditor';

const Container = styled.div`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 20px 0 40px;
`;

const StyledListItem = styled(ListItem)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  opacity: 0.5;
  display: flex;
  gap: 1;
  padding: ${({ theme }) => theme.spacing(0.75)};
  width: fit-content;
` as React.FC<{disableRipple: boolean, button: boolean, children: ReactNode}>;

function PageControlItem (props: {children: ReactNode} & React.HTMLAttributes<HTMLDivElement>) {
  const { children, ...rest } = props;
  return (
    <StyledListItem {...rest} disableRipple button>
      {children}
    </StyledListItem>
  );
}

const Controls = styled.div`
  margin-bottom: 4px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
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

const PageBanner = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;

  img {
    width: 100%;
    object-fit: cover;
  }
`;

function randomIntFromInterval (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {
  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  return (
    <Container>
      <PageBanner>
        {/* eslint-disable-next-line */}
        {page.headerImage && <img src={page.headerImage} alt='Page Banner' />}
      </PageBanner>
      {page.icon && (
        <Box py={3}>
          <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
        </Box>
      )}
      <Controls>
        {!page.icon && (
        <PageControlItem onClick={() => {
          setPage({ ...page, icon: gemojiData[randomIntFromInterval(0, gemojiData.length - 1)].emoji });
        }}
        >
          <EmojiEmotionsIcon
            fontSize='small'
            sx={{ marginRight: 1 }}
          />
          Add icon
        </PageControlItem>
        )}
        {!page.headerImage && (
        <PageControlItem onClick={() => {
          // Charmverse logo
          setPage({ ...page, headerImage: 'https://static.wixstatic.com/media/1d6dff_76c31fc4660149aa95a5f619ea6a50a3~mv2.png/v1/fill/w_304,h_58,al_c,q_85,usm_0.66_1.00_0.01/1d6dff_76c31fc4660149aa95a5f619ea6a50a3~mv2.webp' });
        }}
        >
          <ImageIcon
            fontSize='small'
            sx={{ marginRight: 1 }}
          />
          Add cover
        </PageControlItem>
        )}
      </Controls>

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
