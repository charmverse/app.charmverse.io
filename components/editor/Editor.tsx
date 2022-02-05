import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItem, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji from 'components/common/Emoji';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { Page } from 'models';
import React, { ChangeEvent, ReactNode } from 'react';
import BangleEditor from './BangleEditor';
import ImageSelector from './ImageSelector';
import { ImageSelectorGallery } from './ImageSelectorGallery';

const PageCoverGalleryImageGroups = {
  'Color & Gradient': [
    'patterns/notion/gradients_2.png',
    'patterns/notion/gradients_3.png',
    'patterns/notion/gradients_4.png',
    'patterns/notion/gradients_5.png',
    'patterns/notion/gradients_8.png',
    'patterns/notion/gradients_10.jpg',
    'patterns/notion/gradients_11.jpg',
    'patterns/notion/solid_beige.png',
    'patterns/notion/solid_blue.png',
    'patterns/notion/solid_red.png',
    'patterns/notion/solid_yellow.png'
  ]
};

const Container = styled.div`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 20px 0 40px;
  position: relative;
  top: -100px;
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
  height: 200px;
  position: relative;

  img {
    width: 100%;
    object-fit: cover;
    height: 100%;
  }

  .page-cover-controls {
    visibility: hidden;
    position: absolute;
    bottom: 0px;
    right: 25px
  }

  &:hover .page-cover-controls {
    visibility: inherit;
  }
`;

function randomIntFromInterval (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {
  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  const theme = useTheme();

  return (
    <Box>
      <PageBanner>
        {page.headerImage
        && (
        <>
          {/* eslint-disable-next-line */}
          <img src={page.headerImage} alt='Page Banner' />
          <Box
            sx={{
              background: theme.palette.background.light,
              borderRadius: theme.spacing(0.5),
              display: 'flex',
              gap: theme.spacing(0.25),
              boxShadow: theme.shadows[2]
            }}
            className='page-cover-controls'
          >
            <ImageSelector
              tabs={[[
                'Gallery',
                <ImageSelectorGallery
                  onImageClick={(imageSrc) => {
                    setPage({ ...page, headerImage: `/images/${imageSrc}` });
                  }}
                  items={PageCoverGalleryImageGroups}
                />
              ]]}
              onImageSelect={(imageSrc) => {
                setPage({ ...page, headerImage: imageSrc });
              }}
            >
              <ListItem
                button
                disableRipple
                sx={{
                  background: theme.palette.background.dark,
                  borderTopLeftRadius: theme.spacing(0.5),
                  borderBottomLeftRadius: theme.spacing(0.5),
                  padding: theme.spacing(0.5, 1.5)
                }}
              >
                <Typography variant='subtitle1'>
                  Change Cover
                </Typography>
              </ListItem>
            </ImageSelector>
            <ListItem
              button
              disableRipple
              sx={{
                background: theme.palette.background.dark,
                borderTopRightRadius: theme.spacing(0.5),
                borderBottomRightRadius: theme.spacing(0.5),
                padding: theme.spacing(0.5, 1.5)
              }}
            >
              <Typography
                variant='subtitle1'
                onClick={() => {
                  setPage({ ...page, headerImage: undefined });
                }}
              >
                Remove
              </Typography>
            </ListItem>
          </Box>
        </>
        )}
      </PageBanner>
      <Container>
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
    </Box>
  );
}
