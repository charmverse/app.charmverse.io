import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItemButton } from '@mui/material';
import Box from '@mui/material/Box';
import Emoji, { EmojiContainer } from 'components/common/Emoji';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import { ChangeEvent } from 'react';
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
  padding: 0 ${({ theme }) => theme.spacing(0.75)};
  flex-grow: 0;
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
    min-height: 32px;
    opacity: 0;
    display: flex;
  }

  &:hover .page-controls {
    opacity: 1
  }
`;

export function Editor ({ page, setPage }: { page: Page, setPage: (p: Partial<Page>) => void }) {
  const { isEditing, setIsEditing } = usePages();

  let pageTop = 200;
  if (page.icon) {
    pageTop = 280;
  }
  if (page.headerImage) {
    pageTop = 100;
    if (page.icon) {
      pageTop = 120;
    }
  }

  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ title: event.target.value });
  }

  function addPageHeader () {
    const headerImage = PageCoverGalleryImageGroups['Color & Gradient'][randomIntFromInterval(0, PageCoverGalleryImageGroups['Color & Gradient'].length - 1)];
    setPage({ headerImage });
  }

  function updatePageHeader (headerImage: string | null) {
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
      {page.headerImage && <PageBanner image={page.headerImage} setImage={updatePageHeader} />}
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
            <Controls className='page-controls'>
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
