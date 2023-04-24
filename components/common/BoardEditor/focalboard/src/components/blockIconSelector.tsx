/* eslint-disable no-unused-expressions */
import type { Page } from '@charmverse/core/dist/prisma';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import React from 'react';
import { useIntl } from 'react-intl';

import PageIcon from 'components/common/Emoji';

import { BlockIcons } from '../blockIcons';
import EmojiPicker from '../widgets/emojiPicker';
import Menu from '../widgets/menu';
import MenuWrapper from '../widgets/menuWrapper';

type Props = {
  pageIcon?: string | null;
  readOnly?: boolean;
  setPage: (page: Partial<Page>) => void;
};

const BlockIconSelector = React.memo((props: Props) => {
  const { pageIcon, setPage } = props;
  const intl = useIntl();
  if (!pageIcon) {
    return null;
  }

  const iconElement = <PageIcon size='large' icon={pageIcon} />;

  return (
    <div className='BlockIconSelector'>
      {props.readOnly && iconElement}
      {!props.readOnly && (
        <MenuWrapper>
          {iconElement}
          <Menu>
            <Menu.Text
              id='random'
              icon={<EmojiEmotionsOutlinedIcon />}
              name={intl.formatMessage({ id: 'ViewTitle.random-icon', defaultMessage: 'Random' })}
              onClick={() => {
                const randomIcon = BlockIcons.shared.randomIcon();
                setPage({ icon: randomIcon });
              }}
            />
            <Menu.SubMenu
              id='pick'
              icon={<EmojiEmotionsOutlinedIcon />}
              name={intl.formatMessage({ id: 'ViewTitle.pick-icon', defaultMessage: 'Pick icon' })}
            >
              <EmojiPicker
                onSelect={(emoji) => {
                  // onSelectEmoji(emoji);
                  setPage({ icon: emoji });
                }}
              />
            </Menu.SubMenu>
            <Menu.Text
              id='remove'
              icon={<DeleteOutlineIcon fontSize='small' />}
              name={intl.formatMessage({ id: 'ViewTitle.remove-icon', defaultMessage: 'Remove icon' })}
              onClick={() => {
                setPage({ icon: null });
              }}
            />
          </Menu>
        </MenuWrapper>
      )}
    </div>
  );
});

export default BlockIconSelector;
