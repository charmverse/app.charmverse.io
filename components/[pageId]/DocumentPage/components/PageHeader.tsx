import type { Page } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import { ClickAwayListener, ListItemButton, Menu, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { memo, useCallback, useState } from 'react';

import { BlockIcons } from 'components/common/BoardEditor/focalboard/src/blockIcons';
import { randomEmojiList } from 'components/common/BoardEditor/focalboard/src/emojiList';
import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import EmojiIcon from 'components/common/Emoji';
import { randomIntFromInterval } from 'lib/utilities/random';

import { randomBannerImage } from './PageBanner';
import { PageTitleInput } from './PageTitleInput';

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
    opacity: 1;
  }
`;

type PageHeaderValues = Partial<Pick<Page, 'title' | 'icon' | 'headerImage' | 'updatedAt'>>;

type PageHeaderProps = {
  headerImage: string | null;
  icon: string | null;
  readOnly: boolean;
  title: string;
  setPage: (p: PageHeaderValues) => void;
  updatedAt: string;
  readOnlyTitle?: boolean;
};

function PageHeader({ headerImage, icon, readOnly, setPage, title, updatedAt, readOnlyTitle }: PageHeaderProps) {
  function addPageIcon() {
    const _icon = randomEmojiList[randomIntFromInterval(0, randomEmojiList.length - 1)];
    setPage({ icon: _icon });
  }
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

  function updatePageIcon(_icon: string | null) {
    setPage({ icon: _icon });
  }

  function updateTitle(page: { title: string; updatedAt: any }) {
    setPage(page);
  }

  function addPageHeader() {
    setPage({ headerImage: randomBannerImage() });
  }

  return (
    <>
      <EditorHeader className='font-family-default'>
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
                    updatePageIcon(BlockIcons.shared.randomIcon());
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
                    updatePageIcon(null);
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
                updatePageIcon(emoji);
              }}
            />
          </Menu>
        )}
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
        </Controls>
      </EditorHeader>
      <PageTitleInput readOnly={readOnly || readOnlyTitle} value={title} onChange={updateTitle} updatedAt={updatedAt} />
    </>
  );
}
export function getPageTop({ headerImage, icon }: Pick<Page, 'headerImage' | 'icon'>) {
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
