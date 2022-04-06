import styled from '@emotion/styled';
import { ListItemButton } from '@mui/material';
import Box from '@mui/material/Box';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import { BlockIcons } from 'components/common/BoardEditor/focalboard/src/blockIcons';
import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import DeleteIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/delete';
import EmojiIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/emoji';
import Menu from 'components/common/BoardEditor/focalboard/src/widgets/menu';
import MenuWrapper from 'components/common/BoardEditor/focalboard/src/widgets/menuWrapper';
import { randomEmojiList } from 'components/common/BoardEditor/focalboard/src/emojiList';
import { randomIntFromInterval } from 'lib/utilities/random';
import { Page } from 'models';
import { ChangeEvent, memo } from 'react';
import { useIntl } from 'react-intl';
import PageIcon from 'components/common/Emoji';
import { randomBannerImage } from './PageBanner';
import PageTitle from './PageTitle';

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

interface PageHeaderProps {
  headerImage: string | null,
  icon: string | null;
  readOnly: boolean;
  title: string;
  setPage: (p: Partial<Page>) => void;
}

function PageHeader ({ headerImage, icon, readOnly, setPage, title }: PageHeaderProps) {
  const intl = useIntl();

  function addPageIcon () {
    const _icon = randomEmojiList[randomIntFromInterval(0, randomEmojiList.length - 1)];
    setPage({ icon: _icon });
  }

  function updatePageIcon (_icon: string | null) {
    setPage({ icon: _icon });
  }

  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ title: event.target.value });
  }

  function addPageHeader () {
    setPage({ headerImage: randomBannerImage() });
  }

  return (
    <>
      <EditorHeader>
        {icon && (
        <MenuWrapper>
          <PageIcon size='large' icon={icon} />
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
          {!readOnly && !icon && (
          <PageControlItem onClick={addPageIcon}>
            <EmojiEmotionsIcon
              fontSize='small'
              sx={{ marginRight: 1 }}
            />
            Add icon
          </PageControlItem>
          )}
          {!readOnly && !headerImage && (
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
        value={title}
        onChange={updateTitle}
      />
    </>
  );
}

export default memo(PageHeader);
