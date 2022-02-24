import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItemButton, ListItemProps } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji, { EmojiContainer } from 'components/common/Emoji';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import React, { ChangeEvent, ReactNode } from 'react';
import CharmEditor, { ICharmEditorOutput } from './CharmEditor';
import PageBanner, { PageCoverGalleryImageGroups } from './Page/PageBanner';
import PageTitle from './Page/PageTitle';

const Container = styled(Box)<{ top: number }>`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 20px 0 40px;
  position: relative;
  top: ${({ top }) => top}px;
`;

const PageControlItem = styled(ListItemButton)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  opacity: 0.5;
  display: flex;
  padding: ${({ theme }) => theme.spacing(0.75)};
  width: fit-content;
`;

const Controls = styled(Box)`
  position: relative;
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

function randomIntFromInterval (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const EditorHeader = styled.div`
  position: absolute;
  top: 0;
  height: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-end;
  overflow: visible;

  .page-controls {
    height: 36px;
    opacity: 0;
    display: flex;
    gap: 1;
  }

  &:hover .page-controls {
    opacity: 1
  }
`;

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Partial<Page>) => void }) {
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

  let pageTitleTop = 50;
  let bangleEditorTop = 75;
  let pageIconTop = 50;

  let pageTop = 100;
  if (page.icon) {
    pageTop = 130;
  }

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
    setPage({ title: event.target.value });
  }

  function addPageHeader () {
    const headerImage = PageCoverGalleryImageGroups['Color & Gradient'][randomIntFromInterval(0, PageCoverGalleryImageGroups['Color & Gradient'].length - 1)];
    setPage({ headerImage });
  }

  function addPageIcon () {
    const icon = gemojiData[randomIntFromInterval(0, gemojiData.length - 1)].emoji;
    setPage({ icon });
  }

  function updatePageIcon (icon: string) {
    setPage({ icon });
  }

  function updatePageContent (content: ICharmEditorOutput) {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        setIsEditing(false);
      }, 1500);
    }
    setPage({ content: content.doc, contentText: content.rawText });
  }

  return (
    <Box>
      <PageBanner page={page} setPage={setPage} />
      <Container top={pageTop}>

        <CharmEditor
          key={page.id}
          content={page.content as PageContent}
          onPageContentChange={updatePageContent}
        >
          <EditorHeader>
            {page?.icon && (
            <EmojiContainer updatePageIcon={updatePageIcon}>
              <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
            </EmojiContainer>
            )}
            <Controls>
              <Box
                className='page-controls'
              >
                {!page.icon && (
                <PageControlItem onClick={addPageIcon}>
                  <EmojiEmotionsIcon
                    fontSize='small'
                    sx={{ marginRight: 1 }}
                  />
                  Add icon
                </PageControlItem>
                )}
                {!page.headerImage && (
                <PageControlItem onClick={addPageHeader}>
                  <ImageIcon
                    fontSize='small'
                    sx={{ marginRight: 1 }}
                  />
                  Add cover
                </PageControlItem>
                )}
              </Box>
            </Controls>
            <PageTitle
              value={page.title}
              onChange={updateTitle}
            />
          </EditorHeader>
        </CharmEditor>
      </Container>
    </Box>
  );
}
