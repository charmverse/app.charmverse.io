import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItem, ListItemProps } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji, { EmojiContainer } from 'components/common/Emoji';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import React, { ChangeEvent, ReactNode } from 'react';
import CharmEditor, { ICharmEditorOutput } from './CharmEditor';
import PageBanner, { PageCoverGalleryImageGroups } from './Page/PageBanner';
import PageTitle from './Page/PageTitle';

const Container = styled(Box)`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 20px 0 40px;
  position: relative;
`;

const StyledListItem = styled(ListItem)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  opacity: 0.5;
  display: flex;
  gap: 1;
  padding: ${({ theme }) => theme.spacing(0.75)};
  width: fit-content;
` as React.FC<{ disableRipple: boolean, button: boolean, children: ReactNode }>;

function PageControlItem (props: { children: ReactNode } & ListItemProps) {
  const { children, ...rest } = props;
  return (
    <StyledListItem {...rest} disableRipple button>
      {children}
    </StyledListItem>
  );
}

const Controls = styled(Box)`
  margin-bottom: 4px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

function randomIntFromInterval (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {
  const { isEditing, setIsEditing } = usePages();

  let pageControlTop = 0;

  if (page.icon && !page.headerImage) {
    pageControlTop = 50;
  }

  if (!page.icon && page.headerImage) {
    pageControlTop = 10;
  }

  if (page.icon && page.headerImage) {
    pageControlTop = 50;
  }

  let pageTitleTop = 50; let bangleEditorTop = 75; let
    pageIconTop = 50;

  if (page) {
    if (page.icon && !page.headerImage) {
      pageTitleTop = 100;
      bangleEditorTop = 125;
      pageIconTop = -75;
    }

    if (!page.icon && page.headerImage) {
      pageTitleTop = 50;
    }

    if (page.icon && page.headerImage) {
      pageTitleTop = 50;
      bangleEditorTop = 125;
      pageIconTop = -60;
    }
  }

  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  function updatePageIcon (icon: string) {
    setPage({ ...page, icon });
  }

  function updatePageContent (content: ICharmEditorOutput) {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        setIsEditing(false);
      }, 1500);
    }
    setPage({ ...page, content: content.doc, contentText: content.rawText });
  }

  return (
    <Box>
      <PageBanner page={page} setPage={setPage} />
      <Container>
        <Controls sx={{
          position: 'relative',
          top: pageControlTop
        }}
        >
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
            <PageControlItem
              onClick={() => {
                // Charmverse logo
                setPage({ ...page, headerImage: PageCoverGalleryImageGroups['Color & Gradient'][randomIntFromInterval(0, PageCoverGalleryImageGroups['Color & Gradient'].length - 1)] });
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

        <CharmEditor
          style={{
            top: bangleEditorTop
          }}
          content={page.content as PageContent}
          onPageContentChange={updatePageContent}
        >
          <>
            {page?.icon && (
            <EmojiContainer top={pageIconTop} updatePageIcon={updatePageIcon}>
              <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
            </EmojiContainer>
            )}
            {page && (
            <Box sx={{
              position: 'absolute',
              top: pageTitleTop
            }}
            >
              <PageTitle
                value={page.title}
                onChange={updateTitle}
              />
            </Box>
            )}
          </>
        </CharmEditor>
      </Container>
    </Box>
  );
}
