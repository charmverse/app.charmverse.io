import type { Page } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import type { ListItemButtonProps } from '@mui/material';
import { ListItemButton, Menu } from '@mui/material';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { randomIntFromInterval } from '@packages/utils/random';
import { memo, useCallback, useState } from 'react';

import { PageParentChip } from 'components/[pageId]/DocumentPage/components/PageParentChip';
import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import { BlockIcons } from 'components/common/DatabaseEditor/blockIcons';
import { randomEmojiList } from 'components/common/DatabaseEditor/emojiList';
import EmojiIcon from 'components/common/Emoji';

import { GithubIssueChip } from './GithubIssueChip';
import { randomBannerImage } from './PageBanner';
import { PageTitleInput } from './PageTitleInput';

export const PageControlItem = styled(ListItemButton)`
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

const EditorHeader = styled.div<{ pageType: 'page' | 'board' }>`
  ${({ pageType }) =>
    pageType === 'page'
      ? `
    position: absolute;
    top: 0;
    height: 0;
  `
      : ''}
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
    opacity: 1;
  }
`;

export type PageHeaderValues = Partial<Pick<Page, 'title' | 'icon' | 'headerImage' | 'updatedAt'>>;

type PageHeaderProps = {
  headerImage: string | null;
  icon: string | null;
  readOnly: boolean;
  title: string;
  setPage: (p: PageHeaderValues) => void;
  updatedAt: string;
  readOnlyTitle?: boolean;
  placeholder?: string;
  parentId?: string | null;
  insideModal?: boolean;
  pageId?: string;
  githubIssueUrl?: string | null;
  focusDocumentEditor: VoidFunction;
};

function PageHeader({
  headerImage,
  icon,
  readOnly,
  setPage,
  title,
  updatedAt,
  readOnlyTitle,
  placeholder,
  parentId,
  insideModal,
  pageId,
  githubIssueUrl,
  focusDocumentEditor
}: PageHeaderProps) {
  function updateTitle(page: { title: string; updatedAt: any }) {
    setPage(page);
  }

  function addPageHeader() {
    setPage({ headerImage: randomBannerImage() });
  }

  return (
    <>
      <PageHeaderControls
        addPageHeader={addPageHeader}
        headerImage={headerImage}
        icon={icon}
        readOnly={readOnly}
        setPage={setPage}
      />
      {parentId && <PageParentChip insideModal={insideModal} pageId={pageId} parentId={parentId} />}
      {githubIssueUrl && <GithubIssueChip githubIssueUrl={githubIssueUrl} />}
      <PageTitleInput
        readOnly={readOnly || readOnlyTitle}
        value={title}
        onChange={updateTitle}
        updatedAt={updatedAt}
        placeholder={placeholder}
        focusDocumentEditor={focusDocumentEditor}
      />
    </>
  );
}

function PageControls({
  headerImage,
  setPage,
  icon,
  readOnly,
  addPageHeader,
  endAdornmentComponent
}: {
  endAdornmentComponent?: React.ReactNode;
  headerImage: string | null;
  setPage: (p: PageHeaderValues) => void;
  icon?: string | null;
  readOnly: boolean;
  addPageHeader: ListItemButtonProps['onClick'];
}) {
  function addPageIcon() {
    const _icon = randomEmojiList[randomIntFromInterval(0, randomEmojiList.length - 1)];
    setPage({ icon: _icon });
  }

  return (
    <Controls className='page-controls'>
      {!readOnly && !icon && (
        <PageControlItem onClick={addPageIcon}>
          <EmojiEmotionsOutlinedIcon fontSize='small' sx={{ marginRight: 1 }} />
          Add icon
        </PageControlItem>
      )}
      {!readOnly && !headerImage && (
        <PageControlItem onClick={addPageHeader}>
          <ImageIcon fontSize='small' sx={{ marginRight: 1 }} />
          Add cover
        </PageControlItem>
      )}
      {endAdornmentComponent}
    </Controls>
  );
}

export function PageHeaderControls({
  headerImage,
  setPage,
  icon,
  readOnly,
  addPageHeader,
  endAdornmentComponent,
  controlsPosition = 'bottom',
  pageType = 'page'
}: {
  controlsPosition?: 'top' | 'bottom';
  endAdornmentComponent?: React.ReactNode;
  headerImage: string | null;
  setPage: (p: PageHeaderValues) => void;
  icon?: string | null;
  readOnly: boolean;
  addPageHeader: ListItemButtonProps['onClick'];
  pageType?: 'page' | 'board';
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<null | HTMLElement>(null);

  const showMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }, []);

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <EditorHeader className='font-family-default' pageType={pageType}>
      {controlsPosition === 'top' ? (
        <PageControls
          addPageHeader={addPageHeader}
          headerImage={headerImage}
          readOnly={readOnly}
          setPage={setPage}
          endAdornmentComponent={endAdornmentComponent}
          icon={icon}
        />
      ) : null}
      {icon && (
        <div>
          <EmojiIcon size='large' icon={icon} onClick={showMenu} />

          {readOnly ? (
            <div />
          ) : (
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <ListItemButton
                dense
                disabled={readOnly}
                onClick={() => {
                  setPage({ icon: BlockIcons.shared.randomIcon() });
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <CasinoOutlinedIcon />
                </ListItemIcon>
                <ListItemText>Random</ListItemText>
              </ListItemButton>

              <ListItemButton
                dense
                disabled={readOnly}
                onClick={(e) => {
                  setSubMenuAnchorEl(e.currentTarget);
                }}
              >
                <ListItemIcon>
                  <EmojiEmotionsOutlinedIcon />
                </ListItemIcon>
                <ListItemText>Pick icon</ListItemText>
                <ArrowDropDownOutlinedIcon sx={{ ml: 3 }} />
              </ListItemButton>

              <ListItemButton
                dense
                disabled={readOnly}
                onClick={() => {
                  setPage({ icon: null });
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <DeleteOutlineOutlinedIcon />
                </ListItemIcon>
                <ListItemText>Remove icon</ListItemText>
              </ListItemButton>
            </Menu>
          )}
        </div>
      )}
      {controlsPosition === 'bottom' ? (
        <PageControls
          addPageHeader={addPageHeader}
          headerImage={headerImage}
          readOnly={readOnly}
          setPage={setPage}
          endAdornmentComponent={endAdornmentComponent}
          icon={icon}
        />
      ) : null}
      {subMenuAnchorEl && (
        <Menu
          anchorEl={subMenuAnchorEl}
          open={Boolean(subMenuAnchorEl)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          onClick={() => {
            setSubMenuAnchorEl(null);
          }}
        >
          <CustomEmojiPicker
            onUpdate={(emoji) => {
              setSubMenuAnchorEl(null);
              closeMenu();
              setPage({ icon: emoji });
            }}
          />
        </Menu>
      )}
    </EditorHeader>
  );
}

export function getPageTop({ headerImage, icon }: Partial<Pick<Page, 'headerImage' | 'icon'>>) {
  let pageTop = 100;
  if (headerImage) {
    pageTop = 50;
    if (icon) {
      pageTop = 80;
    }
  } else if (icon) {
    pageTop = 200;
  }
  return pageTop;
}

export default memo(PageHeader);
