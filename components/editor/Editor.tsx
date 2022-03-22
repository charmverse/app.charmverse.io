import styled from '@emotion/styled';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { ListItemButton } from '@mui/material';
import Box from '@mui/material/Box';
import { ScrollableWindow } from 'components/common/page-layout/ScrollableWindow';
import { BlockIcons } from 'components/databases/focalboard/src/blockIcons';
import EmojiPicker from 'components/databases/focalboard/src/widgets/emojiPicker';
import DeleteIcon from 'components/databases/focalboard/src/widgets/icons/delete';
import EmojiIcon from 'components/databases/focalboard/src/widgets/icons/emoji';
import Menu from 'components/databases/focalboard/src/widgets/menu';
import MenuWrapper from 'components/databases/focalboard/src/widgets/menuWrapper';
import { randomIntFromInterval } from 'lib/utilities/random';
import { Page, PageContent } from 'models';
import { ChangeEvent } from 'react';
import { useIntl } from 'react-intl';
import emojis from './emoji.json';
import PageIcon from '../common/Emoji';
import CharmEditor, { ICharmEditorOutput } from './CharmEditor';
import PageBanner, { PageCoverGalleryImageGroups } from './Page/PageBanner';
import PageTitle from './Page/PageTitle';

export const Container = styled(Box)<{ top: number }>`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 80px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};
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
    margin-top: ${({ theme }) => theme.spacing(1.5)};
  }

  &:hover .page-controls {
    opacity: 1
  }
`;

export interface IEditorProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean }

export function Editor ({ page, setPage, readOnly = false }: IEditorProps) {

  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  }
  else if (page.icon) {
    pageTop = 200;
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
    const emojiOptions = [...emojis[0]];
    const icon = emojiOptions[randomIntFromInterval(0, emojiOptions.length - 1)];
    setPage({ icon });
  }

  function updatePageIcon (icon: string | null) {
    setPage({ icon });
  }

  const intl = useIntl();

  function updatePageContent (content: ICharmEditorOutput) {
    setPage({ content: content.doc, contentText: content.rawText });
  }

  return (
    <ScrollableWindow>
      {page.headerImage && <PageBanner image={page.headerImage} setImage={updatePageHeader} />}
      <Container
        top={pageTop}
      >
        <CharmEditor
          key={page.id}
          content={page.content as PageContent}
          onPageContentChange={updatePageContent}
          readOnly={readOnly}
        >
          <EditorHeader>
            {page?.icon && (
              <MenuWrapper>
                <PageIcon sx={{ fontSize: 78 }} size='large' icon={page.icon} />
                <Menu>
                  <Menu.Text
                    id='random'
                    icon={<EmojiIcon />}
                    name={intl.formatMessage({ id: 'ViewTitle.random-icon', defaultMessage: 'Random' })}
                    onClick={() => {
                      updatePageIcon(BlockIcons.shared.randomIcon());
                    }}
                  />
                  <Menu.SubMenu
                    id='pick'
                    icon={<EmojiIcon />}
                    name={intl.formatMessage({ id: 'ViewTitle.pick-icon', defaultMessage: 'Pick icon' })}
                  >
                    <EmojiPicker onSelect={(emoji) => {
                      updatePageIcon(emoji);
                    }}
                    />
                  </Menu.SubMenu>
                  <Menu.Text
                    id='remove'
                    icon={<DeleteIcon />}
                    name={intl.formatMessage({ id: 'ViewTitle.remove-icon', defaultMessage: 'Remove icon' })}
                    onClick={() => {
                      updatePageIcon(null);
                    }}
                  />
                </Menu>
              </MenuWrapper>
            )}
            <Controls className='page-controls'>
              {!readOnly && !page.icon && (
                <PageControlItem onClick={addPageIcon}>
                  <EmojiEmotionsIcon
                    fontSize='small'
                    sx={{ marginRight: 1 }}
                  />
                  Add icon
                </PageControlItem>
              )}
              {!readOnly && !page.headerImage && (
                <PageControlItem onClick={addPageHeader}>
                  <ImageIcon
                    fontSize='small'
                    sx={{ marginRight: 1 }}
                  />
                  Add cover
                </PageControlItem>
              )}
            </Controls>
          </EditorHeader>
          <PageTitle
            readOnly={readOnly}
            value={page.title}
            onChange={updateTitle}
          />
        </CharmEditor>
      </Container>
    </ScrollableWindow>
  );
}
